const mongoose = require("mongoose");
const User = require("../models/user.model");
const Post = require("../models/post.model");
const Like = require("../models/postLike.model");
const PostSave = require("../models/postsave.model");
const userSelect =
  "_id fullName username avatar isVerified isPrivate postsCount followersCount followingCount followers following pendingFollowRequests pinnedPosts createdAt";
const uploadStreamToCloudinary = require("../../../helpers/cloudinary.helper");
const { canViewPost } = require("../../../helpers/postVisibility.helper");

const getRelation = (currentUser, targetUser) => {
  const currentUserId = currentUser?._id?.toString();
  const targetUserId = targetUser?._id?.toString();

  const isMe = currentUserId === targetUserId;

  if (isMe) {
    return {
      isMe: true,
      isFollowing: false,
      isFollower: false,
      isFriend: false,
      relationStatus: "self",
    };
  }

  const isFollowing = (currentUser.following || []).some(
    (id) => id.toString() === targetUserId,
  );

  const isFollower = (currentUser.followers || []).some(
    (id) => id.toString() === targetUserId,
  );

  const isMutual = isFollowing && isFollower;

  if (isMutual) {
    return {
      isMe: false,
      isFollowing: true,
      isFollower: true,
      isFriend: true,
      relationStatus: "mutual",
    };
  }

  if (isFollowing) {
    return {
      isMe: false,
      isFollowing: true,
      isFollower: false,
      isFriend: false,
      relationStatus: "following",
    };
  }

  if (isFollower) {
    return {
      isMe: false,
      isFollowing: false,
      isFollower: true,
      isFriend: false,
      relationStatus: "follower",
    };
  }

  const isPendingSent = (targetUser.pendingFollowRequests || []).some(
    (id) => id.toString() === currentUserId,
  );

  if (isPendingSent) {
    return {
      isMe: false,
      isFollowing: false,
      isFollower: false,
      isFriend: false,
      relationStatus: "pending_sent",
    };
  }

  const isPendingReceived = (currentUser.pendingFollowRequests || []).some(
    (id) => id.toString() === targetUserId,
  );

  if (isPendingReceived) {
    return {
      isMe: false,
      isFollowing: false,
      isFollower: false,
      isFriend: false,
      relationStatus: "pending_received",
    };
  }

  return {
    isMe: false,
    isFollowing: false,
    isFollower: false,
    isFriend: false,
    relationStatus: "none",
  };
};

