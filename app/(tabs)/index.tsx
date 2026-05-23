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
  useAnimatedStyle,
  useDerivedValue,
  withSpring
} from 'react-native-reanimated';
import { useRefresh } from '../../hooks/useRefresh';
import api, { API_BASE_URL } from '../../utils/api';
import { fetchLaundrySettings, subscribeToLaundry } from '../../utils/laundrySyncUtils';
import { fetchMenu, subscribeToMenu } from '../../utils/messSyncUtils';

import PagerView from 'react-native-pager-view';
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

const AnimatedThemeToggle = ({ isDark, toggleTheme }: { isDark: boolean, toggleTheme: () => void }) => {
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
        { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)' }
      ]}
      onPress={toggleTheme}
      activeOpacity={0.8}
    >
      <Animated.View style={rStyle}>
        <MaterialCommunityIcons
          name={isDark ? "weather-sunny" : "weather-night"}
          size={24}
          color={isDark ? "#fbbf24" : "#004e92"}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const { width } = Dimensions.get('window');
const SPACING = 20;

export default function Index() {
  const router = useRouter();
  const { colors, isDark, toggleTheme } = useTheme();

  // Dashboard Store
  const {
    studentData: student,
    messMenu: fullMenu,
    laundrySettings: laundry,
    busRoutes,
    dashboardCounts,
    setStudentData,
    setMessMenu,
    setLaundrySettings,
    setBusRoutes,
    setDashboardCounts,
    setLastSynced
  } = useDashboardStore();

  const {
    complaints: pendingComplaints,
    totalComplaints,
    visitors: pendingVisitors,
    totalVisitors,
    roomServices: pendingRoomServices,
    totalRoomServices,
    leaves: pendingLeaves,
    totalLeaves,
    facilities: totalFacilities
  } = dashboardCounts;

  const [loading, setLoading] = useState(!student); // Only show loader if we have NO cached data
  const pagerRef = useRef<PagerView>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [activeBusPage, setActiveBusPage] = useState(0);

  const fetchDashboardCounts = useCallback(async () => {
    try {
      const res = await api.get('/students/dashboard/counts');
      const data = res.data;
      setDashboardCounts({
        complaints: data.complaints || 0,
        totalComplaints: data.totalComplaints || 0,
        visitors: data.visitors || 0,
        totalVisitors: data.totalVisitors || 0,
        roomServices: data.roomServices || 0,
        totalRoomServices: data.totalRoomServices || 0,
        leaves: data.leaves || 0,
        totalLeaves: data.totalLeaves || 0,
        facilities: data.facilities || 0,
      });
    } catch (e) {
      console.error("Failed to fetch dashboard counts:", e);
    }
  }, [setDashboardCounts]);

  const loadUserData = useCallback(async () => {
    try {
      const data = await fetchUserData();
      setStudentData(data);
      setLastSynced(Date.now());
      fetchDashboardCounts();
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  }, [setStudentData, setLastSynced, fetchDashboardCounts]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get('/notifications/student');
      setUnreadCount(res.data.length);
    } catch (error) {
      console.error('Failed to fetch notification count:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
      fetchUnreadCount();

      const unsubscribeLaundry = subscribeToLaundry(setLaundrySettings);
      const unsubscribeMenu = subscribeToMenu(setMessMenu);
      const unsubscribeBus = subscribeToBusTimings(setBusRoutes);

      const updateListener = DeviceEventEmitter.addListener('profileUpdated', () => {
        loadUserData();
      });

      return () => {
        unsubscribeLaundry();
        unsubscribeMenu();
        unsubscribeBus();
        updateListener.remove();
      };
    }, [loadUserData, fetchUnreadCount, setLaundrySettings, setMessMenu, setBusRoutes])
  );

  const { refreshing, onRefresh } = useRefresh(async () => {
    await Promise.all([
      loadUserData(),
      fetchLaundrySettings().then(setLaundrySettings),
      fetchMenu().then(setMessMenu),
      fetchUnreadCount(),
      fetchDashboardCounts()
    ]);
  });

  const handleClearNotifications = async () => {
    try {
      const res = await api.post('/students/profile/notifications/clear');
      if (res.data.success) {
        setStudentData(student ? ({ ...student, lastNotificationsClearedAt: res.data.timestamp }) : null);
      }
    } catch (e) {
      console.error("Failed to clear notifications", e);
    }
  };

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

    const defaultTimings: Record<string, string> = {
      breakfast: '8:00 AM - 9:30 AM',
      lunch: '12:30 PM - 2:30 PM',
      snacks: '5:30 PM - 6:30 PM',
      dinner: '8:30 PM - 9:30 PM'
    };

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
      { type: 'Breakfast', key: 'breakfast', food: dayMenu.breakfast },
      { type: 'Lunch', key: 'lunch', food: dayMenu.lunch },
      { type: 'Snacks', key: 'snacks', food: dayMenu.snacks },
      { type: 'Dinner', key: 'dinner', food: dayMenu.dinner }
    ];

    for (const meal of meals) {
      const timingRange = (timings as any)[meal.key] || (defaultTimings as any)[meal.key];
      const [startStr, endStr] = timingRange.split('-').map((s: string) => s.trim());
      const endMinutes = parseToMinutes(endStr);
      const startMinutes = parseToMinutes(startStr);

      if (currentMinutes < endMinutes) {
        return {
          type: meal.type,
          foodItems: meal.food || [],
          soon: currentMinutes >= startMinutes - 60 && currentMinutes < startMinutes,
          time: timingRange
        };
      }
    }

    return {
      type: 'Breakfast',
      foodItems: dayMenu.breakfast || [],
      soon: false,
      time: timings.breakfast || defaultTimings.breakfast
    };
  };

  const getNextDeparture = (times: string[]) => {
    if (!times || times.length === 0) return '--:--';
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const futureTimes = times
      .map(t => {
        const [h, m] = t.split(':').map(Number);
        return { original: t, minutes: h * 60 + m };
      })
      .filter(t => t.minutes > currentMinutes)
      .sort((a, b) => a.minutes - b.minutes);

    if (futureTimes.length > 0) return futureTimes[0].original;
    return times.sort()[0];
  };

  const getInitial = (name?: string) => name ? name.charAt(0).toUpperCase() : 'S';

  if (loading && !student) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText style={[styles.loadingText, { color: colors.textSecondary }]}>Loading Dashboard...</AppText>
      </View>
    );
  }

  if (!student && !loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="wifi-off" size={48} color={isDark ? '#94a3b8' : '#64748b'} />
        <AppText style={[styles.loadingText, { color: colors.text, marginTop: 16, fontSize: 18, fontWeight: '600' }]}>
          Connection Failed
        </AppText>
        <AppText style={{ color: colors.textSecondary, marginBottom: 24, textAlign: 'center', maxWidth: '80%' }}>
          Could not reach the server. Please check your WiFi connection.
        </AppText>
        <TouchableOpacity
          onPress={loadUserData}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
          }}
        >
          <AppText style={{ color: '#fff', fontWeight: '600' }}>Retry</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Removed overlapping diamond QuickAction in favor of Bento grid inline blocks.

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={busRoutes.length > 0
          ? (isDark ? ['#1E293B', '#334155'] : ['#F8FAFC', '#F1F5F9'])
          : [colors.background, colors.background]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#fff" : colors.primary} colors={[colors.primary]} />}
      >
        {/* TOP HERO SECTION */}
        {/* TOP HERO SECTION */}
        <View style={[styles.heroWrapper, { backgroundColor: isDark ? '#451A03' : '#FBBF24', paddingBottom: 0 }]}>
          <LinearGradient
            colors={isDark ? ['#020617', '#0F172A', '#1E1B4B'] : ['#000B18', '#003366', '#004e92']}
            style={[styles.heroGradient, { paddingBottom: 12, borderBottomLeftRadius: 36, borderBottomRightRadius: 36 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Subtle Top-Down Shimmer Overlay */}
            <LinearGradient
              colors={['rgba(255,255,255,0.05)', 'transparent']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.5 }}
            />
            <SafeAreaView edges={['top']} style={styles.safeArea}>
              <View style={[styles.headerTop, { width: '100%' }]}>
                <View style={[styles.topRow, { width: '100%', alignItems: 'center' }]}>
                  <Pressable onPress={() => router.push('/profile')} style={styles.premiumProfileFrame}>
                    <View style={styles.avatar}>
                      {student?.profilePhoto ? (
                        <Image
                          source={{ uri: student.profilePhoto.startsWith('http') ? student.profilePhoto : `${API_BASE_URL}${student.profilePhoto}` }}
                          style={{ width: '100%', height: '100%', borderRadius: 28 }}
                          contentFit="cover"
                          cachePolicy="none"
                        />
                      ) : (
                        <AppText style={styles.avatarText}>{getInitial(student?.fullName)}</AppText>
                      )}
                    </View>
                  </Pressable>

                  <View style={{ flex: 1, marginLeft: 12, gap: 0 }}>
                    <AppText style={styles.greetingText}>{getGreeting()},</AppText>
                    <AppText style={[styles.userNameText, { fontSize: 24, marginBottom: 0 }]} numberOfLines={1} adjustsFontSizeToFit>
                      {student?.fullName?.split(' ')[0]}
                    </AppText>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <AnimatedThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
                    <Pressable style={styles.glassHeaderBtn} onPress={() => setNotificationVisible(true)}>
                      <Ionicons name="notifications" size={20} color="#fff" />
                      {unreadCount > 0 && (
                        <View style={styles.premiumNotificationBadge} />
                      )}
                    </Pressable>
                  </View>
                </View>

                {/* Identity Block Indented under Name */}
                <View style={{ marginLeft: 72, marginTop: -2 }}>
                  {student?.hostelName && (
                    <View style={styles.inlineHostelRow}>
                      <MaterialCommunityIcons name="office-building" size={14} color="#BAE6FD" />
                      <AppText style={styles.inlineHostelName} numberOfLines={1} adjustsFontSizeToFit>
                        {student.hostelName}
                      </AppText>
                    </View>
                  )}

                  <View style={styles.leftStatusRow}>
                    <View style={styles.leftStatusItem}>
                      <MaterialCommunityIcons name="door-closed" size={14} color="#BAE6FD" />
                      <AppText style={styles.leftStatusText}>Room {student?.roomNo || '--'}</AppText>
                    </View>
                    <View style={styles.leftStatusDivider} />
                    <View style={styles.leftStatusItem}>
                      <MaterialCommunityIcons
                        name="check-decagram"
                        size={14}
                        color={student?.status === 'active' ? '#4ADE80' : '#EF4444'}
                      />
                      <AppText style={[styles.leftStatusText, {
                        color: student?.status === 'active' ? '#86EFAC' : '#FCA5A5',
                      }]}>
                        {student?.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                      </AppText>
                    </View>
                  </View>
                </View>
              </View>
            </SafeAreaView>
          </LinearGradient>
        </View>

        {/* LIVE STATUS CARDS */}
        {/* LIVE STATUS CARDS */}
        {/* DAILY ESSENTIALS - BLUE THEME */}
        <View style={[styles.essentialsSectionWrapper, { marginTop: 0 }]}>
          <View style={styles.essentialsGrid}>
            {/* BUS CARD - 3D Floating Interactive Card */}
            {busRoutes.length > 0 ? (() => {
              const loopedRoutes = busRoutes.length > 1
                ? [busRoutes[busRoutes.length - 1], ...busRoutes, busRoutes[0]]
                : busRoutes;

              return (
                <View style={{ marginHorizontal: -20, marginBottom: 16, position: 'relative', elevation: 12, shadowColor: isDark ? '#000000' : '#D97706', shadowOffset: { width: 0, height: 8 }, shadowOpacity: isDark ? 0.3 : 0.2, shadowRadius: 16, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, backgroundColor: isDark ? '#451A03' : '#FBBF24' }}>
                  <PagerView
                    ref={pagerRef}
                    style={{ height: 110 }}
                    initialPage={busRoutes.length > 1 ? 1 : 0}
                    onPageSelected={(e: any) => {
                      const position = e.nativeEvent.position;
                      if (busRoutes.length > 1) {
                        if (position === 0) {
                          setActiveBusPage(busRoutes.length - 1);
                        } else if (position === loopedRoutes.length - 1) {
                          setActiveBusPage(0);
                        } else {
                          setActiveBusPage(position - 1);
                        }
                      } else {
                        setActiveBusPage(position);
                      }
                    }}
                    onPageScrollStateChanged={(e: any) => {
                      if (e.nativeEvent.pageScrollState === 'idle' && busRoutes.length > 1) {
                        // Silent snap back to actual elements when hitting the cloned edges
                        if (activeBusPage === busRoutes.length - 1) {
                          pagerRef.current?.setPageWithoutAnimation(busRoutes.length);
                        } else if (activeBusPage === 0) {
                          pagerRef.current?.setPageWithoutAnimation(1);
                        }
                      }
                    }}
                  >
                    {loopedRoutes.map((route: any, index: number) => {
                      const todayStr = new Date().toLocaleDateString('en-CA');
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      const tomorrowStr = tomorrow.toLocaleDateString('en-CA');
                      const routeDateStr = route.valid_date ? new Date(route.valid_date).toLocaleDateString('en-CA') : null;
                      const isFuture = routeDateStr && routeDateStr > todayStr;

                      const now = new Date();
                      const currentMinutes = now.getHours() * 60 + now.getMinutes();
                      const sortedTimes = (route.times || []).sort();
                      const futureTimes = sortedTimes.filter((t: string) => {
                        const [h, m] = t.split(':').map(Number);
                        return (h * 60 + m) > currentMinutes;
                      });

                      const mainTime = isFuture ? sortedTimes[0] : (futureTimes[0] || sortedTimes[0]);

                      const frequencyLabel = route.schedule_type?.toLowerCase() === 'everyday' ? 'DAILY' : (routeDateStr === todayStr ? 'TODAY' : (routeDateStr === tomorrowStr ? 'TOMORROW' : (route.schedule_type ? route.schedule_type.toUpperCase() : 'SERVICE')));

                      return (
                        <View key={index} style={{ paddingHorizontal: 0, paddingVertical: 0 }}>
                          <Pressable
                            style={({ pressed }) => [
                              {
                                overflow: 'hidden',
                                borderBottomLeftRadius: 32,
                                borderBottomRightRadius: 32,
                              },
                              pressed && { opacity: 0.95 }
                            ]}
                            onPress={() => router.push('/bustimings')}
                          >
                            <View
                              style={{
                                paddingHorizontal: 46,
                                paddingVertical: 10,
                                height: 110,
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: 'transparent'
                              }}
                            >
                              <View style={{ flex: 1 }}>
                                <AppText style={{ fontSize: 10, fontWeight: '900', color: isDark ? '#FCD34D' : '#92400E', letterSpacing: 1.2, marginBottom: 4 }}>BUS SCHEDULE</AppText>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                  <View style={{ backgroundColor: isDark ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.6)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                                    <AppText style={{ fontSize: 9, fontWeight: '800', color: isDark ? '#FCD34D' : '#B45309', letterSpacing: 1 }}>
                                      {frequencyLabel}
                                    </AppText>
                                  </View>
                                  {futureTimes.length === 0 && !isFuture && (
                                    <AppText style={{ fontSize: 9, fontWeight: '700', color: '#DC2626' }}>ENDED</AppText>
                                  )}
                                </View>
                                <AppText style={{ fontSize: 18, fontWeight: '800', color: isDark ? '#FFFBEB' : '#78350F', lineHeight: 20 }}>
                                  {route.route}
                                </AppText>
                                {!!route.message && (
                                  <AppText style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#FDE68A' : '#B45309', marginTop: 2, opacity: 0.9 }} numberOfLines={1}>
                                    <MaterialCommunityIcons name="information" size={10} /> {route.message}
                                  </AppText>
                                )}
                              </View>

                              <View style={{ alignItems: 'flex-end', gap: 2, justifyContent: 'center' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', opacity: 0.6, marginBottom: 8 }}>
                                  <AppText style={{ fontSize: 8, fontWeight: '800', color: isDark ? '#FFFBEB' : '#78350F', textTransform: 'uppercase' }}>Tap for Details </AppText>
                                  <MaterialCommunityIcons name="gesture-tap" size={10} color={isDark ? '#FFFBEB' : '#78350F'} />
                                </View>
                                <AppText style={{ fontSize: 9, fontWeight: '800', color: isDark ? '#FDE68A' : '#92400E', textTransform: 'uppercase', letterSpacing: 0.5 }}>Next Departure</AppText>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <MaterialCommunityIcons name="clock-outline" size={16} color={isDark ? '#FCD34D' : '#B45309'} />
                                  <AppText style={{ fontSize: 24, fontWeight: '900', color: isDark ? '#FFFBEB' : '#78350F' }}>
                                    {mainTime || '--:--'}
                                  </AppText>
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
                          <View
                            key={i}
                            style={{
                              width: i === activeBusPage ? 14 : 6,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: isDark ? '#FCD34D' : '#FFFBEB',
                              opacity: i === activeBusPage ? 1 : 0.4
                            }}
                          />
                        ))}
                      </View>

                      {/* Navigation Arrows (Cyclic) */}
                      {busRoutes.length > 1 && (
                        <Pressable
                          style={{ position: 'absolute', left: 4, top: 42, backgroundColor: isDark ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.9)', borderRadius: 20, padding: 4, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 }}
                          onPress={() => {
                            const targetVisualPage = activeBusPage === 0 ? busRoutes.length : activeBusPage;
                            pagerRef.current?.setPage(targetVisualPage - 1);
                          }}
                        >
                          <MaterialCommunityIcons name="chevron-left" size={24} color={isDark ? '#FCD34D' : '#D97706'} />
                        </Pressable>
                      )}
                      {busRoutes.length > 1 && (
                        <Pressable
                          style={{ position: 'absolute', right: 4, top: 42, backgroundColor: isDark ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.9)', borderRadius: 20, padding: 4, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 }}
                          onPress={() => {
                            const targetVisualPage = activeBusPage + 1;
                            pagerRef.current?.setPage(targetVisualPage + 1);
                          }}
                        >
                          <MaterialCommunityIcons name="chevron-right" size={24} color={isDark ? '#FCD34D' : '#D97706'} />
                        </Pressable>
                      )}
                    </>
                  )}
                </View>
              )
            })() : (
              <Pressable
                style={({ pressed }) => [
                  {
                    marginHorizontal: -20, marginBottom: 16, height: 110, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#451A03' : '#FBBF24', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, elevation: 12, shadowColor: isDark ? '#000000' : '#D97706', shadowOffset: { width: 0, height: 8 }, shadowOpacity: isDark ? 0.3 : 0.2, shadowRadius: 16
                  },
                  pressed && { opacity: 0.95 }
                ]}
                onPress={() => router.push('/bustimings')}
              >
                <MaterialCommunityIcons name="bus-alert" size={36} color={isDark ? '#FCD34D' : '#92400E'} style={{ opacity: 0.7, marginBottom: 12 }} />
                <AppText style={{ fontSize: 16, fontWeight: '900', color: isDark ? '#FDE68A' : '#92400E', letterSpacing: 0.5 }}>NO ROUTES ADDED</AppText>
                <AppText style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#FCD34D' : '#B45309', opacity: 0.7, marginTop: 4 }}>Tap to view full bus schedule</AppText>
              </Pressable>
            )}

            {/* GRID CONTROLS: MESS & LAUNDRY */}
            <View style={[styles.gridRow, { marginTop: -4 }]}>
              {/* MESS CARD - Grid Style */}
              <View style={styles.gridItemFlexible}>
                <Pressable
                  style={({ pressed }) => [
                    styles.premiumServiceCard,
                    { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#E2E8F0', paddingHorizontal: 16, paddingVertical: 14, overflow: 'hidden' },
                    pressed && styles.premiumCardPressed
                  ]}
                  onPress={() => {
                    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                    router.push({
                      pathname: '/mess',
                      params: {
                        tab: 'menu',
                        day: today,
                        target: getUpcomingMeal().type.toLowerCase()
                      }
                    });
                  }}
                >
                  {/* Background Watermark Icon */}
                  <MaterialCommunityIcons
                    name="silverware-fork-knife"
                    size={90}
                    color={isDark ? '#FDBA74' : '#EA580C'}
                    style={{ position: 'absolute', right: -15, bottom: -15, opacity: isDark ? 0.08 : 0.06 }}
                  />
                  <View style={{ gap: 4 }}>
                    <AppText style={[styles.serviceLabel, { color: isDark ? '#F1F5F9' : '#0F172A', fontSize: 17, marginBottom: 0 }]}>Mess Menu</AppText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                      <AppText style={[styles.modernBadgeText, { color: isDark ? '#FDBA74' : '#EA580C', fontSize: 10, fontWeight: '900' }]}>
                        {getUpcomingMeal().type.toUpperCase()}
                      </AppText>
                      <AppText style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#94A3B8' : '#64748B' }}>
                        • {getUpcomingMeal().time}
                      </AppText>
                    </View>
                    <AppText style={{ color: isDark ? '#CBD5E1' : '#475569', fontSize: 12, fontWeight: '600', lineHeight: 16 }} numberOfLines={2}>
                      {getUpcomingMeal().foodItems?.length > 0 ? (
                        getUpcomingMeal().foodItems.map((item: any, idx: number, arr: any[]) => (
                          <AppText key={idx} style={item.highlight ? { color: isDark ? '#FDE047' : '#D97706', fontWeight: 'bold' } : {}}>
                            {item.dish}{idx < arr.length - 1 ? ', ' : ''}
                          </AppText>
                        ))
                      ) : 'Not Available'}
                    </AppText>
                  </View>
                </Pressable>
              </View>

              {/* LAUNDRY CARD - Grid Style */}
              <View style={styles.gridItemFlexible}>
                <Pressable
                  style={({ pressed }) => [
                    styles.premiumServiceCard,
                    { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#E2E8F0', paddingHorizontal: 16, paddingVertical: 14, overflow: 'hidden' },
                    pressed && styles.premiumCardPressed
                  ]}
                  onPress={() => router.push('/laundry-request')}
                >
                  {/* Background Watermark Icon */}
                  <MaterialCommunityIcons
                    name="washing-machine"
                    size={90}
                    color={isDark ? '#67E8F9' : '#0891B2'}
                    style={{ position: 'absolute', right: -15, bottom: -15, opacity: isDark ? 0.08 : 0.06 }}
                  />
                  <View style={{ gap: 4 }}>
                    <AppText style={[styles.serviceLabel, { color: isDark ? '#F1F5F9' : '#0F172A', fontSize: 17, marginBottom: 0 }]}>Laundry</AppText>
                    <View style={{ gap: 2 }}>
                      <AppText style={[styles.modernBadgeText, { color: isDark ? '#67E8F9' : '#0891B2', fontSize: 10, fontWeight: '900', alignSelf: 'flex-start' }]}>
                        {(laundry?.status === 'On Schedule' ? 'On Time' : (laundry?.status || 'Active')).toUpperCase()}
                      </AppText>
                      <AppText style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#94A3B8' : '#64748B' }}>
                        {laundry?.pickupTime ? `${laundry.pickupTime} ${laundry.pickupPeriod.slice(0, 2)} ` : '--:--'}
                      </AppText>
                    </View>
                    <AppText style={{ color: isDark ? '#CBD5E1' : '#475569', fontSize: 12, fontWeight: '600', lineHeight: 16 }} numberOfLines={2}>
                      Next: {laundry?.pickupDay || 'TBD'}
                    </AppText>
                  </View>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* CAMPUS SERVICES - BLUE SPECTRUM */}
        <View style={styles.servicesSectionWrapper}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 12, paddingHorizontal: 16 }}>
            <View style={{ width: 4, height: 16, backgroundColor: isDark ? '#60A5FA' : '#1E40AF', borderRadius: 2, marginRight: 8 }} />
            <AppText style={{ fontSize: 16, fontWeight: '900', letterSpacing: 0.5, color: isDark ? '#F1F5F9' : '#0F172A', textTransform: 'uppercase' }}>
              Campus Services
            </AppText>
          </View>

          <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
            <View style={{ flexDirection: 'column', gap: 10 }}>
              {/* ROW 1 */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  style={({ pressed }) => [{ flex: 1, aspectRatio: 1, backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#E2E8F0', borderWidth: 1, borderRadius: 16, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }, pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] }]}
                  onPress={() => router.push('/complaints')}
                >
                  <MaterialCommunityIcons name="alert-circle-outline" size={80} color={isDark ? '#F43F5E' : '#E11D48'} style={{ position: 'absolute', right: -12, bottom: -12, opacity: isDark ? 0.08 : 0.06 }} />
                  <AppText style={{ color: isDark ? '#F1F5F9' : '#0F172A', fontSize: 14, fontWeight: '700' }}>Complaints</AppText>
                  <AppText style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: '500', marginTop: 4 }}>{totalComplaints} total</AppText>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [{ flex: 1, aspectRatio: 1, backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#E2E8F0', borderWidth: 1, borderRadius: 16, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }, pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] }]}
                  onPress={() => router.push('/leave-request')}
                >
                  <MaterialCommunityIcons name="wallet-travel" size={80} color={isDark ? '#34D399' : '#10B981'} style={{ position: 'absolute', right: -12, bottom: -12, opacity: isDark ? 0.08 : 0.06 }} />
                  <AppText style={{ color: isDark ? '#F1F5F9' : '#0F172A', fontSize: 14, fontWeight: '700' }}>Leaves</AppText>
                  <AppText style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: '500', marginTop: 4 }}>{totalLeaves} total</AppText>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [{ flex: 1, aspectRatio: 1, backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#E2E8F0', borderWidth: 1, borderRadius: 16, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }, pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] }]}
                  onPress={() => router.push('/my-visitors')}
                >
                  <MaterialCommunityIcons name="account-group" size={80} color={isDark ? '#A78BFA' : '#8B5CF6'} style={{ position: 'absolute', right: -12, bottom: -12, opacity: isDark ? 0.08 : 0.06 }} />
                  <AppText style={{ color: isDark ? '#F1F5F9' : '#0F172A', fontSize: 14, fontWeight: '700' }}>Visitors</AppText>
                  <AppText style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: '500', marginTop: 4 }}>{totalVisitors} total</AppText>
                </Pressable>
              </View>

              {/* ROW 2 */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  style={({ pressed }) => [{ flex: 1, aspectRatio: 1, backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#E2E8F0', borderWidth: 1, borderRadius: 16, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }, pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] }]}
                  onPress={() => router.push('/roomservice')}
                >
                  <MaterialCommunityIcons name="broom" size={80} color={isDark ? '#FBBF24' : '#F59E0B'} style={{ position: 'absolute', right: -12, bottom: -12, opacity: isDark ? 0.08 : 0.06 }} />
                  <AppText style={{ color: isDark ? '#F1F5F9' : '#0F172A', fontSize: 14, fontWeight: '700' }}>Services</AppText>
                  <AppText style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: '500', marginTop: 4 }}>Cleanup</AppText>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [{ flex: 1, aspectRatio: 1, backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#E2E8F0', borderWidth: 1, borderRadius: 16, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }, pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] }]}
                  onPress={() => router.push('/about')}
                >
                  <MaterialCommunityIcons name="office-building" size={80} color={isDark ? '#60A5FA' : '#3B82F6'} style={{ position: 'absolute', right: -12, bottom: -12, opacity: isDark ? 0.08 : 0.06 }} />
                  <AppText style={{ color: isDark ? '#F1F5F9' : '#0F172A', fontSize: 14, fontWeight: '700' }}>About</AppText>
                  <AppText style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: '500', marginTop: 4 }}>{totalFacilities} facilities</AppText>
                </Pressable>

                <View style={{ flex: 1 }} />
              </View>
            </View>
          </View>
        </View>


      </ScrollView >



      {/* Floating Action Button for AI Chat */}
      <TouchableOpacity 
        style={[styles.aiFab, { backgroundColor: isDark ? '#4F46E5' : '#4338CA' }]}
        onPress={() => router.push('/ai-chat')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={isDark ? ['#6366F1', '#4338CA'] : ['#818CF8', '#4F46E5']}
          style={styles.aiFabGradient}
        >
          <MaterialCommunityIcons name="robot-outline" size={28} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      <StudentNotificationOverlay
        visible={notificationVisible}
        onClose={() => setNotificationVisible(false)}
      />
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  heroWrapper: {
    paddingBottom: 20,
    backgroundColor: '#F8FAFC',
  },
  heroGradient: {
    paddingBottom: 12,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden', // Ensure corners clip shimmer and content
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
  headerBottomDetails: {
    marginLeft: 4, // slight indent to align with content above
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  premiumProfileFrame: {
    borderRadius: 32,
    padding: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
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
    color: '#004e92',
    fontSize: 22,
    fontWeight: '800',
  },
  greetingText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 0,
  },
  userNameText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  hostelNameText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  inlineHostelName: {
    color: '#BAE6FD',
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
  prominentHostelName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  standaloneHostelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 2,
    width: '100%',
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
    color: '#F0F9FF',
    fontSize: 13,
    fontWeight: '800',
  },
  leftStatusDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 14, // Increased from 13
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  glassHeaderBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  premiumNotificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F43F5E',
    borderWidth: 2,
    borderColor: '#004e92',
    elevation: 4,
  },
  glassStatusHub: {
    paddingVertical: 8,
    marginTop: 4,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginTop: 8, // Reduced from 18
    shadowColor: '#004e92', // Brand Shadow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    padding: 16, // Reduced from 24
    borderWidth: 1,
    borderColor: '#E6EEF5',
  },
  locationBlock: {
    position: 'relative',
  },
  connectorLine: {
    position: 'absolute',
    left: 20,
    top: 40,
    bottom: 40,
    width: 2,
    backgroundColor: '#D1E0F0', // Light tint of Royal Blue
    zIndex: -1,
  },
  locItem: {
    flexDirection: 'row',
    gap: 12, // Reduced from 16
    alignItems: 'flex-start',
  },
  locIcon: {
    width: 36, // Reduced from 40
    height: 36, // Reduced from 40
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  locContent: {
    flex: 1,
    paddingTop: 0,
    justifyContent: 'center',
    minHeight: 36, // Reduced
  },
  locLabel: {
    fontSize: 10, // Reduced from 11
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2, // Reduced
  },
  locValue: {
    fontSize: 14, // Reduced from 16
    color: '#0F172A',
    fontWeight: '700',
    lineHeight: 20, // Reduced from 22
  },
  curveOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -40,
  },
  essentialsSection: {
    paddingHorizontal: 24,
    marginTop: -20, // Overlap curve
    marginBottom: 24,
  },
  essentialsSectionWrapper: {
    paddingHorizontal: 20,
    marginTop: -28, // Aggressive pull up to header
    zIndex: 1,
  },
  servicesSectionWrapper: {
    paddingHorizontal: 20,
    marginTop: 24, // Clear separation from Essentials
    paddingBottom: 0, // No bottom padding
  },
  sectionHeaderContainer: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 0,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1E40AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 100, // Pill shape
    overflow: 'hidden',
  },
  essentialsGrid: {
    flexDirection: 'column',
    gap: 8,
  },
  modernRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.5)', // Extremely subtle border
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  modernIconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernRowContent: {
    flex: 1,
    justifyContent: 'center',
  },
  modernRowTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modernBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modernBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modernRowValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  modernChevron: {
    paddingLeft: 4,
  },
  servicesGrid: {
    gap: 14,
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
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 110,
    justifyContent: 'flex-start',
  },
  premiumCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  serviceLabel: {
    fontSize: 16, // Slightly smaller than Essentials Value to fit layout
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  serviceDesc: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  serviceIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  fullWidthCardWrapper: {
    width: '100%',
  },
  fullWidthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  actionSubtext: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  bannerSection: {
    paddingHorizontal: 24,
    marginTop: 10,
  },
  financeBanner: {
    borderRadius: 28,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  }
});


