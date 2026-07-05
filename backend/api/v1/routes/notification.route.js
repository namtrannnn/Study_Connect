const express = require("express");
const router = express.Router();

const controller = require("../controllers/notification.controller");
const authMiddleware = require("../middlewares/user.middleware");

// GET /api/v1/notifications
router.get("/", authMiddleware.requireUser, controller.index);

// PATCH /api/v1/notifications/read/:notificationId
router.patch(
  "/read/:notificationId",
  authMiddleware.requireUser,
  controller.markAsRead,
);

// PATCH /api/v1/notifications/read-all
router.patch("/read-all", authMiddleware.requireUser, controller.markAllAsRead);

// DELETE /api/v1/notifications/:notificationId
router.delete(
  "/:notificationId",
  authMiddleware.requireUser,
  controller.deleteNotification,
);

module.exports = router;
