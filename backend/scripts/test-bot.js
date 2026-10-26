/**
 * Test Bot Simulator - Chạy 1 đợt đăng bài ngay lập tức
 * Lệnh: node scripts/test-bot.js
 */
require("dotenv").config();
const db = require("../config/db");
const { runBotPostingRound, ensureBotUsers } = require("../services/botSimulator.service");

async function main() {
  console.log("🧪 Bắt đầu test Bot Simulator...\n");

  await db.connect();

  // Đảm bảo bot users đã tồn tại
  const bots = await ensureBotUsers();
  console.log(`📋 Có ${bots.length} bot users trong DB\n`);

  // Chạy 1 đợt đăng bài ngay
  await runBotPostingRound("evening");

  console.log("\n✅ Test hoàn tất!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Lỗi:", err);
  process.exit(1);
});
