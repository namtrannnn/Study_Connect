import { toast } from 'react-toastify';
import { getSocket } from '../config/socket';

export const joinChatRoom = (roomId) => {
    const socket = getSocket();

    if (!socket || !roomId) return;

    socket.emit('CLIENT_JOIN_ROOM', roomId);
};

export const leaveChatRoom = (roomId) => {
    const socket = getSocket();

    if (!socket || !roomId) return;

    socket.emit('CLIENT_LEAVE_ROOM', roomId);
};

export const sendChatMessage = ({ roomChatId, content, images = [] }) => {
    const socket = getSocket();

    if (!socket) {
        toast.error('Socket chưa kết nối');
        return;
    }

    socket.emit('CLIENT_SEND_MESSAGE', {
        roomChatId,
        content,
        images,
    });
};

export const startTyping = (roomChatId) => {
    const socket = getSocket();

    if (!socket || !roomChatId) return;

    socket.emit('CLIENT_TYPING_START', {
        room_chat_id: roomChatId,
    });
};

export const stopTyping = (roomChatId) => {
    const socket = getSocket();

    if (!socket || !roomChatId) return;

    socket.emit('CLIENT_TYPING_STOP', {
        room_chat_id: roomChatId,
    });
};

let activeListeners = {};

export const registerChatSocketEvents = ({
    onReceiveMessage,
    onTypingStart,
    onTypingStop,
    onChatListUpdated,
    onRoomUpdated,
    onChatError,
    onAddedToRoom,
    onLeftRoom,
    onKickedFromRoom,
    onRoomStateUpdated,
    onRoomDeletedForMe,
    onMessageRevoked,
} = {}) => {
    const socket = getSocket();

    if (!socket) {
        console.log('Socket chưa được connect');
        return;
    }

    unregisterChatSocketEvents();

    activeListeners = {
        SERVER_RETURN_MESSAGE: (data) => onReceiveMessage?.(data),
        SERVER_TYPING_START: (data) => onTypingStart?.(data),
        SERVER_TYPING_STOP: (data) => onTypingStop?.(data),
        SERVER_CHAT_LIST_UPDATED: (data) => onChatListUpdated?.(data),
        SERVER_ROOM_UPDATED: (data) => onRoomUpdated?.(data),
        SERVER_CHAT_ERROR: (data) => {
            toast.error(data?.message || 'Có lỗi chat xảy ra');
            onChatError?.(data);
        },
        SERVER_ADDED_TO_ROOM: (data) => onAddedToRoom?.(data),
        SERVER_LEFT_ROOM: (data) => onLeftRoom?.(data),
        SERVER_KICKED_FROM_ROOM: (data) => onKickedFromRoom?.(data),
        SERVER_ROOM_STATE_UPDATED: (data) => onRoomStateUpdated?.(data),
        SERVER_ROOM_DELETED_FOR_ME: (data) => onRoomDeletedForMe?.(data),
        SERVER_MESSAGE_REVOKED: (data) => onMessageRevoked?.(data),
    };

    Object.entries(activeListeners).forEach(([event, handler]) => {
        socket.on(event, handler);
    });
};

export const unregisterChatSocketEvents = () => {
    const socket = getSocket();
    if (!socket) return;

    Object.entries(activeListeners).forEach(([event, handler]) => {
        socket.off(event, handler);
    });
    activeListeners = {};
};
