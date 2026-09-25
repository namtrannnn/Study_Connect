const Post = require("../../api/v1/models/post.model");

/**
 * TẦNG 4: HUMAN MODERATION SERVICE (Giao diện Admin Duyệt tay)
 */

/**
 * Lấy danh sách các bài viết đang chờ Admin duyệt tay (status = 'pending_admin')
 */
async function getPendingAdminPosts({ page = 1, limit = 10 } = {}) {
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    Post.find({ status: "pending_admin" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "fullName username avatar isVerified"),
    Post.countDocuments({ status: "pending_admin" }),
  ]);

  return {
    posts,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Admin bấm nút CHẤP NHẬN BÀI VIẾT (Approve)
 */
async function approvePostByAdmin(postId) {
  const post = await Post.findById(postId);
  if (!post) {
    throw new Error("Không tìm thấy bài viết");
  }

  post.status = "active";
  post.isAudited = true;
  post.violationReason = "";
  await post.save();

  return post;
}

/**
 * Admin bấm nút TỪ CHỐI / ẨN BÀI VIẾT (Reject)
 */
async function rejectPostByAdmin(postId, reason = "Bị từ chối bởi Quản trị viên") {
  const post = await Post.findById(postId);
  if (!post) {
    throw new Error("Không tìm thấy bài viết");
  }

  post.status = "hidden";
  post.isAudited = true;
  post.violationReason = reason;
  await post.save();

  return post;
}

module.exports = {
  getPendingAdminPosts,
  approvePostByAdmin,
  rejectPostByAdmin,
};
