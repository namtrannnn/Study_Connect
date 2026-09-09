const mongoose = require("mongoose");

const storyHighlightSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    coverImage: {
      type: String,
      default: "",
      trim: true,
    },

    stories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "story",
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Index tối ưu
storyHighlightSchema.index({ author: 1, createdAt: -1 });

const StoryHighlight = mongoose.model(
  "storyHighlight",
  storyHighlightSchema,
  "storyHighlights",
);

module.exports = StoryHighlight;
