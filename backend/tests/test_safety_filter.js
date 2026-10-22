/**
 * Script test Safety Filter - Giả lập các response từ Gemini AI
 * Chạy: node test_safety_filter.js
 */

// Giả lập các loại response từ Gemini AI
const testCases = [
  {
    name: "✅ Ảnh bình thường - Có caption",
    response: {
      candidates: [{
        finishReason: "STOP",
        content: {
          parts: [{
            text: JSON.stringify([
              { tone: "Chân thành", text: "Caption test #studyconnect" },
              { tone: "Hài hước", text: "Caption test 2 #fun" },
              { tone: "Sâu lắng", text: "Caption test 3 #life" },
              { tone: "Động lực", text: "Caption test 4 #motivation" },
            ])
          }]
        }
      }]
    },
    expectedStatus: 200,
  },
  {
    name: "🚫 Ảnh nhạy cảm - finishReason=SAFETY",
    response: {
      candidates: [{
        finishReason: "SAFETY",
        content: { parts: [{ text: "" }] }
      }]
    },
    expectedStatus: 400,
  },
  {
    name: "🚫 Ảnh bị chặn - blockReason=SAFETY",
    response: {
      promptFeedback: {
        blockReason: "SAFETY",
        safetyRatings: [
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", probability: "HIGH" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", probability: "NEGLIGIBLE" },
        ]
      },
      candidates: []
    },
    expectedStatus: 400,
  },
  {
    name: "🚫 Ảnh vi phạm bản quyền - finishReason=RECITATION",
    response: {
      candidates: [{
        finishReason: "RECITATION",
        content: { parts: [{ text: "" }] }
      }]
    },
    expectedStatus: 400,
  },
  {
    name: "⚠️ Gemini server quá tải",
    response: {
      error: {
        code: 503,
        status: "UNAVAILABLE",
        message: "The model is temporarily overloaded. Please try again later."
      }
    },
    expectedStatus: 500,
  },
];

// Logic xử lý giống hệt trong post.controller.js (dòng 1496-1531)
function simulateResponse(data) {
  // Check error
  if (data?.error) {
    const userMsg = data.error.message?.includes("high demand") || data.error.code === 503
      ? "Máy chủ Gemini AI hiện đang quá tải. Vui lòng thử lại sau!"
      : `Lỗi từ Gemini AI: ${data.error.message}`;
    return { status: 500, message: userMsg };
  }

  // Check Safety Filter
  const candidate = data?.candidates?.[0];
  const finishReason = candidate?.finishReason;
  const blockReason = data?.promptFeedback?.blockReason;

  if (finishReason === "SAFETY" || blockReason === "SAFETY" || finishReason === "RECITATION") {
    return {
      status: 400,
      message: "Hình ảnh có thể chứa nội dung nhạy cảm / không phù hợp nên Gemini AI từ chối phân tích."
    };
  }

  // Parse caption
  const rawText = candidate?.content?.parts?.[0]?.text || "";
  try {
    const parsed = JSON.parse(rawText);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return { status: 200, message: "Tạo caption thành công", data: parsed };
    }
  } catch (e) {
    // parse error
  }

  return { status: 500, message: "Không thể tạo gợi ý caption" };
}

// Chạy test
console.log("=" .repeat(60));
console.log("🧪 TEST SAFETY FILTER - Giả lập response từ Gemini AI");
console.log("=".repeat(60));
console.log("");

let passed = 0;
let failed = 0;

testCases.forEach((tc, i) => {
  const result = simulateResponse(tc.response);
  const isPass = result.status === tc.expectedStatus;

  if (isPass) passed++;
  else failed++;

  console.log(`${i + 1}. ${tc.name}`);
  console.log(`   Expected: ${tc.expectedStatus} | Got: ${result.status} | ${isPass ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`   Message: "${result.message}"`);
  console.log("");
});

console.log("=".repeat(60));
console.log(`📊 Kết quả: ${passed}/${testCases.length} PASSED, ${failed} FAILED`);
console.log("=".repeat(60));
