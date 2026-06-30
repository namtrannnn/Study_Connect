import httpRequest from '../config/axios';

// [GET] /api/v1/suggest/summary
export const getSuggestSummary = async () => {
    const res = await httpRequest.get('/suggest/summary');
    return res.data;
};
