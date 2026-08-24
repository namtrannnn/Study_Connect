const mongoose = require("mongoose");
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

function getCleanLastMessage(lastMessage) {
  if (!lastMessage) return null;
  if (lastMessage.message_id) {
    return lastMessage;
  }
  return null;
}

const RoomChat = require("../models/roomChat.model");
const User = require("../models/user.model");
const { syncUserChatBadge } = require("../../../helpers/chatBadge.helper");

const { redisClient } = require("../../../config/redis");

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Preset themes Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const PRESET_THEMES = [
  {
    name: "Default",
    primary: "#2563eb",
    background: "#f4f7fb",
    headerBackground: "#ffffff",
    bubbleMe: "#2563eb",
    bubbleOther: "#ffffff",
    textMe: "#ffffff",
    textOther: "#111827",
    coverImage: "",
    generatedByAI: false,
  },
  {
    name: "Sunset",
    primary: "#f97316",
    background: "#fff7ed",
    headerBackground: "#ffedd5",
    bubbleMe: "#f97316",
    bubbleOther: "#ffffff",
    textMe: "#ffffff",
    textOther: "#1c1917",
    coverImage: "",
    generatedByAI: false,
  },
  {
    name: "Forest",
    primary: "#16a34a",
    background: "#f0fdf4",
    headerBackground: "#dcfce7",
    bubbleMe: "#16a34a",
    bubbleOther: "#ffffff",
    textMe: "#ffffff",
    textOther: "#14532d",
    coverImage: "",
    generatedByAI: false,
  },
  {
    name: "Rose",
    primary: "#e11d48",
    background: "#fff1f2",
    headerBackground: "#ffe4e6",
    bubbleMe: "#e11d48",
    bubbleOther: "#ffffff",
    textMe: "#ffffff",
    textOther: "#881337",
    coverImage: "",
    generatedByAI: false,
  },
  {
    name: "Ocean",
    primary: "#0891b2",
    background: "#ecfeff",
    headerBackground: "#cffafe",
    bubbleMe: "#0891b2",
    bubbleOther: "#ffffff",
    textMe: "#ffffff",
    textOther: "#164e63",
    coverImage: "",
    generatedByAI: false,
  },
  {
    name: "Purple",
    primary: "#7c3aed",
    background: "#faf5ff",
    headerBackground: "#ede9fe",
    bubbleMe: "#7c3aed",
    bubbleOther: "#ffffff",
    textMe: "#ffffff",
    textOther: "#4c1d95",
    coverImage: "",
    generatedByAI: false,
  },
  {
    name: "Dark",
    primary: "#60a5fa",
    background: "#0f172a",
    headerBackground: "#1e293b",
    bubbleMe: "#2563eb",
    bubbleOther: "#1e293b",
    textMe: "#ffffff",
    textOther: "#e2e8f0",
    coverImage: "",
    generatedByAI: false,
  },
  {
    name: "Midnight",
    primary: "#a78bfa",
    background: "#0c0a1d",
    headerBackground: "#1a1535",
    bubbleMe: "#7c3aed",
    bubbleOther: "#1a1535",
    textMe: "#ffffff",
    textOther: "#ddd6fe",
    coverImage: "",
    generatedByAI: false,
  },
  {
    name: "Sakura",
    primary: "#ec4899",
    background: "#fdf2f8",
    headerBackground: "#fce7f3",
    bubbleMe: "#ec4899",
    bubbleOther: "#ffffff",
    textMe: "#ffffff",
    textOther: "#831843",
    coverImage: "",
    generatedByAI: false,
  },
  {
    name: "Autumn",
    primary: "#b45309",
    background: "#fffbeb",
    headerBackground: "#fef3c7",
    bubbleMe: "#b45309",
    bubbleOther: "#ffffff",
    textMe: "#ffffff",
    textOther: "#78350f",
    coverImage: "",
    generatedByAI: false,
  },
];

// [GET] /api/v1/room-chat/themes
module.exports.getPresetThemes = (req, res) => {
  return res.status(200).json({
    code: 200,
    message: "LÃ¡ÂºÂ¥y danh sÃƒÂ¡ch theme thÃƒÂ nh cÃƒÂ´ng",
    data: PRESET_THEMES,
  });
};

async function buildRoomResponse(roomId, currentUserId = null) {
  const room = await RoomChat.findById(roomId).lean();

  if (!room) return null;

  const members = [];

  let currentMember = null;

  for (const member of room.users) {
    if (
      currentUserId &&
      member.user_id.toString() === currentUserId.toString()
    ) {
      currentMember = member;
    }

    const userInfo = await User.findById(member.user_id)
      .select("_id fullName username avatar isVerified status")
      .lean();

    if (!userInfo) continue;

    const isOnline = await redisClient.sIsMember(
      "online_users",
      userInfo._id.toString(),
    );

    const lastActiveAt = await redisClient.get(
      `user:${userInfo._id.toString()}:last_active_at`,
    );

    if (member.isActive === false) continue;

    members.push({
      user_id: member.user_id,
      role: member.role,
      nickname: member.nickname,
      joinedAt: member.joinedAt,
      isActive: member.isActive,
      lastReadMessage: member.lastReadMessage,
      lastReadAt: member.lastReadAt,
      unreadCount: member.unreadCount || 0,
      muted: member.muted || false,
      pinned: member.pinned || false,
      archived: member.archived || false,
      deletedAt: member.deletedAt,
      user: {
        _id: userInfo._id,
        fullName: userInfo.fullName,
        username: userInfo.username,
        avatar: userInfo.avatar,
        isVerified: userInfo.isVerified,
        status: userInfo.status,
        isOnline,
        lastActiveAt,
      },
    });
  }

  const response = {
    _id: room._id,
    roomId: room._id,
    title: room.title,
    avatar: room.avatar,
    typeRoom: room.typeRoom,
    createdBy: room.createdBy,
    friendKey: room.friendKey,
    status: room.status,
    themeConfig: room.themeConfig,
    groupSettings: room.groupSettings,
    members,
    messages: [],
    lastMessage: getCleanLastMessage(room.lastMessage),
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
  };

  if (currentUserId && currentMember) {
    response.currentUserRoomState = {
      role: currentMember.role,
      nickname: currentMember.nickname,
      lastReadMessage: currentMember.lastReadMessage,
      lastReadAt: currentMember.lastReadAt,
      unreadCount: currentMember.unreadCount || 0,
      muted: currentMember.muted || false,
      pinned: currentMember.pinned || false,
      archived: currentMember.archived || false,
      deletedAt: currentMember.deletedAt || null,
    };
  }

  return response;
}
const isAdminOrSuperAdmin = (member) => {
  return ["admin", "superAdmin"].includes(member?.role);
};
const isSuperAdmin = (member) => {
  return member?.role === "superAdmin";
};

