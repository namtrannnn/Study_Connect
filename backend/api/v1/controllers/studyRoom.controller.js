const StudyRoom = require("../models/studyRoom.model");
const User = require("../models/user.model");
const mongoose = require("mongoose");
const { createNotification } = require("../services/notification.service");

// Helper to check if string is a valid ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Helper to remove a user from all active rooms they are currently in
const leaveAllOtherRooms = async (userId) => {
  const activeRooms = await StudyRoom.find({
    status: "active",
    "members.user": userId,
  });

  for (const room of activeRooms) {
    room.members = room.members.filter((m) => m.user.toString() !== userId.toString());
    room.membersCount = room.members.length;

    if (room.membersCount === 0) {
      room.emptyAt = new Date();
    } else {
      // If the user who left was the host, assign a new host
      const hasHost = room.members.some((m) => m.role === "host");
      if (!hasHost && room.members.length > 0) {
        room.members[0].role = "host";
      }
    }

    await room.save();

    // Broadcast member left event to room via socket
    if (global._io) {
      global._io.to(room._id.toString()).emit("SERVER_STUDY_ROOM_MEMBER_LEFT", {
        roomId: room._id,
        userId: userId,
        membersCount: room.membersCount,
      });
    }
  }
};

// [POST] /api/v1/study-room/create
module.exports.createRoom = async (req, res) => {
  try {
    const user = req.user;
    const { name, description, category, type, maxMembers, allowChat, pomodoroSync, pomodoroSettings, backgroundMusic } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        code: 400,
        message: "Tên phòng học không được để trống",
      });
    }

    // Auto leave any active room before creating a new one
    await leaveAllOtherRooms(user._id);

    const roomType = type || "public";
    const roomMaxMembers = roomType === "solo" ? 1 : (maxMembers || 20);

    const initialMembers = [
      {
        user: user._id,
        role: "host",
        joinedAt: new Date(),
        isStudying: false,
      },
    ];

    const newRoom = new StudyRoom({
      name: name.trim(),
      description: description || "",
      category: category || "other",
      createdBy: user._id,
      type: roomType,
      maxMembers: roomMaxMembers,
      members: initialMembers,
      membersCount: 1,
      allowChat: allowChat !== undefined ? allowChat : true,
      pomodoroSync: pomodoroSync !== undefined ? pomodoroSync : false,
      pomodoroSettings: pomodoroSettings || {},
      backgroundMusic: backgroundMusic || null,
      totalJoins: 1,
    });

    await newRoom.save();

    const roomDetails = await StudyRoom.findById(newRoom._id)
      .populate("createdBy", "fullName username avatar isVerified")
      .populate("members.user", "fullName username avatar isVerified");

    return res.status(201).json({
      code: 201,
      message: "Tạo phòng học thành công",
      data: roomDetails,
    });
  } catch (error) {
    console.error("createRoom error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server khi tạo phòng",
      error: error.message,
    });
  }
};

