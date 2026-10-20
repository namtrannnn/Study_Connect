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
      required: false,
      default: null,
    },

    type: {
      type: String,
      enum: [
        "follow",
        "follow_request",
        "follow_accept",
        "friend_request",
        "friend_accept",
        "post_like",
        "post_comment",
        "comment_reply",
        "mention",
        "study_room_invite",
        "story_reply",
        "STORY_REPLY",
        "moderation_approved",
        "moderation_rejected",
        "appeal_approved",
        "appeal_rejected",
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
      enum: ["user", "post", "comment", "roomChat", "studyRoom", "story", "Story", null],
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