// Helper láº¥y member object tá»« room
function getRoomMember(room, userId) {
  return room.users.find(
    (m) => m.user_id.toString() === userId.toString() && m.isActive !== false,
  );
}
// [POST] /api/v1/room-chat/create
module.exports.create = async (req, res) => {
  try {
    const meId = req.user._id;
    const { title, usersId } = req.body;

    if (!Array.isArray(usersId) || usersId.length === 0) {
      return res.status(400).json({
        message: "Danh sÃƒÂ¡ch thÃƒÂ nh viÃƒÂªn khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡",
      });
    }

    const uniqueUserIds = [...new Set(usersId.map((id) => id.toString()))]
      .filter((id) => id !== meId.toString())
      .filter((id) => mongoose.Types.ObjectId.isValid(id));

    if (uniqueUserIds.length === 0) {
      return res.status(400).json({
        message: "NhÃƒÂ³m cÃ¡ÂºÂ§n ÃƒÂ­t nhÃ¡ÂºÂ¥t 1 thÃƒÂ nh viÃƒÂªn khÃƒÂ¡c",
      });
    }

    const users = uniqueUserIds.map((id) => ({
      user_id: id,
      role: "member",
      joinedAt: new Date(),
      isActive: true,
      unreadCount: 0,
    }));

    users.push({
      user_id: meId,
      role: "superAdmin",
      joinedAt: new Date(),
      isActive: true,
      unreadCount: 0,
    });

    const roomChat = await RoomChat.create({
      title: title?.trim() || "NhÃƒÂ³m mÃ¡Â»â€ºi",
      avatar: "",
      typeRoom: "group",
      createdBy: meId,
      friendKey: null,
      status: "active",
      users,
    });

    const responseRoom = await buildRoomResponse(roomChat._id, meId);

    // Emit cho tá»«ng thÃ nh viÃªn Ä‘Æ°á»£c thÃªm vÃ o nhÃ³m (trá»« ngÆ°á»i táº¡o)
    for (const uid of uniqueUserIds) {
      const memberRoom = await buildRoomResponse(roomChat._id, uid);
      global._io?.to(uid).emit("SERVER_ADDED_TO_ROOM", memberRoom);
    }

    return res.status(201).json({
      message: "Room created successfully",
      ...responseRoom,
    });
  } catch (error) {
    console.error("create group room error:", error);
    return res.status(500).json({
      message: "FAILED!",
    });
  }
};

// [POST] /api/v1/room-chat/get-or-create-friend
module.exports.getOrCreateFriend = async (req, res) => {
  try {
    const meId = req.user._id;
    const { userId } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Missing or invalid userId",
      });
    }

    if (meId.toString() === userId.toString()) {
      return res.status(400).json({
        message: "Cannot chat with yourself",
      });
    }

    const targetUser = await User.findOne({
      _id: userId,
      deleted: false,
      status: "active",
    });

    if (!targetUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const friendKey = [meId.toString(), userId.toString()].sort().join("_");

    let room = await RoomChat.findOne({
      typeRoom: "friend",
      friendKey,
      deleted: false,
    });

    if (!room) {
      try {
        room = await RoomChat.create({
          title: "",
          avatar: "",
          typeRoom: "friend",
          createdBy: meId,
          friendKey,
          status: "active",
          users: [
            {
              user_id: meId,
              role: "member",
              joinedAt: new Date(),
              isActive: true,
              unreadCount: 0,
            },
            {
              user_id: userId,
              role: "member",
              joinedAt: new Date(),
              isActive: true,
              unreadCount: 0,
            },
          ],
        });
      } catch (error) {
        if (error.code === 11000) {
          room = await RoomChat.findOne({
            typeRoom: "friend",
            friendKey,
            deleted: false,
          });
        } else {
          throw error;
        }
      }
    }
    let shouldSaveRoom = false;

    for (const member of room.users) {
      const memberId = member.user_id.toString();

      if (memberId === meId.toString() || memberId === userId.toString()) {
        if (member.isActive === false) {
          member.isActive = true;
          member.leftAt = null;
          member.leftReason = null;
          member.removedBy = null;
          member.joinedAt = new Date();
        }

        if (member.deletedAt) {
          member.deletedAt = null;
          member.archived = false;
          member.pinned = false;
          member.unreadCount = 0;
        }

        shouldSaveRoom = true;
      }
    }

    if (shouldSaveRoom) {
      await room.save();
    }
    const responseRoom = await buildRoomResponse(room._id, meId);

    return res.status(200).json({
      message: "OK",
      ...responseRoom,
    });
  } catch (error) {
    console.error("getOrCreateFriend error:", error);
    return res.status(500).json({
      message: "FAILED!",
    });
  }
};

// [GET] /api/v1/room-chat
module.exports.getMyRooms = async (req, res) => {
  try {
    const userId = req.user._id;
    const archived = req.query.archived === "true";

    const rooms = await RoomChat.find({
      deleted: false,
      users: {
        $elemMatch: {
          user_id: userId,
          isActive: true,
          deletedAt: null,
          archived,
        },
      },
    })
      .sort({
        "users.pinned": -1,
        "lastMessage.createdAt": -1,
        updatedAt: -1,
      })
      .lean();

    const results = [];

    for (const room of rooms) {
      const currentMember = room.users.find(
        (member) => member.user_id.toString() === userId.toString(),
      );

      if (!currentMember || currentMember.deletedAt) continue;

      const members = [];

      for (const member of room.users) {
        if (member.isActive === false) continue;

        const userInfo = await User.findById(member.user_id)
          .select("_id fullName username avatar isVerified status")
          .lean();

        if (!userInfo) continue;

        const isOnline = await redisClient.sIsMember(
          "online_users",
          userInfo._id.toString(),
        );

        const lastActiveAt = await redisClient.get(
          `user:${userInfo._id.toString()}:last_active_at`,
        );

        members.push({
          user_id: member.user_id,
          role: member.role,
          nickname: member.nickname,
          joinedAt: member.joinedAt,
          isActive: member.isActive,
          user: {
            _id: userInfo._id,
            fullName: userInfo.fullName,
            username: userInfo.username,
            avatar: userInfo.avatar,
            isVerified: userInfo.isVerified,
            status: userInfo.status,
            isOnline,
            lastActiveAt,
          },
        });
      }

      results.push({
        roomId: room._id,
        _id: room._id,
        title: room.title,
        avatar: room.avatar,
        typeRoom: room.typeRoom,
        createdBy: room.createdBy,
        friendKey: room.friendKey,
        status: room.status,
        themeConfig: room.themeConfig,
        groupSettings: room.groupSettings,

        members,
        messages: [],

        lastMessage: getCleanLastMessage(room.lastMessage),
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,

        currentUserRoomState: {
          role: currentMember.role,
          nickname: currentMember.nickname,
          lastReadMessage: currentMember.lastReadMessage,
          lastReadAt: currentMember.lastReadAt,
          unreadCount: currentMember.unreadCount || 0,
          muted: currentMember.muted || false,
          pinned: currentMember.pinned || false,
          archived: currentMember.archived || false,
          deletedAt: currentMember.deletedAt || null,
        },
      });
    }

    results.sort((a, b) => {
      const aPinned = a.currentUserRoomState.pinned ? 1 : 0;
      const bPinned = b.currentUserRoomState.pinned ? 1 : 0;

      if (aPinned !== bPinned) return bPinned - aPinned;

      const aTime = a.lastMessage?.createdAt
        ? new Date(a.lastMessage.createdAt).getTime()
        : new Date(a.updatedAt).getTime();

      const bTime = b.lastMessage?.createdAt
        ? new Date(b.lastMessage.createdAt).getTime()
        : new Date(b.updatedAt).getTime();

      return bTime - aTime;
    });

    return res.status(200).json({
      code: 200,
      message: "LÃ¡ÂºÂ¥y danh sÃƒÂ¡ch phÃƒÂ²ng chat thÃƒÂ nh cÃƒÂ´ng",
      data: results,
    });
  } catch (error) {
    console.error("getMyRooms error:", error);
    return res.status(500).json({
      message: "FAILED!",
    });
  }
};

