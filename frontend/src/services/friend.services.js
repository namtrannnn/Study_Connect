import httpRequest from '../config/axios';

// POST /api/v1/friends/request/:userId (Follow / Gửi yêu cầu follow)
export const sendFriendRequest = async (userId) => {
    const res = await httpRequest.post(`/friends/request/${userId}`);
    return res.data;
};
export const followUser = sendFriendRequest;

// DELETE /api/v1/friends/request/:userId (Bỏ follow / Hủy yêu cầu)
export const cancelFriendRequest = async (userId) => {
    const res = await httpRequest.delete(`/friends/request/${userId}`);
    return res.data;
};
export const unfollowUser = cancelFriendRequest;

// POST /api/v1/friends/accept/:userId (Chấp nhận yêu cầu follow tài khoản private)
export const acceptFriendRequest = async (userId) => {
    const res = await httpRequest.post(`/friends/accept/${userId}`);
    return res.data;
};
export const acceptFollowRequest = acceptFriendRequest;

// DELETE /api/v1/friends/refuse/:userId (Từ chối yêu cầu follow)
export const refuseFriendRequest = async (userId) => {
    const res = await httpRequest.delete(`/friends/refuse/${userId}`);
    return res.data;
};
export const refuseFollowRequest = refuseFriendRequest;

// GET /api/v1/friends/list/:userId (Lấy danh sách bạn bè / mutual follow)
export const getFriendList = async (userId) => {
    const url = userId ? `/friends/list/${userId}` : '/friends/list';
    const res = await httpRequest.get(url);
    return res.data;
};
export const getMutualFollowers = getFriendList;

// GET /api/v1/friends/requests/received (Danh sách yêu cầu follow chờ duyệt)
export const getReceivedRequests = async () => {
    const res = await httpRequest.get('/friends/requests/received');
    return res.data;
};
