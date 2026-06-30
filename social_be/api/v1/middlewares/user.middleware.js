const User = require("../models/user.model");
const { verifyAccessToken } = require("../../../helpers/jwt.helper");

module.exports.requireUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        code: 401,
        message: "Không có token!",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyAccessToken(token);

    const user = await User.findOne({
      _id: decoded.id,
      deleted: false,
      status: "active",
    }).select("-password");

    if (!user) {
      return res.status(401).json({
        code: 401,
        message: "User không tồn tại hoặc đã bị khóa",
      });
    }

    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({
        code: 401,
        message: "Token đã bị thu hồi",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      code: 401,
      message: "Token không hợp lệ hoặc đã hết hạn",
    });
  }
};
