import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { DeviceEventEmitter, Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, interpolateColor, withTiming, Easing } from 'react-native-reanimated';
import { useTheme } from '../../utils/ThemeContext';
import AppText from '../../components/AppText';
import Svg, { Circle, Defs, Pattern, Rect, Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// Premium background dot pattern
const BackgroundDots = ({ isDark }: { isDark: boolean }) => {
  const dotColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <Circle cx="2" cy="2" r="1.5" fill={dotColor} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#dots)" />
      </Svg>
    </View>
  );
};

// Bespoke Hostel App Split-Screen Mockup
const HostelAppMockup = () => {
  return (
    <View style={styles.phoneOuterWrapper}>
      {/* Decorative Glow */}
      <View style={[styles.phoneGlow, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]} />
      
      <View style={styles.phoneFrame}>
        <View style={styles.notch} />
        
        <View style={styles.phoneScreen}>
          {/* Light Theme Side */}
          <View style={[styles.phoneHalf, { backgroundColor: '#F8FAFC' }]}>
            {/* Header Area */}
            <View style={{ height: 60, backgroundColor: '#E2E8F0', borderBottomRightRadius: 20, paddingTop: 24, paddingHorizontal: 12 }}>
               <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#CBD5E1' }} />
               <View style={{ width: 40, height: 6, backgroundColor: '#94A3B8', borderRadius: 3, marginTop: 8 }} />
            </View>

            {/* Dashboard Content */}
            <View style={{ marginTop: 20, paddingHorizontal: 8, gap: 12 }}>
               {/* Mess Menu Card */}
               <View style={{ height: 50, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 8, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 } }}>
                 <View style={{ width: 30, height: 5, backgroundColor: '#E2E8F0', borderRadius: 3, marginBottom: 8 }} />
                 <MaterialCommunityIcons name="silverware-fork-knife" size={20} color="#FDBA74" style={{ alignSelf: 'flex-end' }} />
               </View>
               
               {/* Bus Card */}
               <View style={{ height: 50, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 8, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 } }}>
                 <View style={{ width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 3, marginBottom: 8 }} />
                 <MaterialCommunityIcons name="bus-school" size={20} color="#FACC15" style={{ alignSelf: 'flex-end' }} />
               </View>

               <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#EFF6FF', marginTop: 10, alignSelf: 'center', justifyContent: 'center', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="robot" size={12} color="#3B82F6" />
               </View>
            </View>
          </View>
          
          {/* Dark Theme Side */}
          <View style={[styles.phoneHalf, { backgroundColor: '#000000' }]}>
            {/* Header Area */}
            <View style={{ height: 60, backgroundColor: '#111111', borderBottomLeftRadius: 20, paddingTop: 24, paddingHorizontal: 12, alignItems: 'flex-end' }}>
               <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
                  <MaterialCommunityIcons name="wifi" size={10} color="#FFF" />
                  <MaterialCommunityIcons name="battery" size={12} color="#FFF" />
               </View>
            </View>

            {/* Dashboard Content */}
            <View style={{ marginTop: 20, paddingHorizontal: 8, gap: 12 }}>
               {/* Mess Menu Card */}
               <View style={{ height: 50, backgroundColor: '#1A1A1A', borderRadius: 12, padding: 8 }}>
                 <View style={{ width: 30, height: 5, backgroundColor: '#333333', borderRadius: 3, alignSelf: 'flex-end', marginBottom: 8 }} />
                 <MaterialCommunityIcons name="silverware-fork-knife" size={20} color="#FDBA74" />
               </View>
               
               {/* Bus Card */}
               <View style={{ height: 50, backgroundColor: '#1A1A1A', borderRadius: 12, padding: 8 }}>
                 <View style={{ width: 40, height: 5, backgroundColor: '#333333', borderRadius: 3, alignSelf: 'flex-end', marginBottom: 8 }} />
                 <MaterialCommunityIcons name="bus-school" size={20} color="#FACC15" />
               </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

