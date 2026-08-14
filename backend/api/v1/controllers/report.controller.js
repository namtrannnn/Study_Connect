const Report = require("../models/report.model");
const Post = require("../models/post.model");
const PostComment = require("../models/postComment.model");
const User = require("../models/user.model");
const mongoose = require("mongoose");

// [POST] /api/v1/report
module.exports.createReport = async (req, res) => {
  try {
    const reporterId = req.user._id;
    const { target_type, target_id, reasonCategory, reason } = req.body;

    // Validate
    if (!["post", "comment", "user"].includes(target_type)) {
      return res.status(400).json({ message: "Loại đối tượng không hợp lệ" });
    }
    if (!mongoose.Types.ObjectId.isValid(target_id)) {
      return res.status(400).json({ message: "ID đối tượng không hợp lệ" });
    }
    const validCategories = ["spam", "violence", "harassment", "hate_speech", "misinformation", "sexual_content", "other"];
    if (!validCategories.includes(reasonCategory)) {
      return res.status(400).json({ message: "Phân loại vi phạm không hợp lệ" });
    }

    // Check target exists
    let target = null;
    if (target_type === "post") target = await Post.findById(target_id);
    else if (target_type === "comment") target = await PostComment.findById(target_id);
    else if (target_type === "user") target = await User.findById(target_id);

    if (!target) {
      return res.status(404).json({ message: "Không tìm thấy đối tượng bị báo cáo" });
    }

    // Prevent self-report for user type
    if (target_type === "user" && String(target_id) === String(reporterId)) {
      return res.status(400).json({ message: "Không thể báo cáo chính mình" });
    }

    // Prevent duplicate pending report
    const existing = await Report.findOne({
      reporter_id: reporterId,
      target_id,
      target_type,
      status: "pending",
      deleted: false,
    });
    if (existing) {
      return res.status(409).json({ message: "Bạn đã báo cáo nội dung này rồi" });
    }

    const report = await Report.create({
      reporter_id: reporterId,
      target_type,
      target_id,
      reasonCategory,
      reason: reason?.trim() || "",
    });

    return res.status(201).json({
      code: 201,
      message: "Đã gửi báo cáo thành công. Chúng tôi sẽ xem xét trong thời gian sớm nhất.",
      data: { _id: report._id },
    });
  } catch (error) {
    console.error("createReport error:", error);
    return res.status(500).json({ message: "Gửi báo cáo thất bại" });
  }
};
