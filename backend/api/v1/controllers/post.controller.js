const Post = require("../models/post.model");
const User = require("../models/user.model");
const Like = require("../models/postLike.model");
const uploadStreamToCloudinary = require("../../../helpers/cloudinary.helper");
const mongoose = require("mongoose");

const { canViewPost } = require("../../../helpers/postVisibility.helper");
const {
  parseAllowedUsers,
  normalizeVisibility,
  extractHashtags,
} = require("../../../helpers/postUtils.helper");

const {
  calculatePostScore,
  calculateFreshnessScore,
  calculateAffinityScore,
  calculateInterestMatchScore,
  calculateSourceBonus,
  uniquePostsById,
  attachSourceType,
  getUserInterestHashtags,
} = require("../../../helpers/postScore.helper");
const VALID_POST_TYPES = [
  "normal",
  "question",
  "quiz",
];

const VALID_CATEGORIES = [
  "technology",
  "finance_banking",
  "marketing",
  "design",
  "business",
  "language",
  "education",
  "science",
  "startup",
  "art",
  "music",
  "health",
  "other",
];

function parseJsonObject(value) {
  if (!value) return undefined;

  if (typeof value === "object") {
    return value;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  }

  return undefined;
}

function normalizePostType(postType) {
  if (!VALID_POST_TYPES.includes(postType)) {
    return "normal";
  }

  return postType;
}

function normalizeCategory(category) {
  if (!VALID_CATEGORIES.includes(category)) {
    return "other";
  }

  return category;
}

function getPostTypeData(
  postType,
  { question, quiz },
) {
  return {
    question: postType === "question" ? question : undefined,
    quiz: postType === "quiz" ? quiz : undefined,
  };
}

function hasSpecialPostContent(
  postType,
  { question, quiz },
) {
  return (
    (postType === "question" && question?.title) ||
    (postType === "quiz" && quiz?.options?.length > 0)
  );
}

