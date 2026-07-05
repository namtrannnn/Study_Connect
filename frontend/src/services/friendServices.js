import httpRequest from '../config/axios';

// [POST] /friends/request/:userId
export const sendFriendRequest = async (userId) => {
    const res = await httpRequest.post(`/friends/request/${userId}`);
    return res.data;
};

// [DELETE] /friends/request/:userId
export const cancelFriendRequest = async (userId) => {
    const res = await httpRequest.delete(`/friends/request/${userId}`);
    return res.data;
};

// [POST] /friends/accept/:userId
export const acceptFriendRequest = async (userId) => {
    const res = await httpRequest.post(`/friends/accept/${userId}`);
    return res.data;
};

// [DELETE] /friends/refuse/:userId
export const refuseFriendRequest = async (userId) => {
    const res = await httpRequest.delete(`/friends/refuse/${userId}`);
    return res.data;
};

// [GET] /friends/status/:userId
export const getRelationStatus = async (userId) => {
    const res = await httpRequest.get(`/friends/status/${userId}`);
    return res.data;
};

// [GET] /friends/list
export const getMyFriends = async () => {
    const res = await httpRequest.get('/friends/list');
    return res.data;
};

// [GET] /friends/list/:userId
export const getUserFriends = async (userId) => {
    const res = await httpRequest.get(`/friends/list/${userId}`);
    return res.data;
};

// [GET] /friends/requests/received
export const getReceivedFriendRequests = async () => {
    const res = await httpRequest.get('/friends/requests/received');
    return res.data;
};
