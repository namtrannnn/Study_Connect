const Post = require("../../api/v1/models/post.model");
const ModerationLog = require("../../api/v1/models/moderationLog.model");

/**
 * TẦNG 4: HUMAN MODERATION SERVICE (Giao diện Admin Duyệt tay & Kháng cáo)
 */

/**
 * Lấy danh sách các bài viết theo bộ lọc kiểm duyệt
 */
async function getPendingAdminPosts({ page = 1, limit = 10, status = "pending" } = {}) {
  const skip = (page - 1) * limit;

  let filter = { status: "pending_admin" };
  if (status === "appeals") {
    filter = { isAppealed: true, appealStatus: "pending" };
  } else if (status === "rejected") {
    filter = { $or: [{ moderationStatus: "rejected" }, { status: "hidden" }] };
  } else if (status === "approved") {
    filter = { moderationStatus: "approved" };
  } else if (status === "all") {
    filter = { $or: [{ isAudited: true }, { status: { $in: ["pending_admin", "hidden"] } }] };
  }

  const [posts, total, pendingCount, rejectedCount, approvedCount, appealsCount] = await Promise.all([
    Post.find(filter)
      .sort({ appealedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "fullName username avatar isVerified"),
    Post.countDocuments(filter),
    Post.countDocuments({ status: "pending_admin" }),
    Post.countDocuments({ $or: [{ moderationStatus: "rejected" }, { status: "hidden" }] }),
    Post.countDocuments({ moderationStatus: "approved" }),
    Post.countDocuments({ isAppealed: true, appealStatus: "pending" }),
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
      appeals: appealsCount,
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
  if (post.appealStatus === "pending") {
    post.appealStatus = "approved";
    post.appealResolvedAt = new Date();
    post.appealResolvedBy = adminId;
  }
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

  // Gửi thông báo đến Quả Chuông cho tác giả
  try {
    const { createNotification } = require("../../api/v1/services/notification.service");
    await createNotification({
      receiver: post.author,
      sender: adminId || post.author,
      type: "moderation_approved",
      title: "Bài viết đã được duyệt ✅",
      message: "Quản trị viên đã xem xét và phê duyệt bài viết của bạn lên Bảng tin.",
      refId: post._id,
      refType: "post",
    });
  } catch (notifErr) {
    console.warn("[Admin Approve Notification Warning]:", notifErr.message);
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
  if (post.appealStatus === "pending") {
    post.appealStatus = "rejected";
    post.appealResolvedAt = new Date();
    post.appealResolvedBy = adminId;
  }
  await post.save();

  // Ghi nhận Audit Trail cho quyết định từ chối của Admin
  try {
    await ModerationLog.create({
      requestId: post.requestId || "admin_manual_review",
      moderationRunId: `admin_reject_${Date.now()}`,
      contentVersion: post.contentVersion || 1,
      postId: post._id,
      userId: post.author,
      action: "hide",
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

  // Gửi thông báo đến Quả Chuông cho tác giả
  try {
    const { createNotification } = require("../../api/v1/services/notification.service");
    await createNotification({
      receiver: post.author,
      sender: adminId || post.author,
      type: "moderation_rejected",
      title: "Bài viết bị từ chối 🚫",
      message: `Bài viết của bạn đã bị Quản trị viên từ chối: ${reason}`,
      refId: post._id,
      refType: "post",
    });
  } catch (notifErr) {
    console.warn("[Admin Reject Notification Warning]:", notifErr.message);
  }

  // Phát Socket.io realtime cho tác giả bài viết
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

/**
 * Tác giả gửi đơn KHIẾU NẠI bài viết (Appeal System - Blueprint Section 14)
 */
async function submitPostAppeal(postId, userId, reason) {
  const post = await Post.findById(postId);
  if (!post) {
    throw new Error("Không tìm thấy bài viết");
  }
  if (post.author.toString() !== userId.toString()) {
    throw new Error("Bạn không có quyền khiếu nại bài viết này");
  }
  if (post.status !== "hidden" && post.moderationStatus !== "rejected") {
    throw new Error("Chỉ có thể khiếu nại các bài viết bị ẩn hoặc vi phạm");
  }
  if (post.appealStatus === "pending") {
    throw new Error("Bài viết này đang có một đơn khiếu nại chờ xét duyệt");
  }

  post.isAppealed = true;
  post.appealReason = reason || "Tác giả yêu cầu xem xét lại quyết định vi phạm.";
  post.appealStatus = "pending";
  post.appealedAt = new Date();
  await post.save();

  // Ghi nhận Audit Trail
  try {
    await ModerationLog.create({
      requestId: post.requestId || "user_appeal",
      moderationRunId: `appeal_${Date.now()}`,
      contentVersion: post.contentVersion || 1,
      postId: post._id,
      userId: post.author,
      action: "hold",
      source: "human",
      reasonCode: "USER_APPEAL_SUBMITTED",
      reason: `Người dùng gửi đơn khiếu nại: ${post.appealReason}`,
      stage: "STAGE_4_HUMAN",
      previousStatus: post.status,
      newStatus: post.status,
    });
  } catch (_) {}

  return post;
}

/**
 * Admin XỬ LÝ ĐƠN KHIẾU NẠI (Chấp thuận hoặc Bác bỏ)
 */
async function resolvePostAppeal(postId, action, note = "", adminId = null) {
  const post = await Post.findById(postId);
  if (!post) {
    throw new Error("Không tìm thấy bài viết");
  }
  if (!post.isAppealed || post.appealStatus !== "pending") {
    throw new Error("Bài viết không có đơn khiếu nại chờ xử lý");
  }

  const { createNotification } = require("../../api/v1/services/notification.service");

  if (action === "approve") {
    // Chấp nhận khiếu nại -> Khôi phục bài viết về active
    post.status = "active";
    post.moderationStatus = "approved";
    post.appealStatus = "approved";
    post.appealResolvedAt = new Date();
    post.appealResolvedBy = adminId;
    post.appealResolutionNote = note || "Quản trị viên đã chấp thuận đơn khiếu nại.";
    post.violationReason = "";
    await post.save();

    try {
      await ModerationLog.create({
        requestId: post.requestId || "appeal_approved",
        moderationRunId: `appeal_resolve_${Date.now()}`,
        contentVersion: post.contentVersion || 1,
        postId: post._id,
        userId: post.author,
        action: "approve",
        source: "human",
        reasonCode: "APPEAL_APPROVED",
        reason: `Khiếu nại được chấp thuận: ${note}`,
        stage: "STAGE_4_HUMAN",
        previousStatus: "hidden",
        newStatus: "active",
      });
    } catch (_) {}

    try {
      await createNotification({
        receiver: post.author,
        sender: adminId || post.author,
        type: "appeal_approved",
        title: "Khiếu nại được chấp thuận 🎉",
        message: "Quản trị viên đã xem xét và khôi phục bài viết của bạn lên Bảng tin.",
        refId: post._id,
        refType: "post",
      });
    } catch (_) {}

    if (global._io) {
      global._io.to(post.author.toString()).emit("SERVER_POST_MODERATION_RESULT", {
        postId: post._id,
        status: "active",
        moderationStatus: "approved",
        reason: "Bài viết đã được khôi phục sau khiếu nại.",
      });

      try {
        const fullPost = await Post.findById(post._id)
          .populate("author", "fullName username avatar isVerified")
          .populate("mentions", "fullName username avatar isVerified")
          .populate("allowedUsers", "fullName username avatar isVerified");
        global._io.emit("SERVER_FEED_NEW_POST", { post: fullPost });
      } catch (_) {}
    }
  } else {
    // Bác bỏ khiếu nại -> Giữ nguyên trạng thái hidden
    post.appealStatus = "rejected";
    post.appealResolvedAt = new Date();
    post.appealResolvedBy = adminId;
    post.appealResolutionNote = note || "Quản trị viên đã bác bỏ khiếu nại.";
    await post.save();

    try {
      await ModerationLog.create({
        requestId: post.requestId || "appeal_rejected",
        moderationRunId: `appeal_resolve_${Date.now()}`,
        contentVersion: post.contentVersion || 1,
        postId: post._id,
        userId: post.author,
        action: "reject",
        source: "human",
        reasonCode: "APPEAL_REJECTED",
        reason: `Khiếu nại bị từ chối: ${note}`,
        stage: "STAGE_4_HUMAN",
        previousStatus: "hidden",
        newStatus: "hidden",
      });
    } catch (_) {}

    try {
      await createNotification({
        receiver: post.author,
        sender: adminId || post.author,
        type: "appeal_rejected",
        title: "Khiếu nại bị từ chối ❌",
        message: `Đơn khiếu nại bài viết của bạn đã bị Quản trị viên từ chối: ${note || "Bài viết vẫn vi phạm tiêu chuẩn cộng đồng."}`,
        refId: post._id,
        refType: "post",
      });
    } catch (_) {}
  }

  return post;
}

module.exports = {
  getPendingAdminPosts,
  approvePostByAdmin,
  rejectPostByAdmin,
  submitPostAppeal,
  resolvePostAppeal,
};
