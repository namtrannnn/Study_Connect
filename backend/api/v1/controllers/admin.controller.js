const User = require("../models/user.model");
const Post = require("../models/post.model");
const RoomChat = require("../models/roomChat.model");
const PostLike = require("../models/postLike.model");
const PostComment = require("../models/postComment.model");
const PostSave = require("../models/postsave.model");
const Report = require("../models/report.model");
const ActivityLog = require("../models/activityLog.model");
const HashtagBlacklist = require("../models/hashtagBlacklist.model");
const { analyzeContentWithAI } = require("../services/aiModeration.service");
const mongoose = require("mongoose");

// Helper to record admin audit log
async function logAdminActivity(adminId, action, targetType, targetId = "", details = "") {
  try {
    await ActivityLog.create({
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: String(targetId),
      details,
    });
  } catch (err) {
    console.error("logAdminActivity error:", err);
  }
}

// 1. [GET] /api/v1/admin/stats - Overview Dashboard
module.exports.getOverviewStats = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      blockedUsers,
      usersToday,
      totalPosts,
      postsToday,
      totalRooms,
      totalLikes,
      totalComments,
      totalSaves,
    ] = await Promise.all([
      User.countDocuments({ deleted: false }),
      User.countDocuments({ deleted: false, status: "active" }),
      User.countDocuments({ deleted: false, status: "blocked" }),
      User.countDocuments({ deleted: false, createdAt: { $gte: startOfToday } }),
      Post.countDocuments({ status: { $ne: "deleted" } }),
      Post.countDocuments({ status: { $ne: "deleted" }, createdAt: { $gte: startOfToday } }),
      RoomChat.countDocuments({ deleted: false }),
      PostLike.countDocuments({}),
      PostComment.countDocuments({ deleted: false }),
      PostSave.countDocuments({}),
    ]);

    // Weekly Growth Data (Last 7 Days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);

      const [userCount, postCount] = await Promise.all([
        User.countDocuments({ deleted: false, createdAt: { $gte: d, $lt: nextD } }),
        Post.countDocuments({ status: { $ne: "deleted" }, createdAt: { $gte: d, $lt: nextD } }),
      ]);

      const label = d.toLocaleDateString("vi-VN", { weekday: "short", day: "numeric", month: "numeric" });
      last7Days.push({ label, users: userCount, posts: postCount });
    }

    // Top Hashtags Extraction
    const allPosts = await Post.find({ status: { $ne: "deleted" } }).select("caption title hashtags").lean();
    const hashtagMap = {};
    allPosts.forEach((p) => {
      const tags = p.hashtags || [];
      const text = (p.title || "") + " " + (p.caption || "");
      const matches = text.match(/#[^\s#]+/g) || [];
      [...tags, ...matches].forEach((rawTag) => {
        const tag = rawTag.replace(/^#/, "").toLowerCase().trim();
        if (tag) hashtagMap[tag] = (hashtagMap[tag] || 0) + 1;
      });
    });

    const trendingHashtags = Object.entries(hashtagMap)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Recent feeds
    const recentUsers = await User.find({ deleted: false })
      .select("_id fullName username avatar role status createdAt")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentPostsRaw = await Post.find({ status: { $ne: "deleted" } })
      .select("_id title caption media author postType status createdAt likesCount commentsCount")
      .populate("author", "_id fullName username avatar")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentPosts = recentPostsRaw.map((p) => ({
      ...p,
      user_id: p.author,
      content: p.caption,
      images: p.media || [],
    }));

    return res.status(200).json({
      code: 200,
      data: {
        stats: {
          totalUsers,
          activeUsers,
          blockedUsers,
          usersToday,
          totalPosts,
          postsToday,
          totalRooms,
          totalInteractions: totalLikes + totalComments + totalSaves,
          totalLikes,
          totalComments,
          totalSaves,
        },
        weeklyTrend: last7Days,
        trendingHashtags,
        recentUsers,
        recentPosts,
      },
    });

  } catch (error) {
    console.error("getOverviewStats error:", error);
    return res.status(500).json({ code: 500, message: "Không thể lấy thống kê tổng quan" });
  }
};

