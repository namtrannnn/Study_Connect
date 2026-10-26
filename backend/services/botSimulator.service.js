/**
 * ===================================================================
 * BOT SIMULATOR SERVICE - Hệ thống Bot tự hành cho StudyConnect
 * ===================================================================
 *
 * Mô tả: Bot tự động đăng bài viết vào 2 khung giờ cố định mỗi ngày:
 *   - 8:00 sáng (giờ Việt Nam)
 *   - 18:00 tối (giờ Việt Nam)
 *
 * Luồng hoạt động:
 *   1. Chọn ngẫu nhiên 1-3 bot user từ pool
 *   2. Mỗi bot tạo 1 bài viết (nội dung từ kho mẫu hoặc Gemini AI)
 *   3. Bài viết đi qua đúng phễu kiểm duyệt 4 tầng
 *   4. Phát sóng realtime qua Socket.IO tới tất cả client
 *
 * Khởi động: Gọi startBotSimulator() trong index.js
 * ===================================================================
 */

const crypto = require("crypto");
const Post = require("../api/v1/models/post.model");
const User = require("../api/v1/models/user.model");
const md5 = require("md5");
const { runFastPreModeration } = require("../helpers/moderation");
const { triggerImmediateModeration } = require("./moderation/stage3_asyncQueue.service");

// ─── Cấu hình ────────────────────────────────────────────────────────
const BOT_TAG = "nexus_bot"; // Dấu hiệu nhận biết bot user trong DB
const BOT_PASSWORD = md5("bot@nexus2026");
const TIMEZONE_OFFSET_MS = 7 * 60 * 60 * 1000; // UTC+7 (Việt Nam)

// ─── Pool thông tin Bot ──────────────────────────────────────────────
const BOT_PROFILES = [
  { fullName: "Trần Mai Anh",   username: "bot_maianh",   avatar: "https://api.dicebear.com/9.x/avataaars/png?seed=MaiAnh&backgroundColor=b6e3f4" },
  { fullName: "Nguyễn Hoàng Phúc", username: "bot_hoangphuc", avatar: "https://api.dicebear.com/9.x/avataaars/png?seed=HoangPhuc&backgroundColor=c0aede" },
  { fullName: "Lê Tuấn Kiệt",  username: "bot_tuankiet",  avatar: "https://api.dicebear.com/9.x/avataaars/png?seed=TuanKiet&backgroundColor=d1d4f9" },
  { fullName: "Phạm Thảo My",  username: "bot_thaomy",   avatar: "https://api.dicebear.com/9.x/avataaars/png?seed=ThaoMy&backgroundColor=ffd5dc" },
  { fullName: "Võ Minh Khôi",  username: "bot_minhkhoi", avatar: "https://api.dicebear.com/9.x/avataaars/png?seed=MinhKhoi&backgroundColor=c0f0e8" },
  { fullName: "Đặng Thanh Hằng", username: "bot_thanhhang", avatar: "https://api.dicebear.com/9.x/avataaars/png?seed=ThanhHang&backgroundColor=ffe0b2" },
  { fullName: "Bùi Quốc Dũng", username: "bot_quocdung", avatar: "https://api.dicebear.com/9.x/avataaars/png?seed=QuocDung&backgroundColor=bbdefb" },
  { fullName: "Huỳnh Ngọc Trâm", username: "bot_ngoctram", avatar: "https://api.dicebear.com/9.x/avataaars/png?seed=NgocTram&backgroundColor=f8bbd0" },
];

