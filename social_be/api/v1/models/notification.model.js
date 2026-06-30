const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    type: {
      type: String,
      enum: [
        "friend_request",
        "friend_accept",
        "post_like",
        "post_comment",
        "comment_reply",
        "mention",
      ],
      required: true,
    },

    title: {
      type: String,
      default: "",
    },

    message: {
      type: String,
      required: true,
    },

    refId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    refType: {
      type: String,
      enum: ["user", "post", "comment", "roomChat", null],
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const Notification = mongoose.model(
  "notification",
  notificationSchema,
  "notifications",
);

module.exports = Notification;
