import httpRequest from '../config/axios';

// GET /api/v1/contact-nickname — { targetId: nickname }
export const getMyNicknames = async () => {
    const res = await httpRequest.get('/contact-nickname');
    return res.data;
};

// PATCH /api/v1/contact-nickname/:targetId
export const setNickname = async (targetId, nickname) => {
    const res = await httpRequest.patch(`/contact-nickname/${targetId}`, { nickname });
    return res.data;
};
