const express = require("express");
const router = express.Router();

const controller = require("../controllers/suggest.controller");
const userMiddleware = require("../middlewares/user.middleware");

// GET /api/v1/suggest/summary
router.get(
  "/summary",
  userMiddleware.requireUser,
  controller.getSuggestSummary,
);

module.exports = router;