// ─── Kho nội dung bài viết mẫu (dành cho sinh viên) ────────────────
const POST_TEMPLATES = {
  morning: [
    "Sáng nay ai có lịch thi môn gì không ạ? Chúc mọi người thi tốt! 📝 #studyconnect #onthicungnhau",
    "Mình vừa tìm được slide bài giảng Mạng máy tính rất hay, ai cần mình share nha! 💻 #tailieuhoctap #mangmaytính",
    "Good morning cả nhà! Hôm nay mình bắt đầu học React Native, có ai cùng học không ạ? 🚀 #reactnative #laptrình",
    "Cho mình hỏi bài tập Xác suất thống kê chương 3 có ai giải được bài 5 không ạ? 📊 #xacsuatthongke #hoibaitap",
    "Sáng nay đi học sớm, ngồi thư viện ôn thi giữa kỳ luôn. Ai ở thư viện rủ mình ngồi chung với! 📚 #thuvien #onthi",
    "Vừa hoàn thành xong bài lab Cơ sở dữ liệu, khó quá trời 😵 Mọi người làm xong chưa? #cosodulieu #baitap",
    "Mình đang tổng hợp tài liệu ôn thi Triết học Mác-Lênin, ai góp ý thêm phần nào nha! 📖 #triethoc #tailieuonthi",
    "Sáng nay nghe tin thầy Nguyễn cho đề mở, nhẹ cả người luôn 😂 #tintức #dethimở",
    "Có bạn nào biết khi nào đăng ký thực tập không ạ? Mình sinh viên năm 3 muốn chuẩn bị sớm. 🎓 #thuctap #sinhvien",
    "Mới tìm được quán cà phê gần trường vừa yên tĩnh vừa có wifi mạnh, perfect để code! ☕ #cafehoctap #codinglife",
  ],
  evening: [
    "Chiều nay ai rảnh cùng mình review lại project môn Công nghệ phần mềm không? 🖥️ #congnghe #projectnhom",
    "Mệt quá trời, hôm nay học 4 tiết liên tục. Về nhà nấu mì gói ăn rồi code tiếp 🍜 #sinhvien #cuocsongSV",
    "Mình vừa push xong project lên GitHub, mọi người review giúp mình với nha! 🐙 #github #opensource",
    "Tối nay có ai muốn join study group online không? Mình lập phòng Discord để ôn thi cùng. 🎧 #studygroup #discord",
    "Hôm nay học được cách dùng Docker, hóa ra không khó như mình tưởng! 🐳 #docker #devops #chiase",
    "Cho mình hỏi thuật toán Dijkstra với Bellman-Ford khác nhau chỗ nào ạ? 🤔 #thuattoan #cautrucdulieuvagiaithua",
    "Vừa đi phỏng vấn thực tập ở công ty fintech, hồi hộp quá. Mọi người cầu nguyện cho mình nha! 🙏 #phongvan #thuctap",
    "Tối nay deadline báo cáo đồ án, mình viết xong phần backend rồi, còn frontend nữa thôi 💪 #doan #deadline",
    "Có ai biết khóa học Machine Learning nào miễn phí mà chất lượng không? Mình muốn học thêm. 🤖 #machinelearning #tuhoc",
    "Cuối tuần rồi, nghỉ ngơi chút rồi tuần sau chiến tiếp mọi người ơi! 🎉 #cuoituan #nghỉngơi",
  ],
};

