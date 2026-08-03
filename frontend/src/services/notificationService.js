import axiosInstance from '../api/axios.js';

const notificationService = {
    getAll: () => axiosInstance.get('/api/notifications'),
    getUnreadCount: () => axiosInstance.get('/api/notifications/unread-count'),
    markAsRead: (id) => axiosInstance.post(`/api/notifications/${id}/read`),
    markAllAsRead: () => axiosInstance.post('/api/notifications/read-all'),
};

export default notificationService;