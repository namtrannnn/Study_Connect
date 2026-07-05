const User = require("../models/user.model");
const { createNotification } = require("../services/notification.service");
const RoomChat = require("../models/roomChat.model");

// [POST] /api/v1/friends/request/:userId
module.exports.sendRequest = async (req, res) => {
  try {
    const myUser = req.user;
    const targetUserId = req.params.userId;

    if (myUser._id.toString() === targetUserId.toString()) {
      return res.status(400).json({
        code: 400,
        message: "Không thể tự kết bạn với chính mình",
      });
    }

    const targetUser = await User.findOne({
      _id: targetUserId,
      status: "active",
      deleted: false,
    });

    if (!targetUser) {
      return res.status(404).json({
        code: 404,
        message: "Người dùng không tồn tại",
      });
    }

    const isAlreadyFriend = myUser.friendList.some(
      (item) => item.user_id.toString() === targetUserId.toString(),
    );

    if (isAlreadyFriend) {
      return res.status(400).json({
        code: 400,
        message: "Hai người đã là bạn bè",
      });
    }

    const isAlreadySent = myUser.requestFriends.some(
      (id) => id.toString() === targetUserId.toString(),
    );

    if (isAlreadySent) {
      return res.status(400).json({
        code: 400,
        message: "Bạn đã gửi lời mời trước đó",
      });
    }

    const isAlreadyReceived = myUser.acceptFriends.some(
      (id) => id.toString() === targetUserId.toString(),
    );

    if (isAlreadyReceived) {
      return res.status(400).json({
        code: 400,
        message:
          "Người này đã gửi lời mời cho bạn, hãy chấp nhận thay vì gửi lại",
      });
    }

    await User.updateOne(
      { _id: myUser._id },
      { $addToSet: { requestFriends: targetUserId } },
    );

    await User.updateOne(
      { _id: targetUserId },
      { $addToSet: { acceptFriends: myUser._id } },
    );

    const notification = await createNotification({
      receiver: targetUserId,
      sender: myUser._id,
      type: "friend_request",
      title: "Lời mời kết bạn",
      message: `${myUser.fullName} đã gửi cho bạn lời mời kết bạn`,
      refId: myUser._id,
      refType: "user",
    });

    global._io
      .to(targetUserId.toString())
      .emit("SERVER_FRIEND_REQUEST_RECEIVED", {
        sender: {
          _id: myUser._id,
          fullName: myUser.fullName,
          username: myUser.username,
          avatar: myUser.avatar,
          isVerified: myUser.isVerified,
        },
        notification,
      });

    return res.json({
      code: 200,
      message: "Đã gửi lời mời kết bạn",
      data: {
        targetUserId,
        relationStatus: "pending_sent",
      },
    });
  } catch (error) {
    console.log("sendRequest error:", error);
    return res.status(500).json({
      code: 500,
      message: "Failed",
    });
  }
};

// [DELETE] /api/v1/friends/request/:userId
module.exports.cancelRequest = async (req, res) => {
  try {
    const myUser = req.user;
    const targetUserId = req.params.userId;

    const isAlreadySent = myUser.requestFriends.some(
      (id) => id.toString() === targetUserId.toString(),
    );

    if (!isAlreadySent) {
      return res.status(400).json({
        code: 400,
        message: "Bạn chưa gửi lời mời cho người này",
      });
    }

    await User.updateOne(
      { _id: myUser._id },
      { $pull: { requestFriends: targetUserId } },
    );

    await User.updateOne(
      { _id: targetUserId },
      { $pull: { acceptFriends: myUser._id } },
    );

    global._io
      .to(targetUserId.toString())
      .emit("SERVER_FRIEND_REQUEST_CANCELLED", {
        senderId: myUser._id,
      });

    return res.json({
      code: 200,
      message: "Đã hủy lời mời kết bạn",
      data: {
        targetUserId,
        relationStatus: "none",
      },
    });
  } catch (error) {
    console.log("cancelRequest error:", error);
    return res.status(500).json({
      code: 500,
      message: "Failed",
    });
  }
};

// [POST] /api/v1/friends/accept/:userId
// module.exports.acceptRequest = async (req, res) => {
//   try {
//     const myUser = req.user; // B - người chấp nhận
//     const senderId = req.params.userId; // A - người đã gửi lời mời

//     const isReceived = myUser.acceptFriends.some(
//       (id) => id.toString() === senderId.toString(),
//     );

