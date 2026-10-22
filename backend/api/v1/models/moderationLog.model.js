const mongoose = require("mongoose");

const moderationLogSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      index: true,
    },

    moderationRunId: {
      type: String,
      required: true,
      index: true,
    },

    contentVersion: {
      type: Number,
      required: true,
      default: 1,
    },

    pipelineVersion: {
      type: String,
      default: "v1.0.0",
    },

    modelVersion: {
      type: String,
      default: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    },

    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },

    action: {
      type: String,
      enum: ["allow", "hold", "hide", "block", "approve", "reject"],
      required: true,
    },

    source: {
      type: String,
      enum: ["rule", "nsfwjs", "gemini", "human", "system"],
      required: true,
    },

    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },

    overallRisk: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },

    categories: {
      sexual: { type: Number, min: 0, max: 1, default: 0 },
      violence: { type: Number, min: 0, max: 1, default: 0 },
      harassment: { type: Number, min: 0, max: 1, default: 0 },
      hate: { type: Number, min: 0, max: 1, default: 0 },
      scam: { type: Number, min: 0, max: 1, default: 0 },
      spam: { type: Number, min: 0, max: 1, default: 0 },
    },

    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },

    reason: {
      type: String,
      default: "",
    },

    reasonCode: {
      type: String,
      enum: [
        "SCAM_LINK",
        "SEXUAL_CONTENT",
        "VIOLENCE",
        "HARASSMENT",
        "HATE",
        "SPAM_FLOOD",
        "BLACKLISTED_HASH",
        "MALICIOUS_DOMAIN",
        "HUMAN_REVIEW",
        "SYSTEM_FAILURE",
        "STALE_RESULT",
        "POST_DELETED",
      ],
    },

    evidence: {
      type: [String],
      default: [],
    },

    ruleId: String,

    stage: {
      type: String,
      enum: ["T1", "T2", "T3", "DECISION", "T4", "SYSTEM"],
      default: "DECISION",
    },

    processingTimeMs: Number,

    previousStatus: String,

    newStatus: String,

    errorCode: String,

    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  },
  {
    timestamps: true,
  }
);

moderationLogSchema.index({ postId: 1, createdAt: -1 });
moderationLogSchema.index({ userId: 1, createdAt: -1 });
moderationLogSchema.index({ action: 1, createdAt: -1 });

const ModerationLog = mongoose.model("moderationLog", moderationLogSchema, "moderation_logs");

module.exports = ModerationLog;