// 2. [GET] /api/v1/admin/users - User Management
module.exports.getUsers = async (req, res) => {
  try {
    const { keyword, status, role, page = 1, limit = 10 } = req.query;
    const find = { deleted: false };

    if (status && status !== "all") find.status = status;
    if (role && role !== "all") find.role = role;

    if (keyword && keyword.trim()) {
      const regex = new RegExp(keyword.trim(), "i");
      find.$or = [{ fullName: regex }, { username: regex }, { email: regex }];
    }

    const currentPage = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (currentPage - 1) * limitNum;

    const total = await User.countDocuments(find);
    const users = await User.find(find)
      .select("_id fullName username email avatar role status following followers createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Populate post count per user
    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const postCount = await Post.countDocuments({ user_id: u._id, deleted: false });
        return { ...u, postCount };
      })
    );

    return res.status(200).json({
      code: 200,
      data: {
        users: usersWithStats,
        pagination: {
          total,
          page: currentPage,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("getUsers error:", error);
    return res.status(500).json({ code: 500, message: "Không thể lấy danh sách người dùng" });
  }
};

// [PATCH] /api/v1/admin/users/:id/status
module.exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "User ID không hợp lệ" });
    if (!["active", "blocked"].includes(status)) return res.status(400).json({ message: "Trạng thái không hợp lệ" });

    const user = await User.findOneAndUpdate({ _id: id, deleted: false }, { $set: { status } }, { new: true });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    await logAdminActivity(
      adminId,
      status === "blocked" ? "ban_user" : "unban_user",
      "user",
      user._id,
      `Đã chuyển trạng thái tài khoản @${user.username} thành ${status}`
    );

    return res.status(200).json({ code: 200, message: `Đã ${status === "blocked" ? "khóa" : "mở khóa"} tài khoản`, data: user });
  } catch (error) {
    console.error("updateUserStatus error:", error);
    return res.status(500).json({ message: "Cập nhật trạng thái thất bại" });
  }
};

// [PATCH] /api/v1/admin/users/:id/role
module.exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const adminId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "User ID không hợp lệ" });
    if (!["user", "admin"].includes(role)) return res.status(400).json({ message: "Vai trò không hợp lệ" });

    const user = await User.findOneAndUpdate({ _id: id, deleted: false }, { $set: { role } }, { new: true });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    await logAdminActivity(adminId, "change_user_role", "user", user._id, `Đổi vai trò người dùng @${user.username} thành ${role}`);

    return res.status(200).json({ code: 200, message: `Đã cập nhật vai trò thành ${role}`, data: user });
  } catch (error) {
    console.error("updateUserRole error:", error);
    return res.status(500).json({ message: "Cập nhật vai trò thất bại" });
  }
};

// [DELETE] /api/v1/admin/users/:id
module.exports.softDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "User ID không hợp lệ" });

    const user = await User.findOneAndUpdate({ _id: id }, { $set: { deleted: true, deletedAt: new Date() } }, { new: true });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    await logAdminActivity(adminId, "soft_delete_user", "user", user._id, `Xóa mềm tài khoản @${user.username}`);

    return res.status(200).json({ code: 200, message: "Đã xóa mềm tài khoản người dùng", data: { id: user._id } });
  } catch (error) {
    console.error("softDeleteUser error:", error);
    return res.status(500).json({ message: "Xóa tài khoản thất bại" });
  }
};

// 3. [GET] /api/v1/admin/posts - Post Management
module.exports.getPosts = async (req, res) => {
  try {
    const { keyword, postType, status, timeRange, sortBy, page = 1, limit = 9 } = req.query;
    const find = { status: { $ne: "deleted" } };

    if (postType && postType !== "all") find.postType = postType;
    if (status && status !== "all") find.status = status;

    if (keyword && keyword.trim()) {
      const regex = new RegExp(keyword.trim(), "i");
      find.$or = [{ title: regex }, { caption: regex }];
    }

    // Time range filter
    if (timeRange && timeRange !== "all") {
      const now = new Date();
      let startDate;
      switch (timeRange) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          break;
      }
      if (startDate) find.createdAt = { $gte: startDate };
    }

    // Sort order
    let sortOption = { createdAt: -1 }; // default: newest first
    if (sortBy === "oldest") sortOption = { createdAt: 1 };
    else if (sortBy === "popular") sortOption = { likesCount: -1, commentsCount: -1, createdAt: -1 };

    const currentPage = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (currentPage - 1) * limitNum;

    const total = await Post.countDocuments(find);
    const postsRaw = await Post.find(find)
      .populate("author", "_id fullName username avatar")
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const posts = postsRaw.map((p) => ({
      ...p,
      user_id: p.author,
      content: p.caption,
      images: p.media || [],
    }));

    return res.status(200).json({
      code: 200,
      data: {
        posts,
        pagination: { total, page: currentPage, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
      },
    });
  } catch (error) {
    console.error("getPosts admin error:", error);
    return res.status(500).json({ message: "Không thể lấy danh sách bài viết" });
  }
};



