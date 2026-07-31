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
export const getReceivedRequests = async (page = 1, limit = 20) => {
    const res = await httpRequest.get(`/friends/requests/received?page=${page}&limit=${limit}`);
    return res.data;
};

// GET /api/v1/friends/following (Danh sách đang theo dõi)
export const getFollowingList = async (params = {}) => {
    const { userId, page = 1, limit = 20 } = typeof params === 'object' ? params : { page: params };
    const url = userId ? `/friends/following/${userId}` : '/friends/following';
    const res = await httpRequest.get(url, { params: { page, limit } });
    return res.data;
};

// GET /api/v1/friends/followers (Danh sách người theo dõi)
export const getFollowersList = async (params = {}) => {
    const { userId, page = 1, limit = 20 } = typeof params === 'object' ? params : { page: params };
    const url = userId ? `/friends/followers/${userId}` : '/friends/followers';
    const res = await httpRequest.get(url, { params: { page, limit } });
    return res.data;
};

// GET /api/v1/friends/suggested (Danh sách gợi ý theo dõi)
export const getSuggestedUsers = async (page = 1, limit = 20) => {
    const res = await httpRequest.get(`/friends/suggested`, { params: { page, limit } });
    return res.data;
};
