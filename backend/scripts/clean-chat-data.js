const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");

const Chat = require("../api/v1/models/chat.model");
const RoomChat = require("../api/v1/models/roomChat.model");

async function cleanChatData() {
  try {
    const mongoUrl = process.env.MONGO_URL;
    console.log("Connecting to Mongo URL:", mongoUrl);
    await mongoose.connect(mongoUrl);
    console.log("Connected to MongoDB!");

    const chatCount = await Chat.countDocuments({});
    const roomCount = await RoomChat.countDocuments({});

    console.log(`Found ${chatCount} Chat documents in DB.`);
    console.log(`Found ${roomCount} RoomChat documents in DB.`);

    const resChat = await Chat.deleteMany({});
    const resRoom = await RoomChat.deleteMany({});

    console.log(`Deleted ${resChat.deletedCount} Chat documents.`);
    console.log(`Deleted ${resRoom.deletedCount} RoomChat documents.`);

    console.log("CLEAN CHAT & ROOMCHAT DATA SUCCESS!");
  } catch (error) {
    console.error("Clean chat data ERROR:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

cleanChatData();
