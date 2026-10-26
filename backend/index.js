require("dotenv").config({ override: true });
const express = require("express");
const db = require("./config/db");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const routerApiVer1 = require("./api/v1/routes/index");

const http = require("http");
const { Server } = require("socket.io");
const { connectRedis, redisClient } = require("./config/redis");
db.connect();
connectRedis().then(async () => {
  // Xóa suggest cache cũ khi server khởi động
  try {
    await redisClient.del("suggest:hotPosts", "suggest:trendingHashtags", "suggest:suggestedQuiz");
    console.log("Suggest cache cleared on startup");
  } catch (_) {}

  // Clear online users cũ khi server restart
  // (tránh ghost users còn sót từ session trước)
  try {
    const oldOnlineUsers = await redisClient.sMembers("online_users");
    if (oldOnlineUsers.length > 0) {
      await redisClient.del("online_users");
      // Xóa socket sets của các user cũ
      for (const userId of oldOnlineUsers) {
        await redisClient.del(`user:${userId}:sockets`);
      }
      console.log(`Cleared ${oldOnlineUsers.length} ghost online users on startup`);
    }
  } catch (_) {}
});

const app = express();
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  "http://localhost:55321",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5000",
  "http://127.0.0.1:55321",
];

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     credentials: true,
//   }),
// );

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(bodyParser.json());

const port = process.env.PORT || 5000;

routerApiVer1(app);

// Phục vụ frontend tĩnh khi chạy production build
const path = require("path");
const fs = require("fs");
const frontendBuildPath = path.join(__dirname, "../frontend/build");
if (fs.existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/") || req.path.startsWith("/socket.io")) {
      return next();
    }
    res.sendFile(path.join(frontendBuildPath, "index.html"));
  });
}

// SOCKET [IO]
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
  path: "/socket.io",
});

global._io = io;

const socketIO = require("./api/v1/sockets/index");
socketIO();
// END SOCKET

// KÍCH HOẠT AUTO-SCANNER BOT PHỄU 4 TẦNG (TẦNG 3 ASYNC WORKER)
const { startStage3Worker } = require("./services/moderation/stage3_asyncQueue.service");
startStage3Worker();

// KÍCH HOẠT BOT SIMULATOR (Tự động đăng bài lúc 8h sáng & 18h tối)
const { startBotSimulator } = require("./services/botSimulator.service");
startBotSimulator();

server.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
