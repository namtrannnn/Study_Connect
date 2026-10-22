const crypto = require("crypto");
const Post = require("../../api/v1/models/post.model");
const ModerationLog = require("../../api/v1/models/moderationLog.model");
const { evaluateDeepContextAndRiskScore } = require("./stage3_deepContextAI.service");
const { evaluateFinalDecision } = require("./decisionEngine.service");
const { redisClient } = require("../../config/redis");

// Cấu hình Redis Queue
const REDIS_QUEUE_KEY = "moderation:queue";
const REDIS_RETRY_PREFIX = "moderation:retries:";
const REDIS_PROCESSING_SET = "moderation:processing";
const REDIS_RATE_LIMIT_KEY = "moderation:gemini:rpm";
const MAX_RETRIES = 3;
const GEMINI_MAX_RPM = 15; // Giới hạn tối đa 15 request/phút bảo vệ quota Gemini

// Biến cờ kiểm soát tránh chạy chồng chéo worker
let isWorkerRunning = false;
let isRedisWorkerActive = false;

/**
 * Kiểm tra kết nối Redis sẵn sàng
 */
function isRedisReady() {
  return Boolean(redisClient && redisClient.isOpen);
}

/**
 * Điều tiết nhịp gọi API Gemini (Rate Limiting qua Redis)
 */
async function acquireRateLimitSlot() {
  if (!isRedisReady()) return true;
  try {
    const current = await redisClient.incr(REDIS_RATE_LIMIT_KEY);
    if (current === 1) {
      // Đặt TTL 60 giây
      await redisClient.expire(REDIS_RATE_LIMIT_KEY, 60);
    }
    if (current > GEMINI_MAX_RPM) {
      console.warn(`⏳ [Moderation Redis Rate Limiter] Đạt ngưỡng ${current}/${GEMINI_MAX_RPM} RPM. Đang điều tiết chờ 3.5 giây...`);
      await new Promise((r) => setTimeout(r, 3500));
    }
    return true;
  } catch (err) {
    console.warn("[Rate Limiter Redis Warning]:", err.message);
    return true;
  }
}

/**
 * Xử lý kiểm duyệt cho một bài viết đơn lẻ
 */
