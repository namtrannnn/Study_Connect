const express = require("express");
const router = express.Router();

const searchController = require("../controllers/search.controller");
const authMiddleware = require("../middlewares/user.middleware");

router.get("/", authMiddleware.requireUser, searchController.globalSearch);

module.exports = router;
