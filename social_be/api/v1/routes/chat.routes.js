const express = require("express");
const router = express.Router();

const chatAIController = require("../controllers/chatAI.controller");
const controller = require("../controllers/chat.controller");
const userMiddleware = require("../middlewares/user.middleware");

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
