const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const REASON_CATEGORY_LABELS = {
  spam: "Spam / Quảng cáo rác",
  violence: "Nội dung bạo lực",
  harassment: "Quấy rối / Bắt nạt",
  hate_speech: "Ngôn từ thù địch / Kỳ thị",
  misinformation: "Thông tin sai lệch",
  sexual_content: "Nội dung khiêu dâm / 18+",
  other: "Khác",
};

/**
 * Tải ảnh và chuyển đổi sang inlineData base64 để Gemini Multimodal đọc được
 */
async function fetchImageAsInlinePart(url) {
  if (!url || typeof url !== "string") return null;
  try {
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
    console.warn(`[AI Moderation Media Fetch Warning]: Không thể tải media từ ${url}:`, err.message);
    return null;
  }
}

async function analyzeContentWithAI(content, reportReason = "", reasonCategory = "", imageUrls = []) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";

    if (!apiKey) {
      return getFallbackAnalysis(content, reportReason, reasonCategory);
    }

    const categoryLabel = REASON_CATEGORY_LABELS[reasonCategory] || "Chưa phân loại";
    const validImageUrls = Array.isArray(imageUrls) ? imageUrls.filter(Boolean) : [];
    const hasImages = validImageUrls.length > 0;
    const hasText = content && content.trim().length > 0;

    const prompt = `Bạn là hệ thống AI kiểm duyệt nội dung của diễn đàn trao đổi StudyConnect.
Nhiệm vụ: Phân tích khách quan nội dung bên dưới và trả về JSON đánh giá mức độ vi phạm.

LƯU Ý QUAN TRỌNG:
- Đây là diễn đàn trao đổi, nội dung về học tập, code, chia sẻ kiến thức là HOÀN TOÀN BÌNH THƯỜNG.
- Phân loại vi phạm do NGƯỜI DÙNG TỰ CHỌN — có thể không chính xác, đừng để nó ảnh hưởng quá nhiều đến đánh giá.
- Hãy đánh giá dựa trên NỘI DUNG THỰC TẾ là chính (cả văn bản VÀ hình ảnh nếu có).
- Chỉ cho điểm cao (>60) khi nội dung THỰC SỰ vi phạm rõ ràng.
${hasImages ? `- Có ${validImageUrls.length} hình ảnh đính kèm, hãy phân tích KỸ nội dung trong ảnh (chữ trong ảnh, logo quảng cáo, cờ bạc, nội dung nhạy cảm...).` : ""}
${!hasText && hasImages ? "- Bài viết KHÔNG CÓ văn bản, CHỈ CÓ hình ảnh. Hãy đọc chữ trong ảnh và đánh giá toàn diện dựa trên ảnh." : ""}

Nội dung văn bản: "${content || "Không có nội dung văn bản"}"
Phân loại vi phạm (người dùng chọn, có thể sai): "${categoryLabel}"
Mô tả thêm từ người báo cáo: "${reportReason || "Không có"}"

Trả về ĐÚNG 1 ĐỐI TƯỢNG JSON (không markdown, không giải thích):
{
  "toxicScore": <0-100, chỉ cao nếu vi phạm rõ ràng>,
  "category": "<spam | hate_speech | harassment | violence | normal>",
  "summary": "<1-2 câu nhận xét khách quan về nội dung${hasImages ? " (bao gồm nhận xét về ảnh)" : ""}>",
  "suggestedAction": "<hide_post | warn_user | ban_user | dismiss>"
}`;

    // Xây dựng parts: text + ảnh base64 (multimodal nếu có ảnh)
    const parts = [{ text: prompt }];

    if (hasImages) {
      // Giới hạn tải tối đa 3 ảnh đầu để tránh chậm
      const imagesToFetch = validImageUrls.slice(0, 3);
      for (const url of imagesToFetch) {
        const inlinePart = await fetchImageAsInlinePart(url);
        if (inlinePart) {
          parts.push(inlinePart);
        }
      }
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
        }),
      }
    );

    const data = await response.json();

    // Nếu API trả lỗi thì dùng fallback
    if (data?.error) {
      console.error("Gemini API error:", data.error.message);
      return getFallbackAnalysis(content, reportReason, reasonCategory);
    }

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Clean JSON string
    const cleanJson = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return {
      toxicScore: typeof parsed.toxicScore === "number" ? parsed.toxicScore : 50,
      category: parsed.category || "normal",
      summary: parsed.summary || "Đã phân tích nội dung bằng AI",
      suggestedAction: parsed.suggestedAction || "hide_post",
    };
  } catch (error) {
    console.error("Gemini AI moderation error:", error);
    return getFallbackAnalysis(content, reportReason, reasonCategory);
  }
}

function getFallbackAnalysis(content, reportReason, reasonCategory = "") {
  const text = (content + " " + reportReason).toLowerCase();

  // Không có Gemini API — chỉ dùng keyword matching đơn giản
  // Không tin tuyệt đối vào reasonCategory vì user có thể chọn sai

  // Keyword matching cho nội dung rõ ràng vi phạm
  if (text.includes("chửi") || text.includes("đm") || text.includes("ngu") || text.includes("xúc phạm") || text.includes("địt")) {
    return { toxicScore: 75, category: "hate_speech", suggestedAction: "hide_post", summary: "Phát hiện từ ngữ có tính chất xúc phạm." };
  }
  if (text.includes("cờ bạc") || text.includes("kiếm tiền nhanh") || text.includes("đầu tư sinh lời")) {
    return { toxicScore: 70, category: "spam", suggestedAction: "hide_post", summary: "Nội dung có dấu hiệu spam/quảng cáo." };
  }
  if (text.includes("http://") || text.includes("https://") && (text.includes("click") || text.includes("đăng ký ngay"))) {
    return { toxicScore: 65, category: "spam", suggestedAction: "hide_post", summary: "Nội dung chứa liên kết quảng cáo." };
  }

  // Không phát hiện vi phạm rõ ràng → để admin xem xét thủ công
  return {
    toxicScore: 0,
    category: "normal",
    suggestedAction: "dismiss",
    summary: "Không thể phân tích tự động (Gemini API không khả dụng). Vui lòng xem xét thủ công.",
  };
}

module.exports = { analyzeContentWithAI };