// [PATCH] /api/v1/room-chat/:roomId/mute
module.exports.muteRoom = async (req, res) => {
  try {
    const meId = req.user._id;
    const { roomId } = req.params;
    const { muted } = req.body;

    if (!isValidObjectId(roomId)) {
      return res.status(400).json({
        code: 400,
        message: "roomId khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡",
      });
    }

    if (typeof muted !== "boolean") {
      return res.status(400).json({
        code: 400,
        message: "muted phÃ¡ÂºÂ£i lÃƒÂ  true hoÃ¡ÂºÂ·c false",
      });
    }

    const room = await RoomChat.findOneAndUpdate(
      {
        _id: roomId,
        deleted: false,
        "users.user_id": meId,
      },
      {
        $set: {
          "users.$.muted": muted,
        },
      },
      {
        new: true,
      },
    );

    if (!room) {
      return res.status(404).json({
        code: 404,
        message: "KhÃƒÂ´ng tÃƒÂ¬m thÃ¡ÂºÂ¥y phÃƒÂ²ng chat",
      });
    }
    global._io?.to(meId.toString()).emit("SERVER_ROOM_STATE_UPDATED", {
      roomId: room._id,
      currentUserRoomState: {
        muted,
      },
    });
    return res.status(200).json({
      code: 200,
      message: muted
        ? "Ã„ÂÃƒÂ£ tÃ¡ÂºÂ¯t thÃƒÂ´ng bÃƒÂ¡o phÃƒÂ²ng chat"
        : "Ã„ÂÃƒÂ£ bÃ¡ÂºÂ­t thÃƒÂ´ng bÃƒÂ¡o phÃƒÂ²ng chat",
      data: {
        roomId: room._id,
        muted,
      },
    });
  } catch (error) {
    console.error("muteRoom error:", error);
    return res.status(500).json({
      code: 500,
      message: "FAILED!",
    });
  }
};

// [PATCH] /api/v1/room-chat/:roomId/pin
module.exports.pinRoom = async (req, res) => {
  try {
    const meId = req.user._id;
    const { roomId } = req.params;
    const { pinned } = req.body;

    if (!isValidObjectId(roomId)) {
      return res.status(400).json({
        code: 400,
        message: "roomId khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡",
      });
    }

    if (typeof pinned !== "boolean") {
      return res.status(400).json({
        code: 400,
        message: "pinned phÃ¡ÂºÂ£i lÃƒÂ  true hoÃ¡ÂºÂ·c false",
      });
    }

    const room = await RoomChat.findOneAndUpdate(
      {
        _id: roomId,
        deleted: false,
        "users.user_id": meId,
      },
      {
        $set: {
          "users.$.pinned": pinned,
        },
      },
      {
        new: true,
      },
    );

    if (!room) {
      return res.status(404).json({
        code: 404,
        message: "KhÃƒÂ´ng tÃƒÂ¬m thÃ¡ÂºÂ¥y phÃƒÂ²ng chat",
      });
    }
    global._io?.to(meId.toString()).emit("SERVER_ROOM_STATE_UPDATED", {
      roomId: room._id,
      currentUserRoomState: {
        pinned,
      },
    });
    return res.status(200).json({
      code: 200,
      message: pinned ? "Ã„ÂÃƒÂ£ ghim phÃƒÂ²ng chat" : "Ã„ÂÃƒÂ£ bÃ¡Â»Â ghim phÃƒÂ²ng chat",
      data: {
        roomId: room._id,
        pinned,
      },
    });
  } catch (error) {
    console.error("pinRoom error:", error);
    return res.status(500).json({
      code: 500,
      message: "FAILED!",
    });
  }
};

// [PATCH] /api/v1/room-chat/:roomId/archive
module.exports.archiveRoom = async (req, res) => {
  try {
    const meId = req.user._id;
    const { roomId } = req.params;
    const { archived } = req.body;

    if (!isValidObjectId(roomId)) {
      return res.status(400).json({
        code: 400,
        message: "roomId khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡",
      });
    }

    if (typeof archived !== "boolean") {
      return res.status(400).json({
        code: 400,
        message: "archived phÃ¡ÂºÂ£i lÃƒÂ  true hoÃ¡ÂºÂ·c false",
      });
    }

    const updateData = {
      "users.$.archived": archived,
    };

    if (archived) {
      updateData["users.$.pinned"] = false;
    }

    const room = await RoomChat.findOneAndUpdate(
      {
        _id: roomId,
        deleted: false,
        "users.user_id": meId,
      },
      {
        $set: updateData,
      },
      {
        new: true,
      },
    );

    if (!room) {
      return res.status(404).json({
        code: 404,
        message: "KhÃƒÂ´ng tÃƒÂ¬m thÃ¡ÂºÂ¥y phÃƒÂ²ng chat",
      });
    }
    global._io?.to(meId.toString()).emit("SERVER_ROOM_DELETED_FOR_ME", {
      roomId: room._id,
      deletedAt: new Date(),
    });
    return res.status(200).json({
      code: 200,
      message: archived ? "Ã„ÂÃƒÂ£ lÃ†Â°u trÃ¡Â»Â¯ phÃƒÂ²ng chat" : "Ã„ÂÃƒÂ£ bÃ¡Â»Â lÃ†Â°u trÃ¡Â»Â¯ phÃƒÂ²ng chat",
      data: {
        roomId: room._id,
        archived,
        pinned: archived ? false : undefined,
      },
    });
  } catch (error) {
    console.error("archiveRoom error:", error);
    return res.status(500).json({
      code: 500,
      message: "FAILED!",
    });
  }
};