// [PATCH] /api/v1/admin/posts/:id/status
module.exports.updatePostStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "active" or "hidden"
    const adminId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Post ID không hợp lệ" });

    const post = await Post.findOneAndUpdate({ _id: id }, { $set: { status } }, { new: true });
    if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết" });

    await logAdminActivity(adminId, status === "hidden" ? "hide_post" : "approve_post", "post", post._id, `Chuyển trạng thái bài viết thành ${status}`);

    return res.status(200).json({ code: 200, message: `Đã ${status === "hidden" ? "ẩn" : "hiện"} bài viết`, data: post });
  } catch (error) {
    console.error("updatePostStatus error:", error);
    return res.status(500).json({ message: "Cập nhật bài viết thất bại" });
  }
};

// [DELETE] /api/v1/admin/posts/:id
module.exports.softDeletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Post ID không hợp lệ" });

    const post = await Post.findOneAndUpdate({ _id: id }, { $set: { status: "deleted" } }, { new: true });
    if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết" });

    await logAdminActivity(adminId, "delete_post", "post", post._id, `Xóa vĩnh viễn bài viết khỏi hệ thống`);

    return res.status(200).json({ code: 200, message: "Đã xóa bài viết khỏi hệ thống", data: { id: post._id } });
  } catch (error) {
    console.error("softDeletePost error:", error);
    return res.status(500).json({ message: "Xóa bài viết thất bại" });
  }
};

// [GET] /api/v1/admin/posts/:id/comments
module.exports.getPostCommentsForAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const currentPage = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (currentPage - 1) * limitNum;

    // Fetch root comments for the post
    const find = { post: id, parentComment: null, status: { $ne: "deleted" } };

    const total = await PostComment.countDocuments(find);
    const parentComments = await PostComment.find(find)
      .populate("user", "_id fullName username avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Fetch replies for these parent comments
    const parentIds = parentComments.map((c) => c._id);
    let repliesMap = {};
    if (parentIds.length > 0) {
      const replies = await PostComment.find({
        parentComment: { $in: parentIds },
        status: { $ne: "deleted" },
      })
        .populate("user", "_id fullName username avatar")
        .populate("replyToUser", "_id fullName username")
        .sort({ createdAt: 1 })
        .lean();

      replies.forEach((r) => {
        const pId = String(r.parentComment);
        if (!repliesMap[pId]) repliesMap[pId] = [];
        repliesMap[pId].push(r);
      });
    }

    const comments = parentComments.map((p) => ({
      ...p,
      replies: repliesMap[String(p._id)] || [],
    }));

    return res.status(200).json({
      code: 200,
      data: {
        comments,
        pagination: {
          total,
          page: currentPage,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
          hasMore: currentPage * limitNum < total,
        },
      },
    });
  } catch (error) {
    console.error("getPostCommentsForAdmin error:", error);
    return res.status(500).json({ message: "Không thể lấy danh sách bình luận của bài viết" });
  }
};


// [GET] /api/v1/admin/posts/:id/likes
module.exports.getPostLikesForAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 15 } = req.query;

    const currentPage = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (currentPage - 1) * limitNum;

    const find = { post: id };

    const total = await PostLike.countDocuments(find);
    const likesRaw = await PostLike.find(find)
      .populate("user", "_id fullName username avatar email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    return res.status(200).json({
      code: 200,
      data: {
        likes: likesRaw,
        pagination: {
          total,
          page: currentPage,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
          hasMore: currentPage * limitNum < total,
        },
      },
    });
  } catch (error) {
    console.error("getPostLikesForAdmin error:", error);
    return res.status(500).json({ message: "Không thể lấy danh sách lượt thích của bài viết" });
  }
};


