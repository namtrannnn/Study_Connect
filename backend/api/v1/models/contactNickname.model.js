const mongoose = require("mongoose");

// Lưu biệt danh mà ownerId đặt cho targetId
// Chỉ ownerId thấy, targetId không biết
const contactNicknameSchema = new mongoose.Schema(
  {
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    target_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    nickname: {
      type: String,
      default: "",
      trim: true,
      maxlength: 50,
    },
  },
  { timestamps: true },
);

// Mỗi cặp owner-target chỉ có 1 record
contactNicknameSchema.index({ owner_id: 1, target_id: 1 }, { unique: true });

const ContactNickname = mongoose.model("ContactNickname", contactNicknameSchema, "contact-nicknames");
module.exports = ContactNickname;
