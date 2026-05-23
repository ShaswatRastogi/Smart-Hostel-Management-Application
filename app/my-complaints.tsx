import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StudentComplaintListSkeleton } from '../components/SkeletonLists';
import { useTheme } from '../utils/ThemeContext';
import AppText from '../components/AppText';

export default function MyComplaints() {
  interface Complaint {
    id: string;
    title: string;
    description: string;
    status: 'open' | 'inProgress' | 'resolved' | 'closed';
    createdAt: Date;
    priority: 'low' | 'medium' | 'high' | 'emergency';
    category?: string;
  }

  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'active' | 'resolved'>('active');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pagerRef = useRef<PagerView>(null);

  const fetchComplaints = async () => {
    try {
      const { default: api } = await import('../utils/api');
      const response = await api.get('/services/complaints');

      // Map DB to UI
      const mapped = response.data.map((c: any) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        status: c.status === 'pending' ? 'open' : c.status,
        createdAt: new Date(c.created_at),
        priority: (c.category as any) || 'low',
        category: c.category
      }));

      setComplaints(mapped);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchComplaints();
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const activeComplaints = useMemo(() => {
    return complaints.filter(c => ['open', 'inProgress'].includes(c.status));
  }, [complaints]);

  const resolvedComplaints = useMemo(() => {
    return complaints.filter(c => ['resolved', 'closed'].includes(c.status));
  }, [complaints]);

  const handleTabPress = (tab: 'active' | 'resolved') => {
    setActiveTab(tab);
    pagerRef.current?.setPage(tab === 'active' ? 0 : 1);
  };

  const handlePageSelected = (e: any) => {
    setActiveTab(e.nativeEvent.position === 0 ? 'active' : 'resolved');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: '#F59E0B',        // Amber
      inProgress: '#3B82F6',  // Blue
      resolved: '#10B981',    // Green
      closed: '#64748B',      // Slate
    };
    return colors[status] || colors.open;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: '#10B981',
      medium: '#F59E0B',
      high: '#F97316',
      emergency: '#EF4444'
    };
    return colors[priority] || colors.low;
  };

  const renderItem = ({ item }: { item: Complaint }) => {
    const isResolved = ['resolved', 'closed'].includes(item.status);

    return (
      <View style={[styles.card, isResolved && styles.cardResolved, {
        backgroundColor: colors.card,
        borderColor: colors.border
      }]}>
        <View style={styles.cardHeader}>
          <View style={[
            styles.iconBox,
            { backgroundColor: isDark ? '#1e3a8a' : '#EFF6FF' }
          ]}>
            <MaterialCommunityIcons
              name={item.category?.toLowerCase().includes('wifi') ? 'wifi' :
                item.category?.toLowerCase().includes('water') ? 'water' :
                  item.category?.toLowerCase().includes('electric') ? 'lightning-bolt' : 'clipboard-text-outline'}
              size={24}
              color={colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppText style={[styles.cardTitle, { color: colors.text }]}>{item.title}</AppText>
            <AppText style={[styles.cardDate, { color: colors.textSecondary }]}>
              {new Date(item.createdAt).toLocaleDateString()}
            </AppText>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={[
              styles.statusBadgeContainer,
              { backgroundColor: getStatusColor(item.status) + '20' }
            ]}>
              <AppText style={[
                styles.statusBadge,
                { color: getStatusColor(item.status) }
              ]}>
                {item.status.replace(/([A-Z])/g, ' $1').toUpperCase()}
              </AppText>
            </View>
            <AppText style={[styles.priorityText, { color: getPriorityColor(item.priority), marginTop: 4 }]}>
              {item.priority.toUpperCase()} PRIORITY
            </AppText>
          </View>
        </View>

        <AppText style={[styles.description, { backgroundColor: isDark ? colors.background : '#F8FAFC', color: colors.textSecondary }]}>
          {item.description}
        </AppText>
      </View>
    );
  };

  const renderList = (data: Complaint[], emptyText: string, icon: any) => (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#004e92']} tintColor="#004e92" />}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name={icon} size={64} color={isDark ? colors.secondary : "#CBD5E1"} />
          <AppText style={[styles.emptyText, { color: colors.textSecondary }]}>
            {emptyText}
          </AppText>
        </View>
      }
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable onPress={() => router.back()} style={styles.backBtn}>
                <MaterialIcons name="arrow-back" size={24} color="#fff" />
              </Pressable>
              <AppText style={styles.headerTitle}>My Complaints</AppText>
            </View>

            <View style={styles.summaryBox}>
              <View>
                <AppText style={styles.summaryLabel}>ACTIVE</AppText>
                <AppText style={styles.summaryValue}>
                  {activeComplaints.length}
                </AppText>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.contentContainer}>
        {/* Tabs */}
        <View style={[styles.tabs, { backgroundColor: isDark ? colors.card : '#fff' }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'active' && { backgroundColor: isDark ? '#1e3a8a' : '#EFF6FF' }]}
            onPress={() => handleTabPress('active')}
          >
            <AppText style={[styles.tabText, activeTab === 'active' && { color: '#3b82f6', fontWeight: '700' }, activeTab !== 'active' && { color: colors.textSecondary }]}>Active</AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'resolved' && { backgroundColor: isDark ? '#1e3a8a' : '#EFF6FF' }]}
            onPress={() => handleTabPress('resolved')}
          >
            <AppText style={[styles.tabText, activeTab === 'resolved' && { color: '#3b82f6', fontWeight: '700' }, activeTab !== 'resolved' && { color: colors.textSecondary }]}>Resolved</AppText>
          </TouchableOpacity>
        </View>

        {loading ? (
          <StudentComplaintListSkeleton />
        ) : (
          <PagerView
            style={styles.pagerView}
            initialPage={0}
            ref={pagerRef}
            onPageSelected={handlePageSelected}
          >
            <View key="active">
              {renderList(activeComplaints, "No active complaints", "clipboard-check-outline")}
            </View>
            <View key="resolved">
              {renderList(resolvedComplaints, "No resolved complaints", "clipboard-text-clock-outline")}
            </View>
          </PagerView>
        )}
      </View>

      {/* FAB to Add New */}
      <Pressable
        style={styles.fab}
        onPress={() => router.push('/new-complaint')}
      >
        <LinearGradient
          colors={['#000428', '#004e92']}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialIcons name="add" size={32} color="#fff" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#004e92",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  summaryBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    minWidth: 80,
    alignItems: 'center',
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center',
  },
  summaryValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 6,
    marginBottom: 16,
    shadowColor: '#64748B',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabText: {
    fontWeight: '600',
    color: '#64748B',
  },
  pagerView: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#64748B',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
  },
  cardResolved: {
    opacity: 0.8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  cardDate: {
    fontSize: 12,
    color: '#64748B',
  },
  statusBadgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: '700',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    color: '#475569',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    lineHeight: 20,
  },
  listContent: {
    paddingBottom: 120,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#004e92',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  fabGradient: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
});