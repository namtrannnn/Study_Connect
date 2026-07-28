const User = require("../models/user.model");
const { createNotification } = require("../services/notification.service");
const RoomChat = require("../models/roomChat.model");

// [POST] /api/v1/friends/request/:userId  (Follow / Gửi yêu cầu Follow)
module.exports.sendRequest = async (req, res) => {
  try {
    const myUser = req.user;
    const targetUserId = req.params.userId;

    if (myUser._id.toString() === targetUserId.toString()) {
      return res.status(400).json({
        code: 400,
        message: "Không thể tự theo dõi chính mình",
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

    const isAlreadyFollowing = (myUser.following || []).some(
      (id) => id.toString() === targetUserId.toString(),
    );

    if (isAlreadyFollowing) {
      return res.status(400).json({
        code: 400,
        message: "Bạn đã theo dõi người này rồi",
      });
    }

    // Nếu tài khoản target là riêng tư (isPrivate)
    if (targetUser.isPrivate) {
      const isAlreadyRequested = (targetUser.pendingFollowRequests || []).some(
        (id) => id.toString() === myUser._id.toString(),
      );

      if (isAlreadyRequested) {
        return res.status(400).json({
          code: 400,
          message: "Bạn đã gửi yêu cầu theo dõi trước đó",
        });
      }

      await User.updateOne(
        { _id: targetUserId },
        { $addToSet: { pendingFollowRequests: myUser._id } },
      );

      const notification = await createNotification({
        receiver: targetUserId,
        sender: myUser._id,
        type: "follow_request",
        title: "Yêu cầu theo dõi",
        message: `${myUser.fullName} muốn theo dõi bạn`,
        refId: myUser._id,
        refType: "user",
      });

      global._io?.to(targetUserId.toString()).emit("SERVER_FOLLOW_REQUEST_RECEIVED", {
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
        message: "Đã gửi yêu cầu theo dõi",
        data: {
          targetUserId,
          relationStatus: "pending_sent",
        },
      });
    }

    // Tài khoản công khai (Public): Follow trực tiếp
    await User.updateOne(
      { _id: myUser._id },
      { $addToSet: { following: targetUserId } },
    );

    await User.updateOne(
      { _id: targetUserId },
      { $addToSet: { followers: myUser._id } },
    );

    // Cập nhật count
    const updatedMe = await User.findById(myUser._id).select("following");
    const updatedTarget = await User.findById(targetUserId).select("followers");

    await User.updateOne(
      { _id: myUser._id },
      { followingCount: updatedMe.following.length },
    );
    await User.updateOne(
      { _id: targetUserId },
      { followersCount: updatedTarget.followers.length },
    );

    const isMutual = (myUser.followers || []).some(
      (id) => id.toString() === targetUserId.toString(),
    );

    const notification = await createNotification({
      receiver: targetUserId,
      sender: myUser._id,
      type: "follow",
      title: "Người theo dõi mới",
      message: `${myUser.fullName} đã bắt đầu theo dõi bạn`,
      refId: myUser._id,
      refType: "user",
    });

    global._io?.to(targetUserId.toString()).emit("SERVER_FOLLOW_SUCCESS", {
      sender: {
        _id: myUser._id,
        fullName: myUser.fullName,
        username: myUser.username,
        avatar: myUser.avatar,
        isVerified: myUser.isVerified,
      },
      isMutual,
      notification,
    });

    return res.json({
      code: 200,
      message: "Đã theo dõi thành công",
      data: {
        targetUserId,
        relationStatus: isMutual ? "mutual" : "following",
      },
    });
  } catch (error) {
    console.log("sendRequest/follow error:", error);
    return res.status(500).json({
      code: 500,
      message: "Failed",
    });
  }
};

// [DELETE] /api/v1/friends/request/:userId (Bỏ follow / Hủy yêu cầu follow)
module.exports.cancelRequest = async (req, res) => {
  try {
    const myUser = req.user;
    const targetUserId = req.params.userId;

    // Hủy yêu cầu chờ duyệt nếu target là private
    await User.updateOne(
      { _id: targetUserId },
      { $pull: { pendingFollowRequests: myUser._id } },
    );

    // Hủy follow nếu đã follow
    await User.updateOne(
      { _id: myUser._id },
      { $pull: { following: targetUserId } },
    );

    await User.updateOne(
      { _id: targetUserId },
      { $pull: { followers: myUser._id } },
    );

    const updatedMe = await User.findById(myUser._id).select("following");
    const updatedTarget = await User.findById(targetUserId).select("followers");

    await User.updateOne(
      { _id: myUser._id },
      { followingCount: updatedMe ? updatedMe.following.length : 0 },
    );
    await User.updateOne(
      { _id: targetUserId },
      { followersCount: updatedTarget ? updatedTarget.followers.length : 0 },
    );

    global._io?.to(targetUserId.toString()).emit("SERVER_UNFOLLOW_SUCCESS", {
      senderId: myUser._id,
    });

    return res.json({
      code: 200,
      message: "Đã bỏ theo dõi / hủy yêu cầu",
      data: {
        targetUserId,
        relationStatus: "none",
      },
    });
  } catch (error) {
    console.log("cancelRequest/unfollow error:", error);
    return res.status(500).json({
      code: 500,
      message: "Failed",
    });
  }
};

// [POST] /api/v1/friends/accept/:userId (Chấp nhận yêu cầu Follow đối với tài khoản Private)
module.exports.acceptRequest = async (req, res) => {
  try {
    const myUser = req.user; // B - chủ tài khoản private
    const senderId = req.params.userId; // A - người xin follow

    if (myUser._id.toString() === senderId.toString()) {
      return res.status(400).json({
        code: 400,
        message: "Không thể tự chấp nhận yêu cầu của chính mình",
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
        message: "Người dùng không tồn tại",
      });
    }

    const isRequested = (myUser.pendingFollowRequests || []).some(
      (id) => id.toString() === senderId.toString(),
    );

    if (!isRequested) {
      return res.status(400).json({
        code: 400,
        message: "Không tìm thấy yêu cầu theo dõi",
      });
    }

    // Chấp nhận: Rút khỏi pending, thêm senderId vào followers của B, thêm B vào following của A
    await User.updateOne(
      { _id: myUser._id },
      {
        $pull: { pendingFollowRequests: senderId },
        $addToSet: { followers: senderId },
      },
    );

    await User.updateOne(
      { _id: senderId },
      {
        $addToSet: { following: myUser._id },
      },
    );

    const updatedMe = await User.findById(myUser._id).select("followers");
    const updatedSender = await User.findById(senderId).select("following");

    await User.updateOne(
      { _id: myUser._id },
      { followersCount: updatedMe.followers.length },
    );
    await User.updateOne(
      { _id: senderId },
      { followingCount: updatedSender.following.length },
    );

    const notification = await createNotification({
      receiver: senderId,
      sender: myUser._id,
      type: "follow_accept",
      title: "Chấp nhận yêu cầu theo dõi",
      message: `${myUser.fullName} đã chấp nhận yêu cầu theo dõi của bạn`,
      refId: myUser._id,
      refType: "user",
    });

    global._io?.to(senderId.toString()).emit("SERVER_ACCEPT_FOLLOW_SUCCESS", {
      userId: myUser._id,
      notification,
    });

    return res.json({
      code: 200,
      message: "Đã chấp nhận yêu cầu theo dõi",
      data: {
        followerId: senderId,
        relationStatus: "follower",
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

// [DELETE] /api/v1/friends/refuse/:userId (Từ chối yêu cầu Follow)
module.exports.refuseRequest = async (req, res) => {
  try {
    const myUser = req.user;
    const senderId = req.params.userId;

    await User.updateOne(
      { _id: myUser._id },
      { $pull: { pendingFollowRequests: senderId } },
    );

    return res.json({
      code: 200,
      message: "Đã từ chối yêu cầu theo dõi",
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

    const isFollowing = (myUser.following || []).some(
      (id) => id.toString() === targetUserId.toString(),
    );
    const isFollower = (myUser.followers || []).some(
      (id) => id.toString() === targetUserId.toString(),
    );

    if (isFollowing && isFollower) {
      return res.json({
        code: 200,
        relationStatus: "mutual",
      });
    }

    if (isFollowing) {
      return res.json({
        code: 200,
        relationStatus: "following",
      });
    }

    if (isFollower) {
      return res.json({
        code: 200,
        relationStatus: "follower",
      });
    }

    const isPendingSent = (targetUser.pendingFollowRequests || []).some(
      (id) => id.toString() === myUser._id.toString(),
    );

    if (isPendingSent) {
      return res.json({
        code: 200,
        relationStatus: "pending_sent",
      });
    }

    const isPendingReceived = (myUser.pendingFollowRequests || []).some(
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

// [GET] /api/v1/friends/list (Danh sách Mutual Followers / Friends)
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
      path: "following followers",
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

    // Mutual followers (đã follow qua lại)
    const followingIds = new Set((targetUser.following || []).map((u) => u._id.toString()));
    const mutualUsers = (targetUser.followers || []).filter((u) => followingIds.has(u._id.toString()));

    const friends = mutualUsers.map((user) => ({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      avatar: user.avatar,
      isVerified: user.isVerified,
    }));

    return res.json({
      code: 200,
      message: "Lấy danh sách bạn bè (mutual follow) thành công",
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

// [GET] /api/v1/friends/requests/received (Danh sách lời mời theo dõi chờ duyệt)
module.exports.getReceivedRequests = async (req, res) => {
  try {
    const myUser = await User.findOne({
      _id: req.user._id,
      status: "active",
      deleted: false,
    }).populate({
      path: "pendingFollowRequests",
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

    const requests = (myUser.pendingFollowRequests || [])
      .filter((user) => user)
      .map((user) => ({
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        avatar: user.avatar,
        isVerified: user.isVerified,
      }));

    return res.json({
      code: 200,
      message: "Lấy danh sách yêu cầu theo dõi thành công",
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
