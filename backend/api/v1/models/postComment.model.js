const mongoose = require("mongoose");

const commentEditHistorySchema = new mongoose.Schema(
  {
    oldContent: {
      type: String,
      trim: true,
      default: "",
    },
    editedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    // Comment cha đầu tiên để gom thread 2 cấp
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "comment",
      default: null,
    },

    // Comment cụ thể đang được reply
    replyToComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "comment",
      default: null,
    },

    // User cụ thể đang được reply
    replyToUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },

    // Những user được tag trong nội dung @username
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],

    likesCount: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["active", "hidden", "pending_delete", "deleted"],
      default: "active",
    },

    isEdited: {
      type: Boolean,
      default: false,
    },

    editedAt: {
      type: Date,
      default: null,
    },

    editHistory: {
      type: [commentEditHistorySchema],
      default: [],
    },

    pendingDeleteAt: {
      type: Date,
      default: null,
    },

    canUndoUntil: {
      type: Date,
      default: null,
    },
    repliesCount: {
      type: Number,
      default: 0,
    },

    isPinned: {
      type: Boolean,
      default: false,
    },

    pinnedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

commentSchema.index({
  post: 1,
  parentComment: 1,
  status: 1,
  isPinned: -1,
  pinnedAt: -1,
  createdAt: -1,
});

commentSchema.index({ parentComment: 1, status: 1, createdAt: 1 });
commentSchema.index({ likesCount: -1, createdAt: -1 });

const Comment = mongoose.model("comment", commentSchema, "comments");
module.exports = Comment;
