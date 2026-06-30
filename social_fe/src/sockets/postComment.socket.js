import { getSocket } from '../config/socket';

export const joinPostCommentRoom = (postId) => {
    const socket = getSocket();

    if (!socket || !socket.connected || !postId) return;

    socket.emit('CLIENT_JOIN_POST_COMMENT', postId);
    console.log('FE emit CLIENT_JOIN_POST_COMMENT:', postId);
};

export const leavePostCommentRoom = (postId) => {
    const socket = getSocket();

    if (!socket || !socket.connected || !postId) return;

    socket.emit('CLIENT_LEAVE_POST_COMMENT', postId);
    console.log('FE emit CLIENT_LEAVE_POST_COMMENT:', postId);
};

export const registerPostCommentSocketEvents = ({
    onNewComment,
    onUpdateComment,
    onPendingDeleteComment,
    onUndoDeleteComment,
} = {}) => {
    const socket = getSocket();

    if (!socket || !socket.connected) {
        console.log('Socket chưa connect để register comment events');
        return;
    }

    socket.off('SERVER_RETURN_NEW_COMMENT');
    socket.off('SERVER_RETURN_UPDATE_COMMENT');
    socket.off('SERVER_RETURN_PENDING_DELETE_COMMENT');
    socket.off('SERVER_RETURN_UNDO_DELETE_COMMENT');

    socket.on('SERVER_RETURN_NEW_COMMENT', (data) => {
        console.log('SERVER_RETURN_NEW_COMMENT:', data);
        onNewComment?.(data);
    });

    socket.on('SERVER_RETURN_UPDATE_COMMENT', (data) => {
        console.log('SERVER_RETURN_UPDATE_COMMENT:', data);
        onUpdateComment?.(data);
    });

    socket.on('SERVER_RETURN_PENDING_DELETE_COMMENT', (data) => {
        console.log('SERVER_RETURN_PENDING_DELETE_COMMENT:', data);
        onPendingDeleteComment?.(data);
    });

    socket.on('SERVER_RETURN_UNDO_DELETE_COMMENT', (data) => {
        console.log('SERVER_RETURN_UNDO_DELETE_COMMENT:', data);
        onUndoDeleteComment?.(data);
    });
};

export const unregisterPostCommentSocketEvents = () => {
    const socket = getSocket();

    if (!socket) return;

    socket.off('SERVER_RETURN_NEW_COMMENT');
    socket.off('SERVER_RETURN_UPDATE_COMMENT');
    socket.off('SERVER_RETURN_PENDING_DELETE_COMMENT');
    socket.off('SERVER_RETURN_UNDO_DELETE_COMMENT');
};
