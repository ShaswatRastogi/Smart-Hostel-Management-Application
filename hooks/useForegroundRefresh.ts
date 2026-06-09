import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNotificationStore } from '../store/useNotificationStore';
import { useDashboardStore } from '../store/useDashboardStore';
import { DeviceEventEmitter } from 'react-native';

export function useForegroundRefresh() {
  const appState = useRef(AppState.currentState);
  const { refreshUser, user } = useAuth();
  
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('📱 App has come to the foreground! Refreshing data...');
        // Refresh User Data (Dues, etc)
        if (user) {
            refreshUser();
            // Refresh Notifications
            useNotificationStore.getState().fetchNotifications();
            // Emit event so active screens can refresh themselves
            DeviceEventEmitter.emit('appForegrounded');
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [user]);
}
