const Post = require("../../api/v1/models/post.model");
const ModerationLog = require("../../api/v1/models/moderationLog.model");

/**
 * TẦNG 4: HUMAN MODERATION SERVICE (Giao diện Admin Duyệt tay)
 */

/**
 * Lấy danh sách các bài viết đang chờ Admin duyệt tay (status = 'pending_admin')
 * Kèm theo dữ liệu AI Moderation Log mới nhất để Admin xem lý do & thang điểm rủi ro.
 */
async function getPendingAdminPosts({ page = 1, limit = 10, status = "pending" } = {}) {
  const skip = (page - 1) * limit;

  let filter = { status: "pending_admin" };
  if (status === "rejected") {
    filter = { $or: [{ moderationStatus: "rejected" }, { status: "hidden" }] };
  } else if (status === "approved") {
    filter = { moderationStatus: "approved" };
  } else if (status === "all") {
    filter = { $or: [{ isAudited: true }, { status: { $in: ["pending_admin", "hidden"] } }] };
  }

  const [posts, total, pendingCount, rejectedCount, approvedCount] = await Promise.all([
    Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "fullName username avatar isVerified"),
    Post.countDocuments(filter),
    Post.countDocuments({ status: "pending_admin" }),
    Post.countDocuments({ $or: [{ moderationStatus: "rejected" }, { status: "hidden" }] }),
    Post.countDocuments({ moderationStatus: "approved" }),
  ]);

  // Lấy ModerationLog tương ứng với từng bài để FE có dữ liệu AI chi tiết
  const postIds = posts.map((p) => p._id);
  const logs = await ModerationLog.find({ postId: { $in: postIds } })
    .sort({ createdAt: -1 })
    .lean();

  const postsWithLog = posts.map((post) => {
    const postObj = post.toObject();
    const log = logs.find((l) => l.postId.toString() === post._id.toString());
    postObj.aiLog = log || null;
    return postObj;
  });

  return {
    posts: postsWithLog,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    counts: {
      pending: pendingCount,
      rejected: rejectedCount,
      approved: approvedCount,
      all: pendingCount + rejectedCount + approvedCount,
    },
  };
}

/**
 * Admin bấm nút CHẤP NHẬN BÀI VIẾT (Approve)
 */
async function approvePostByAdmin(postId, adminId = null) {
  const post = await Post.findById(postId);
  if (!post) {
    throw new Error("Không tìm thấy bài viết");
  }

  const previousStatus = post.status;
  post.status = "active";
  post.moderationStatus = "approved";
  post.moderationSource = "human";
  post.isAudited = true;
  post.violationReason = "";
  await post.save();

  // Ghi nhận Audit Trail cho quyết định duyệt của Admin
  try {
    await ModerationLog.create({
      requestId: post.requestId || "admin_manual_review",
      moderationRunId: `admin_approve_${Date.now()}`,
      contentVersion: post.contentVersion || 1,
      postId: post._id,
      userId: post.author,
      action: "approve",
      source: "human",
      reasonCode: "HUMAN_APPROVED",
      reason: "Quản trị viên đã xem xét và phê duyệt bài viết",
      stage: "STAGE_4_HUMAN",
      previousStatus,
      newStatus: "active",
    });
  } catch (logErr) {
    console.warn("[Admin Approve Log Warning]:", logErr.message);
  }

  // Phát Socket.io realtime cho tác giả & Public Feed
  if (global._io) {
    global._io.to(post.author.toString()).emit("SERVER_POST_MODERATION_RESULT", {
      postId: post._id,
      status: "active",
      moderationStatus: "approved",
      reason: "Bài viết của bạn đã được Quản trị viên phê duyệt.",
    });

    try {
      const fullPost = await Post.findById(post._id)
        .populate("author", "fullName username avatar isVerified")
        .populate("mentions", "fullName username avatar isVerified")
        .populate("allowedUsers", "fullName username avatar isVerified");

      global._io.emit("SERVER_FEED_NEW_POST", { post: fullPost });
    } catch (_) {}
  }

  return post;
}

/**
 * Admin bấm nút TỪ CHỐI / ẨN BÀI VIẾT (Reject)
 */
async function rejectPostByAdmin(postId, reason = "Bị từ chối bởi Quản trị viên", adminId = null) {
  const post = await Post.findById(postId);
  if (!post) {
    throw new Error("Không tìm thấy bài viết");
  }

  const previousStatus = post.status;
  post.status = "hidden";
  post.moderationStatus = "rejected";
  post.moderationSource = "human";
  post.isAudited = true;
  post.violationReason = reason;
  await post.save();

  // Ghi nhận Audit Trail cho quyết định từ chối của Admin
  try {
    await ModerationLog.create({
      requestId: post.requestId || "admin_manual_review",
      moderationRunId: `admin_reject_${Date.now()}`,
      contentVersion: post.contentVersion || 1,
      postId: post._id,
      userId: post.author,
      action: "reject",
      source: "human",
      reasonCode: "HUMAN_REJECTED",
      reason,
      stage: "STAGE_4_HUMAN",
      previousStatus,
      newStatus: "hidden",
    });
  } catch (logErr) {
    console.warn("[Admin Reject Log Warning]:", logErr.message);
  }

  // Phát Socket.io realtime thông báo cho tác giả
  if (global._io) {
    global._io.to(post.author.toString()).emit("SERVER_POST_MODERATION_RESULT", {
      postId: post._id,
      status: "hidden",
      moderationStatus: "rejected",
      reason,
    });
  }

  return post;
}

module.exports = {
  getPendingAdminPosts,
  approvePostByAdmin,
  rejectPostByAdmin,
};
