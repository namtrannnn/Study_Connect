import httpRequest from '../config/axios';

// LIST user in admin
export const getUsers = async (query) => {
    const res = await httpRequest.get('/account', { params: query });
    return res.data;
};

// client
export const login = async (data) => {
    const res = await httpRequest.post('/user/login', data);
    return res.data;
};

export const register = async (data) => {
    const res = await httpRequest.post('/user/register', data);
    return res.data;
};

export const searchUsers = async ({ keyword, scope = 'all', limit = 10 } = {}) => {
    const res = await httpRequest.get('/user/search-user', {
        params: {
            keyword,
            scope,
            limit,
        },
    });

    return res.data;
};

// [GET] /api/v1/user/chat-badge
export const getChatBadge = async () => {
    const res = await httpRequest.get('/user/chat-badge');
    return res.data;
};

// [PATCH] /api/v1/user/reset-chat-badge
export const resetChatBadge = async () => {
    const res = await httpRequest.patch('/user/reset-chat-badge');
    return res.data;
};
