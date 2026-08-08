const mongoose = require("mongoose");

const hashtagBlacklistSchema = new mongoose.Schema(
  {
    tag: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  },
  {
    timestamps: true,
  }
);

const HashtagBlacklist = mongoose.model(
  "HashtagBlacklist",
  hashtagBlacklistSchema,
  "hashtag_blacklists"
);
module.exports = HashtagBlacklist;