// [GET] /api/v1/study-room/list
module.exports.getPublicRooms = async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;

    const query = {
      status: "active",
      type: "public",
    };

    if (category && category !== "all") {
      query.category = category;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const rooms = await StudyRoom.find(query)
      .populate("createdBy", "fullName username avatar isVerified")
      .populate("members.user", "fullName username avatar isVerified")
      .sort({ membersCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await StudyRoom.countDocuments(query);

    return res.status(200).json({
      code: 200,
      message: "Lấy danh sách phòng học thành công",
      data: {
        rooms,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error("getPublicRooms error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server khi lấy danh sách phòng",
      error: error.message,
    });
  }
};

// [GET] /api/v1/study-room/:idOrCode
module.exports.getRoomDetails = async (req, res) => {
  try {
    const { idOrCode } = req.params;
    const viewerId = req.user._id;

    let query = { status: "active" };

    if (isValidObjectId(idOrCode)) {
      query._id = idOrCode;
    } else {
      query.roomCode = idOrCode.toUpperCase();
    }

    const room = await StudyRoom.findOne(query)
      .populate("createdBy", "fullName username avatar isVerified")
      .populate("members.user", "fullName username avatar isVerified")
      .populate("invites.user", "fullName username avatar isVerified");

    if (!room) {
      return res.status(404).json({
        code: 404,
        message: "Phòng học không tồn tại hoặc đã đóng",
      });
    }

    // Check visibility for private rooms
    if (room.type === "private") {
      const isCreator = room.createdBy._id.toString() === viewerId.toString();
      const isMember = room.members.some((m) => m.user._id.toString() === viewerId.toString());
      const isInvited = room.invites.some(
        (invite) => invite.user._id.toString() === viewerId.toString() && invite.status === "pending"
      );

      // If you have the direct roomCode, we bypass strict invite checking (standard invite link behavior)
      const hasRoomCodeBypass = !isValidObjectId(idOrCode) && idOrCode.toUpperCase() === room.roomCode;

      if (!isCreator && !isMember && !isInvited && !hasRoomCodeBypass) {
        return res.status(403).json({
          code: 403,
          message: "Bạn không có quyền xem thông tin phòng học riêng tư này",
        });
      }
    }

    return res.status(200).json({
      code: 200,
      message: "Lấy chi tiết phòng học thành công",
      data: room,
    });
  } catch (error) {
    console.error("getRoomDetails error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server khi lấy chi tiết phòng",
      error: error.message,
    });
  }
};

// [POST] /api/v1/study-room/join
module.exports.joinRoom = async (req, res) => {
  try {
    const user = req.user;
    const { idOrCode, currentSubject, technique } = req.body;

    if (!idOrCode) {
      return res.status(400).json({
        code: 400,
        message: "Mã phòng hoặc ID phòng học là bắt buộc",
      });
    }

    let query = { status: "active" };

    if (isValidObjectId(idOrCode)) {
      query._id = idOrCode;
    } else {
      query.roomCode = idOrCode.toUpperCase();
    }

    const room = await StudyRoom.findOne(query);

    if (!room) {
      return res.status(404).json({
        code: 404,
        message: "Phòng học không tồn tại hoặc đã đóng",
      });
    }

    // Check if user is already a member
    const isAlreadyMember = room.members.some((m) => m.user.toString() === user._id.toString());
    if (isAlreadyMember) {
      return res.status(200).json({
        code: 200,
        message: "Bạn đã ở trong phòng học này rồi",
        data: room,
      });
    }

    // Check capacity
    if (room.membersCount >= room.maxMembers) {
      return res.status(400).json({
        code: 400,
        message: "Phòng học đã đầy",
      });
    }

    // Check private room access
    if (room.type === "private") {
      const isCreator = room.createdBy.toString() === user._id.toString();
      const isInvited = room.invites.some(
        (invite) => invite.user.toString() === user._id.toString() && invite.status === "pending"
      );
      const isRoomCodeBypass = !isValidObjectId(idOrCode) && idOrCode.toUpperCase() === room.roomCode;

      if (!isCreator && !isInvited && !isRoomCodeBypass) {
        return res.status(403).json({
          code: 403,
          message: "Bạn cần có lời mời để tham gia phòng học riêng tư này",
        });
      }
    }

    // Leave any other rooms first
    await leaveAllOtherRooms(user._id);

    // If there was a pending invite, set its status to accepted
    const inviteIndex = room.invites.findIndex(
      (invite) => invite.user.toString() === user._id.toString() && invite.status === "pending"
    );
    if (inviteIndex !== -1) {
      room.invites[inviteIndex].status = "accepted";
    }

    // Add to members
    const isCreator = room.createdBy.toString() === user._id.toString();
    room.members.push({
      user: user._id,
      role: isCreator ? "host" : "member",
      joinedAt: new Date(),
      currentSubject: currentSubject || "",
      technique: technique || "free",
      isStudying: false,
    });

    room.membersCount = room.members.length;
    room.emptyAt = null;
    room.totalJoins += 1;

    await room.save();

    const roomDetails = await StudyRoom.findById(room._id)
      .populate("createdBy", "fullName username avatar isVerified")
      .populate("members.user", "fullName username avatar isVerified");

    // Broadcast join event
    if (global._io) {
      global._io.to(room._id.toString()).emit("SERVER_STUDY_ROOM_MEMBER_JOINED", {
        roomId: room._id,
        member: {
          user: {
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            avatar: user.avatar,
            isVerified: user.isVerified,
          },
          role: isCreator ? "host" : "member",
          currentSubject: currentSubject || "",
          technique: technique || "free",
          isStudying: false,
          joinedAt: new Date(),
        },
        membersCount: room.membersCount,
      });
    }

    return res.status(200).json({
      code: 200,
      message: "Tham gia phòng học thành công",
      data: roomDetails,
    });
  } catch (error) {
    console.error("joinRoom error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server khi tham gia phòng",
      error: error.message,
    });
  }
};

// [POST] /api/v1/study-room/leave
module.exports.leaveRoom = async (req, res) => {
  try {
    const user = req.user;

    const room = await StudyRoom.findOne({
      status: "active",
      "members.user": user._id,
    });

    if (!room) {
      return res.status(400).json({
        code: 400,
        message: "Bạn không ở trong phòng học nào",
      });
    }

    room.members = room.members.filter((m) => m.user.toString() !== user._id.toString());
    room.membersCount = room.members.length;

    if (room.membersCount === 0) {
      room.emptyAt = new Date();
    } else {
      // Reassign host role if creator left and there's no host
      const hasHost = room.members.some((m) => m.role === "host");
      if (!hasHost && room.members.length > 0) {
        room.members[0].role = "host";
      }
    }

    await room.save();

    // Broadcast member left
    if (global._io) {
      global._io.to(room._id.toString()).emit("SERVER_STUDY_ROOM_MEMBER_LEFT", {
        roomId: room._id,
        userId: user._id,
        membersCount: room.membersCount,
      });
    }

    return res.status(200).json({
      code: 200,
      message: "Rời phòng học thành công",
    });
  } catch (error) {
    console.error("leaveRoom error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server khi rời phòng",
      error: error.message,
    });
  }
};

