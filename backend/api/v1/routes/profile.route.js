const express = require("express");
const router = express.Router();

const profileController = require("../controllers/profile.controller");
const userMiddleware = require("../middlewares/user.middleware");
const upload = require("../middlewares/upload.middleware");

// GET /api/v1/profile/me
router.get("/me", userMiddleware.requireUser, profileController.getMyProfile);

// GET /api/v1/profile/:userId
router.get(
  "/:userId",
  userMiddleware.requireUser,
  profileController.getProfileByUserId,
);

// GET /api/v1/profile/:userId/posts/grid
router.get(
  "/:userId/posts/grid",
  userMiddleware.requireUser,
  profileController.getUserPostGrid,
);

// GET /api/v1/profile/:userId/posts/feed
router.get(
  "/:userId/posts/feed",
  userMiddleware.requireUser,
  profileController.getUserPostFeed,
);

// PATCH /api/v1/profile/update
router.patch(
  "/update",
  userMiddleware.requireUser,
  upload.single("avatar"),
  profileController.updateProfile,
);

module.exports = router;
