const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    role: {
      type: String,
      enum: ["host", "member"],
      default: "member",
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },

    // Môn học đang học trong phòng
    currentSubject: {
      type: String,
      default: "",
      trim: true,
    },

    // Kỹ thuật học: free, pomodoro, deepwork...
    technique: {
      type: String,
      enum: ["free", "pomodoro", "deepwork", "other"],
      default: "free",
    },

    // Đang trong trạng thái học (timer đang chạy)
    isStudying: {
      type: Boolean,
      default: false,
    },

    // Thời điểm bắt đầu học (để tính totalStudyMinutes khi stop)
    studyStartedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false },
);

const inviteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },

    invitedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const studyRoomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    // Mã phòng ngắn để share (VD: ABC123)
    roomCode: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },

    // Người tạo phòng
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    // public: ai cũng vào được
    // private: chỉ người được mời
    // solo: chỉ 1 người (phòng học một mình)
    type: {
      type: String,
      enum: ["public", "private", "solo"],
      default: "public",
    },

    category: {
      type: String,
      enum: [
        "technology",
        "finance_banking",
        "marketing",
        "design",
        "business",
        "language",
        "education",
        "science",
        "startup",
        "art",
        "music",
        "health",
        "other",
      ],
      default: "other",
    },

    // active: phòng đang hoạt động
    // closed: phòng đã đóng
    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
    },

    members: [memberSchema],

    membersCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxMembers: {
      type: Number,
      default: 20,
      min: 1,
      max: 50,
    },

    invites: [inviteSchema],

    // Cho phép chat trong phòng
    allowChat: {
      type: Boolean,
      default: true,
    },

    // Đồng bộ pomodoro cho cả phòng
    pomodoroSync: {
      type: Boolean,
      default: false,
    },

    pomodoroSettings: {
      workMinutes: {
        type: Number,
        default: 25,
      },
      breakMinutes: {
        type: Number,
        default: 5,
      },
      longBreakMinutes: {
        type: Number,
        default: 15,
      },
      sessionsBeforeLongBreak: {
        type: Number,
        default: 4,
      },
    },

    // Nhạc nền chung cho phòng (URL hoặc track id)
    backgroundMusic: {
      type: String,
      default: null,
    },

    // Tổng số phút học tích lũy của phòng
    totalStudyMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Tổng số lượt tham gia
    totalJoins: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Thời điểm phòng trống (không còn ai) — dùng để auto-close sau X phút
    emptyAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Auto generate roomCode trước khi save nếu chưa có
studyRoomSchema.pre("save", async function (next) {
  if (!this.roomCode) {
    this.roomCode = generateRoomCode();
  }
  next();
});

// Generate mã phòng ngắn 6 ký tự
function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // bỏ 0,O,1,I để tránh nhầm
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Index tìm phòng đang active
studyRoomSchema.index({ status: 1, type: 1 });

// Index tìm phòng theo category
studyRoomSchema.index({ status: 1, category: 1 });

// Index tìm phòng user đang ở
studyRoomSchema.index({ "members.user": 1, status: 1 });

// Index sort danh sách phòng public
studyRoomSchema.index({ status: 1, type: 1, membersCount: -1, createdAt: -1 });

// Index tìm phòng do user tạo
studyRoomSchema.index({ createdBy: 1, status: 1 });

const StudyRoom = mongoose.model("StudyRoom", studyRoomSchema, "study-rooms");

module.exports = StudyRoom;
