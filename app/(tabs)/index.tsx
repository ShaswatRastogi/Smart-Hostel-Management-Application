import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, DeviceEventEmitter, Dimensions, Pressable, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";

import Animated, {
  Extrapolate,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation
} from 'react-native-reanimated';
import { useRefresh } from '../../hooks/useRefresh';
import api, { API_BASE_URL } from '../../utils/api';
import { fetchLaundrySettings, subscribeToLaundry } from '../../utils/laundrySyncUtils';
import { fetchMenu, subscribeToMenu } from '../../utils/messSyncUtils';

import PagerView from 'react-native-pager-view';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import StudentNotificationOverlay from '../../components/StudentNotificationOverlay';
import { useDashboardStore } from '../../store/useDashboardStore';
import { subscribeToBusTimings } from '../../utils/busTimingsSyncUtils';
import { fetchUserData } from '../../utils/nameUtils';
import { useTheme } from '../../utils/ThemeContext';
import { getCurrentTimeInCountry } from '../../utils/timeUtils';
import AppText from '../../components/AppText';

const toggleStyles = StyleSheet.create({
  toggleBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  }
});

const AnimatedThemeToggle = ({ isDark, toggleTheme, textMain }: { isDark: boolean, toggleTheme: () => void, textMain: string }) => {
  const progress = useDerivedValue(() => {
    return isDark ? withSpring(1) : withSpring(0);
  }, [isDark]);

  const rStyle = useAnimatedStyle(() => {
    const rotate = interpolate(progress.value, [0, 1], [0, 360], Extrapolate.CLAMP);
    const scale = interpolate(progress.value, [0, 0.5, 1], [1, 0.8, 1], Extrapolate.CLAMP);

    return {
      transform: [
        { rotate: `${rotate}deg` },
        { scale: scale }
      ]
    };
  });

  return (
    <TouchableOpacity
      style={[
        toggleStyles.toggleBtn,
        { backgroundColor: 'transparent', borderWidth: 0 }
      ]}
      onPress={toggleTheme}
      activeOpacity={0.8}
    >
      <Animated.View style={rStyle}>
        <MaterialCommunityIcons
          name={isDark ? "weather-sunny" : "weather-night"}
          size={24}
          color={textMain}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const { width } = Dimensions.get('window');

const CustomBusIcon = () => (
  <Svg width="36" height="36" viewBox="0 0 24 24">
    {/* Bus Body */}
    <Path 
      d="M4 6H16C18.2 6 20 7.8 20 10V17H2C2 17 2 17 2 17V8C2 6.9 2.9 6 4 6Z" 
      fill="#FACC15" 
    />
    {/* Windows */}
    <Rect x="3.5" y="8" width="4" height="4" rx="0.5" fill="#3B82F6" />
    <Rect x="8.5" y="8" width="5" height="4" rx="0.5" fill="#3B82F6" />
    <Rect x="14.5" y="8" width="4" height="4" rx="0.5" fill="#3B82F6" />
    {/* Headlight */}
    <Rect x="19.5" y="14" width="1" height="1.5" fill="#FEF08A" />
    {/* Taillight */}
    <Rect x="1.5" y="14" width="1" height="1.5" fill="#EF4444" />
    {/* Bumpers */}
    <Rect x="1.5" y="16.5" width="19" height="1.5" fill="#111111" />
    {/* Wheels */}
    <Circle cx="6" cy="18" r="2.5" fill="#111111" />
    <Circle cx="6" cy="18" r="1" fill="#94A3B8" />
    <Circle cx="16" cy="18" r="2.5" fill="#111111" />
    <Circle cx="16" cy="18" r="1" fill="#94A3B8" />
  </Svg>
);

export default function Index() {
  const router = useRouter();
  const { colors, isDark, toggleTheme } = useTheme();

  // Dynamic Theme Colors
  const themeBg = isDark ? '#000000' : '#F8FAFC';
  const themeGradient = isDark ? ['#000000', '#0a0a0a'] : ['#F8FAFC', '#F1F5F9'];
  const heroGradient = isDark ? ['#000000', '#000000'] : ['#F8FAFC', '#E2E8F0'];
  const cardBg = isDark ? '#000000' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textMain = isDark ? '#FFFFFF' : '#111111';
  const textMuted = isDark ? '#888888' : '#64748B';
  const textAccent = isDark ? '#A1A1AA' : '#475569';
  const overlayGlass = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const skylineOpacity = isDark ? 0.15 : 0.05;

  // Bus driving animation
  const driftX = useSharedValue(-width * 2);
  const busScale = useSharedValue(1);
  
  const skylineX = useSharedValue(0);
  const cardIconRotation = useSharedValue(0);

  React.useEffect(() => {
    driftX.value = -width * 2;
    skylineX.value = 0;
    busScale.value = 1;
    cardIconRotation.value = 0;

    driftX.value = withRepeat(withTiming(0, { duration: 8000, easing: Easing.linear }), -1, false);
    busScale.value = withRepeat(withSequence(withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }), withTiming(0.95, { duration: 1000, easing: Easing.inOut(Easing.ease) })), -1, true);
    skylineX.value = withRepeat(withTiming(-width * 2, { duration: 14000, easing: Easing.linear }), -1, false);
    cardIconRotation.value = withRepeat(withSequence(withTiming(12, { duration: 3000, easing: Easing.inOut(Easing.ease) }), withTiming(-12, { duration: 6000, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })), -1, false);

    return () => {
      cancelAnimation(driftX); cancelAnimation(busScale); cancelAnimation(skylineX); cancelAnimation(cardIconRotation);
    };
  }, []);

  const driftStyle = useAnimatedStyle(() => ({ transform: [{ translateX: driftX.value }] }));
  const busBreathingStyle = useAnimatedStyle(() => ({ transform: [{ scale: busScale.value }] }));
  const skylineStyle = useAnimatedStyle(() => ({ transform: [{ translateX: skylineX.value }] }));
  
  const cardIconStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${cardIconRotation.value}deg` }] }));

  const {
    studentData: student, messMenu: fullMenu, laundrySettings: laundry, busRoutes, dashboardCounts,
    setStudentData, setMessMenu, setLaundrySettings, setBusRoutes, setDashboardCounts, setLastSynced
  } = useDashboardStore();

  const { totalComplaints, totalVisitors, totalLeaves, facilities: totalFacilities } = dashboardCounts;

  const [loading, setLoading] = useState(!student);
  const pagerRef = useRef<PagerView>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [activeBusPage, setActiveBusPage] = useState(0);

  const fetchDashboardCounts = useCallback(async () => {
    try {
      const res = await api.get('/students/dashboard/counts');
      setDashboardCounts(res.data);
    } catch (e) { }
  }, [setDashboardCounts]);

  const loadUserData = useCallback(async () => {
    try {
      const data = await fetchUserData();
      setStudentData(data);
      setLastSynced(Date.now());
      fetchDashboardCounts();
    } catch (error) {} finally { setLoading(false); }
  }, [setStudentData, setLastSynced, fetchDashboardCounts]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get('/notifications/student');
      setUnreadCount(res.data.length);
    } catch (error) {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserData(); fetchUnreadCount();
      const unsubLaundry = subscribeToLaundry(setLaundrySettings);
      const unsubMenu = subscribeToMenu(setMessMenu);
      const unsubBus = subscribeToBusTimings(setBusRoutes);
      const updateListener = DeviceEventEmitter.addListener('profileUpdated', loadUserData);
      return () => { unsubLaundry(); unsubMenu(); unsubBus(); updateListener.remove(); };
    }, [loadUserData, fetchUnreadCount, setLaundrySettings, setMessMenu, setBusRoutes])
  );

  const { refreshing, onRefresh } = useRefresh(async () => {
    await Promise.all([ loadUserData(), fetchLaundrySettings().then(setLaundrySettings), fetchMenu().then(setMessMenu), fetchUnreadCount(), fetchDashboardCounts() ]);
  });

  const getGreeting = () => {
    const hour = getCurrentTimeInCountry().getHours();
    if (hour < 5) return 'Good Night';
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getUpcomingMeal = () => {
    const nowCountry = getCurrentTimeInCountry();
    const today = nowCountry.toLocaleDateString('en-US', { weekday: 'long' });
    const dayMenu = fullMenu?.[today];
    if (!dayMenu) return { type: 'Menu', foodItems: [], soon: false, time: '' };

    const currentMinutes = nowCountry.getHours() * 60 + nowCountry.getMinutes();
    const defaultTimings: Record<string, string> = { breakfast: '8:00 AM - 9:30 AM', lunch: '12:30 PM - 2:30 PM', snacks: '5:30 PM - 6:30 PM', dinner: '8:30 PM - 9:30 PM' };
    const timings = dayMenu.timings || defaultTimings;

    const parseToMinutes = (timeStr: string) => {
      if (!timeStr) return 0;
      const [time, period] = timeStr.trim().split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return hours * 60 + (minutes || 0);
    };

    const meals = [
      { type: 'Breakfast', key: 'breakfast', food: dayMenu.breakfast }, { type: 'Lunch', key: 'lunch', food: dayMenu.lunch },
      { type: 'Snacks', key: 'snacks', food: dayMenu.snacks }, { type: 'Dinner', key: 'dinner', food: dayMenu.dinner }
    ];

    for (const meal of meals) {
      const timingRange = (timings as any)[meal.key] || (defaultTimings as any)[meal.key];
      const [startStr, endStr] = timingRange.split('-').map((s: string) => s.trim());
      const endMinutes = parseToMinutes(endStr);
      if (currentMinutes < endMinutes) {
        return { type: meal.type, foodItems: meal.food || [], soon: currentMinutes >= parseToMinutes(startStr) - 60 && currentMinutes < parseToMinutes(startStr), time: timingRange };
      }
    }
    return { type: 'Breakfast', foodItems: dayMenu.breakfast || [], soon: false, time: timings.breakfast || defaultTimings.breakfast };
  };

  if (loading && !student) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeBg }]}>
        <ActivityIndicator size="large" color={textMain} />
        <AppText style={[styles.loadingText, { color: textMuted }]}>Loading Dashboard...</AppText>
      </View>
    );
  }

  if (!student && !loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeBg }]}>
        <MaterialCommunityIcons name="wifi-off" size={48} color={textMuted} />
        <AppText style={[styles.loadingText, { color: textMain, marginTop: 16, fontSize: 18, fontWeight: '600' }]}>Connection Failed</AppText>
        <AppText style={{ color: textMuted, marginBottom: 24, textAlign: 'center', maxWidth: '80%' }}>Could not reach the server. Please check your WiFi connection.</AppText>
        <TouchableOpacity onPress={loadUserData} style={{ backgroundColor: isDark ? '#FFFFFF' : '#111111', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}>
          <AppText style={{ color: isDark ? '#000000' : '#FFFFFF', fontWeight: '600' }}>Retry</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeBg }]}>
      <LinearGradient colors={themeGradient as any} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={textMain} />}>
        {/* TOP HERO SECTION */}
        <View style={[styles.heroWrapper, { backgroundColor: themeBg, paddingBottom: 0, zIndex: 10 }]}>
          <Animated.View style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '12.5%', backgroundColor: themeBg, borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
            shadowColor: isDark ? '#FFD700' : '#000000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: isDark ? 0.8 : 0.1, shadowRadius: isDark ? 24 : 20, elevation: isDark ? 24 : 10
          }} />
          <LinearGradient
            colors={heroGradient as any}
            style={[styles.heroGradient, { paddingBottom: 12, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <LinearGradient colors={[overlayGlass, 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.5 }} />

            <Animated.View style={[{ position: 'absolute', bottom: 0, width: width * 4, height: 40, flexDirection: 'row', opacity: skylineOpacity }, skylineStyle]}>
              <View style={{ width: width * 2, height: '100%', position: 'absolute', left: 0 }}>
                <MaterialCommunityIcons name="city" size={38} color={textMain} style={{ position: 'absolute', bottom: 2, left: '2%' }} />
                <MaterialCommunityIcons name="home" size={16} color={textMain} style={{ position: 'absolute', bottom: 2, left: '8%' }} />
                <MaterialCommunityIcons name="pine-tree" size={24} color={textMain} style={{ position: 'absolute', bottom: 2, left: '18%' }} />
                <MaterialCommunityIcons name="office-building" size={34} color={textMain} style={{ position: 'absolute', bottom: 2, left: '22%' }} />
                <MaterialCommunityIcons name="home-group" size={22} color={textMain} style={{ position: 'absolute', bottom: 2, left: '35%' }} />
                <MaterialCommunityIcons name="city-variant" size={44} color={textMain} style={{ position: 'absolute', bottom: 2, left: '46%' }} />
                <MaterialCommunityIcons name="home-city" size={28} color={textMain} style={{ position: 'absolute', bottom: 2, left: '53%' }} />
              </View>
              <View style={{ width: width * 2, height: '100%', position: 'absolute', left: width * 2 }}>
                <MaterialCommunityIcons name="city" size={38} color={textMain} style={{ position: 'absolute', bottom: 2, left: '2%' }} />
                <MaterialCommunityIcons name="home" size={16} color={textMain} style={{ position: 'absolute', bottom: 2, left: '8%' }} />
                <MaterialCommunityIcons name="pine-tree" size={24} color={textMain} style={{ position: 'absolute', bottom: 2, left: '18%' }} />
                <MaterialCommunityIcons name="office-building" size={34} color={textMain} style={{ position: 'absolute', bottom: 2, left: '22%' }} />
                <MaterialCommunityIcons name="home-group" size={22} color={textMain} style={{ position: 'absolute', bottom: 2, left: '35%' }} />
                <MaterialCommunityIcons name="city-variant" size={44} color={textMain} style={{ position: 'absolute', bottom: 2, left: '46%' }} />
                <MaterialCommunityIcons name="home-city" size={28} color={textMain} style={{ position: 'absolute', bottom: 2, left: '53%' }} />
              </View>
            </Animated.View>

            <SafeAreaView edges={['top']} style={styles.safeArea}>
              <View style={[styles.headerTop, { width: '100%' }]}>
                <View style={[styles.topRow, { width: '100%', alignItems: 'center' }]}>
                  <Pressable onPress={() => router.push('/profile')} style={[styles.premiumProfileFrame, { borderColor: cardBorder, backgroundColor: overlayGlass }]}>
                    <View style={styles.avatar}>
                      {student?.profilePhoto ? (
                        <Image source={{ uri: student.profilePhoto.startsWith('http') ? student.profilePhoto : `${API_BASE_URL}${student.profilePhoto}` }} style={{ width: '100%', height: '100%', borderRadius: 28 }} contentFit="cover" cachePolicy="none" />
                      ) : (
                        <AppText style={styles.avatarText}>{student?.fullName ? student.fullName.charAt(0).toUpperCase() : 'S'}</AppText>
                      )}
                    </View>
                  </Pressable>

                  <View style={{ flex: 1, marginLeft: 12, gap: 0 }}>
                    <AppText style={[styles.greetingText, { color: textMuted }]}>{getGreeting()},</AppText>
                    <AppText style={[styles.userNameText, { color: textMain }]} numberOfLines={1} adjustsFontSizeToFit>{student?.fullName?.split(' ')[0]}</AppText>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <AnimatedThemeToggle isDark={isDark} toggleTheme={toggleTheme} textMain={textMain} />
                    <Pressable style={styles.glassHeaderBtn} onPress={() => setNotificationVisible(true)}>
                      <Ionicons name="notifications-outline" size={20} color={textMain} />
                      {unreadCount > 0 && <View style={[styles.premiumNotificationBadge, { backgroundColor: textMain, borderColor: themeBg }]} />}
                    </Pressable>
                  </View>
                </View>

                <View style={{ marginLeft: 72, marginTop: -2 }}>
                  {student?.hostelName && (
                    <View style={styles.inlineHostelRow}>
                      <MaterialCommunityIcons name="office-building" size={14} color={textMain} />
                      <AppText style={[styles.inlineHostelName, { color: textMain }]} numberOfLines={1} adjustsFontSizeToFit>{student.hostelName}</AppText>
                    </View>
                  )}
                  <View style={styles.leftStatusRow}>
                    <View style={styles.leftStatusItem}>
                      <MaterialCommunityIcons name="door-closed" size={14} color={textMuted} />
                      <AppText style={[styles.leftStatusText, { color: textMuted }]}>Room {student?.roomNo || '--'}</AppText>
                    </View>
                    <View style={[styles.leftStatusDivider, { backgroundColor: cardBorder }]} />
                    <View style={styles.leftStatusItem}>
                      <MaterialCommunityIcons name="check-decagram" size={14} color={student?.status === 'active' ? textMain : textMuted} />
                      <AppText style={[styles.leftStatusText, { color: student?.status === 'active' ? textMain : textMuted }]}>{student?.status === 'active' ? 'ACTIVE' : 'INACTIVE'}</AppText>
                    </View>
                  </View>
                </View>
              </View>
            </SafeAreaView>
          </LinearGradient>
        </View>

        {/* LIVE STATUS CARDS */}
        <View style={[styles.essentialsSectionWrapper, { marginTop: 0 }]}>
          <View style={styles.essentialsGrid}>
            {/* BUS CARD */}
            {busRoutes.length > 0 ? (() => {
              const loopedRoutes = busRoutes.length > 1 ? [busRoutes[busRoutes.length - 1], ...busRoutes, busRoutes[0]] : busRoutes;
              return (
                <Animated.View style={{ marginHorizontal: -20, marginBottom: 16, position: 'relative', elevation: isDark ? 24 : 10, shadowColor: isDark ? '#00E5FF' : '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.8 : 0.1, shadowRadius: isDark ? 24 : 16, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, backgroundColor: cardBg, overflow: 'hidden' }}>
                  <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, overflow: 'hidden' }} pointerEvents="none">
                    <Animated.View style={[{ position: 'absolute', bottom: 0, width: width * 4, height: '100%', flexDirection: 'row' }, driftStyle]}>
                      <View style={{ width: width * 2, height: '100%', justifyContent: 'flex-end' }}><Animated.View style={[{ paddingBottom: 0, marginBottom: -4, paddingLeft: width * 1.5 }, busBreathingStyle]}><CustomBusIcon /></Animated.View></View>
                      <View style={{ width: width * 2, height: '100%', justifyContent: 'flex-end' }}><Animated.View style={[{ paddingBottom: 0, marginBottom: -4, paddingLeft: width * 1.5 }, busBreathingStyle]}><CustomBusIcon /></Animated.View></View>
                    </Animated.View>
                  </View>
                  <PagerView
                    ref={pagerRef} style={{ height: 110 }} initialPage={busRoutes.length > 1 ? 1 : 0}
                    onPageSelected={(e: any) => {
                      const pos = e.nativeEvent.position;
                      if (busRoutes.length > 1) {
                        if (pos === 0) setActiveBusPage(busRoutes.length - 1);
                        else if (pos === loopedRoutes.length - 1) setActiveBusPage(0);
                        else setActiveBusPage(pos - 1);
                      } else setActiveBusPage(pos);
                    }}
                    onPageScrollStateChanged={(e: any) => {
                      if (e.nativeEvent.pageScrollState === 'idle' && busRoutes.length > 1) {
                        if (activeBusPage === busRoutes.length - 1) pagerRef.current?.setPageWithoutAnimation(busRoutes.length);
                        else if (activeBusPage === 0) pagerRef.current?.setPageWithoutAnimation(1);
                      }
                    }}
                  >
                    {loopedRoutes.map((route: any, index: number) => {
                      const todayStr = new Date().toLocaleDateString('en-CA');
                      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); const tomorrowStr = tomorrow.toLocaleDateString('en-CA');
                      const routeDateStr = route.valid_date ? new Date(route.valid_date).toLocaleDateString('en-CA') : null;
                      const isFuture = routeDateStr && routeDateStr > todayStr;
                      const now = new Date(); const currentMinutes = now.getHours() * 60 + now.getMinutes();
                      const sortedTimes = (route.times || []).sort();
                      const futureTimes = sortedTimes.filter((t: string) => { const [h, m] = t.split(':').map(Number); return (h * 60 + m) > currentMinutes; });
                      const mainTime = isFuture ? sortedTimes[0] : (futureTimes[0] || sortedTimes[0]);
                      const frequencyLabel = route.schedule_type?.toLowerCase() === 'everyday' ? 'DAILY' : (routeDateStr === todayStr ? 'TODAY' : (routeDateStr === tomorrowStr ? 'TOMORROW' : (route.schedule_type ? route.schedule_type.toUpperCase() : 'SERVICE')));
                      return (
                        <View key={index} style={{ paddingHorizontal: 0, paddingVertical: 0 }}>
                          <Pressable style={({ pressed }) => [{ overflow: 'hidden', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }, pressed && { opacity: 0.95 }]} onPress={() => router.push('/bustimings')}>
                            <View style={{ paddingHorizontal: 46, paddingVertical: 10, height: 110, flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}>
                              <View style={{ flex: 1 }}>
                                <AppText style={{ fontSize: 10, fontWeight: '900', color: textAccent, letterSpacing: 1.2, marginBottom: 4 }}>BUS SCHEDULE</AppText>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                  <View style={{ backgroundColor: overlayGlass, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                                    <AppText style={{ fontSize: 9, fontWeight: '800', color: textMain, letterSpacing: 1 }}>{frequencyLabel}</AppText>
                                  </View>
                                  {futureTimes.length === 0 && !isFuture && <AppText style={{ fontSize: 9, fontWeight: '700', color: '#EF4444' }}>ENDED</AppText>}
                                </View>
                                <AppText style={{ fontSize: 18, fontWeight: '800', color: textMain, lineHeight: 20 }}>{route.route}</AppText>
                                {!!route.message && <AppText style={{ fontSize: 10, fontWeight: '700', color: textMuted, marginTop: 2 }} numberOfLines={1}><MaterialCommunityIcons name="information" size={10} /> {route.message}</AppText>}
                              </View>
                              <View style={{ alignItems: 'flex-end', gap: 2, justifyContent: 'center' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', opacity: 0.6, marginBottom: 8 }}>
                                  <AppText style={{ fontSize: 8, fontWeight: '800', color: textMuted, textTransform: 'uppercase' }}>Tap for Details </AppText>
                                  <MaterialCommunityIcons name="gesture-tap" size={10} color={textMuted} />
                                </View>
                                <AppText style={{ fontSize: 9, fontWeight: '800', color: textAccent, textTransform: 'uppercase', letterSpacing: 0.5 }}>Next Departure</AppText>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <MaterialCommunityIcons name="clock-outline" size={16} color={textMain} />
                                  <AppText style={{ fontSize: 24, fontWeight: '900', color: textMain }}>{mainTime || '--:--'}</AppText>
                                </View>
                              </View>
                            </View>
                          </Pressable>
                        </View>
                      );
                    })}
                  </PagerView>
                  {busRoutes.length > 1 && (
                    <>
                      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 4, marginBottom: 12 }}>
                        {busRoutes.map((_: any, i: number) => (
                          <View key={i} style={{ width: i === activeBusPage ? 14 : 6, height: 6, borderRadius: 3, backgroundColor: textMain, opacity: i === activeBusPage ? 1 : 0.2 }} />
                        ))}
                      </View>
                      <Pressable style={{ position: 'absolute', left: 4, top: 42, backgroundColor: overlayGlass, borderRadius: 20, padding: 4 }} onPress={() => pagerRef.current?.setPage((activeBusPage === 0 ? busRoutes.length : activeBusPage) - 1)}>
                        <MaterialCommunityIcons name="chevron-left" size={24} color={textMain} />
                      </Pressable>
                      <Pressable style={{ position: 'absolute', right: 4, top: 42, backgroundColor: overlayGlass, borderRadius: 20, padding: 4 }} onPress={() => pagerRef.current?.setPage(activeBusPage === busRoutes.length - 1 ? 1 : activeBusPage + 2)}>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={textMain} />
                      </Pressable>
                    </>
                  )}
                </Animated.View>
              )
            })() : (
              <Pressable
                style={({ pressed }) => [{ marginHorizontal: -20, marginBottom: 16, height: 110, alignItems: 'center', justifyContent: 'center', backgroundColor: cardBg, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, elevation: 6, shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 }, pressed && { opacity: 0.95 }]}
                onPress={() => router.push('/bustimings')}
              >
                <MaterialCommunityIcons name="bus-alert" size={36} color={textMuted} style={{ opacity: 0.7, marginBottom: 12 }} />
                <AppText style={{ fontSize: 16, fontWeight: '900', color: textMain, letterSpacing: 0.5 }}>NO ROUTES ADDED</AppText>
                <AppText style={{ fontSize: 12, fontWeight: '600', color: textMuted, opacity: 0.7, marginTop: 4 }}>Tap to view full bus schedule</AppText>
              </Pressable>
            )}

            {/* MESS & LAUNDRY CARDS */}
            <View style={[styles.gridRow, { marginTop: -4 }]}>
              <View style={styles.gridItemFlexible}>
                <Pressable
                  style={({ pressed }) => [styles.premiumServiceCard, { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, overflow: 'hidden' }, pressed && styles.premiumCardPressed]}
                  onPress={() => router.push({ pathname: '/mess', params: { tab: 'menu', day: new Date().toLocaleDateString('en-US', { weekday: 'long' }), target: getUpcomingMeal().type.toLowerCase() } })}
                >
                  <Animated.View style={[{ position: 'absolute', right: -20, bottom: -20, opacity: 0.12 }, cardIconStyle]}>
                    <MaterialCommunityIcons name="silverware-fork-knife" size={110} color={'#FDBA74'} />
                  </Animated.View>
                  <View style={{ gap: 4 }}>
                    <AppText style={[styles.serviceLabel, { color: textMain, fontSize: 17, marginBottom: 0 }]}>Mess Menu</AppText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                      <AppText style={[styles.modernBadgeText, { color: textMuted, fontSize: 10, fontWeight: '900' }]}>{getUpcomingMeal().type.toUpperCase()}</AppText>
                      <AppText style={{ fontSize: 11, fontWeight: '700', color: textAccent }}>• {getUpcomingMeal().time}</AppText>
                    </View>
                    <AppText style={{ color: textMuted, fontSize: 12, fontWeight: '600', lineHeight: 16 }} numberOfLines={2}>
                      {getUpcomingMeal().foodItems?.length > 0 ? getUpcomingMeal().foodItems.map((item: any, idx: number, arr: any[]) => (
                        <AppText key={idx} style={item.highlight ? { color: textMain, fontWeight: 'bold' } : {}}>{item.dish}{idx < arr.length - 1 ? ', ' : ''}</AppText>
                      )) : 'Not Available'}
                    </AppText>
                  </View>
                </Pressable>
              </View>

              <View style={styles.gridItemFlexible}>
                <Pressable
                  style={({ pressed }) => [styles.premiumServiceCard, { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, overflow: 'hidden' }, pressed && styles.premiumCardPressed]}
                  onPress={() => router.push('/laundry-request')}
                >
                  <Animated.View style={[{ position: 'absolute', right: -20, bottom: -20, opacity: 0.12 }, cardIconStyle]}>
                    <MaterialCommunityIcons name="washing-machine" size={110} color={'#67E8F9'} />
                  </Animated.View>
                  <View style={{ gap: 4 }}>
                    <AppText style={[styles.serviceLabel, { color: textMain, fontSize: 17, marginBottom: 0 }]}>Laundry</AppText>
                    <View style={{ gap: 2 }}>
                      <AppText style={[styles.modernBadgeText, { color: textMuted, fontSize: 10, fontWeight: '900', alignSelf: 'flex-start' }]}>{(laundry?.status === 'On Schedule' ? 'On Time' : (laundry?.status || 'Active')).toUpperCase()}</AppText>
                      <AppText style={{ fontSize: 11, fontWeight: '700', color: textAccent }}>{laundry?.pickupTime ? `${laundry.pickupTime} ${laundry.pickupPeriod.slice(0, 2)} ` : '--:--'}</AppText>
                    </View>
                    <AppText style={{ color: textMuted, fontSize: 12, fontWeight: '600', lineHeight: 16 }} numberOfLines={2}>Next: {laundry?.pickupDay || 'TBD'}</AppText>
                  </View>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* CAMPUS SERVICES */}
        <View style={styles.servicesSectionWrapper}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 12, paddingHorizontal: 16 }}>
            <View style={{ width: 4, height: 16, backgroundColor: textMain, borderRadius: 2, marginRight: 8 }} />
            <AppText style={{ fontSize: 16, fontWeight: '900', letterSpacing: 0.5, color: textMain, textTransform: 'uppercase' }}>Campus Services</AppText>
          </View>

          <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
            <View style={{ flexDirection: 'column', gap: 10 }}>
              {/* ROW 1 */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Animated.View style={{ flex: 1, aspectRatio: 1, backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder, borderRadius: 16, overflow: 'hidden' }}>
                  <Pressable style={({ pressed }) => [{ flex: 1, justifyContent: 'center', alignItems: 'center' }, pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] }]} onPress={() => router.push('/complaints')}>
                    {({ pressed }) => (
                      <>
                        <MaterialCommunityIcons name="alert-circle-outline" size={80} color={'#EF4444'} style={{ position: 'absolute', right: -12, bottom: -12, opacity: 0.15, transform: [{ scale: pressed ? 1.2 : 1 }] }} />
                        <AppText style={{ color: textMain, fontSize: 14, fontWeight: '700' }}>Complaints</AppText>
                        <AppText style={{ color: textMuted, fontSize: 11, fontWeight: '500', marginTop: 4 }}>{totalComplaints} total</AppText>
                      </>
                    )}
                  </Pressable>
                </Animated.View>

                <Animated.View style={{ flex: 1, aspectRatio: 1, backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder, borderRadius: 16, overflow: 'hidden' }}>
                  <Pressable style={({ pressed }) => [{ flex: 1, justifyContent: 'center', alignItems: 'center' }, pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] }]} onPress={() => router.push('/leave-request')}>
                    {({ pressed }) => (
                      <>
                        <MaterialCommunityIcons name="wallet-travel" size={80} color={'#10B981'} style={{ position: 'absolute', right: -12, bottom: -12, opacity: 0.15, transform: [{ scale: pressed ? 1.2 : 1 }] }} />
                        <AppText style={{ color: textMain, fontSize: 14, fontWeight: '700' }}>Leaves</AppText>
                        <AppText style={{ color: textMuted, fontSize: 11, fontWeight: '500', marginTop: 4 }}>{totalLeaves} total</AppText>
                      </>
                    )}
                  </Pressable>
                </Animated.View>

                <Animated.View style={{ flex: 1, aspectRatio: 1, backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder, borderRadius: 16, overflow: 'hidden' }}>
                  <Pressable style={({ pressed }) => [{ flex: 1, justifyContent: 'center', alignItems: 'center' }, pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] }]} onPress={() => router.push('/my-visitors')}>
                    {({ pressed }) => (
                      <>
                        <MaterialCommunityIcons name="account-group" size={80} color={'#8B5CF6'} style={{ position: 'absolute', right: -12, bottom: -12, opacity: 0.15, transform: [{ scale: pressed ? 1.2 : 1 }] }} />
                        <AppText style={{ color: textMain, fontSize: 14, fontWeight: '700' }}>Visitors</AppText>
                        <AppText style={{ color: textMuted, fontSize: 11, fontWeight: '500', marginTop: 4 }}>{totalVisitors} total</AppText>
                      </>
                    )}
                  </Pressable>
                </Animated.View>
              </View>

              {/* ROW 2 */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Animated.View style={{ flex: 1, aspectRatio: 1, backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder, borderRadius: 16, overflow: 'hidden' }}>
                  <Pressable style={({ pressed }) => [{ flex: 1, justifyContent: 'center', alignItems: 'center' }, pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] }]} onPress={() => router.push('/roomservice')}>
                    {({ pressed }) => (
                      <>
                        <MaterialCommunityIcons name="broom" size={80} color={'#EAB308'} style={{ position: 'absolute', right: -12, bottom: -12, opacity: 0.15, transform: [{ scale: pressed ? 1.2 : 1 }] }} />
                        <AppText style={{ color: textMain, fontSize: 14, fontWeight: '700' }}>Services</AppText>
                        <AppText style={{ color: textMuted, fontSize: 11, fontWeight: '500', marginTop: 4 }}>Cleanup</AppText>
                      </>
                    )}
                  </Pressable>
                </Animated.View>

                <Animated.View style={{ flex: 1, aspectRatio: 1, backgroundColor: cardBg, borderWidth: 1, borderColor: cardBorder, borderRadius: 16, overflow: 'hidden' }}>
                  <Pressable style={({ pressed }) => [{ flex: 1, justifyContent: 'center', alignItems: 'center' }, pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] }]} onPress={() => router.push('/about')}>
                    {({ pressed }) => (
                      <>
                        <MaterialCommunityIcons name="office-building" size={80} color={'#3B82F6'} style={{ position: 'absolute', right: -12, bottom: -12, opacity: 0.15, transform: [{ scale: pressed ? 1.2 : 1 }] }} />
                        <AppText style={{ color: textMain, fontSize: 14, fontWeight: '700' }}>About</AppText>
                        <AppText style={{ color: textMuted, fontSize: 11, fontWeight: '500', marginTop: 4 }}>{totalFacilities} facilities</AppText>
                      </>
                    )}
                  </Pressable>
                </Animated.View>

                <View style={{ flex: 1 }} />
              </View>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Floating Action Button for AI Chat */}
      <TouchableOpacity 
        style={[styles.aiFab, { backgroundColor: textMain }]}
        onPress={() => router.push('/ai-chat')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={isDark ? ['#333333', '#1a1a1a'] : ['#E2E8F0', '#FFFFFF']}
          style={styles.aiFabGradient}
        >
          <MaterialCommunityIcons name="robot-outline" size={28} color={isDark ? "#FFFFFF" : "#000000"} />
        </LinearGradient>
      </TouchableOpacity>

      <StudentNotificationOverlay
        visible={notificationVisible}
        onClose={() => setNotificationVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  aiFab: {
    position: 'absolute',
    bottom: 85,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  aiFabGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  heroWrapper: {
    paddingBottom: 20,
  },
  heroGradient: {
    paddingBottom: 12,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
  },
  safeArea: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  headerTop: {
    marginBottom: 4,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  premiumProfileFrame: {
    borderRadius: 32,
    padding: 3,
    borderWidth: 1,
    elevation: 4,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#000000',
    fontSize: 22,
    fontWeight: '800',
  },
  greetingText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 0,
  },
  userNameText: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  inlineHostelName: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  inlineHostelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  leftStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 0,
  },
  leftStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  leftStatusText: {
    fontSize: 13,
    fontWeight: '800',
  },
  leftStatusDivider: {
    width: 1,
    height: 12,
  },
  glassHeaderBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
  },
  premiumNotificationBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    elevation: 4,
  },
  essentialsSectionWrapper: {
    paddingHorizontal: 20,
    marginTop: -28,
    zIndex: 1,
  },
  servicesSectionWrapper: {
    paddingHorizontal: 20,
    marginTop: 24,
    paddingBottom: 0,
  },
  essentialsGrid: {
    flexDirection: 'column',
    gap: 8,
  },
  modernBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 14,
  },
  gridItemFlexible: {
    flex: 1,
  },
  premiumServiceCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    minHeight: 110,
    justifyContent: 'flex-start',
  },
  premiumCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  serviceLabel: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 2,
  }
});
