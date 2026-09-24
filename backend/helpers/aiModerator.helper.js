const apiKey =
  process.env.GOOGLE_GEMINI_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();

// ----------------------------------------------------
// LỚP 1: FAST KEYWORD FILTER (0ms - Không tốn API)
// ----------------------------------------------------
const BLACKLIST_PATTERNS = [
  // 1. Cờ bạc / Cá độ / Nhà cái (Gồm có dấu, không dấu, teencode, lách ký tự)
  /88\s*b\s*e\s*t/i,
  /k\s*u\s*b\s*e\s*t/i,
  /g\s*o\s*8\s*8/i,
  /s\s*u\s*n\s*w\s*i\s*n/i,
  /(tài\s*xỉu|tai\s*xiu|t4i\s*x1u)/i,
  /(cá\s*độ|ca\s*do|c4\s*d0)\s*(bóng|bong)?/i,
  /(nổ\s*hũ|no\s*hu|n0\s*hu)/i,
  /(kèo\s*nhà\s*cái|keo\s*nha\s*cai)/i,
  /(game\s*đổi\s*thưởng|game\s*doi\s*thuong)/i,
  /(xóc\s*đĩa|xoc\s*dia)/i,

  // 2. Lừa đảo học đường / Gian lận thi cử / Bán đề
  /(bán|ban|b4n)\s*(đề|de|d3)\s*(thi|th1|thj)/i,
  /(chạy\s*điểm|chay\s*diem|ch4y\s*d13m)/i,
  /(làm|lam)\s*(bằng|bang|b4ng)\s*(đại\s*học|dai\s*hoc|b3t)/i,
  /(thi|th1)\s*(hộ|ho|h0)/i,
  /(học|hoc|h0c)\s*(hộ|ho|h0)/i,
  /(bao\s*đậu|bao\s*dau|b40\s*d4u)\s*100%/i,

  // 3. Lừa đảo tài chính / Nạp tiền / Tín dụng đen
  /nạp\s*tiền\s*x\d+/i,
  /nap\s*tien\s*x\d+/i,
  /n4p\s*t13n/i,
  /(chuyển\s*khoản|chuyen\s*khoan)\s*(stk|sô\s*tai\s*khoan)\s*\d+/i,
  /(vay\s*nóng|vay\s*nong|vay\s*tín\s*dụng)/i,

  // 4. Từ chửi thề / Công kích nặng (Acronyms & Teencode)
  /\b(vcl|vkl|dmm|clm|đbrr|vđr|đkm|cmnr)\b/i,
  /(óc\s*chó|oc\s*cho|0c\s*ch0)/i,

  // 5. Nội dung khiêu dâm / Đồi trụy
  /\b(gái\s*gọi|gai\s*goi|g4i\s*g0i)\b/i,
  /\b(link\s*full|l1nk\s*f00l|clip\s*nóng|clip\s*nong)\b/i,
];

function fastRuleCheck(text = "") {
  if (!text) return null;
  for (const pattern of BLACKLIST_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isAllowed: false,
        category: "SCAM_FRAUD",
        reason: "Nội dung chứa từ khóa vi phạm quy chuẩn cộng đồng (lừa đảo/cờ bạc/từ ngữ cấm).",
      };
    }
  }
  return null;
}

// ----------------------------------------------------
// LỚP 2: GEMINI AI MULTIMODAL MODERATION (Text + Images)
// ----------------------------------------------------
/**
 * Kiểm duyệt nội dung bài viết
 * @param {Object} param0 
 * @param {string} param0.text - Nội dung caption hoặc bài viết
 * @param {Array<{buffer: Buffer, mimetype: string}>} param0.files - Danh sách file upload (nếu có)
 * @returns {Promise<{isAllowed: boolean, category: string, reason: string}>}
 */
async function moderatePostContent({ text = "", files = [] } = {}) {
  // Lớp 1: Fast Rule Check
  const fastResult = fastRuleCheck(text);
  if (fastResult) {
    return fastResult;
  }

  // Nếu không có API Key -> Cho qua (Safe Fallback)
  if (!apiKey) {
    console.warn("[AI Moderator Warning]: Chưa cấu hình GEMINI_API_KEY. Bỏ qua bước AI check.");
    return { isAllowed: true, category: "NONE", reason: "" };
  }

  try {
    const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

    const promptText = `
Bạn là "StudyConnect AI Moderator" - Hệ thống kiểm duyệt tự động cho mạng xã hội học tập sinh viên.

Nhiệm vụ: Phân tích VĂN BẢN và HÌNH ẢNH của bài viết đính kèm để phát hiện các vi phạm sau:
1. SCAM_FRAUD: Lừa đảo, dụ dỗ nạp/chuyển tiền, cá độ, cờ bạc, đa cấp, bán đề thi/bằng cấp giả.
2. VIOLENCE_GORE: Bạo lực, máu me, thương tích nặng, vũ khí, tự hại.
3. NSFW_SEXUAL: Khiêu dâm, đồi trụy, khỏa thân.
4. TOXIC_HATE: Xúc phạm nghiêm trọng, đe dọa, ngôn từ thù ghét, bắt nạt.
5. SPAM: Quảng cáo rác không liên quan đến học tập/sinh viên.

Văn bản bài viết:
"""${text.trim() || "(Bài viết không có văn bản, chỉ có hình ảnh)"}"""

YÊU CẦU BẮT BUỘC: Trả về DUY NHẤT một chuỗi JSON (responseMimeType: application/json):
{
  "isAllowed": boolean,
  "category": "NONE" | "SCAM_FRAUD" | "VIOLENCE_GORE" | "NSFW_SEXUAL" | "TOXIC_HATE" | "SPAM",
  "reason": "Lý do giải thích ngắn gọn bằng tiếng Việt (để hiển thị thông báo cho người dùng nếu bị chặn)"
}
`;

    const parts = [{ text: promptText }];

    // Đính kèm danh sách ảnh (nếu có)
    if (Array.isArray(files) && files.length > 0) {
      for (const file of files) {
        if (file?.mimetype && file.mimetype.startsWith("image/") && file.buffer) {
          parts.push({
            inlineData: {
              data: file.buffer.toString("base64"),
              mimeType: file.mimetype,
            },
          });
        }
      }
    }

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
      console.error("[AI Moderator API Error]:", data.error.message);
      return { isAllowed: true, category: "NONE", reason: "" };
    }

    const candidate = data?.candidates?.[0];
    const finishReason = candidate?.finishReason;
    const blockReason = data?.promptFeedback?.blockReason;

    // Kiểm tra cờ SAFETY từ Gemini Google
    if (finishReason === "SAFETY" || blockReason === "SAFETY" || finishReason === "RECITATION") {
      return {
        isAllowed: false,
        category: "SAFETY",
        reason: "Hình ảnh hoặc nội dung vi phạm tiêu chuẩn an toàn của hệ thống.",
      };
    }

    let rawText = candidate?.content?.parts?.[0]?.text || "";
    rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();

    const parsed = JSON.parse(rawText);

    return {
      isAllowed: parsed.isAllowed ?? true,
      category: parsed.category || "NONE",
      reason: parsed.reason || "",
    };
  } catch (error) {
    console.error("[AI Moderator System Error]:", error.message);
    // LỚP 3: SAFE FALLBACK
    return { isAllowed: true, category: "NONE", reason: "" };
  }
}

module.exports = {
  moderatePostContent,
  fastRuleCheck,
};
