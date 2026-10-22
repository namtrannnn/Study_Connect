let sharp;
try {
  sharp = require("sharp");
} catch (err) {
  console.warn("[Sharp Warning]: Sharp chưa sẵn sàng cho Stage 2.");
}

/**
 * TẦNG 2: LOCAL AI VISION & IMAGE PATTERN INSPECTOR (20ms - 50ms)
 * Xử lý hình ảnh cục bộ trên CPU/RAM trước khi đưa bài đăng lên Feed.
 */

async function inspectImageBufferLocal(fileBuffer) {
  if (!sharp || !fileBuffer) {
    return { isAllowed: true, reason: "" };
  }

  try {
    const metadata = await sharp(fileBuffer).metadata();

    // 1. Kiểm tra kích thước dị thường (ví dụ: ảnh quá lớn hoặc tỷ lệ bất thường)
    if (metadata.width && metadata.height) {
      const aspectRatio = metadata.width / metadata.height;
      if (aspectRatio > 20 || aspectRatio < 0.05) {
        return {
          isAllowed: false,
          category: "SPAM",
          reason: "Kích thước hình ảnh không hợp lệ (tỷ lệ bất thường).",
        };
      }
    }

    return { isAllowed: true, reason: "" };
  } catch (err) {
    console.warn("[Stage 2 Local Inspection Warning]:", err.message);
    return { isAllowed: true, reason: "" };
  }
}

/**
 * Hàm điều phối Tầng 2
 */
async function runStage2LocalVision({ files = [] } = {}) {
  if (!Array.isArray(files) || files.length === 0) {
    return null; // Không có ảnh -> Pass Tầng 2
  }

  for (const file of files) {
    if (file?.mimetype?.startsWith("image/") && file.buffer) {
      const result = await inspectImageBufferLocal(file.buffer);
      if (!result.isAllowed) {
        return result;
      }
    }
  }

  return null; // Pass Tầng 2
}

module.exports = {
  runStage2LocalVision,
  inspectImageBufferLocal,
};
