const express = require("express");
const router = express.Router();
const userMiddleware = require("../middlewares/user.middleware");
const controller = require("../controllers/report.controller");

// [POST] /api/v1/report
router.post("/", userMiddleware.requireUser, controller.createReport);

module.exports = router;