// [PATCH] /api/v1/room-chat/:roomId/delete-for-me
module.exports.deleteRoomForMe = async (req, res) => {
  try {
    const meId = req.user._id;
    const { roomId } = req.params;

    if (!isValidObjectId(roomId)) {
      return res.status(400).json({
        code: 400,
        message: "roomId khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡",
      });
    }

    const room = await RoomChat.findOneAndUpdate(
      {
        _id: roomId,
        deleted: false,
        "users.user_id": meId,
      },
      {
        $set: {
          "users.$.deletedAt": new Date(),
          "users.$.archived": false,
          "users.$.pinned": false,
          "users.$.unreadCount": 0,
        },
      },
      {
        new: true,
      },
    );

    if (!room) {
      return res.status(404).json({
        code: 404,
        message: "KhÃƒÂ´ng tÃƒÂ¬m thÃ¡ÂºÂ¥y phÃƒÂ²ng chat hoÃ¡ÂºÂ·c phÃƒÂ²ng chat Ã„â€˜ÃƒÂ£ bÃ¡Â»â€¹ xÃƒÂ³a",
      });
    }

    return res.status(200).json({
      code: 200,
      message: "Ã„ÂÃƒÂ£ xÃƒÂ³a phÃƒÂ²ng chat phÃƒÂ­a bÃ¡ÂºÂ¡n",
      data: {
        roomId: room._id,
        deletedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("deleteRoomForMe error:", error);
    return res.status(500).json({
      code: 500,
      message: "FAILED!",
    });
  }
};

// [PATCH] /api/v1/room-chat/:roomId/title
module.exports.updateGroupTitle = async (req, res) => {
  try {
    const meId = req.user._id;
    const { roomId } = req.params;
    const { title } = req.body;

    if (!isValidObjectId(roomId)) {
      return res.status(400).json({
        code: 400,
        message: "roomId khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡",
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        code: 400,
        message: "TÃƒÂªn nhÃƒÂ³m khÃƒÂ´ng Ã„â€˜Ã†Â°Ã¡Â»Â£c Ã„â€˜Ã¡Â»Æ’ trÃ¡Â»â€˜ng",
      });
    }

    if (title.trim().length > 100) {
      return res.status(400).json({
        code: 400,
        message: "TÃƒÂªn nhÃƒÂ³m tÃ¡Â»â€˜i Ã„â€˜a 100 kÃƒÂ½ tÃ¡Â»Â±",
      });
    }

    const room = await RoomChat.findOne({
      _id: roomId,
      typeRoom: "group",
      deleted: false,
      status: "active",
    });

    if (!room) {
      return res.status(404).json({
        code: 404,
        message: "KhÃƒÂ´ng tÃƒÂ¬m thÃ¡ÂºÂ¥y nhÃƒÂ³m",
      });
    }

    const myMember = getRoomMember(room, meId);

    if (!myMember) {
      return res.status(403).json({
        code: 403,
        message: "BÃ¡ÂºÂ¡n khÃƒÂ´ng thuÃ¡Â»â„¢c nhÃƒÂ³m nÃƒÂ y",
      });
    }

    if (
      room.groupSettings?.onlyAdminCanChangeInfo &&
      !isAdminOrSuperAdmin(myMember)
    ) {
      return res.status(403).json({
        code: 403,
        message: "BÃ¡ÂºÂ¡n khÃƒÂ´ng cÃƒÂ³ quyÃ¡Â»Ân Ã„â€˜Ã¡Â»â€¢i tÃƒÂªn nhÃƒÂ³m",
      });
    }

    room.title = title.trim();
    await room.save();

    const responseRoom = await buildRoomResponse(room._id, meId);

    global._io?.to(room._id.toString()).emit("SERVER_ROOM_UPDATED", {
      roomId: room._id,
      type: "CHANGE_GROUP_TITLE",
      room: responseRoom,
    });

    return res.status(200).json({
      code: 200,
      message: "Ã„ÂÃ¡Â»â€¢i tÃƒÂªn nhÃƒÂ³m thÃƒÂ nh cÃƒÂ´ng",
      data: responseRoom,
    });
  } catch (error) {
    console.error("updateGroupTitle error:", error);
    return res.status(500).json({
      code: 500,
      message: "FAILED!",
    });
  }
};

// [PATCH] /api/v1/room-chat/:roomId/avatar
module.exports.updateGroupAvatar = async (req, res) => {
  try {
    const meId = req.user._id;
    const { roomId } = req.params;
    const { avatar } = req.body;

    if (!isValidObjectId(roomId)) {
      return res.status(400).json({
        code: 400,
        message: "roomId khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡",
      });
    }

    if (typeof avatar !== "string") {
      return res.status(400).json({
        code: 400,
        message: "avatar khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡",
      });
    }

    const room = await RoomChat.findOne({
      _id: roomId,
      typeRoom: "group",
      deleted: false,
      status: "active",
    });

    if (!room) {
      return res.status(404).json({
        code: 404,
        message: "KhÃƒÂ´ng tÃƒÂ¬m thÃ¡ÂºÂ¥y nhÃƒÂ³m",
      });
    }

    const myMember = getRoomMember(room, meId);

    if (!myMember) {
      return res.status(403).json({
        code: 403,
        message: "BÃ¡ÂºÂ¡n khÃƒÂ´ng thuÃ¡Â»â„¢c nhÃƒÂ³m nÃƒÂ y",
      });
    }

    if (
      room.groupSettings?.onlyAdminCanChangeInfo &&
      !isAdminOrSuperAdmin(myMember)
    ) {
      return res.status(403).json({
        code: 403,
        message: "BÃ¡ÂºÂ¡n khÃƒÂ´ng cÃƒÂ³ quyÃ¡Â»Ân Ã„â€˜Ã¡Â»â€¢i avatar nhÃƒÂ³m",
      });
    }

    room.avatar = avatar.trim();
    await room.save();

    const responseRoom = await buildRoomResponse(room._id, meId);

    global._io?.to(room._id.toString()).emit("SERVER_ROOM_UPDATED", {
      roomId: room._id,
      type: "CHANGE_GROUP_AVATAR",
      room: responseRoom,
    });

    return res.status(200).json({
      code: 200,
      message: "Ã„ÂÃ¡Â»â€¢i avatar nhÃƒÂ³m thÃƒÂ nh cÃƒÂ´ng",
      data: responseRoom,
    });
  } catch (error) {
    console.error("updateGroupAvatar error:", error);
    return res.status(500).json({
      code: 500,
      message: "FAILED!",
    });
  }
};

// [PATCH] /api/v1/room-chat/:roomId/avatar/upload  (multipart Ã¢â€ â€™ Cloudinary)
const uploadStreamToCloudinary = require("../../../helpers/cloudinary.helper");
module.exports.uploadGroupAvatar = async (req, res) => {
  try {
    const meId = req.user._id;
    const { roomId } = req.params;

    if (!isValidObjectId(roomId)) {
      return res
        .status(400)
        .json({ code: 400, message: "roomId khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡" });
    }

    if (!req.file) {
      return res.status(400).json({ code: 400, message: "ChÃ†Â°a cÃƒÂ³ file Ã¡ÂºÂ£nh" });
    }

    const room = await RoomChat.findOne({
      _id: roomId,
      typeRoom: "group",
      deleted: false,
      status: "active",
    });

    if (!room) {
      return res
        .status(404)
        .json({ code: 404, message: "KhÃƒÂ´ng tÃƒÂ¬m thÃ¡ÂºÂ¥y nhÃƒÂ³m" });
    }

    const myMember = getRoomMember(room, meId);
    if (!myMember) {
      return res
        .status(403)
        .json({ code: 403, message: "BÃ¡ÂºÂ¡n khÃƒÂ´ng thuÃ¡Â»â„¢c nhÃƒÂ³m nÃƒÂ y" });
    }
    if (
      room.groupSettings?.onlyAdminCanChangeInfo &&
      !isAdminOrSuperAdmin(myMember)
    ) {
      return res
        .status(403)
        .json({ code: 403, message: "BÃ¡ÂºÂ¡n khÃƒÂ´ng cÃƒÂ³ quyÃ¡Â»Ân Ã„â€˜Ã¡Â»â€¢i avatar nhÃƒÂ³m" });
    }

    const result = await uploadStreamToCloudinary(req.file.buffer, "/rooms");
    room.avatar = result.url;
    await room.save();

    const responseRoom = await buildRoomResponse(room._id, meId);

    global._io?.to(room._id.toString()).emit("SERVER_ROOM_UPDATED", {
      roomId: room._id,
      type: "CHANGE_GROUP_AVATAR",
      room: responseRoom,
    });

    return res.status(200).json({
      code: 200,
      message: "Ã„ÂÃ¡Â»â€¢i avatar nhÃƒÂ³m thÃƒÂ nh cÃƒÂ´ng",
      data: responseRoom,
    });
  } catch (error) {
    console.error("uploadGroupAvatar error:", error);
    return res.status(500).json({ code: 500, message: "FAILED!" });
  }
};

// [PATCH] /api/v1/room-chat/:roomId/theme
module.exports.updateRoomTheme = async (req, res) => {
  try {
    const meId = req.user._id;
    const { roomId } = req.params;
    const { themeConfig } = req.body;

    if (!isValidObjectId(roomId)) {
      return res.status(400).json({
        code: 400,
        message: "roomId khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡",
      });
    }

    if (!themeConfig || typeof themeConfig !== "object") {
      return res.status(400).json({
        code: 400,
        message: "themeConfig khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡",
      });
    }

    const room = await RoomChat.findOne({
      _id: roomId,
      deleted: false,
      status: "active",
    });

    if (!room) {
      return res.status(404).json({
        code: 404,
        message: "KhÃƒÂ´ng tÃƒÂ¬m thÃ¡ÂºÂ¥y phÃƒÂ²ng chat",
      });
    }

    const myMember = getRoomMember(room, meId);

    if (!myMember) {
      return res.status(403).json({
        code: 403,
        message: "BÃ¡ÂºÂ¡n khÃƒÂ´ng thuÃ¡Â»â„¢c phÃƒÂ²ng chat nÃƒÂ y",
      });
    }

    if (
      room.typeRoom === "group" &&
      room.groupSettings?.onlyAdminCanChangeTheme &&
      !isAdminOrSuperAdmin(myMember)
    ) {
      return res.status(403).json({
        code: 403,
        message: "BÃ¡ÂºÂ¡n khÃƒÂ´ng cÃƒÂ³ quyÃ¡Â»Ân Ã„â€˜Ã¡Â»â€¢i theme nhÃƒÂ³m",
      });
    }

    const allowedFields = [
      "name",
      "primary",
      "background",
      "headerBackground",
      "bubbleMe",
      "bubbleOther",
      "textMe",
      "textOther",
      "coverImage",
      "generatedByAI",
      "prompt",
    ];

    for (const field of allowedFields) {
      if (themeConfig[field] !== undefined) {
        room.themeConfig[field] = themeConfig[field];
      }
    }

    await room.save();

    const responseRoom = await buildRoomResponse(room._id, meId);

    global._io?.to(room._id.toString()).emit("SERVER_ROOM_UPDATED", {
      roomId: room._id,
      type: "CHANGE_THEME",
      room: responseRoom,
    });

    return res.status(200).json({
      code: 200,
      message: "Ã„ÂÃ¡Â»â€¢i theme thÃƒÂ nh cÃƒÂ´ng",
      data: responseRoom,
    });
  } catch (error) {
    console.error("updateRoomTheme error:", error);
    return res.status(500).json({
      code: 500,
      message: "FAILED!",
    });
  }
};

// [PATCH] /api/v1/room-chat/:roomId/nickname
module.exports.updateMyNickname = async (req, res) => {
  try {
    const meId = req.user._id;
    const { roomId } = req.params;
    const { nickname, targetUserId } = req.body;

    if (!isValidObjectId(roomId)) {
      return res.status(400).json({ code: 400, message: "roomId khong hop le" });
    }
    if (typeof nickname !== "string") {
      return res.status(400).json({ code: 400, message: "nickname khong hop le" });
    }
    if (nickname.trim().length > 50) {
      return res.status(400).json({ code: 400, message: "Nickname toi da 50 ky tu" });
    }

    const targetId = targetUserId && isValidObjectId(targetUserId) ? targetUserId : meId;

    const room = await RoomChat.findOneAndUpdate(
      { _id: roomId, deleted: false, status: "active", "users.user_id": targetId },
      { $set: { "users.$.nickname": nickname.trim() } },
      { new: true },
    );

    if (!room) {
      return res.status(404).json({ code: 404, message: "Khong tim thay phong chat" });
    }

    const responseRoom = await buildRoomResponse(room._id, meId);

    global._io?.to(meId.toString()).emit("SERVER_ROOM_UPDATED", {
      roomId: room._id,
      type: "CHANGE_NICKNAME",
      targetUserId: targetId,
      nickname: nickname.trim(),
      room: responseRoom,
    });

    return res.status(200).json({
      code: 200,
      message: "Doi biet danh thanh cong",
      data: responseRoom,
    });
  } catch (error) {
    console.error("updateMyNickname error:", error);
    return res.status(500).json({ code: 500, message: "FAILED!" });
  }
};

// [PATCH] /api/v1/room-chat/:roomId/members/add
module.exports.addMembers = async (req, res) => {
  try {
    const meId = req.user._id;
    const { roomId } = req.params;
    const { usersId } = req.body;

    if (!isValidObjectId(roomId)) {
      return res.status(400).json({
        code: 400,
        message: "roomId khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡",
      });
    }

    if (!Array.isArray(usersId) || usersId.length === 0) {
      return res.status(400).json({
        code: 400,
        message: "Danh sÃƒÂ¡ch thÃƒÂ nh viÃƒÂªn khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡",
      });
    }

    const room = await RoomChat.findOne({
      _id: roomId,
      typeRoom: "group",
      deleted: false,
      status: "active",
    });

    if (!room) {
      return res.status(404).json({
        code: 404,
        message: "KhÃƒÂ´ng tÃƒÂ¬m thÃ¡ÂºÂ¥y nhÃƒÂ³m",
      });
    }

    const myMember = getRoomMember(room, meId);

    if (!myMember) {
      return res.status(403).json({
        code: 403,
        message: "BÃ¡ÂºÂ¡n khÃƒÂ´ng thuÃ¡Â»â„¢c nhÃƒÂ³m nÃƒÂ y",
      });
    }

    if (
      room.groupSettings?.onlyAdminCanAddMember &&
      !isAdminOrSuperAdmin(myMember)
    ) {
      return res.status(403).json({
        code: 403,
        message: "BÃ¡ÂºÂ¡n khÃƒÂ´ng cÃƒÂ³ quyÃ¡Â»Ân thÃƒÂªm thÃƒÂ nh viÃƒÂªn",
      });
    }

    const uniqueUserIds = [...new Set(usersId.map((id) => id.toString()))]
      .filter((id) => isValidObjectId(id))
      .filter((id) => id !== meId.toString());

    if (uniqueUserIds.length === 0) {
      return res.status(400).json({
        code: 400,
        message: "KhÃƒÂ´ng cÃƒÂ³ user hÃ¡Â»Â£p lÃ¡Â»â€¡ Ã„â€˜Ã¡Â»Æ’ thÃƒÂªm",
      });
    }

    const validUsers = await User.find({
      _id: { $in: uniqueUserIds },
      status: "active",
      deleted: false,
    })
      .select("_id")
      .lean();

    const validUserIds = validUsers.map((user) => user._id.toString());

    const addedUsers = [];
    const reactivatedUsers = [];
    const skippedUsers = [];

    for (const userId of validUserIds) {
      const existingMember = room.users.find(
        (member) => member.user_id.toString() === userId,
      );

      if (existingMember && existingMember.isActive) {
        skippedUsers.push(userId);
        continue;
      }

      if (existingMember && existingMember.isActive === false) {
        existingMember.isActive = true;
        existingMember.leftAt = null;
        existingMember.leftReason = null;
        existingMember.removedBy = null;
        existingMember.joinedAt = new Date();
        existingMember.role = "member";
        existingMember.unreadCount = 0;
        existingMember.deletedAt = null;
        existingMember.archived = false;
        existingMember.pinned = false;

        reactivatedUsers.push(userId);
        continue;
      }

      room.users.push({
        user_id: userId,
        role: "member",
        nickname: "",
        joinedAt: new Date(),
        isActive: true,
        unreadCount: 0,
        muted: false,
        pinned: false,
        archived: false,
        deletedAt: null,
      });

      addedUsers.push(userId);
    }

    if (addedUsers.length === 0 && reactivatedUsers.length === 0) {
      return res.status(400).json({
        code: 400,
        message: "KhÃƒÂ´ng cÃƒÂ³ thÃƒÂ nh viÃƒÂªn mÃ¡Â»â€ºi nÃƒÂ o Ã„â€˜Ã†Â°Ã¡Â»Â£c thÃƒÂªm",
        data: {
          skippedUsers,
        },
      });
    }

    await room.save();

    const responseRoom = await buildRoomResponse(room._id, meId);

    global._io?.to(room._id.toString()).emit("SERVER_ROOM_UPDATED", {
      roomId: room._id,
      type: "ADD_MEMBERS",
      addedUsers,
      reactivatedUsers,
      room: responseRoom,
    });

    for (const userId of [...addedUsers, ...reactivatedUsers]) {
      global._io?.to(userId.toString()).emit("SERVER_ADDED_TO_ROOM", {
        roomId: room._id,
        room: responseRoom,
      });
    }

    return res.status(200).json({
      code: 200,
      message: "ThÃƒÂªm thÃƒÂ nh viÃƒÂªn thÃƒÂ nh cÃƒÂ´ng",
      data: {
        room: responseRoom,
        addedUsers,
        reactivatedUsers,
        skippedUsers,
      },
    });
  } catch (error) {
    console.error("addMembers error:", error);
    return res.status(500).json({
      code: 500,
      message: "FAILED!",
    });
  }
};

// [PATCH] /api/v1/room-chat/:roomId/leave
module.exports.leaveGroup = async (req, res) => {
  try {
    const meId = req.user._id;
    const { roomId } = req.params;

    if (!isValidObjectId(roomId)) {
      return res.status(400).json({
        code: 400,
        message: "roomId khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡",
      });
    }

    const room = await RoomChat.findOne({
      _id: roomId,
      typeRoom: "group",
      deleted: false,
      status: "active",
    });

    if (!room) {
      return res.status(404).json({
        code: 404,
        message: "KhÃƒÂ´ng tÃƒÂ¬m thÃ¡ÂºÂ¥y nhÃƒÂ³m",
      });
    }

    const myMember = getRoomMember(room, meId);

    if (!myMember) {
      return res.status(403).json({
        code: 403,
        message: "BÃ¡ÂºÂ¡n khÃƒÂ´ng thuÃ¡Â»â„¢c nhÃƒÂ³m nÃƒÂ y",
      });
    }

    const activeMembers = room.users.filter((member) => member.isActive);

    if (myMember.role === "superAdmin" && activeMembers.length > 1) {
      return res.status(400).json({
        code: 400,
        message: "TrÃ†Â°Ã¡Â»Å¸ng nhÃƒÂ³m cÃ¡ÂºÂ§n chuyÃ¡Â»Æ’n quyÃ¡Â»Ân trÃ†Â°Ã¡Â»â€ºc khi rÃ¡Â»Âi nhÃƒÂ³m",
      });
    }

    myMember.isActive = false;
    myMember.leftAt = new Date();
    myMember.leftReason = "leave";
    myMember.removedBy = null;
    myMember.role = "member";
    myMember.unreadCount = 0;
    myMember.pinned = false;
    myMember.archived = false;
    myMember.deletedAt = new Date();

    await room.save();

    const responseRoom = await buildRoomResponse(room._id, meId);

    global._io?.to(room._id.toString()).emit("SERVER_ROOM_UPDATED", {
      roomId: room._id,
      type: "LEAVE_GROUP",
      userId: meId,
      room: responseRoom,
    });

    global._io?.to(meId.toString()).emit("SERVER_LEFT_ROOM", {
      roomId: room._id,
    });

    return res.status(200).json({
      code: 200,
      message: "BÃ¡ÂºÂ¡n Ã„â€˜ÃƒÂ£ rÃ¡Â»Âi nhÃƒÂ³m",
      data: {
        roomId: room._id,
      },
    });
  } catch (error) {
    console.error("leaveGroup error:", error);
    return res.status(500).json({
      code: 500,
      message: "FAILED!",
    });
  }
};

// [PATCH] /api/v1/room-chat/:roomId/members/:userId/kick
module.exports.kickMember = async (req, res) => {
  try {
    const meId = req.user._id;
    const { roomId, userId } = req.params;

    if (!isValidObjectId(roomId) || !isValidObjectId(userId)) {
      return res.status(400).json({
        code: 400,
        message: "roomId hoÃ¡ÂºÂ·c userId khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡",
      });
    }

    if (meId.toString() === userId.toString()) {
      return res.status(400).json({
        code: 400,
        message: "KhÃƒÂ´ng thÃ¡Â»Æ’ tÃ¡Â»Â± kick chÃƒÂ­nh mÃƒÂ¬nh, hÃƒÂ£y dÃƒÂ¹ng chÃ¡Â»Â©c nÃ„Æ’ng rÃ¡Â»Âi nhÃƒÂ³m",
      });
    }

    const room = await RoomChat.findOne({
      _id: roomId,
      typeRoom: "group",
      deleted: false,
      status: "active",
    });

    if (!room) {
      return res.status(404).json({
        code: 404,
        message: "KhÃƒÂ´ng tÃƒÂ¬m thÃ¡ÂºÂ¥y nhÃƒÂ³m",
      });
    }

    const myMember = getRoomMember(room, meId);
    const targetMember = getRoomMember(room, userId);

    if (!myMember) {
      return res.status(403).json({
        code: 403,
        message: "BÃ¡ÂºÂ¡n khÃƒÂ´ng thuÃ¡Â»â„¢c nhÃƒÂ³m nÃƒÂ y",
      });
    }

    if (!isAdminOrSuperAdmin(myMember)) {
      return res.status(403).json({
        code: 403,
        message: "BÃ¡ÂºÂ¡n khÃƒÂ´ng cÃƒÂ³ quyÃ¡Â»Ân kick thÃƒÂ nh viÃƒÂªn",
      });
    }

    if (!targetMember) {
      return res.status(404).json({
        code: 404,
        message: "ThÃƒÂ nh viÃƒÂªn cÃ¡ÂºÂ§n kick khÃƒÂ´ng tÃ¡Â»â€œn tÃ¡ÂºÂ¡i trong nhÃƒÂ³m",
      });
    }

    if (targetMember.role === "superAdmin") {
      return res.status(403).json({
        code: 403,
        message: "KhÃƒÂ´ng thÃ¡Â»Æ’ kick trÃ†Â°Ã¡Â»Å¸ng nhÃƒÂ³m",
      });
    }

    if (myMember.role === "admin" && targetMember.role === "admin") {
      return res.status(403).json({
        code: 403,
        message: "Admin khÃƒÂ´ng thÃ¡Â»Æ’ kick admin khÃƒÂ¡c",
      });
    }

    targetMember.isActive = false;
    targetMember.leftAt = new Date();
    targetMember.leftReason = "kick";
    targetMember.removedBy = meId;
    targetMember.role = "member";
    targetMember.unreadCount = 0;
    targetMember.pinned = false;
    targetMember.archived = false;
    targetMember.deletedAt = new Date();

    await room.save();

    const responseRoom = await buildRoomResponse(room._id, meId);

    global._io?.to(room._id.toString()).emit("SERVER_ROOM_UPDATED", {
      roomId: room._id,
      type: "KICK_MEMBER",
      userId,
      removedBy: meId,
      room: responseRoom,
    });

    global._io?.to(userId.toString()).emit("SERVER_KICKED_FROM_ROOM", {
      roomId: room._id,
      removedBy: meId,
    });

    return res.status(200).json({
      code: 200,
      message: "Ã„ÂÃƒÂ£ kick thÃƒÂ nh viÃƒÂªn khÃ¡Â»Âi nhÃƒÂ³m",
      data: {
        room: responseRoom,
        kickedUserId: userId,
      },
    });
  } catch (error) {
    console.error("kickMember error:", error);
    return res.status(500).json({
      code: 500,
      message: "FAILED!",
    });
  }
};

// [PATCH] /api/v1/room-chat/:roomId/members/:userId/role
module.exports.updateMemberRole = async (req, res) => {
  try {
    const meId = req.user._id;
    const { roomId, userId } = req.params;
    const { role } = req.body;

    if (!isValidObjectId(roomId) || !isValidObjectId(userId)) {
      return res.status(400).json({
        code: 400,
        message: "roomId hoÃ¡ÂºÂ·c userId khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡",
      });
    }

    if (!["admin", "member"].includes(role)) {
      return res.status(400).json({
        code: 400,
        message: "role chÃ¡Â»â€° Ã„â€˜Ã†Â°Ã¡Â»Â£c lÃƒÂ  admin hoÃ¡ÂºÂ·c member",
      });
    }

    const room = await RoomChat.findOne({
      _id: roomId,
      typeRoom: "group",
      deleted: false,
      status: "active",
    });

    if (!room) {
      return res.status(404).json({
        code: 404,
        message: "KhÃƒÂ´ng tÃƒÂ¬m thÃ¡ÂºÂ¥y nhÃƒÂ³m",
      });
    }

    const myMember = getRoomMember(room, meId);
    const targetMember = getRoomMember(room, userId);

    if (!myMember) {
      return res.status(403).json({
        code: 403,
        message: "BÃ¡ÂºÂ¡n khÃƒÂ´ng thuÃ¡Â»â„¢c nhÃƒÂ³m nÃƒÂ y",
      });
    }

    if (!isSuperAdmin(myMember)) {
      return res.status(403).json({
        code: 403,
        message: "ChÃ¡Â»â€° trÃ†Â°Ã¡Â»Å¸ng nhÃƒÂ³m mÃ¡Â»â€ºi cÃƒÂ³ quyÃ¡Â»Ân Ã„â€˜Ã¡Â»â€¢i role",
      });
    }

    if (!targetMember) {
      return res.status(404).json({
        code: 404,
        message: "ThÃƒÂ nh viÃƒÂªn khÃƒÂ´ng tÃ¡Â»â€œn tÃ¡ÂºÂ¡i trong nhÃƒÂ³m",
      });
    }

    if (targetMember.role === "superAdmin") {
      return res.status(403).json({
        code: 403,
        message: "KhÃƒÂ´ng thÃ¡Â»Æ’ Ã„â€˜Ã¡Â»â€¢i role cÃ¡Â»Â§a trÃ†Â°Ã¡Â»Å¸ng nhÃƒÂ³m bÃ¡ÂºÂ±ng API nÃƒÂ y",
      });
    }

    targetMember.role = role;

    await room.save();

    const responseRoom = await buildRoomResponse(room._id, meId);

    global._io?.to(room._id.toString()).emit("SERVER_ROOM_UPDATED", {
      roomId: room._id,
      type: "CHANGE_ROLE",
      userId,
      role,
      room: responseRoom,
    });

    return res.status(200).json({
      code: 200,
      message: "Ã„ÂÃ¡Â»â€¢i role thÃƒÂ nh cÃƒÂ´ng",
      data: {
        room: responseRoom,
        userId,
        role,
      },
    });
  } catch (error) {
    console.error("updateMemberRole error:", error);
    return res.status(500).json({
      code: 500,
      message: "FAILED!",
    });
  }
};

// [PATCH] /api/v1/room-chat/:roomId/transfer-owner
module.exports.transferOwner = async (req, res) => {
  try {
    const meId = req.user._id;
    const { roomId } = req.params;
    const { userId } = req.body;

    if (!isValidObjectId(roomId) || !isValidObjectId(userId)) {
      return res.status(400).json({
        code: 400,
        message: "roomId hoáº·c userId khÃ´ng há»£p lá»‡",
      });
    }

    if (meId.toString() === userId.toString()) {
      return res.status(400).json({
        code: 400,
        message: "Báº¡n Ä‘ang lÃ  trÆ°á»Ÿng nhÃ³m rá»“i",
      });
    }

    const room = await RoomChat.findOne({
      _id: roomId,
      typeRoom: "group",
      deleted: false,
      status: "active",
    });

    if (!room) {
      return res.status(404).json({
        code: 404,
        message: "KhÃ´ng tÃ¬m tháº¥y nhÃ³m",
      });
    }

    const myMember = room.users.find(
      (u) => u.user_id.toString() === meId.toString() && u.isActive,
    );
    const targetMember = room.users.find(
      (u) => u.user_id.toString() === userId.toString() && u.isActive,
    );

    if (!myMember) {
      return res.status(403).json({
        code: 403,
        message: "Báº¡n khÃ´ng thuá»™c nhÃ³m nÃ y",
      });
    }

    if (myMember.role !== "superAdmin") {
      return res.status(403).json({
        code: 403,
        message: "Chá»‰ trÆ°á»Ÿng nhÃ³m má»›i cÃ³ quyá»n chuyá»ƒn quyá»n",
      });
    }

    if (!targetMember) {
      return res.status(404).json({
        code: 404,
        message: "NgÆ°á»i nháº­n quyá»n khÃ´ng thuá»™c nhÃ³m nÃ y",
      });
    }

    myMember.role = "admin";
    targetMember.role = "superAdmin";

    await room.save();

    const responseRoom = await buildRoomResponse(room._id, meId);

    global._io?.to(room._id.toString()).emit("SERVER_ROOM_UPDATED", {
      roomId: room._id,
      type: "TRANSFER_OWNER",
      oldOwnerId: meId,
      newOwnerId: userId,
      room: responseRoom,
    });

    return res.status(200).json({
      code: 200,
      message: "Chuyá»ƒn quyá»n trÆ°á»Ÿng nhÃ³m thÃ nh cÃ´ng",
      data: {
        room: responseRoom,
        oldOwnerId: meId,
        newOwnerId: userId,
      },
    });
  } catch (error) {
    console.error("transferOwner error:", error);
    return res.status(500).json({
      code: 500,
      message: "FAILED!",
    });
  }
};
module.exports.updateGroupSettings = async (req, res) => {
  try {
    const meId = req.user._id;
    const { roomId } = req.params;
    const {
      onlyAdminCanAddMember,
      onlyAdminCanChangeInfo,
      onlyAdminCanChangeTheme,
      onlyAdminCanSendMessage,
    } = req.body;

    if (!isValidObjectId(roomId)) {
      return res.status(400).json({
        code: 400,
        message: "roomId khÃ´ng há»£p lá»‡",
      });
    }

    const room = await RoomChat.findOne({
      _id: roomId,
      typeRoom: "group",
      deleted: false,
      status: "active",
    });

    if (!room) {
      return res.status(404).json({
        code: 404,
        message: "KhÃ´ng tÃ¬m tháº¥y nhÃ³m",
      });
    }

    const myMember = room.users.find(
      (u) => u.user_id.toString() === meId.toString() && u.isActive,
    );

    if (!myMember) {
      return res.status(403).json({
        code: 403,
        message: "Báº¡n khÃ´ng thuá»™c nhÃ³m nÃ y",
      });
    }

    if (!["admin", "superAdmin"].includes(myMember.role)) {
      return res.status(403).json({
        code: 403,
        message: "Báº¡n khÃ´ng cÃ³ quyá»n thay Ä‘á»•i cÃ i Ä‘áº·t nhÃ³m",
      });
    }

    const allowedSettings = {
      onlyAdminCanAddMember,
      onlyAdminCanChangeInfo,
      onlyAdminCanChangeTheme,
      onlyAdminCanSendMessage,
    };

    Object.entries(allowedSettings).forEach(([key, value]) => {
      if (value !== undefined) {
        if (typeof value !== "boolean") {
          throw new Error(`${key} pháº£i lÃ  true hoáº·c false`);
        }

        room.groupSettings[key] = value;
      }
    });

    await room.save();

    const responseRoom = await buildRoomResponse(room._id, meId);

    global._io?.to(room._id.toString()).emit("SERVER_ROOM_UPDATED", {
      roomId: room._id,
      type: "CHANGE_GROUP_SETTINGS",
      room: responseRoom,
    });

    return res.status(200).json({
      code: 200,
      message: "Cáº­p nháº­t cÃ i Ä‘áº·t nhÃ³m thÃ nh cÃ´ng",
      data: responseRoom,
    });
  } catch (error) {
    console.error("updateGroupSettings error:", error);

    return res.status(500).json({
      code: 500,
      message: error.message || "FAILED!",
    });
  }
};

// [PATCH] /api/v1/room-chat/:roomId/read
module.exports.markRoomAsRead = async (req, res) => {
  try {
    const meId = req.user._id;
    const { roomId } = req.params;
    const { lastMessageId } = req.body;

    if (!isValidObjectId(roomId)) {
      return res.status(400).json({
        code: 400,
        message: "roomId khÃ´ng há»£p lá»‡",
      });
    }

    if (lastMessageId && !isValidObjectId(lastMessageId)) {
      return res.status(400).json({
        code: 400,
        message: "lastMessageId khÃ´ng há»£p lá»‡",
      });
    }

    const updateData = {
      "users.$.unreadCount": 0,
      "users.$.lastReadAt": new Date(),
    };

    if (lastMessageId) {
      updateData["users.$.lastReadMessage"] = lastMessageId;
    }

    const room = await RoomChat.findOneAndUpdate(
      {
        _id: roomId,
        deleted: false,
        "users.user_id": meId,
      },
      {
        $set: updateData,
      },
      {
        new: true,
      },
    );

    if (!room) {
      return res.status(404).json({
        code: 404,
        message: "KhÃ´ng tÃ¬m tháº¥y phÃ²ng chat",
      });
    }

    const newBadgeCount = await syncUserChatBadge(meId.toString());

    global._io?.to(meId.toString()).emit("SERVER_ROOM_STATE_UPDATED", {
      roomId: room._id,
      currentUserRoomState: {
        unreadCount: 0,
        lastReadAt: updateData["users.$.lastReadAt"],
        lastReadMessage: lastMessageId || null,
      },
      chatBadgeCount: newBadgeCount,
    });

    global._io?.to(meId.toString()).emit("SERVER_UNREAD_CHAT_COUNT_UPDATED", {
      chatBadgeCount: newBadgeCount,
    });

    return res.status(200).json({
      code: 200,
      message: "ÄÃ£ Ä‘Ã¡nh dáº¥u Ä‘Ã£ Ä‘á»c",
      data: {
        roomId: room._id,
        unreadCount: 0,
        chatBadgeCount: newBadgeCount,
        lastReadAt: updateData["users.$.lastReadAt"],
        lastReadMessage: lastMessageId || null,
      },
    });
  } catch (error) {
    console.error("markRoomAsRead error:", error);

    return res.status(500).json({
      code: 500,
      message: "FAILED!",
    });
  }
};

// [PATCH] /api/v1/room-chat/read-all
// Reset unreadCount = 0 cho táº¥t cáº£ room cá»§a user (khi báº¥m vÃ o icon Tin nháº¯n)
module.exports.markAllRoomsAsRead = async (req, res) => {
  try {
    const meId = req.user._id;

    await RoomChat.updateMany(
      {
        deleted: false,
        "users.user_id": meId,
        "users.isActive": true,
      },
      {
        $set: { "users.$[elem].unreadCount": 0 },
      },
      {
        arrayFilters: [{ "elem.user_id": meId }],
      },
    );

    const newBadgeCount = await syncUserChatBadge(meId.toString());

    global._io?.to(meId.toString()).emit("SERVER_UNREAD_CHAT_COUNT_UPDATED", {
      chatBadgeCount: newBadgeCount,
    });

    return res.status(200).json({
      code: 200,
      message: "ÄÃ£ Ä‘Ã¡nh dáº¥u táº¥t cáº£ tin nháº¯n lÃ  Ä‘Ã£ Ä‘á»c",
      data: {
        chatBadgeCount: newBadgeCount,
      },
    });
  } catch (error) {
    console.error("markAllRoomsAsRead error:", error);
    return res.status(500).json({ code: 500, message: "FAILED!" });
  }
};

// Alias dung tu ProfilePage khi bam "Nhan tin"
module.exports.createPrivateFromProfile = async (req, res) => {
  try {
    const meId = req.user._id;
    const userId = req.params.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ code: 400, message: "userId khong hop le" });
    }

    if (meId.toString() === userId.toString()) {
      return res.status(400).json({ code: 400, message: "Khong the tu nhan tin voi chinh minh" });
    }

    const targetUser = await User.findOne({ _id: userId, deleted: false, status: "active" });
    if (!targetUser) {
      return res.status(404).json({ code: 404, message: "Nguoi dung khong ton tai" });
    }

    const friendKey = [meId.toString(), userId.toString()].sort().join("_");

    let room = await RoomChat.findOne({ typeRoom: "friend", friendKey, deleted: false });

    if (!room) {
      try {
        room = await RoomChat.create({
          title: "",
          avatar: "",
          typeRoom: "friend",
          createdBy: meId,
          friendKey,
          status: "active",
          users: [
            { user_id: meId, role: "member", joinedAt: new Date(), isActive: true, unreadCount: 0 },
            { user_id: userId, role: "member", joinedAt: new Date(), isActive: true, unreadCount: 0 },
          ],
        });
      } catch (err) {
        if (err.code === 11000) {
          room = await RoomChat.findOne({ typeRoom: "friend", friendKey, deleted: false });
        } else {
          throw err;
        }
      }
    }

    // Reactivate neu bi xoa phia user
    let changed = false;
    for (const member of room.users) {
      if (member.user_id.toString() === meId.toString() || member.user_id.toString() === userId.toString()) {
        if (!member.isActive) { member.isActive = true; member.leftAt = null; member.leftReason = null; changed = true; }
        if (member.deletedAt) { member.deletedAt = null; member.archived = false; member.pinned = false; member.unreadCount = 0; changed = true; }
      }
    }
    if (changed) await room.save();

    const responseRoom = await buildRoomResponse(room._id, meId);

    return res.status(200).json({
      code: 200,
      message: "OK",
      data: responseRoom,
    });
  } catch (error) {
    console.error("createPrivateFromProfile error:", error);
    return res.status(500).json({ code: 500, message: "FAILED!" });
  }
};
