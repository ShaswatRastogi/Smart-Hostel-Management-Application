import MaterialIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Image, LayoutAnimation, Platform, RefreshControl, StyleSheet, TouchableOpacity, UIManager, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAlert } from '../../context/AlertContext';
import { useTheme } from '../../utils/ThemeContext';
import { API_BASE_URL } from '../../utils/api';
import { isAdmin, useUser } from '../../utils/authUtils';
import { getAllLeaves, LeaveRequest, updateLeaveStatus } from '../../utils/leavesUtils';
import AppText from '../../components/AppText';

export default function LeaveRequestsPage() {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useUser();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { openId } = useLocalSearchParams();
  const flatListRef = useRef<FlatList<LeaveRequest>>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter state
  const [activeTab, setActiveTab] = useState(0); // 0: All, 1: Pending, 2: Approved, 3: Rejected

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
  ];



  useEffect(() => {
    loadRequests();
  }, []);

  // Enable LayoutAnimation for Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      }
    }
  }, []);

  // Track if we've already handled the deep link for a specific ID
  const handledOpenIdRef = useRef<string | null>(null);

  // Auto-expand and scroll if openId is provided
  useEffect(() => {
    // If we have an openId, and we haven't handled it yet (or it's a new one)
    if (openId && requests.length > 0 && handledOpenIdRef.current !== openId) {
      console.log(`[Leaves] Deep link processing for ID: ${openId}`);
      const targetIndex = requests.findIndex(r => String(r.id) === String(openId));

      if (targetIndex !== -1) {
        // 1. Ensure we are on the 'All' tab
        if (activeTab !== 0) {
          console.log('[Leaves] Switching to ALL tab to find item');
          setActiveTab(0);
          // Don't mark as handled yet, wait for the tab switch to trigger effect again
          return;
        }

        // 2. Scroll and Expand simultaneously
        console.log(`[Leaves] Scrolling and Expanding index: ${targetIndex}`);

        // Scroll
        flatListRef.current?.scrollToIndex({
          index: targetIndex,
          animated: true,
          viewPosition: 0.1
        });

        // Expand (with animation)
        const targetId = requests[targetIndex].id;
        if (selectedId !== targetId) {
          console.log('[Leaves] expanding item');
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setSelectedId(targetId);
        }

        // Mark as handled so we don't force-switch tabs again
        handledOpenIdRef.current = openId as string;
      } else {
        console.log('[Leaves] Target ID not found. Available:', requests.map(r => r.id).slice(0, 5));
      }
    }
  }, [openId, requests, activeTab]);

  const loadRequests = async () => {
    try {
      const data = await getAllLeaves();
      setRequests(data);
    } catch (error) {
      console.error("Failed to load leaves:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };



  const handleUpdateStatus = (id: string, status: 'approved' | 'rejected') => {
    showAlert(
      'Confirm Action',
      `Mark leave request as ${status}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Confirm",
          style: status === 'rejected' ? "destructive" : "default",
          onPress: async () => {
            try {
              await updateLeaveStatus(id, status);
              loadRequests();
              showAlert("Success", `Request ${status} successfully.`, [], 'success');
            } catch (error) {
              console.error(error);
              showAlert("Error", "Failed to update status.", [], 'error');
            }
          },
        },
      ]
    );
  };

  const getFilteredRequests = () => {
    switch (activeTab) {
      case 1: return requests.filter(r => r.status === 'pending');
      case 2: return requests.filter(r => r.status === 'approved');
      case 3: return requests.filter(r => r.status === 'rejected');
      default: return requests;
    }
  };

  const renderHeader = () => {
    const pendingCount = requests.filter((l) => l.status === 'pending').length;
    const approvedCount = requests.filter((l) => l.status === 'approved').length;

    return (
      <View>
        <LinearGradient colors={['#000428', '#004e92']} style={[styles.header, { paddingTop: 24 + insets.top }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="chevron-left" size={32} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <AppText style={styles.headerTitle}>Leave Requests</AppText>
          </View>
        </LinearGradient>

        <View style={styles.statsGrid}>
          {/* Hero Card: Pending Leaves */}
          <LinearGradient
            colors={['#D97706', '#B45309']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View>
              <AppText style={styles.heroLabel}>Pending Request{pendingCount !== 1 ? 's' : ''}</AppText>
              <AppText style={styles.heroValue}>{pendingCount}</AppText>
            </View>
            <MaterialIcons name="clock-outline" size={48} color="rgba(255,255,255,0.9)" />
            <View style={styles.cardWatermark}>
              <MaterialIcons name="clock-outline" size={100} color="#fff" />
            </View>
          </LinearGradient>

          <View style={styles.statsRow}>
            {/* Approved */}
            <LinearGradient
              colors={['#059669', '#064E3B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.miniCard}
            >
              <View style={styles.miniHeader}>
                <MaterialIcons name="check-circle-outline" size={18} color="rgba(255,255,255,0.9)" />
                <AppText style={styles.miniLabel}>Approved</AppText>
              </View>
              <AppText style={styles.miniValue}>{approvedCount}</AppText>
              <View style={styles.cardWatermark}>
                <MaterialIcons name="check-circle-outline" size={80} color="#fff" />
              </View>
            </LinearGradient>

            {/* Total */}
            <LinearGradient
              colors={['#4F46E5', '#312E81']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.miniCard}
            >
              <View style={styles.miniHeader}>
                <MaterialIcons name="calendar-month" size={18} color="rgba(255,255,255,0.9)" />
                <AppText style={styles.miniLabel}>Total</AppText>
              </View>
              <AppText style={styles.miniValue}>{requests.length}</AppText>
              <View style={styles.cardWatermark}>
                <MaterialIcons name="calendar-month" size={80} color="#fff" />
              </View>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.filterContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={tabs}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.filterScroll}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[styles.filterBtn, activeTab === index && styles.filterBtnActive]}
                onPress={() => setActiveTab(index)}
              >
                <AppText style={[styles.filterBtnText, activeTab === index && styles.filterBtnTextActive]}>{item.label}</AppText>
              </TouchableOpacity>
            )}
          />
        </View>


      </View>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      default: return '#64748B';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'clock-outline';
      case 'approved': return 'check-circle';
      case 'rejected': return 'close-circle';
      default: return 'help-circle';
    }
  };



  function renderLeaveItem(item: LeaveRequest) {
    const isDark = theme === 'dark';
    const statusColor = getStatusColor(item.status);

    return (
      <View style={{ marginHorizontal: 20 }}>
        <TouchableOpacity
          style={[
            styles.requestCard,
            selectedId === item.id && styles.requestCardActive,
            { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }
          ]}
          activeOpacity={0.9}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setSelectedId(selectedId === item.id ? null : item.id);
          }}
        >
          <LinearGradient
            colors={isDark ? ['rgba(255,255,255,0.03)', 'transparent'] : ['rgba(0,0,0,0.01)', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          <View style={styles.cardHeader}>
            <View style={styles.studentInfo}>
              <LinearGradient
                colors={isDark ? ['#312E81', '#1E1B4B'] : ['#E0E7FF', '#C7D2FE']}
                style={[styles.studentAvatar, { overflow: 'hidden' }]}
              >
                {item.studentProfilePhoto ? (
                  <Image
                    source={{ uri: item.studentProfilePhoto.startsWith('http') ? item.studentProfilePhoto : `${API_BASE_URL}${item.studentProfilePhoto}` }}
                    style={{ width: '100%', height: '100%' }}
                  />
                ) : (
                  <AppText style={[styles.studentInitial, { color: isDark ? '#C7D2FE' : '#4F46E5' }]}>
                    {item.studentName.charAt(0).toUpperCase()}
                  </AppText>
                )}
              </LinearGradient>
              <View style={styles.textInfo}>
                <AppText style={[styles.studentName, { color: colors.text }]}>{item.studentName}</AppText>
                <AppText style={[styles.dateRange, { color: colors.textSecondary }]}>
                  {new Date(item.startDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })} - {new Date(item.endDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                </AppText>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
              <MaterialIcons name={getStatusIcon(item.status) as any} size={16} color={statusColor} />
            </View>
          </View>

          {selectedId === item.id && (
            <View style={[styles.expandedContent, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#F8FAFC' }]}>
              <View style={styles.detailRow}>
                <AppText style={styles.detailLabel}>Room No:</AppText>
                <AppText style={styles.detailValue}>{item.studentRoom}</AppText>
              </View>
              <View style={styles.detailRow}>
                <AppText style={styles.detailLabel}>Going to:</AppText>
                <AppText style={[styles.detailValue, { flex: 1, textAlign: 'right' }]}>{item.category || 'General'}</AppText>
              </View>
              <View style={styles.detailRow}>
                <AppText style={styles.detailLabel}>Reason:</AppText>
                <AppText style={[styles.detailValue, { flex: 1, textAlign: 'right' }]}>{item.reason}</AppText>
              </View>
              <View style={styles.detailRow}>
                <AppText style={styles.detailLabel}>Duration:</AppText>
                <AppText style={styles.detailValue}>{item.days} days</AppText>
              </View>
              <View style={styles.detailRow}>
                <AppText style={styles.detailLabel}>Current Status:</AppText>
                <AppText style={[styles.detailValue, { color: statusColor, fontWeight: '800' }]}>
                  {item.status.toUpperCase()}
                </AppText>
              </View>

              {item.status === 'pending' && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={() => handleUpdateStatus(item.id, 'approved')}
                  >
                    <MaterialIcons name="check" size={16} color="#fff" />
                    <AppText style={styles.actionBtnText}>Approve</AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => handleUpdateStatus(item.id, 'rejected')}
                  >
                    <MaterialIcons name="close" size={16} color="#fff" />
                    <AppText style={styles.actionBtnText}>Reject</AppText>
                  </TouchableOpacity>
                </View>
              )}

              {item.status !== 'pending' && (
                <View style={styles.statusMessage}>
                  <AppText style={styles.statusMessageText}>
                    This request has already been{' '}
                    <AppText style={{ fontWeight: '700' }}>{item.status}</AppText>
                  </AppText>
                </View>
              )}
            </View>
          )}

          {/* Subtle Watermark */}
          <MaterialIcons
            name="calendar-clock"
            size={64}
            color={isDark ? '#FFF' : colors.primary}
            style={{
              position: 'absolute',
              right: -10,
              bottom: -10,
              opacity: isDark ? 0.03 : 0.02,
              transform: [{ rotate: '-15deg' }]
            }}
          />
        </TouchableOpacity>
      </View >
    );
  }

  function EmptyLeaves() {
    return (
      <View style={{ alignItems: 'center', padding: 40 }}>
        <MaterialIcons name="calendar-remove" size={80} color="#CBD5E1" style={{ marginBottom: 16 }} />
        <AppText style={{ color: '#94A3B8', fontSize: 16, fontWeight: '600' }}>No leave requests found</AppText>
      </View>
    );
  }

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      paddingBottom: 20,
      minHeight: '100%',
    },
    header: {
      paddingVertical: 24,
      paddingHorizontal: 24,
      marginBottom: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: colors.primary,
      shadowOpacity: 0.25,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 12,
      elevation: 8,
    },
    headerContent: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: '#fff',
      letterSpacing: 0.5,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    statsGrid: {
      paddingHorizontal: 20,
      marginBottom: 24,
      gap: 12,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    heroCard: {
      borderRadius: 24,
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: '#D97706',
      shadowOpacity: 0.25,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
      overflow: 'hidden',
      height: 100,
    },
    miniCard: {
      flex: 1,
      borderRadius: 20,
      padding: 16,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
      overflow: 'hidden',
      height: 110,
      justifyContent: 'space-between',
    },
    cardWatermark: {
      position: 'absolute',
      right: -10,
      bottom: -10,
      opacity: 0.15,
      transform: [{ rotate: '-15deg' }, { scale: 1.5 }],
    },
    heroLabel: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    heroValue: {
      color: '#fff',
      fontSize: 36,
      fontWeight: '800',
      letterSpacing: -1,
    },
    miniLabel: {
      color: 'rgba(255,255,255,0.9)',
      fontSize: 12,
      fontWeight: '700',
      opacity: 0.9,
    },
    miniValue: {
      color: '#fff',
      fontSize: 28,
      fontWeight: '800',
      marginTop: 4,
    },
    miniHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    requestCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      marginBottom: 16,
      overflow: 'hidden',
      shadowColor: colors.textSecondary,
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 16,
      elevation: 3,
      borderWidth: 1,
      borderColor: colors.border,
    },
    requestCardActive: {
      borderColor: colors.primary,
      borderWidth: 1.5,
      shadowColor: colors.primary,
      shadowOpacity: 0.15,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 18,
    },
    studentInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 14,
    },
    studentAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    studentInitial: {
      color: '#fff',
      fontSize: 20,
      fontWeight: '700',
    },
    textInfo: {
      flex: 1,
    },
    studentName: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    dateRange: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
      fontWeight: '500',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 12,
    },
    statusText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    expandedContent: {
      backgroundColor: theme === 'dark' ? colors.background : '#F8FAFC',
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    detailLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    detailValue: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 12,
      gap: 8,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 2,
    },
    approveBtn: {
      backgroundColor: '#10B981',
    },
    rejectBtn: {
      backgroundColor: '#EF4444',
    },
    actionBtnText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '700',
    },
    statusMessage: {
      backgroundColor: theme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginTop: 12,
      borderWidth: 1,
      borderColor: theme === 'dark' ? 'rgba(16, 185, 129, 0.3)' : '#D1FAE5',
    },
    statusMessageText: {
      color: theme === 'dark' ? '#34D399' : '#047857',
      fontSize: 13,
      textAlign: 'center',
      fontWeight: '600',
    },
    filterContainer: {
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    filterScroll: {
      flexDirection: 'row',
    },
    filterBtn: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: colors.card,
      marginRight: 10,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.textSecondary,
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 2,
    },
    filterBtnActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    filterBtnTextActive: {
      color: '#fff',
      fontWeight: '700',
    },
  }), [colors, theme]);

  if (!isAdmin(user))
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <AppText>Access denied.</AppText>
      </View>
    );



  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['left', 'right', 'bottom']}>
      <FlatList
        ref={flatListRef}
        data={getFilteredRequests()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderLeaveItem(item)}
        extraData={selectedId} // Ensure list updates when selectedId changes
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<EmptyLeaves />}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        onScrollToIndexFailed={(info) => {
          const wait = new Promise(resolve => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
          });
        }}
      />
    </SafeAreaView>
  );
}
