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
export const getStoryViewers = async (storyId) => {
    const res = await httpRequest.get(`/story/viewers/${storyId}`);
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
