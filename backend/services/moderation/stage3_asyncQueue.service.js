const Post = require("../../api/v1/models/post.model");
const { evaluateDeepContextAndRiskScore } = require("./stage3_deepContextAI.service");

/**
 * TẦNG 3: ASYNC QUEUE WORKER (Tiến trình quét ngầm đa phương thức)
 */
async function processAsyncModerationQueue() {
  try {
    // 1. Lấy các bài viết chưa audit (isAudited = false) và không ở trạng thái 'hidden'/'deleted'
    const pendingPosts = await Post.find({
      isAudited: false,
      status: { $in: ["active", "pending_admin"] },
    }).limit(10);

    if (pendingPosts.length === 0) return;

    console.log(`🤖 [Tầng 3 Async Worker] Đang phân tích ngầm ${pendingPosts.length} bài viết...`);

    for (const post of pendingPosts) {
      const mediaUrls = (post.media || []).map((m) => m.url);

      // 2. Chạy Gemini Deep Context Scorer
      const evaluation = await evaluateDeepContextAndRiskScore({
        text: post.caption || "",
        mediaUrls,
      });

      const { riskScore, category, reason } = evaluation;
      console.log(`📊 [Tầng 3 Evaluation] Post ID: ${post._id} | Risk Score: ${riskScore}% | Category: ${category}`);

      // 3. Phân luồng quyết định theo Thang điểm Rủi ro (Risk Score)
      if (riskScore >= 80) {
        // High Risk (>= 80%) -> Tự động Ẩn bài
        post.status = "hidden";
        post.isAudited = true;
        post.violationReason = `AI Chặn tự động (${riskScore}% vi phạm): ${reason}`;
        await post.save();
        console.log(`❌ [Tầng 3 Worker] Đã TỰ ĐỘNG ẨN Post ID: ${post._id} (${riskScore}% Risk)`);
      } else if (riskScore >= 40 && riskScore < 80) {
        // Gray Zone (40% - 79%) -> Đẩy sang TẦNG 4 (Human Admin Queue)
        post.status = "pending_admin";
        post.isAudited = false;
        post.violationReason = `Nghi vấn ${riskScore}% (${category}): ${reason}`;
        await post.save();
        console.log(`⚠️ [Tầng 3 Worker] Đã đẩy Post ID: ${post._id} sang TẦNG 4 (Admin Moderation Queue)`);
      } else {
        // Low Risk (< 40%) -> Tự động Thông qua
        post.status = "active";
        post.isAudited = true;
        await post.save();
        console.log(`✅ [Tầng 3 Worker] Post ID: ${post._id} AN TOÀN (${riskScore}% Risk)`);
      }
    }
  } catch (error) {
    console.error("❌ [Tầng 3 Worker Error]:", error.message);
  }
}

/**
 * Khởi chạy Worker chạy định kỳ ngầm
 */
function startStage3Worker(intervalMs = 2 * 60 * 1000) {
  console.log("🚀 [Tầng 3 Service] Đã kích hoạt Async Queue Worker (Tầng 3 Processing).");
  processAsyncModerationQueue();
  setInterval(processAsyncModerationQueue, intervalMs);
}

module.exports = {
  processAsyncModerationQueue,
  startStage3Worker,
};
