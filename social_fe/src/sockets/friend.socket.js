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
    socket.off('SERVER_FRIEND_REQUEST_RECEIVED');
    socket.off('SERVER_FRIEND_REQUEST_CANCELLED');
    socket.off('SERVER_ACCEPT_FRIEND_SUCCESS');
    socket.off('SERVER_FRIEND_REQUEST_REFUSED');

    socket.on('SERVER_FRIEND_REQUEST_RECEIVED', (data) => {
        console.log('SERVER_FRIEND_REQUEST_RECEIVED:', data);

        toast.info(`${data?.sender?.fullName || 'Ai đó'} đã gửi lời mời kết bạn`);

        if (onRequestReceived) {
            onRequestReceived(data);
        }
    });

    socket.on('SERVER_FRIEND_REQUEST_CANCELLED', (data) => {
        console.log('SERVER_FRIEND_REQUEST_CANCELLED:', data);

        toast.info('Lời mời kết bạn đã được hủy');

        if (onRequestCancelled) {
            onRequestCancelled(data);
        }
    });

    socket.on('SERVER_ACCEPT_FRIEND_SUCCESS', (data) => {
        console.log('SERVER_ACCEPT_FRIEND_SUCCESS:', data);

        toast.success('Kết bạn thành công');

        if (onFriendAccepted) {
            onFriendAccepted(data);
        }
    });

    socket.on('SERVER_FRIEND_REQUEST_REFUSED', (data) => {
        console.log('SERVER_FRIEND_REQUEST_REFUSED:', data);

        toast.info('Lời mời kết bạn đã bị từ chối');

        if (onRequestRefused) {
            onRequestRefused(data);
        }
    });
};

export const unregisterFriendSocketEvents = () => {
    const socket = getSocket();

    if (!socket) return;

    socket.off('SERVER_FRIEND_REQUEST_RECEIVED');
    socket.off('SERVER_FRIEND_REQUEST_CANCELLED');
    socket.off('SERVER_ACCEPT_FRIEND_SUCCESS');
    socket.off('SERVER_FRIEND_REQUEST_REFUSED');
};
