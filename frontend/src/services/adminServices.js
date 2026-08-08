import httpRequest from '../config/axios';

// 1. Overview Stats
export const getAdminStats = async () => {
    const res = await httpRequest.get('/admin/stats');
    return res.data;
};

// 2. Users Management
export const getAdminUsers = async (params = {}) => {
    const res = await httpRequest.get('/admin/users', { params });
    return res.data;
};

export const updateUserStatus = async (userId, status) => {
    const res = await httpRequest.patch(`/admin/users/${userId}/status`, { status });
    return res.data;
};

export const updateUserRole = async (userId, role) => {
    const res = await httpRequest.patch(`/admin/users/${userId}/role`, { role });
    return res.data;
};

export const softDeleteAdminUser = async (userId) => {
    const res = await httpRequest.delete(`/admin/users/${userId}`);
    return res.data;
};
export const deleteAdminUser = softDeleteAdminUser;

// 3. Posts Management
export const getAdminPosts = async (params = {}) => {
    const res = await httpRequest.get('/admin/posts', { params });
    return res.data;
};

export const updatePostStatus = async (postId, status) => {
    const res = await httpRequest.patch(`/admin/posts/${postId}/status`, { status });
    return res.data;
};

export const softDeleteAdminPost = async (postId) => {
    const res = await httpRequest.delete(`/admin/posts/${postId}`);
    return res.data;
};
export const deleteAdminPost = softDeleteAdminPost;

// 4. Comments Management
export const getAdminComments = async (params = {}) => {
    const res = await httpRequest.get('/admin/comments', { params });
    return res.data;
};

export const deleteAdminComment = async (commentId) => {
    const res = await httpRequest.delete(`/admin/comments/${commentId}`);
    return res.data;
};

// 5. Reports & AI Moderation
export const getAdminReports = async (params = {}) => {
    const res = await httpRequest.get('/admin/reports', { params });
    return res.data;
};

export const analyzeReportWithAI = async (reportId) => {
    const res = await httpRequest.post(`/admin/reports/${reportId}/analyze-ai`);
    return res.data;
};

export const resolveReport = async (reportId, action) => {
    const res = await httpRequest.patch(`/admin/reports/${reportId}/resolve`, { action });
    return res.data;
};

// 7. Hashtags & Blacklist
export const getAdminHashtags = async () => {
    const res = await httpRequest.get('/admin/hashtags');
    return res.data;
};

export const addBlacklistHashtag = async (tag) => {
    const res = await httpRequest.post('/admin/hashtags/blacklist', { tag });
    return res.data;
};

export const deleteBlacklistHashtag = async (id) => {
    const res = await httpRequest.delete(`/admin/hashtags/blacklist/${id}`);
    return res.data;
};

// 8. Interaction Analytics
export const getAdminInteractionAnalytics = async () => {
    const res = await httpRequest.get('/admin/analytics/interactions');
    return res.data;
};

// 10. System Activity Logs
export const getAdminActivityLogs = async (params = {}) => {
    const res = await httpRequest.get('/admin/activity-logs', { params });
    return res.data;
};
