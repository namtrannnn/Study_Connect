import httpRequest from '../config/axios';

export const getListFriendChat = async (query) => {
    try {
        const res = await httpRequest.get('/chat');
        return res.data;
    } catch (error) {}
};

export const createRoomChatGroup = async (data) => {
    try {
        const res = await httpRequest.post('/room-chat/create', data);
        return res.data;
    } catch (error) {}
};

export const getOrCreateRoomChatFriend = async (userId) => {
    const res = await httpRequest.post('/room-chat/get-or-create-friend', { userId });
    return res.data; // { _id, members, ... }
};
