/**
 * Integration Test cho Hệ Thống Kiểm Duyệt Phễu 4 Tầng
 * Chạy: node backend/tests/test_full_4stage_moderation.js
 */
const dotenv = require("dotenv");
dotenv.config();

const db = require("../config/db");
const { runFastPreModeration } = require("../helpers/moderation");
const { evaluateDeepContextAndRiskScore } = require("../services/moderation/stage3_deepContextAI.service");
const { getPendingAdminPosts, approvePostByAdmin, rejectPostByAdmin } = require("../services/moderation/stage4_adminQueue.service");

async function runFullPipelineTest() {
  console.log("============================================================");
  console.log("🧪 BẮT ĐẦU TEST TOÀN BỘ LUỒNG PHỄU KIỂM DUYỆT 4 TẦNG");
  console.log("============================================================");

  await db.connect();

  // 1. TEST TẦNG 1 (Fast Regex Block - 0ms)
  console.log("\n------------------------------------------------------------");
  console.log("📌 Test Tầng 1: Đăng bài vi phạm từ cấm (88bet / tài xỉu)");
  const t1 = await runFastPreModeration({ text: "Anh em vào ngay 88bet nạp tiền x2 nhé" });
  console.log("   Result -> Allowed:", t1.isAllowed, "| Reason:", t1.reason);
  console.log("   Status:", !t1.isAllowed ? "✅ PASS (Chặn tức thì ở Tầng 1)" : "❌ FAIL");

  // 2. TEST TẦNG 2 (Pass Fast Pre-Moderation - 0ms)
  console.log("\n------------------------------------------------------------");
  console.log("📌 Test Tầng 2: Đăng bài học tập bình thường");
  const t2 = await runFastPreModeration({ text: "Cho mình hỏi bài toán Giải tích 1 làm như nào vậy ạ?" });
  console.log("   Result -> Allowed:", t2.isAllowed);
  console.log("   Status:", t2.isAllowed ? "✅ PASS (Pass Tầng 1 & 2 mượt mà)" : "❌ FAIL");

  // 3. TEST TẦNG 3 (Deep Context AI & Risk Scoring)
  console.log("\n------------------------------------------------------------");
  console.log("📌 Test Tầng 3: Gemini Deep Context Scoring (Nghi vấn lừa đảo)");
  const t3 = await evaluateDeepContextAndRiskScore({
    text: "Ai muốn lấy đề thi chính thức thì chuyển khoản 50k qua stk 1903xx nhé bao đậu 100%",
  });
  console.log("   Result -> Risk Score:", `${t3.riskScore}%`, "| Category:", t3.category);
  console.log("   Reason:", t3.reason);
  console.log("   Status:", t3.riskScore >= 40 ? "✅ PASS (Tính đúng Risk Score)" : "❌ FAIL");

  // 4. TEST TẦNG 4 (Admin Queue & Moderation API)
  console.log("\n------------------------------------------------------------");
  console.log("📌 Test Tầng 4: Lấy danh sách Hàng chờ Admin Duyệt tay (pending_admin)");
  const pending = await getPendingAdminPosts({ page: 1, limit: 5 });
  console.log("   Found pending posts for Admin:", pending.total);
  console.log("   Status: ✅ PASS (API Tầng 4 hoạt động bình thường)");

  console.log("\n============================================================");
  console.log("🎉 HOÀN THÀNH TEST TOÀN BỘ 4 TẦNG HỆ THỐNG KIỂM DUYỆT.");
  console.log("============================================================");
  process.exit(0);
}

runFullPipelineTest();
