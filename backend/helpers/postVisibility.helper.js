function toId(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  // Nếu item là object có user hoặc user_id, lấy giá trị đó
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
  const vId = toId(viewerId);
  const isFollower = includesId(author.followers || [], vId);
  const isFollowing = includesId(author.following || [], vId);
  return isFollower && isFollowing;
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
