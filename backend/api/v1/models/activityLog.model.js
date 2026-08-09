const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    action: {
      type: String,
      required: true, // e.g. "ban_user", "unban_user", "delete_post", "hide_post", "delete_comment", "blacklist_hashtag", "resolve_report"
    },
    target_type: {
      type: String,
      enum: ["user", "post", "comment", "hashtag", "report"],
      required: true,
    },
    target_id: {
      type: String,
      default: "",
    },
    details: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema, "activity_logs");
module.exports = ActivityLog;
