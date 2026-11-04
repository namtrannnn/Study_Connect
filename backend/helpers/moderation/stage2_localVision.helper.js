let sharp;
try {
  sharp = require("sharp");
} catch (err) {
  console.warn("[Stage 2 Sharp Warning]: Sharp chưa sẵn sàng cho Stage 2.");
}

// Tích hợp OCR (Tesseract.js) nếu có cài đặt
let Tesseract;
try {
  Tesseract = require("tesseract.js");
  console.log("[Stage 2] ✅ Đã nạp thành công Tesseract.js (OCR)");
} catch (err) {
  console.warn("[Stage 2 Tesseract Load Warning]:", err.message);
}

// Tích hợp NSFW Model (nsfwjs) nếu có cài đặt
let nsfw;
let tf;
let nsfwModelPromise = null;
try {
  tf = require("@tensorflow/tfjs");
  nsfw = require("nsfwjs");
  console.log("[Stage 2] ✅ Đã nạp thành công @tensorflow/tfjs và nsfwjs");
  // Khởi tạo tải model ngầm 1 lần duy nhất khi khởi động
  nsfwModelPromise = nsfw.load().catch((e) => {
    console.warn("[Stage 2 NSFW Load Warning]: Không thể tải model NSFW:", e.message);
    return null;
  });
} catch (err) {
  console.warn("[Stage 2 NSFW Load Warning]:", err.message);
}

const { checkFastText } = require("./stage1_fastFilter.helper");

/**
 * TẦNG 2: LOCAL AI VISION & IMAGE PATTERN INSPECTOR (20ms - 50ms)
 * 1. Kiểm tra tính hợp lệ & Kích thước ảnh (Sharp)
 * 2. Nhận diện nội dung 18+/khiêu dâm (NSFW AI Local)
 * 3. Trích xuất chữ trong ảnh (OCR Local) đối chiếu từ cấm
 */

  // 1. Kiểm tra cấu trúc, kích thước & tính toàn vẹn của ảnh
  async function inspectImageIntegrityAndMetadata(fileBuffer) {
    if (!sharp || !fileBuffer) {
      return { isAllowed: true };
    }

    try {
      const metadata = await sharp(fileBuffer).metadata();

        if (!metadata.width || !metadata.height) {
          return {
            isAllowed: false,
            category: "INVALID_MEDIA",
            reason: "Tập tin hình ảnh bị lỗi hoặc không thể giải mã cấu trúc.",
          };
        }

        // Chặn ảnh rác / tracking pixel quá nhỏ (< 30x30px)
        if (metadata.width < 30 || metadata.height < 30) {
          return {
            isAllowed: false,
            category: "SPAM",
            reason: "Kích thước hình ảnh quá nhỏ (nghi vấn ảnh rác hoặc pixel theo dõi).",
          };
        }

        // Chặn tỉ lệ dị thường (ảnh dẹt hoặc dài ngoằng như banner spam kéo dài)
        const aspectRatio = metadata.width / metadata.height;
        if (aspectRatio > 20 || aspectRatio < 0.05) {
          return {
            isAllowed: false,
            category: "SPAM",
            reason: "Tỉ lệ kích thước hình ảnh bất thường (vượt quá giới hạn hiển thị chuẩn).",
          };
        }

        return { isAllowed: true, metadata };
      } catch (err) {
        console.warn("[Stage 2 Metadata Warning]:", err.message);
        return {
          isAllowed: false,
          category: "INVALID_MEDIA",
          reason: "Định dạng ảnh bị hỏng hoặc không được hỗ trợ.",
        };
      }
    }

