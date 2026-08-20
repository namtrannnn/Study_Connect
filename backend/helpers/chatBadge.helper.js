const RoomChat = require("../api/v1/models/roomChat.model");
const User = require("../api/v1/models/user.model");

/**
 * Tính số lượng CUỘC TRÒ CHUYỆN (RoomChat) chưa đọc của user (theo phong cách TikTok).
 * Mỗi roomChat có tin nhắn chưa đọc sẽ chỉ được tính là 1 (dù có 1 hay 1000 tin nhắn).
 */
const getUnreadConversationsCount = async (userId) => {
  if (!userId) return 0;
  try {
    const count = await RoomChat.countDocuments({
      deleted: false,
      users: {
        $elemMatch: {
          user_id: userId,
          isActive: true,
          unreadCount: { $gt: 0 },
        },
      },
    });
    return count;
  } catch (error) {
    console.error("getUnreadConversationsCount error:", error);
    return 0;
  }
};

/**
 * Tính lại số cuộc trò chuyện chưa đọc và đồng bộ vào User.chatBadgeCount trong DB.
 * Trả về chatBadgeCount mới nhất.
 */
const syncUserChatBadge = async (userId) => {
  if (!userId) return 0;
  try {
    const count = await getUnreadConversationsCount(userId);
    await User.updateOne(
      { _id: userId },
      { $set: { chatBadgeCount: count } },
    );
    return count;
  } catch (error) {
    console.error("syncUserChatBadge error:", error);
    return 0;
  }
};

module.exports = {
  getUnreadConversationsCount,
  syncUserChatBadge,
};
