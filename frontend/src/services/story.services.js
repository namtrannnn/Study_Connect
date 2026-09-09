import httpRequest from '../config/axios';

// [GET] /api/v1/story/feed
export const getStoryFeed = async () => {
    const res = await httpRequest.get('/story/feed');
    return res.data;
};

// [POST] /api/v1/story/create
export const createStory = async (formData) => {
    const res = await httpRequest.post('/story/create', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return res.data;
};

// [POST] /api/v1/story/view/:storyId
export const viewStory = async (storyId) => {
    const res = await httpRequest.post(`/story/view/${storyId}`);
    return res.data;
};

// [GET] /api/v1/story/viewers/:storyId
export const getStoryViewers = async (storyId, page = 1, limit = 10) => {
    const res = await httpRequest.get(`/story/viewers/${storyId}`, {
        params: { page, limit },
    });
    return res.data;
};

// [PATCH] /api/v1/story/delete/:storyId
export const deleteStory = async (storyId) => {
    const res = await httpRequest.patch(`/story/delete/${storyId}`);
    return res.data;
};

// [POST] /api/v1/story/reply/:storyId
export const replyStory = async (storyId, content) => {
    const res = await httpRequest.post(`/story/reply/${storyId}`, { content });
    return res.data;
};

// ══════════════════════════════════════
// STORY ARCHIVE & HIGHLIGHTS
// ══════════════════════════════════════

// [GET] /api/v1/story/archive
export const getStoryArchive = async (page = 1, limit = 20) => {
    const res = await httpRequest.get('/story/archive', {
        params: { page, limit },
    });
    return res.data;
};

// [POST] /api/v1/story/highlights
export const createHighlight = async ({ title, storyIds, coverImage }) => {
    const res = await httpRequest.post('/story/highlights', {
        title,
        storyIds,
        coverImage,
    });
    return res.data;
};

// [GET] /api/v1/story/highlights/user/:userId
export const getUserHighlights = async (userId) => {
    const res = await httpRequest.get(`/story/highlights/user/${userId}`);
    return res.data;
};

// [PUT] /api/v1/story/highlights/:highlightId
export const updateHighlight = async (highlightId, { title, storyIds, coverImage }) => {
    const res = await httpRequest.put(`/story/highlights/${highlightId}`, {
        title,
        storyIds,
        coverImage,
    });
    return res.data;
};

// [DELETE] /api/v1/story/highlights/:highlightId
export const deleteHighlight = async (highlightId) => {
    const res = await httpRequest.delete(`/story/highlights/${highlightId}`);
    return res.data;
};
