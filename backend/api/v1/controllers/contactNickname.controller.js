const ContactNickname = require("../models/contactNickname.model");
const mongoose = require("mongoose");

// [PATCH] /api/v1/contact-nickname/:targetId
// Đặt hoặc cập nhật biệt danh cho targetId
module.exports.setNickname = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const { targetId } = req.params;
    const { nickname } = req.body;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ code: 400, message: "targetId không hợp lệ" });
    }
    if (typeof nickname !== "string") {
      return res.status(400).json({ code: 400, message: "nickname không hợp lệ" });
    }
    if (nickname.trim().length > 50) {
      return res.status(400).json({ code: 400, message: "Biệt danh tối đa 50 ký tự" });
    }
    if (ownerId.toString() === targetId) {
      return res.status(400).json({ code: 400, message: "Không thể đặt biệt danh cho chính mình" });
    }

    const record = await ContactNickname.findOneAndUpdate(
      { owner_id: ownerId, target_id: targetId },
      { $set: { nickname: nickname.trim() } },
      { upsert: true, new: true },
    );

    return res.status(200).json({
      code: 200,
      message: nickname.trim() ? "Đã đặt biệt danh" : "Đã xóa biệt danh",
      data: { targetId, nickname: record.nickname },
    });
  } catch (error) {
    console.error("setNickname error:", error);
    return res.status(500).json({ code: 500, message: "FAILED!" });
  }
};

// [GET] /api/v1/contact-nickname
// Lấy tất cả biệt danh của người dùng hiện tại
module.exports.getMyNicknames = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const records = await ContactNickname.find({ owner_id: ownerId, nickname: { $ne: "" } }).lean();

    const map = {};
    records.forEach((r) => {
      map[r.target_id.toString()] = r.nickname;
    });

    return res.status(200).json({ code: 200, data: map });
  } catch (error) {
    console.error("getMyNicknames error:", error);
    return res.status(500).json({ code: 500, message: "FAILED!" });
  }
};
