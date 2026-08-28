const Chat = require("../models/chat.model");
const RoomChat = require("../models/roomChat.model");
const User = require("../models/user.model");
const mongoose = require("mongoose");
const { redisClient } = require("../../../config/redis");
const { syncUserChatBadge } = require("../../../helpers/chatBadge.helper");

// [GET] /api/v1/chat/:roomId/messages
module.exports.getMessagesByRoom = async (req, res) => {
  try {
    const userId = req.user._id;
    const { roomId } = req.params;

    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 30);
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({
        code: 400,
        message: "roomId không hợp lệ",
      });
    }

    const room = await RoomChat.findOne({
      _id: roomId,
      deleted: false,
      "users.user_id": userId,
    }).lean();

    if (!room) {
      return res.status(403).json({
        message: "Bạn không thuộc phòng chat này",
      });
    }

    // Lấy deletedAt của user trong room (thời điểm user xóa đoạn chat)
    const currentUserInRoom = room.users.find(
      (u) => u.user_id.toString() === userId.toString(),
    );

    if (!currentUserInRoom || !currentUserInRoom.isActive) {
      return res.status(403).json({
        message: "Bạn không thuộc phòng chat này",
      });
    }

    // Chỉ lấy tin nhắn SAU thời điểm xóa (nếu có)
    const messageFilter = {
      room_chat_id: roomId,
      deleted: false,
      deletedFor: { $ne: userId },
    };
    // Dùng lastDeletedAt — thời điểm xóa cuối, vẫn còn sau khi nhắn lại
    const cutoffTime = currentUserInRoom.lastDeletedAt || currentUserInRoom.deletedAt;
    if (cutoffTime) {
      messageFilter.createdAt = { $gt: cutoffTime };
    }

    const messages = await Chat.find(messageFilter)
      .populate({
        path: "user_id",
        select: "_id fullName username avatar isVerified",
      })
      .populate({
        path: "reply_to",
        select: "_id content images type revoked deleted user_id createdAt",
        populate: {
          path: "user_id",
          select: "_id fullName username avatar",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    const orderedMessages = messages.reverse();

    const lastMessage = orderedMessages[orderedMessages.length - 1];

    if (lastMessage && lastMessage._id) {
      await RoomChat.updateOne(
        {
          _id: roomId,
          "users.user_id": userId,
        },
        {
          $set: {
            "users.$.lastReadMessage": lastMessage._id,
            "users.$.lastReadAt": new Date(),
            "users.$.unreadCount": 0,
          },
        },
      ).catch((err) => console.log("RoomChat.updateOne read error:", err));

      const newBadgeCount = await syncUserChatBadge(userId.toString());
      global._io?.to(userId.toString()).emit("SERVER_UNREAD_CHAT_COUNT_UPDATED", {
        chatBadgeCount: newBadgeCount,
      });
    }

    return res.status(200).json({
      code: 200,
      message: "Lấy tin nhắn thành công",
      data: {
        messages: orderedMessages,
        page,
        limit,
        hasMore: messages.length === limit,
      },
    });
  } catch (error) {
    console.error("getMessagesByRoom error:", error);
    return res.status(500).json({
      code: 500,
      message: error.message || "Không thể lấy danh sách tin nhắn",
    });
  }
};
