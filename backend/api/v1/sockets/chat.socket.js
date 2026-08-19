const RoomChat = require("../models/roomChat.model");
const Chat = require("../models/chat.model");

module.exports = (socket) => {
  const myUserId = socket.user._id.toString();

  // CLIENT JOIN ROOM CHAT
  socket.on("CLIENT_JOIN_ROOM", async (roomId) => {
    try {
      const myUserId = socket.user._id.toString();

      console.log("CLIENT_JOIN_ROOM received");
      console.log("user:", myUserId);
      console.log("roomId:", roomId);

      const room = await RoomChat.findOne({
        _id: roomId,
        deleted: false,
        "users.user_id": myUserId,
      });

      if (!room) {
        console.log("JOIN FAIL: user không thuộc room");
        return socket.emit("SERVER_CHAT_ERROR", {
          message: "Bạn không thuộc phòng chat này",
        });
      }

      socket.join(roomId);

      console.log("JOIN ROOM SUCCESS:", roomId);
    } catch (error) {
      console.log("JOIN ROOM ERROR:", error);
      socket.emit("SERVER_CHAT_ERROR", {
        message: "Join room thất bại",
      });
    }
  });

  // CLIENT TYPING START
  socket.on("CLIENT_TYPING_START", async (data) => {
    try {
      const myUserId = socket.user._id.toString();
      const { room_chat_id } = data;

      console.log("⌨️ CLIENT_TYPING_START received");
      console.log("user:", myUserId);
      console.log("room_chat_id:", room_chat_id);

      if (!room_chat_id) return;

      const room = await RoomChat.findOne({
        _id: room_chat_id,
        deleted: false,
        "users.user_id": myUserId,
      }).lean();

      if (!room) {
        console.log("TYPING START FAIL: user không thuộc room");
        return socket.emit("SERVER_CHAT_ERROR", {
          message: "Bạn không thuộc phòng chat này",
        });
      }

      socket.to(room_chat_id).emit("SERVER_TYPING_START", {
        room_chat_id,
        user_id: myUserId,
        fullName: socket.user.fullName,
        avatar: socket.user.avatar,
      });

      console.log("EMIT SERVER_TYPING_START TO ROOM:", room_chat_id);
    } catch (error) {
      console.log("TYPING START ERROR:", error);
    }
  });

  // CLIENT TYPING STOP
  socket.on("CLIENT_TYPING_STOP", async (data) => {
    try {
      const myUserId = socket.user._id.toString();
      const { room_chat_id } = data;

      console.log("CLIENT_TYPING_STOP received");
      console.log("user:", myUserId);
      console.log("room_chat_id:", room_chat_id);

      if (!room_chat_id) return;

      const room = await RoomChat.findOne({
        _id: room_chat_id,
        deleted: false,
        "users.user_id": myUserId,
      }).lean();

      if (!room) {
        console.log("TYPING STOP FAIL: user không thuộc room");
        return socket.emit("SERVER_CHAT_ERROR", {
          message: "Bạn không thuộc phòng chat này",
        });
      }

      socket.to(room_chat_id).emit("SERVER_TYPING_STOP", {
        room_chat_id,
        user_id: myUserId,
      });

      console.log("EMIT SERVER_TYPING_STOP TO ROOM:", room_chat_id);
    } catch (error) {
      console.log("TYPING STOP ERROR:", error);
    }
  });

  // CLIENT SEND MESSAGE
  socket.on("CLIENT_SEND_MESSAGE", async (data) => {
    try {
      const myUserId = socket.user._id.toString();
      const { roomChatId, content } = data;

      console.log("CLIENT_SEND_MESSAGE received");
      console.log("sender:", myUserId);
      console.log("data:", data);

      if (!roomChatId) {
        console.log("Missing roomChatId");
        return socket.emit("SERVER_CHAT_ERROR", {
          message: "Thiếu roomChatId",
        });
      }

      const room = await RoomChat.findOne({
        _id: roomChatId,
        deleted: false,
        "users.user_id": myUserId,
      });

      if (!room) {
        console.log("SEND FAIL: user không thuộc room");
        return socket.emit("SERVER_CHAT_ERROR", {
          message: "Bạn không thuộc phòng chat này",
        });
      }

      const images = Array.isArray(data.images)
        ? data.images.map((img) => ({
            url: img.url,
            public_id: img.public_id,
          }))
        : [];

      if (!content?.trim() && images.length === 0) {
        return socket.emit("SERVER_CHAT_ERROR", {
          message: "Tin nhắn không được để trống",
        });
      }

      const chat = await Chat.create({
        user_id: myUserId,
        room_chat_id: roomChatId,
        content: content || "",
        images,
      });

      // CẬP NHẬT TIN NHẮN CUỐI CHO ROOM + TĂNG unreadCount cho các member không phải sender
      const bulkOps = [];

      // Cập nhật lastMessage cho tất cả
      bulkOps.push({
        updateOne: {
          filter: { _id: roomChatId },
          update: {
            $set: {
              lastMessage: {
                message_id: chat._id,
                sender: myUserId,
                content: chat.content,
                imagesCount: images.length,
                createdAt: chat.createdAt,
              },
            },
          },
        },
      });

      // Tăng unreadCount cho từng member isActive không phải sender
      for (const member of room.users) {
        if (!member.isActive) continue;
        if (member.user_id.toString() === myUserId) continue;

        bulkOps.push({
          updateOne: {
            filter: {
              _id: roomChatId,
              "users.user_id": member.user_id,
            },
            update: {
              $inc: { "users.$.unreadCount": 1 },
            },
          },
        });
      }

      await RoomChat.bulkWrite(bulkOps);

      const messageData = {
        _id: chat._id,
        user_id: myUserId,
        roomChatId,
        room_chat_id: roomChatId,
        content: chat.content,
        images,
        createdAt: chat.createdAt,
        sender: {
          _id: socket.user._id,
          fullName: socket.user.fullName,
          username: socket.user.username,
          avatar: socket.user.avatar,
          isVerified: socket.user.isVerified,
        },
      };

      console.log("MESSAGE SAVED:", chat._id);
      console.log("EMIT SERVER_RETURN_MESSAGE TO ROOM:", roomChatId);

      // Tắt typing cho người khác trong room
      socket.to(roomChatId).emit("SERVER_TYPING_STOP", {
        roomChatId,
        room_chat_id: roomChatId,
        userId: myUserId,
        user_id: myUserId,
      });

      // Trả tin nhắn mới về tất cả client đang ở room
      global._io.to(roomChatId).emit("SERVER_RETURN_MESSAGE", messageData);

      // Báo cho từng user trong room cập nhật danh sách chat + tổng unread
      const updatedRoom = await RoomChat.findById(roomChatId).lean();

      for (const member of room.users) {
        if (!member.isActive) continue;

        const memberId = member.user_id.toString();
        const isSender = memberId === myUserId;

        // Tính tổng unread của user này trên tất cả room
        const allRooms = await RoomChat.find({
          deleted: false,
          users: {
            $elemMatch: {
              user_id: member.user_id,
              isActive: true,
              deletedAt: null,
            },
          },
        }).lean();

        const totalUnread = allRooms.reduce((sum, r) => {
          const m = r.users.find(
            (u) => u.user_id.toString() === memberId,
          );
          return sum + (m?.unreadCount || 0);
        }, 0);

        // Lấy unreadCount của room này cho user này
        const memberInUpdatedRoom = updatedRoom?.users?.find(
          (u) => u.user_id.toString() === memberId,
        );
        const roomUnread = isSender ? 0 : (memberInUpdatedRoom?.unreadCount || 0);

        global._io.to(memberId).emit("SERVER_CHAT_LIST_UPDATED", {
          roomId: roomChatId,
          lastMessage: {
            message_id: chat._id,
            sender: myUserId,
            content: chat.content,
            imagesCount: images.length,
            createdAt: chat.createdAt,
          },
          roomUnreadCount: roomUnread,
          totalUnreadCount: totalUnread,
        });
      }
    } catch (error) {
      console.log("SEND MESSAGE ERROR:", error);
      socket.emit("SERVER_CHAT_ERROR", {
        message: "Gửi tin nhắn thất bại",
      });
    }
  });
};
