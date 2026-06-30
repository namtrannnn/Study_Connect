const mongoose = require("mongoose");

const commentLikeSchema = new mongoose.Schema(
  {
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "comment",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true },
);

commentLikeSchema.index({ comment: 1, user: 1 }, { unique: true });
commentLikeSchema.index({ comment: 1, createdAt: -1 });

const CommentLike = mongoose.model(
  "commentLike",
  commentLikeSchema,
  "comment_likes",
);

module.exports = CommentLike;
