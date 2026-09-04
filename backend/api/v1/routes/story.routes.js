const express = require("express");
const router = express.Router();

const userMiddleware = require("../middlewares/user.middleware.js");
const upload = require("../middlewares/upload.middleware");

const controller = require("../controllers/story.controller.js");

// Tạo story ảnh/video/text
router.post(
  "/create",
  userMiddleware.requireUser,
  upload.fields([
    { name: "media", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),
  controller.createStory,
);

// Share post lên story
router.post(
  "/share-post/:postId",
  userMiddleware.requireUser,
  controller.sharePostToStory,
);

// Lấy story feed
router.get("/feed", userMiddleware.requireUser, controller.getStoryFeed);

// Lấy story của mình
router.get("/me", userMiddleware.requireUser, controller.getMyStories);

// Lấy story của user khác
router.get(
  "/user/:userId",
  userMiddleware.requireUser,
  controller.getStoriesByUser,
);

// Đánh dấu đã xem story
router.post("/view/:storyId", userMiddleware.requireUser, controller.viewStory);

// Lấy danh sách người xem
router.get(
  "/viewers/:storyId",
  userMiddleware.requireUser,
  controller.getStoryViewers,
);

// Phản hồi (reply) story
router.post(
  "/reply/:storyId",
  userMiddleware.requireUser,
  controller.replyStory,
);

// Xóa story
router.patch(
  "/delete/:storyId",
  userMiddleware.requireUser,
  controller.deleteStory,
);

module.exports = router;