// [POST] /api/v1/study-room/:id/invite
module.exports.inviteFriend = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({
        code: 400,
        message: "ID người dùng được mời là bắt buộc",
      });
    }

    const room = await StudyRoom.findOne({
      _id: id,
      status: "active",
    });

    if (!room) {
      return res.status(404).json({
        code: 404,
        message: "Phòng học không tồn tại hoặc đã đóng",
      });
    }

    // Verify inviter is in the room
    const isMember = room.members.some((m) => m.user.toString() === user._id.toString());
    if (!isMember) {
      return res.status(403).json({
        code: 403,
        message: "Bạn phải ở trong phòng học mới có thể mời người khác",
      });
    }

    // Verify target user is active and exists
    const targetUser = await User.findOne({ _id: targetUserId, status: "active", deleted: false });
    if (!targetUser) {
      return res.status(404).json({
        code: 404,
        message: "Người được mời không tồn tại",
      });
    }

    // Check if target user is already in the room
    const targetAlreadyInRoom = room.members.some((m) => m.user.toString() === targetUserId);
    if (targetAlreadyInRoom) {
      return res.status(400).json({
        code: 400,
        message: "Người này đã ở trong phòng học",
      });
    }

    // Check if already invited
    const alreadyInvited = room.invites.some(
      (invite) => invite.user.toString() === targetUserId && invite.status === "pending"
    );

    if (alreadyInvited) {
      return res.status(400).json({
        code: 400,
        message: "Bạn đã gửi lời mời cho người này rồi",
      });
    }

    // Add invite
    room.invites.push({
      user: targetUserId,
      invitedBy: user._id,
      status: "pending",
      invitedAt: new Date(),
    });

    await room.save();

    // Create Notification
    await createNotification({
      receiver: targetUserId,
      sender: user._id,
      type: "study_room_invite",
      title: "Mời tham gia học nhóm",
      message: `${user.fullName} đã mời bạn tham gia phòng học "${room.name}"`,
      refId: room._id,
      refType: "studyRoom",
    });

    return res.status(200).json({
      code: 200,
      message: "Đã gửi lời mời tham gia phòng học",
    });
  } catch (error) {
    console.error("inviteFriend error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server khi gửi lời mời",
      error: error.message,
    });
  }
};

// [POST] /api/v1/study-room/invite/respond
module.exports.respondToInvite = async (req, res) => {
  try {
    const user = req.user;
    const { roomId, action } = req.body; // action: "accept" | "decline"

    if (!roomId || !action || !["accept", "decline"].includes(action)) {
      return res.status(400).json({
        code: 400,
        message: "ID phòng và hành động (accept/decline) là bắt buộc",
      });
    }

    const room = await StudyRoom.findOne({
      _id: roomId,
      status: "active",
    });

    if (!room) {
      return res.status(404).json({
        code: 404,
        message: "Phòng học không tồn tại hoặc đã đóng",
      });
    }

    const inviteIndex = room.invites.findIndex(
      (invite) => invite.user.toString() === user._id.toString() && invite.status === "pending"
    );

    if (inviteIndex === -1) {
      return res.status(404).json({
        code: 404,
        message: "Không tìm thấy lời mời đang chờ xử lý",
      });
    }

    room.invites[inviteIndex].status = action === "accept" ? "accepted" : "declined";
    await room.save();

    return res.status(200).json({
      code: 200,
      message: action === "accept" ? "Chấp nhận lời mời thành công" : "Từ chối lời mời thành công",
    });
  } catch (error) {
    console.error("respondToInvite error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server khi phản hồi lời mời",
      error: error.message,
    });
  }
};

