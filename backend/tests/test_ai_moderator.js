/**
 * Test AI Moderator Helper
 * Chạy lệnh: node backend/tests/test_ai_moderator.js
 */
const dotenv = require("dotenv");
dotenv.config();

const { moderatePostContent } = require("../helpers/aiModerator.helper");

async function runTests() {
  console.log("============================================================");
  console.log("🧪 TEST AI MODERATOR BOT (Text & Multi-layer)");
  console.log("============================================================");

  const testCases = [
    {
      name: "1. Bài viết học tập bình thường",
      text: "Mọi người cho mình hỏi bài tập Giải tích 1 câu 3 giải như nào vậy ạ? Cảm ơn mọi người!",
      files: [],
      expectedAllowed: true,
    },
    {
      name: "2. Bài viết dính Fast Filter (Từ khóa cấm: 88bet/cờ bạc)",
      text: "Anh em vào ngay 88bet nạp tiền x2 nhận thưởng khủng nhé!",
      files: [],
      expectedAllowed: false,
    },
    {
      name: "3. Bài viết lừa đảo nạp tiền (Gemini AI nhận diện)",
      text: "Ai muốn lấy đề thi giữa kỳ chính thức chuyển khoản stk 1903xxx 100k mình gửi ngay đề và đáp án chi tiết nhé.",
      files: [],
      expectedAllowed: false,
    },
    {
      name: "4. Bài viết công kích / Toxic",
      text: "Mấy đứa khoa CNTT toàn một lũ ngu học vô dụng.",
      files: [],
      expectedAllowed: false,
    },
  ];

  let passed = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    console.log(`\n------------------------------------------------------------`);
    console.log(`📌 Test ${i + 1}: ${tc.name}`);
    console.log(`   Text: "${tc.text}"`);

    const result = await moderatePostContent({ text: tc.text, files: tc.files });

    const isPass = result.isAllowed === tc.expectedAllowed;
    if (isPass) passed++;

    console.log(`   Result -> Allowed: ${result.isAllowed} | Category: ${result.category}`);
    console.log(`   Reason: "${result.reason}"`);
    console.log(`   Status: ${isPass ? "✅ PASS" : "❌ FAIL"}`);
  }

  console.log("\n============================================================");
  console.log(`📊 BÁO CÁO KẾT QUẢ: ${passed}/${testCases.length} PASSED`);
  console.log("============================================================");
}

runTests();
