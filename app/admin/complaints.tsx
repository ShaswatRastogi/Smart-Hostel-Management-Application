import MaterialIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { LayoutAnimation, Platform, RefreshControl, StyleSheet, TouchableOpacity, UIManager, View } from 'react-native';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAlert } from '../../context/AlertContext';
import { useRefresh } from '../../hooks/useRefresh';
import { API_BASE_URL } from '../../utils/api';
import { isAdmin, useUser } from '../../utils/authUtils';
import { Complaint, getAllComplaints, updateComplaintStatus } from '../../utils/complaintsSyncUtils';
import { useTheme } from '../../utils/ThemeContext';
import { formatUniversalTime } from '../../utils/timeUtils';
import AppText from '../../components/AppText';

export default function ComplaintsPage() {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useUser();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { openId } = useLocalSearchParams();
  const listRef = useRef<FlashList<Complaint>>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [activeTab, setActiveTab] = useState(0); // 0: All, 1: Open, 2: InProgress, 3: Resolved

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'open', label: 'Open' },
    { id: 'inProgress', label: 'In Progress' },
    { id: 'resolved', label: 'Resolved' },
  ];

  const { refreshing, onRefresh } = useRefresh(async () => {
    await loadComplaints();
  }, () => {
    setFilterStatus(null);
    setSelectedId(null);
  });

  useEffect(() => {
    loadComplaints();
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
    if (openId && complaints.length > 0 && handledOpenIdRef.current !== openId) {
      console.log(`[Complaints] Deep link processing for ID: ${openId} `);
      // Use loose comparison or string conversion to handle number/string mismatches
      const targetIndex = complaints.findIndex(c => String(c.id) === String(openId));

      if (targetIndex !== -1) {
        // 1. Ensure we are on the 'All' tab so the item is definitely in the list
        if (activeTab !== 0) {
          console.log('[Complaints] Switching to ALL tab to find item');
          setActiveTab(0);
          // Don't mark as handled yet, wait for the tab switch to trigger effect again
          return;
        }

        // 2. Scroll and Expand simultaneously
        console.log(`[Complaints] Scrolling and Expanding index: ${targetIndex} `);

        // Scroll
        listRef.current?.scrollToIndex({
          index: targetIndex,
          animated: true,
          viewPosition: 0.1 // Scroll near top
        });

        // Expand (with animation)
        const targetId = complaints[targetIndex].id;
        if (selectedId !== targetId) {
          console.log('[Complaints] expanding item');
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setSelectedId(targetId);
        }

        // Mark as handled so we don't force-switch tabs again
        handledOpenIdRef.current = openId as string;
      } else {
        console.log('[Complaints] Target ID not found. Available:', complaints.map(c => c.id).slice(0, 5));
      }
    }
  }, [openId, complaints, activeTab]);

  const loadComplaints = async () => {
    try {
      const data = await getAllComplaints();
      setComplaints(data);
    } catch (error) {
      console.error("Failed to load complaints:", error);
    } finally {
      setLoading(false);
    }
  };



  const handleUpdateStatus = (id: string, status: 'inProgress' | 'resolved' | 'closed') => {
    const actionText = status === 'resolved' ? 'resolve' : status === 'closed' ? 'close' : 'start working on';

    showAlert(
      'Confirm Action',
      `Are you sure you want to ${actionText} this complaint?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await updateComplaintStatus(id, status);
              loadComplaints();
              showAlert("Success", `Complaint marked as ${status}.`, [], 'success');
            } catch (error) {
              console.error(error);
              showAlert("Error", "Failed to update status.", [], 'error');
            }
          },
        },
      ],
      'warning'
    );
  };

  const getFilteredComplaints = () => {
    switch (activeTab) {
      case 1: return complaints.filter(c => c.status === 'open');
      case 2: return complaints.filter(c => c.status === 'inProgress');
      case 3: return complaints.filter(c => c.status === 'resolved' || c.status === 'closed');
      default: return complaints;
    }
  };

  const renderHeader = () => {
    const openCount = complaints.filter((c) => c.status === 'open').length;
    const inProgressCount = complaints.filter((c) => c.status === 'inProgress').length;
    const resolvedCount = complaints.filter((c) => c.status === 'resolved').length;

    return (
      <View>
        <LinearGradient colors={['#000428', '#004e92']} style={[styles.header, { paddingTop: 24 + insets.top }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="chevron-left" size={32} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <AppText style={styles.headerTitle}>Manage Complaints</AppText>
          </View>
        </LinearGradient>

        <View style={styles.statsGrid}>
          {/* Hero Card: Open Complaints */}
          <LinearGradient
            colors={['#DC2626', '#991B1B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View>
              <AppText style={styles.heroLabel}>Open Issues</AppText>
              <AppText style={styles.heroValue}>{openCount}</AppText>
            </View>
            <MaterialIcons name="alert-circle-outline" size={48} color="rgba(255,255,255,0.9)" />
            <View style={styles.cardWatermark}>
              <MaterialIcons name="alert-circle-outline" size={100} color="#fff" />
            </View>
          </LinearGradient>

          <View style={styles.statsRow}>
            {/* In Progress */}
            <LinearGradient
              colors={['#D97706', '#B45309']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.miniCard}
            >
              <View style={styles.miniHeader}>
                <MaterialIcons name="clock-outline" size={18} color="rgba(255,255,255,0.9)" />
                <AppText style={styles.miniLabel}>In Progress</AppText>
              </View>
              <AppText style={styles.miniValue}>{inProgressCount}</AppText>
              <View style={styles.cardWatermark}>
                <MaterialIcons name="clock-outline" size={80} color="#fff" />
              </View>
            </LinearGradient>

            {/* Resolved */}
            <LinearGradient
              colors={['#059669', '#064E3B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.miniCard}
            >
              <View style={styles.miniHeader}>
                <MaterialIcons name="check-circle-outline" size={18} color="rgba(255,255,255,0.9)" />
                <AppText style={styles.miniLabel}>Resolved</AppText>
              </View>
              <AppText style={styles.miniValue}>{resolvedCount}</AppText>
              <View style={styles.cardWatermark}>
                <MaterialIcons name="check-circle-outline" size={80} color="#fff" />
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
      case 'open': return '#FF6B6B';
      case 'inProgress': return '#FF9800';
      case 'resolved': return '#4CAF50';
      case 'closed': return '#94A3B8';
      default: return '#999';
    }
  };

  const getStatusIcon = (status: string): any => {
    switch (status) {
      case 'open': return 'alert-circle';
      case 'inProgress': return 'clock-outline';
      case 'resolved': return 'check-circle';
      case 'closed': return 'close-circle';
      default: return 'help-circle';
    }
  };



  function renderComplaintItem(item: Complaint) {
    const isDark = theme === 'dark';
    const statusColor = getStatusColor(item.status);

    return (
      <View style={{ marginHorizontal: 20 }}>
        <TouchableOpacity
          style={[
            styles.complaintCard,
            selectedId === item.id && styles.complaintCardActive,
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
                    contentFit="cover"
                  />
                ) : (
                  <AppText style={[styles.studentInitial, { color: isDark ? '#C7D2FE' : '#4F46E5' }]}>
                    {item.studentName?.charAt(0).toUpperCase() || '?'}
                  </AppText>
                )}
              </LinearGradient>
              <View style={styles.textInfo}>
                <AppText style={[styles.studentName, { color: colors.text }]}>{item.studentName || 'Unknown Student'}</AppText>
                <AppText style={[styles.complaintPreview, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.title}
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
                <AppText style={styles.detailLabel}>Email:</AppText>
                <AppText style={styles.detailValue}>{item.studentEmail}</AppText>
              </View>
              <View style={styles.detailRow}>
                <AppText style={styles.detailLabel}>Date:</AppText>
                <AppText style={styles.detailValue}>
                  {item.createdAt instanceof Date
                    ? formatUniversalTime(item.createdAt)
                    : 'N/A'}
                </AppText>
              </View>
              <View style={styles.detailRow}>
                <AppText style={styles.detailLabel}>Priority:</AppText>
                <AppText style={[styles.detailValue, { color: statusColor, fontWeight: '800' }]}>
                  {item.status.toUpperCase()}
                </AppText>
              </View>

              <View style={[styles.complaintText, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFF' }]}>
                <AppText style={[styles.complaintTextLabel, { color: colors.text }]}>Complaint Details:</AppText>
                <AppText style={[styles.complaintTextContent, { color: colors.text }]}>{item.description}</AppText>
              </View>

              {item.status !== 'resolved' && item.status !== 'closed' && (
                <View style={styles.actionButtons}>
                  {item.status === 'open' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.progressBtn]}
                      onPress={() => handleUpdateStatus(item.id, 'inProgress')}
                    >
                      <MaterialIcons name="clock-outline" size={16} color="#fff" />
                      <AppText style={styles.actionBtnText}>Mark In Progress</AppText>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.resolveBtn]}
                    onPress={() => handleUpdateStatus(item.id, 'resolved')}
                  >
                    <MaterialIcons name="check" size={16} color="#fff" />
                    <AppText style={styles.actionBtnText}>Resolve</AppText>
                  </TouchableOpacity>
                </View>
              )}

              {(item.status === 'resolved' || item.status === 'closed') && (
                <View style={styles.resolvedMessage}>
                  <MaterialIcons name="check-circle" size={20} color={item.status === 'resolved' ? '#10B981' : '#64748B'} />
                  <AppText style={styles.resolvedMessageText}>
                    This complaint has been {item.status === 'resolved' ? 'resolved' : 'closed'}
                  </AppText>
                </View>
              )}
            </View>
          )}

          {/* Subtle Watermark */}
          <MaterialIcons
            name="alert-box-outline"
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

  function EmptyComplaints() {
    return (
      <View style={{ alignItems: 'center', padding: 40 }}>
        <Image
          source={require('../../assets/images/empty-complaints.jpg')}
          style={{ width: 220, height: 220, marginBottom: 16 }}
          contentFit="contain"
        />
        <AppText style={{ color: '#94A3B8', fontSize: 16, fontWeight: '600' }}>No complaints found</AppText>
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
      shadowColor: '#EF4444',
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
    filterContainer: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    filterScroll: {
      flexDirection: 'row',
    },
    filterBtn: {
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 24,
      backgroundColor: colors.card,
      marginRight: 10,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.textSecondary,
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    filterBtnActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOpacity: 0.2,
      elevation: 3,
    },
    filterBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    filterBtnTextActive: {
      color: '#fff',
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    complaintCard: {
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
    complaintCardActive: {
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
      marginBottom: 4,
    },
    complaintPreview: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      gap: 6,
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
      alignItems: 'center',
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
    priorityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 12,
    },
    badgeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    complaintText: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    complaintTextLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    complaintTextContent: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 22,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 10,
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
    progressBtn: {
      backgroundColor: '#F59E0B',
    },
    resolveBtn: {
      backgroundColor: '#10B981',
    },
    closeBtn: {
      backgroundColor: '#64748B',
    },
    actionBtnText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '700',
    },
    resolvedMessage: {
      backgroundColor: theme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginTop: 12,
      borderWidth: 1,
      borderColor: theme === 'dark' ? 'rgba(16, 185, 129, 0.3)' : '#D1FAE5',
    },
    resolvedMessageText: {
      color: theme === 'dark' ? '#34D399' : '#047857',
      fontSize: 13,
      fontWeight: '600',
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
      <FlashList
        ref={listRef}
        data={getFilteredComplaints()}
        keyExtractor={(item) => item.id}
        estimatedItemSize={120}
        renderItem={({ item }) => renderComplaintItem(item)}
        extraData={selectedId} // Ensure list updates when selectedId changes
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<EmptyComplaints />}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
      />
    </SafeAreaView>
  );
}
