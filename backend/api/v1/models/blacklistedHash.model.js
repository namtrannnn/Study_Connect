const mongoose = require("mongoose");

const blacklistedHashSchema = new mongoose.Schema(
  {
    hash: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    reason: {
      type: String,
      default: "Hình ảnh vi phạm tiêu chuẩn cộng đồng",
      trim: true,
    },
    category: {
      type: String,
      default: "SCAM_FRAUD",
    },
  },
  { timestamps: true }
);

const BlacklistedHash = mongoose.model("blacklistedHash", blacklistedHashSchema, "blacklisted_hashes");

module.exports = BlacklistedHash;
