import httpRequest from '../config/axios';

export const searchStudyConnect = async ({ keyword, type = 'all', page = 1, limit = 10 }) => {
    const res = await httpRequest.get('/search', {
        params: {
            keyword,
            type,
            page,
            limit,
        },
    });

    return res.data;
};
