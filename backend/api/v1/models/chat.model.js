const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },

    room_chat_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoomChat",
      required: true,
      index: true,
    },

    // text | image | mixed | system
    // text: chỉ chữ
    // image: chỉ ảnh
    // mixed: vừa chữ vừa ảnh
    // system: tin hệ thống như "Nam đã tạo nhóm"
    type: {
      type: String,
      enum: ["text", "image", "mixed", "system"],
      default: "text",
    },

    content: {
      type: String,
      default: "",
      trim: true,
      maxlength: 5000,
    },

    images: [
      {
        url: {
          type: String,
          default: "",
        },
        public_id: {
          type: String,
          default: "",
        },
        width: {
          type: Number,
          default: null,
        },
        height: {
          type: Number,
          default: null,
        },
        type: {
          type: String,
          enum: ["image", "video"],
          default: "image",
        },
      },
    ],

    // Reply tin nhắn
    reply_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      default: null,
    },

    // Thả cảm xúc message
    reactions: [
      {
        user_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
          required: true,
        },
        emoji: {
          type: String,
          required: true,
          trim: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Chỉnh sửa tin nhắn
    edited: {
      type: Boolean,
      default: false,
    },

    editedAt: {
      type: Date,
      default: null,
    },

    editHistory: [
      {
        oldContent: {
          type: String,
          default: "",
        },
        editedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Thu hồi tin nhắn phía mọi người
    revoked: {
      type: Boolean,
      default: false,
    },

    revokedAt: {
      type: Date,
      default: null,
    },

    // Xóa tin nhắn chỉ phía từng user
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],

    // Ghim tin nhắn
    pinned: {
      type: Boolean,
      default: false,
    },

    pinnedAt: {
      type: Date,
      default: null,
    },

    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },

    // Giữ lại deleted cũ để tương thích code hiện tại
    deleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "deleted"],
      default: "active",
    },
    // Dùng cho tin nhắn hệ thống
    // Ví dụ: Nam đã đổi tên nhóm, Nam đã thêm An vào nhóm
    systemAction: {
      type: String,
      enum: [
        "CREATE_GROUP",
        "CHANGE_GROUP_NAME",
        "CHANGE_GROUP_AVATAR",
        "CHANGE_THEME",
        "ADD_MEMBER",
        "LEAVE_GROUP",
        "KICK_MEMBER",
        "CHANGE_ROLE",
        "CHANGE_NICKNAME",
        "PIN_MESSAGE",
        "UNPIN_MESSAGE",
        null,
      ],
      default: null,
    },

    // Lưu dữ liệu phụ cho system message hoặc các loại message đặc biệt
    // Ví dụ:
    // {
    //   actorId,
    //   targetUserId,
    //   oldTitle,
    //   newTitle,
    //   oldAvatar,
    //   newAvatar,
    //   oldRole,
    //   newRole
    // }
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

chatSchema.index({ room_chat_id: 1, createdAt: -1 });
chatSchema.index({ room_chat_id: 1, _id: -1 });
chatSchema.index({ user_id: 1, createdAt: -1 });
chatSchema.index({ reply_to: 1 });
chatSchema.index({ deletedFor: 1 });

const Chat = mongoose.model("Chat", chatSchema, "chats");

module.exports = Chat;
