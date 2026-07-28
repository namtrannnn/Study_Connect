const mongoose = require("mongoose");
const User = require("../models/user.model");
const Post = require("../models/post.model");

const escapeRegex = (text = "") => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const getRelationStatus = (viewer, targetUserId) => {
  const targetId = targetUserId.toString();

  const followingIds = (viewer.following || []).map((id) => id.toString());
  const followerIds = (viewer.followers || []).map((id) => id.toString());

  const isFollowing = followingIds.includes(targetId);
  const isFollower = followerIds.includes(targetId);

  if (isFollowing && isFollower) {
    return "mutual";
  }

  if (isFollowing) {
    return "following";
  }

  if (isFollower) {
    return "follower";
  }

  const pendingSentIds = (viewer.pendingFollowRequests || []).map((id) => id.toString());
  if (pendingSentIds.includes(targetId)) {
    return "pending_sent";
  }

  return "none";
};

const buildPostVisibilityQuery = ({ viewerId, followingIds }) => {
  return {
    $or: [
      // Bài public ai cũng thấy
      { visibility: "public" },

      // Bài của chính mình
      { author: viewerId },

      // Bài chỉ followers hoặc friends: mình phải đang follow tác giả
      {
        visibility: { $in: ["followers", "friends"] },
        author: { $in: followingIds },
      },

      // Bài custom: mình nằm trong allowedUsers
      {
        visibility: "custom",
        allowedUsers: viewerId,
      },
    ],
  };
};

const getFollowStatus = (viewer, targetUserId) => {
  const targetId = targetUserId.toString();

  const followingIds = (viewer.following || []).map((id) => id.toString());
  const followerIds = (viewer.followers || []).map((id) => id.toString());

  const isFollowing = followingIds.includes(targetId);
  const isFollower = followerIds.includes(targetId);

  if (isFollowing && isFollower) {
    return "mutual_follow";
  }

  if (isFollowing) {
    return "following";
  }

  if (isFollower) {
    return "followed_by";
  }

  return "none";
};

// [GET] /api/v1/search?keyword=react&type=all
module.exports.globalSearch = async (req, res) => {
  try {
    const viewerId = req.user._id;
    const rawKeyword = req.query.keyword?.trim() || "";
    const type = req.query.type || "all";

    const limit = Math.min(Number(req.query.limit) || 10, 30);

    if (!rawKeyword) {
      return res.status(200).json({
        code: 200,
        message: "Không có từ khóa",
        data: {
          users: [],
          posts: [],
        },
      });
    }

    const viewer = await User.findById(viewerId).select(
      "followers following pendingFollowRequests",
    );

    if (!viewer) {
      return res.status(404).json({
        code: 404,
        message: "Không tìm thấy người dùng",
      });
    }

    const normalizedKeyword = rawKeyword.replace(/^@+/, "");
    const rawRegex = new RegExp(escapeRegex(rawKeyword), "i");
    const normalizedRegex = new RegExp(escapeRegex(normalizedKeyword), "i");

    const followingIds = viewer.following || [];

    const shouldSearchUsers = type === "all" || type === "users";
    const shouldSearchPosts =
      type === "all" ||
      type === "posts" ||
      type === "project" ||
      type === "question" ||
      type === "knowledge" ||
      type === "learning" ||
      type === "collaboration" ||
      type === "achievement";

    let users = [];
    let posts = [];

    if (shouldSearchUsers) {
      const foundUsers = await User.find({
        deleted: false,
        status: "active",
        _id: { $ne: viewerId },
        $or: [
          { fullName: rawRegex },
          { fullName: normalizedRegex },
          { username: normalizedRegex },
          { email: normalizedRegex },
          { headline: normalizedRegex },
          { fieldOfStudy: normalizedRegex },
          { skills: normalizedRegex },
          { interests: normalizedRegex },
        ],
      })
        .select(
          "fullName username avatar isVerified headline fieldOfStudy skills followersCount followingCount",
        )
        .limit(limit)
        .lean();

      users = foundUsers.map((user) => ({
        ...user,
        relationStatus: getRelationStatus(viewer, user._id),
        followStatus: getFollowStatus(viewer, user._id),
      }));
    }

    if (shouldSearchPosts) {
      const postQuery = {
        status: "active",
        ...buildPostVisibilityQuery({
          viewerId,
          followingIds,
        }),
        $or: [
          { caption: normalizedRegex },
          { category: normalizedRegex },
          { postType: normalizedRegex },
          { hashtags: normalizedRegex },
          { location: normalizedRegex },

          { "project.projectName": normalizedRegex },
          { "project.summary": normalizedRegex },
          { "project.tools": normalizedRegex },
          { "project.status": normalizedRegex },

          { "question.title": normalizedRegex },
          { "question.detail": normalizedRegex },

          { "learning.title": normalizedRegex },
          { "learning.goal": normalizedRegex },
          { "learning.progressText": normalizedRegex },

          { "collaboration.title": normalizedRegex },
          { "collaboration.neededRoles": normalizedRegex },
          { "collaboration.description": normalizedRegex },
        ],
      };

      if (type !== "all" && type !== "posts") {
        postQuery.postType = type;
      }

      posts = await Post.find(postQuery)
        .populate("author", "fullName username avatar isVerified headline")
        .select(
          "author postType category caption media hashtags project question learning collaboration likesCount commentsCount savesCount sharesCount visibility createdAt",
        )
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
    }

    return res.status(200).json({
      code: 200,
      message: "Tìm kiếm thành công",
      data: {
        keyword: rawKeyword,
        type,
        users,
        posts,
      },
    });
  } catch (error) {
    console.error("globalSearch error:", error);

    return res.status(500).json({
      code: 500,
      message: "Lỗi server",
      error: error.message,
    });
  }
};