// 2. Nhận diện nội dung nhạy cảm 18+ (NSFW) cục bộ
async function inspectImageNSFWLocal(fileBuffer) {
      if (!nsfw || !tf || !nsfwModelPromise || !sharp) {
        return { isAllowed: true };
      }

      try {
        const model = await nsfwModelPromise;
        if (!model) return { isAllowed: true };

        // Dùng sharp decode ảnh sang dạng raw RGB 3 kênh để nạp vào Tensor3d
        const { data, info } = await sharp(fileBuffer)
          .resize(224, 224, { fit: "cover" })
          .removeAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });

        const numChannels = 3;
        const numPixels = info.width * info.height;
        const values = new Int32Array(numPixels * numChannels);

        for (let i = 0; i < numPixels * numChannels; i++) {
          values[i] = data[i];
        }

        const imageTensor = tf.tensor3d(values, [info.height, info.width, numChannels], "int32");
        const predictions = await model.classify(imageTensor);
        imageTensor.dispose();

        // Predictions trả về mảng các nhãn: Porn, Sexy, Hentai, Neutral, Drawing
        const pornScore = predictions.find((p) => p.className === "Porn")?.probability || 0;
        const sexyScore = predictions.find((p) => p.className === "Sexy")?.probability || 0;
        const hentaiScore = predictions.find((p) => p.className === "Hentai")?.probability || 0;

        // Ngưỡng chặn 18+ nghiêm ngặt: Porn > 65% hoặc Hentai > 70% hoặc Sexy > 85%
        if (pornScore > 0.65 || hentaiScore > 0.70 || sexyScore > 0.85) {
          return {
            isAllowed: false,
            category: "NSFW_PORN",
            reason: `Hình ảnh bị phát hiện chứa nội dung khiêu dâm/18+ nhạy cảm (Tỷ lệ: ${(
              Math.max(pornScore, hentaiScore, sexyScore) * 100
            ).toFixed(1)}%).`,
          };
        }

        return { isAllowed: true };
      } catch (err) {
        console.warn("[Stage 2 NSFW Error]:", err.message);
        return { isAllowed: true }; // Fail-open cho AI local nếu lỗi nạp
      }
    }

// 3. Đọc chữ trong ảnh (OCR) để phát hiện text cờ bạc / lừa đảo / SĐT rác
async function inspectImageOCRLocal(fileBuffer) {
  if (!Tesseract) {
    console.warn("[Tầng 2 Local Vision ⚠️] Tesseract.js chưa sẵn sàng, bỏ qua OCR.");
    return { isAllowed: true };
  }
  if (!fileBuffer) {
    console.warn("[Tầng 2 Local Vision ⚠️] Không có file buffer để quét OCR.");
    return { isAllowed: true };
  }

  try {
    console.log("[Tầng 2 Local Vision] 🔍 Đang quét OCR trích xuất chữ trong ảnh...");

    // Tối ưu tốc độ: Resize ảnh về tối đa 800px bằng sharp trước khi đưa vào OCR (giảm thời gian từ 5s xuống ~0.5s)
    let bufferForOcr = fileBuffer;
    if (sharp) {
      try {
        bufferForOcr = await sharp(fileBuffer)
          .resize(800, 800, { fit: "inside", withoutEnlargement: true })
          .toBuffer();
      } catch (resizeErr) {
        bufferForOcr = fileBuffer;
      }
    }

    // Tăng timeout lên 8 giây cho an toàn (đặc biệt khi khởi động worker lần đầu)
    const ocrPromise = Tesseract.recognize(bufferForOcr, "vie+eng", {
      logger: () => {}, // Tắt log tiến độ
    });

    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve({ timeout: true }), 8000)
    );

    const result = await Promise.race([ocrPromise, timeoutPromise]);
    if (result.timeout) {
      console.warn("[Tầng 2 Local Vision ⚠️]: Quá thời gian 8s, bỏ qua OCR để Tầng 3 xử lý.");
      return { isAllowed: true };
    }

    const extractedText = result?.data?.text?.trim() || "";
    if (!extractedText) {
      console.log("[Tầng 2 Local Vision] ℹ️ Không phát hiện chữ nào trong ảnh.");
      return { isAllowed: true };
    }

    console.log(`[Tầng 2 Local Vision] 📝 Chữ nhận diện được từ ảnh: "${extractedText.replace(/\n+/g, ' ')}"`);

    // 1. Đối chiếu với bộ lọc từ cấm của Tầng 1
    const textViolation = checkFastText(extractedText);
    if (textViolation && !textViolation.isAllowed) {
      console.log(`[Tầng 2 Local Vision] 🚫 CHẶN BỞI OCR (Trùng từ cấm Tầng 1)`);
      return {
        isAllowed: false,
        category: "IMAGE_SPAM_TEXT",
        reason: `Phát hiện nội dung văn bản vi phạm (quảng cáo/cờ bạc/lừa đảo) bên trong hình ảnh.`,
        extractedText: extractedText.slice(0, 100),
      };
    }

    // 2. Bắt các từ khóa cờ bạc / cá cược quốc tế & trong nước thường gặp trong ảnh
    const gamblingOcrPattern = /(casino|lottery|bet\s*slip|đặt\s*cược|kèo\s*nhà\s*cái|nhà\s*cái|kubet|88bet|bet88|sunwin|go88|tài\s*xỉu)/i;
    if (gamblingOcrPattern.test(extractedText)) {
      console.log(`[Tầng 2 Local Vision] 🚫 CHẶN BỞI OCR (Phát hiện cờ bạc/nhà cái)`);
      return {
        isAllowed: false,
        category: "GAMBLING_IMAGE",
        reason: "Hình ảnh chứa nội dung liên quan đến cờ bạc, cá cược hoặc nhà cái.",
        extractedText: extractedText.slice(0, 100),
      };
    }

    // 3. Bắt các mẫu poster spam kiếm tiền / SĐT lừa đảo (bao gồm cả chữ cách điệu OCR nhận diện thiếu chữ)
    const scamOcrPattern = /(?:(?:triệu|tr|trieu|riệu)\s*(?:mỗi|moi)?\s*(?:ngày|ngay)|kiếm\s*tiền|kiem\s*tien|inbox\s*ngay|chuyển\s*khoản|chuyen\s*khoan|09\d{2}[\s\.\-_*Xx]{3,})/i;
    const phonePattern = /(?:0[3|5|7|8|9])\d{2}[\s\.\-_*Xx\d]{4,}/g;
    const spamCallAction = /(zalo|inbox|liên hệ|lien he|call|tele|telegram|nhắn tin|đầu tư|lãi suất|mỗi ngày|moi ngay)/i;
    if (scamOcrPattern.test(extractedText) || (phonePattern.test(extractedText) && spamCallAction.test(extractedText))) {
      console.log(`[Tầng 2 Local Vision] 🚫 CHẶN BỞI OCR (Phát hiện poster lừa đảo/kiếm tiền/SĐT)`);
      return {
        isAllowed: false,
        category: "IMAGE_SCAM_CONTACT",
        reason: "Hình ảnh chứa thông tin số điện thoại hoặc lời mời kiếm tiền nhanh nghi vấn lừa đảo/spam.",
        extractedText: extractedText.slice(0, 100),
      };
    }

    return { isAllowed: true, extractedText };
  } catch (err) {
    console.warn("[Stage 2 OCR Error]:", err.message);
    return { isAllowed: true };
  }
}

    /**
     * Hàm điều phối toàn bộ TẦNG 2
     */
