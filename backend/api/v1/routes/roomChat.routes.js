const express = require("express");
const router = express.Router();

const controller = require("../controllers/roomChat.controller");
const userMiddleware = require("../middlewares/user.middleware");

// GET /api/v1/room-chat/themes (danh sách preset themes)
router.get("/themes", userMiddleware.requireUser, controller.getPresetThemes);

// GET /api/v1/room-chat
router.get("/", userMiddleware.requireUser, controller.getMyRooms);

// POST /api/v1/room-chat/create
router.post("/create", userMiddleware.requireUser, controller.create);

// POST /api/v1/room-chat/get-or-create-friend
router.post(
  "/get-or-create-friend",
  userMiddleware.requireUser,
  controller.getOrCreateFriend,
);

// POST /api/v1/room-chat/create-private/:userId  (alias dùng từ ProfilePage)
router.post(
  "/create-private/:userId",
  userMiddleware.requireUser,
  controller.createPrivateFromProfile,
);

// PATCH /api/v1/room-chat/:roomId/mute
router.patch("/:roomId/mute", userMiddleware.requireUser, controller.muteRoom);

// PATCH /api/v1/room-chat/:roomId/pin
router.patch("/:roomId/pin", userMiddleware.requireUser, controller.pinRoom);

// PATCH /api/v1/room-chat/:roomId/archive
router.patch(
  "/:roomId/archive",
  userMiddleware.requireUser,
  controller.archiveRoom,
);

// PATCH /api/v1/room-chat/:roomId/delete-for-me
router.patch(
  "/:roomId/delete-for-me",
  userMiddleware.requireUser,
  controller.deleteRoomForMe,
);

// PATCH /api/v1/room-chat/:roomId/title
router.patch(
  "/:roomId/title",
  userMiddleware.requireUser,
  controller.updateGroupTitle,
);

// PATCH /api/v1/room-chat/:roomId/avatar (URL string)
router.patch(
  "/:roomId/avatar",
  userMiddleware.requireUser,
  controller.updateGroupAvatar,
);

// PATCH /api/v1/room-chat/:roomId/avatar/upload (multipart file → Cloudinary)
const upload = require("../middlewares/upload.middleware");
router.patch(
  "/:roomId/avatar/upload",
  userMiddleware.requireUser,
  upload.single("avatar"),
  controller.uploadGroupAvatar,
);

// PATCH /api/v1/room-chat/:roomId/theme
router.patch(
  "/:roomId/theme",
  userMiddleware.requireUser,
  controller.updateRoomTheme,
);

// PATCH /api/v1/room-chat/:roomId/nickname
router.patch(
  "/:roomId/nickname",
  userMiddleware.requireUser,
  controller.updateMyNickname,
);

// PATCH /api/v1/room-chat/:roomId/members/add
router.patch(
  "/:roomId/members/add",
  userMiddleware.requireUser,
  controller.addMembers,
);

// PATCH /api/v1/room-chat/:roomId/leave
router.patch(
  "/:roomId/leave",
  userMiddleware.requireUser,
  controller.leaveGroup,
);

// PATCH /api/v1/room-chat/:roomId/members/:userId/kick
router.patch(
  "/:roomId/members/:userId/kick",
  userMiddleware.requireUser,
  controller.kickMember,
);

// PATCH /api/v1/room-chat/:roomId/members/:userId/role
router.patch(
  "/:roomId/members/:userId/role",
  userMiddleware.requireUser,
  controller.updateMemberRole,
);

// PATCH /api/v1/room-chat/:roomId/transfer-owner
router.patch(
  "/:roomId/transfer-owner",
  userMiddleware.requireUser,
  controller.transferOwner,
);
// PATCH /api/v1/room-chat/:roomId/settings
router.patch(
  "/:roomId/settings",
  userMiddleware.requireUser,
  controller.updateGroupSettings,
);
// PATCH /api/v1/room-chat/:roomId/read
router.patch(
  "/:roomId/read",
  userMiddleware.requireUser,
  controller.markRoomAsRead,
);

module.exports = router;
