const User = require("../models/user.model");
const { verifyAccessToken } = require("../../../helpers/jwt.helper");

module.exports = () => {
  global._io.use(async (socket, next) => {
    try {
      const authHeader = socket.handshake.headers?.authorization;

      const bearerToken = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        bearerToken;

      if (!token) {
        return next(new Error("NO_TOKEN"));
      }

      const decoded = verifyAccessToken(token);

      const user = await User.findOne({
        _id: decoded.id,
        deleted: false,
        status: "active",
      }).select("-password");

      if (!user) {
        return next(new Error("USER_NOT_FOUND"));
      }

      if (decoded.tokenVersion !== user.tokenVersion) {
        return next(new Error("TOKEN_REVOKED"));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.log("AUTH_SOCKET_FAILED:", error.message);
      next(new Error("AUTH_SOCKET_FAILED"));
    }
  });
};
