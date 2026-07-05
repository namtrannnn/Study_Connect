const StudyRoom = require("../models/studyRoom.model");

module.exports = (socket) => {
  const myUserId = socket.user._id.toString();

  // CLIENT JOIN SOCKET ROOM CHANNEL
  socket.on("CLIENT_JOIN_STUDY_ROOM", async (roomId) => {
    try {
      console.log(`📡 Socket joined study room: ${roomId} by user ${myUserId}`);

      // Verify the user is indeed a member of this room in DB
      const room = await StudyRoom.findOne({
        _id: roomId,
        status: "active",
        "members.user": myUserId,
      }).lean();

      if (!room) {
        return socket.emit("SERVER_STUDY_ROOM_ERROR", {
          message: "Bạn không thuộc phòng học này hoặc phòng đã đóng",
        });
      }

      socket.join(roomId);
    } catch (error) {
      console.error("CLIENT_JOIN_STUDY_ROOM socket error:", error);
    }
  });

  // CLIENT LEAVE SOCKET ROOM CHANNEL
  socket.on("CLIENT_LEAVE_STUDY_ROOM", async (roomId) => {
    try {
      console.log(`📡 Socket left study room channel: ${roomId} by user ${myUserId}`);
      socket.leave(roomId);
    } catch (error) {
      console.error("CLIENT_LEAVE_STUDY_ROOM socket error:", error);
    }
  });

  // CLIENT STARTS TIMER (STUDYING)
  socket.on("CLIENT_START_STUDYING", async (data) => {
    try {
      const { roomId, subject, technique } = data;

      if (!roomId) return;

      const room = await StudyRoom.findOne({
        _id: roomId,
        status: "active",
        "members.user": myUserId,
      });

      if (!room) {
        return socket.emit("SERVER_STUDY_ROOM_ERROR", {
          message: "Không tìm thấy phòng học đang hoạt động",
        });
      }

      const memberIndex = room.members.findIndex((m) => m.user.toString() === myUserId);
      if (memberIndex !== -1) {
        room.members[memberIndex].isStudying = true;
        room.members[memberIndex].studyStartedAt = new Date();
        if (subject) room.members[memberIndex].currentSubject = subject;
        if (technique) room.members[memberIndex].technique = technique;

        await room.save();

        console.log(`⏱️ User ${myUserId} started studying subject: "${subject || ''}" in room ${roomId}`);

        // Broadcast to all members in the room
        global._io.to(roomId).emit("SERVER_STUDY_ROOM_MEMBER_STARTED_STUDYING", {
          roomId,
          userId: myUserId,
          subject: room.members[memberIndex].currentSubject,
          technique: room.members[memberIndex].technique,
          studyStartedAt: room.members[memberIndex].studyStartedAt,
        });
      }
    } catch (error) {
      console.error("CLIENT_START_STUDYING socket error:", error);
    }
  });

  // CLIENT STOPS TIMER
  socket.on("CLIENT_STOP_STUDYING", async (data) => {
    try {
      const { roomId } = data;

      if (!roomId) return;

      const room = await StudyRoom.findOne({
        _id: roomId,
        status: "active",
        "members.user": myUserId,
      });

      if (!room) {
        return socket.emit("SERVER_STUDY_ROOM_ERROR", {
          message: "Không tìm thấy phòng học đang hoạt động",
        });
      }

      const memberIndex = room.members.findIndex((m) => m.user.toString() === myUserId);
      if (memberIndex !== -1 && room.members[memberIndex].isStudying) {
        const startedTime = room.members[memberIndex].studyStartedAt;
        const now = new Date();
        let studyMinutes = 0;

        if (startedTime) {
          const diffMs = now.getTime() - startedTime.getTime();
          studyMinutes = Math.round(diffMs / 60000); // round to nearest minute
        }

        room.members[memberIndex].isStudying = false;
        room.members[memberIndex].studyStartedAt = null;

        // Accumulate stats
        if (studyMinutes > 0) {
          room.totalStudyMinutes += studyMinutes;
        }

        await room.save();

        console.log(`⏱️ User ${myUserId} stopped studying in room ${roomId}. Minutes: ${studyMinutes}`);

        // Broadcast stop event
        global._io.to(roomId).emit("SERVER_STUDY_ROOM_MEMBER_STOPPED_STUDYING", {
          roomId,
          userId: myUserId,
          studyMinutes,
        });
      }
    } catch (error) {
      console.error("CLIENT_STOP_STUDYING socket error:", error);
    }
  });

  // CLIENT SEND QUICK CHAT MESSAGE (EPHEMERAL - NOT SAVED TO DB)
  socket.on("CLIENT_STUDY_ROOM_CHAT", async (data) => {
    try {
      const { roomId, content } = data;

      if (!roomId || !content || !content.trim()) return;

      // Verify membership
      const isMember = await StudyRoom.exists({
        _id: roomId,
        status: "active",
        "members.user": myUserId,
      });

      if (!isMember) return;

      const messagePayload = {
        roomId,
        content: content.trim(),
        createdAt: new Date(),
        sender: {
          _id: socket.user._id,
          fullName: socket.user.fullName,
          avatar: socket.user.avatar,
        },
      };

      // Broadcast message to everyone in the room
      global._io.to(roomId).emit("SERVER_STUDY_ROOM_CHAT_MESSAGE", messagePayload);
    } catch (error) {
      console.error("CLIENT_STUDY_ROOM_CHAT socket error:", error);
    }
  });
};
