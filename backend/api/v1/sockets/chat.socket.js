const RoomChat = require("../models/roomChat.model");
const Chat = require("../models/chat.model");
const User = require("../models/user.model");
const { syncUserChatBadge } = require("../../../helpers/chatBadge.helper");

module.exports = (socket) => {
  const myUserId = socket.user._id.toString();

  // CLIENT RESET CHAT BADGE
  socket.on("CLIENT_RESET_CHAT_BADGE", async () => {
    try {
      await User.updateOne({ _id: myUserId }, { $set: { chatBadgeCount: 0 } });
    } catch (err) {
      console.error("CLIENT_RESET_CHAT_BADGE error:", err);
    }
  });

  // CLIENT JOIN ROOM CHAT
  socket.on("CLIENT_JOIN_ROOM", async (roomId) => {
    try {
      const room = await RoomChat.findOne({
        _id: roomId,
        deleted: false,
        "users.user_id": myUserId,
      });

      if (!room) {
        return socket.emit("SERVER_CHAT_ERROR", {
          message: "Bạn không thuộc phòng chat này",
        });
      }

      socket.join(roomId);
    } catch (error) {
      console.error("JOIN ROOM ERROR:", error);
      socket.emit("SERVER_CHAT_ERROR", { message: "Join room thất bại" });
    }
  });

  // CLIENT LEAVE ROOM CHAT
  socket.on("CLIENT_LEAVE_ROOM", (roomId) => {
    if (roomId) socket.leave(roomId.toString());
  });

  // CLIENT TYPING START
  socket.on("CLIENT_TYPING_START", async (data) => {
    try {
      const { room_chat_id } = data;
      if (!room_chat_id) return;

      const room = await RoomChat.findOne({
        _id: room_chat_id,
        deleted: false,
        "users.user_id": myUserId,
      }).lean();

      if (!room) return;

      socket.to(room_chat_id).emit("SERVER_TYPING_START", {
        room_chat_id,
        user_id: myUserId,
        fullName: socket.user.fullName,
        avatar: socket.user.avatar,
      });
    } catch (error) {
      console.error("TYPING START ERROR:", error);
    }
  });

  // CLIENT TYPING STOP
  socket.on("CLIENT_TYPING_STOP", async (data) => {
    try {
      const { room_chat_id } = data;
      if (!room_chat_id) return;

      const room = await RoomChat.findOne({
        _id: room_chat_id,
        deleted: false,
        "users.user_id": myUserId,
      }).lean();

      if (!room) return;

      socket.to(room_chat_id).emit("SERVER_TYPING_STOP", {
        room_chat_id,
        user_id: myUserId,
      });
    } catch (error) {
      console.error("TYPING STOP ERROR:", error);
    }
  });

  // CLIENT SEND MESSAGE
  socket.on("CLIENT_SEND_MESSAGE", async (data) => {
    try {
      const { roomChatId, content } = data;

      if (!roomChatId) {
        return socket.emit("SERVER_CHAT_ERROR", { message: "Thiếu roomChatId" });
      }

      const room = await RoomChat.findOne({
        _id: roomChatId,
        deleted: false,
        "users.user_id": myUserId,
      });

      if (!room) {
        return socket.emit("SERVER_CHAT_ERROR", { message: "Bạn không thuộc phòng chat này" });
      }

      const images = Array.isArray(data.images)
        ? data.images.map((img) => ({ url: img.url, public_id: img.public_id }))
        : [];

      if (!content?.trim() && images.length === 0) {
        return socket.emit("SERVER_CHAT_ERROR", { message: "Tin nhắn không được để trống" });
      }

      const chat = await Chat.create({
        user_id: myUserId,
        room_chat_id: roomChatId,
        content: content || "",
        images,
      });

      const bulkOps = [];

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

      const activeSocketsInRoom =
        global._io.sockets.adapter.rooms.get(roomChatId.toString()) || new Set();

      for (const member of room.users) {
        if (!member.isActive) continue;
        if (member.user_id.toString() === myUserId) continue;

        let isReceiverViewingRoom = false;
        for (const sId of activeSocketsInRoom) {
          const sObj = global._io.sockets.sockets.get(sId);
          if (sObj?.user?._id?.toString() === member.user_id.toString()) {
            isReceiverViewingRoom = true;
            break;
          }
        }

        if (isReceiverViewingRoom) {
          bulkOps.push({
            updateOne: {
              filter: { _id: roomChatId, "users.user_id": member.user_id },
              update: {
                $set: {
                  "users.$.unreadCount": 0,
                  "users.$.lastReadAt": new Date(),
                  "users.$.lastReadMessage": chat._id,
                },
              },
            },
          });
        } else {
          bulkOps.push({
            updateOne: {
              filter: { _id: roomChatId, "users.user_id": member.user_id },
              update: { $inc: { "users.$.unreadCount": 1 } },
            },
          });
        }
      }

      await RoomChat.bulkWrite(bulkOps);

      const receiverIds = room.users
        .filter((m) => m.isActive && m.user_id.toString() !== myUserId)
        .map((m) => m.user_id);

      const badgeMap = {};
      for (const rId of receiverIds) {
        const strId = rId.toString();
        badgeMap[strId] = await syncUserChatBadge(strId);
      }

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

      socket.to(roomChatId).emit("SERVER_TYPING_STOP", {
        roomChatId,
        room_chat_id: roomChatId,
        userId: myUserId,
        user_id: myUserId,
      });

      global._io.to(roomChatId).emit("SERVER_RETURN_MESSAGE", messageData);

      const updatedRoom = await RoomChat.findById(roomChatId).lean();

      for (const member of room.users) {
        if (!member.isActive) continue;

        const memberId = member.user_id.toString();
        const isSender = memberId === myUserId;

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
          chatBadgeCount: isSender ? null : (badgeMap[memberId] ?? null),
        });
      }
    } catch (error) {
      console.error("SEND MESSAGE ERROR:", error);
      socket.emit("SERVER_CHAT_ERROR", { message: "Gửi tin nhắn thất bại" });
    }
  });
};