// 4. [GET] /api/v1/admin/comments - Comment Management
module.exports.getComments = async (req, res) => {
  try {
    const { keyword, type, status, timeRange, sortBy, page = 1, limit = 10 } = req.query;
    const find = { status: { $ne: "deleted" } };

    // Status filter
    if (status && status !== "all") find.status = status;

    // Type filter: root comments vs replies
    if (type === "root") find.parentComment = null;
    else if (type === "reply") find.parentComment = { $ne: null };

    // Keyword search
    if (keyword && keyword.trim()) {
      find.content = new RegExp(keyword.trim(), "i");
    }

    // Time range filter
    if (timeRange && timeRange !== "all") {
      const now = new Date();
      let startDate;
      switch (timeRange) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          break;
      }
      if (startDate) find.createdAt = { $gte: startDate };
    }

    // Sort order
    let sortOption = { createdAt: -1 };
    if (sortBy === "oldest") sortOption = { createdAt: 1 };
    else if (sortBy === "popular") sortOption = { likesCount: -1, repliesCount: -1, createdAt: -1 };

    const currentPage = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (currentPage - 1) * limitNum;

    const total = await PostComment.countDocuments(find);
    const commentsRaw = await PostComment.find(find)
      .populate("user", "_id fullName username avatar")
      .populate({
        path: "post",
        populate: { path: "author", select: "_id fullName username avatar" },
      })

      .populate("replyToUser", "_id fullName username")
      .populate({
        path: "parentComment",
        select: "_id content user createdAt",
        populate: { path: "user", select: "_id fullName username avatar" },
      })
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const commentIds = commentsRaw.map((c) => c._id);
    let childRepliesMap = {};
    if (commentIds.length > 0) {
      const childReplies = await PostComment.find({
        parentComment: { $in: commentIds },
        status: { $ne: "deleted" },
      })
        .populate("user", "_id fullName username avatar")
        .populate("replyToUser", "_id fullName username")
        .sort({ createdAt: 1 })
        .lean();

      childReplies.forEach((r) => {
        const pId = String(r.parentComment);
        if (!childRepliesMap[pId]) childRepliesMap[pId] = [];
        childRepliesMap[pId].push(r);
      });
    }

    const comments = commentsRaw.map((c) => {
      const postObj = c.post
        ? {
            ...c.post,
            user_id: c.post.author || c.post.user_id,
            author: c.post.author || c.post.user_id,
            content: c.post.caption || c.post.content || "",
            images: c.post.media || c.post.images || [],
          }
        : null;

      return {
        ...c,
        user_id: c.user,
        post_id: postObj,
        replies: childRepliesMap[String(c._id)] || [],
      };
    });




    return res.status(200).json({
      code: 200,
      data: {
        comments,
        pagination: { total, page: currentPage, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
      },
    });
  } catch (error) {
    console.error("getComments error:", error);
    return res.status(500).json({ message: "Không thể lấy danh sách bình luận" });
  }
};

// [PATCH] /api/v1/admin/comments/:id/status
module.exports.updateCommentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Comment ID không hợp lệ" });
    if (!["active", "hidden"].includes(status)) return res.status(400).json({ message: "Trạng thái không hợp lệ" });

    const comment = await PostComment.findOneAndUpdate({ _id: id }, { $set: { status } }, { new: true });
    if (!comment) return res.status(404).json({ message: "Không tìm thấy bình luận" });

    await logAdminActivity(adminId, status === "hidden" ? "hide_comment" : "unhide_comment", "comment", comment._id, `Chuyển trạng thái bình luận thành ${status}`);

    return res.status(200).json({ code: 200, message: `Đã ${status === "hidden" ? "ẩn" : "hiện"} bình luận`, data: comment });
  } catch (error) {
    console.error("updateCommentStatus error:", error);
    return res.status(500).json({ message: "Cập nhật bình luận thất bại" });
  }
};

