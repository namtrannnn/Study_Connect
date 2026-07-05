import { getSocket } from '../config/socket';
import { setOnlineUsers, addOnlineUser, removeOnlineUser, clearOnlineUsers } from '../redux/slices/presenceSlice';

export const registerPresenceSocketEvents = (dispatch) => {
    const socket = getSocket();

    if (!socket) {
        console.log('Socket chưa được connect');
        return;
    }

    socket.off('SERVER_ONLINE_READY');
    socket.off('SERVER_USER_ONLINE');
    socket.off('SERVER_USER_OFFLINE');

    socket.on('SERVER_ONLINE_READY', ({ onlineUsers = [] }) => {
        console.log('SERVER_ONLINE_READY:', onlineUsers);

        dispatch(setOnlineUsers(onlineUsers));
    });

    socket.on('SERVER_USER_ONLINE', ({ userId }) => {
        console.log('SERVER_USER_ONLINE:', userId);

        dispatch(addOnlineUser(userId));
    });

    socket.on('SERVER_USER_OFFLINE', ({ userId }) => {
        console.log('SERVER_USER_OFFLINE:', userId);

        dispatch(removeOnlineUser(userId));
    });
};

export const unregisterPresenceSocketEvents = () => {
    const socket = getSocket();

    if (!socket) return;

    socket.off('SERVER_ONLINE_READY');
    socket.off('SERVER_USER_ONLINE');
    socket.off('SERVER_USER_OFFLINE');
};

export const resetPresenceState = (dispatch) => {
    dispatch(clearOnlineUsers());
};
