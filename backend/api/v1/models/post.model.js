const mongoose = require("mongoose");

const quizAnswerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    optionIndex: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true, _id: false },
);

const quizSchema = new mongoose.Schema(
  {
    options: [
      {
        text: { type: String, required: true, trim: true },
        votesCount: { type: Number, default: 0 },
      },
    ],
    correctOption: {
      type: Number,
      required: true,
    },
    explanation: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
    answers: [quizAnswerSchema],
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


const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    postType: {
      type: String,
      enum: ["normal", "quiz"],
      default: "normal",
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

    question: {
      type: questionSchema,
      default: undefined,
    },

    quiz: {
      type: quizSchema,
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
