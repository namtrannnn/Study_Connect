const chatSocket = require("./chat.socket");
const postCommentSocket = require("./postComment.socket");
const socketMiddleware = require("../middlewares/socket.middleware");

const { redisClient } = require("../../../config/redis");

module.exports = () => {
  socketMiddleware();

  global._io.on("connection", async (socket) => {
    console.log("client connected:", socket.id);

    const userId = socket.user._id.toString();

    socket.join(userId);

    try {
      const wasOnline = await redisClient.sIsMember("online_users", userId);

      await redisClient.sAdd(`user:${userId}:sockets`, socket.id);
      await redisClient.set(`socket:${socket.id}:user`, userId);
      await redisClient.sAdd("online_users", userId);

      const onlineUsers = await redisClient.sMembers("online_users");

      console.log("USER ONLINE:", userId);
      console.log("ONLINE USERS NOW:", onlineUsers);

      // Báo cho chính client này biết Redis đã lưu online xong
      socket.emit("SERVER_ONLINE_READY", {
        userId,
        isOnline: true,
        onlineUsers,
      });

      // Báo cho các client khác biết user này online
      if (!wasOnline) {
        socket.broadcast.emit("SERVER_USER_ONLINE", {
          userId,
          isOnline: true,
        });

        console.log("EMIT SERVER_USER_ONLINE:", userId);
      }

      chatSocket(socket);
      postCommentSocket(socket);

      socket.on("disconnect", async (reason) => {
        console.log("client disconnected:", socket.id, reason);

        await redisClient.sRem(`user:${userId}:sockets`, socket.id);
        await redisClient.del(`socket:${socket.id}:user`);

        const remainingSockets = await redisClient.sCard(
          `user:${userId}:sockets`,
        );

        console.log("REMAINING SOCKETS:", userId, remainingSockets);

        if (remainingSockets === 0) {
          await redisClient.sRem("online_users", userId);

          const lastActiveAt = new Date().toISOString();

          await redisClient.set(`user:${userId}:last_active_at`, lastActiveAt);

          console.log("USER OFFLINE:", userId);

          socket.broadcast.emit("SERVER_USER_OFFLINE", {
            userId,
            isOnline: false,
            lastActiveAt,
          });
        }
      });
    } catch (error) {
      console.error("SOCKET ONLINE STATUS ERROR:", error);
    }
  });
};
