const mongoose = require("mongoose");
const User = require("../models/user.model");
const Post = require("../models/post.model");

const escapeRegex = (text = "") => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const getRelationStatus = (viewer, targetUser) => {
  const targetId = targetUser._id.toString();

  const followingIds = (viewer.following || []).map((id) => id.toString());
  const followerIds = (viewer.followers || []).map((id) => id.toString());
  const pendingReceivedIds = (targetUser.pendingFollowRequests || []).map((id) => id.toString());

  const isFollowing = followingIds.includes(targetId);
  const isFollower = followerIds.includes(targetId);
  const isPendingSent = pendingReceivedIds.includes(viewer._id.toString());

  if (isFollowing && isFollower) {
    return "mutual";
  }

  if (isFollowing) {
    return "following";
  }

  if (isPendingSent) {
    return "pending_sent";
  }

  if (isFollower) {
    return "follower";
  }

  return "none";
};

const buildPostVisibilityQuery = ({ viewerId, followingIds }) => {
  return {
    $or: [
      { visibility: "public" },
      { author: viewerId },
      {
        visibility: { $in: ["followers", "friends"] },
        author: { $in: followingIds },
      },
      {
        visibility: "custom",
        allowedUsers: viewerId,
      },
    ],
  };
};

// [GET] /api/v1/search?keyword=react&type=all&page=1&limit=10
module.exports.globalSearch = async (req, res) => {
  try {
    const viewerId = req.user._id;
    const rawKeyword = req.query.keyword?.trim() || "";
    const type = req.query.type || "all";
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 30);
    const skip = (page - 1) * limit;

    if (!rawKeyword) {
      return res.status(200).json({
        code: 200,
        message: "Không có từ khóa",
        data: {
          users: [],
          posts: [],
          hasMoreUsers: false,
          hasMorePosts: false,
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
    const shouldSearchPosts = type === "all" || type === "posts";

    let users = [];
    let posts = [];
    let hasMoreUsers = false;
    let hasMorePosts = false;

    if (shouldSearchUsers) {
      const userFilter = {
        deleted: false,
        status: "active",
        _id: { $ne: viewerId },
        $or: [
          { fullName: rawRegex },
          { fullName: normalizedRegex },
          { username: normalizedRegex },
          { email: normalizedRegex },
          { bio: normalizedRegex },
        ],
      };

      const totalUsers = await User.countDocuments(userFilter);

      const foundUsers = await User.find(userFilter)
        .select(
          "fullName username avatar isVerified bio followersCount followingCount pendingFollowRequests isPrivate",
        )
        .skip(skip)
        .limit(limit)
        .lean();

      users = foundUsers.map((targetUser) => ({
        _id: targetUser._id,
        fullName: targetUser.fullName,
        username: targetUser.username,
        avatar: targetUser.avatar,
        isVerified: targetUser.isVerified,
        bio: targetUser.bio || "",
        isPrivate: targetUser.isPrivate,
        relationStatus: getRelationStatus(viewer, targetUser),
      }));

      hasMoreUsers = skip + foundUsers.length < totalUsers;
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
          { "question.title": normalizedRegex },
          { "question.detail": normalizedRegex },
        ],
      };

      const totalPosts = await Post.countDocuments(postQuery);

      posts = await Post.find(postQuery)
        .populate("author", "fullName username avatar isVerified")
        .select(
          "author postType category caption media hashtags project question learning collaboration likesCount commentsCount savesCount sharesCount visibility createdAt",
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      hasMorePosts = skip + posts.length < totalPosts;
    }

    return res.status(200).json({
      code: 200,
      message: "Tìm kiếm thành công",
      data: {
        keyword: rawKeyword,
        type,
        page,
        users,
        posts,
        hasMoreUsers,
        hasMorePosts,
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
