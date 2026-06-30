const mongoose = require("mongoose");

const User = require("../models/user.model");
const Post = require("../models/post.model");

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

const extractSkillsFromText = (text = "") => {
  const skills = [
    "React",
    "Node.js",
    "MongoDB",
    "Firebase",
    "Python",
    "AI",
    "JavaScript",
    "Tailwind",
    "Express",
    "UI/UX",
  ];

  return skills
    .filter((skill) => text.toLowerCase().includes(skill.toLowerCase()))
    .slice(0, 2);
};

const emptySuggestData = () => ({
  studyPartners: [],
  trendingTopics: [],
  featuredProjects: [],
  openQuestions: [],
  activeLearners: [],
});

module.exports.getSuggestSummary = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const currentUser = await User.findById(userId)
      .select("friendList requestFriends acceptFriends followers following")
      .lean();

    if (!currentUser) {
      return res.status(404).json({
        code: 404,
        message: "Không tìm thấy người dùng",
        data: emptySuggestData(),
      });
    }

    const myFriendIds = (currentUser.friendList || [])
      .map((item) => item.user_id)
      .filter(Boolean);

    const requestFriendIds = (currentUser.requestFriends || []).filter(Boolean);
    const acceptFriendIds = (currentUser.acceptFriends || []).filter(Boolean);

    const excludedIds = [
      userId,
      ...myFriendIds,
      ...requestFriendIds,
      ...acceptFriendIds,
    ]
      .filter(Boolean)
      .map((id) => toObjectId(id));

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      studyPartnerUsers,
      trendingTopics,
      featuredProjectPosts,
      openQuestionPosts,
      activeLearnerUsers,
    ] = await Promise.all([
      // 1. Gợi ý học cùng
      User.aggregate([
        {
          $match: {
            _id: { $nin: excludedIds },
            deleted: { $ne: true },
            status: "active",
          },
        },
        {
          $addFields: {
            mutualFriends: {
              $size: {
                $setIntersection: [
                  {
                    $map: {
                      input: { $ifNull: ["$friendList", []] },
                      as: "friend",
                      in: "$$friend.user_id",
                    },
                  },
                  myFriendIds.map((id) => toObjectId(id)),
                ],
              },
            },
          },
        },
        {
          $sort: {
            mutualFriends: -1,
            createdAt: -1,
          },
        },
        {
          $limit: 5,
        },
        {
          $project: {
            fullName: 1,
            username: 1,
            avatar: 1,
            bio: 1,
            mutualFriends: 1,
          },
        },
      ]),

      // 2. Chủ đề nổi bật
      Post.aggregate([
        {
          $match: {
            status: "active",
            visibility: "public",
            createdAt: { $gte: sevenDaysAgo },
          },
        },
        {
          $project: {
            hashtags: 1,
            category: 1,
          },
        },
        {
          $project: {
            topics: {
              $concatArrays: [
                { $ifNull: ["$hashtags", []] },
                [{ $ifNull: ["$category", "other"] }],
              ],
            },
          },
        },
        {
          $unwind: "$topics",
        },
        {
          $match: {
            topics: {
              $nin: ["", null, "other"],
            },
          },
        },
        {
          $group: {
            _id: "$topics",
            posts: { $sum: 1 },
          },
        },
        {
          $sort: {
            posts: -1,
          },
        },
        {
          $limit: 6,
        },
        {
          $project: {
            _id: 0,
            name: "$_id",
            posts: 1,
          },
        },
      ]),

      // 3. Dự án nổi bật
      Post.find({
        postType: "project",
        status: "active",
        visibility: "public",
        "project.projectName": { $exists: true, $ne: "" },
      })
        .populate("author", "fullName username avatar")
        .sort({
          likesCount: -1,
          commentsCount: -1,
          createdAt: -1,
        })
        .limit(3)
        .lean(),

      // 4. Câu hỏi cần hỗ trợ
      Post.find({
        postType: "question",
        status: "active",
        visibility: "public",
        "question.isResolved": { $ne: true },
      })
        .populate("author", "fullName username avatar")
        .sort({
          commentsCount: 1,
          createdAt: -1,
        })
        .limit(4)
        .lean(),

      // 5. Bạn học đang hoạt động
      myFriendIds.length
        ? User.find({
            _id: {
              $in: myFriendIds,
              $ne: userId,
            },
            statusOnline: "online",
            deleted: { $ne: true },
            status: "active",
          })
            .select("fullName username avatar statusOnline")
            .limit(5)
            .lean()
        : [],
    ]);

    const studyPartners = studyPartnerUsers.map((user) => ({
      _id: user._id,
      name: user.fullName,
      username: user.username,
      avatar: user.avatar,
      role: user.bio || "Người học StudyConnect",
      skills: extractSkillsFromText(user.bio || ""),
      mutualFriends: user.mutualFriends || 0,
      actionStatus: "none",
    }));

    const featuredProjects = featuredProjectPosts.map((post) => ({
      _id: post._id,
      title: post.project?.projectName || "Dự án chưa đặt tên",
      desc: post.project?.summary || post.caption || "",
      techs: post.project?.tools || [],
      progress: post.project?.progress || 0,
      status: post.project?.status || "in_progress",
      likesCount: post.likesCount || 0,
      commentsCount: post.commentsCount || 0,
      author: {
        _id: post.author?._id,
        fullName: post.author?.fullName,
        username: post.author?.username,
        avatar: post.author?.avatar,
      },
    }));

    const openQuestions = openQuestionPosts.map((post) => ({
      _id: post._id,
      title: post.question?.title || post.caption || "Câu hỏi chưa có tiêu đề",
      detail: post.question?.detail || "",
      tag: post.hashtags?.[0] || post.category || "study",
      answers: post.commentsCount || 0,
      isResolved: post.question?.isResolved || false,
      author: {
        _id: post.author?._id,
        fullName: post.author?.fullName,
        username: post.author?.username,
        avatar: post.author?.avatar,
      },
    }));

    const activeLearners = activeLearnerUsers.map((user) => ({
      _id: user._id,
      name: user.fullName,
      username: user.username,
      avatar: user.avatar,
      statusOnline: user.statusOnline,
    }));

    return res.status(200).json({
      code: 200,
      message: "Lấy dữ liệu gợi ý thành công",
      data: {
        studyPartners,
        trendingTopics,
        featuredProjects,
        openQuestions,
        activeLearners,
      },
    });
  } catch (error) {
    console.log("GET SUGGEST SUMMARY ERROR:", error);

    return res.status(500).json({
      code: 500,
      message: "Lỗi server khi lấy dữ liệu gợi ý",
      error: error.message,
    });
  }
};
