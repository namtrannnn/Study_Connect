import httpRequest from '../config/axios';

// [POST] /api/v1/report
export const createReport = async ({ target_type, target_id, reasonCategory, reason = '' }) => {
    const res = await httpRequest.post('/report', { target_type, target_id, reasonCategory, reason });
    return res.data;
};
