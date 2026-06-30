require("dotenv").config();
const mongoose = require("mongoose");
const md5 = require("md5");

const User = require("./api/v1/models/user.model");

async function resetPassword() {
  await mongoose.connect(process.env.MONGO_URL || process.env.MONGO_URI);

  const email = "tnn231223@gmail.com";
  const newPassword = "123456";

  const result = await User.updateOne(
    { email },
    { $set: { password: md5(newPassword) } },
  );

  // console.log(result);

  await mongoose.disconnect();
}

resetPassword().catch(console.error);
