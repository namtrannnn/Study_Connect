const chatSocket = require("./chat.socket");
const postCommentSocket = require("./postComment.socket");
const studyRoomSocket = require("./studyRoom.socket");
const socketMiddleware = require("../middlewares/socket.middleware");
const { syncUserChatBadge } = require("../../../helpers/chatBadge.helper");

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
      const chatBadgeCount = await syncUserChatBadge(userId);

      console.log("USER ONLINE:", userId);
      console.log("ONLINE USERS NOW:", onlineUsers);

      // Báo cho chính client này biết Redis đã lưu online xong
      socket.emit("SERVER_ONLINE_READY", {
        userId,
        isOnline: true,
        onlineUsers,
        chatBadgeCount,
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
      studyRoomSocket(socket);

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

          // Tự động rời khỏi bất kỳ phòng học nào đang tham gia
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

              // Báo cho những người còn lại trong phòng biết
              global._io
                .to(activeRoom._id.toString())
                .emit("SERVER_STUDY_ROOM_MEMBER_LEFT", {
                  roomId: activeRoom._id,
                  userId: userId,
                  membersCount: activeRoom.membersCount,
                });

              console.log(
                `🧹 Cleaned up user ${userId} from study room ${activeRoom._id} on disconnect`,
              );
            }
          } catch (err) {
            console.error("Auto leave study room on disconnect error:", err);
          }

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
