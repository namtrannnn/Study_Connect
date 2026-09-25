const Post = require("../api/v1/models/post.model");
const { moderatePostContent } = require("../helpers/aiModerator.helper");

/**
 * Hàm thực hiện quét các bài viết chưa được kiểm duyệt (isAudited = false)
 */
async function scanUncheckedPosts() {
  try {
    // 1. Tìm các bài viết active nhưng chưa được audit
    const pendingPosts = await Post.find({
      status: "active",
      isAudited: false,
    }).limit(10); // Mỗi đợt quét tối đa 10 bài để tránh nghẽn

    if (pendingPosts.length === 0) {
      return;
    }

    console.log(`🤖 [Auto-Scanner Bot] Đang rà soát ngầm ${pendingPosts.length} bài viết chưa kiểm duyệt...`);

    for (const post of pendingPosts) {
      // 2. Chạy AI Moderator kiểm tra lại bài viết
      const result = await moderatePostContent({
        text: post.caption || "",
        files: [],
      });

      if (!result.isAllowed) {
        // 3. Nếu vi phạm -> Tự động ẩn bài viết & lưu lý do
        post.status = "hidden";
        post.violationReason = result.reason;
        post.isAudited = true;
        await post.save();

        console.log(
          `❌ [Auto-Scanner Bot] Đã tự động ẨN bài viết [ID: ${post._id}] do vi phạm: "${result.reason}"`
        );
      } else if (result.isAudited) {
        // 4. Nếu AI xác nhận an toàn -> Đánh dấu đã audit thành công
        post.isAudited = true;
        await post.save();

        console.log(`✅ [Auto-Scanner Bot] Bài viết [ID: ${post._id}] được xác nhận AN TOÀN.`);
      }
    }
  } catch (error) {
    console.error("❌ [Auto-Scanner Bot Error]:", error.message);
  }
}

/**
 * Khởi chạy Cron / Interval ngầm định kỳ (mặc định mỗi 2 phút quét 1 lần)
 */
function startAutoScanner(intervalMs = 2 * 60 * 1000) {
  console.log("🚀 [Auto-Scanner Service] Đã kích hoạt Bot tự động quét bài viết ngầm (Background Worker).");
  
  // Chạy ngay lần đầu
  scanUncheckedPosts();

  // Đặt lịch chạy lặp lại định kỳ
  setInterval(scanUncheckedPosts, intervalMs);
}

module.exports = {
  scanUncheckedPosts,
  startAutoScanner,
};
