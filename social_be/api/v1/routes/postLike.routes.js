const express = require("express");
const router = express.Router();

const userMiddleware = require("../middlewares/user.middleware.js");
const controller = require("../controllers/postLike.controller.js");

// POST /api/v1/post/toggle-like/:postId
router.post(
  "/toggle-like/:postId",
  userMiddleware.requireUser,
  controller.toggleLike,
);

// GET /api/v1/post/likes/:postId
router.get(
  "/likes/:postId",
  userMiddleware.requireUser,
  controller.getUsersLikedPost,
);

module.exports = router;
