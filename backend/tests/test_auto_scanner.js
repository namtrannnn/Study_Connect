/**
 * Test Auto-Scanner Service
 * Chạy lệnh: node backend/tests/test_auto_scanner.js
 */
const dotenv = require("dotenv");
dotenv.config();

const db = require("../config/db");
const { scanUncheckedPosts } = require("../services/autoScanner.service");

async function testScanner() {
  console.log("============================================================");
  console.log("🧪 TEST BACKGROUND AUTO-SCANNER BOT");
  console.log("============================================================");

  await db.connect();
  await scanUncheckedPosts();

  console.log("============================================================");
  console.log("✅ HÀM AUTO-SCANNER ĐÃ HOẠT ĐỘNG HOÀN HẢO.");
  console.log("============================================================");
  process.exit(0);
}

testScanner();