// [DELETE] /api/v1/admin/comments/:id
module.exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Comment ID không hợp lệ" });

    const comment = await PostComment.findOneAndUpdate({ _id: id }, { $set: { status: "deleted" } }, { new: true });
    if (!comment) return res.status(404).json({ message: "Không tìm thấy bình luận" });

    await logAdminActivity(adminId, "delete_comment", "comment", comment._id, `Xóa bình luận vi phạm: "${comment.content?.slice(0, 30)}"`);

    return res.status(200).json({ code: 200, message: "Đã xóa bình luận vi phạm", data: { id: comment._id } });
  } catch (error) {
    console.error("deleteComment error:", error);
    return res.status(500).json({ message: "Xóa bình luận thất bại" });
  }
};



// 5. [GET] /api/v1/admin/reports & [POST] AI Analysis & [PATCH] Resolve


module.exports.getReports = async (req, res) => {
  try {
    const { status = "all", page = 1, limit = 10 } = req.query;
    const find = { deleted: false };
    if (status !== "all") find.status = status;

    const currentPage = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (currentPage - 1) * limitNum;

    const total = await Report.countDocuments(find);
    const reports = await Report.find(find)
      .populate("reporter_id", "_id fullName username avatar")
      .populate("resolvedBy", "_id fullName username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Populate target content details (post or comment or user)
    const enrichedReports = await Promise.all(
      reports.map(async (r) => {
        let targetDetails = null;
        if (r.target_type === "post") {
          targetDetails = await Post.findById(r.target_id).populate("user_id", "_id fullName username avatar").lean();
        } else if (r.target_type === "comment") {
          targetDetails = await PostComment.findById(r.target_id).populate("user_id", "_id fullName username avatar").lean();
        } else if (r.target_type === "user") {
          targetDetails = await User.findById(r.target_id).select("_id fullName username avatar email status").lean();
        }
        return { ...r, targetDetails };
      })
    );

    return res.status(200).json({
      code: 200,
      data: {
        reports: enrichedReports,
        pagination: { total, page: currentPage, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
      },
    });
  } catch (error) {
    console.error("getReports error:", error);
    return res.status(500).json({ message: "Không thể lấy danh sách báo cáo" });
  }
};

// [POST] /api/v1/admin/reports/:id/analyze-ai
module.exports.analyzeReportWithAI = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ message: "Không tìm thấy báo cáo" });

    let textToAnalyze = "";
    if (report.target_type === "post") {
      const post = await Post.findById(report.target_id);
      textToAnalyze = post ? `${post.title || ""} ${post.content || ""}` : "";
    } else if (report.target_type === "comment") {
      const comment = await PostComment.findById(report.target_id);
      textToAnalyze = comment ? comment.content : "";
    }

    const aiResult = await analyzeContentWithAI(textToAnalyze, report.reason);

    report.aiAnalysis = {
      ...aiResult,
      analyzedAt: new Date(),
    };
    await report.save();

    return res.status(200).json({
      code: 200,
      message: "Đã phân tích báo cáo bằng Gemini AI thành công",
      data: report.aiAnalysis,
    });
  } catch (error) {
    console.error("analyzeReportWithAI error:", error);
    return res.status(500).json({ message: "Phân tích AI thất bại" });
  }
};

// [PATCH] /api/v1/admin/reports/:id/resolve
module.exports.resolveReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // "dismiss", "hide_post", "delete_post", "ban_user"
    const adminId = req.user._id;

    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ message: "Không tìm thấy báo cáo" });

    if (action === "hide_post" && report.target_type === "post") {
      await Post.findByIdAndUpdate(report.target_id, { status: "hidden" });
    } else if (action === "delete_post" && report.target_type === "post") {
      await Post.findByIdAndUpdate(report.target_id, { deleted: true });
    } else if (action === "ban_user") {
      const userIdToBan = report.target_type === "user" ? report.target_id : undefined;
      if (userIdToBan) await User.findByIdAndUpdate(userIdToBan, { status: "blocked" });
    }

    report.status = action === "dismiss" ? "dismissed" : "resolved";
    report.resolvedBy = adminId;
    report.resolvedAction = action;
    await report.save();

    await logAdminActivity(adminId, "resolve_report", "report", report._id, `Xử lý báo cáo với quyết định: ${action}`);

    return res.status(200).json({ code: 200, message: "Đã xử lý báo cáo thành công", data: report });
  } catch (error) {
    console.error("resolveReport error:", error);
    return res.status(500).json({ message: "Xử lý báo cáo thất bại" });
  }
};

