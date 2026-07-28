const mongoose = require("mongoose");
const Comment = require("../models/postComment.model");
const Post = require("../models/post.model");
const CommentLike = require("../models/commentLike.model");

const { createNotification } = require("../services/notification.service");
const {
  getMentionUserIdsFromContent,
} = require("../../../helpers/mention.helper");
const { canViewPost } = require("../../../helpers/postVisibility.helper");

async function finalizeExpiredPendingDeleteComments(postId = null) {
  const now = new Date();

  const filter = {
    status: "pending_delete",
    canUndoUntil: { $lte: now },
  };

  if (postId && mongoose.Types.ObjectId.isValid(postId)) {
    filter.post = postId;
  }

  const expiredComments = await Comment.find(filter).select("_id post");

  if (!expiredComments.length) return;

  const postCountMap = new Map();

  for (const item of expiredComments) {
    const key = item.post.toString();
    postCountMap.set(key, (postCountMap.get(key) || 0) + 1);
  }

  await Comment.updateMany(filter, {
    $set: {
      status: "deleted",
      pendingDeleteAt: null,
      canUndoUntil: null,
    },
  });

  for (const [postIdKey, count] of postCountMap.entries()) {
    await Post.updateOne(
      { _id: postIdKey },
      { $inc: { commentsCount: -count } },
    );
  }
}

// [POST] /api/v1/post/comment/:postId
module.exports.createComment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { postId } = req.params;
    let { content, parentComment, replyToComment, replyToUser } = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        code: 400,
        message: "ID bài viết không hợp lệ",
      });
    }

    content = typeof content === "string" ? content.trim() : "";

    if (!content) {
      return res.status(400).json({
        code: 400,
        message: "Nội dung bình luận không được để trống",
      });
    }

    const post = await Post.findOne({
      _id: postId,
      status: "active",
    }).populate("author", "followers following");

    if (!post) {
      return res.status(404).json({
        code: 404,
        message: "Bài viết không tồn tại",
      });
    }

    const canView = canViewPost(post, userId, post.author);

    if (!canView) {
      return res.status(403).json({
        code: 403,
        message: "Bạn không có quyền bình luận bài viết này",
      });
    }

    let parent = null;
    let repliedComment = null;
    let repliedUser = null;

    if (replyToComment) {
      if (!mongoose.Types.ObjectId.isValid(replyToComment)) {
        return res.status(400).json({
          code: 400,
          message: "ID comment được trả lời không hợp lệ",
        });
      }

      repliedComment = await Comment.findOne({
        _id: replyToComment,
        post: postId,
        status: "active",
      });

      if (!repliedComment) {
        return res.status(404).json({
          code: 404,
          message: "Comment được trả lời không tồn tại",
        });
      }

      parent = repliedComment.parentComment
        ? await Comment.findById(repliedComment.parentComment)
        : repliedComment;

      repliedUser = repliedComment.user;
    } else if (parentComment) {
      if (!mongoose.Types.ObjectId.isValid(parentComment)) {
        return res.status(400).json({
          code: 400,
          message: "ID comment cha không hợp lệ",
        });
      }

      parent = await Comment.findOne({
        _id: parentComment,
        post: postId,
        status: "active",
      });

      if (!parent) {
        return res.status(404).json({
          code: 404,
          message: "Comment cha không tồn tại",
        });
      }

      repliedComment = parent;
      repliedUser = parent.user;
    }

    if (replyToUser && mongoose.Types.ObjectId.isValid(replyToUser)) {
      repliedUser = replyToUser;
    }

    const mentionIds = await getMentionUserIdsFromContent(content);
    if (!post.allowComments) {
      return res.status(403).json({
        code: 403,
        message: "Bài viết này đã tắt bình luận",
      });
    }
    const newComment = await Comment.create({
      post: postId,
      user: userId,
      content,
      parentComment: parent ? parent._id : null,
      replyToComment: repliedComment ? repliedComment._id : null,
      replyToUser: repliedUser || null,
      mentions: mentionIds,
    });

    // tăng số comment
    await Post.updateOne({ _id: postId }, { $inc: { commentsCount: 1 } });
    if (parent) {
      await Comment.updateOne(
        { _id: parent._id },
        { $inc: { repliesCount: 1 } },
      );
    }
    const commentDetail = await Comment.findById(newComment._id)
      .populate("user", "fullName username avatar isVerified")
      .populate("replyToUser", "fullName username avatar isVerified")
      .populate("mentions", "fullName username avatar isVerified");
    const roomName = `post:${postId}`;

    global._io.to(roomName).emit("SERVER_RETURN_NEW_COMMENT", {
      postId: postId.toString(),
      comment: {
        ...commentDetail.toObject(),
        parentComment: commentDetail.parentComment
          ? commentDetail.parentComment.toString()
          : null,
      },
    });

    // Gửi notification
    const senderId = userId.toString();

    // 1. Notify chủ bài (post_comment) — không gửi nếu tự comment
    if (post.author._id.toString() !== senderId) {
      await createNotification({
        receiver: post.author._id,
        sender: userId,
        type: "post_comment",
        message: `đã bình luận bài viết của bạn`,
        refId: post._id,
        refType: "post",
      }).catch(() => {});
    }

    // 2. Notify người được reply (comment_reply) — không gửi nếu tự reply
    if (repliedComment && repliedComment.user.toString() !== senderId) {
      await createNotification({
        receiver: repliedComment.user,
        sender: userId,
        type: "comment_reply",
        message: `đã trả lời bình luận của bạn`,
        refId: post._id,
        refType: "post",
      }).catch(() => {});
    }

    // 3. Notify các user được @mention — không gửi cho chính mình
    for (const mentionId of mentionIds) {
      if (mentionId.toString() !== senderId) {
        await createNotification({
          receiver: mentionId,
          sender: userId,
          type: "mention",
          message: `đã nhắc đến bạn trong một bình luận`,
          refId: post._id,
          refType: "post",
        }).catch(() => {});
      }
    }

    return res.status(201).json({
      code: 201,
      message: "Bình luận thành công",
      data: commentDetail,
    });
  } catch (error) {
    console.error("createComment error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server",
    });
  }
};

