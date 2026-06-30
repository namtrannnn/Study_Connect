import httpRequest from '../config/axios';

export const getChatRooms = async () => {
    const res = await httpRequest.get('/room-chat');
    console.log('res', res.data);
    return res.data?.data || res.data || [];
};

export const getPresetThemes = async () => {
    const res = await httpRequest.get('/room-chat/themes');
    return res.data?.data || [];
};

export const getMessagesByRoom = async ({ roomId, page = 1, limit = 30 }) => {
    const res = await httpRequest.get(`/chat/${roomId}/messages`, {
        params: {
            page,
            limit,
        },
    });

    return res.data?.data || res.data;
};

export const getOrCreateFriendRoom = async (userId) => {
    const res = await httpRequest.post('/room-chat/get-or-create-friend', {
        userId,
    });

    return res.data?.data || res.data;
};

export const createGroupRoom = async ({ title, usersId }) => {
    const res = await httpRequest.post('/room-chat/create', {
        title,
        usersId,
    });

    return res.data?.data || res.data;
};

// AI giải thích 1 tin nhắn
export const explainMessageWithAI = async (messageId) => {
    const res = await httpRequest.post(`/chat/message/${messageId}/ai/explain`);

    return res.data?.data || res.data;
};

// AI tạo theme cho room
export const generateRoomThemeWithAI = async ({ roomId, prompt }) => {
    const res = await httpRequest.patch(`/chat/room/${roomId}/ai/theme`, {
        prompt,
    });

    return res.data?.data || res.data;
};
