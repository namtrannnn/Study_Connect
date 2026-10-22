/**
 * DECISION ENGINE (Trọng tài tối cao - Single Source of Truth)
 * Blueprint Section 8: Hội tụ các tín hiệu từ T1, T2, T3 để ra quyết định cuối cùng cho bài viết.
 */

function determineReasonCode(categories = {}, defaultCode = "HUMAN_REVIEW") {
  const {
    sexual = 0,
    scam = 0,
    violence = 0,
    harassment = 0,
    hate = 0,
    spam = 0,
  } = categories;

  const max = Math.max(sexual, scam, violence, harassment, hate, spam);
  if (max < 0.4) return defaultCode;

  if (max === sexual) return "SEXUAL_CONTENT";
  if (max === scam) return "SCAM_LINK";
  if (max === violence) return "VIOLENCE";
  if (max === harassment) return "HARASSMENT";
  if (max === hate) return "HATE";
  if (max === spam) return "SPAM_FLOOD";

  return defaultCode;
}

/**
 * Đánh giá tổng hợp và đưa ra quyết định Moderation
 *
 * @param {Object} param0
 * @param {Object} [param0.t1] - Tín hiệu Tầng 1 (Fast Regex / pHash)
 * @param {Object} [param0.t2] - Tín hiệu Tầng 2 (Local Vision / OCR)
 * @param {Object} [param0.t3] - Tín hiệu Tầng 3 (Gemini Multimodal)
 * @returns {Object} Quyết định theo Decision Output Contract
 */
function evaluateFinalDecision({ t1 = null, t2 = null, t3 = null } = {}) {
  // 1. Kiểm tra Deterministic Hard Violation (Tầng 1 hoặc Tầng 2)
  if (t1 && !t1.isAllowed) {
    return {
      action: "block",
      status: "hidden",
      moderationStatus: "rejected",
      moderationSource: "rule",
      overallRisk: 1.0,
      reasonCode: t1.category === "SCAM_FRAUD" ? "SCAM_LINK" : "BLACKLISTED_HASH",
      reason: t1.reason || "Vi phạm quy chuẩn cấm tuyệt đối (Tầng 1)",
      evidence: [t1.reason || "t1_hard_violation"],
      categories: {
        sexual: 0,
        violence: 0,
        harassment: 0,
        hate: 0,
        scam: 1.0,
        spam: 0,
      },
      severity: "high",
    };
  }

  if (t2 && !t2.isAllowed) {
    return {
      action: "block",
      status: "hidden",
      moderationStatus: "rejected",
      moderationSource: "rule",
      overallRisk: 1.0,
      reasonCode: "HUMAN_REVIEW",
      reason: t2.reason || "Vi phạm quy chuẩn kiểm tra hình ảnh cục bộ (Tầng 2)",
      evidence: [t2.reason || "t2_hard_violation"],
      categories: {
        sexual: 0,
        violence: 0,
        harassment: 0,
        hate: 0,
        scam: 0,
        spam: 1.0,
      },
      severity: "high",
    };
  }

  // 2. Nếu không có tín hiệu Tầng 3 (chưa quét xong hoặc lỗi), không tự ý quyết định
  if (!t3) {
    return {
      action: "hold",
      status: "processing",
      moderationStatus: "pending",
      moderationSource: "system",
      overallRisk: 0,
      reasonCode: "HUMAN_REVIEW",
      reason: "Đang chờ phân tích ngữ cảnh Tầng 3",
      evidence: [],
      categories: {},
      severity: "low",
    };
  }

  const overallRisk = typeof t3.overallRisk === "number" ? t3.overallRisk : 0;
  const categories = t3.categories || {};
  const evidence = Array.isArray(t3.evidence) ? t3.evidence : [];

  // 3. Phân ngưỡng theo Decision Matrix V1 (Blueprint Section 8.3 & 8.5)
  if (overallRisk < 0.40) {
    // [ALLOW] An toàn -> Cho phép công khai lên Feed
    return {
      action: "allow",
      status: "active",
      moderationStatus: "approved",
      moderationSource: "system",
      overallRisk,
      reasonCode: undefined,
      reason: t3.reason || "Nội dung an toàn, phù hợp quy chuẩn cộng đồng",
      evidence,
      categories,
      severity: "low",
    };
  }

  if (overallRisk < 0.80) {
    // [REVIEW] Vùng xám (40% - 79%) -> Đưa vào hàng chờ Admin duyệt tay
    return {
      action: "hold",
      status: "pending_admin",
      moderationStatus: "review",
      moderationSource: "system",
      overallRisk,
      reasonCode: determineReasonCode(categories, "HUMAN_REVIEW"),
      reason: t3.reason || `Phát hiện nghi vấn rủi ro ${Math.round(overallRisk * 100)}% cần người thẩm định`,
      evidence,
      categories,
      severity: "medium",
    };
  }

  // [HIDE] Rủi ro cao (>= 80%) -> Ẩn bài viết
  return {
    action: "hide",
    status: "hidden",
    moderationStatus: "rejected",
    moderationSource: "system",
    overallRisk,
    reasonCode: determineReasonCode(categories, "SCAM_LINK"),
    reason: t3.reason || `AI tự động phát hiện vi phạm nghiêm trọng (${Math.round(overallRisk * 100)}%)`,
    evidence,
    categories,
    severity: "high",
  };
}

module.exports = {
  evaluateFinalDecision,
  determineReasonCode,
};
