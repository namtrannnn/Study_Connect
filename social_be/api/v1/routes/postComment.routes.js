const express = require("express");
const router = express.Router();

const userMiddleware = require("../middlewares/user.middleware");
const postCommentController = require("../controllers/postComment.controller");

// POST /api/v1/post/comment/:postId
router.post(
  "/:postId",
  userMiddleware.requireUser,
  postCommentController.createComment,
);

// GET /api/v1/post/comment/:postId
router.get(
  "/:postId",
  userMiddleware.requireUser,
  postCommentController.getCommentsByPost,
);

// PATCH /api/v1/post/comment/hide/:commentId
router.patch(
  "/hide/:commentId",
  userMiddleware.requireUser,
  postCommentController.hideComment,
);

// PATCH /api/v1/post/comment/edit/:commentId
router.patch(
  "/edit/:commentId",
  userMiddleware.requireUser,
  postCommentController.editComment,
);

// PATCH /api/v1/post/comment/delete/:commentId
router.patch(
  "/delete/:commentId",
  userMiddleware.requireUser,
  postCommentController.deleteComment,
);

// PATCH /api/v1/post/comment/undo-delete/:commentId
router.patch(
  "/undo-delete/:commentId",
  userMiddleware.requireUser,
  postCommentController.undoDeleteComment,
);

// GET /api/v1/post/comment/history/:commentId
router.get(
  "/history/:commentId",
  userMiddleware.requireUser,
  postCommentController.getCommentEditHistory,
);

// PATCH /api/v1/post/comment/like/:commentId
router.patch(
  "/like/:commentId",
  userMiddleware.requireUser,
  postCommentController.toggleLikeComment,
);

// PATCH /api/v1/post/comment/pin/:commentId
router.patch(
  "/pin/:commentId",
  userMiddleware.requireUser,
  postCommentController.pinComment,
);

// PATCH /api/v1/post/comment/unpin/:commentId
router.patch(
  "/unpin/:commentId",
  userMiddleware.requireUser,
  postCommentController.unpinComment,
);

// GET /api/v1/post/comment/replies/:commentId
router.get(
  "/replies/:commentId",
  userMiddleware.requireUser,
  postCommentController.getRepliesByComment,
);

// PATCH /api/v1/post/comment/allow/:postId
router.patch(
  "/allow/:postId",
  userMiddleware.requireUser,
  postCommentController.toggleAllowComments,
);

// PATCH /api/v1/post/comment/unhide/:commentId
router.patch(
  "/unhide/:commentId",
  userMiddleware.requireUser,
  postCommentController.unhideComment,
);

module.exports = router;
