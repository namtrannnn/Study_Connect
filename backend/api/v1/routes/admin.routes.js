const express = require("express");
const router = express.Router();
const controller = require("../controllers/admin.controller");
const userMiddleware = require("../middlewares/user.middleware");

// Require user authentication & admin role
router.use(userMiddleware.requireUser);
router.use(userMiddleware.requireAdmin);

// 1. Overview Stats
router.get("/stats", controller.getOverviewStats);

// 2. Users Management
router.get("/users", controller.getUsers);
router.patch("/users/:id/status", controller.updateUserStatus);
router.patch("/users/:id/role", controller.updateUserRole);
router.delete("/users/:id", controller.softDeleteUser);

// 3. Posts Management
router.get("/posts", controller.getPosts);
router.get("/posts/:id/comments", controller.getPostCommentsForAdmin);
router.get("/posts/:id/likes", controller.getPostLikesForAdmin);
router.patch("/posts/:id/status", controller.updatePostStatus);
router.delete("/posts/:id", controller.softDeletePost);


// 4. Comments Management
router.get("/comments", controller.getComments);
router.patch("/comments/:id/status", controller.updateCommentStatus);
router.delete("/comments/:id", controller.deleteComment);


// 5. Reports & AI Moderation
router.get("/reports", controller.getReports);
router.post("/reports/:id/analyze-ai", controller.analyzeReportWithAI);
router.patch("/reports/:id/resolve", controller.resolveReport);

// 7. Hashtags & Blacklist
router.get("/hashtags", controller.getHashtags);
router.post("/hashtags/blacklist", controller.addBlacklistHashtag);
router.delete("/hashtags/blacklist/:id", controller.deleteBlacklistHashtag);

// 8. Interaction Analytics
router.get("/analytics/interactions", controller.getInteractionAnalytics);

// 10. System Activity Logs
router.get("/activity-logs", controller.getActivityLogs);

module.exports = router;
