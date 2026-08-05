import httpRequest from '../config/axios';

// [POST] /api/v1/post/create
export const createPost = async (data) => {
    const res = await httpRequest.post('/post/create', data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return res.data;
};

// [GET] /api/v1/post/feed
export const getFeedPosts = async ({ limit = 10, cursor } = {}) => {
    const res = await httpRequest.get('/post/feed', {
        params: {
            limit,
            cursor,
        },
    });

    return res.data;
};

// [GET] /api/v1/post/me
export const getMyPosts = async () => {
    const res = await httpRequest.get('/post/me');
    return res.data;
};

// [GET] /api/v1/post/:id
export const getPostDetail = async (postId) => {
    const res = await httpRequest.get(`/post/${postId}`);
    return res.data;
};

// [PATCH] /api/v1/post/edit/:id
export const editPost = async (postId, data) => {
    const res = await httpRequest.patch(`/post/edit/${postId}`, data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return res.data;
};

// [PATCH] /api/v1/post/delete/:id
export const deletePost = async (postId) => {
    const res = await httpRequest.patch(`/post/delete/${postId}`);
    return res.data;
};

// [POST] /api/v1/post/pin/:id
export const pinPost = async (postId) => {
    const res = await httpRequest.post(`/post/pin/${postId}`);
    return res.data;
};

// [DELETE] /api/v1/post/pin/:id
export const unpinPost = async (postId) => {
    const res = await httpRequest.delete(`/post/pin/${postId}`);
    return res.data;
};

// [POST] /api/v1/post/share/:postId
export const sharePost = async (postId) => {
    const res = await httpRequest.post(`/post/share/${postId}`);
    return res.data;
};

// [GET] /api/v1/post/related/:id
export const getRelatedPosts = async (postId) => {
    const res = await httpRequest.get(`/post/related/${postId}`);
    return res.data;
};

// [POST] /api/v1/post/toggle-like/:postId
export const toggleLikePost = async (postId) => {
    const res = await httpRequest.post(`/post/toggle-like/${postId}`);
    return res.data;
};

// [POST] /api/v1/post/save/toggle/:postId
export const toggleSavePost = async (postId) => {
    const res = await httpRequest.post(`/post/save/toggle/${postId}`);
    return res.data;
};

// [GET] /api/v1/post/save/all
export const getAllSavedPosts = async ({ cursor, limit = 10 } = {}) => {
    const res = await httpRequest.get('/post/save/all', { params: { cursor, limit } });
    return res.data;
};

// [GET] /api/v1/post/save/liked
export const getLikedPosts = async ({ cursor, limit = 10 } = {}) => {
    const res = await httpRequest.get('/post/save/liked', { params: { cursor, limit } });
    return res.data;
};
// [GET] /api/v1/post/likes/:postId?page=1&limit=10&search=
export const getPostLikes = async ({ postId, page = 1, limit = 10, search = '' }) => {
    const res = await httpRequest.get(`/post/likes/${postId}`, {
        params: {
            page,
            limit,
            search,
        },
    });

    return res.data;
};
