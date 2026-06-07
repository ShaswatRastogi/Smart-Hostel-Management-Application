import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StudentComplaintListSkeleton } from '../components/SkeletonLists';
import { useTheme } from '../utils/ThemeContext';
import AppText from '../components/AppText';

export default function MyComplaints() {
  interface Complaint {
    id: string; title: string; description: string;
    status: 'open' | 'inProgress' | 'resolved' | 'closed';
    createdAt: Date; priority: 'low' | 'medium' | 'high' | 'emergency'; category?: string;
  }

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  
  const [activeTab, setActiveTab] = useState<'active' | 'resolved'>('active');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pagerRef = useRef<PagerView>(null);

  // Dynamic Theme Map
  const themeBg = isDark ? '#000000' : '#F8FAFC';
  const textMain = isDark ? '#FFFFFF' : '#111111';
  const textMuted = isDark ? '#888888' : '#64748B';
  const textSecondary = isDark ? '#CCCCCC' : '#475569';
  const borderSubtle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const fabBg = isDark ? '#FFFFFF' : '#111111';
  const fabText = isDark ? '#000000' : '#FFFFFF';

  const fetchComplaints = async () => {
    try {
      const { default: api } = await import('../utils/api');
      const response = await api.get('/services/complaints');
      const mapped = response.data.map((c: any) => ({
        id: c.id, title: c.title, description: c.description,
        status: c.status === 'pending' ? 'open' : c.status,
        createdAt: new Date(c.created_at), priority: (c.category as any) || 'low', category: c.category
      }));
      setComplaints(mapped);
    } catch (error) {} finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = () => { setRefreshing(true); fetchComplaints(); };

  useEffect(() => { fetchComplaints(); }, []);

  const activeComplaints = useMemo(() => complaints.filter(c => ['open', 'inProgress'].includes(c.status)), [complaints]);
  const resolvedComplaints = useMemo(() => complaints.filter(c => ['resolved', 'closed'].includes(c.status)), [complaints]);

  const handleTabPress = (tab: 'active' | 'resolved') => {
    setActiveTab(tab);
    pagerRef.current?.setPage(tab === 'active' ? 0 : 1);
  };

  const handlePageSelected = (e: any) => {
    setActiveTab(e.nativeEvent.position === 0 ? 'active' : 'resolved');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = { open: '#F59E0B', inProgress: '#3B82F6', resolved: '#10B981', closed: '#888888' };
    return colors[status] || colors.open;
  };

  const renderItem = ({ item }: { item: Complaint }) => {
    const isResolved = ['resolved', 'closed'].includes(item.status);
    return (
      <View style={[styles.card, { borderColor: borderSubtle }, isResolved && styles.cardResolved]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <AppText style={[styles.cardTitle, { color: textMain }]}>{item.title}</AppText>
            <AppText style={[styles.cardDate, { color: textMuted }]}>{new Date(item.createdAt).toLocaleDateString()}</AppText>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <AppText style={[styles.statusBadge, { color: getStatusColor(item.status) }]}>{item.status.replace(/([A-Z])/g, ' $1').toUpperCase()}</AppText>
            <AppText style={styles.priorityText}>{item.priority.toUpperCase()} PRIORITY</AppText>
          </View>
        </View>
        <AppText style={[styles.description, { color: textSecondary }]}>{item.description}</AppText>
      </View>
    );
  };

  const renderList = (data: Complaint[], emptyText: string) => (
    <FlatList
      data={data} renderItem={renderItem} keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[textMain]} tintColor={textMain} />}
      ListEmptyComponent={<View style={styles.emptyContainer}><AppText style={styles.emptyText}>{emptyText}</AppText></View>}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: themeBg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.headerActions, { paddingTop: insets.top + 16 }]}>
        <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={textMain} />
        </Pressable>
      </View>

      <View style={styles.hero}>
        <AppText style={[styles.heroTitle, { color: textMain }]}>History</AppText>
        <AppText style={[styles.heroSubtitle, { color: textMuted }]}>Track past complaints</AppText>
      </View>

      <View style={styles.contentContainer}>
        <View style={[styles.tabContainer, { borderColor: borderSubtle }]}>
          <TouchableOpacity style={[styles.tabBtn, activeTab === 'active' && [styles.tabBtnActive, { borderColor: textMain }]]} onPress={() => handleTabPress('active')}>
            <AppText style={[styles.tabText, activeTab === 'active' && { color: textMain }]}>ACTIVE ({activeComplaints.length})</AppText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, activeTab === 'resolved' && [styles.tabBtnActive, { borderColor: textMain }]]} onPress={() => handleTabPress('resolved')}>
            <AppText style={[styles.tabText, activeTab === 'resolved' && { color: textMain }]}>RESOLVED ({resolvedComplaints.length})</AppText>
          </TouchableOpacity>
        </View>

        {loading ? <StudentComplaintListSkeleton /> : (
          <PagerView style={styles.pagerView} initialPage={0} ref={pagerRef} onPageSelected={handlePageSelected}>
            <View key="active">{renderList(activeComplaints, "No active complaints")}</View>
            <View key="resolved">{renderList(resolvedComplaints, "No resolved complaints")}</View>
          </PagerView>
        )}
      </View>

      <Pressable style={({ pressed }) => [styles.fab, { backgroundColor: fabBg }, pressed && { opacity: 0.8 }]} onPress={() => router.push('/new-complaint')}>
        <MaterialIcons name="add" size={24} color={fabText} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerActions: { paddingHorizontal: 24, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  hero: { paddingHorizontal: 24, marginBottom: 32 },
  heroTitle: { fontSize: 40, fontWeight: '800', letterSpacing: -1.5, lineHeight: 44, marginBottom: 8 },
  heroSubtitle: { fontSize: 16, fontWeight: '600' },
  contentContainer: { flex: 1 },
  tabContainer: { flexDirection: 'row', marginHorizontal: 24, borderBottomWidth: 1, marginBottom: 24 },
  tabBtn: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, marginBottom: -1 },
  tabText: { fontSize: 12, fontWeight: '700', color: '#666666', letterSpacing: 1.5 },
  pagerView: { flex: 1 },
  card: { paddingHorizontal: 24, paddingVertical: 24, borderBottomWidth: 1 },
  cardResolved: { opacity: 0.6 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  cardDate: { fontSize: 12, fontWeight: '600' },
  statusBadge: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  priorityText: { fontSize: 10, fontWeight: '600', color: '#666666', marginTop: 4 },
  description: { fontSize: 14, lineHeight: 22 },
  listContent: { paddingBottom: 120 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { color: '#666666', fontSize: 14, fontStyle: 'italic' },
  fab: { position: 'absolute', bottom: 32, right: 24, width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
});