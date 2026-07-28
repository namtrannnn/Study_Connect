const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    tokenVersion: {
      type: Number,
      default: 0,
    },

    avatar: {
      type: String,
      default:
        "https://res.cloudinary.com/dn2u3dcrh/image/upload/v1778744158/users/user_somhbs.png",
    },

    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    statusOnline: {
      type: String,
      enum: ["online", "offline", "away"],
      default: "offline",
    },

    pendingFollowRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],

    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],

    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],

    deleted: {
      type: Boolean,
      default: false,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    bio: {
      type: String,
      default: "",
      maxlength: 150,
    },

    headline: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
    },

    fieldOfStudy: {
      type: String,
      enum: [
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
      ],
      default: "other",
    },

    skills: [
      {
        type: String,
        trim: true,
      },
    ],

    interests: [
      {
        type: String,
        enum: [
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
        ],
      },
    ],

    portfolioLinks: [
      {
        title: {
          type: String,
          default: "",
          trim: true,
        },
        url: {
          type: String,
          default: "",
          trim: true,
        },
        type: {
          type: String,
          enum: [
            "github",
            "linkedin",
            "behance",
            "figma",
            "portfolio",
            "website",
            "facebook",
            "other",
          ],
          default: "other",
        },
      },
    ],

    postsCount: {
      type: Number,
      default: 0,
    },

    followersCount: {
      type: Number,
      default: 0,
    },

    followingCount: {
      type: Number,
      default: 0,
    },

    isPrivate: {
      type: Boolean,
      default: false,
    },

    lastSelectedAudience: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],

    lastAudienceSetting: {
      type: String,
      enum: ["public", "followers", "friends", "private", "custom"],
      default: "public",
    },

    pinnedPosts: [
      {
        post: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "post",
        },
        pinnedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("user", userSchema, "users");

module.exports = User;
