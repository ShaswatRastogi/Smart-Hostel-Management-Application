import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import MessAttendanceCard from '../components/MessAttendanceCard';
import MessMenu from '../components/MessMenu';

import { useTheme } from '../utils/ThemeContext';
import AppText from '../components/AppText';

export default function Mess() {
  const { colors, theme } = useTheme();
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState(0);
  const pagerRef = useRef<PagerView>(null);

  useEffect(() => {
    if (params.tab === 'menu') {
      setActiveTab(1);
      // Small delay to ensure PagerView is ready
      setTimeout(() => {
        pagerRef.current?.setPage(1);
      }, 500);
    }
  }, [params.tab]);

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    pagerRef.current?.setPage(index);
  };

  const onPageSelected = (e: any) => {
    setActiveTab(e.nativeEvent.position);
  };

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingBottom: 20,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
      shadowColor: "#004e92",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
      zIndex: 10,
    },
    headerContent: {
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: '#fff',
      letterSpacing: 0.5,
    },
    headerSubtitle: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.8)',
      fontWeight: '500',
      marginTop: 4,
    },
    headerIcon: {
      width: 44,
      height: 44,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    navBar: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginTop: 20,
      marginBottom: 10,
      borderRadius: 16,
      padding: 6,
      shadowColor: colors.textSecondary,
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    navItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: 12,
    },
    navItemActive: {
      backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF',
    },
    navItemLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    navItemLabelActive: {
      color: colors.primary,
      fontWeight: '700',
    },
    pagerView: {
      flex: 1,
    },
    pageContent: {
      flex: 1,
    },
    attendanceContainer: {
      paddingTop: 10,
    }
  }), [colors, theme]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <LinearGradient
        colors={['#000428', '#004e92']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={['top', 'left', 'right']}>
          <View style={styles.headerContent}>
            <View>
              <AppText style={styles.headerTitle}>Mess Hall</AppText>
              <AppText style={styles.headerSubtitle}>Attendance & Menu</AppText>
            </View>
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={24} color="#fff" />
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Tab Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 0 && styles.navItemActive]}
          onPress={() => handleTabChange(0)}
        >
          <MaterialCommunityIcons
            name="calendar-check"
            size={20}
            color={activeTab === 0 ? colors.primary : colors.textSecondary}
          />
          <AppText style={[styles.navItemLabel, activeTab === 0 && styles.navItemLabelActive]}>Attendance</AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 1 && styles.navItemActive]}
          onPress={() => handleTabChange(1)}
        >
          <MaterialCommunityIcons
            name="food-variant"
            size={20}
            color={activeTab === 1 ? colors.primary : colors.textSecondary}
          />
          <AppText style={[styles.navItemLabel, activeTab === 1 && styles.navItemLabelActive]}>Menu Schedule</AppText>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={onPageSelected}
        scrollEnabled={false} // Disable swiping
      >
        {/* Tab 1: Attendance */}
        <View key="1" style={styles.pageContent}>
          <ScrollView contentContainerStyle={styles.attendanceContainer}>
            <MessAttendanceCard />
            {/* We can add more helpful info here like "Don't forget to mark before 5PM" */}
            <View style={{ padding: 20 }}>
              <AppText style={{ textAlign: 'center', color: colors.textSecondary, fontSize: 13, fontStyle: 'italic' }}>
                <MaterialCommunityIcons name="information-outline" size={14} />
                {" "}Please mark your attendance in advance to help us reduce food waste.
              </AppText>
            </View>
          </ScrollView>
        </View>

        {/* Tab 2: Menu */}
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