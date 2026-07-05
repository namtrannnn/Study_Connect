const Notification = require("../models/notification.model");
const { redisClient } = require("../../../config/redis");

const createNotification = async ({
  receiver,
  sender,
  type,
  title = "",
  message,
  refId = null,
  refType = null,
}) => {
  const notification = await Notification.create({
    receiver,
    sender,
    type,
    title,
    message,
    refId,
    refType,
  });

  await redisClient.incr(`notification:${receiver}:unread_count`);

  const populatedNotification = await Notification.findById(notification._id)
    .populate("sender", "_id fullName username avatar isVerified")
    .lean();

  global._io.to(receiver.toString()).emit("SERVER_NOTIFICATION_NEW", {
    notification: populatedNotification,
  });

  return populatedNotification;
};

const getUnreadCount = async (userId) => {
  const cachedCount = await redisClient.get(
    `notification:${userId}:unread_count`,
  );

  if (cachedCount !== null) {
    return Number(cachedCount);
  }

  const count = await Notification.countDocuments({
    receiver: userId,
    isRead: false,
    deleted: false,
  });

  await redisClient.set(`notification:${userId}:unread_count`, count);

  return count;
};

module.exports = {
  createNotification,
  getUnreadCount,
};
