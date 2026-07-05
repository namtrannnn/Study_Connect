const User = require("../api/v1/models/user.model");

function extractMentionUsernames(content = "") {
  const regex = /@([a-zA-Z0-9_.]+)/g;
  const usernames = new Set();

  let match;
  while ((match = regex.exec(content)) !== null) {
    usernames.add(match[1].toLowerCase());
  }

  return [...usernames];
}

async function getMentionUserIdsFromContent(content = "") {
  const usernames = extractMentionUsernames(content);

  if (!usernames.length) return [];

  const users = await User.find({
    username: { $in: usernames },
    deleted: false,
  }).select("_id username");

  return users.map((user) => user._id);
}

module.exports = {
  extractMentionUsernames,
  getMentionUserIdsFromContent,
};