async function processSinglePost(post) {
  const startTime = Date.now();
  const requestId = post.requestId || crypto.randomUUID();
  const moderationRunId = `run_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const previousStatus = post.status;

  try {
    const mediaUrls = (post.media || []).map((m) => m.url);
    let textToAnalyze = post.caption || "";
    if (post.question?.title) textToAnalyze += `\n${post.question.title}`;
    if (post.quiz?.title) textToAnalyze += `\n${post.quiz.title}`;

    // 1. Phân tích sâu Tầng 3 bằng Multimodal AI
    const t3Signal = await evaluateDeepContextAndRiskScore({
      text: textToAnalyze,
      mediaUrls,
    });

    // 2. Chuyển tín hiệu vào Decision Engine (Single Source of Truth)
    const decision = evaluateFinalDecision({ t3: t3Signal });

    // 3. Bảo vệ Stale Worker & Optimistic Concurrency Check (Blueprint 10.5 & 10.7)
    const freshPost = await Post.findById(post._id);
    if (!freshPost) return;

    if (freshPost.status === "deleted") {
      await ModerationLog.create({
        requestId,
        moderationRunId,
        contentVersion: post.contentVersion || 1,
        postId: post._id,
        userId: post.author,
        action: "hide",
        source: "system",
        reasonCode: "POST_DELETED",
        reason: "Bài viết đã bị người dùng xóa trong quá trình kiểm duyệt",
        stage: "SYSTEM",
        processingTimeMs: Date.now() - startTime,
        previousStatus: "deleted",
        newStatus: "deleted",
      });
      return;
    }

    if (freshPost.contentVersion !== post.contentVersion) {
      await ModerationLog.create({
        requestId,
        moderationRunId,
        contentVersion: post.contentVersion || 1,
        postId: post._id,
        userId: post.author,
        action: "hide",
        source: "system",
        reasonCode: "STALE_RESULT",
        reason: "Bỏ qua kết quả cũ do người dùng đã chỉnh sửa bài viết sang version mới",
        stage: "SYSTEM",
        processingTimeMs: Date.now() - startTime,
        previousStatus: freshPost.status,
        newStatus: freshPost.status,
      });
      return;
    }

    // 4. Áp dụng quyết định của Decision Engine
    freshPost.status = decision.status;
    freshPost.moderationStatus = decision.moderationStatus;
    freshPost.moderationSource = decision.moderationSource;
    freshPost.violationReason = decision.reason || "";
    freshPost.isAudited = true;
    freshPost.activeModerationRunId = moderationRunId;
    freshPost.lockedAt = null; // Giải phóng lock
    await freshPost.save();

    // 5. Ghi vết Audit Trail (ModerationLog)
    await ModerationLog.create({
      requestId,
      moderationRunId,
      contentVersion: freshPost.contentVersion || 1,
      postId: freshPost._id,
      userId: freshPost.author,
      action: decision.action,
      source: decision.moderationSource,
      confidence: 1.0 - Math.abs(decision.overallRisk - 0.5) * 2, // Độ tin cậy logic
      overallRisk: decision.overallRisk,
      categories: decision.categories,
      severity: decision.severity,
      reason: decision.reason,
      reasonCode: decision.reasonCode,
      evidence: decision.evidence,
      stage: "DECISION",
      processingTimeMs: Date.now() - startTime,
      previousStatus,
      newStatus: decision.status,
    });

    console.log(`🎯 [Tầng 3 Decision Engine] Post ${freshPost._id} -> Status: ${decision.status.toUpperCase()} (Risk: ${Math.round(decision.overallRisk * 100)}%)`);

    // 6. Phát sự kiện Realtime qua Socket.io (nếu có kết nối)
    if (global._io) {
      // Thông báo riêng cho tác giả bài viết
      global._io.to(freshPost.author.toString()).emit("SERVER_POST_MODERATION_RESULT", {
        postId: freshPost._id,
        status: decision.status,
        moderationStatus: decision.moderationStatus,
        reason: decision.reason,
      });

      // Nếu bài được chấp thuận -> Phát lên bảng tin chung
      if (decision.status === "active") {
        const fullPost = await Post.findById(freshPost._id)
          .populate("author", "fullName username avatar isVerified")
          .populate("mentions", "fullName username avatar isVerified")
          .populate("allowedUsers", "fullName username avatar isVerified");

        global._io.emit("SERVER_FEED_NEW_POST", { post: fullPost });
      }
    }

    // 7. Gửi Thông báo Quả Chuông cho tác giả nếu bài viết bị VI PHẠM / ẨN
    // Bài viết bình thường an toàn được duyệt sẽ tự động lên feed, không gửi thông báo spam chuông
    if (decision.status === "hidden") {
      try {
        const { createNotification } = require("../../api/v1/services/notification.service");
        await createNotification({
          receiver: freshPost.author,
          type: "moderation_rejected",
          title: "Bài viết vi phạm tiêu chuẩn cộng đồng 🚫",
          message: `Bài viết của bạn đã bị ẩn do vi phạm: ${decision.reason || "Nội dung không phù hợp với tiêu chuẩn cộng đồng."}`,
          refId: freshPost._id,
          refType: "post",
        });
      } catch (notifErr) {
        console.warn("[AI Violation Notification Warning]:", notifErr.message);
      }
    }
  } catch (error) {
    // Ném lỗi ra ngoài để luồng hàng đợi xử lý Auto-Retry hoặc Fail-Closed
    throw error;
  }
}

/**
 * Xử lý Fail-Closed an toàn khi lỗi nghiêm trọng hoặc đã hết lượt thử lại
 */
async function handleFailClosedError(postId, error, previousStatus = "processing") {
  console.error(`❌ [Tầng 3 Fail-Closed] Post ${postId}:`, error.message);
  try {
    const freshPost = await Post.findById(postId);
    if (freshPost && freshPost.status === "processing") {
      freshPost.status = "pending_admin";
      freshPost.moderationStatus = "review";
      freshPost.moderationSource = "system";
      freshPost.violationReason = `Hệ thống gặp sự cố kiểm duyệt (${error.message}). Cần quản trị viên kiểm tra lại.`;
      freshPost.lockedAt = null;
      await freshPost.save();

      await ModerationLog.create({
        requestId: freshPost.requestId || crypto.randomUUID(),
        moderationRunId: `run_err_${Date.now()}`,
        contentVersion: freshPost.contentVersion || 1,
        postId: freshPost._id,
        userId: freshPost.author,
        action: "hold",
        source: "system",
        reasonCode: "SYSTEM_FAILURE",
        reason: `Lỗi hệ thống: ${error.message}`,
        stage: "SYSTEM",
        errorCode: error.code || "SYSTEM_ERROR",
        processingTimeMs: 0,
        previousStatus,
        newStatus: "pending_admin",
      });
    }
  } catch (saveErr) {
    console.error("[Fail-closed Save Error]:", saveErr.message);
  }
}

/**
 * Lấy và xử lý bài viết tiếp theo từ hàng đợi Redis (FIFO)
 */
async function processNextRedisJob() {
  if (!isRedisReady()) return;

  try {
    const postIdStr = await redisClient.lPop(REDIS_QUEUE_KEY);
    if (!postIdStr) return;

    // Tránh xử lý đồng thời cùng 1 bài viết
    const isAlreadyProcessing = await redisClient.sIsMember(REDIS_PROCESSING_SET, postIdStr);
    if (isAlreadyProcessing) return;

    await redisClient.sAdd(REDIS_PROCESSING_SET, postIdStr);

    try {
      const post = await Post.findById(postIdStr);
      if (!post || post.status !== "processing") {
        await redisClient.sRem(REDIS_PROCESSING_SET, postIdStr);
        return;
      }

      // Điều tiết giới hạn gọi API
      await acquireRateLimitSlot();

      // Tiến hành phân tích
      await processSinglePost(post);

      // Thành công -> Xóa bộ đếm retry
      await redisClient.del(`${REDIS_RETRY_PREFIX}${postIdStr}`);
    } catch (jobErr) {
      console.warn(`⚠️ [Moderation Error on Job ${postIdStr}]:`, jobErr.message);

      // Kiểm tra lỗi tạm thời do Google quá tải hoặc nghẽn mạng (High Demand / Rate Limit 429)
      const isTransientError =
        jobErr.message?.includes("high demand") ||
        jobErr.message?.includes("429") ||
        jobErr.message?.includes("RESOURCE_EXHAUSTED") ||
        jobErr.message?.includes("UNAVAILABLE") ||
        jobErr.message?.includes("timeout");

      if (isTransientError) {
        const retryCount = await redisClient.incr(`${REDIS_RETRY_PREFIX}${postIdStr}`);
        await redisClient.expire(`${REDIS_RETRY_PREFIX}${postIdStr}`, 600); // 10 phút TTL

        if (retryCount <= MAX_RETRIES) {
          const backoffDelay = retryCount * 2500; // 2.5s, 5s, 7.5s
          console.log(`🔁 [Redis Auto-Retry] Google quá tải. Đang tự động thử lại bài ${postIdStr} (Lần ${retryCount}/${MAX_RETRIES}) sau ${backoffDelay}ms...`);

          setTimeout(async () => {
            try {
              if (isRedisReady()) {
                await redisClient.rPush(REDIS_QUEUE_KEY, postIdStr);
                processNextRedisJob();
              }
            } catch (_) {}
          }, backoffDelay);
          return;
        } else {
          console.warn(`🛑 [Redis Auto-Retry] Đã thử lại ${MAX_RETRIES} lần không thành công. Chuyển sang hàng chờ Admin.`);
        }
      }

      // Hết lượt thử lại hoặc lỗi nghiêm trọng -> Chuyển Fail-Closed sang pending_admin
      await handleFailClosedError(postIdStr, jobErr);
    } finally {
      await redisClient.sRem(REDIS_PROCESSING_SET, postIdStr);
    }

    // Xử lý bài tiếp theo nếu còn bài trong hàng đợi
    setImmediate(processNextRedisJob);
  } catch (err) {
    console.error("[Redis Process Loop Error]:", err.message);
  }
}

/**
 * Kích hoạt xử lý bài viết (Ưu tiên Redis Queue, Fallback sang MongoDB)
 */
async function triggerImmediateModeration(postId) {
  if (!postId) return;
  const postIdStr = String(postId);

  // 1. ƯU TIÊN: Đưa vào hàng đợi Redis (In-Memory 0.1ms)
  if (isRedisReady()) {
    try {
      await redisClient.rPush(REDIS_QUEUE_KEY, postIdStr);
      console.log(`⚡ [Redis Queue] Đã nạp bài viết ${postIdStr} vào hàng đợi Redis.`);
      processNextRedisJob();
      return;
    } catch (err) {
      console.warn(`[Redis Enqueue Warning, fallback to Mongo]:`, err.message);
    }
  }

  // 2. DỰ PHÒNG: Nếu Redis chưa mở -> Chạy qua MongoDB Polling Worker
  try {
    const post = await Post.findOneAndUpdate(
      {
        _id: postId,
        status: "processing",
      },
      {
        $set: { lockedAt: new Date() },
      },
      { new: true }
    );

    if (post) {
      setImmediate(() => {
        processSinglePost(post).catch((err) => {
          handleFailClosedError(postId, err);
        });
      });
    }
  } catch (err) {
    console.warn(`[Trigger Immediate Warning] Post ${postId}:`, err.message);
  }
}

/**
 * Quét an toàn các bài viết 'processing' còn sót qua MongoDB Atomic Lock (Safety Net)
 */
async function processAsyncModerationQueue() {
  if (isWorkerRunning) return;
  isWorkerRunning = true;

  try {
    // Nếu Redis có bài, kích hoạt xử lý Redis trước
    if (isRedisReady()) {
      processNextRedisJob();
    }

    const lockExpiry = new Date(Date.now() - 5 * 60 * 1000); // 5 phút timeout

    // Lặp bốc tối đa 5 bài sót mỗi đợt
    for (let i = 0; i < 5; i++) {
      const post = await Post.findOneAndUpdate(
        {
          status: "processing",
          $or: [{ lockedAt: null }, { lockedAt: { $lt: lockExpiry } }],
        },
        {
          $set: { lockedAt: new Date() },
        },
        { new: true }
      );

      if (!post) break; // Không còn bài nào sót

      try {
        await processSinglePost(post);
      } catch (err) {
        await handleFailClosedError(post._id, err);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  } catch (error) {
    console.error("❌ [Async Queue Safety Loop Error]:", error.message);
  } finally {
    isWorkerRunning = false;
  }
}

/**
 * Khởi chạy Worker định kỳ ngầm
 */
function startStage3Worker(intervalMs = 30 * 1000) {
  console.log("🚀 [Moderation Bot] Đã kích hoạt Worker tự động kiểm duyệt ngầm (Redis Queue + MongoDB Fallback).");

  // Xử lý các job còn lưu trong Redis Queue khi server khởi động
  if (isRedisReady()) {
    processNextRedisJob();
  }

  // Khởi động vòng lặp kiểm tra dự phòng
  processAsyncModerationQueue();
  setInterval(processAsyncModerationQueue, intervalMs);
}

module.exports = {
  processAsyncModerationQueue,
  processSinglePost,
  triggerImmediateModeration,
  startStage3Worker,
  isRedisReady,
};
