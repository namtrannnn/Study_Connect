const express = require("express");
const router = express.Router();

const userMiddleware = require("../middlewares/user.middleware.js");
const controller = require("../controllers/studyRoom.controller.js");

// GET /api/v1/study-room/list
router.get("/list", userMiddleware.requireUser, controller.getPublicRooms);

// GET /api/v1/study-room/active
router.get("/active", userMiddleware.requireUser, controller.getCurrentActiveRoom);

// POST /api/v1/study-room/create
router.post("/create", userMiddleware.requireUser, controller.createRoom);

// POST /api/v1/study-room/join
router.post("/join", userMiddleware.requireUser, controller.joinRoom);

// POST /api/v1/study-room/leave
router.post("/leave", userMiddleware.requireUser, controller.leaveRoom);

// POST /api/v1/study-room/invite/respond
router.post("/invite/respond", userMiddleware.requireUser, controller.respondToInvite);

// POST /api/v1/study-room/:id/invite
router.post("/:id/invite", userMiddleware.requireUser, controller.inviteFriend);

// PATCH /api/v1/study-room/:id/update
router.patch("/:id/update", userMiddleware.requireUser, controller.updateRoomSettings);

// DELETE /api/v1/study-room/:id/close
router.delete("/:id/close", userMiddleware.requireUser, controller.closeRoom);

// GET /api/v1/study-room/:idOrCode
router.get("/:idOrCode", userMiddleware.requireUser, controller.getRoomDetails);

module.exports = router;
