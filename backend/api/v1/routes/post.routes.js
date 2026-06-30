const express = require("express");
const router = express.Router();

const userMiddleware = require("../middlewares/user.middleware.js");
const upload = require("../middlewares/upload.middleware");
const controller = require("../controllers/post.controller.js");

// POST /api/v1/post/create
router.post(
  "/create",
  userMiddleware.requireUser,
  upload.array("images", 10),
  controller.createPost,
);

// PATCH /api/v1/post/edit/:id
router.patch(
  "/edit/:id",
  userMiddleware.requireUser,
  upload.array("images", 10),
  controller.editPost,
);

// GET /api/v1/post/feed
router.get("/feed", userMiddleware.requireUser, controller.getFeedPosts);

// GET /api/v1/post/me
router.get("/me", userMiddleware.requireUser, controller.getMyPosts);

// GET /api/v1/post/user/:userId
router.get(
  "/user/:userId",
  userMiddleware.requireUser,
  controller.getPostsByUser,
);

// GET /api/v1/post/related/:id
router.get(
  "/related/:id",
  userMiddleware.requireUser,
  controller.getRelatedPosts,
);

// PATCH /api/v1/post/delete/:id
router.patch("/delete/:id", userMiddleware.requireUser, controller.deletePost);

// POST /api/v1/post/pin/:id
router.post("/pin/:id", userMiddleware.requireUser, controller.pinPost);

// DELETE /api/v1/post/pin/:id
router.delete("/pin/:id", userMiddleware.requireUser, controller.unpinPost);

// POST /api/v1/post/share/:postId
router.post("/share/:postId", userMiddleware.requireUser, controller.sharePost);

// GET /api/v1/post/:id
// Route động /:id nên để gần cuối
router.get("/:id", userMiddleware.requireUser, controller.detailPost);

module.exports = router;