//     if (!isReceived) {
//       return res.status(400).json({
//         code: 400,
//         message: "Không tìm thấy lời mời kết bạn",
//       });
//     }

//     const senderUser = await User.findOne({
//       _id: senderId,
//       status: "active",
//       deleted: false,
//     });

//     if (!senderUser) {
//       return res.status(404).json({
//         code: 404,
//         message: "Người gửi lời mời không tồn tại",
//       });
//     }

//     const roomChat = await RoomChat.create({
//       title: "",
//       avatar: "",
//       typeRoom: "friend",
//       status: "active",
//       theme: "default",
//       users: [
//         {
//           user_id: senderId,
//           role: "superAdmin",
//         },
//         {
//           user_id: myUser._id,
//           role: "superAdmin",
//         },
//       ],
//     });

//     await User.updateOne(
//       { _id: myUser._id },
//       {
//         $addToSet: {
//           friendList: {
//             user_id: senderId,
//             room_chat_id: roomChat._id,
//           },
//           following: senderId,
//           followers: senderId,
//         },
//         $pull: {
//           acceptFriends: senderId,
//         },
//       },
//     );

//     await User.updateOne(
//       { _id: senderId },
//       {
//         $addToSet: {
//           friendList: {
//             user_id: myUser._id,
//             room_chat_id: roomChat._id,
//           },
//           following: myUser._id,
//           followers: myUser._id,
//         },
//         $pull: {
//           requestFriends: myUser._id,
//         },
//       },
//     );

//     const updatedMe = await User.findById(myUser._id).select(
//       "followers following",
//     );

//     await User.updateOne(
//       { _id: myUser._id },
//       {
//         followersCount: updatedMe.followers.length,
//         followingCount: updatedMe.following.length,
//       },
//     );

//     const updatedSender = await User.findById(senderId).select(
//       "followers following",
//     );

//     await User.updateOne(
//       { _id: senderId },
//       {
//         followersCount: updatedSender.followers.length,
//         followingCount: updatedSender.following.length,
//       },
//     );

//     const notification = await createNotification({
//       receiver: senderId,
//       sender: myUser._id,
//       type: "friend_accept",
//       title: "Lời mời kết bạn được chấp nhận",
//       message: `${myUser.fullName} đã chấp nhận lời mời kết bạn của bạn`,
//       refId: myUser._id,
//       refType: "user",
//     });

//     global._io.to(myUser._id.toString()).emit("SERVER_ACCEPT_FRIEND_SUCCESS", {
//       userId: senderId,
//       roomChatId: roomChat._id,
//     });

//     global._io.to(senderId.toString()).emit("SERVER_ACCEPT_FRIEND_SUCCESS", {
//       userId: myUser._id,
//       roomChatId: roomChat._id,
//       notification,
//     });

//     return res.json({
//       code: 200,
//       message: "Đã chấp nhận lời mời kết bạn",
//       data: {
//         friendId: senderId,
//         roomChatId: roomChat._id,
//         relationStatus: "friend",
//       },
//     });
//   } catch (error) {
//     console.log("acceptRequest error:", error);
//     return res.status(500).json({
//       code: 500,
//       message: "Failed",
//     });
//   }
// };

