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
    const prompt = `Bạn là hệ thống AI kiểm duyệt nội dung của ứng dụng mạng xã hội StudyConnect.
Hãy phân tích nội dung sau đây cùng với lý do báo cáo vi phạm từ người dùng và trả về JSON thuần kết quả đánh giá.

Nội dung bài viết/bình luận: "${content || "Không có nội dung văn bản"}"
Phân loại vi phạm (do người dùng chọn): "${categoryLabel}"
Mô tả thêm từ người báo cáo: "${reportReason || "Không có mô tả thêm"}"

Trả về ĐÚNG 1 ĐỐI TƯỢNG JSON (không bọc trong markdown code block, không giải thích thêm):
{
  "toxicScore": <số từ 0 đến 100 thể hiện độ độc hại/vi phạm>,
  "category": "<chọn 1 trong các giá trị: spam | hate_speech | harassment | violence | normal>",
  "summary": "<tóm tắt 1-2 câu lý do tại sao bài viết này bị đánh giá vi phạm hoặc an toàn>",
  "suggestedAction": "<chọn 1 trong các giá trị: hide_post | warn_user | ban_user | dismiss>"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();
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
  let toxicScore = 20;
  let category = "normal";
  let suggestedAction = "dismiss";
  let summary = "Nội dung cần xem xét thêm bởi Quản trị viên.";

  // Ưu tiên dùng reasonCategory nếu có
  if (reasonCategory && reasonCategory !== "other") {
    const categoryMap = {
      spam: { score: 65, cat: "spam", action: "hide_post", msg: "Nội dung chứa dấu hiệu spam/quảng cáo rác." },
      violence: { score: 80, cat: "violence", action: "hide_post", msg: "Nội dung bị báo cáo có liên quan đến bạo lực." },
      harassment: { score: 75, cat: "harassment", action: "warn_user", msg: "Nội dung bị báo cáo có dấu hiệu quấy rối." },
      hate_speech: { score: 80, cat: "hate_speech", action: "hide_post", msg: "Nội dung bị báo cáo có ngôn từ thù địch/kỳ thị." },
      misinformation: { score: 60, cat: "normal", action: "hide_post", msg: "Nội dung bị báo cáo có thể chứa thông tin sai lệch." },
      sexual_content: { score: 85, cat: "harassment", action: "hide_post", msg: "Nội dung bị báo cáo có yếu tố khiêu dâm/18+." },
    };
    const mapped = categoryMap[reasonCategory];
    if (mapped) {
      toxicScore = mapped.score;
      category = mapped.cat;
      suggestedAction = mapped.action;
      summary = mapped.msg;
    }
  } else if (text.includes("chửi") || text.includes("đám") || text.includes("ngu") || text.includes("xúc phạm")) {
    toxicScore = 75;
    category = "hate_speech";
    suggestedAction = "hide_post";
    summary = "Phát hiện từ ngữ có tính chất xúc phạm hoặc hằn học.";
  } else if (text.includes("link") || text.includes("cờ bạc") || text.includes("kiếm tiền") || text.includes("http")) {
    toxicScore = 65;
    category = "spam";
    suggestedAction = "hide_post";
    summary = "Nội dung chứa liên kết hoặc dấu hiệu quảng cáo rác/spam.";
  }

  return { toxicScore, category, summary, suggestedAction };
}

module.exports = { analyzeContentWithAI };
