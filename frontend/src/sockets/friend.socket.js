import { toast } from 'react-toastify';
import { getSocket } from '../config/socket';

export const registerFriendSocketEvents = ({
    onRequestReceived,
    onRequestCancelled,
    onFriendAccepted,
    onRequestRefused,
} = {}) => {
    const socket = getSocket();

    if (!socket) {
        console.log('Socket chưa được connect');
        return;
    }

    // Xóa listener cũ trước khi đăng ký listener mới
    socket.off('SERVER_FOLLOW_REQUEST_RECEIVED');
    socket.off('SERVER_FOLLOW_SUCCESS');
    socket.off('SERVER_UNFOLLOW_SUCCESS');
    socket.off('SERVER_ACCEPT_FOLLOW_SUCCESS');
    socket.off('SERVER_FRIEND_REQUEST_RECEIVED');
    socket.off('SERVER_ACCEPT_FRIEND_SUCCESS');

    socket.on('SERVER_FOLLOW_REQUEST_RECEIVED', (data) => {
        console.log('SERVER_FOLLOW_REQUEST_RECEIVED:', data);
        toast.info(`${data?.sender?.fullName || 'Ai đó'} đã gửi yêu cầu theo dõi bạn`);
        if (onRequestReceived) onRequestReceived(data);
    });

    socket.on('SERVER_FOLLOW_SUCCESS', (data) => {
        console.log('SERVER_FOLLOW_SUCCESS:', data);
        toast.info(`${data?.sender?.fullName || 'Ai đó'} đã bắt đầu theo dõi bạn`);
        if (onFriendAccepted) onFriendAccepted(data);
    });

    socket.on('SERVER_UNFOLLOW_SUCCESS', (data) => {
        console.log('SERVER_UNFOLLOW_SUCCESS:', data);
        if (onRequestCancelled) onRequestCancelled(data);
    });

    socket.on('SERVER_ACCEPT_FOLLOW_SUCCESS', (data) => {
        console.log('SERVER_ACCEPT_FOLLOW_SUCCESS:', data);
        toast.success('Yêu cầu theo dõi đã được chấp nhận!');
        if (onFriendAccepted) onFriendAccepted(data);
    });

    socket.on('SERVER_FRIEND_REQUEST_RECEIVED', (data) => {
        if (onRequestReceived) onRequestReceived(data);
    });
};

export const unregisterFriendSocketEvents = () => {
    const socket = getSocket();
    if (!socket) return;

    socket.off('SERVER_FOLLOW_REQUEST_RECEIVED');
    socket.off('SERVER_FOLLOW_SUCCESS');
    socket.off('SERVER_UNFOLLOW_SUCCESS');
    socket.off('SERVER_ACCEPT_FOLLOW_SUCCESS');
    socket.off('SERVER_FRIEND_REQUEST_RECEIVED');
    socket.off('SERVER_ACCEPT_FRIEND_SUCCESS');
};
