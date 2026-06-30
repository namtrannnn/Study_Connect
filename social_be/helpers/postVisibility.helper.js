function toId(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  // QUAN TRỌNG:
  // friendList item có dạng { user_id, room_chat_id, _id }
  // phải lấy user_id trước, không lấy _id của subdocument
  if (value.user_id) {
    return toId(value.user_id);
  }

  if (value.user) {
    return toId(value.user);
  }

  if (value.friend) {
    return toId(value.friend);
  }

  if (value._id) {
    return value._id.toString();
  }

  return value.toString();
}

function includesId(list = [], id) {
  const targetId = toId(id);

  if (!targetId) return false;

  return (list || []).some((item) => {
    return toId(item) === targetId;
  });
}

function isOwner(viewerId, authorId) {
  if (!viewerId || !authorId) return false;
  return toId(viewerId) === toId(authorId);
}

function isFollower(viewerId, author) {
  if (!viewerId || !author) return false;
  return includesId(author.followers || [], viewerId);
}

function isFriend(viewerId, author) {
  if (!viewerId || !author) return false;
  return includesId(author.friendList || [], viewerId);
}

function isAllowedCustomUser(viewerId, post) {
  if (!viewerId || !post) return false;
  return includesId(post.allowedUsers || [], viewerId);
}

function canViewPost(post, viewerId, author) {
  if (!post) return false;

  const authorId = post.author?._id || post.author || author?._id;

  // Chủ bài viết luôn xem được
  if (isOwner(viewerId, authorId)) {
    return true;
  }

  const visibility = post.visibility || "public";

  switch (visibility) {
    case "public":
      return true;

    case "followers":
      return isFollower(viewerId, author);

    case "friends":
      return isFriend(viewerId, author);

    case "private":
      return false;

    case "custom":
      return isAllowedCustomUser(viewerId, post);

    default:
      return false;
  }
}

module.exports = {
  canViewPost,
};
