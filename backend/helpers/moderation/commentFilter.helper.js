/**
 * HELPER: COMMENT TOXIC FILTER & TEXT NORMALIZATION (TỐC ĐỘ 0MS - LOCAL)
 * Hỗ trợ nhận diện tiếng lóng, teencode, xúc phạm, thô tục và công kích cá nhân.
 * Có thể kết nối service ViSoBERT local (port 8001) với fallback tự động sang Regex Engine.
 */

function removeAccents(str = "") {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

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
 * Chuẩn hóa văn bản: xóa dấu chấm xen kẽ, biến thể số, ký tự lặp, bỏ dấu tiếng Việt
 * Ví dụ: "đ.m", "0'c ch'0", "v_c_l", "dmmmmm" -> "dm", "oc cho", "vcl", "dmm"
 */
function normalizeText(input = "") {
  if (!input || typeof input !== "string") {
    return { raw: "", normalized: "", noAccent: "" };
  }

  let text = input.toLowerCase().trim();

  // 1. Thay thế số / ký tự leet thành chữ
  text = text.replace(/[013457@$!]/g, (char) => LEET_MAP[char] || char);

  // 2. Xóa các ký tự xen kẽ như . , _ - * ~
  const strippedSeparators = text.replace(/[\.\,\_\-\~\^\`\'\"\(\)]/g, "");

  // 3. Rút gọn ký tự lặp quá 2 lần (ví dụ: "dmmmm" -> "dmm", "đụuuuu" -> "đụ")
  const collapsedRepeats = strippedSeparators.replace(/(.)\1{2,}/g, "$1$1");

  // 4. Bỏ dấu tiếng Việt và đ -> d để regex word boundary \b hoạt động chính xác 100%
  const noAccent = removeAccents(collapsedRepeats);

  return {
    raw: text,
    normalized: collapsedRepeats,
    noAccent: noAccent,
  };
}

/**
 * Danh sách Pattern nhận diện Toxic / Offensive / Hate Speech tiếng Việt
 * Áp dụng trên cả chuỗi raw, chuỗi normalized và chuỗi không dấu (noAccent).
 */
const TOXIC_PATTERNS = [
  // 1. Chửi thề viết tắt / Acronyms (kiểm tra trên noAccent)
  {
    pattern: /\b(vcl|vkl|vcc|vcll|vclol|dmm|dkm|dkmm|clm|clmm|dcm|dcmm|dm|cmnr|cdm|dbrr|vdr|vdrr|cc|cl)\b/i,
    weight: 85,
    reason: "Từ ngữ chửi thề viết tắt",
  },

  // 2. Từ ngữ thô tục / chửi bới trực tiếp
  {
    pattern: /\b(lon|buoi|cac|du|dit|deo|dach)\b/i,
    weight: 90,
    reason: "Ngôn từ thô tục, chửi thề",
  },
  {
    pattern: /\b(me\s*(may|m|no)|bo\s*(may|m)|cha\s*(may|m)|con\s*me|dit\s*me|du\s*ma|du\s*me|chich|dmm|dcm|dkm)\b/i,
    weight: 90,
    reason: "Chửi bới xúc phạm",
  },
  {
    pattern: /(nung\s*(cac|lon)|bu\s*(buoi|cu|cac)|chich\s*(nhau|choa)|dit\s*nhau)/i,
    weight: 95,
    reason: "Ngôn từ dung tục",
  },

  // 3. Xúc phạm trí tuệ / hạ nhục nhân phẩm / xua đuổi thù ghét
  {
    pattern: /(oc\s*cho|nao\s*tan|bai\s*nao|ngu\s*(si|hoc|dot|nguc|vcl|nhu\s*cho|nhu\s*bo|vl|the|vai|lon|qua|the\s*nho)|thang\s*ngu|con\s*ngu)/i,
    weight: 85,
    reason: "Xúc phạm trí tuệ, hạ nhục nhân phẩm",
  },
  {
    pattern: /(do\s*(suc\s*sinh|suc\s*vat|rac\s*ruoi|re\s*rach|khuyet\s*tat|khon\s*nan|mat\s*day)|thang\s*mat\s*day|con\s*mat\s*day)/i,
    weight: 90,
    reason: "Lăng mạ, xúc phạm nặng nề",
  },
  {
    pattern: /\b(cut(\s*(di|me|khoi|nhanh|ba|ra))?|bien(\s*(di|me|khoi|nhanh|ba|ra))?|chet\s*di|mat\s*(lon|cho|day))\b/i,
    weight: 80,
    reason: "Xúc phạm, xua đuổi thù ghét",
  },

  // 4. Miệt thị giới tính / gái gọi / mại dâm
  {
    pattern: /\b(di|cave|pho|gai\s*goi|lam\s*tien|con\s*diem|thang\s*be\s*de|dam\s*tac|bien\s*thai)\b/i,
    weight: 90,
    reason: "Miệt thị giới tính, ngôn từ quấy rối",
  },

  // 5. Cờ bạc / Lừa đảo / Bán đề
  {
    pattern: /(tai\s*xiu|keo\s*nha\s*cai|game\s*doi\s*thuong|no\s*hu|chay\s*diem|ban\s*de)/i,
    weight: 90,
    reason: "Quảng cáo cờ bạc, lừa đảo",
  },
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

  const { raw, normalized, noAccent } = normalizeText(content);
  let highestToxicScore = 0;
  let detectedReason = "";

  // 1. Kiểm tra từ khóa cấm tùy chỉnh của chủ bài viết trước
  if (Array.isArray(customKeywords) && customKeywords.length > 0) {
    for (const kw of customKeywords) {
      if (!kw || typeof kw !== "string") continue;
      const cleanKw = kw.trim().toLowerCase();
      const cleanKwNoAccent = removeAccents(cleanKw);
      if (!cleanKw) continue;

      if (
        raw.includes(cleanKw) ||
        normalized.includes(cleanKw) ||
        noAccent.includes(cleanKwNoAccent)
      ) {
        return {
          isToxic: true,
          toxicScore: 100,
          reason: `Trùng từ khóa bị chặn bởi tác giả bài viết: "${kw}"`,
        };
      }
    }
  }

  // 2. Quét qua tập Toxic Patterns chuẩn hóa (quét raw, normalized, và noAccent)
  for (const item of TOXIC_PATTERNS) {
    if (
      item.pattern.test(raw) ||
      item.pattern.test(normalized) ||
      item.pattern.test(noAccent)
    ) {
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
        toxicScore: 85,
        reason: "Phát hiện nội dung thù ghét/xúc phạm qua ViSoBERT",
      };
    }
  } catch (_) {
    // ViSoBERT offline hoặc timeout -> tiếp tục dùng kết quả regexResult
  }

  return regexResult;
}

/**
 * Theo dõi bão toxic theo cửa sổ thời gian trượt (Sliding Window 10 phút)
 * @param {string} postId ID bài viết
 * @param {number} windowMs Thời gian cửa sổ (mặc định 10 phút = 600,000ms)
 * @param {number} threshold Ngưỡng kích hoạt cảnh báo (mặc định 5 cmt toxic)
 * @returns {{ isRaidDetected: boolean, count: number }}
 */
function recordToxicCommentAndCheckRaid(postId, windowMs = 10 * 60 * 1000, threshold = 5) {
  if (!postId) return { isRaidDetected: false, count: 0 };
  const postIdStr = postId.toString();

  if (!global._postToxicTracker) {
    global._postToxicTracker = new Map();
  }

  const now = Date.now();
  let tracker = global._postToxicTracker.get(postIdStr);

  if (!tracker) {
    tracker = {
      timestamps: [],
      lastAlertedAt: 0,
    };
    global._postToxicTracker.set(postIdStr, tracker);
  }

  // 1. Lọc bỏ các timestamp cũ đã quá 10 phút (kết thúc chu kỳ cũ)
  tracker.timestamps = tracker.timestamps.filter((ts) => now - ts <= windowMs);

  // 2. Thêm timestamp của bình luận toxic hiện tại
  tracker.timestamps.push(now);

  const currentCount = tracker.timestamps.length;

  // 3. Kiểm tra xem có đạt ngưỡng bão toxic (>= 5 cmt) và chưa báo động trong vòng 1 tiếng
  const cooldownAlertMs = 60 * 60 * 1000; // 1 tiếng không bắn cảnh báo lặp lại
  const shouldAlert = currentCount >= threshold && (now - tracker.lastAlertedAt > cooldownAlertMs);

  if (shouldAlert) {
    tracker.lastAlertedAt = now;
    return {
      isRaidDetected: true,
      count: currentCount,
    };
  }

  return {
    isRaidDetected: false,
    count: currentCount,
  };
}

module.exports = {
  removeAccents,
  normalizeText,
  evaluateCommentToxicity,
  checkCommentWithAI,
  recordToxicCommentAndCheckRaid,
};