// [PATCH] /api/v1/study-room/:id/update
module.exports.updateRoomSettings = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { name, description, category, allowChat, pomodoroSync, pomodoroSettings, backgroundMusic } = req.body;

    const room = await StudyRoom.findOne({
      _id: id,
      status: "active",
    });

    if (!room) {
      return res.status(404).json({
        code: 404,
        message: "Phòng học không tồn tại hoặc đã đóng",
      });
    }

    // Only host/creator can edit settings
    const isHost = room.members.some((m) => m.user.toString() === user._id.toString() && m.role === "host");
    const isCreator = room.createdBy.toString() === user._id.toString();

    if (!isHost && !isCreator) {
      return res.status(403).json({
        code: 403,
        message: "Chỉ trưởng phòng mới có quyền thay đổi cài đặt",
      });
    }

    if (name && name.trim()) room.name = name.trim();
    if (description !== undefined) room.description = description;
    if (category) room.category = category;
    if (allowChat !== undefined) room.allowChat = allowChat;
    if (pomodoroSync !== undefined) room.pomodoroSync = pomodoroSync;
    if (pomodoroSettings) room.pomodoroSettings = { ...room.pomodoroSettings, ...pomodoroSettings };
    if (backgroundMusic !== undefined) room.backgroundMusic = backgroundMusic;

    await room.save();

    const updatedRoom = await StudyRoom.findById(room._id)
      .populate("createdBy", "fullName username avatar isVerified")
      .populate("members.user", "fullName username avatar isVerified");

    // Broadcast settings update
    if (global._io) {
      global._io.to(room._id.toString()).emit("SERVER_STUDY_ROOM_UPDATED", {
        roomId: room._id,
        room: updatedRoom,
      });
    }

    return res.status(200).json({
      code: 200,
      message: "Cập nhật cài đặt phòng thành công",
      data: updatedRoom,
    });
  } catch (error) {
    console.error("updateRoomSettings error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server khi cập nhật cài đặt",
      error: error.message,
    });
  }
};

// [DELETE] /api/v1/study-room/:id/close
module.exports.closeRoom = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const room = await StudyRoom.findOne({
      _id: id,
      status: "active",
    });

    if (!room) {
      return res.status(404).json({
        code: 404,
        message: "Phòng học không tồn tại hoặc đã đóng từ trước",
      });
    }

    // Only host or creator can close room
    const isHost = room.members.some((m) => m.user.toString() === user._id.toString() && m.role === "host");
    const isCreator = room.createdBy.toString() === user._id.toString();

    if (!isHost && !isCreator) {
      return res.status(403).json({
        code: 403,
        message: "Chỉ trưởng phòng mới có quyền đóng phòng học",
      });
    }

    room.status = "closed";
    const membersBeforeClose = room.members.map((m) => m.user.toString());
    room.members = [];
    room.membersCount = 0;

    await room.save();

    // Broadcast close room event
    if (global._io) {
      global._io.to(id).emit("SERVER_STUDY_ROOM_CLOSED", {
        roomId: id,
        message: "Phòng học đã đóng bởi trưởng phòng",
      });

      // Disconnect all sockets inside that room namespace
      // (Client-side handles disconnecting from the room channel upon receiving SERVER_STUDY_ROOM_CLOSED)
    }

    return res.status(200).json({
      code: 200,
      message: "Đóng phòng học thành công",
    });
  } catch (error) {
    console.error("closeRoom error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server khi đóng phòng",
      error: error.message,
    });
  }
};

// [GET] /api/v1/study-room/active
// Get the active room the current user is currently in (if any)
module.exports.getCurrentActiveRoom = async (req, res) => {
  try {
    const user = req.user;

    const room = await StudyRoom.findOne({
      status: "active",
      "members.user": user._id,
    })
      .populate("createdBy", "fullName username avatar isVerified")
      .populate("members.user", "fullName username avatar isVerified")
      .populate("invites.user", "fullName username avatar isVerified");

    if (!room) {
      return res.status(200).json({
        code: 200,
        message: "Bạn không ở trong phòng học nào",
        data: null,
      });
    }

    return res.status(200).json({
      code: 200,
      message: "Lấy thông tin phòng hiện tại thành công",
      data: room,
    });
  } catch (error) {
    console.error("getCurrentActiveRoom error:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server khi lấy phòng hiện tại",
      error: error.message,
    });
  }
};
