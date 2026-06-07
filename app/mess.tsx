import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, Pressable } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MessAttendanceCard from '../components/MessAttendanceCard';
import MessMenu from '../components/MessMenu';
import AppText from '../components/AppText';
import { useTheme } from '../utils/ThemeContext';

export default function Mess() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isDark } = useTheme();

  const [activeTab, setActiveTab] = useState(0);
  const pagerRef = useRef<PagerView>(null);

  // Dynamic Theme Mapping
  const themeBg = isDark ? '#000000' : '#F8FAFC';
  const textMain = isDark ? '#FFFFFF' : '#111111';
  const textMuted = isDark ? '#888888' : '#64748B';
  const borderSubtle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

  useEffect(() => {
    if (params.tab === 'menu') {
      setActiveTab(1);
      setTimeout(() => pagerRef.current?.setPage(1), 500);
    }
  }, [params.tab]);

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    pagerRef.current?.setPage(index);
  };

  const onPageSelected = (e: any) => {
    setActiveTab(e.nativeEvent.position);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeBg }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.headerActions, { paddingTop: insets.top + 16 }]}>
        <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={textMain} />
        </Pressable>
      </View>

      <View style={styles.hero}>
        <AppText style={[styles.heroTitle, { color: textMain }]}>Mess Hall</AppText>
        <AppText style={[styles.heroSubtitle, { color: textMuted }]}>Attendance & Menu</AppText>
      </View>

      <View style={[styles.tabContainer, { borderColor: borderSubtle }]}>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 0 && [styles.tabBtnActive, { borderColor: textMain }]]} onPress={() => handleTabChange(0)}>
          <AppText style={[styles.tabText, activeTab === 0 && { color: textMain }]}>ATTENDANCE</AppText>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabBtn, activeTab === 1 && [styles.tabBtnActive, { borderColor: textMain }]]} onPress={() => handleTabChange(1)}>
          <AppText style={[styles.tabText, activeTab === 1 && { color: textMain }]}>MENU SCHEDULE</AppText>
        </TouchableOpacity>
      </View>

      <PagerView ref={pagerRef} style={styles.pagerView} initialPage={0} onPageSelected={onPageSelected} scrollEnabled={false}>
        <View key="1" style={styles.pageContent}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.attendanceContainer}>
            <MessAttendanceCard />
            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="leaf" size={16} color={textMuted} />
              <AppText style={[styles.infoText, { color: textMuted }]}>
                Please mark your attendance in advance to help us reduce food waste.
              </AppText>
            </View>
          </ScrollView>
        </View>

        <View key="2" style={styles.pageContent}>
          <MessMenu
            // @ts-ignore
            initialDay={params.day}
            // @ts-ignore
            highlightTarget={params.target}
          />
        </View>
      </PagerView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerActions: { paddingHorizontal: 24, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  hero: { paddingHorizontal: 24, paddingBottom: 32 },
  heroTitle: { fontSize: 40, fontWeight: '800', letterSpacing: -1.5, lineHeight: 44, marginBottom: 8 },
  heroSubtitle: { fontSize: 16, fontWeight: '600' },
  tabContainer: { flexDirection: 'row', marginHorizontal: 24, borderBottomWidth: 1, marginBottom: 24 },
  tabBtn: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, marginBottom: -1 },
  tabText: { fontSize: 12, fontWeight: '700', color: '#666666', letterSpacing: 1.5 },
  pagerView: { flex: 1 },
  pageContent: { flex: 1 },
  attendanceContainer: { paddingBottom: 60 },
  infoBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 24, marginTop: 32 },
  infoText: { fontSize: 12, fontStyle: 'italic', flexShrink: 1 }
});