import httpRequest from '../config/axios';

export const searchStudyConnect = async ({ keyword, type = 'all', limit = 10 }) => {
    const res = await httpRequest.get('/search', {
        params: {
            keyword,
            type,
            limit,
        },
    });

    return res.data;
};
