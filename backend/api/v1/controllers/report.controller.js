const Report = require("../models/report.model");
const Post = require("../models/post.model");
const PostComment = require("../models/postComment.model");
const User = require("../models/user.model");
const mongoose = require("mongoose");
const { analyzeContentWithAI } = require("../services/aiModeration.service");

/**
 * Xử lý kiểm duyệt báo cáo thông minh ngầm:
 * - Ngưỡng 1: Từ >= 2 báo cáo (hoặc 1 báo cáo nếu khiêu dâm 18+/bạo lực) -> Tự động gọi Gemini AI quét ngầm
 * - Ngưỡng 2: Từ >= 3 báo cáo VÀ AI xác nhận độc hại >= 65% -> Tự động tạm ẩn bài viết (status: hidden)
 */
async function handleAutoReportModeration({ target_type, target_id, reasonCategory, reason }) {
  try {
    // 1. Đếm số lượng báo cáo chờ xử lý đối với target này
    const pendingReports = await Report.find({
      target_id,
      target_type,
      status: "pending",
      deleted: false,
    });
    const reportCount = pendingReports.length;

    // Ngưỡng 1: Từ 2 người báo cáo trở lên HOẶC lý do khẩn cấp (khiêu dâm 18+, bạo lực)
    const isUrgentCategory = ["sexual_content", "violence"].includes(reasonCategory);
    const shouldTriggerAI = reportCount >= 2 || isUrgentCategory;

    let aiResult = null;

    if (shouldTriggerAI) {
      // Kiểm tra xem target này đã từng được phân tích AI gần đây chưa để tái sử dụng
      const existingAnalyzed = pendingReports.find(
        (r) => r.aiAnalysis && r.aiAnalysis.analyzedAt && r.aiAnalysis.toxicScore !== undefined && r.aiAnalysis.toxicScore > 0
      );

      if (existingAnalyzed && existingAnalyzed.aiAnalysis) {
        aiResult = existingAnalyzed.aiAnalysis;
      } else {
        let textToAnalyze = "";
        if (target_type === "post") {
          const post = await Post.findById(target_id);
          textToAnalyze = post ? `${post.title || ""} ${post.content || ""}` : "";
        } else if (target_type === "comment") {
          const comment = await PostComment.findById(target_id);
          textToAnalyze = comment ? comment.content : "";
        } else if (target_type === "user") {
          const u = await User.findById(target_id);
          textToAnalyze = u ? `${u.fullName || ""} ${u.bio || ""}` : "";
        }

        console.log(`[Auto Report AI] 🤖 Kích hoạt Gemini AI quét ngầm cho ${target_type} ${target_id} (${reportCount} lượt báo cáo)`);
        aiResult = await analyzeContentWithAI(textToAnalyze, reason, reasonCategory);
      }

      // Cập nhật kết quả AI cho toàn bộ các báo cáo pending của target này
      if (aiResult) {
        await Report.updateMany(
          { target_id, target_type, status: "pending", deleted: false },
          {
            $set: {
              aiAnalysis: {
                toxicScore: aiResult.toxicScore ?? 0,
                category: aiResult.category || "normal",
                summary: aiResult.summary || "Đã phân tích tự động bằng Gemini AI",
                suggestedAction: aiResult.suggestedAction || "none",
                analyzedAt: new Date(),
              },
            },
          }
        );
      }
    }

    // Ngưỡng 2: Tự động can thiệp bảo vệ cộng đồng (Auto-Hide)
    // - Trường hợp A: Đạt >= 3 báo cáo VÀ (AI đánh giá độc hại >= 65% HOẶC suggestedAction === 'hide_post')
    // - Trường hợp B: Vi phạm đặc biệt nghiêm trọng (18+, bạo lực) và AI chấm độc hại >= 80%
    const isExtremeViolation = aiResult && aiResult.toxicScore >= 80 && isUrgentCategory;
    const isCrowdReportViolation =
      reportCount >= 3 && aiResult && (aiResult.toxicScore >= 65 || aiResult.suggestedAction === "hide_post");

    if (isExtremeViolation || isCrowdReportViolation) {
      if (target_type === "post") {
        const post = await Post.findById(target_id);
        if (post && post.status !== "hidden" && post.status !== "deleted") {
          await Post.findByIdAndUpdate(target_id, {
            $set: {
              status: "hidden",
            },
          });
          console.log(
            `[Auto Report Protection] 🛡️ Đã TỰ ĐỘNG TẠM ẨN bài viết ${target_id} (${reportCount} báo cáo, ${aiResult?.toxicScore}% độc hại)`
          );
        }
      } else if (target_type === "comment") {
        const comment = await PostComment.findById(target_id);
        if (comment && !comment.deleted) {
          await PostComment.findByIdAndUpdate(target_id, {
            $set: {
              deleted: true,
            },
          });
          console.log(
            `[Auto Report Protection] 🛡️ Đã TỰ ĐỘNG TẠM ẨN bình luận ${target_id} (${reportCount} báo cáo, ${aiResult?.toxicScore}% độc hại)`
          );
        }
      }
    }
  } catch (autoErr) {
    console.error("[handleAutoReportModeration error]:", autoErr);
  }
}

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

    // Kích hoạt cơ chế kiểm duyệt báo cáo thông minh ngầm (non-blocking)
    setImmediate(() => {
      handleAutoReportModeration({ target_type, target_id, reasonCategory, reason: reason?.trim() || "" });
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
