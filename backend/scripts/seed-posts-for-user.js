require("dotenv").config();
const mongoose = require("mongoose");

// Nếu path model của bạn khác thì sửa lại 4 dòng require này
const User = require("../api/v1/models/user.model");
const Post = require("../api/v1/models/post.model");
const Comment = require("../api/v1/models/postComment.model");
const PostLike = require("../api/v1/models/postLike.model");
const CommentLike = require("../api/v1/models/commentLike.model");

// ===============================
// CONFIG - BẠN CHỈ CẦN SỬA Ở ĐÂY
// ===============================

// Cách 1: dùng _id của user
const TARGET_USER_ID = "6a0d50896736fe81bbb5b5f1";

// Cách 2: dùng tokenUser nếu không muốn dùng _id
// Nếu TARGET_USER_ID có giá trị thì script ưu tiên dùng TARGET_USER_ID
const TARGET_TOKEN_USER = "";

// Mỗi user tạo bao nhiêu bài
const POSTS_PER_USER = 10;

// true = xóa bài fake cũ của user này trước khi tạo lại
// false = giữ bài cũ, tạo thêm 10 bài mới
const DELETE_OLD_SEED_POSTS = true;

// Số like/comment giả mỗi bài
const MIN_LIKES_PER_POST = 1;
const MAX_LIKES_PER_POST = 8;

const MIN_COMMENTS_PER_POST = 1;
const MAX_COMMENTS_PER_POST = 5;

// Dấu hiệu nhận biết dữ liệu fake do script tạo
const SEED_MARK = "";

// ===============================
// DATA FAKE
// ===============================

const captions = [
  "Hôm nay trời đẹp quá, lên một bài cho vui 😄 #daily #life",
  "Một ngày làm việc khá năng suất với nhiều ý tưởng mới #work #coding",
  "Đi cafe nhẹ rồi tiếp tục code Flutter nào ☕ #coffee #flutter",
  "Góc nhỏ hôm nay nhìn chill thật sự #chill #photo",
  "Đang test giao diện feed social app, nhìn cũng ổn áp rồi đó #socialapp #ui",
  "Cuối tuần nhẹ nhàng, nghỉ một chút rồi làm tiếp #weekend #relax",
  "Một vài khoảnh khắc trong ngày #moment #daily",
  "Tập trung hoàn thiện tính năng post, comment, like #developer #nodejs",
  "Ảnh test cho profile grid, xem layout có đều không #profile #grid",
  "Bài viết fake để test scroll, pagination và UI Flutter #testdata #flutter",
];

const locations = [
  "Ho Chi Minh City",
  "Da Nang",
  "Ha Noi",
  "Can Tho",
  "Thu Duc",
  "Da Lat",
  "",
  "",
];

const fakeImages = [
  {
    url: "https://res.cloudinary.com/dn2u3dcrh/image/upload/v1778744158/posts/sample_post_1.jpg",
    public_id: `${SEED_MARK}/sample_post_1`,
    width: 1080,
    height: 1350,
  },
  {
    url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1080&q=80",
    public_id: `${SEED_MARK}/unsplash_1`,
    width: 1080,
    height: 720,
  },
  {
    url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1080&q=80",
    public_id: `${SEED_MARK}/unsplash_2`,
    width: 1080,
    height: 720,
  },
  {
    url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1080&q=80",
    public_id: `${SEED_MARK}/unsplash_3`,
    width: 1080,
    height: 720,
  },
  {
    url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1080&q=80",
    public_id: `${SEED_MARK}/unsplash_4`,
    width: 1080,
    height: 720,
  },
  {
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080&q=80",
    public_id: `${SEED_MARK}/unsplash_5`,
    width: 1080,
    height: 720,
  },
];

const commentContents = [
  "Bài này nhìn ổn áp đó 😄",
  "Ảnh đẹp nha!",
  "Test UI như này là hợp lý rồi.",
  "Caption này nhìn thật hơn nhiều.",
  "Quá ok luôn bạn ơi.",
  "Nhìn giống app thật rồi á.",
  "Phần này dùng để test comment đúng không?",
  "Giao diện feed chắc sẽ đẹp hơn nhiều.",
];

const replyContents = [
  "Đúng rồi nha 😄",
  "Mình cũng thấy vậy.",
  "Chuẩn luôn.",
  "Ok bạn.",
];

