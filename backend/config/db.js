const mongoose = require("mongoose");

module.exports.connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connect success to mongoDB!");
  } catch (error) {
    console.error("❌ MongoDB connect error:", error.message);
  }
};
