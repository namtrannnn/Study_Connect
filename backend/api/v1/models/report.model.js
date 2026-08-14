const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reporter_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    target_type: {
      type: String,
      enum: ["post", "comment", "user"],
      required: true,
    },
    target_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    reasonCategory: {
      type: String,
      enum: [
        "spam",
        "violence",
        "harassment",
        "hate_speech",
        "misinformation",
        "sexual_content",
        "other",
      ],
      default: "other",
    },
    reason: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "resolved", "dismissed"],
      default: "pending",
    },
    aiAnalysis: {
      toxicScore: { type: Number, default: 0 },
      category: { type: String, default: "normal" }, // spam, hate_speech, harassment, violence, normal
      summary: { type: String, default: "" },
      suggestedAction: { type: String, default: "none" }, // hide_post, warn_user, ban_user, dismiss
      analyzedAt: { type: Date },
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
    resolvedAction: {
      type: String,
      default: null,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Report = mongoose.model("Report", reportSchema, "reports");
module.exports = Report;