// [POST] /api/v1/friends/accept/:userId
module.exports.acceptRequest = async (req, res) => {
  try {
    const myUser = req.user; // B - người chấp nhận
    const senderId = req.params.userId; // A - người gửi lời mời

    if (myUser._id.toString() === senderId.toString()) {
      return res.status(400).json({
        code: 400,
        message: "Không thể tự chấp nhận lời mời của chính mình",
      });
    }

    const senderUser = await User.findOne({
      _id: senderId,
      status: "active",
      deleted: false,
    });

    if (!senderUser) {
      return res.status(404).json({
        code: 404,
        message: "Người gửi lời mời không tồn tại",
      });
    }

    const isAlreadyFriend = myUser.friendList.some(
      (item) => item.user_id?.toString() === senderId.toString(),
    );

    if (isAlreadyFriend) {
      return res.status(400).json({
        code: 400,
        message: "Hai người đã là bạn bè",
      });
    }

    const isReceived = myUser.acceptFriends.some(
      (id) => id.toString() === senderId.toString(),
    );

    if (!isReceived) {
      return res.status(400).json({
        code: 400,
        message: "Không tìm thấy lời mời kết bạn",
      });
    }

    const friendKey = [senderUser._id.toString(), myUser._id.toString()]
      .sort()
      .join("_");

    let roomChat = await RoomChat.findOne({
      typeRoom: "friend",
      friendKey,
      deleted: false,
    });

    if (!roomChat) {
      try {
        roomChat = await RoomChat.create({
          title: "",
          avatar: "",
          typeRoom: "friend",
          createdBy: myUser._id,
          friendKey,
          status: "active",
          users: [
            {
              user_id: senderUser._id,
              role: "member",
              joinedAt: new Date(),
              isActive: true,
              unreadCount: 0,
            },
            {
              user_id: myUser._id,
              role: "member",
              joinedAt: new Date(),
              isActive: true,
              unreadCount: 0,
            },
          ],
        });
      } catch (error) {
        if (error.code === 11000) {
          roomChat = await RoomChat.findOne({
            typeRoom: "friend",
            friendKey,
            deleted: false,
          });
        } else {
          throw error;
        }
      }
    }

    await User.updateOne(
      { _id: myUser._id },
      {
        $pull: {
          acceptFriends: senderUser._id,
          requestFriends: senderUser._id,
          friendList: {
            user_id: senderUser._id,
          },
        },
      },
    );

    await User.updateOne(
      { _id: senderUser._id },
      {
        $pull: {
          requestFriends: myUser._id,
          acceptFriends: myUser._id,
          friendList: {
            user_id: myUser._id,
          },
        },
      },
    );

    await User.updateOne(
      { _id: myUser._id },
      {
        $addToSet: {
          friendList: {
            user_id: senderUser._id,
            room_chat_id: roomChat._id,
          },
          following: senderUser._id,
          followers: senderUser._id,
        },
      },
    );

    await User.updateOne(
      { _id: senderUser._id },
      {
        $addToSet: {
          friendList: {
            user_id: myUser._id,
            room_chat_id: roomChat._id,
          },
          following: myUser._id,
          followers: myUser._id,
        },
      },
    );

    const updatedMe = await User.findById(myUser._id).select(
      "followers following",
    );

    const updatedSender = await User.findById(senderUser._id).select(
      "followers following",
    );

    await User.updateOne(
      { _id: myUser._id },
      {
        followersCount: updatedMe.followers.length,
        followingCount: updatedMe.following.length,
      },
    );

    await User.updateOne(
      { _id: senderUser._id },
      {
        followersCount: updatedSender.followers.length,
        followingCount: updatedSender.following.length,
      },
    );

    const notification = await createNotification({
      receiver: senderUser._id,
      sender: myUser._id,
      type: "friend_accept",
      title: "Lời mời kết bạn được chấp nhận",
      message: `${myUser.fullName} đã chấp nhận lời mời kết bạn của bạn`,
      refId: myUser._id,
      refType: "user",
    });

    global._io?.to(myUser._id.toString()).emit("SERVER_ACCEPT_FRIEND_SUCCESS", {
      userId: senderUser._id,
      roomChatId: roomChat._id,
    });

    global._io
      ?.to(senderUser._id.toString())
      .emit("SERVER_ACCEPT_FRIEND_SUCCESS", {
        userId: myUser._id,
        roomChatId: roomChat._id,
        notification,
      });

    return res.json({
      code: 200,
      message: "Đã chấp nhận lời mời kết bạn",
      data: {
        friendId: senderUser._id,
        roomChatId: roomChat._id,
        relationStatus: "friend",
      },
    });
  } catch (error) {
    console.log("acceptRequest error:", error);
    return res.status(500).json({
      code: 500,
      message: "Failed",
    });
  }
};

// [DELETE] /api/v1/friends/refuse/:userId
module.exports.refuseRequest = async (req, res) => {
  try {
    const myUser = req.user; // B - người từ chối
    const senderId = req.params.userId; // A - người gửi lời mời

    const isReceived = myUser.acceptFriends.some(
      (id) => id.toString() === senderId.toString(),
    );

    if (!isReceived) {
      return res.status(400).json({
        code: 400,
        message: "Không tìm thấy lời mời kết bạn",
      });
    }

    await User.updateOne(
      { _id: myUser._id },
      { $pull: { acceptFriends: senderId } },
    );

    await User.updateOne(
      { _id: senderId },
      { $pull: { requestFriends: myUser._id } },
    );

    global._io.to(senderId.toString()).emit("SERVER_FRIEND_REQUEST_REFUSED", {
      userId: myUser._id,
    });

    return res.json({
      code: 200,
      message: "Đã từ chối lời mời kết bạn",
      data: {
        senderId,
        relationStatus: "none",
      },
    });
  } catch (error) {
    console.log("refuseRequest error:", error);
    return res.status(500).json({
      code: 500,
      message: "Failed",
    });
  }
};

