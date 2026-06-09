import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing as RNEasing, StyleSheet, View } from 'react-native';
import {
  Canvas,
  Text as SkiaText,
  useFont,
  LinearGradient,
  vec,
  Group,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  useDerivedValue,
  Easing,
} from 'react-native-reanimated';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { isAdmin } from '../utils/authUtils';

const FONT_SIZE = 52;
const SHINE_WIDTH = 100;
const SHINE_HALF = SHINE_WIDTH / 2;

export default function Index() {
  const router = useRouter();
  const [isReady, setIsReady] = React.useState(false);

  // Load font for Skia rendering
  const font = useFont(
    require('@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf'),
    FONT_SIZE
  );

  // RN Animated for entrance/exit fade
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scaleIn = useRef(new Animated.Value(0.88)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  // Reanimated shared value for shine position
  const shinePos = useSharedValue(-SHINE_HALF);

  // Measure text using Skia font metrics
  const textWidth = font ? font.measureText('SmartStay').width : 0;
  const canvasWidth = textWidth + 20;
  const canvasHeight = FONT_SIZE * 1.4;
  const textX = 10;
  const textY = FONT_SIZE + 2;

  const { user, isLoading } = useAuthStore();

  // ── Background preload ──
  useEffect(() => {
    (async () => {
      if (!isLoading) {
        await useSettingsStore.getState().loadSettings();
        setIsReady(true);
      }
    })();
  }, [isLoading]);

  // ── Entrance animation ──
  useEffect(() => {
    if (!font) return;
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 700,
        easing: RNEasing.out(RNEasing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleIn, {
        toValue: 1,
        duration: 700,
        easing: RNEasing.out(RNEasing.back(1.05)),
        useNativeDriver: true,
      }),
    ]).start();
  }, [font]);

  // ── Shine sweep loop (Reanimated) ──
  useEffect(() => {
    if (!font || textWidth === 0) return;

    shinePos.value = -SHINE_HALF;
    shinePos.value = withRepeat(
      withSequence(
        withTiming(textWidth + SHINE_HALF + 10, {
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
        }),
        withDelay(500, withTiming(-SHINE_HALF, { duration: 0 }))
      ),
      -1, // infinite loop
      false
    );
  }, [font, textWidth]);

  // ── Navigate when ready ──
  useEffect(() => {
    if (!isReady || !font) return;

    const timer = setTimeout(() => {
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 350,
        easing: RNEasing.in(RNEasing.cubic),
        useNativeDriver: true,
      }).start(() => {
        const { onboardingCompleted } = useSettingsStore.getState();
        if (user) {
          if (!onboardingCompleted) {
            router.replace('/onboarding');
          } else if (isAdmin(user)) {
            router.replace('/admin');
          } else {
            router.replace('/(tabs)');
          }
        } else {
          router.replace('/login');
        }
      });
    }, 600);

    return () => clearTimeout(timer);
  }, [isReady, font, user]);

  // ── Animated gradient start/end derived from shinePos ──
  const gradientStart = useDerivedValue(() =>
    vec(shinePos.value - SHINE_HALF, 0)
  );
  const gradientEnd = useDerivedValue(() =>
    vec(shinePos.value + SHINE_HALF, 0)
  );

  // Black screen while font loads
  if (!font) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.center,
          {
            opacity: Animated.multiply(fadeIn, fadeOut),
            transform: [{ scale: scaleIn }],
          },
        ]}
      >
        <Canvas style={{ width: canvasWidth, height: canvasHeight }}>
          <Group>
            {/* Gradient shader applied as the text fill color.
                Outside the gradient range, Skia clamps to edge color (#777)
                so only the moving center band lights up to white. */}
            <LinearGradient
              start={gradientStart}
              end={gradientEnd}
              colors={['#777777', '#b0b0b0', '#ffffff', '#b0b0b0', '#777777']}
              positions={[0, 0.25, 0.5, 0.75, 1]}
            />
            <SkiaText
              text="SmartStay"
              x={textX}
              y={textY}
              font={font}
            />
          </Group>
        </Canvas>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
