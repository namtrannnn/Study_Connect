const User = require("./user.route");
const SliderMenu = require("./sliderMenu.routes");
const Account = require("./account.routes");
const Search = require("./search.route");

// [STORY]
const Story = require("./story.routes");

// [POST]
const Post = require("./post.routes");
const PostLike = require("./postLike.routes");
const PostComment = require("./postComment.routes");
const PostSave = require("./postSave.routes");

const Chat = require("./chat.routes");
const RoomChat = require("./roomChat.routes");
const StudyRoom = require("./studyRoom.routes");

// [PROFILE]
const Profile = require("./profile.route");

// [NOTIFICATION]
const notificationRoute = require("./notification.route");
const friendRoute = require("./friend.route");

// [SUGGEST]
const suggestRoute = require("./suggest.route");

module.exports = (app) => {
  const version = "/api/v1";
  app.use(version + "/user", User);
  app.use(version + "/search", Search);
  // app.use(version + "/slider-menu", SliderMenu);
  // app.use(version + "/account", Account);
  // app.use(version + "/story", Story);
  app.use(version + "/post", Post);
  app.use(version + "/post", PostLike);
  app.use(version + "/post/comment", PostComment);
  app.use(version + "/post/save", PostSave);
  app.use(version + "/room-chat", RoomChat);
  // app.use(version + "/study-room", StudyRoom);
  app.use(version + "/chat", Chat);
  app.use(version + "/profile", Profile);
  app.use(version + "/notifications", notificationRoute);
  app.use(version + "/friends", friendRoute);
  app.use(version + "/suggest", suggestRoute);
};
