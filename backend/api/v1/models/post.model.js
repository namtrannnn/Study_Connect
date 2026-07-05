const mongoose = require("mongoose");

const linkSchema = new mongoose.Schema(
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
      enum: ["github", "demo", "figma", "document", "website", "other"],
      default: "other",
    },
  },
  { _id: false },
);

const projectSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
    },

    summary: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    tools: [
      {
        type: String,
        trim: true,
      },
    ],

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    status: {
      type: String,
      enum: ["idea", "planning", "in_progress", "completed", "paused"],
      default: "in_progress",
    },

    links: [linkSchema],
  },
  { _id: false },
);

const questionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
      trim: true,
      maxlength: 200,
    },

    detail: {
      type: String,
      default: "",
      trim: true,
      maxlength: 5000,
    },

    isResolved: {
      type: Boolean,
      default: false,
    },

    acceptedComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "comment",
      default: null,
    },
  },
  { _id: false },
);

const learningSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
      trim: true,
      maxlength: 200,
    },

    goal: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },

    progressText: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    resources: [linkSchema],
  },
  { _id: false },
);

const collaborationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
      trim: true,
      maxlength: 200,
    },

    neededRoles: [
      {
        type: String,
        trim: true,
      },
    ],

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    isOpen: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false },
);

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    postType: {
      type: String,
      enum: [
        "normal",
        "project",
        "question",
        "knowledge",
        "learning",
        "collaboration",
        "achievement",
      ],
      default: "normal",
    },

    category: {
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

    caption: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2200,
    },

    media: [
      {
        url: { type: String, required: true, trim: true },
        public_id: { type: String, default: "", trim: true },
        type: {
          type: String,
          enum: ["image", "video"],
          default: "image",
        },
        thumbnail: { type: String, default: "", trim: true },
        width: { type: Number, default: 0 },
        height: { type: Number, default: 0 },
      },
    ],

    location: {
      type: String,
      default: "",
      trim: true,
    },

    hashtags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],

    project: {
      type: projectSchema,
      default: undefined,
    },

    question: {
      type: questionSchema,
      default: undefined,
    },

    learning: {
      type: learningSchema,
      default: undefined,
    },

    collaboration: {
      type: collaborationSchema,
      default: undefined,
    },

    likesCount: {
      type: Number,
      default: 0,
    },

    commentsCount: {
      type: Number,
      default: 0,
    },

    savesCount: {
      type: Number,
      default: 0,
    },

    sharesCount: {
      type: Number,
      default: 0,
    },

    allowComments: {
      type: Boolean,
      default: true,
    },

    hideLikeCount: {
      type: Boolean,
      default: false,
    },

    hideShare: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["active", "hidden", "deleted"],
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

    visibility: {
      type: String,
      enum: ["public", "followers", "friends", "private", "custom"],
      default: "public",
    },

    allowedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],
  },
  {
    timestamps: true,
  },
);

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ postType: 1, createdAt: -1 });
postSchema.index({ category: 1, createdAt: -1 });
postSchema.index({ status: 1, visibility: 1, createdAt: -1 });

const Post = mongoose.model("post", postSchema, "posts");

module.exports = Post;
