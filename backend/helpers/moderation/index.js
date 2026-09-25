const { runStage1FastFilter } = require("./stage1_fastFilter.helper");
const { runStage2LocalVision } = require("./stage2_localVision.helper");

/**
 * Điều phối Kiểm Duyệt Tốc Độ Cao Trực Tiếp (Pre-moderation: Tầng 1 + Tầng 2)
 * Chạy tức thì trong 0ms - 50ms trước khi bài đăng được lưu vào DB.
 *
 * @param {Object} param0 
 * @param {string} param0.text - Nội dung caption hoặc bài viết
 * @param {Array<{buffer: Buffer, mimetype: string}>} param0.files - Mảng file đính kèm
 * @returns {Promise<{isAllowed: boolean, category: string, reason: string}>}
 */
async function runFastPreModeration({ text = "", files = [] } = {}) {
  // 1. TẦNG 1: Fast Regex Filter (0ms) + pHash Matching (2-5ms)
  const stage1Result = await runStage1FastFilter({ text, files });
  if (stage1Result && !stage1Result.isAllowed) {
    return stage1Result;
  }

  // 2. TẦNG 2: Local Vision & Pattern Check (20-50ms)
  const stage2Result = await runStage2LocalVision({ files });
  if (stage2Result && !stage2Result.isAllowed) {
    return stage2Result;
  }

  // Tương thích: Trả về An Toàn nếu vượt qua Tầng 1 và Tầng 2
  return {
    isAllowed: true,
    category: "NONE",
    reason: "",
  };
}

module.exports = {
  runFastPreModeration,
  runStage1FastFilter,
  runStage2LocalVision,
};
