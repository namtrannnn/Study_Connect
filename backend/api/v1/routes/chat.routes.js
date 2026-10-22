const express = require("express");
const router = express.Router();

const chatAIController = require("../controllers/chatAI.controller");
const controller = require("../controllers/chat.controller");
const userMiddleware = require("../middlewares/user.middleware");
const upload = require("../middlewares/upload.middleware");

// POST /api/v1/chat/upload-images
router.post(
  "/upload-images",
  userMiddleware.requireUser,
  upload.array("images", 10),
  controller.uploadChatImages,
);

// PATCH /api/v1/chat/message/:messageId/revoke
router.patch("/message/:messageId/revoke", userMiddleware.requireUser, controller.revokeMessage);

// PATCH /api/v1/chat/message/:messageId/delete-for-me
router.patch("/message/:messageId/delete-for-me", userMiddleware.requireUser, controller.deleteMessageForMe);

// PATCH /api/v1/chat/message/:messageId/react
router.patch("/message/:messageId/react", userMiddleware.requireUser, controller.reactToMessage);

// GET /api/v1/chat/:roomId/messages
router.get(
  "/:roomId/messages",
  userMiddleware.requireUser,
  controller.getMessagesByRoom,
);

// POST /api/v1/chat/message/:messageId/ai/explain
router.post(
  "/message/:messageId/ai/explain",
  userMiddleware.requireUser,
  chatAIController.explainMessage,
);

// PATCH /api/v1/chat/room/:roomId/ai/theme
router.patch(
  "/room/:roomId/ai/theme",
  userMiddleware.requireUser,
  chatAIController.generateRoomTheme,
);

module.exports = router;
