const mongoose = require("mongoose");
require("dotenv").config();

const User = require("../api/v1/models/user.model");

async function cleanFriendList() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB connected");

    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    for (const user of users) {
      const seen = new Set();
      const cleanList = [];

      for (const item of user.friendList || []) {
        if (!item.user_id) continue;

        const friendId = item.user_id.toString();
        const myId = user._id.toString();

        // bỏ chính mình
        if (friendId === myId) continue;

        // bỏ trùng
        if (seen.has(friendId)) continue;

        seen.add(friendId);

        cleanList.push({
          user_id: item.user_id,
          room_chat_id: item.room_chat_id || undefined,
        });
      }

      if (cleanList.length !== user.friendList.length) {
        if (cleanList.length !== user.friendList.length) {
          if (user.role === "Admin") {
            user.role = "admin";
          }

          if (user.role === "User") {
            user.role = "user";
          }

          user.friendList = cleanList;
          await user.save();

          console.log(`Cleaned: ${user.email}`);
        }
        user.friendList = cleanList;
        await user.save();

        console.log(`Cleaned: ${user.email}`);
      }
    }

    console.log("Done clean friendList");
    process.exit(0);
  } catch (error) {
    console.error("Clean friendList error:", error);
    process.exit(1);
  }
}

cleanFriendList();
