const Notification = require("../models/notification.model");
const { getUnreadCount } = require("../services/notification.service");
const { redisClient } = require("../../../config/redis");
module.exports.index = async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({
      receiver: userId,
      deleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("sender", "_id fullName username avatar isVerified")
      .lean();

    const unreadCount = await getUnreadCount(userId);

    res.json({
      code: 200,
      message: "Success",
      unreadCount,
      notifications,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: "Failed",
    });
  }
};

// [PATCH] /api/v1/notifications/read/:notificationId
module.exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const notificationId = req.params.notificationId;
    const redisKey = `notification:${userId}:unread_count`;

    const notification = await Notification.findOne({
      _id: notificationId,
      receiver: userId,
      deleted: false,
    });

    if (!notification) {
      return res.status(404).json({
        code: 404,
        message: "Notification không tồn tại",
      });
    }

    if (!notification.isRead) {
      notification.isRead = true;
      await notification.save();

      const currentCount = Number((await redisClient.get(redisKey)) || 0);

      if (currentCount > 0) {
        await redisClient.decr(redisKey);
      } else {
        await redisClient.set(redisKey, 0);
      }
    }

    return res.json({
      code: 200,
      message: "Đã đánh dấu đã đọc",
    });
  } catch (error) {
    console.log("markAsRead error:", error);

    return res.status(500).json({
      code: 500,
      message: "Failed",
      error: error.message,
    });
  }
};

// [PATCH] /api/v1/notifications/read-all
module.exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const redisKey = `notification:${userId}:unread_count`;

    await Notification.updateMany(
      {
        receiver: userId,
        isRead: false,
        deleted: false,
      },
      {
        $set: {
          isRead: true,
        },
      },
    );

    await redisClient.set(redisKey, 0);

    global._io.to(userId.toString()).emit("SERVER_NOTIFICATION_READ_ALL", {
      unreadCount: 0,
    });

    return res.json({
      code: 200,
      message: "Đã đánh dấu tất cả thông báo là đã đọc",
      unreadCount: 0,
    });
  } catch (error) {
    console.log("markAllAsRead error:", error);

    return res.status(500).json({
      code: 500,
      message: "Failed",
      error: error.message,
    });
  }
};

// [DELETE] /api/v1/notifications/:notificationId
module.exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const notificationId = req.params.notificationId;

    const notification = await Notification.findOne({
      _id: notificationId,
      receiver: userId,
      deleted: false,
    });

    if (!notification) {
      return res.status(404).json({
        code: 404,
        message: "Notification không tồn tại",
      });
    }

    // Nếu chưa đọc thì giảm unread count
    if (!notification.isRead) {
      const redisKey = `notification:${userId}:unread_count`;

      const currentCount = Number((await redisClient.get(redisKey)) || 0);

      if (currentCount > 0) {
        await redisClient.decr(redisKey);
      } else {
        await redisClient.set(redisKey, 0);
      }
    }

    notification.deleted = true;
    await notification.save();

    global._io.to(userId.toString()).emit("SERVER_NOTIFICATION_DELETED", {
      notificationId,
    });

    return res.json({
      code: 200,
      message: "Đã xóa notification",
    });
  } catch (error) {
    console.log("deleteNotification error:", error);

    return res.status(500).json({
      code: 500,
      message: "Failed",
      error: error.message,
    });
  }
};
