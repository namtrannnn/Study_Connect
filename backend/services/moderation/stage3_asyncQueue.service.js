const crypto = require("crypto");
const Post = require("../../api/v1/models/post.model");
const ModerationLog = require("../../api/v1/models/moderationLog.model");
const { evaluateDeepContextAndRiskScore } = require("./stage3_deepContextAI.service");
const { evaluateFinalDecision } = require("./decisionEngine.service");

// Biến cờ kiểm soát tránh chạy chồng chéo worker
let isWorkerRunning = false;

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
  } catch (error) {
    console.error(`❌ [Tầng 3 Moderation Error] Post ${post._id}:`, error.message);

    // Xử lý Fail-Closed (Blueprint Section 1.8 & 10.9): Tuyệt đối không Active khi lỗi!
    try {
      const freshPost = await Post.findById(post._id);
      if (freshPost && freshPost.status === "processing") {
        // Đẩy vào hàng chờ admin duyệt tay
        freshPost.status = "pending_admin";
        freshPost.moderationStatus = "review";
        freshPost.moderationSource = "system";
        freshPost.violationReason = `Hệ thống gặp sự cố kiểm duyệt (${error.message}). Cần quản trị viên kiểm tra lại.`;
        freshPost.lockedAt = null;
        await freshPost.save();

        await ModerationLog.create({
          requestId,
          moderationRunId,
          contentVersion: freshPost.contentVersion || 1,
          postId: freshPost._id,
          userId: freshPost.author,
          action: "hold",
          source: "system",
          reasonCode: "SYSTEM_FAILURE",
          reason: `Lỗi hệ thống: ${error.message}`,
          stage: "SYSTEM",
          errorCode: error.code || "SYSTEM_ERROR",
          processingTimeMs: Date.now() - startTime,
          previousStatus,
          newStatus: "pending_admin",
        });
      }
    } catch (saveErr) {
      console.error("[Fail-closed Save Error]:", saveErr.message);
    }
  }
}

/**
 * Quét các bài viết đang ở trạng thái 'processing' với MongoDB Atomic Lock
 */
async function processAsyncModerationQueue() {
  if (isWorkerRunning) return;
  isWorkerRunning = true;

  try {
    const lockExpiry = new Date(Date.now() - 5 * 60 * 1000); // 5 phút timeout

    // Lặp bốc từng bài (tối đa 5 bài mỗi lượt để kiểm soát rate limit)
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

      if (!post) break; // Không còn bài nào cần xử lý

      await processSinglePost(post);

      // Throttling: Nghỉ 500ms giữa các request để bảo vệ quota Gemini
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  } catch (error) {
    console.error("❌ [Async Queue Loop Error]:", error.message);
  } finally {
    isWorkerRunning = false;
  }
}

/**
 * Kích hoạt xử lý ngay lập tức cho 1 bài viết vừa tạo (không cần chờ 2 phút)
 */
async function triggerImmediateModeration(postId) {
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
      // Chạy ngầm không block luồng API
      setImmediate(() => {
        processSinglePost(post).catch((err) => {
          console.error(`[Immediate Moderation Error] Post ${postId}:`, err.message);
        });
      });
    }
  } catch (err) {
    console.warn(`[Trigger Immediate Warning] Post ${postId}:`, err.message);
  }
}

/**
 * Khởi chạy Worker định kỳ ngầm
 */
function startStage3Worker(intervalMs = 30 * 1000) {
  console.log("🚀 [Moderation Bot] Đã kích hoạt Worker tự động kiểm duyệt ngầm.");
  processAsyncModerationQueue();
  setInterval(processAsyncModerationQueue, intervalMs);
}

module.exports = {
  processAsyncModerationQueue,
  processSinglePost,
  triggerImmediateModeration,
  startStage3Worker,
};
