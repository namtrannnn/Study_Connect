/**
 * HELPER: COMMENT TOXIC FILTER & TEXT NORMALIZATION (TỐC ĐỘ 0MS - LOCAL)
 * Hỗ trợ nhận diện tiếng lóng, teencode, xúc phạm, thô tục và công kích cá nhân.
 * Có thể kết nối service ViSoBERT local (port 8001) với fallback tự động sang Regex Engine.
 */

// Bảng ánh xạ Teencode & Leetspeak sang chữ cái thông thường
const LEET_MAP = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  "$": "s",
  "!": "i",
};

/**
 * Chuẩn hóa văn bản: xóa dấu chấm xen kẽ, biến thể số, ký tự lặp
 * Ví dụ: "đ.m", "0'c ch'0", "v_c_l", "dmmmmm" -> "dm", "oc cho", "vcl", "dmm"
 */
function normalizeText(input = "") {
  if (!input || typeof input !== "string") return "";

  let text = input.toLowerCase().trim();

  // 1. Thay thế số / ký tự leet thành chữ
  text = text.replace(/[013457@$!]/g, (char) => LEET_MAP[char] || char);

  // 2. Xóa các ký tự xen kẽ như . , _ - * ~
  const strippedSeparators = text.replace(/[\.\,\_\-\*\~\^\`\'\"\(\)]/g, "");

  // 3. Rút gọn ký tự lặp quá 2 lần (ví dụ: "dmmmm" -> "dmm", "đụuuuu" -> "đụ")
  const collapsedRepeats = strippedSeparators.replace(/(.)\1{2,}/g, "$1$1");

  return {
    raw: text,
    normalized: collapsedRepeats,
  };
}

/**
 * Danh sách Pattern nhận diện Toxic / Offensive / Hate Speech tiếng Việt
 */
const TOXIC_PATTERNS = [
  // 1. Chửi thề viết tắt / Acronyms
  { pattern: /\b(vcl|vkl|dmm|clm|đbrr|vđr|đkm|cmnr|cđm|vcll|vclol|dm)\b/i, weight: 85, reason: "Từ ngữ chửi thề viết tắt" },
  
  // 2. Từ ngữ thô tục cơ quan sinh dục / chửi bới trực tiếp
  { pattern: /\b(lồn|lon|l0n|buồi|buoi|cặc|cac|c4c|đụ|du|địt|dit|d1t|đéo|deo|đách|mẹ mày|bố mày|cha mày)\b/i, weight: 90, reason: "Ngôn từ thô tục, chửi thề" },
  { pattern: /(nứng\s*(cặc|lồn)|bú\s*(buồi|cu|cặc)|chịch|đụ\s*má|địt\s*mẹ|đmm|dcm|đcm)/i, weight: 95, reason: "Ngôn từ dung tục, thô thiển" },

  // 3. Xúc phạm trí tuệ / hạ nhục nhân phẩm
  { pattern: /(óc\s*chó|oc\s*cho|não\s*tàn|nao\s*tan|bại\s*não|bai\s*nao|ngu\s*(si|học|dốt|ngục|vcl|như\s*chó|như\s*bò))/i, weight: 85, reason: "Xúc phạm trí tuệ, hạ nhục nhân phẩm" },
  { pattern: /(đồ\s*(súc\s*sinh|súc\s*vật|rác\s*rưởi|rẻ\s*rách|khuyết\s*tật|khốn\s*nạn|mất\s*dạy))/i, weight: 90, reason: "Lăng mạ, xúc phạm nặng nề" },
  { pattern: /\b(cút\s*đi|biến\s*đi|chết\s*đi|mặt\s*lợn|mặt\s*chó|mặt\s*dày)\b/i, weight: 80, reason: "Xúc phạm, đuổi xua thù ghét" },

  // 4. Miệt thị giới tính / gái gọi / mại dâm
  { pattern: /\b(đĩ|cave|phò|gái\s*gọi|làm\s*tiền|con\s*điếm|thằng\s*bê\s*đê|dâm\s*tặc|biến\s*thái)\b/i, weight: 90, reason: "Miệt thị giới tính, ngôn từ quấy rối" },

  // 5. Cờ bạc / Lừa đảo / Bán đề
  { pattern: /(tài\s*xỉu|kèo\s*nhà\s*cái|game\s*đổi\s*thưởng|nổ\s*hũ|chạy\s*điểm|bán\s*đề)/i, weight: 90, reason: "Quảng cáo cờ bạc, lừa đảo" },
];

/**
 * Đánh giá độ độc hại của bình luận (Local Regex Engine - 0ms)
 * @param {string} content Nội dung bình luận
 * @param {string[]} customKeywords Danh sách từ khóa cấm tùy chỉnh của chủ bài viết (nếu có)
 * @returns {{ isToxic: boolean, toxicScore: number, reason: string }}
 */
function evaluateCommentToxicity(content = "", customKeywords = []) {
  if (!content || typeof content !== "string") {
    return { isToxic: false, toxicScore: 0, reason: "" };
  }

  const { raw, normalized } = normalizeText(content);
  let highestToxicScore = 0;
  let detectedReason = "";

  // 1. Kiểm tra từ khóa cấm tùy chỉnh của chủ bài viết trước
  if (Array.isArray(customKeywords) && customKeywords.length > 0) {
    for (const kw of customKeywords) {
      if (!kw || typeof kw !== "string") continue;
      const cleanKw = kw.trim().toLowerCase();
      if (!cleanKw) continue;

      if (raw.includes(cleanKw) || normalized.includes(cleanKw)) {
        return {
          isToxic: true,
          toxicScore: 100,
          reason: `Trùng từ khóa bị chặn bởi tác giả bài viết: "${kw}"`,
        };
      }
    }
  }

  // 2. Quét qua tập Toxic Patterns chuẩn hóa
  for (const item of TOXIC_PATTERNS) {
    if (item.pattern.test(raw) || item.pattern.test(normalized)) {
      if (item.weight > highestToxicScore) {
        highestToxicScore = item.weight;
        detectedReason = item.reason;
      }
    }
  }

  // Ngưỡng phát hiện toxic là >= 70 điểm
  const isToxic = highestToxicScore >= 70;

  return {
    isToxic,
    toxicScore: highestToxicScore,
    reason: detectedReason || (isToxic ? "Bình luận chứa ngôn từ độc hại / tiêu cực" : ""),
  };
}

/**
 * Kiểm tra bình luận qua AI ViSoBERT (nếu service Python port 8001 khả dụng),
 * tự động fallback về Regex Engine nếu ViSoBERT không bật.
 */
async function checkCommentWithAI(content = "", customKeywords = []) {
  // Chạy Regex Engine trước (0ms)
  const regexResult = evaluateCommentToxicity(content, customKeywords);
  if (regexResult.isToxic) {
    return regexResult;
  }

  // Nếu Regex không bắt nhưng có cài service ViSoBERT local, thử gọi phân tích ngữ cảnh
  try {
    const axios = require("axios");
    const response = await axios.post(
      "http://127.0.0.1:8001/predict",
      { text: content },
      { timeout: 80 } // Giới hạn 80ms, nếu không phản hồi thì bỏ qua ngay để không lag
    );

    if (response.data && (response.data.label === "HATE" || response.data.label === "OFFENSIVE")) {
      return {
        isToxic: true,
        toxicScore: response.data.toxicScore || 85,
        reason: "AI ViSoBERT nhận diện nội dung có yếu tố xúc phạm / thù ghét",
      };
    }
  } catch (err) {
    // Không chạy ViSoBERT service hoặc timeout -> an tâm sử dụng kết quả Regex
  }

  return regexResult;
}

module.exports = {
  normalizeText,
  evaluateCommentToxicity,
  checkCommentWithAI,
};

