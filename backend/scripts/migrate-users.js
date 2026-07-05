const mongoose = require("mongoose");
require("dotenv").config();

const User = require("../api/v1/models/user.model");
const generate = require("../helpers/generate.helper");

const DEFAULT_AVATAR =
  "https://res.cloudinary.com/dn2u3dcrh/image/upload/v1778744158/users/user_somhbs.png";

function normalizeUsername(str = "") {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

async function generateUniqueUsername(user) {
  let base =
    normalizeUsername(user.email?.split("@")[0]) ||
    normalizeUsername(user.fullName);

  if (!base) base = "user";

  let username = base;

  while (
    await User.exists({
      username,
      _id: { $ne: user._id },
    })
  ) {
    username = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
  }

  return username;
}

async function migrateUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    console.log("MongoDB connected");

    await mongoose.connection.collection("users").updateMany(
      { "friendList.room_chat_id": "" },
      {
        $unset: {
          "friendList.$[item].room_chat_id": "",
        },
      },
      {
        arrayFilters: [
          {
            "item.room_chat_id": "",
          },
        ],
      },
    );

    console.log("Cleaned empty room_chat_id");

    const users = await User.find({});

    console.log(`Found ${users.length} users`);

    for (const user of users) {
      let changed = false;

      if (!user.username || user.username.trim() === "") {
        user.username = await generateUniqueUsername(user);
        changed = true;
      }

      if (!user.avatar || user.avatar.trim() === "") {
        user.avatar = DEFAULT_AVATAR;
        changed = true;
      }

      if (user.bio === undefined || user.bio === null) {
        user.bio = "";
        changed = true;
      }

      if (!user.tokenUser || user.tokenUser.trim() === "") {
        user.tokenUser = generate.generateString(20);
        changed = true;
      }

      if (!Array.isArray(user.requestFriends)) {
        user.requestFriends = [];
        changed = true;
      }

      if (!Array.isArray(user.acceptFriends)) {
        user.acceptFriends = [];
        changed = true;
      }

      if (!Array.isArray(user.friendList)) {
        user.friendList = [];
        changed = true;
      }

      if (!Array.isArray(user.followers)) {
        user.followers = [];
        changed = true;
      }

      if (!Array.isArray(user.following)) {
        user.following = [];
        changed = true;
      }

      if (!Array.isArray(user.lastSelectedAudience)) {
        user.lastSelectedAudience = [];
        changed = true;
      }

      if (!Array.isArray(user.pinnedPosts)) {
        user.pinnedPosts = [];
        changed = true;
      }

      if (user.status === undefined || user.status === null) {
        user.status = "active";
        changed = true;
      }

      if (user.role === undefined || user.role === null) {
        user.role = "user";
        changed = true;
      }

      if (user.isVerified === undefined || user.isVerified === null) {
        user.isVerified = false;
        changed = true;
      }

      if (user.statusOnline === undefined || user.statusOnline === null) {
        user.statusOnline = "offline";
        changed = true;
      }

      if (user.deleted === undefined || user.deleted === null) {
        user.deleted = false;
        changed = true;
      }

      if (user.postsCount === undefined || user.postsCount === null) {
        user.postsCount = 0;
        changed = true;
      }

      if (user.followersCount === undefined || user.followersCount === null) {
        user.followersCount = Array.isArray(user.followers)
          ? user.followers.length
          : 0;
        changed = true;
      }

      if (user.followingCount === undefined || user.followingCount === null) {
        user.followingCount = Array.isArray(user.following)
          ? user.following.length
          : 0;
        changed = true;
      }

      if (user.isPrivate === undefined || user.isPrivate === null) {
        user.isPrivate = false;
        changed = true;
      }

      if (
        user.lastAudienceSetting === undefined ||
        user.lastAudienceSetting === null ||
        user.lastAudienceSetting === ""
      ) {
        user.lastAudienceSetting = "public";
        changed = true;
      }

      if (Array.isArray(user.friendList)) {
        user.friendList.forEach((item) => {
          if (item.room_chat_id === "") {
            item.room_chat_id = undefined;
            changed = true;
          }
        });
      }

      if (changed) {
        await user.save();
        console.log(`Updated: ${user.email} -> ${user.username}`);
      } else {
        console.log(`Skipped: ${user.email}`);
      }
    }

    console.log("Done!");
    process.exit(0);
  } catch (error) {
    console.error("Migrate users error:", error);
    process.exit(1);
  }
}

migrateUsers();
