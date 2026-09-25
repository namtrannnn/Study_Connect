const express = require("express");
const router = express.Router();

const controller = require("../controllers/adminModeration.controller");

router.get("/pending", controller.getPendingPosts);
router.patch("/approve/:id", controller.approvePost);
router.patch("/reject/:id", controller.rejectPost);

module.exports = router;