// ===============================
// HELPER FUNCTIONS
// ===============================

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function extractHashtags(caption = "") {
  const matches = caption.match(/#[\p{L}\p{N}_]+/gu) || [];
  return matches.map((tag) => tag.replace("#", "").toLowerCase());
}

function buildMedia(index) {
  const img = fakeImages[index % fakeImages.length];

  return [
    {
      url: img.url,
      public_id: `${img.public_id}_${Date.now()}_${index}`,
      type: "image",
      thumbnail: "",
      width: img.width,
      height: img.height,
    },
  ];
}

function buildVisibility(index, otherUsers) {
  const modes = [
    "public",
    "public",
    "public",
    "followers",
    "friends",
    "custom",
  ];
  const visibility = modes[index % modes.length];

  if (visibility !== "custom") {
    return {
      visibility,
      allowedUsers: [],
    };
  }

  const allowedUsers = shuffleArray(otherUsers)
    .slice(0, 3)
    .map((user) => user._id);

  return {
    visibility,
    allowedUsers,
  };
}

async function findTargetUser() {
  if (TARGET_USER_ID && TARGET_USER_ID !== "THAY_ID_USER_VAO_DAY") {
    if (!mongoose.Types.ObjectId.isValid(TARGET_USER_ID)) {
      throw new Error("TARGET_USER_ID không hợp lệ.");
    }

    return User.findOne({
      _id: TARGET_USER_ID,
      deleted: false,
      status: "active",
    });
  }

  if (TARGET_TOKEN_USER) {
    return User.findOne({
      tokenUser: TARGET_TOKEN_USER,
      deleted: false,
      status: "active",
    });
  }

  throw new Error("Bạn chưa nhập TARGET_USER_ID hoặc TARGET_TOKEN_USER.");
}

async function deleteOldSeedData(targetUserId) {
  const oldPosts = await Post.find({
    author: targetUserId,
    $or: [
      { caption: { $regex: SEED_MARK, $options: "i" } },
      { "media.public_id": { $regex: SEED_MARK, $options: "i" } },
    ],
  }).select("_id");

  const oldPostIds = oldPosts.map((post) => post._id);

  if (oldPostIds.length === 0) {
    console.log("Không có dữ liệu fake cũ để xóa.");
    return;
  }

  const oldComments = await Comment.find({
    post: { $in: oldPostIds },
  }).select("_id");

  const oldCommentIds = oldComments.map((comment) => comment._id);

  await CommentLike.deleteMany({
    comment: { $in: oldCommentIds },
  });

  await Comment.deleteMany({
    post: { $in: oldPostIds },
  });

  await PostLike.deleteMany({
    post: { $in: oldPostIds },
  });

  await Post.deleteMany({
    _id: { $in: oldPostIds },
  });

  console.log(`Đã xóa ${oldPostIds.length} bài fake cũ.`);
}

async function updateCounters(targetUserId, postIds) {
  for (const postId of postIds) {
    const likesCount = await PostLike.countDocuments({ post: postId });

    const commentsCount = await Comment.countDocuments({
      post: postId,
      status: "active",
    });

    await Post.updateOne(
      { _id: postId },
      {
        $set: {
          likesCount,
          commentsCount,
        },
      },
    );
  }

  const postsCount = await Post.countDocuments({
    author: targetUserId,
    status: "active",
  });

  await User.updateOne(
    { _id: targetUserId },
    {
      $set: {
        postsCount,
      },
    },
  );
}

// ===============================
// MAIN SEED
// ===============================

async function seedPostsForUser() {
  try {
    if (!process.env.MONGO_URL) {
      throw new Error("Thiếu MONGO_URL trong file .env");
    }

    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connect success to mongoDB!");

    const targetUser = await findTargetUser();

    if (!targetUser) {
      throw new Error(
        "Không tìm thấy user cần seed. Kiểm tra lại _id/tokenUser.",
      );
    }

    console.log("User được seed:");
    console.log({
      id: targetUser._id.toString(),
      fullName: targetUser.fullName,
      username: targetUser.username,
    });

    const allUsers = await User.find({
      deleted: false,
      status: "active",
    }).select("_id fullName username avatar");

    if (allUsers.length < 2) {
      console.log(
        "Cảnh báo: DB chỉ có ít hơn 2 user, like/comment fake sẽ hơi ít.",
      );
    }

    const otherUsers = allUsers.filter(
      (user) => user._id.toString() !== targetUser._id.toString(),
    );

    if (DELETE_OLD_SEED_POSTS) {
      await deleteOldSeedData(targetUser._id);
    }

    const createdPostIds = [];

    for (let i = 0; i < POSTS_PER_USER; i++) {
      const captionBase = captions[i % captions.length];
      const caption = `${captionBase}\n\n${SEED_MARK}`;

      const { visibility, allowedUsers } = buildVisibility(i, otherUsers);

      const createdAt = new Date();
      createdAt.setMinutes(createdAt.getMinutes() - i * 25);

      const post = await Post.create({
        author: targetUser._id,
        caption,
        media: buildMedia(i),
        location: randomItem(locations),
        hashtags: extractHashtags(caption),
        mentions: [],
        likesCount: 0,
        commentsCount: 0,
        savesCount: randomInt(0, 5),
        sharesCount: randomInt(0, 3),
        allowComments: i % 7 === 0 ? false : true,
        hideLikeCount: i % 6 === 0 ? true : false,
        hideShare: i % 5 === 0 ? true : false,
        status: "active",
        visibility,
        allowedUsers,
        isEdited: false,
        editedAt: null,
        createdAt,
        updatedAt: createdAt,
      });

      createdPostIds.push(post._id);

      // Fake like
      const likeUsers = shuffleArray(allUsers).slice(
        0,
        randomInt(
          MIN_LIKES_PER_POST,
          Math.min(MAX_LIKES_PER_POST, allUsers.length),
        ),
      );

      const likeDocs = likeUsers.map((user) => ({
        post: post._id,
        user: user._id,
      }));

      if (likeDocs.length > 0) {
        try {
          await PostLike.insertMany(likeDocs, { ordered: false });
        } catch (err) {
          // Bỏ qua lỗi trùng unique index nếu có
        }
      }

      // Nếu bài tắt bình luận thì không seed comment
      if (!post.allowComments) {
        console.log(
          `Tạo post ${i + 1}/${POSTS_PER_USER}: ${post._id} - comments disabled`,
        );
        continue;
      }

      // Fake comment cha
      const commentCount = randomInt(
        MIN_COMMENTS_PER_POST,
        MAX_COMMENTS_PER_POST,
      );
      const commentUsers = shuffleArray(allUsers).slice(0, commentCount);

      for (const commentUser of commentUsers) {
        const rootComment = await Comment.create({
          post: post._id,
          user: commentUser._id,
          content: randomItem(commentContents),
          parentComment: null,
          replyToComment: null,
          replyToUser: null,
          mentions: [],
          likesCount: 0,
          status: "active",
          isEdited: false,
          editedAt: null,
          editHistory: [],
          pendingDeleteAt: null,
          canUndoUntil: null,
          repliesCount: 0,
          isPinned: false,
          pinnedAt: null,
        });

        // Một số comment có reply
        if (Math.random() > 0.55 && otherUsers.length > 0) {
          const replyUser = randomItem(allUsers);

          await Comment.create({
            post: post._id,
            user: replyUser._id,
            content: randomItem(replyContents),
            parentComment: rootComment._id,
            replyToComment: rootComment._id,
            replyToUser: commentUser._id,
            mentions: [],
            likesCount: 0,
            status: "active",
            isEdited: false,
            editedAt: null,
            editHistory: [],
            pendingDeleteAt: null,
            canUndoUntil: null,
            repliesCount: 0,
            isPinned: false,
            pinnedAt: null,
          });

          await Comment.updateOne(
            { _id: rootComment._id },
            { $inc: { repliesCount: 1 } },
          );
        }
      }

      console.log(`Tạo post ${i + 1}/${POSTS_PER_USER}: ${post._id}`);
    }

    await updateCounters(targetUser._id, createdPostIds);

    console.log("Seed xong!");
    console.log({
      userId: targetUser._id.toString(),
      postsCreated: createdPostIds.length,
      deleteOldSeedPosts: DELETE_OLD_SEED_POSTS,
    });
  } catch (error) {
    console.error("Seed error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected mongoDB.");
  }
}

seedPostsForUser();
