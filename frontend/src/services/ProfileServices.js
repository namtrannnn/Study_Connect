import httpRequest from '../config/axios';

// [GET] /api/v1/profile/me
export const getMyProfile = async () => {
    const res = await httpRequest.get('/profile/me');
    return res.data;
};

// [GET] /api/v1/profile/:userId
export const getProfileByUserId = async (userId) => {
    const res = await httpRequest.get(`/profile/${userId}`);
    return res.data;
};

// [GET] /api/v1/profile/:userId/posts/grid
export const getUserPostGrid = async ({ userId, limit = 30, cursor } = {}) => {
    const res = await httpRequest.get(`/profile/${userId}/posts/grid`, {
        params: {
            limit,
            cursor,
        },
    });

    return res.data;
};

// [GET] /api/v1/profile/:userId/posts/feed
export const getUserPostFeed = async ({ userId, limit = 10, cursor } = {}) => {
    const res = await httpRequest.get(`/profile/${userId}/posts/feed`, {
        params: {
            limit,
            cursor,
        },
    });

    return res.data;
};

// [PATCH] /api/v1/profile/update
export const updateProfile = async (formData) => {
    const res = await httpRequest.patch('/profile/update', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return res.data;
};