function validateSpecialPostData(
  postType,
  { question, quiz },
) {
  if (postType === "question" && !question?.title) {
    return "Tiêu đề câu hỏi là bắt buộc";
  }

  if (postType === "quiz") {
    if (!quiz?.options || !Array.isArray(quiz.options) || quiz.options.length < 2) {
      return "Câu hỏi trắc nghiệm phải có ít nhất 2 đáp án";
    }
    if (quiz.correctOption === undefined || quiz.correctOption === null || quiz.correctOption < 0 || quiz.correctOption >= quiz.options.length) {
      return "Chỉ số đáp án đúng không hợp lệ";
    }
  }

  return null;
}
const parseObjectIdArray = (value) => {
  if (!value) return [];

  let result = [];

  if (Array.isArray(value)) {
    value.forEach((item) => {
      if (!item) return;

      if (typeof item === "string") {
        try {
          const parsed = JSON.parse(item);

          if (Array.isArray(parsed)) {
            result.push(...parsed);
          } else {
            result.push(parsed);
          }
        } catch {
          result.push(item);
        }

        return;
      }

      result.push(item);
    });
  } else if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        result = parsed;
      } else {
        result = [parsed];
      }
    } catch {
      result = value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  } else {
    result = [value];
  }

  return result
    .map((item) => item?.toString?.() || item)
    .filter((id) => mongoose.Types.ObjectId.isValid(id));
};
// [POST] /api/v1/post/create
module.exports.createPost = async (req, res) => {
  try {
    const user = req.user;

    let {
      postType = "normal",
      category = "other",
      caption = "",
      location = "",
      mentions = [],
      allowComments = true,
      hideLikeCount = false,
      hideShare = false,
      visibility = "public",
      allowedUsers = [],
      question,
      quiz,
    } = req.body;

    postType = normalizePostType(postType);
    category = normalizeCategory(category);

    caption = typeof caption === "string" ? caption.trim() : "";
    location = typeof location === "string" ? location.trim() : "";

    const files = req.files || [];

    mentions = parseObjectIdArray(mentions);

    question = parseJsonObject(question);
    quiz = parseJsonObject(quiz);

    const specialData = {
      question,
      quiz,
    };

    const validationMessage = validateSpecialPostData(postType, specialData);

    if (validationMessage) {
      return res.status(400).json({
        code: 400,
        message: validationMessage,
      });
    }

    visibility = normalizeVisibility(visibility);
    allowedUsers = parseAllowedUsers(allowedUsers);

    if (visibility !== "custom") {
      allowedUsers = [];
    }

    const hasSpecialContent = hasSpecialPostContent(postType, specialData);

    if (!caption && files.length === 0 && !hasSpecialContent) {
      return res.status(400).json({
        code: 400,
        message: "Bài viết phải có nội dung hoặc ít nhất 1 media",
      });
    }

    if (files.length > 10) {
      return res.status(400).json({
        code: 400,
        message: "Một bài viết chỉ được tối đa 10 media",
      });
    }

    const uploadedMedia = [];

    for (const file of files) {
      const result = await uploadStreamToCloudinary(file.buffer, "/posts");

      uploadedMedia.push({
        url: result.url,
        public_id: result.public_id,
        type: file.mimetype.startsWith("video/") ? "video" : "image",
        thumbnail: "",
        width: 0,
        height: 0,
      });
    }

    const hashtags = extractHashtags(caption);

    const typeData = getPostTypeData(postType, specialData);

    const newPost = new Post({
      author: user._id,
      postType,
      category,
      caption,
      media: uploadedMedia,
      location,
      hashtags,
      mentions,
      question: typeData.question,
      quiz: typeData.quiz,
      allowComments: String(allowComments) === "false" ? false : true,
      hideLikeCount: String(hideLikeCount) === "true",
      hideShare: String(hideShare) === "true",
      visibility,
      allowedUsers,
    });

    await newPost.save();

    await User.updateOne({ _id: user._id }, { $inc: { postsCount: 1 } });

    await updateLastAudienceSetting(user._id, visibility, allowedUsers);

    const postDetail = await Post.findById(newPost._id)
      .populate("author", "fullName username avatar isVerified")
      .populate("mentions", "fullName username avatar isVerified")
      .populate("allowedUsers", "fullName username avatar isVerified");

    return res.status(201).json({
      code: 201,
      message: "Tạo bài viết thành công",
      data: postDetail,
    });
  } catch (error) {
    console.error("createPost error:", error);

    return res.status(500).json({
      code: 500,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// [PATCH] /api/v1/post/edit/:id
module.exports.editPost = async (req, res) => {
  try {
    const user = req.user;
    const postId = req.params.id;

    let {
      postType,
      category,
      caption,
      location,
      mentions,
      allowComments,
      hideLikeCount,
      hideShare,
      visibility,
      allowedUsers,
      keepMediaIds,
      question,
      quiz,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        code: 400,
        message: "ID bài viết không hợp lệ",
      });
    }

    const post = await Post.findOne({
      _id: postId,
      status: { $ne: "deleted" },
    });

    if (!post) {
      return res.status(404).json({
        code: 404,
        message: "Bài viết không tồn tại",
      });
    }

    if (post.author.toString() !== user._id.toString()) {
      return res.status(403).json({
        code: 403,
        message: "Bạn không có quyền sửa bài viết này",
      });
    }

    const updateData = {};

    if (postType !== undefined) {
      updateData.postType = normalizePostType(postType);
    }

    if (category !== undefined) {
      updateData.category = normalizeCategory(category);
    }

    if (caption !== undefined) {
      caption = typeof caption === "string" ? caption.trim() : "";
      updateData.caption = caption;
      updateData.hashtags = extractHashtags(caption);
    }

    if (location !== undefined) {
      updateData.location = typeof location === "string" ? location.trim() : "";
    }

    if (mentions !== undefined) {
      if (typeof mentions === "string") {
        try {
          mentions = JSON.parse(mentions);
        } catch {
          mentions = [];
        }
      }

      updateData.mentions = Array.isArray(mentions) ? mentions : [];
    }

    if (visibility !== undefined) {
      updateData.visibility = normalizeVisibility(visibility);
    }

    if (allowedUsers !== undefined) {
      updateData.allowedUsers = parseAllowedUsers(allowedUsers);
    }

    if (allowComments !== undefined) {
      updateData.allowComments =
        String(allowComments) === "false" ? false : true;
    }

    if (hideLikeCount !== undefined) {
      updateData.hideLikeCount = String(hideLikeCount) === "true";
    }

    if (hideShare !== undefined) {
      updateData.hideShare = String(hideShare) === "true";
    }

    const finalPostType =
      updateData.postType !== undefined ? updateData.postType : post.postType;

    if (question !== undefined) {
      updateData.question = parseJsonObject(question);
    }

    if (quiz !== undefined) {
      updateData.quiz = parseJsonObject(quiz);
    }

    const finalSpecialData = {
      question:
        updateData.question !== undefined ? updateData.question : post.question,
      quiz:
        updateData.quiz !== undefined ? updateData.quiz : post.quiz,
    };

    const validationMessage = validateSpecialPostData(
      finalPostType,
      finalSpecialData,
    );

    if (validationMessage) {
      return res.status(400).json({
        code: 400,
        message: validationMessage,
      });
    }

    // Nếu đổi loại bài thì xóa dữ liệu loại cũ để tránh rác DB
    if (postType !== undefined) {
      if (finalPostType !== "question") {
        updateData.question = undefined;
      }

      if (finalPostType !== "quiz") {
        updateData.quiz = undefined;
      }
    }

    // =======================
    // EDIT MEDIA
    // =======================
    const files = req.files || [];

    if (keepMediaIds !== undefined || files.length > 0) {
      if (typeof keepMediaIds === "string") {
        try {
          keepMediaIds = JSON.parse(keepMediaIds);
        } catch {
          keepMediaIds = [];
        }
      }

      if (!Array.isArray(keepMediaIds)) {
        keepMediaIds = [];
      }

      const keepSet = new Set(keepMediaIds.map((id) => id.toString()));

      const keptMedia = (post.media || []).filter((media) =>
        keepSet.has(media._id.toString()),
      );

      const uploadedMedia = [];

      for (const file of files) {
        const result = await uploadStreamToCloudinary(file.buffer, "/posts");

        uploadedMedia.push({
          url: result.url,
          public_id: result.public_id,
          type: file.mimetype.startsWith("video/") ? "video" : "image",
          thumbnail: "",
          width: 0,
          height: 0,
        });
      }

      const finalMedia = [...keptMedia, ...uploadedMedia];

      if (finalMedia.length > 10) {
        return res.status(400).json({
          code: 400,
          message: "Một bài viết chỉ được tối đa 10 media",
        });
      }

      updateData.media = finalMedia;
    }

    const finalVisibility =
      updateData.visibility !== undefined
        ? updateData.visibility
        : post.visibility;

    if (finalVisibility !== "custom") {
      updateData.allowedUsers = [];
    } else if (updateData.allowedUsers === undefined) {
      updateData.allowedUsers = post.allowedUsers || [];
    }

    const finalCaption =
      updateData.caption !== undefined ? updateData.caption : post.caption;

    const finalMedia =
      updateData.media !== undefined ? updateData.media : post.media || [];

    const finalHasSpecialContent = hasSpecialPostContent(
      finalPostType,
      finalSpecialData,
    );

    if (!finalCaption && finalMedia.length === 0 && !finalHasSpecialContent) {
      return res.status(400).json({
        code: 400,
        message: "Bài viết phải có nội dung hoặc ít nhất 1 media",
      });
    }

    updateData.isEdited = true;
    updateData.editedAt = new Date();

    const updatedPost = await Post.findByIdAndUpdate(postId, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("author", "fullName username avatar isVerified")
      .populate("mentions", "fullName username avatar isVerified")
      .populate("allowedUsers", "fullName username avatar isVerified");

    await updateLastAudienceSetting(
      user._id,
      updatedPost.visibility,
      updatedPost.allowedUsers || [],
    );

    return res.status(200).json({
      code: 200,
      message: "Cập nhật bài viết thành công",
      data: updatedPost,
    });
  } catch (error) {
    console.error("editPost error:", error);

    return res.status(500).json({
      code: 500,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// =========================
// [GET] /api/v1/post/feed
// =========================
module.exports.getFeedPosts = async (req, res) => {
  try {
    const user = req.user;
    const limit = Math.min(Number(req.query.limit) || 10, 20);

    // 1. Lấy following
    const currentUser = await User.findById(user._id).select(
      "following",
    );

    const followingIds = currentUser?.following || [];

    // 2. Lấy hashtag sở thích của user
    const userInterestHashtags = await getUserInterestHashtags(user._id);

    // 3. Lấy bài của mình + following
    const followingPostsRaw = await Post.find({
      author: { $in: [...followingIds, user._id] },
      status: "active",
    })
      .populate("author", "fullName username avatar isVerified")
      .sort({ createdAt: -1 })
      .limit(30);

    // 4. Lấy bài gợi ý theo sở thích (người lạ nhưng hợp hashtag)
    let interestPostsRaw = [];

    if (userInterestHashtags.length > 0) {
      interestPostsRaw = await Post.find({
        author: { $nin: [...followingIds, user._id] },
        status: "active",
        hashtags: { $in: userInterestHashtags },
      })
        .populate("author", "fullName username avatar isVerified")
        .sort({ createdAt: -1 })
        .limit(20);
    }

    // 5. Lấy bài đang hot
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const hotPostsRaw = await Post.find({
      author: { $nin: [...followingIds, user._id] },
      status: "active",
      createdAt: { $gte: sevenDaysAgo },
    })
      .populate("author", "fullName username avatar isVerified")
      .sort({
        likesCount: -1,
        commentsCount: -1,
        savesCount: -1,
        createdAt: -1,
      })
      .limit(20);

    // 6. Gắn loại nguồn
    const followingPosts = attachSourceType(followingPostsRaw, "following");
    const interestPosts = attachSourceType(interestPostsRaw, "interest");
    const hotPosts = attachSourceType(hotPostsRaw, "hot");

    // 7. Gộp tất cả
    const mergedPosts = [...followingPosts, ...interestPosts, ...hotPosts];
    const authorIds = [
      ...new Set(
        mergedPosts.map((post) => post.author?._id?.toString()).filter(Boolean),
      ),
    ];

    const authors = await User.find({
      _id: { $in: authorIds },
    }).select("followers following");

    const authorMap = new Map(
      authors.map((author) => [author._id.toString(), author]),
    );

    const visiblePosts = mergedPosts.filter((post) => {
      const author = authorMap.get(post.author?._id?.toString());
      if (!author) return false;
      return canViewPost(post, user._id, author);
    });
    // 8. Bỏ trùng
    const uniquePosts = uniquePostsById(visiblePosts);

    // 9. Tính điểm
    const sourceIds = [...followingIds];

    const scoredPosts = uniquePosts.map((post) =>
      calculatePostScore(post, user._id, sourceIds, userInterestHashtags),
    );

    // 10. Sort theo score giảm dần
    scoredPosts.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      const dateDiff = new Date(b.createdAt) - new Date(a.createdAt);
      if (dateDiff !== 0) return dateDiff;

      return b._id.toString().localeCompare(a._id.toString());
    });

    const cursor = req.query.cursor || null;

    let filteredByCursor = scoredPosts;
    let decodedCursor = null;

    if (cursor) {
      try {
        decodedCursor = JSON.parse(
          Buffer.from(cursor, "base64").toString("utf8"),
        );
      } catch {
        return res.status(400).json({
          code: 400,
          message: "Cursor không hợp lệ",
        });
      }
    }

    if (decodedCursor) {
      filteredByCursor = scoredPosts.filter((post) => {
        if (post.score < decodedCursor.score) return true;

        if (post.score === decodedCursor.score) {
          const postDate = new Date(post.createdAt).getTime();
          const cursorDate = new Date(decodedCursor.createdAt).getTime();

          if (postDate < cursorDate) return true;

          if (postDate === cursorDate) {
            return post._id.toString() < decodedCursor.id;
          }
        }

        return false;
      });
    }

    const finalPostsSlice = filteredByCursor.slice(0, limit);

    let nextCursor = null;
    let hasMore = false;

    if (filteredByCursor.length > limit) {
      hasMore = true;

      const lastPost = finalPostsSlice[finalPostsSlice.length - 1];

      nextCursor = Buffer.from(
        JSON.stringify({
          score: lastPost.score,
          createdAt: lastPost.createdAt,
          id: lastPost._id.toString(),
        }),
      ).toString("base64");
    }

    const postIds = finalPostsSlice.map((post) => post._id);

    const likedPosts = await Like.find({
      user: user._id,
      post: { $in: postIds },
    }).select("post");

    const likedSet = new Set(likedPosts.map((item) => item.post.toString()));

    const finalPosts = finalPostsSlice.map((post) => ({
      ...post,
      isLiked: likedSet.has(post._id.toString()),
    }));

    // 11. Trả kết quả
    return res.status(200).json({
      code: 200,
      message: "Lấy feed thành công",
      data: finalPosts,
      pagination: {
        limit,
        hasMore,
        nextCursor,
      },
      meta: {
        totalFetched: scoredPosts.length,
        returned: finalPosts.length,
        userInterestHashtags,
      },
    });
  } catch (error) {
    console.error("getFeedPosts error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// [GET] /api/v1/post/:id
module.exports.detailPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const viewerId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        code: 400,
        message: "ID bài viết không hợp lệ",
      });
    }

    const post = await Post.findOne({
      _id: postId,
      status: "active",
    })
      .populate(
        "author",
        "fullName username avatar isVerified followers following",
      )
      .populate("mentions", "fullName username avatar isVerified")
      .populate("allowedUsers", "fullName username avatar isVerified");

    if (!post) {
      return res.status(404).json({
        code: 404,
        message: "Bài viết không tồn tại hoặc đã bị ẩn/xóa",
      });
    }

    const canView = canViewPost(post, viewerId, post.author);

    if (!canView) {
      return res.status(403).json({
        code: 403,
        message: "Bạn không có quyền xem bài viết này",
      });
    }

    const liked = await Like.exists({
      post: post._id,
      user: viewerId,
    });

    const postData = post.toObject();
    postData.isLiked = !!liked;

    return res.status(200).json({
      code: 200,
      message: "Lấy chi tiết bài viết thành công",
      data: postData,
    });
  } catch (error) {
    console.error("detailPost error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// [PATCH] /api/v1/post/delete/:id
module.exports.deletePost = async (req, res) => {
  try {
    const user = req.user;
    const postId = req.params.id;

    const post = await Post.findOne({
      _id: postId,
      status: { $ne: "deleted" },
    });

    if (!post) {
      return res.status(404).json({
        code: 404,
        message: "Bài viết không tồn tại",
      });
    }

    // chỉ cho chủ bài viết xóa
    if (post.author.toString() !== user._id.toString()) {
      return res.status(403).json({
        code: 403,
        message: "Bạn không có quyền xóa bài viết này",
      });
    }

    post.status = "deleted";
    await post.save();

    return res.status(200).json({
      code: 200,
      message: "Xóa bài viết thành công",
    });
  } catch (error) {
    console.error("deletePost error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server",
    });
  }
};

// [GET] /api/v1/post/user/:userId
module.exports.getPostsByUser = async (req, res) => {
  try {
    const viewerId = req.user._id;
    const userId = req.params.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        code: 400,
        message: "ID người dùng không hợp lệ",
      });
    }

    const author = await User.findById(userId).select(
      "fullName username avatar isVerified followers following pinnedPosts",
    );

    if (!author) {
      return res.status(404).json({
        code: 404,
        message: "Người dùng không tồn tại",
      });
    }

    const posts = await Post.find({
      author: userId,
      status: "active",
    })
      .populate("author", "fullName username avatar isVerified")
      .populate("allowedUsers", "fullName username avatar isVerified")
      .sort({ createdAt: -1 });

    const visiblePosts = posts.filter((post) =>
      canViewPost(post, viewerId, author),
    );

    const pinnedPostIds = (author.pinnedPosts || [])
      .sort((a, b) => new Date(b.pinnedAt) - new Date(a.pinnedAt))
      .map((item) => item.post?.toString());

    const visiblePostMap = new Map(
      visiblePosts.map((post) => [post._id.toString(), post]),
    );

    const pinnedPosts = pinnedPostIds
      .map((id) => visiblePostMap.get(id))
      .filter(Boolean);

    const pinnedSet = new Set(pinnedPosts.map((post) => post._id.toString()));

    const normalPosts = visiblePosts.filter(
      (post) => !pinnedSet.has(post._id.toString()),
    );

    const allPosts = [...pinnedPosts, ...normalPosts];
    const postIds = allPosts.map((p) => p._id);

    const likedPosts = await Like.find({
      user: viewerId,
      post: { $in: postIds },
    }).select("post");

    const likedSet = new Set(likedPosts.map((i) => i.post.toString()));

    const pinnedPostsWithLike = pinnedPosts.map((post) => ({
      ...post.toObject(),
      isLiked: likedSet.has(post._id.toString()),
    }));

    const normalPostsWithLike = normalPosts.map((post) => ({
      ...post.toObject(),
      isLiked: likedSet.has(post._id.toString()),
    }));

    return res.status(200).json({
      code: 200,
      message: "Lấy bài viết theo user thành công",
      data: {
        pinnedPosts: pinnedPostsWithLike,
        posts: normalPostsWithLike,
      },
    });
  } catch (error) {
    console.error("getPostsByUser error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server",
    });
  }
};

// [GET] /api/v1/post/me
module.exports.getMyPosts = async (req, res) => {
  try {
    const user = req.user;

    const posts = await Post.find({
      author: user._id,
      status: { $ne: "deleted" },
    })
      .populate("author", "fullName username avatar isVerified")
      .populate("allowedUsers", "fullName username avatar isVerified")
      .sort({ createdAt: -1 });
    const postIds = posts.map((p) => p._id);

    const likedPosts = await Like.find({
      user: user._id,
      post: { $in: postIds },
    }).select("post");

    const likedSet = new Set(likedPosts.map((i) => i.post.toString()));

    const finalPosts = posts.map((post) => ({
      ...post.toObject(),
      isLiked: likedSet.has(post._id.toString()),
    }));
    return res.status(200).json({
      code: 200,
      message: "Lấy bài viết của tôi thành công",
      data: finalPosts,
    });
  } catch (error) {
    console.error("getMyPosts error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server",
    });
  }
};

