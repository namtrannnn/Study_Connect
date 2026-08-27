const chatSocket = require("./chat.socket");
const postCommentSocket = require("./postComment.socket");
const studyRoomSocket = require("./studyRoom.socket");
const socketMiddleware = require("../middlewares/socket.middleware");
const { syncUserChatBadge } = require("../../../helpers/chatBadge.helper");

const { redisClient } = require("../../../config/redis");

module.exports = () => {
  socketMiddleware();

  global._io.on("connection", async (socket) => {
    const userId = socket.user._id.toString();

    socket.join(userId);

    try {
      const wasOnline = await redisClient.sIsMember("online_users", userId);

      await redisClient.sAdd(`user:${userId}:sockets`, socket.id);
      await redisClient.set(`socket:${socket.id}:user`, userId);
      await redisClient.expire(`user:${userId}:sockets`, 86400);
      await redisClient.expire(`socket:${socket.id}:user`, 86400);
      await redisClient.sAdd("online_users", userId);

      const onlineUsers = await redisClient.sMembers("online_users");
      const chatBadgeCount = await syncUserChatBadge(userId);

      console.log("ONLINE USERS NOW:", onlineUsers);

      socket.emit("SERVER_ONLINE_READY", {
        userId,
        isOnline: true,
        onlineUsers,
        chatBadgeCount,
      });

      if (!wasOnline) {
        socket.broadcast.emit("SERVER_USER_ONLINE", {
          userId,
          isOnline: true,
        });
      }

      chatSocket(socket);
      postCommentSocket(socket);
      studyRoomSocket(socket);

      socket.on("disconnect", async (reason) => {
        await redisClient.sRem(`user:${userId}:sockets`, socket.id);
        await redisClient.del(`socket:${socket.id}:user`);

        const remainingSockets = await redisClient.sCard(
          `user:${userId}:sockets`,
        );

        if (remainingSockets === 0) {
          await redisClient.sRem("online_users", userId);

          try {
            const StudyRoom = require("../models/studyRoom.model");
            const activeRoom = await StudyRoom.findOne({
              status: "active",
              "members.user": userId,
            });

            if (activeRoom) {
              activeRoom.members = activeRoom.members.filter(
                (m) => m.user.toString() !== userId,
              );
              activeRoom.membersCount = activeRoom.members.length;

              if (activeRoom.membersCount === 0) {
                activeRoom.emptyAt = new Date();
              } else {
                const hasHost = activeRoom.members.some((m) => m.role === "host");
                if (!hasHost && activeRoom.members.length > 0) {
                  activeRoom.members[0].role = "host";
                }
              }

              await activeRoom.save();

              global._io
                .to(activeRoom._id.toString())
                .emit("SERVER_STUDY_ROOM_MEMBER_LEFT", {
                  roomId: activeRoom._id,
                  userId: userId,
                  membersCount: activeRoom.membersCount,
                });
            }
          } catch (err) {
            console.error("Auto leave study room on disconnect error:", err);
          }

          const lastActiveAt = new Date().toISOString();
          await redisClient.set(`user:${userId}:last_active_at`, lastActiveAt);

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
