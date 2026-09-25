const {
  getPendingAdminPosts,
  approvePostByAdmin,
  rejectPostByAdmin,
} = require("../../../services/moderation/stage4_adminQueue.service");

// [GET] /api/v1/admin/moderation/pending
module.exports.getPendingPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const data = await getPendingAdminPosts({ page, limit });

    return res.status(200).json({
      code: 200,
      message: "Lấy danh sách bài viết chờ duyệt thành công",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
};

// [PATCH] /api/v1/admin/moderation/approve/:id
module.exports.approvePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await approvePostByAdmin(id);

    return res.status(200).json({
      code: 200,
      message: "Đã duyệt bài viết thành công",
      data: post,
    });
  } catch (error) {
    return res.status(400).json({
      code: 400,
      message: error.message,
    });
  }
};

// [PATCH] /api/v1/admin/moderation/reject/:id
module.exports.rejectPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const post = await rejectPostByAdmin(id, reason);

    return res.status(200).json({
      code: 200,
      message: "Đã từ chối / ẩn bài viết thành công",
      data: post,
    });
  } catch (error) {
    return res.status(400).json({
      code: 400,
      message: error.message,
    });
  }
};
