const express = require("express");
const router = express.Router();
const controller = require("../controllers/adminModeration.controller");
const userMiddleware = require("../middlewares/user.middleware");

// Yêu cầu xác thực tài khoản & quyền quản trị viên (Admin)
router.use(userMiddleware.requireUser);
router.use(userMiddleware.requireAdmin);

router.get("/pending", controller.getPendingPosts);
router.patch("/approve/:id", controller.approvePost);
router.patch("/reject/:id", controller.rejectPost);
router.patch("/resolve-appeal/:id", controller.resolveAppeal);

module.exports = router;

