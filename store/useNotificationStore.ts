import { create } from 'zustand';
import api from '../utils/api';
import { isAdmin } from '../utils/authUtils';
import { useAuthStore } from './useAuthStore';

interface NotificationState {
    adminUnreadCount: number;
    studentUnreadCount: number;
    fetchNotifications: () => Promise<void>;
    startPolling: () => void;
    stopPolling: () => void;
}

let pollingInterval: NodeJS.Timeout | null = null;

export const useNotificationStore = create<NotificationState>((set) => ({
    adminUnreadCount: 0,
    studentUnreadCount: 0,

    fetchNotifications: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        const endpoint = isAdmin(user)
            ? '/notifications/admin'
            : '/notifications/student';

        try {
            const res = await api.get(endpoint);
            const count = res.data.length;

            if (isAdmin(user)) {
                set({ adminUnreadCount: count });
            } else {
                set({ studentUnreadCount: count });
            }
        } catch (error) {
            // Silently fail
        }
    },

    startPolling: () => {
        if (pollingInterval) return;
        useNotificationStore.getState().fetchNotifications();
        pollingInterval = setInterval(() => {
            useNotificationStore.getState().fetchNotifications();
        }, 60_000) as any;
    },

    stopPolling: () => {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }
    }
}));