async function runStage2LocalVision({ files = [] } = {}) {
  if (!Array.isArray(files) || files.length === 0) {
    return null; // Không có ảnh -> Pass Tầng 2
  }

  console.log(`[Tầng 2 Local Vision] 🛡️ Bắt đầu kiểm tra ${files.length} ảnh upload...`);

  for (const file of files) {
    console.log(`[Tầng 2 Local Vision] 📷 File: mimetype=$1{file?.mimetype}, buffer=${file?.buffer ? file.buffer.length + ' bytes' : 'KHÔNG CÓ'}`);
    if (file?.mimetype?.startsWith("image/") && file.buffer) {
      // 1. Kiểm tra tính toàn vẹn & kích thước ảnh (Sharp)
      const integrityCheck = await inspectImageIntegrityAndMetadata(file.buffer);
      if (!integrityCheck.isAllowed) {
        console.log(`[Tầng 2 Local Vision] 🚫 CHẶN BỞI SHARP: ${integrityCheck.reason}`);
        return integrityCheck;
      }

      // 2. Kiểm tra ảnh 18+ (NSFW AI) nếu thư viện sẵn sàng
      const nsfwCheck = await inspectImageNSFWLocal(file.buffer);
      if (!nsfwCheck.isAllowed) {
        console.log(`[Tầng 2 Local Vision] 🚫 CHẶN BỞI NSFW AI: ${nsfwCheck.reason}`);
        return nsfwCheck;
      }

      // 3. Đọc text trong ảnh (OCR) nếu thư viện sẵn sàng
      const ocrCheck = await inspectImageOCRLocal(file.buffer);
      if (!ocrCheck.isAllowed) {
        console.log(`[Tầng 2 Local Vision] 🚫 CHẶN BỞI OCR: ${ocrCheck.reason}`);
        return ocrCheck;
      }
    }
  }

  console.log(`[Tầng 2 Local Vision] ✅ Toàn bộ ${files.length} ảnh đã PASS Tầng 2!`);
  return null; // Pass Tầng 2
}

      module.exports = {
        runStage2LocalVision,
        inspectImageIntegrityAndMetadata,
        inspectImageNSFWLocal,
        inspectImageOCRLocal,
      };
