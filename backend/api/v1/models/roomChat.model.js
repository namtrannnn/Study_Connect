const mongoose = require("mongoose");

const roomChatSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
      trim: true,
    },

    avatar: {
      type: String,
      default: "",
    },

    typeRoom: {
      type: String,
      enum: ["friend", "group"],
      required: true,
    },

    // Người tạo room
    // Friend room: người mở chat đầu tiên
    // Group room: người tạo nhóm
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },

    // Dùng cho room 1-1 để chống tạo trùng room
    // Format: [userId1, userId2].sort().join("_")
    // Group room thì để null
    friendKey: {
      type: String,
      default: null,
      trim: true,
    },

    // active: room bình thường
    // blocked: room bị khóa/chặn
    // archived giữ lại để không vỡ code cũ
    // archive cá nhân nên dùng users.archived
    status: {
      type: String,
      enum: ["active", "blocked", "archived"],
      default: "active",
    },

    themeConfig: {
      name: {
        type: String,
        default: "Default",
      },

      primary: {
        type: String,
        default: "#2563eb",
      },

      background: {
        type: String,
        default: "#f4f7fb",
      },

      headerBackground: {
        type: String,
        default: "#ffffff",
      },

      bubbleMe: {
        type: String,
        default: "#2563eb",
      },

      bubbleOther: {
        type: String,
        default: "#ffffff",
      },

      textMe: {
        type: String,
        default: "#ffffff",
      },

      textOther: {
        type: String,
        default: "#111827",
      },

      coverImage: {
        type: String,
        default: "",
      },

      generatedByAI: {
        type: Boolean,
        default: false,
      },

      prompt: {
        type: String,
        default: "",
      },
    },

    // Chỉ dùng chính cho group room
    groupSettings: {
      // true: chỉ admin/superAdmin được thêm thành viên
      onlyAdminCanAddMember: {
        type: Boolean,
        default: true,
      },

      // true: chỉ admin/superAdmin được đổi tên/avatar nhóm
      onlyAdminCanChangeInfo: {
        type: Boolean,
        default: true,
      },

      // false: mọi thành viên có thể đổi theme
      // true: chỉ admin/superAdmin được đổi theme
      onlyAdminCanChangeTheme: {
        type: Boolean,
        default: false,
      },

      // false: mọi thành viên có thể nhắn
      // true: chỉ admin/superAdmin được nhắn
      onlyAdminCanSendMessage: {
        type: Boolean,
        default: false,
      },
    },

    users: [
      {
        user_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
          required: true,
        },

        role: {
          type: String,
          enum: ["member", "admin", "superAdmin"],
          default: "member",
        },

        // Biệt danh riêng trong room
        nickname: {
          type: String,
          default: "",
          trim: true,
        },

        // Thời điểm tham gia room/group
        joinedAt: {
          type: Date,
          default: Date.now,
        },

        // Rời nhóm / bị kick thì không xóa khỏi users
        // Chỉ set isActive = false
        isActive: {
          type: Boolean,
          default: true,
        },

        leftAt: {
          type: Date,
          default: null,
        },

        // Phân biệt tự rời hay bị kick
        leftReason: {
          type: String,
          enum: ["leave", "kick", null],
          default: null,
        },

        // Nếu bị kick thì lưu người kick
        removedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
          default: null,
        },

        // Đã xem tới tin nhắn nào
        lastReadMessage: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Chat",
          default: null,
        },

        lastReadAt: {
          type: Date,
          default: null,
        },

        // Số tin chưa đọc của user này trong room này
        unreadCount: {
          type: Number,
          default: 0,
          min: 0,
        },

        // Tắt thông báo riêng user này
        muted: {
          type: Boolean,
          default: false,
        },

        // Ghim room riêng user này
        pinned: {
          type: Boolean,
          default: false,
        },

        // Lưu trữ room riêng user này
        archived: {
          type: Boolean,
          default: false,
        },

        // Xóa đoạn chat phía user này
        // Không xóa room thật
        deletedAt: {
          type: Date,
          default: null,
        },

        // Lưu thời điểm xóa cuối cùng — dùng để filter messages sau khi nhắn lại
        lastDeletedAt: {
          type: Date,
          default: null,
        },
      },
    ],

    lastMessage: {
      message_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat",
        default: null,
      },

      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        default: null,
      },

      type: {
        type: String,
        enum: ["text", "image", "mixed", "system"],
        default: "text",
      },

      content: {
        type: String,
        default: "",
      },

      imagesCount: {
        type: Number,
        default: 0,
      },

      createdAt: {
        type: Date,
        default: null,
      },
    },

    deleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Tìm room theo user
roomChatSchema.index({ "users.user_id": 1 });

// Tìm room user còn active
roomChatSchema.index({ "users.user_id": 1, "users.isActive": 1 });

// Lọc friend/group
roomChatSchema.index({ typeRoom: 1 });

// Tìm room do ai tạo
roomChatSchema.index({ createdBy: 1 });

// Sort theo tin nhắn mới nhất
roomChatSchema.index({ "lastMessage.createdAt": -1 });

// Chống trùng room 1-1
// sparse: true để group room có friendKey = null không bị lỗi duplicate
roomChatSchema.index(
  { friendKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      friendKey: { $type: "string" },
    },
  },
);

// Tìm friend room nhanh hơn
roomChatSchema.index({ typeRoom: 1, friendKey: 1 });

// Lấy danh sách room của user: pinned trước, rồi lastMessage mới nhất
roomChatSchema.index({
  "users.user_id": 1,
  "users.pinned": -1,
  "lastMessage.createdAt": -1,
});

const RoomChat = mongoose.model("RoomChat", roomChatSchema, "rooms-chat");

module.exports = RoomChat;
