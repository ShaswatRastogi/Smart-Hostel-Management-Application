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
import { useForegroundRefresh } from '../hooks/useForegroundRefresh';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS } from 'react-native-reanimated';
import { DeviceEventEmitter, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import MaskedView from '@react-native-masked-view/masked-view';
import { captureRef, captureScreen } from 'react-native-view-shot';
import OfflineBanner from '../components/OfflineBanner';

export const globalViewRef = React.createRef<View>();

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

  useForegroundRefresh();

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

function ThemeRippleOverlay() {
  const [active, setActive] = React.useState(false);
  const [snapshotUri, setSnapshotUri] = React.useState<string | null>(null);
  const [center, setCenter] = React.useState({ x: 0, y: 0 });
  const R = useSharedValue(0);
  const toggleThemeRef = React.useRef<() => void>();
  const onRippleEndRef = React.useRef<(() => void) | undefined>();
  
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('triggerThemeRipple', async ({ x, y, toggleThemeCallback, onRippleEndCallback }) => {
      if (!globalViewRef.current) return toggleThemeCallback();
      
      try {
        // Fast hardware-accelerated snapshot.
        // Using captureScreen grabs the native framebuffer instantly instead of traversing the React view tree,
        // completely eliminating the 2-second delay on Android while maintaining full high quality.
        const uri = await captureScreen({
          format: 'jpg',
          quality: 0.9,
        });

        if (!uri) return toggleThemeCallback();

        toggleThemeRef.current = toggleThemeCallback;
        onRippleEndRef.current = onRippleEndCallback;
        setSnapshotUri(uri);
        setCenter({ x, y });
        setActive(true);
        R.value = 0;

        // We DO NOT call toggleThemeCallback here.
        // We wait for the Image's onLoad event to guarantee it is physically drawn before swapping.
      } catch (e) {
        console.error(e);
        toggleThemeCallback();
      }
    });
    return () => sub.remove();
  }, []);

  const handleImageLoad = () => {
    if (!toggleThemeRef.current) return;
    
    // 1. Snapshot is now 100% visible on screen. Safely swap the real UI underneath.
    toggleThemeRef.current();
    toggleThemeRef.current = undefined;

    // Capture the callback in a JS closure to avoid worklet warnings
    const onEnd = onRippleEndRef.current;

    // 2. Start the expanding transparent hole animation on the UI thread immediately
    requestAnimationFrame(() => {
      R.value = withTiming(1500, { duration: 900, easing: Easing.inOut(Easing.ease) }, (finished) => {
        if (finished) {
          runOnJS(setActive)(false);
          runOnJS(setSnapshotUri)(null);
          if (onEnd) {
            runOnJS(onEnd)();
          }
        }
      });
    });
  };

  const handleImageError = () => {
    if (toggleThemeRef.current) toggleThemeRef.current();
    setActive(false);
    setSnapshotUri(null);
  };

  const maskStyle = useAnimatedStyle(() => {
    const radius = R.value;
    const borderWidth = 1500;
    const size = radius * 2 + borderWidth * 2;
    return {
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: borderWidth,
      borderColor: 'black', // Opaque border reveals the snapshot
      backgroundColor: 'transparent', // Transparent hole hides the snapshot (revealing new theme underneath)
      position: 'absolute',
      top: center.y - size / 2,
      left: center.x - size / 2,
    };
  });

  if (!active || !snapshotUri) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 99999 }]} pointerEvents="none">
      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={
          <View style={StyleSheet.absoluteFill}>
            <Animated.View style={maskStyle} />
          </View>
        }
      >
        <Image 
          source={{ uri: snapshotUri }} 
          style={StyleSheet.absoluteFill} 
          contentFit="fill" 
          transition={0} 
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </MaskedView>
    </View>
  );
}

function AppNavigator() {
  const colors = useThemeStore((state) => state.colors);

  return (
    <View ref={globalViewRef} collapsable={false} style={{ flex: 1, backgroundColor: colors.background }}>
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
        <ThemeRippleOverlay />
        <OfflineBanner />
      </GlobalStateInitializer>
    </GestureHandlerRootView>
  );
}

// Global Expo Router Error Boundary
export { CustomErrorBoundary as ErrorBoundary } from '../components/CustomErrorBoundary';

