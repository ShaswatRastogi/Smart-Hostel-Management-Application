import { Stack } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import CustomAlert from "../components/CustomAlert";
import { useAlertStore } from "../store/useAlertStore";
import { useAuthStore } from "../store/useAuthStore";
import { useNotificationStore } from "../store/useNotificationStore";
import { useOfflineStore } from "../store/useOfflineStore";
import { useThemeStore } from "../store/useThemeStore";
import { useAccessibilityStore } from "../store/useAccessibilityStore";
import { useNetworkStatus } from "../utils/useNetworkStatus";
import { usePushNotifications } from "../utils/usePushNotifications";
import { useSessionHeartbeat } from "../utils/useSessionHeartbeat";

// Global JS Error Handler
if (!__DEV__) {
  const globalHandler = (error: any, isFatal: boolean) => {
    console.error('Global Error:', error);
    useAlertStore.getState().showAlert(
      'Application Error',
      'Something went wrong. Please try again or restart the app.',
      [{ text: 'OK', style: 'default' }],
      'error'
    );
  };
  
  if ((global as any).ErrorUtils) {
    (global as any).ErrorUtils.setGlobalHandler(globalHandler);
  }
}


function GlobalStateInitializer({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const startPolling = useNotificationStore((state) => state.startPolling);
  const stopPolling = useNotificationStore((state) => state.stopPolling);
  const { isOnline } = useNetworkStatus();
  const setOnline = useOfflineStore((state) => state.setOnline);

  // Sync Network Status
  useEffect(() => {
    setOnline(isOnline);
  }, [isOnline]);

  // Handle Notifications Polling
  useEffect(() => {
    if (user) {
      startPolling();
    } else {
      stopPolling();
    }
    return () => stopPolling();
  }, [user]);

  // Push Notifications
  usePushNotifications();

  // Session Heartbeat (keeps device "online" for Manage Devices)
  useSessionHeartbeat();

  return <>{children}</>;
}

function GlobalAlert() {
  const { visible, title, message, buttons, type, hideAlert } = useAlertStore();
  return (
    <CustomAlert
      visible={visible}
      title={title}
      message={message}
      buttons={buttons}
      type={type}
      onClose={hideAlert}
    />
  );
}

function AppNavigator() {
  const colors = useThemeStore((state) => state.colors);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="admin" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="alerts" options={{ animation: 'slide_from_right' }} />

        <Stack.Screen name="mess" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="laundry-request" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="roomservice" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="bustimings" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="leave-request" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="complaints" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="new-complaint" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="my-complaints" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  const isLoaded = useThemeStore((state) => state.isLoaded);
  const { fontScale, boldText, isLoaded: accessLoaded } = useAccessibilityStore();

  if (!isLoaded || !accessLoaded) return null;

  // Key forces re-render of entire app tree when text accessibility changes
  return (
    <GestureHandlerRootView style={{ flex: 1 }} key={`access-${fontScale}-${boldText}`}>
      <StatusBar style="light" backgroundColor="transparent" translucent={true} />
      <GlobalStateInitializer>
        <AppNavigator />
        <GlobalAlert />
      </GlobalStateInitializer>
    </GestureHandlerRootView>
  );
}

