
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import api from './api';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    } as any),
});

async function registerForPushNotificationsAsync() {
    let token: string | undefined;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        console.log("🔓 Notification Permissions status:", finalStatus);

        if (finalStatus !== 'granted') {
            console.warn('❌ Failed to get push token for push notification!');
            return;
        }

        // Get the native FCM device token (works with Firebase Admin SDK directly)
        try {
            console.log("📡 Fetching FCM Device Token...");
            const deviceToken = await Notifications.getDevicePushTokenAsync();
            token = deviceToken.data as string;
            console.log("📱 FCM Device Token:", token);
        } catch (e: any) {
            console.error("❌ Error fetching FCM token:", e.message);
        }
    } else {
        console.warn('⚠️ Must use physical device for Push Notifications');
    }

    return token;
}

import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { isAdmin } from './authUtils';

export const deregisterPushToken = async () => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
            console.log("🔄 Deregistering Push Token for logout");
            await api.post('/auth/push-token/remove', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("✅ Push Token deregistered successfully");
        }
    } catch (error) {
        console.error("❌ Failed to deregister push token:", error);
    }
};

export const usePushNotifications = () => {
    const [expoPushToken, setExpoPushToken] = useState<string | undefined>('');
    const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
    const notificationListener = useRef<any>(null);
    const responseListener = useRef<any>(null);
    const { user } = useAuth();
    const router = useRouter();
    const userRef = useRef(user);
    const lastResponse = Notifications.useLastNotificationResponse();
    const lastHandledId = useRef<string | null>(null);

    // Keep userRef updated so listener always has the latest role
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    const handleResponse = (response: Notifications.NotificationResponse) => {
        const notificationId = response.notification.request.identifier;
        if (lastHandledId.current === notificationId) {
            console.log("⏭️ [Push] Notification already handled:", notificationId);
            return;
        }

        const data = response.notification.request.content.data;
        if (!data) {
            console.log("⚠️ [Push] No data in notification payload");
            return;
        }

        const { type, id, studentId, studentName } = data;
        const currentUser = userRef.current;
        const userRole = currentUser?.role;

        if (!userRole) {
            console.log("⏳ [Push] Role not yet available, leaving notification unhandled.");
            return;
        }

        console.log(`🚀 [Push] Navigating for type: ${type}, role: ${userRole}`);
        lastHandledId.current = notificationId;

        // Small delay to ensure navigation is ready and layout is stable
        setTimeout(() => {
            if (isAdmin({ role: userRole })) {
                console.log(`📍 [Push] Admin navigating to: ${type}`);
                switch (type) {
                    case 'message':
                        router.push({ pathname: '/chat/[id]', params: { id: studentId, name: studentName } as any });
                        break;
                    case 'visitor':
                        router.push('/admin/visitors');
                        break;
                    case 'service':
                        router.push('/admin/services');
                        break;
                    case 'complaint':
                        router.push('/admin/complaints');
                        break;
                    case 'leave':
                        router.push('/admin/leaveRequests');
                        break;
                    case 'payment':
                        router.push('/admin/finance');
                        break;
                    case 'notice':
                        router.push('/admin/notices');
                        break;
                    case 'bus':
                        router.push('/admin/busTimings');
                        break;
                    case 'laundry':
                        router.push('/admin/laundry');
                        break;
                    case 'emergency':
                        router.push('/admin/emergency');
                        break;
                    case 'mess':
                        router.push('/admin/messMenu');
                        break;
                    default:
                        console.warn("⚠️ [Push] Unknown notification type for admin:", type);
                }
            } else if (userRole === 'student') {
                console.log(`📍 [Push] Student navigating to: ${type}`);
                switch (type) {
                    case 'message':
                        router.push({ pathname: '/chat/[id]', params: { id: 'admin', name: 'Admin Support' } as any });
                        break;
                    case 'notice':
                        router.push('/alerts');
                        break;
                    case 'visitor':
                        router.push('/my-visitors');
                        break;
                    case 'service':
                        router.push('/roomservice');
                        break;
                    case 'complaint':
                        router.push('/my-complaints');
                        break;
                    case 'leave':
                        router.push('/leave-request');
                        break;
                    case 'payment':
                        router.push('/(tabs)/payments');
                        break;
                    case 'bus':
                        router.push('/bustimings');
                        break;
                    case 'laundry':
                        router.push('/laundry-request');
                        break;
                    case 'emergency':
                        router.push('/(tabs)/emergency');
                        break;
                    case 'mess':
                        router.push('/mess');
                        break;
                    default:
                        console.warn("⚠️ [Push] Unknown notification type for student:", type);
                }
            } else {
                console.warn("⚠️ [Push] No user role identified, skipping navigation. Waiting for auth state?");
            }
        }, 500);
    };

    // Handle last response (e.g. app opened from killed state)
    useEffect(() => {
        if (lastResponse) {
            handleResponse(lastResponse);
        }
    }, [lastResponse, user]);

    useEffect(() => {
        const syncToken = async () => {
            const token = await registerForPushNotificationsAsync();
            if (token) setExpoPushToken(token);
        };

        syncToken();

        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            setNotification(notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            handleResponse(response);
        });

        return () => {
            notificationListener.current &&
                notificationListener.current.remove();
            responseListener.current &&
                responseListener.current.remove();
        };
    }, []);

    // Re-attempt token registration when user logs in (covers the case where
    // the token wasn't ready yet during the initial mount)
    useEffect(() => {
        if (user && !expoPushToken) {
            console.log("🔄 [Push] User logged in but no token yet — retrying registration...");
            const retry = async () => {
                const token = await registerForPushNotificationsAsync();
                if (token) setExpoPushToken(token);
            };
            retry();
        }
    }, [user]);

    // Sync token with backend when User is authenticated (with retry)
    useEffect(() => {
        if (expoPushToken && user) {
            const syncWithRetry = async (attempt = 1) => {
                try {
                    console.log(`🔄 [Push] Syncing Token for ${user.role}: ${user.name || 'User'} (attempt ${attempt})`);
                    await api.post('/auth/push-token', { pushToken: expoPushToken });
                    console.log('✅ [Push] Token successfully saved/synced to backend');
                } catch (err: any) {
                    const status = err.response ? err.response.status : 'Network Error';
                    console.error(`❌ [Push] Failed to sync token (${status}):`, err.message);
                    // Retry up to 3 times with increasing delay
                    if (attempt < 3) {
                        const delay = attempt * 5000;
                        console.log(`🔄 [Push] Retrying in ${delay / 1000}s...`);
                        setTimeout(() => syncWithRetry(attempt + 1), delay);
                    }
                }
            };
            syncWithRetry();
        } else if (expoPushToken && !user) {
            console.log("ℹ️ [Push] Token available but no user logged in. Skipping sync.");
        }
    }, [expoPushToken, user]);

    return {
        expoPushToken,
        notification
    };
};