// Premium Custom Toggle Switch
const PremiumToggle = ({ isDark }: { isDark: boolean }) => {
  const progress = useSharedValue(isDark ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(isDark ? 1 : 0, { damping: 15, stiffness: 120 });
  }, [isDark]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * 28 }],
    backgroundColor: interpolateColor(progress.value, [0, 1], ['#FFFFFF', '#111111'])
  }));

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], ['#E2E8F0', '#333333'])
  }));

  return (
    <Animated.View style={[styles.toggleTrack, trackStyle]}>
      <Animated.View style={[styles.toggleThumb, thumbStyle]}>
        <MaterialCommunityIcons 
          name={isDark ? "weather-night" : "white-balance-sunny"} 
          size={16} 
          color={isDark ? "#FFFFFF" : "#F59E0B"} 
        />
      </Animated.View>
    </Animated.View>
  );
};


export default function ThemeSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, toggleTheme } = useTheme();
  const isToggling = React.useRef(false);

  const themeBg = isDark ? '#050505' : '#FAFAFA';
  const textMain = isDark ? '#FFFFFF' : '#111111';
  const textMuted = isDark ? '#A1A1AA' : '#64748B';
  const cardBg = isDark ? '#111111' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const handleToggleTheme = (e?: any) => {
    if (isToggling.current) return;
    isToggling.current = true;

    let x = width / 2, y = height - 120;
    if (e && e.nativeEvent && e.nativeEvent.pageX) {
      x = e.nativeEvent.pageX;
      y = e.nativeEvent.pageY;
    }
    
    // Emit instantly, no delay
    DeviceEventEmitter.emit('triggerThemeRipple', { 
      x, 
      y, 
      toggleThemeCallback: () => {
        toggleTheme();
      }, 
      isDark,
      onRippleEndCallback: () => {
        isToggling.current = false;
        router.navigate('/(tabs)');
      }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: themeBg }]}>
      <BackgroundDots isDark={isDark} />
      <Stack.Screen options={{ headerShown: false }} />
      
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable 
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]} 
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={textMain} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.textSection}>
            <AppText style={[styles.title, { color: textMain }]}>Theme Mode</AppText>
            <AppText style={[styles.subtitle, { color: textMuted }]}>
              Customize your Smart Hostel experience. Switch to dark mode for late-night study sessions or early morning classes.
            </AppText>
          </View>

          <HostelAppMockup />
          
          <View style={{ flex: 1 }} />

          <Pressable 
            style={[
              styles.themeCard, 
              { backgroundColor: cardBg, borderColor: cardBorder }
            ]}
            onPress={handleToggleTheme}
          >
            <View style={styles.cardLeft}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? '#1A1A1A' : '#F1F5F9' }]}>
                <MaterialCommunityIcons 
                  name={isDark ? "moon-waning-crescent" : "white-balance-sunny"} 
                  size={24} 
                  color={textMain} 
                />
              </View>
              <View>
                <AppText style={[styles.cardTitle, { color: textMain }]}>
                  {isDark ? 'Dark Theme' : 'Light Theme'}
                </AppText>
                <AppText style={[styles.cardSubtitle, { color: textMuted }]}>
                  {isDark ? 'Comfortable for your eyes' : 'Clean and bright'}
                </AppText>
              </View>
            </View>
            
            <PremiumToggle isDark={isDark} />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  textSection: {
    marginTop: 10,
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  // Phone Mockup
  phoneOuterWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 280,
  },
  phoneGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    transform: [{ scaleY: 1.2 }],
    opacity: 0.6,
  },
  phoneFrame: {
    width: 160,
    height: 310,
    backgroundColor: '#333',
    borderRadius: 36,
    borderWidth: 6,
    borderColor: '#444',
    overflow: 'hidden',
    position: 'relative',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  notch: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    width: 60,
    height: 16,
    backgroundColor: '#444',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    zIndex: 10,
  },
  phoneScreen: {
    flex: 1,
    flexDirection: 'row',
  },
  phoneHalf: {
    flex: 1,
  },
  // Theme Card
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Premium Toggle
  toggleTrack: {
    width: 56,
    height: 32,
    borderRadius: 16,
    padding: 4,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  }
});
