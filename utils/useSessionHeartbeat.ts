import { useEffect, useRef } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';

const HEARTBEAT_INTERVAL_MS = 60 * 1000; // 60 seconds

/**
 * Performs a forced logout — clears all local auth state and navigates to login.
 * Called when the backend reports the session was terminated by another device.
 */
async function forceLogout() {
  try {
    const { removeSecureToken } = await import('./tokenStorage');
    const { setStoredUser } = await import('./authUtils');
    const { useAuthStore } = await import('../store/useAuthStore');
    const { router } = await import('expo-router');
    await setStoredUser(null);
    await removeSecureToken('userToken');
    await removeSecureToken('refreshToken');
    useAuthStore.getState().setUser(null);
    Alert.alert(
      'Session Ended',
      'Your session was terminated from another device. Please log in again.',
      [{ text: 'OK' }]
    );
    router.replace('/login');
  } catch (e) {
    console.error('Force logout error:', e);
  }
}

/**
 * Sends periodic heartbeats to keep the user's session marked as "online"
 * in the backend. Only sends while the app is in the foreground.
 * If the backend reports the session was terminated (valid: false),
 * the user is automatically logged out.
 */
export function useSessionHeartbeat() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sendHeartbeat = async () => {
    try {
      const { getSecureToken } = await import('./tokenStorage');
      const { default: api } = await import('./api');
      const refreshToken = await getSecureToken('refreshToken');
      const userToken = await getSecureToken('userToken');
      if (refreshToken && userToken) {
        const response = await api.post('/auth/sessions/heartbeat', { refreshToken });
        // If the session was terminated by another device, force logout
        if (response.data?.valid === false) {
          stopHeartbeat();
          await forceLogout();
        }
      }
    } catch {
      // Silently ignore heartbeat failures (network issues etc.)
    }
  };

  const startHeartbeat = () => {
    // Send one immediately, then every HEARTBEAT_INTERVAL_MS
    sendHeartbeat();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
  };

  const stopHeartbeat = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    startHeartbeat();

    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        startHeartbeat();
      } else {
        stopHeartbeat();
      }
    });

    return () => {
      stopHeartbeat();
      subscription.remove();
    };
  }, []);
}
