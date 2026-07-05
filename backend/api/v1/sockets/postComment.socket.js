module.exports = (socket) => {
  // User mở PostDetailModal / mở danh sách comment của bài viết
  socket.on("CLIENT_JOIN_POST_COMMENT", (postId) => {
    if (!postId) return;

    const roomName = `post:${postId}`;

    socket.join(roomName);

    console.log(`Socket ${socket.id} joined ${roomName}`);
  });

  // User đóng PostDetailModal / rời khỏi phần comment
  socket.on("CLIENT_LEAVE_POST_COMMENT", (postId) => {
    if (!postId) return;

    const roomName = `post:${postId}`;

    socket.leave(roomName);

    console.log(`Socket ${socket.id} left ${roomName}`);
  });
};