// 7. [GET] /api/v1/admin/hashtags & Blacklist
module.exports.getHashtags = async (req, res) => {
  try {
    const allPosts = await Post.find({ deleted: false }).select("content title hashtags").lean();
    const hashtagMap = {};
    allPosts.forEach((p) => {
      const tags = p.hashtags || [];
      const text = (p.title || "") + " " + (p.content || "");
      const matches = text.match(/#[^\s#]+/g) || [];
      [...tags, ...matches].forEach((rawTag) => {
        const tag = rawTag.replace(/^#/, "").toLowerCase().trim();
        if (tag) hashtagMap[tag] = (hashtagMap[tag] || 0) + 1;
      });
    });

    const trending = Object.entries(hashtagMap)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    const blacklist = await HashtagBlacklist.find().populate("createdBy", "fullName username").sort({ createdAt: -1 }).lean();

    return res.status(200).json({ code: 200, data: { trending, blacklist } });
  } catch (error) {
    console.error("getHashtags error:", error);
    return res.status(500).json({ message: "Không thể lấy danh sách hashtag" });
  }
};

module.exports.addBlacklistHashtag = async (req, res) => {
  try {
    const { tag } = req.body;
    const adminId = req.user._id;

    if (!tag || !tag.trim()) return res.status(400).json({ message: "Hashtag không được để trống" });
    const cleanTag = tag.replace(/^#/, "").toLowerCase().trim();

    const existing = await HashtagBlacklist.findOne({ tag: cleanTag });
    if (existing) return res.status(400).json({ message: "Hashtag này đã nằm trong Blacklist" });

    const item = await HashtagBlacklist.create({ tag: cleanTag, createdBy: adminId });
    await logAdminActivity(adminId, "blacklist_hashtag", "hashtag", cleanTag, `Thêm hashtag #${cleanTag} vào danh sách cấm`);

    return res.status(200).json({ code: 200, message: `Đã thêm #${cleanTag} vào Blacklist`, data: item });
  } catch (error) {
    console.error("addBlacklistHashtag error:", error);
    return res.status(500).json({ message: "Thêm blacklist thất bại" });
  }
};

module.exports.deleteBlacklistHashtag = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user._id;

    const item = await HashtagBlacklist.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ message: "Không tìm thấy hashtag" });

    await logAdminActivity(adminId, "remove_blacklist_hashtag", "hashtag", item.tag, `Bỏ hashtag #${item.tag} khỏi danh sách cấm`);

    return res.status(200).json({ code: 200, message: "Đã xóa hashtag khỏi Blacklist", data: { id } });
  } catch (error) {
    console.error("deleteBlacklistHashtag error:", error);
    return res.status(500).json({ message: "Xóa blacklist thất bại" });
  }
};

// 8. [GET] /api/v1/admin/analytics/interactions
module.exports.getInteractionAnalytics = async (req, res) => {
  try {
    const topLikedPosts = await Post.find({ deleted: false })
      .populate("user_id", "_id fullName username avatar")
      .sort({ likesCount: -1 })
      .limit(5)
      .lean();

    const topActiveUsers = await User.find({ deleted: false })
      .select("_id fullName username avatar following followers status")
      .sort({ followers: -1 })
      .limit(5)
      .lean();

    return res.status(200).json({ code: 200, data: { topLikedPosts, topActiveUsers } });
  } catch (error) {
    console.error("getInteractionAnalytics error:", error);
    return res.status(500).json({ message: "Không thể lấy phân tích tương tác" });
  }
};

// 10. [GET] /api/v1/admin/activity-logs
module.exports.getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const currentPage = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (currentPage - 1) * limitNum;

    const total = await ActivityLog.countDocuments();
    const logs = await ActivityLog.find()
      .populate("admin_id", "_id fullName username avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    return res.status(200).json({
      code: 200,
      data: {
        logs,
        pagination: { total, page: currentPage, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
      },
    });
  } catch (error) {
    console.error("getActivityLogs error:", error);
    return res.status(500).json({ message: "Không thể lấy nhật ký hệ thống" });
  }
};