// [GET] /api/v1/friends/status/:userId
module.exports.getRelationStatus = async (req, res) => {
  try {
    const myUser = req.user;
    const targetUserId = req.params.userId;

    if (myUser._id.toString() === targetUserId.toString()) {
      return res.json({
        code: 200,
        relationStatus: "self",
      });
    }

    const targetUser = await User.findOne({
      _id: targetUserId,
      status: "active",
      deleted: false,
    });

    if (!targetUser) {
      return res.status(404).json({
        code: 404,
        message: "Người dùng không tồn tại",
      });
    }

    const isFriend = myUser.friendList.some(
      (item) => item.user_id.toString() === targetUserId.toString(),
    );

    if (isFriend) {
      return res.json({
        code: 200,
        relationStatus: "friend",
      });
    }

    const isPendingSent = myUser.requestFriends.some(
      (id) => id.toString() === targetUserId.toString(),
    );

    if (isPendingSent) {
      return res.json({
        code: 200,
        relationStatus: "pending_sent",
      });
    }

    const isPendingReceived = myUser.acceptFriends.some(
      (id) => id.toString() === targetUserId.toString(),
    );

    if (isPendingReceived) {
      return res.json({
        code: 200,
        relationStatus: "pending_received",
      });
    }

    return res.json({
      code: 200,
      relationStatus: "none",
    });
  } catch (error) {
    console.log("getRelationStatus error:", error);

    return res.status(500).json({
      code: 500,
      message: "Failed",
    });
  }
};

// [GET] /api/v1/friends/list
// [GET] /api/v1/friends/list/:userId
module.exports.getListFriends = async (req, res) => {
  try {
    const currentUser = req.user;
    const targetUserId = req.params.userId || currentUser._id;

    const targetUser = await User.findOne({
      _id: targetUserId,
      status: "active",
      deleted: false,
    }).populate({
      path: "friendList.user_id",
      select: "_id fullName username avatar isVerified",
      match: {
        status: "active",
        deleted: false,
      },
    });

    if (!targetUser) {
      return res.status(404).json({
        code: 404,
        message: "Người dùng không tồn tại",
      });
    }

    const friends = targetUser.friendList
      .filter((item) => item.user_id)
      .map((item) => {
        return {
          _id: item.user_id._id,
          fullName: item.user_id.fullName,
          username: item.user_id.username,
          avatar: item.user_id.avatar,
          isVerified: item.user_id.isVerified,
          roomChatId: item.room_chat_id,
        };
      });

    return res.json({
      code: 200,
      message: "Lấy danh sách bạn bè thành công",
      data: {
        userId: targetUser._id,
        totalFriends: friends.length,
        friends,
      },
    });
  } catch (error) {
    console.log("getListFriends error:", error);

    return res.status(500).json({
      code: 500,
      message: "Failed",
    });
  }
};

// [GET] /api/v1/friends/requests/received
module.exports.getReceivedRequests = async (req, res) => {
  try {
    const myUser = await User.findOne({
      _id: req.user._id,
      status: "active",
      deleted: false,
    }).populate({
      path: "acceptFriends",
      select: "_id fullName username avatar isVerified",
      match: {
        status: "active",
        deleted: false,
      },
    });

    if (!myUser) {
      return res.status(404).json({
        code: 404,
        message: "Người dùng không tồn tại",
      });
    }

    const requests = myUser.acceptFriends
      .filter((user) => user)
      .map((user) => {
        return {
          _id: user._id,
          fullName: user.fullName,
          username: user.username,
          avatar: user.avatar,
          isVerified: user.isVerified,
        };
      });

    return res.json({
      code: 200,
      message: "Lấy danh sách lời mời kết bạn thành công",
      data: {
        totalRequests: requests.length,
        requests,
      },
    });
  } catch (error) {
    console.log("getReceivedRequests error:", error);

    return res.status(500).json({
      code: 500,
      message: "Failed",
    });
  }
};
