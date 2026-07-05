const mongoose = require("mongoose");

const Chat = require("../models/chat.model");
const RoomChat = require("../models/roomChat.model");
const {
  explainTextWithAI,
  generateChatThemeWithCoverAI,
} = require("../services/ai.service");

// [POST] /api/v1/chat/message/:messageId/ai/explain
module.exports.explainMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        code: 400,
        message: "messageId không hợp lệ",
      });
    }

    const message = await Chat.findOne({
      _id: messageId,
      deleted: false,
      deletedFor: { $ne: userId },
    }).lean();

    if (!message) {
      return res.status(404).json({
        code: 404,
        message: "Tin nhắn không tồn tại",
      });
    }

    if (message.revoked) {
      return res.status(400).json({
        code: 400,
        message: "Không thể giải thích tin nhắn đã thu hồi",
      });
    }

    const room = await RoomChat.findOne({
      _id: message.room_chat_id,
      deleted: false,
      users: {
        $elemMatch: {
          user_id: userId,
          isActive: true,
          deletedAt: null,
        },
      },
    }).lean();

    if (!room) {
      return res.status(403).json({
        code: 403,
        message: "Bạn không có quyền xem tin nhắn này",
      });
    }

    const content = message.content?.trim();

    if (!content) {
      return res.status(400).json({
        code: 400,
        message: "Tin nhắn này không có nội dung chữ để giải thích",
      });
    }

    const explanation = await explainTextWithAI(content);

    return res.status(200).json({
      code: 200,
      message: "AI giải thích thành công",
      data: {
        messageId: message._id,
        originalContent: content,
        explanation,
      },
    });
  } catch (error) {
    console.log("explainMessage error:", error);

    return res.status(500).json({
      code: 500,
      message: "FAILED",
    });
  }
};

// [PATCH] /api/v1/chat/room/:roomId/ai/theme
module.exports.generateRoomTheme = async (req, res) => {
  try {
    const userId = req.user._id;
    const { roomId } = req.params;
    const { prompt } = req.body;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({
        code: 400,
        message: "roomId không hợp lệ",
      });
    }

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        code: 400,
        message: "Vui lòng nhập mô tả theme",
      });
    }

    const room = await RoomChat.findOne({
      _id: roomId,
      deleted: false,
      status: "active",
      users: {
        $elemMatch: {
          user_id: userId,
          isActive: true,
          deletedAt: null,
        },
      },
    });

    if (!room) {
      return res.status(404).json({
        code: 404,
        message: "Không tìm thấy phòng chat hoặc bạn không có quyền",
      });
    }

    const themeResult = await generateChatThemeWithCoverAI(prompt);

    room.themeConfig = {
      ...room.themeConfig.toObject?.(),
      name: themeResult.name,
      primary: themeResult.primary,
      background: themeResult.background,
      headerBackground: themeResult.headerBackground,
      bubbleMe: themeResult.bubbleMe,
      bubbleOther: themeResult.bubbleOther,
      textMe: themeResult.textMe,
      textOther: themeResult.textOther,
      coverImage: themeResult.coverImage,
      generatedByAI: true,
      prompt,
    };

    await room.save();

    return res.status(200).json({
      code: 200,
      message: themeResult.coverImageGenerated
        ? "AI tạo theme chat và ảnh cover thành công"
        : "AI tạo màu theme thành công, nhưng chưa tạo được ảnh cover",
      data: {
        roomId: room._id,
        themeConfig: room.themeConfig,
        coverImageGenerated: themeResult.coverImageGenerated,
        coverImageError: themeResult.coverImageError,
      },
    });
  } catch (error) {
    console.log("generateRoomTheme error:", error);

    return res.status(500).json({
      code: 500,
      message: "FAILED",
      error: error.message,
    });
  }
};
