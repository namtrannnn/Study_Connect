const apiKey =
  process.env.GOOGLE_GEMINI_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();

const MODEL_NAME = process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";

/**
 * Tải ảnh từ URL nội bộ hoặc public và convert sang Base64 Inline Data Part cho Gemini
 */
async function fetchImageAsInlinePart(url) {
  if (!url || typeof url !== "string") return null;

  try {
    const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
    const response = await fetch(url, { timeout: 8000 });
    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get("content-type") || "image/jpeg";

    return {
      inlineData: {
        mimeType: contentType.split(";")[0],
        data: buffer.toString("base64"),
      },
    };
  } catch (err) {
    console.warn(`[Stage 3 Media Fetch Warning]: Không thể tải media từ ${url}:`, err.message);
    return null;
  }
}

/**
 * TẦNG 3: DEEP CONTEXT MULTIMODAL AI & RISK CONFIDENCE SCORER
 * Phân tích sâu ngữ cảnh cả Văn Bản + Hình Ảnh bằng Gemini Multimodal.
 *
 * @param {Object} param0
 * @param {string} param0.text - Nội dung caption / bài viết
 * @param {string[]} param0.mediaUrls - Danh sách URL ảnh hoặc video đính kèm
 * @returns {Promise<Object>} T3 Signal Output theo chuẩn Blueprint
 */
