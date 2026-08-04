const mongoose = require("mongoose");

const User = require("../models/user.model");
const Post = require("../models/post.model");
const { redisClient } = require("../../../config/redis");

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

// TTL constants (seconds)
const TTL_HOT_POSTS = 15 * 60;       // 15 phút
const TTL_TRENDING = 30 * 60;        // 30 phút
const TTL_QUIZ = 30 * 60;            // 30 phút

const emptySuggestData = () => ({
  peopleToFollow: [],
  trendingHashtags: [],
  hotPosts: [],
  suggestedQuiz: [],
  activeLearners: [],
});

// Helper: get from Redis cache, fallback to queryFn, then cache result
async function withCache(key, ttl, queryFn) {
  try {
    const cached = await redisClient.get(key);
    if (cached) return JSON.parse(cached);
  } catch (_) {
    // Redis lỗi thì bỏ qua, fallback query MongoDB
  }

  const result = await queryFn();

  try {
    await redisClient.setEx(key, ttl, JSON.stringify(result));
  } catch (_) {
    // Không cache được thì vẫn trả kết quả
  }

  return result;
}

module.exports.getSuggestSummary = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const currentUser = await User.findById(userId)
      .select("following pendingFollowRequests")
      .lean();

    if (!currentUser) {
      return res.status(404).json({
        code: 404,
        message: "Không tìm thấy người dùng",
        data: emptySuggestData(),
      });
    }

    const followingIds = (currentUser.following || []).filter(Boolean);
    const pendingIds = (currentUser.pendingFollowRequests || []).filter(Boolean);

    const excludedIds = [userId, ...followingIds, ...pendingIds]
      .filter(Boolean)
      .map((id) => toObjectId(id));

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    // Chạy song song: cached queries + per-user queries
    const [hotPosts, trendingHashtags, suggestedQuiz, peopleToFollowRaw, activeLearnerUsers] =
      await Promise.all([
        // 1. Hot posts - cached
        withCache("suggest:hotPosts", TTL_HOT_POSTS, () =>
          Post.aggregate([
            {
              $match: {
                status: "active",
                visibility: "public",
                createdAt: { $gte: threeDaysAgo },
              },
            },
            {
              $addFields: {
                score: {
                  $add: [
                    "$likesCount",
                    { $multiply: ["$commentsCount", 2] },
                    { $multiply: ["$savesCount", 1.5] },
                  ],
                },
              },
            },
            { $sort: { score: -1, createdAt: -1 } },
            { $limit: 5 },
            {
              $lookup: {
                from: "users",
                localField: "author",
                foreignField: "_id",
                as: "authorData",
                pipeline: [
                  { $project: { fullName: 1, username: 1, avatar: 1 } },
                ],
              },
            },
            { $unwind: { path: "$authorData", preserveNullAndEmpty: true } },
            {
              $project: {
                caption: 1,
                hashtags: 1,
                likesCount: 1,
                commentsCount: 1,
                savesCount: 1,
                postType: 1,
                media: { $slice: ["$media", 1] },
                score: 1,
                createdAt: 1,
                author: {
                  _id: "$authorData._id",
                  fullName: "$authorData.fullName",
                  username: "$authorData.username",
                  avatar: "$authorData.avatar",
                },
              },
            },
          ])
        ),

        // 2. Trending hashtags - cached
        withCache("suggest:trendingHashtags", TTL_TRENDING, () =>
          Post.aggregate([
            {
              $match: {
                status: "active",
                visibility: "public",
                createdAt: { $gte: sevenDaysAgo },
                hashtags: { $exists: true, $ne: [] },
              },
            },
            { $project: { hashtags: 1 } },
            { $unwind: "$hashtags" },
            {
              $match: {
                hashtags: { $nin: ["", null] },
              },
            },
            {
              $group: {
                _id: { $toLower: "$hashtags" },
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 8 },
            {
              $project: {
                _id: 0,
                name: "$_id",
                count: 1,
              },
            },
          ])
        ),

        // 3. Suggested quiz - cached
        withCache("suggest:suggestedQuiz", TTL_QUIZ, () =>
          Post.aggregate([
            {
              $match: {
                postType: "quiz",
                status: "active",
                visibility: "public",
              },
            },
            {
              $addFields: {
                totalAnswers: {
                  $size: { $ifNull: ["$quiz.answers", []] },
                },
              },
            },
            {
              $sort: { totalAnswers: -1, likesCount: -1, createdAt: -1 },
            },
            { $limit: 4 },
            {
              $lookup: {
                from: "users",
                localField: "author",
                foreignField: "_id",
                as: "authorData",
                pipeline: [
                  { $project: { fullName: 1, username: 1, avatar: 1 } },
                ],
              },
            },
            { $unwind: { path: "$authorData", preserveNullAndEmpty: true } },
            {
              $project: {
                caption: 1,
                quiz: 1,
                likesCount: 1,
                commentsCount: 1,
                totalAnswers: 1,
                createdAt: 1,
                author: {
                  _id: "$authorData._id",
                  fullName: "$authorData.fullName",
                  username: "$authorData.username",
                  avatar: "$authorData.avatar",
                },
              },
            },
          ])
        ),

        // 4. People to follow - per-user, không cache
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
              mutualCount: {
                $size: {
                  $setIntersection: [
                    { $ifNull: ["$followers", []] },
                    followingIds.map((id) => toObjectId(id)),
                  ],
                },
              },
              hasAvatar: {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$avatar", null] },
                      { $ne: ["$avatar", ""] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
          {
            $sort: {
              mutualCount: -1,
              hasAvatar: -1,
              followersCount: -1,
            },
          },
          { $limit: 5 },
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
              followersCount: 1,
              mutualCount: 1,
              isPrivate: 1,
            },
          },
        ]),

        // 5. Active learners - per-user, không cache
        followingIds.length
          ? User.find({
              _id: { $in: followingIds.map((id) => toObjectId(id)), $ne: toObjectId(userId) },
              statusOnline: "online",
              deleted: { $ne: true },
              status: "active",
            })
              .select("fullName username avatar statusOnline")
              .limit(6)
              .lean()
          : [],
      ]);

    // Map response
    const mappedPeopleToFollow = peopleToFollowRaw.map((u) => ({
      _id: u._id,
      fullName: u.fullName,
      username: u.username,
      avatar: u.avatar,
      followersCount: u.followersCount || 0,
      mutualCount: u.mutualCount || 0,
      isPrivate: u.isPrivate || false,
    }));

    const mappedHotPosts = hotPosts.map((p) => ({
      _id: p._id,
      caption: p.caption || "",
      hashtags: p.hashtags || [],
      likesCount: p.likesCount || 0,
      commentsCount: p.commentsCount || 0,
      savesCount: p.savesCount || 0,
      postType: p.postType || "normal",
      thumbnail: p.media?.[0]?.url || null,
      score: p.score || 0,
      createdAt: p.createdAt,
      author: p.author || null,
    }));

    const mappedQuiz = suggestedQuiz.map((p) => ({
      _id: p._id,
      caption: p.caption || "",
      optionsCount: p.quiz?.options?.length || 0,
      totalAnswers: p.totalAnswers || 0,
      likesCount: p.likesCount || 0,
      createdAt: p.createdAt,
      author: p.author || null,
    }));

    const mappedActiveLearners = activeLearnerUsers.map((u) => ({
      _id: u._id,
      fullName: u.fullName,
      username: u.username,
      avatar: u.avatar,
      statusOnline: u.statusOnline,
    }));

    return res.status(200).json({
      code: 200,
      message: "Lấy dữ liệu gợi ý thành công",
      data: {
        peopleToFollow: mappedPeopleToFollow,
        trendingHashtags,
        hotPosts: mappedHotPosts,
        suggestedQuiz: mappedQuiz,
        activeLearners: mappedActiveLearners,
      },
    });
  } catch (error) {
    console.error("GET SUGGEST SUMMARY ERROR:", error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server khi lấy dữ liệu gợi ý",
      error: error.message,
    });
  }
};
