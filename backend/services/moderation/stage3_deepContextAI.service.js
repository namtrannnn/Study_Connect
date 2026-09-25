const apiKey =
  process.env.GOOGLE_GEMINI_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();

/**
 * TẦNG 3: DEEP CONTEXT AI & RISK CONFIDENCE SCORER (Chạy ngầm)
 * Sử dụng Gemini 3.6 Flash để phân tích sâu ngữ cảnh và tính Điểm Rủi Ro (Risk Score 0 - 100%).
 */
async function evaluateDeepContextAndRiskScore({ text = "", mediaUrls = [] } = {}) {
  if (!apiKey) {
    console.warn("[Stage 3 AI Warning]: Chưa có GEMINI_API_KEY. Mặc định trả về An toàn.");
    return { riskScore: 0, category: "NONE", reason: "", isAllowed: true };
  }

  try {
    const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

    const promptText = `
Bạn là "StudyConnect Deep AI Moderator" - Hệ thống phân tích sâu ngữ cảnh bài viết sinh viên.

Nhiệm vụ: Phân tích VĂN BẢN và HÌNH ẢNH của bài viết để tính ĐIỂM RỦI RO (Risk Score từ 0 đến 100).

Các danh mục vi phạm:
1. SCAM_FRAUD: Lừa đảo, dụ dỗ nạp/chuyển tiền, cá độ, cờ bạc, đa cấp, bán đề thi/bằng cấp giả.
2. VIOLENCE_GORE: Bạo lực, máu me, thương tích nặng, vũ khí, tự hại.
3. NSFW_SEXUAL: Khiêu dâm, đồi trụy, khỏa thân.
4. TOXIC_HATE: Xúc phạm nghiêm trọng, đe dọa, ngôn từ thù ghét, bắt nạt.
5. SPAM: Quảng cáo rác không liên quan đến học tập/sinh viên.

Văn bản bài viết:
"""${text.trim() || "(Không có văn bản)"}"""

YÊU CẦU BẮT BUỘC: Trả về DUY NHẤT một chuỗi JSON (responseMimeType: application/json):
{
  "riskScore": number,          // Điểm rủi ro từ 0 đến 100
  "category": "NONE" | "SCAM_FRAUD" | "VIOLENCE_GORE" | "NSFW_SEXUAL" | "TOXIC_HATE" | "SPAM",
  "reason": "Giải thích ngắn gọn bằng tiếng Việt"
}
`;

    const parts = [{ text: promptText }];

    const requestBody = {
      contents: [{ parts }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    const data = await response.json();

    if (data?.error) {
      console.error("[Stage 3 AI Error]:", data.error.message);
      return { riskScore: 0, category: "NONE", reason: "", isAllowed: true };
    }

    const candidate = data?.candidates?.[0];
    const finishReason = candidate?.finishReason;

    if (finishReason === "SAFETY" || finishReason === "RECITATION") {
      return {
        riskScore: 95,
        category: "SAFETY",
        reason: "Gemini phát hiện cờ SAFETY vi phạm tiêu chuẩn an toàn.",
        isAllowed: false,
      };
    }

    let rawText = candidate?.content?.parts?.[0]?.text || "";
    rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();

    const parsed = JSON.parse(rawText);
    const riskScore = typeof parsed.riskScore === "number" ? parsed.riskScore : 0;

    return {
      riskScore,
      category: parsed.category || "NONE",
      reason: parsed.reason || "",
      isAllowed: riskScore < 40,
    };
  } catch (error) {
    console.error("[Stage 3 System Error]:", error.message);
    return { riskScore: 0, category: "NONE", reason: "", isAllowed: true };
  }
}

module.exports = {
  evaluateDeepContextAndRiskScore,
};