// [GET] /api/v1/profile/me
module.exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.user._id,
      deleted: false,
    }).select(userSelect);

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: "Không tìm thấy người dùng",
      });
    }

    return res.status(200).json({
      code: 200,
      message: "Lấy profile của tôi thành công",
      data: {
        user,
        stats: {
          postsCount: user.postsCount || 0,
          followersCount: user.followersCount || 0,
          followingCount: user.followingCount || 0,
        },
        relation: {
          isMe: true,
          isFollowing: false,
          isFriend: false,
          relationStatus: "self",
        },
      },
    });
  } catch (error) {
    console.error("getMyProfile error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// [GET] /api/v1/profile/:userId
module.exports.getProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const isObjectId = mongoose.Types.ObjectId.isValid(userId);
    const userQuery = isObjectId
      ? { _id: userId, deleted: false, status: "active" }
      : { username: userId.trim().toLowerCase(), deleted: false, status: "active" };

    const user = await User.findOne(userQuery).select(userSelect);

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: "Không tìm thấy người dùng",
      });
    }

    return res.status(200).json({
      code: 200,
      message: "Lấy profile thành công",
      data: {
        user,
        stats: {
          postsCount: user.postsCount || 0,
          followersCount: user.followersCount || 0,
          followingCount: user.followingCount || 0,
        },
        relation: getRelation(req.user, user),
      },
    });
  } catch (error) {
    console.error("getProfileByUserId error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// [GET] /api/v1/profile/:userId/posts/grid
module.exports.getUserPostGrid = async (req, res) => {
  try {
    const { userId } = req.params;
    const viewerId = req.user._id;
    const limit = Math.min(Number(req.query.limit) || 30, 50);
    const cursor = req.query.cursor;

    const isObjectId = mongoose.Types.ObjectId.isValid(userId);
    const authorQuery = isObjectId
      ? { _id: userId, deleted: false, status: "active" }
      : { username: userId.trim().toLowerCase(), deleted: false, status: "active" };

    const author = await User.findOne(authorQuery).select("followers following _id");

    if (!author) {
      return res.status(404).json({
        code: 404,
        message: "Không tìm thấy người dùng",
      });
    }

    const filter = {
      author: author._id,
      status: "active",
    };

    if (cursor) {
      filter.createdAt = { $lt: new Date(cursor) };
    }

    // Lấy nhiều hơn limit một chút vì còn lọc quyền riêng tư sau
    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 3)
      .select(
        "_id author postType caption media likesCount commentsCount visibility allowedUsers project question learning collaboration study_session study_note challenge peer_review createdAt",
      );

    const visiblePosts = posts
      .filter((post) => canViewPost(post, viewerId, author))
      .slice(0, limit);

    const data = visiblePosts.map((post) => ({
      _id: post._id,
      author: post.author,
      postType: post.postType,
      caption: post.caption || "",
      media: post.media || [],
      firstMedia: post.media?.[0] || null,
      mediaCount: post.media?.length || 0,
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      visibility: post.visibility,
      project: post.project,
      question: post.question,
      learning: post.learning,
      collaboration: post.collaboration,
      study_session: post.study_session,
      study_note: post.study_note,
      challenge: post.challenge,
      peer_review: post.peer_review,
      createdAt: post.createdAt,
    }));

    return res.status(200).json({
      code: 200,
      message: "Lấy grid bài viết thành công",
      data,
      nextCursor:
        visiblePosts.length > 0
          ? visiblePosts[visiblePosts.length - 1].createdAt
          : null,
      hasMore: posts.length > visiblePosts.length,
    });
  } catch (error) {
    console.error("getUserPostGrid error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// [GET] /api/v1/profile/:userId/posts/feed
module.exports.getUserPostFeed = async (req, res) => {
  try {
    const { userId } = req.params;
    const viewerId = req.user._id;
    const limit = Math.min(Number(req.query.limit) || 10, 20);
    const cursor = req.query.cursor;

    const isObjectId = mongoose.Types.ObjectId.isValid(userId);
    const authorQuery = isObjectId
      ? { _id: userId, deleted: false, status: "active" }
      : { username: userId.trim().toLowerCase(), deleted: false, status: "active" };

    const author = await User.findOne(authorQuery).select("followers following _id");

    if (!author) {
      return res.status(404).json({
        code: 404,
        message: "Không tìm thấy người dùng",
      });
    }

    const filter = {
      author: author._id,
      status: "active",
    };

    if (cursor) {
      filter.createdAt = { $lt: new Date(cursor) };
    }

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 3)
      .populate("author", "_id fullName username avatar isVerified")
      .populate("mentions", "_id fullName username avatar")
      .populate("allowedUsers", "_id fullName username avatar")
      .select(
        "_id author caption media location hashtags mentions likesCount commentsCount savesCount sharesCount allowComments hideLikeCount hideShare visibility allowedUsers isEdited editedAt createdAt updatedAt",
      );

    const visiblePosts = posts
      .filter((post) => canViewPost(post, viewerId, author))
      .slice(0, limit);

    const postIds = visiblePosts.map((post) => post._id);

    const [likedPosts, savedPosts] = await Promise.all([
      Like.find({ user: viewerId, post: { $in: postIds } }).select("post"),
      PostSave.find({ user: viewerId, post: { $in: postIds } }).select("post"),
    ]);

    const likedSet = new Set(likedPosts.map((item) => item.post.toString()));
    const savedSet = new Set(savedPosts.map((item) => item.post.toString()));

    const data = visiblePosts.map((post) => {
      const obj = post.toObject();
      return {
        ...obj,
        isLiked: likedSet.has(post._id.toString()),
        isSaved: savedSet.has(post._id.toString()),
      };
    });

    return res.status(200).json({
      code: 200,
      message: "Lấy feed bài viết profile thành công",
      data,
      nextCursor:
        visiblePosts.length > 0
          ? visiblePosts[visiblePosts.length - 1].createdAt
          : null,
      hasMore: posts.length > visiblePosts.length,
    });
  } catch (error) {
    console.error("getUserPostFeed error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// [PATCH] /api/v1/profile/update
module.exports.updateProfile = async (req, res) => {
  try {
    const allowFields = ["fullName", "username", "isPrivate"];
    const updateData = {};

    allowFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (req.file) {
      const result = await uploadStreamToCloudinary(req.file.buffer, "/users");

      updateData.avatar = result.url;
    }

    if (updateData.username) {
      updateData.username = updateData.username.trim().toLowerCase();

      const existedUser = await User.findOne({
        _id: { $ne: req.user._id },
        username: updateData.username,
        deleted: false,
      });

      if (existedUser) {
        return res.status(400).json({
          code: 400,
          message: "Username đã tồn tại",
        });
      }
    }

    const user = await User.findOneAndUpdate(
      {
        _id: req.user._id,
        deleted: false,
      },
      updateData,
      {
        new: true,
        runValidators: true,
      },
    ).select(userSelect);

    return res.status(200).json({
      code: 200,
      message: "Cập nhật profile thành công",
      data: user,
    });
  } catch (error) {
    console.error("updateProfile error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server",
      error: error.message,
    });
  }
};
