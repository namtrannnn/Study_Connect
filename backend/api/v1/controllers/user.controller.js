const User = require("../models/user.model");
const ForgetPassword = require("../models/forgetPassword.model");
const sendMail = require("../../../helpers/sendMail");
const md5 = require("md5");

const { generateAccessToken } = require("../../../helpers/jwt.helper");

function removeVietnameseTones(str = "") {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function normalizeUsername(str = "") {
  return removeVietnameseTones(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, "");
}

async function generateUniqueUsername(fullName, email) {
  let base = normalizeUsername(fullName);

  if (!base) {
    base = normalizeUsername(email?.split("@")[0]);
  }

  if (!base) {
    base = "user";
  }

  let username = base;

  while (await User.exists({ username })) {
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    username = `${base}${randomNumber}`;
  }

  return username;
}

// [POST] api/v1/user/register
module.exports.register = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = md5(req.body.password);

    const user = await User.findOne({
      email: email,
      deleted: false,
    });

    if (user) {
      return res.json({
        code: 400,
        message: "Email này đã tồn tại!",
      });
    }

    let username;

    if (req.body.username) {
      username = normalizeUsername(req.body.username);

      const usernameExists = await User.findOne({
        username,
        deleted: false,
      });

      if (usernameExists) {
        return res.json({
          code: 400,
          message: "Username này đã tồn tại!",
        });
      }
    } else {
      username = await generateUniqueUsername(req.body.fullName, email);
    }

    const newUser = new User({
      ...req.body,
      email,
      username,
      password,
    });

    await newUser.save();

    const token = generateAccessToken(newUser);

    const userResponse = newUser.toObject();
    delete userResponse.password;

    return res.json({
      code: 200,
      message: "Tạo tài khoản thành công!",
      token,
      user: userResponse,
    });
  } catch (error) {
    return res.json({
      code: 400,
      message: error.message,
    });
  }
};

// [POST] api/v1/user/login
module.exports.login = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    const user = await User.findOne({
      email: email,
      deleted: false,
    });

    if (!user) {
      return res.json({
        code: 400,
        message: "Email này không tồn tại!",
      });
    }

    if (md5(password) !== user.password) {
      return res.json({
        code: 400,
        message: "Mật khẩu không chính xác!",
      });
    }

    if (user.status !== "active") {
      return res.json({
        code: 403,
        message: "Tài khoản đang bị khóa hoặc chưa hoạt động!",
      });
    }

    const token = generateAccessToken(user);

    const userResponse = user.toObject();
    delete userResponse.password;

    return res.json({
      code: 200,
      message: "Đăng nhập thành công!",
      token,
      user: userResponse,
    });
  } catch (error) {
    return res.json({
      code: 400,
      message: error.message,
    });
  }
};

// [GET] api/v1/user/detail == unfinished ==
module.exports.detail = async (req, res) => {
  const id = req.body.user_id;
  const user = await User.findOne({
    _id: id,
  });
  res.json(user);
};

// [POST] api/v1/user/forgetPassword
module.exports.forgetPassword = async (req, res) => {
  try {
    const email = req.body.email;
    const user = await User.findOne({
      email: email,
      deleted: false,
    });
    if (!user) {
      res.json({
        code: 400,
        message: "Email này không tồn tại!",
      });
      return;
    }
    const otp = new ForgetPassword({ email });
    await otp.save();
    const subject = "Mã OTP để lấy lại mật khẩu.";
    const html = `
      Mã OTP để lấy lại mật khẩu là ${otp.otp}. Mã sẽ hết hạn sau 3 phút nữa!
    `;
    sendMail.sendMail(email, subject, html);
    res.json({
      code: 200,
      message: `Đã gửi mã OTP đến ${email}`,
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message,
    });
  }
};

// [POST] api/v1/user/otpPassword
module.exports.otpPassword = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const otp = req.body.otp;

    const result = await ForgetPassword.findOne({
      email: email,
      otp: otp,
    });

    if (!result) {
      return res.json({
        code: 400,
        message: "Mã OTP không hợp lệ!",
      });
    }

    const user = await User.findOne({
      email: email,
      deleted: false,
    });

    if (!user) {
      return res.json({
        code: 400,
        message: "User không tồn tại!",
      });
    }

    const token = generateAccessToken(user);

    return res.json({
      code: 200,
      message: "Xác thực thành công!",
      token,
    });
  } catch (error) {
    return res.json({
      code: 400,
      message: error.message,
    });
  }
};

// [POST] api/v1/user/resetPassword
module.exports.resetPassword = async (req, res) => {
  try {
    const password = req.body.password;
    const user = req.user;

    if (!user) {
      return res.json({
        code: 401,
        message: "Vui lòng xác thực trước khi đổi mật khẩu",
      });
    }

    if (user.password === md5(password)) {
      return res.json({
        code: 400,
        message: "Không được đặt mật khẩu trùng với mật khẩu cũ",
      });
    }

    await User.updateOne(
      {
        _id: user._id,
      },
      {
        password: md5(password),
        $inc: { tokenVersion: 1 },
      },
    );

    return res.json({
      code: 200,
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    return res.json({
      code: 400,
      message: error.message,
    });
  }
};

// [GET] /api/v1/user/search-user?keyword=nam&scope=mention
module.exports.searchUsers = async (req, res) => {
  try {
    const viewerId = req.user._id;
    const keyword = req.query.keyword?.trim() || "";
    const scope = req.query.scope || "all";

    if (!keyword) {
      return res.status(200).json({
        code: 200,
        message: "Không có từ khóa",
        data: [],
      });
    }

    const regex = new RegExp(keyword, "i");

    const query = {
      deleted: false,
      status: "active",
      _id: { $ne: viewerId },
      $or: [{ fullName: regex }, { username: regex }, { email: regex }],
    };

    if (scope !== "all") {
      const currentUser = await User.findById(viewerId).select(
        "following followers",
      );

      const followingIds = currentUser?.following || [];
      const followerIds = currentUser?.followers || [];

      let scopeIds = [];

      if (scope === "mention") {
        scopeIds = [...followingIds, ...followerIds];
      }

      if (scope === "friends") {
        scopeIds = friendIds;
      }

      if (scope === "custom") {
        scopeIds = [...friendIds, ...followingIds, ...followerIds];
      }

      if (scope === "message") {
        scopeIds = [...friendIds, ...followingIds, ...followerIds];
      }

      const uniqueScopeIds = [...new Set(scopeIds.map((id) => id.toString()))];

      query._id = {
        $in: uniqueScopeIds,
        $ne: viewerId,
      };
    }

    const users = await User.find(query)
      .select("fullName username avatar isVerified")
      .limit(10);

    return res.status(200).json({
      code: 200,
      message: "Tìm kiếm người dùng thành công",
      data: users,
    });
  } catch (error) {
    console.error("searchUsers error:", error);

    return res.status(500).json({
      code: 500,
      message: "Lỗi server",
      error: error.message,
    });
  }
};
