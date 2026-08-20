import httpRequest from '../config/axios';

// GET /api/v1/notifications
export const getNotifications = async () => {
    try {
        const res = await httpRequest.get('/notifications');
        // console.log('notification res:', res.data);
        return res.data;
    } catch (error) {
        console.log('notification error:', error?.response?.status, error?.response?.data?.message);
        throw error;
    }
};

// PATCH /api/v1/notifications/read/:id
export const markAsRead = async (notificationId) => {
    const res = await httpRequest.patch(`/notifications/read/${notificationId}`);
    return res.data;
};

// PATCH /api/v1/notifications/read-all
export const markAllAsRead = async () => {
    const res = await httpRequest.patch('/notifications/read-all');
    return res.data;
};

// DELETE /api/v1/notifications/:id
export const deleteNotification = async (notificationId) => {
    const res = await httpRequest.delete(`/notifications/${notificationId}`);
    return res.data;
};