// [GET] /api/v1/post/comment/:postId
module.exports.getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const viewerId = req.user._id;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;
    const sort = req.query.sort || "newest";

    let sortOption = { createdAt: -1 };

    if (sort === "oldest") {
      sortOption = { createdAt: 1 };
    }

    if (sort === "top") {
      sortOption = { likesCount: -1, createdAt: -1 };
    }
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        code: 400,
        message: "ID bài viết không hợp lệ",
      });
    }
    await finalizeExpiredPendingDeleteComments(postId);
    const post = await Post.findById(postId).populate(
      "author",
      "followers following",
    );

    if (!post || post.status !== "active") {
      return res.status(404).json({
        code: 404,
        message: "Bài viết không tồn tại",
      });
    }

    const canView = canViewPost(post, viewerId, post.author);

    if (!canView) {
      return res.status(403).json({
        code: 403,
        message: "Bạn không có quyền xem comment",
      });
    }

    const isPostOwner = post.author._id.toString() === viewerId.toString();

    const visibleStatuses = isPostOwner ? ["active", "hidden"] : ["active"];

    const parentComments = await Comment.find({
      post: postId,
      parentComment: null,
      status: { $in: visibleStatuses },
    })
      .populate("user", "fullName username avatar isVerified")
      .populate("replyToUser", "fullName username avatar isVerified")
      .populate("mentions", "fullName username avatar isVerified")
      .sort({
        isPinned: -1,
        pinnedAt: -1,
        ...sortOption,
      })
      .skip(skip)
      .limit(limit);

    const allCommentIds = parentComments.map((c) => c._id);

    const likedComments = await CommentLike.find({
      comment: { $in: allCommentIds },
      user: viewerId,
    }).select("comment");

    const likedCommentSet = new Set(
      likedComments.map((item) => item.comment.toString()),
    );

    const authorLikedComments = await CommentLike.find({
      comment: { $in: allCommentIds },
      user: post.author._id,
    }).select("comment");

    const authorLikedCommentSet = new Set(
      authorLikedComments.map((item) => item.comment.toString()),
    );

    const finalComments = parentComments.map((comment) => ({
      ...comment.toObject(),

      isLiked: likedCommentSet.has(comment._id.toString()),

      isLikedByPostAuthor: authorLikedCommentSet.has(comment._id.toString()),

      replies: [],
    }));

    const total = await Comment.countDocuments({
      post: postId,
      parentComment: null,
      status: { $in: visibleStatuses },
    });

    return res.status(200).json({
      code: 200,
      message: "Lấy danh sách comment thành công",
      data: finalComments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("getCommentsByPost error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// [PATCH] /api/v1/post/comment/hide/:commentId
module.exports.hideComment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        code: 400,
        message: "ID comment không hợp lệ",
      });
    }

    const comment = await Comment.findOne({
      _id: commentId,
      status: "active",
    });

    if (!comment) {
      return res.status(404).json({
        code: 404,
        message: "Comment không tồn tại hoặc không thể ẩn",
      });
    }

    const post = await Post.findById(comment.post);

    if (!post || post.status !== "active") {
      return res.status(404).json({
        code: 404,
        message: "Bài viết không tồn tại",
      });
    }

    // chỉ chủ post được ẩn comment
    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({
        code: 403,
        message: "Bạn không có quyền ẩn comment này",
      });
    }

    comment.status = "hidden";
    await comment.save();

    const roomName = `post:${comment.post.toString()}`;

    global._io.to(roomName).emit("SERVER_RETURN_HIDE_COMMENT", {
      postId: comment.post,
      commentId: comment._id,
      parentComment: comment.parentComment || null,
    });

    return res.status(200).json({
      code: 200,
      message: "Ẩn bình luận thành công",
    });
  } catch (error) {
    console.error("hideComment error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// [PATCH] /api/v1/post/comment/edit/:commentId
module.exports.editComment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { commentId } = req.params;
    let { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        code: 400,
        message: "ID comment không hợp lệ",
      });
    }

    content = typeof content === "string" ? content.trim() : "";

    if (!content) {
      return res.status(400).json({
        code: 400,
        message: "Nội dung bình luận không được để trống",
      });
    }

    const comment = await Comment.findOne({
      _id: commentId,
      status: "active",
    });

    if (!comment) {
      return res.status(404).json({
        code: 404,
        message: "Comment không tồn tại",
      });
    }

    if (comment.user.toString() !== userId.toString()) {
      return res.status(403).json({
        code: 403,
        message: "Bạn không có quyền sửa comment này",
      });
    }

    if (comment.content === content) {
      return res.status(200).json({
        code: 200,
        message: "Không có thay đổi nội dung",
        data: comment,
      });
    }

    comment.editHistory.push({
      oldContent: comment.content,
      editedAt: new Date(),
    });

    const mentionIds = await getMentionUserIdsFromContent(content);

    comment.content = content;
    comment.mentions = mentionIds;
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();

    const updatedComment = await Comment.findById(comment._id)
      .populate("user", "fullName username avatar isVerified")
      .populate("replyToUser", "fullName username avatar isVerified")
      .populate("mentions", "fullName username avatar isVerified");

    const roomName = `post:${comment.post.toString()}`;

    global._io.to(roomName).emit("SERVER_RETURN_UPDATE_COMMENT", {
      postId: comment.post.toString(),
      comment: updatedComment,
    });

    return res.status(200).json({
      code: 200,
      message: "Cập nhật comment thành công",
      data: updatedComment,
    });
  } catch (error) {
    console.error("editComment error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// [PATCH] /api/v1/post/comment/unhide/:commentId
module.exports.unhideComment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { commentId } = req.params;

    const comment = await Comment.findOne({
      _id: commentId,
      status: "hidden",
    });

    if (!comment) {
      return res.status(404).json({
        code: 404,
        message: "Comment không tồn tại hoặc chưa bị ẩn",
      });
    }

    const post = await Post.findById(comment.post);

    if (!post || post.status !== "active") {
      return res.status(404).json({
        code: 404,
        message: "Bài viết không tồn tại",
      });
    }

    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({
        code: 403,
        message: "Bạn không có quyền hiện lại comment này",
      });
    }

    comment.status = "active";
    await comment.save();

    global._io
      .to(`post:${comment.post.toString()}`)
      .emit("SERVER_RETURN_UNHIDE_COMMENT", {
        postId: comment.post,
        commentId: comment._id,
        parentComment: comment.parentComment || null,
      });

    return res.status(200).json({
      code: 200,
      message: "Đã hiện lại bình luận",
      data: {
        commentId: comment._id,
        status: comment.status,
      },
    });
  } catch (error) {
    console.error("unhideComment error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// [GET] /api/v1/post/comment/history/:commentId
module.exports.getCommentEditHistory = async (req, res) => {
  try {
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        code: 400,
        message: "ID comment không hợp lệ",
      });
    }

    const comment = await Comment.findById(commentId)
      .populate("user", "fullName username avatar isVerified")
      .select("content isEdited editedAt editHistory user post status");

    if (!comment || comment.status === "deleted") {
      return res.status(404).json({
        code: 404,
        message: "Comment không tồn tại",
      });
    }

    return res.status(200).json({
      code: 200,
      message: "Lấy lịch sử chỉnh sửa comment thành công",
      data: {
        commentId: comment._id,
        currentContent: comment.content,
        isEdited: comment.isEdited,
        editedAt: comment.editedAt,
        editHistory: [...comment.editHistory].reverse(),
      },
    });
  } catch (error) {
    console.error("getCommentEditHistory error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// [PATCH] /api/v1/post/comment/delete/:commentId
module.exports.deleteComment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        code: 400,
        message: "ID comment không hợp lệ",
      });
    }

    const comment = await Comment.findOne({
      _id: commentId,
      status: { $in: ["active", "hidden"] },
    });

    if (!comment) {
      return res.status(404).json({
        code: 404,
        message: "Comment không tồn tại",
      });
    }

    const post = await Post.findById(comment.post);

    if (!post || post.status !== "active") {
      return res.status(404).json({
        code: 404,
        message: "Bài viết không tồn tại",
      });
    }

    const isCommentOwner = comment.user.toString() === userId.toString();
    const isPostOwner = post.author.toString() === userId.toString();

    if (!isCommentOwner && !isPostOwner) {
      return res.status(403).json({
        code: 403,
        message: "Bạn không có quyền xóa comment này",
      });
    }

    const now = new Date();
    const undoUntil = new Date(now.getTime() + 5000);

    comment.status = "pending_delete";
    comment.pendingDeleteAt = now;
    comment.canUndoUntil = undoUntil;
    await comment.save();
    if (comment.parentComment) {
      await Comment.updateOne(
        { _id: comment.parentComment },
        { $inc: { repliesCount: -1 } },
      );
    }
    const roomName = `post:${comment.post.toString()}`;

    global._io.to(roomName).emit("SERVER_RETURN_PENDING_DELETE_COMMENT", {
      postId: comment.post.toString(),
      commentId: comment._id.toString(),
      parentComment: comment.parentComment
        ? comment.parentComment.toString()
        : null,
      canUndoUntil: undoUntil,
    });

    return res.status(200).json({
      code: 200,
      message: "Comment đã được đưa vào trạng thái chờ xóa",
      data: {
        commentId: comment._id,
        status: comment.status,
        canUndoUntil: undoUntil,
      },
    });
  } catch (error) {
    console.error("deleteComment error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// [PATCH] /api/v1/post/comment/undo-delete/:commentId
module.exports.undoDeleteComment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        code: 400,
        message: "ID comment không hợp lệ",
      });
    }

    const comment = await Comment.findOne({
      _id: commentId,
      status: "pending_delete",
    });

    if (!comment) {
      return res.status(404).json({
        code: 404,
        message: "Comment không ở trạng thái có thể hoàn tác",
      });
    }

    const post = await Post.findById(comment.post);

    if (!post || post.status !== "active") {
      return res.status(404).json({
        code: 404,
        message: "Bài viết không tồn tại",
      });
    }

    const isCommentOwner = comment.user.toString() === userId.toString();
    const isPostOwner = post.author.toString() === userId.toString();

    if (!isCommentOwner && !isPostOwner) {
      return res.status(403).json({
        code: 403,
        message: "Bạn không có quyền hoàn tác xóa comment này",
      });
    }

    if (!comment.canUndoUntil || new Date() > new Date(comment.canUndoUntil)) {
      return res.status(400).json({
        code: 400,
        message: "Đã hết thời gian hoàn tác",
      });
    }

    comment.status = "active";
    comment.pendingDeleteAt = null;
    comment.canUndoUntil = null;
    await comment.save();
    if (comment.parentComment) {
      await Comment.updateOne(
        { _id: comment.parentComment },
        { $inc: { repliesCount: 1 } },
      );
    }
    const restoredComment = await Comment.findById(comment._id)
      .populate("user", "fullName username avatar isVerified")
      .populate("replyToUser", "fullName username avatar isVerified")
      .populate("mentions", "fullName username avatar isVerified");
    const roomName = `post:${comment.post.toString()}`;

    global._io.to(roomName).emit("SERVER_RETURN_UNDO_DELETE_COMMENT", {
      postId: comment.post.toString(),
      comment: restoredComment,
    });

    return res.status(200).json({
      code: 200,
      message: "Hoàn tác xóa comment thành công",
      data: restoredComment,
    });
  } catch (error) {
    console.error("undoDeleteComment error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

module.exports.toggleLikeComment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        code: 400,
        message: "ID comment không hợp lệ",
      });
    }

    const comment = await Comment.findOne({
      _id: commentId,
      status: "active",
    });

    if (!comment) {
      return res.status(404).json({
        code: 404,
        message: "Comment không tồn tại",
      });
    }

    const post = await Post.findById(comment.post).populate(
      "author",
      "followers following",
    );

    if (!post || post.status !== "active") {
      return res.status(404).json({
        code: 404,
        message: "Bài viết không tồn tại",
      });
    }

    const canView = canViewPost(post, userId, post.author);

    if (!canView) {
      return res.status(403).json({
        code: 403,
        message: "Bạn không có quyền thích comment này",
      });
    }

    const existedLike = await CommentLike.findOne({
      comment: commentId,
      user: userId,
    });

    let isLiked = false;
    let incValue = 1;

    if (existedLike) {
      await CommentLike.deleteOne({ _id: existedLike._id });
      isLiked = false;
      incValue = -1;
    } else {
      await CommentLike.create({
        comment: commentId,
        user: userId,
      });
      isLiked = true;
      incValue = 1;
    }

    let updatedComment;

    if (incValue === -1) {
      updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        [
          {
            $set: {
              likesCount: {
                $max: [{ $subtract: ["$likesCount", 1] }, 0],
              },
            },
          },
        ],
        { new: true },
      ).select("_id post parentComment likesCount");
    } else {
      updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        { $inc: { likesCount: 1 } },
        { new: true },
      ).select("_id post parentComment likesCount");
    }

    const roomName = `post:${comment.post.toString()}`;

    return res.status(200).json({
      code: 200,
      message: isLiked ? "Đã thích comment" : "Đã bỏ thích comment",
      data: {
        commentId: comment._id,
        likesCount: updatedComment.likesCount,
        isLiked,
      },
    });
  } catch (error) {
    console.error("toggleLikeComment error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

module.exports.pinComment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        code: 400,
        message: "ID comment không hợp lệ",
      });
    }

    const comment = await Comment.findOne({
      _id: commentId,
      status: "active",
      parentComment: null,
    });

    if (!comment) {
      return res.status(404).json({
        code: 404,
        message: "Chỉ có thể ghim comment cha đang hoạt động",
      });
    }

    const post = await Post.findById(comment.post);

    if (!post || post.status !== "active") {
      return res.status(404).json({
        code: 404,
        message: "Bài viết không tồn tại",
      });
    }

    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({
        code: 403,
        message: "Bạn không có quyền ghim comment",
      });
    }

    comment.isPinned = true;
    comment.pinnedAt = new Date();
    await comment.save();

    const updatedComment = await Comment.findById(comment._id)
      .populate("user", "fullName username avatar isVerified")
      .populate("replyToUser", "fullName username avatar isVerified")
      .populate("mentions", "fullName username avatar isVerified");

    global._io
      .to(`post:${comment.post.toString()}`)
      .emit("SERVER_RETURN_PIN_COMMENT", {
        postId: comment.post,
        comment: updatedComment,
      });

    return res.status(200).json({
      code: 200,
      message: "Ghim comment thành công",
      data: updatedComment,
    });
  } catch (error) {
    console.error("pinComment error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

module.exports.unpinComment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        code: 400,
        message: "ID comment không hợp lệ",
      });
    }

    const comment = await Comment.findOne({
      _id: commentId,
      status: "active",
    });

    if (!comment) {
      return res.status(404).json({
        code: 404,
        message: "Comment không tồn tại",
      });
    }

    const post = await Post.findById(comment.post);

    if (!post || post.status !== "active") {
      return res.status(404).json({
        code: 404,
        message: "Bài viết không tồn tại",
      });
    }

    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({
        code: 403,
        message: "Bạn không có quyền bỏ ghim comment",
      });
    }

    comment.isPinned = false;
    comment.pinnedAt = null;
    await comment.save();

    global._io
      .to(`post:${comment.post.toString()}`)
      .emit("SERVER_RETURN_UNPIN_COMMENT", {
        postId: comment.post,
        commentId: comment._id,
      });

    return res.status(200).json({
      code: 200,
      message: "Bỏ ghim comment thành công",
      data: {
        commentId: comment._id,
        isPinned: false,
      },
    });
  } catch (error) {
    console.error("unpinComment error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

module.exports.getRepliesByComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const viewerId = req.user._id;

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        code: 400,
        message: "ID comment không hợp lệ",
      });
    }

    const parentComment = await Comment.findById(commentId);

    if (!parentComment || parentComment.status === "deleted") {
      return res.status(404).json({
        code: 404,
        message: "Comment cha không tồn tại",
      });
    }
    if (parentComment.parentComment) {
      return res.status(400).json({
        code: 400,
        message: "Chỉ có thể lấy phản hồi từ comment cha",
      });
    }
    const post = await Post.findById(parentComment.post).populate(
      "author",
      "followers following",
    );

    if (!post || post.status !== "active") {
      return res.status(404).json({
        code: 404,
        message: "Bài viết không tồn tại",
      });
    }

    const canView = canViewPost(post, viewerId, post.author);

    if (!canView) {
      return res.status(403).json({
        code: 403,
        message: "Bạn không có quyền xem phản hồi",
      });
    }

    const isPostOwner = post.author._id.toString() === viewerId.toString();
    const visibleStatuses = isPostOwner ? ["active", "hidden"] : ["active"];

    const replies = await Comment.find({
      post: parentComment.post,
      parentComment: parentComment._id,
      status: { $in: visibleStatuses },
    })
      .populate("user", "fullName username avatar isVerified")
      .populate("replyToUser", "fullName username avatar isVerified")
      .populate("mentions", "fullName username avatar isVerified")
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);
    const replyIds = replies.map((r) => r._id);

    const likedReplies = await CommentLike.find({
      comment: { $in: replyIds },
      user: viewerId,
    }).select("comment");

    const likedReplySet = new Set(
      likedReplies.map((item) => item.comment.toString()),
    );

    const authorLikedReplies = await CommentLike.find({
      comment: { $in: replyIds },
      user: post.author._id,
    }).select("comment");

    const authorLikedReplySet = new Set(
      authorLikedReplies.map((item) => item.comment.toString()),
    );
    const total = await Comment.countDocuments({
      post: parentComment.post,
      parentComment: parentComment._id,
      status: { $in: visibleStatuses },
    });

    return res.status(200).json({
      code: 200,
      message: "Lấy danh sách phản hồi thành công",
      data: replies.map((reply) => ({
        ...reply.toObject(),
        isLiked: likedReplySet.has(reply._id.toString()),
        isLikedByPostAuthor: authorLikedReplySet.has(reply._id.toString()),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("getRepliesByComment error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

module.exports.toggleAllowComments = async (req, res) => {
  try {
    const userId = req.user._id;
    const { postId } = req.params;
    const { allowComments } = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        code: 400,
        message: "ID bài viết không hợp lệ",
      });
    }

    if (typeof allowComments !== "boolean") {
      return res.status(400).json({
        code: 400,
        message: "allowComments phải là true hoặc false",
      });
    }

    const post = await Post.findOne({
      _id: postId,
      status: "active",
    });

    if (!post) {
      return res.status(404).json({
        code: 404,
        message: "Bài viết không tồn tại",
      });
    }

    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({
        code: 403,
        message: "Bạn không có quyền thay đổi cài đặt bình luận",
      });
    }

    post.allowComments = allowComments;
    await post.save();

    global._io.to(`post:${postId}`).emit("SERVER_RETURN_TOGGLE_COMMENTS", {
      postId,
      allowComments,
    });

    return res.status(200).json({
      code: 200,
      message: allowComments ? "Đã bật bình luận" : "Đã tắt bình luận",
      data: {
        postId: post._id,
        allowComments: post.allowComments,
      },
    });
  } catch (error) {
    console.error("toggleAllowComments error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server",
      error: error.message,
    });
  }
};
