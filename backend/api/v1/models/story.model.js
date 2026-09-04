const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    // image | video | post (share bài viết)
    type: {
      type: String,
      enum: ["image", "video", "post"],
      required: true,
    },

    // Dùng cho story tự đăng
    media: {
      url: { type: String, default: "", trim: true },
      public_id: { type: String, default: "", trim: true },
      type: {
        type: String,
        enum: ["image", "video", ""],
        default: "",
      },
      thumbnail: { type: String, default: "", trim: true },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
    },

    // Dùng khi share post lên story
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
      default: null,
    },

    caption: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    background: {
      type: {
        type: String,
        enum: ["media", "color"],
        default: "media",
      },
      color: {
        type: String,
        default: "#1877F2",
      },
    },

    textOverlays: [
      {
        text: { type: String, default: "" },
        fontFamily: { type: String, default: "sans-serif" },
        fontSize: { type: Number, default: 24 },
        color: { type: String, default: "#ffffff" },
        isBold: { type: Boolean, default: false },
        isItalic: { type: Boolean, default: false },
        position: {
          x: { type: Number, default: 50 }, // % X (0-100)
          y: { type: Number, default: 50 }, // % Y (0-100)
        },
      },
    ],

    music: {
      url: { type: String, default: "", trim: true },
      title: { type: String, default: "", trim: true },
      artist: { type: String, default: "", trim: true },
      source: {
        type: String,
        enum: ["upload", "jamendo", "none"],
        default: "none",
      },
      startTime: { type: Number, default: 0 },
      duration: { type: Number, default: 15 },
    },

    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],

    // Chế độ xem (giống Post)
    visibility: {
      type: String,
      enum: ["public", "followers", "friends", "private", "custom"],
      default: "followers",
    },

    // Chỉ dùng khi visibility = custom
    allowedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],

    // Người đã xem
    viewers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    viewersCount: {
      type: Number,
      default: 0,
    },

    // Cho phép reply / share
    allowReply: {
      type: Boolean,
      default: true,
    },

    allowShare: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      enum: ["active", "expired", "deleted"],
      default: "active",
    },

    // Tự hết hạn sau 24h
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index tối ưu
storySchema.index({ author: 1, createdAt: -1 });

// Auto delete khi hết hạn
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Story = mongoose.model("story", storySchema, "stories");

module.exports = Story;
