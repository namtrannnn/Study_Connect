import httpRequest from '../config/axios';

// POST /api/v1/friends/request/:userId
export const sendFriendRequest = async (userId) => {
    const res = await httpRequest.post(`/friends/request/${userId}`);
    return res.data;
};

// DELETE /api/v1/friends/request/:userId
export const cancelFriendRequest = async (userId) => {
    const res = await httpRequest.delete(`/friends/request/${userId}`);
    return res.data;
};

// POST /api/v1/friends/accept/:userId
export const acceptFriendRequest = async (userId) => {
    const res = await httpRequest.post(`/friends/accept/${userId}`);
    return res.data;
};

// DELETE /api/v1/friends/refuse/:userId
export const refuseFriendRequest = async (userId) => {
    const res = await httpRequest.delete(`/friends/refuse/${userId}`);
    return res.data;
};

// GET /api/v1/friends/list/:userId
export const getFriendList = async (userId) => {
    const url = userId ? `/friends/list/${userId}` : '/friends/list';
    const res = await httpRequest.get(url);
    return res.data;
};
