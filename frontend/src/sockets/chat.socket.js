import { toast } from 'react-toastify';
import { getSocket } from '../config/socket';

export const joinChatRoom = (roomId) => {
    const socket = getSocket();

    if (!socket || !roomId) return;

    socket.emit('CLIENT_JOIN_ROOM', roomId);
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
} = {}) => {
    const socket = getSocket();

    if (!socket) {
        console.log('Socket chưa được connect');
        return;
    }

    socket.off('SERVER_RETURN_MESSAGE');
    socket.off('SERVER_TYPING_START');
    socket.off('SERVER_TYPING_STOP');
    socket.off('SERVER_CHAT_LIST_UPDATED');
    socket.off('SERVER_ROOM_UPDATED');
    socket.off('SERVER_CHAT_ERROR');
    socket.off('SERVER_ADDED_TO_ROOM');
    socket.off('SERVER_LEFT_ROOM');
    socket.off('SERVER_KICKED_FROM_ROOM');
    socket.off('SERVER_ROOM_STATE_UPDATED');
    socket.off('SERVER_ROOM_DELETED_FOR_ME');

    socket.on('SERVER_RETURN_MESSAGE', (data) => {
        if (onReceiveMessage) onReceiveMessage(data);
    });

    socket.on('SERVER_TYPING_START', (data) => {
        if (onTypingStart) onTypingStart(data);
    });

    socket.on('SERVER_TYPING_STOP', (data) => {
        if (onTypingStop) onTypingStop(data);
    });

    socket.on('SERVER_CHAT_LIST_UPDATED', (data) => {
        if (onChatListUpdated) onChatListUpdated(data);
    });

    // Đổi theme, title, avatar nhóm, thêm/kick member...
    socket.on('SERVER_ROOM_UPDATED', (data) => {
        console.log('SERVER_ROOM_UPDATED:', data);
        if (onRoomUpdated) onRoomUpdated(data);
    });

    socket.on('SERVER_CHAT_ERROR', (data) => {
        toast.error(data?.message || 'Có lỗi chat xảy ra');
        if (onChatError) onChatError(data);
    });

    socket.on('SERVER_ADDED_TO_ROOM', (data) => {
        console.log('SERVER_ADDED_TO_ROOM:', data);
        if (onAddedToRoom) onAddedToRoom(data);
    });

    socket.on('SERVER_LEFT_ROOM', (data) => {
        console.log('SERVER_LEFT_ROOM:', data);
        if (onLeftRoom) onLeftRoom(data);
    });

    socket.on('SERVER_KICKED_FROM_ROOM', (data) => {
        console.log('SERVER_KICKED_FROM_ROOM:', data);
        if (onKickedFromRoom) onKickedFromRoom(data);
    });

    socket.on('SERVER_ROOM_STATE_UPDATED', (data) => {
        console.log('SERVER_ROOM_STATE_UPDATED:', data);
        if (onRoomStateUpdated) onRoomStateUpdated(data);
    });

    socket.on('SERVER_ROOM_DELETED_FOR_ME', (data) => {
        console.log('SERVER_ROOM_DELETED_FOR_ME:', data);
        if (onRoomDeletedForMe) onRoomDeletedForMe(data);
    });
};

export const unregisterChatSocketEvents = () => {
    const socket = getSocket();
    if (!socket) return;
    socket.off('SERVER_RETURN_MESSAGE');
    socket.off('SERVER_TYPING_START');
    socket.off('SERVER_TYPING_STOP');
    socket.off('SERVER_CHAT_LIST_UPDATED');
    socket.off('SERVER_ROOM_UPDATED');
    socket.off('SERVER_CHAT_ERROR');
    socket.off('SERVER_ADDED_TO_ROOM');
    socket.off('SERVER_LEFT_ROOM');
    socket.off('SERVER_KICKED_FROM_ROOM');
    socket.off('SERVER_ROOM_STATE_UPDATED');
    socket.off('SERVER_ROOM_DELETED_FOR_ME');
};
