let sharp;
try {
  sharp = require("sharp");
} catch (err) {
  console.warn("[Sharp Warning]: Thư viện sharp chưa sẵn sàng cho pHash.");
}

const BlacklistedHash = require("../../api/v1/models/blacklistedHash.model");

// ----------------------------------------------------
// TẦNG 1.1: FAST KEYWORD REGEX FILTER (0ms)
// ----------------------------------------------------
const BLACKLIST_PATTERNS = [
  // 1. Cờ bạc / Cá độ / Nhà cái
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

function checkFastText(text = "") {
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
// TẦNG 1.2: PERCEPTUAL IMAGE HASHING (pHash - 2ms - 5ms)
// ----------------------------------------------------
/**
 * Tính mã pHash (Average Hash 64-bit) cho 1 Buffer ảnh
 */
async function generateImageHash(imageBuffer) {
  if (!sharp || !imageBuffer) return null;
  try {
    // Resize ảnh về 8x8 greyscale (64 ô pixel)
    const pixels = await sharp(imageBuffer)
      .resize(8, 8, { fit: "fill" })
      .grayscale()
      .raw()
      .toBuffer();

    let sum = 0;
    for (let i = 0; i < pixels.length; i++) {
      sum += pixels[i];
    }
    const avg = sum / pixels.length;

    let hash = "";
    for (let i = 0; i < pixels.length; i++) {
      hash += pixels[i] >= avg ? "1" : "0";
    }

    return hash; // Chuỗi 64 nhị phân
  } catch (err) {
    console.warn("[pHash Error]: Không thể tạo hash cho ảnh", err.message);
    return null;
  }
}

/**
 * Tính khoảng cách Hamming giữa 2 chuỗi nhị phân pHash
 */
function hammingDistance(hash1, hash2) {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) return 999;
  let dist = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) dist++;
  }
  return dist;
}

/**
 * Kiểm tra mảng Buffer ảnh với DB BlacklistedHashes
 */
async function checkFastImageHashes(files = []) {
  if (!Array.isArray(files) || files.length === 0) return null;

  try {
    const blacklistedDocs = await BlacklistedHash.find().lean();
    if (blacklistedDocs.length === 0) return null;

    for (const file of files) {
      if (file?.mimetype?.startsWith("image/") && file.buffer) {
        const hash = await generateImageHash(file.buffer);
        if (!hash) continue;

        for (const doc of blacklistedDocs) {
          const dist = hammingDistance(hash, doc.hash);
          if (dist <= 5) {
            // Trùng khớp ảnh vi phạm
            return {
              isAllowed: false,
              category: doc.category || "SAFETY",
              reason: doc.reason || "Hình ảnh trùng khớp với dữ liệu vi phạm tiêu chuẩn cộng đồng.",
            };
          }
        }
      }
    }
  } catch (err) {
    console.warn("[pHash DB Match Warning]:", err.message);
  }

  return null;
}

/**
 * Hàm điều phối kiểm duyệt Tầng 1
 */
async function runStage1FastFilter({ text = "", files = [] } = {}) {
  // 1. Check Regex Text
  const textResult = checkFastText(text);
  if (textResult) return textResult;

  // 2. Check pHash Images
  const imageResult = await checkFastImageHashes(files);
  if (imageResult) return imageResult;

  return null; // Pass Tầng 1
}

module.exports = {
  runStage1FastFilter,
  checkFastText,
  generateImageHash,
  hammingDistance,
};