// ─── Helper functions ────────────────────────────────────────────────
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function extractHashtags(text) {
  const matches = text.match(/#([\p{L}\p{N}_]+)/gu) || [];
  return [...new Set(matches.map((t) => t.slice(1).toLowerCase()))];
}

function getVietnamHour() {
  const now = new Date();
  const vnTime = new Date(now.getTime() + TIMEZONE_OFFSET_MS - now.getTimezoneOffset() * 60 * 1000);
  return vnTime.getHours();
}

// ─── Đảm bảo các bot user tồn tại trong DB ─────────────────────────
async function ensureBotUsers() {
  const existingBots = await User.find({ username: { $in: BOT_PROFILES.map((b) => b.username) } }).lean();
  const existingUsernames = new Set(existingBots.map((u) => u.username));

  const newBots = BOT_PROFILES.filter((b) => !existingUsernames.has(b.username));

  if (newBots.length > 0) {
    const botsToInsert = newBots.map((bot) => ({
      fullName: bot.fullName,
      username: bot.username,
      email: `${bot.username}@nexus-bot.local`,
      password: BOT_PASSWORD,
      avatar: bot.avatar,
      status: "active",
      role: "user",
      isVerified: true,
    }));

    await User.insertMany(botsToInsert);
    console.log(`🤖 [Bot Simulator] Đã tạo ${newBots.length} bot users mới: ${newBots.map((b) => b.fullName).join(", ")}`);
  }

  // Trả về tất cả bot users
  return User.find({ username: { $in: BOT_PROFILES.map((b) => b.username) } }).lean();
}

// ─── Tạo 1 bài viết từ bot ─────────────────────────────────────────
async function createBotPost(botUser, timeOfDay = "morning") {
  const templates = POST_TEMPLATES[timeOfDay] || POST_TEMPLATES.morning;
  const caption = randomItem(templates);
  const hashtags = extractHashtags(caption);

  // Chạy qua Tầng 1 & 2 của phễu kiểm duyệt (giống hệt user thật)
  const fastMod = await runFastPreModeration({ text: caption, files: [] });
  if (fastMod && !fastMod.isAllowed) {
    console.log(`⚠️ [Bot Simulator] Bài của ${botUser.fullName} bị chặn ở Pre-Moderation: ${fastMod.reason}`);
    return null;
  }

  const requestId = crypto.randomUUID();

  const newPost = new Post({
    author: botUser._id,
    postType: "normal",
    caption,
    media: [],
    location: "",
    hashtags,
    mentions: [],
    allowComments: true,
    hideLikeCount: false,
    hideShare: false,
    visibility: "public",
    allowedUsers: [],
    status: "active",
    moderationStatus: "approved",
    moderationSource: "system",
    requestId,
    contentVersion: 1,
    isAudited: true,
  });

  await newPost.save();
  await User.updateOne({ _id: botUser._id }, { $inc: { postsCount: 1 } });

  // Kích hoạt Bot AI kiểm duyệt Tầng 3 (giống hệt khi user thật đăng bài)
  triggerImmediateModeration(newPost._id);

  // Phát sóng realtime qua Socket.IO
  const postDetail = await Post.findById(newPost._id)
    .populate("author", "fullName username avatar isVerified")
    .lean();

  if (global._io && postDetail) {
    global._io.emit("SERVER_NEW_POST", { post: postDetail });
  }

  return postDetail;
}

// ─── Chạy 1 đợt bot đăng bài ───────────────────────────────────────
async function runBotPostingRound(timeOfDay = "morning") {
  try {
    const botUsers = await ensureBotUsers();

    if (botUsers.length === 0) {
      console.log("⚠️ [Bot Simulator] Không có bot user nào trong DB.");
      return;
    }

    // Chọn ngẫu nhiên 1-3 bot để đăng bài
    const count = randomInt(1, 3);
    const selectedBots = shuffleArray(botUsers).slice(0, count);

    console.log(`\n🤖 [Bot Simulator] ══════════════════════════════════════`);
    console.log(`   Khung giờ: ${timeOfDay === "morning" ? "8:00 Sáng" : "18:00 Tối"}`);
    console.log(`   Số bot đăng bài: ${selectedBots.length}`);
    console.log(`   ──────────────────────────────────────────────────────`);

    for (const bot of selectedBots) {
      // Delay ngẫu nhiên 2-10 giây giữa mỗi bot (cho tự nhiên)
      const delay = randomInt(2000, 10000);
      await new Promise((r) => setTimeout(r, delay));

      const post = await createBotPost(bot, timeOfDay);

      if (post) {
        console.log(`   ✅ ${bot.fullName} đã đăng: "${post.caption.slice(0, 50)}..."`);
      }
    }

    console.log(`🤖 [Bot Simulator] ══════════════════════════════════════\n`);
  } catch (error) {
    console.error("❌ [Bot Simulator] Lỗi khi chạy đợt đăng bài:", error.message);
  }
}

// ─── Bộ lên lịch chính ──────────────────────────────────────────────
let schedulerInterval = null;
let lastTriggeredMorning = null;
let lastTriggeredEvening = null;

function startBotSimulator() {
  console.log("🤖 [Bot Simulator] Khởi động thành công!");
  console.log("   📅 Lịch đăng bài: 8:00 sáng & 18:00 tối (UTC+7)");
  console.log("   🔄 Mỗi đợt sẽ có 1-3 bot đăng bài ngẫu nhiên");

  // Kiểm tra mỗi 60 giây xem đã tới giờ chưa
  schedulerInterval = setInterval(async () => {
    const now = new Date();
    const vnTime = new Date(now.getTime() + TIMEZONE_OFFSET_MS - now.getTimezoneOffset() * 60 * 1000);
    const hour = vnTime.getHours();
    const minute = vnTime.getMinutes();
    const today = vnTime.toISOString().slice(0, 10); // YYYY-MM-DD

    // 8:00 sáng (cho phép trong khoảng phút 0-5)
    if (hour === 8 && minute <= 5 && lastTriggeredMorning !== today) {
      lastTriggeredMorning = today;
      console.log(`🕗 [Bot Simulator] Đến giờ sáng! Bắt đầu đợt đăng bài...`);
      await runBotPostingRound("morning");
    }

    // 18:00 tối (cho phép trong khoảng phút 0-5)
    if (hour === 18 && minute <= 5 && lastTriggeredEvening !== today) {
      lastTriggeredEvening = today;
      console.log(`🌆 [Bot Simulator] Đến giờ tối! Bắt đầu đợt đăng bài...`);
      await runBotPostingRound("evening");
    }
  }, 60 * 1000); // Check mỗi 60 giây

  // Tạo sẵn bot users ngay khi khởi động
  ensureBotUsers().catch((err) => {
    console.error("❌ [Bot Simulator] Không thể tạo bot users:", err.message);
  });
}

function stopBotSimulator() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("🛑 [Bot Simulator] Đã dừng.");
  }
}

// ─── Export ──────────────────────────────────────────────────────────
module.exports = {
  startBotSimulator,
  stopBotSimulator,
  runBotPostingRound,   // Dùng để test thủ công: gọi trực tiếp từ route admin
  ensureBotUsers,
};
