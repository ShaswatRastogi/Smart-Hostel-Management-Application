import api from './api';

export interface AdminNotification {
    id: string;
    type: 'message' | 'complaint' | 'service' | 'laundry' | 'leave';
    title: string;
    subtitle: string;
    time: string;
    data: any;
    read: boolean;
}

export const getAdminNotifications = async (): Promise<AdminNotification[]> => {
    try {
        const response = await api.get('/notifications/admin');
        return response.data;
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }
};

export const subscribeToNotifications = (callback: (data: AdminNotification[]) => void) => {
    const fetch = async () => {
        const data = await getAdminNotifications();
        callback(data);
    };
    fetch();
    const interval = setInterval(fetch, 10000); // Poll every 10s
    return () => clearInterval(interval);
};

export const clearNotifications = async () => {
    try {
        await api.post('/notifications/admin/clear');
        return true;
    } catch (error) {
        console.error("Error clearing notifications:", error);
        return false;
    }
};
