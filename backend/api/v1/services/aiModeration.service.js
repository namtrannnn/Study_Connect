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

async function analyzeContentWithAI(content, reportReason = "", reasonCategory = "") {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return getFallbackAnalysis(content, reportReason, reasonCategory);
    }

    const categoryLabel = REASON_CATEGORY_LABELS[reasonCategory] || "Chưa phân loại";
    const prompt = `Bạn là hệ thống AI kiểm duyệt nội dung của mạng xã hội học tập StudyConnect.
Nhiệm vụ: Phân tích khách quan nội dung bên dưới và trả về JSON đánh giá mức độ vi phạm.

LƯU Ý QUAN TRỌNG:
- Đây là mạng xã hội học tập, nội dung về học tập, code, chia sẻ kiến thức là HOÀN TOÀN BÌNH THƯỜNG.
- Phân loại vi phạm do NGƯỜI DÙNG TỰ CHỌN — có thể không chính xác, đừng để nó ảnh hưởng quá nhiều đến đánh giá.
- Hãy đánh giá dựa trên NỘI DUNG THỰC TẾ là chính.
- Chỉ cho điểm cao (>60) khi nội dung THỰC SỰ vi phạm rõ ràng.

Nội dung cần phân tích: "${content || "Không có nội dung văn bản"}"
Phân loại vi phạm (người dùng chọn, có thể sai): "${categoryLabel}"
Mô tả thêm từ người báo cáo: "${reportReason || "Không có"}"

Trả về ĐÚNG 1 ĐỐI TƯỢNG JSON (không markdown, không giải thích):
{
  "toxicScore": <0-100, chỉ cao nếu vi phạm rõ ràng>,
  "category": "<spam | hate_speech | harassment | violence | normal>",
  "summary": "<1-2 câu nhận xét khách quan về nội dung>",
  "suggestedAction": "<hide_post | warn_user | ban_user | dismiss>"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
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