async function evaluateDeepContextAndRiskScore({ text = "", mediaUrls = [] } = {}) {
  if (!apiKey) {
    const err = new Error("Chưa cấu hình GEMINI_API_KEY. Không thể thực hiện Stage 3 Moderation.");
    err.code = "MISSING_API_KEY";
    throw err;
  }

  const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

  const promptText = `
Bạn là "AI Content Moderator" cho một Mạng Xã Hội (Social Network) tương tác đa chiều.
Nhiệm vụ: Phân tích đồng thời VĂN BẢN (Text) và HÌNH ẢNH (Image/Keyframes) để đánh giá rủi ro vi phạm tiêu chuẩn cộng đồng.

BỐI CẢNH NỀN TẢNG:
- Đây là Mạng Xã Hội tổng hợp bình thường dành cho mọi người: Người dùng có thể chia sẻ cuộc sống đời thường, tâm sự, sở thích, âm nhạc, phim ảnh, công nghệ, học tập, giải trí, thể thao, meme hài hước, kinh doanh cá nhân lành mạnh. Mọi bài viết đời sống thông thường ĐỀU HỢP LỆ VÀ AN TOÀN (overallRisk < 0.20).

Quy tắc phân tích:
1. Xử lý MÃ QR (QR Code Inspection):
   - Đọc và phân loại nội dung bên trong mã QR (nếu ảnh có QR):
     + Nếu mã QR là SỐ TÀI KHOẢN NGÂN HÀNG / VietQR (dùng để thanh toán, chia tiền ăn uống, quyên góp từ thiện, ủng hộ, chuyển khoản cá nhân bình thường) -> Đánh giá AN TOÀN (overallRisk < 0.15, scam: 0.0) và CHO PHÉP ĐĂNG BÌNH THƯỜNG.
     + Nếu mã QR chứa đường LINK (URL):
       * Dẫn tới web cờ bạc (nhà cái, casino, cá độ, tài xỉu), web lừa đảo (phishing), trang khiêu dâm -> Đánh giá VI PHẠM NGHIÊM TRỌNG (overallRisk >= 0.85, scam: 0.9).
       * Link nhóm cộng đồng (Zalo/Facebook/Discord), link Youtube, Spotify, link Google Form, Drive tài liệu -> Đánh giá AN TOÀN (overallRisk < 0.20).
2. Xử lý LIÊN KẾT / URL TRONG VĂN BẢN (Links in text):
   - Các link mạng xã hội, tin tức báo chí, video, nhạc, tài liệu (Youtube, Facebook, Tiktok, Github, Wikipedia, Drive, Docs...) -> Đánh giá AN TOÀN.
   - Chỉ coi là vi phạm nếu liên kết dẫn tới web cờ bạc, lừa đảo tài chính, phát tán mã độc hoặc web đồi trụy 18+.
3. Ngữ cảnh (Context & Cross-check):
   - Cho phép các bài viết đời thường, cảm xúc cá nhân, ảnh du lịch, selfie, meme, giao lưu kết bạn.
   - Phân biệt rõ hình ảnh giải phẫu y tế/sinh học, tranh nghệ thuật kinh điển, tin tức thời sự với hành vi khiêu dâm, đồi trụy hoặc bạo lực phản cảm.
   - Chỉ đánh giá rủi ro lừa đảo (scam) khi có hành vi lừa đảo chiếm đoạt rõ rệt (ví dụ: dụ nạp tiền x2, lừa đảo việc nhẹ lương cao nạp vốn, bán giấy tờ giả, mã độc...).

Các danh mục rủi ro (tính từ 0.0 đến 1.0):
- sexual: Khiêu dâm, lộ bộ phận sinh dục/nhạy cảm, gạ tình gợi dục thô thiển.
- violence: Máu me kinh dị, thương tích nặng, vũ khí nguy hiểm, kích động bạo lực, tự hại.
- harassment: Xúc phạm nhân phẩm cá nhân, đe dọa, bôi nhọ danh dự, doxxing.
- hate: Kích động thù hằn tôn giáo, sắc tộc, phân biệt vùng miền, giới tính.
- scam: Lừa đảo tài chính, dụ dỗ nạp tiền, đa cấp phi pháp, cá độ cờ bạc, bán tài liệu/giấy tờ giả.
- spam: Tin nhắn bot tự động lặp lại, phát tán link độc hại, spam quảng cáo bẩn hàng loạt.

Văn bản bài viết:
"""${text.trim() || "(Không có văn bản)"}"""

YÊU CẦU BẮT BUỘC: Trả về DUY NHẤT một chuỗi JSON hợp lệ (không kèm markdown \`\`\`json):
{
  "overallRisk": number, // Điểm rủi ro tổng hợp từ 0.0 đến 1.0
  "categories": {
    "sexual": number,    // 0.0 - 1.0
    "violence": number,  // 0.0 - 1.0
    "harassment": number,// 0.0 - 1.0
    "hate": number,      // 0.0 - 1.0
    "scam": number,      // 0.0 - 1.0
    "spam": number       // 0.0 - 1.0
  },
  "severity": "low" | "medium" | "high",
  "reason": "Giải thích ngắn gọn lý do bằng tiếng Việt",
  "evidence": ["bằng chứng 1", "bằng chứng 2"]
}
`;

  const parts = [{ text: promptText }];

  // Đóng gói Media (Multimodal)
  if (Array.isArray(mediaUrls) && mediaUrls.length > 0) {
    // Giới hạn tối đa 5 ảnh để tránh payload quá nặng
    const targetUrls = mediaUrls.slice(0, 5);
    for (const url of targetUrls) {
      const inlinePart = await fetchImageAsInlinePart(url);
      if (inlinePart) {
        parts.push(inlinePart);
      }
    }
  }

  const requestBody = {
    contents: [{ parts }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1, // Thấp để đảm bảo tính nhất quán (deterministic)
    },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      timeout: 15000, // Timeout 15s
    }
  );

  if (response.status === 429) {
    const err = new Error("Gemini API Rate Limit Exceeded (HTTP 429 Resource Exhausted)");
    err.code = "RATE_LIMIT_429";
    err.status = 429;
    throw err;
  }

  const data = await response.json();

  if (data?.error) {
    const err = new Error(`[Gemini API Error]: ${data.error.message}`);
    err.code = data.error.status || "GEMINI_API_ERROR";
    throw err;
  }

  const candidate = data?.candidates?.[0];
  const finishReason = candidate?.finishReason;

  // Xử lý cờ an toàn của Google Gemini
  if (finishReason === "SAFETY" || finishReason === "RECITATION") {
    return {
      stage: "T3",
      overallRisk: 0.95,
      categories: {
        sexual: 0.8,
        violence: 0.8,
        harassment: 0.5,
        hate: 0.5,
        scam: 0.5,
        spam: 0.1,
      },
      severity: "high",
      reason: "Hệ thống an toàn của Gemini phát hiện vi phạm tiêu chuẩn nội dung nghiêm trọng.",
      evidence: ["gemini:SAFETY_TRIGGERED"],
    };
  }

  let rawText = candidate?.content?.parts?.[0]?.text || "";
  rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch (parseErr) {
    throw new Error(`Không thể parse kết quả JSON từ Gemini: ${rawText.slice(0, 100)}`);
  }

  const overallRisk = typeof parsed.overallRisk === "number" ? Math.min(Math.max(parsed.overallRisk, 0), 1) : 0;

  return {
    stage: "T3",
    overallRisk,
    categories: {
      sexual: Math.min(Math.max(parsed.categories?.sexual || 0, 0), 1),
      violence: Math.min(Math.max(parsed.categories?.violence || 0, 0), 1),
      harassment: Math.min(Math.max(parsed.categories?.harassment || 0, 0), 1),
      hate: Math.min(Math.max(parsed.categories?.hate || 0, 0), 1),
      scam: Math.min(Math.max(parsed.categories?.scam || 0, 0), 1),
      spam: Math.min(Math.max(parsed.categories?.spam || 0, 0), 1),
    },
    severity: parsed.severity || (overallRisk >= 0.8 ? "high" : overallRisk >= 0.4 ? "medium" : "low"),
    reason: parsed.reason || "Đã phân tích ngữ cảnh tự động",
    evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
  };
}

module.exports = {
  evaluateDeepContextAndRiskScore,
  fetchImageAsInlinePart,
};