// [GET] /api/v1/pin/:id
module.exports.pinPost = async (req, res) => {
  try {
    const userId = req.user._id;
    const postId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        code: 400,
        message: "ID bài viết không hợp lệ",
      });
    }

    const post = await Post.findOne({
      _id: postId,
      author: userId,
      status: "active",
    });

    if (!post) {
      return res.status(404).json({
        code: 404,
        message: "Bài viết không tồn tại hoặc bạn không có quyền ghim",
      });
    }

    const user = await User.findById(userId).select("pinnedPosts");

    const alreadyPinned = (user.pinnedPosts || []).some(
      (item) => item.post.toString() === postId,
    );

    if (alreadyPinned) {
      return res.status(200).json({
        code: 200,
        message: "Bài viết đã được ghim trước đó",
      });
    }

    user.pinnedPosts.push({
      post: post._id,
      pinnedAt: new Date(),
    });

    user.pinnedPosts.sort(
      (a, b) => new Date(b.pinnedAt) - new Date(a.pinnedAt),
    );

    await user.save();

    return res.status(200).json({
      code: 200,
      message: "Ghim bài viết thành công",
      data: user.pinnedPosts,
    });
  } catch (error) {
    console.error("pinPost error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

module.exports.unpinPost = async (req, res) => {
  try {
    const userId = req.user._id;
    const postId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        code: 400,
        message: "ID bài viết không hợp lệ",
      });
    }

    const user = await User.findById(userId).select("pinnedPosts");

    const beforeCount = user.pinnedPosts.length;

    user.pinnedPosts = (user.pinnedPosts || []).filter(
      (item) => item.post.toString() !== postId,
    );

    if (user.pinnedPosts.length === beforeCount) {
      return res.status(404).json({
        code: 404,
        message: "Bài viết chưa được ghim",
      });
    }

    await user.save();

    return res.status(200).json({
      code: 200,
      message: "Bỏ ghim bài viết thành công",
      data: user.pinnedPosts,
    });
  } catch (error) {
    console.error("unpinPost error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// [GET] /api/v1/post/related/:id
module.exports.getRelatedPosts = async (req, res) => {
  try {
    const postId = req.params.id;

    const post = await Post.findById(postId);

    if (!post || post.status !== "active") {
      return res.status(404).json({
        code: 404,
        message: "Bài viết không tồn tại",
      });
    }

    const relatedPostsRaw = await Post.find({
      _id: { $ne: postId },
      status: "active",
      $or: [{ hashtags: { $in: post.hashtags } }, { location: post.location }],
    })
      .populate(
        "author",
        "fullName username avatar isVerified followers following",
      )
      .sort({ createdAt: -1 })
      .limit(20);

    const relatedPosts = relatedPostsRaw
      .filter((item) => canViewPost(item, req.user._id, item.author))
      .slice(0, 10);

    return res.status(200).json({
      code: 200,
      message: "Lấy bài viết liên quan thành công",
      data: relatedPosts,
    });
  } catch (error) {
    console.error("getRelatedPosts error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server",
    });
  }
};

exports.sharePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findByIdAndUpdate(
      postId,
      { $inc: { sharesCount: 1 } },
      { new: true },
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post không tồn tại",
      });
    }

    return res.json({
      success: true,
      message: "Đã chia sẻ bài viết",
      data: {
        postId: post._id,
        sharesCount: post.sharesCount,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// [POST] /api/v1/post/:id/quiz/answer
module.exports.answerQuiz = async (req, res) => {
  try {
    const userId = req.user._id;
    const postId = req.params.id;
    const { optionIndex } = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        code: 400,
        message: "ID bài viết không hợp lệ",
      });
    }

    const post = await Post.findOne({ _id: postId, status: "active" });
    if (!post) {
      return res.status(404).json({
        code: 404,
        message: "Bài viết không tồn tại",
      });
    }

    if (post.postType !== "quiz" || !post.quiz) {
      return res.status(400).json({
        code: 400,
        message: "Bài viết này không phải là bài đăng trắc nghiệm",
      });
    }

    const optIndex = Number(optionIndex);
    if (isNaN(optIndex) || optIndex < 0 || optIndex >= post.quiz.options.length) {
      return res.status(400).json({
        code: 400,
        message: "Đáp án lựa chọn không hợp lệ",
      });
    }

    // Kiểm tra xem người dùng đã trả lời chưa
    const alreadyAnswered = post.quiz.answers.some(
      (ans) => ans.user.toString() === userId.toString(),
    );

    if (alreadyAnswered) {
      return res.status(400).json({
        code: 400,
        message: "Bạn đã trả lời câu hỏi trắc nghiệm này rồi",
      });
    }

    // Lưu câu trả lời của user
    post.quiz.answers.push({
      user: userId,
      optionIndex: optIndex,
    });

    // Tăng số lượt bình chọn của phương án được chọn
    post.quiz.options[optIndex].votesCount += 1;

    await post.save();

    // Phát tín hiệu socket realtime cho các client đang xem bài viết này
    if (global._io) {
      global._io.to(`post:${postId}`).emit("SERVER_RETURN_QUIZ_ANSWER", {
        postId,
        quiz: post.quiz,
      });
    }

    return res.status(200).json({
      code: 200,
      message: "Trả lời câu hỏi trắc nghiệm thành công",
      data: post.quiz,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      code: 500,
      message: "Lỗi hệ thống",
    });
  }
};

async function updateLastAudienceSetting(
  userId,
  visibility,
  allowedUsers = [],
) {
  await User.updateOne(
    { _id: userId },
    {
      $set: {
        lastAudienceSetting: visibility,
        lastSelectedAudience: visibility === "custom" ? allowedUsers : [],
      },
    },
  );
}
