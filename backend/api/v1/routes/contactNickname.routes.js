const express = require("express");
const router = express.Router();
const userMiddleware = require("../middlewares/user.middleware");
const controller = require("../controllers/contactNickname.controller");

// GET /api/v1/contact-nickname — lấy tất cả biệt danh của mình
router.get("/", userMiddleware.requireUser, controller.getMyNicknames);

// PATCH /api/v1/contact-nickname/:targetId — đặt biệt danh cho người khác
router.patch("/:targetId", userMiddleware.requireUser, controller.setNickname);

module.exports = router;
