const express = require("express");
const router = express.Router();

const controller = require("../controllers/friend.controller");
const authMiddleware = require("../middlewares/user.middleware");

// POST /api/v1/friends/request/:userId
router.post(
  "/request/:userId",
  authMiddleware.requireUser,
  controller.sendRequest,
);

// DELETE /api/v1/friends/request/:userId
router.delete(
  "/request/:userId",
  authMiddleware.requireUser,
  controller.cancelRequest,
);

// POST /api/v1/friends/accept/:userId
router.post(
  "/accept/:userId",
  authMiddleware.requireUser,
  controller.acceptRequest,
);

// DELETE /api/v1/friends/refuse/:userId
router.delete(
  "/refuse/:userId",
  authMiddleware.requireUser,
  controller.refuseRequest,
);

// GET /api/v1/friends/status/:userId
router.get(
  "/status/:userId",
  authMiddleware.requireUser,
  controller.getRelationStatus,
);

// GET /api/v1/friends/list
router.get("/list", authMiddleware.requireUser, controller.getListFriends);

// GET /api/v1/friends/list/:userId
router.get(
  "/list/:userId",
  authMiddleware.requireUser,
  controller.getListFriends,
);

// GET /api/v1/friends/following
// GET /api/v1/friends/following/:userId
router.get("/following", authMiddleware.requireUser, controller.getFollowingList);
router.get("/following/:userId", authMiddleware.requireUser, controller.getFollowingList);

// GET /api/v1/friends/followers
// GET /api/v1/friends/followers/:userId
router.get("/followers", authMiddleware.requireUser, controller.getFollowersList);
router.get("/followers/:userId", authMiddleware.requireUser, controller.getFollowersList);

// GET /api/v1/friends/suggested
router.get("/suggested", authMiddleware.requireUser, controller.getSuggestedUsers);

// GET /api/v1/friends/requests/received
router.get(
  "/requests/received",
  authMiddleware.requireUser,
  controller.getReceivedRequests,
);

module.exports = router;
