import React, { useState, useRef } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Dimensions, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import AppText from '../../../components/AppText';
import { useTheme } from '../../../utils/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import MessStatsBanner from '../../../components/MessStatsBanner';
import AnimatedGradientHeader from '../../../components/AnimatedGradientHeader';
import { formatUniversalTime } from '../../../utils/timeUtils';
import { API_BASE_URL } from '../../../utils/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GridAction = ({ icon, label, route, iconColor, isDark, onPress }: any) => {
    const router = useRouter();
    const handlePress = () => { if (onPress) onPress(); else if (route) router.push(route); };
    return (
        <View style={{ width: '25%', alignItems: 'center', marginBottom: 20 }}>
            <TouchableOpacity activeOpacity={0.7} onPress={handlePress} style={{ alignItems: 'center', gap: 8 }}>
                <View style={{
                    width: 56, height: 56, borderRadius: 28,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9',
                    justifyContent: 'center', alignItems: 'center',
                    borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.03)',
                }}>
                    <MaterialIcons name={icon} size={28} color={iconColor} />
                </View>
                <AppText style={{
                    color: isDark ? 'rgba(255,255,255,0.9)' : '#334155',
                    fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 2,
                }} numberOfLines={2}>{label}</AppText>
            </TouchableOpacity>
        </View>
    );
};

const AnimatedThemeToggle = ({ isDark, toggleTheme }: any) => (
    <TouchableOpacity
        style={{ width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.12)' }}
        onPress={toggleTheme} activeOpacity={0.8}
    >
        <MaterialIcons name={isDark ? "weather-sunny" : "weather-night"} size={24} color={isDark ? "#fbbf24" : "#fff"} />
    </TouchableOpacity>
);

export default function WardenPortal(props: any) {
    const { colors, isDark, user } = props;
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const styles = createStyles(colors, isDark);
    const [activeTab, setActiveTab] = useState<'students' | 'team'>('students');
    const [pagingIndex, setPagingIndex] = useState(0);

    return (
        <ScrollView
            contentContainerStyle={{ paddingBottom: 60 }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={props.refreshing} onRefresh={props.onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        >
            <AnimatedGradientHeader style={[styles.headerBar, { paddingTop: insets.top + 16 }]}>
                <View style={styles.headerContentInner}>
                    <TouchableOpacity style={styles.hamburgerBtn} onPress={() => props.setSidebarOpen(true)}>
                        <MaterialIcons name="menu" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerTextContainer}>
                        <AppText style={styles.headerBarTitle}>Warden Portal</AppText>
                        <AppText style={styles.headerBarSubtitle}>
                            {user?.name ? `Hi, ${user.name.split(' ')[0]}` : 'Welcome back'}
                        </AppText>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <AnimatedThemeToggle isDark={isDark} toggleTheme={props.toggleTheme} />
                        <TouchableOpacity onPress={() => props.setNotificationVisible(true)}>
                            <View style={styles.headerIcon}>
                                <MaterialIcons name="bell-outline" size={22} color="#fff" />
                                {props.unreadCount > 0 && (
                                    <View style={styles.notifBadge}>
                                        <AppText style={styles.notifBadgeText}>{props.unreadCount > 9 ? '9+' : props.unreadCount}</AppText>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.searchBarContainer}>
                    <MaterialIcons name="magnify" size={20} color="rgba(255,255,255,0.6)" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search students, rooms..."
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={props.searchQuery}
                        onChangeText={props.handleSearch}
                        autoCapitalize="none" autoCorrect={false}
                    />
                    {props.isSearching && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 10 }} />}
                    {props.searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => { props.setSearchQuery(''); }}>
                            <MaterialIcons name="close-circle" size={20} color="rgba(255,255,255,0.5)" />
                        </TouchableOpacity>
                    )}
                </View>

                {props.searchResults.length > 0 && (
                    <View style={styles.resultsDropdown}>
                        {props.searchResults.map((result: any) => (
                            <TouchableOpacity key={`${result.type}-${result.id}`} style={styles.resultItem} onPress={() => props.handleSearchResultPress(result)}>
                                <View style={[styles.resultIcon, { backgroundColor: result.type === 'student' ? 'rgba(99,102,241,0.15)' : 'rgba(147,51,234,0.15)' }]}>
                                    <MaterialIcons name={result.type === 'student' ? 'account' : 'door-closed'} size={20} color={result.type === 'student' ? '#818CF8' : '#A855F7'} />
                                </View>
                                <View style={styles.resultInfo}>
                                    <AppText style={styles.resultTitle}>{result.title}</AppText>
                                    <AppText style={styles.resultSubtitle}>{result.subtitle}</AppText>
                                </View>
                                <MaterialIcons name="chevron-right" size={20} color="rgba(255,255,255,0.3)" />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </AnimatedGradientHeader>

            <View style={{ paddingHorizontal: 24 }}>
                <View style={[styles.section, { marginBottom: 16, marginTop: 0, marginHorizontal: -24 }]}>
                    {/* ── Pill Tabs ── */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 28, marginTop: 22, marginBottom: 18, gap: 8 }}>
                        {(['students', 'team'] as const).map(tab => (
                            <TouchableOpacity
                                key={tab}
                                onPress={() => { setActiveTab(tab); setPagingIndex(0); }}
                                style={{
                                    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                                    backgroundColor: activeTab === tab ? (isDark ? 'rgba(99,102,241,0.2)' : '#EEF2FF') : 'transparent',
                                    borderWidth: 1,
                                    borderColor: activeTab === tab ? (isDark ? 'rgba(99,102,241,0.3)' : '#C7D2FE') : (isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'),
                                }}
                            >
                                <AppText style={{
                                    fontSize: 12, fontWeight: '800',
                                    color: activeTab === tab ? '#6366F1' : (isDark ? 'rgba(255,255,255,0.4)' : '#94A3B8'),
                                }}>{tab === 'students' ? 'Manage Students' : 'Manage Team'}</AppText>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* ── Swiping Grids ── */}
                    {activeTab === 'students' ? (
                        <>
                            <ScrollView
                                horizontal pagingEnabled showsHorizontalScrollIndicator={false} decelerationRate="fast"
                                onScroll={(e) => {
                                    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                                    if (idx !== pagingIndex) setPagingIndex(idx);
                                }}
                                scrollEventThrottle={16}
                            >
                                <View style={{ width: SCREEN_WIDTH, flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 }}>
                                    <GridAction icon="account-group" label="Students" route="/admin/students" iconColor={colors.primary} isDark={isDark} />
                                    <GridAction icon="account-plus-outline" label="Assign" route={{ pathname: '/admin/students', params: { action: 'allot' } }} iconColor={colors.primary} isDark={isDark} />
                                    <GridAction icon="calendar-check-outline" label="Attendance" route="/admin/attendance" iconColor={colors.primary} isDark={isDark} />
                                    <GridAction icon="message-text-outline" label="Messages" route="/chat" iconColor={colors.primary} isDark={isDark} />
                                    <GridAction icon="silverware-fork-knife" label="Menu" route="/admin/messMenu" iconColor={colors.primary} isDark={isDark} />
                                    <GridAction icon="bus" label="Bus Timing" route="/admin/busTimings" iconColor={colors.primary} isDark={isDark} />
                                    <GridAction icon="cash-multiple" label="Finance" route="/admin/finance" iconColor={colors.primary} isDark={isDark} />
                                    <GridAction icon="google-analytics" label="Analytics" route="/admin/analytics" iconColor={colors.primary} isDark={isDark} />
                                </View>
                                <View style={{ width: SCREEN_WIDTH, flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 }}>
                                    <GridAction icon="calendar-clock" label="Leaves" route="/admin/leaveRequests" iconColor={colors.primary} isDark={isDark} />
                                    <GridAction icon="bullhorn-outline" label="Notice" route="/admin/notices" iconColor={colors.primary} isDark={isDark} />
                                    <GridAction icon="door-closed" label="Rooms" route="/admin/rooms" iconColor={colors.primary} isDark={isDark} />
                                    <GridAction icon="alert-circle-outline" label="Complaints" route="/admin/complaints" iconColor={colors.primary} isDark={isDark} />
                                    <GridAction icon="tshirt-crew" label="Laundry" route="/admin/laundry" iconColor={colors.primary} isDark={isDark} />
                                    <GridAction icon="bell-ring-outline" label="Emergency" route="/admin/emergency" iconColor={colors.primary} isDark={isDark} />
                                    <GridAction icon="account-clock" label="Visitors" route="/admin/visitors" iconColor={colors.primary} isDark={isDark} />
                                    <GridAction icon="office-building" label="About Hostel" route="/admin/facilities" iconColor={colors.primary} isDark={isDark} />
                                </View>
                                <View style={{ width: SCREEN_WIDTH, flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 }}>
                                    <GridAction icon="file-document-outline" label="Reports" route={{ pathname: '/admin/students', params: { action: 'export' } }} iconColor={colors.primary} isDark={isDark} />
                                    <GridAction icon="walk" label="Clock In/Out" route="/admin/movements" iconColor={colors.primary} isDark={isDark} />
                                </View>
                            </ScrollView>
                            <View style={styles.paginationRow}>
                                {[0, 1, 2].map((idx) => (
                                    <View key={idx} style={[styles.dot, { width: pagingIndex === idx ? 12 : 6, backgroundColor: pagingIndex === idx ? colors.primary : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'), opacity: pagingIndex === idx ? 1 : 0.5 }]} />
                                ))}
                            </View>
                        </>
                    ) : (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 }}>
                            <GridAction icon="account-group-outline" label="Team" route="/admin/team" iconColor={colors.primary} isDark={isDark} />
                            <GridAction icon="account-plus-outline" label="Assign" route={{ pathname: '/admin/team', params: { action: 'add' } }} iconColor={colors.primary} isDark={isDark} />
                        </View>
                    )}
                </View>

                <MessStatsBanner compact />

                {/* Recent Complaints */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <AppText style={styles.sectionTitle}>Recent Complaints</AppText>
                        <TouchableOpacity onPress={() => props.handleNavPress('complaints')}><AppText style={styles.seeAllLink}>See All</AppText></TouchableOpacity>
                    </View>
                    {props.recentComplaints.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={(SCREEN_WIDTH * 0.85) + 16} decelerationRate="fast" style={{ marginHorizontal: -24 }} contentContainerStyle={{ paddingLeft: 24, paddingBottom: 8, paddingRight: 24 }}>
                            {props.recentComplaints.map((c: any) => (
                                <View key={c.id} style={styles.cardItem}>
                                    <TouchableOpacity onPress={() => router.push(`/admin/complaints?openId=${c.id}`)} activeOpacity={0.7}>
                                        <View style={styles.cardHeader}>
                                            <View style={styles.studentInfoRow}>
                                                <Image source={{ uri: c.studentProfilePhoto ? (c.studentProfilePhoto.startsWith('http') ? c.studentProfilePhoto : `${API_BASE_URL}${c.studentProfilePhoto}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(c.studentName || 'S')}&background=E2E8F0&color=64748B` }} style={styles.studentAvatar} contentFit="cover" />
                                                <View>
                                                    <AppText style={styles.studentName} numberOfLines={1}>{c.studentName || 'Unknown'}</AppText>
                                                    <AppText style={styles.studentRoomText}>Room {c.studentRoom || 'N/A'}</AppText>
                                                </View>
                                            </View>
                                            <View style={[styles.statusBadge, { backgroundColor: c.status === 'resolved' ? '#DCFCE7' : c.status === 'inProgress' ? '#DBEAFE' : '#FEF9C3' }]}>
                                                <AppText style={[styles.statusText, { color: c.status === 'resolved' ? '#166534' : c.status === 'inProgress' ? '#1E40AF' : '#854D0E' }]}>{c.status?.toUpperCase() || 'OPEN'}</AppText>
                                            </View>
                                        </View>
                                        <View style={styles.cardContentDetailed}>
                                            <AppText style={styles.cardTitle} numberOfLines={2}>{c.title}</AppText>
                                            <AppText style={styles.cardSubtitle} numberOfLines={3}>{c.description || 'No details.'}</AppText>
                                        </View>
                                    </TouchableOpacity>
                                    {c.status !== 'resolved' && (
                                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                                            {c.status === 'open' && (
                                                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#EFF6FF' }]} onPress={() => props.handleComplaintAction(c.id, 'inProgress')}>
                                                    <AppText style={{ color: '#3B82F6', fontWeight: '700', fontSize: 13 }}>{props.loadingActions[`complaint-${c.id}`] === 'inProgress' ? 'Marking...' : 'In-Progress'}</AppText>
                                                </TouchableOpacity>
                                            )}
                                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(34,197,94,0.15)' : '#F0FDF4' }]} onPress={() => props.handleComplaintAction(c.id, 'resolved')}>
                                                <AppText style={{ color: '#22C55E', fontWeight: '700', fontSize: 13 }}>{props.loadingActions[`complaint-${c.id}`] === 'resolved' ? 'Resolving...' : 'Resolve'}</AppText>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            ))}
                        </ScrollView>
                    ) : (
                        <View style={styles.emptyStateContainer}><AppText style={styles.emptyStateText}>No recent complaints.</AppText></View>
                    )}
                </View>

                {/* Recent Leaves */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <AppText style={styles.sectionTitle}>Recent Leaves</AppText>
                        <TouchableOpacity onPress={() => props.handleNavPress('leaves')}><AppText style={styles.seeAllLink}>See All</AppText></TouchableOpacity>
                    </View>
                    {props.pendingLeaves.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={(SCREEN_WIDTH * 0.85) + 16} decelerationRate="fast" style={{ marginHorizontal: -24 }} contentContainerStyle={{ paddingLeft: 24, paddingBottom: 8, paddingRight: 24 }}>
                            {props.pendingLeaves.map((l: any) => (
                                <View key={l.id} style={styles.cardItem}>
                                    <TouchableOpacity onPress={() => router.push(`/admin/leaveRequests?openId=${l.id}`)} activeOpacity={0.7}>
                                        <View style={styles.cardHeader}>
                                            <View style={styles.studentInfoRow}>
                                                <Image source={{ uri: l.studentProfilePhoto ? (l.studentProfilePhoto.startsWith('http') ? l.studentProfilePhoto : `${API_BASE_URL}${l.studentProfilePhoto}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(l.studentName || 'S')}&background=E2E8F0&color=64748B` }} style={styles.studentAvatar} contentFit="cover" />
                                                <View>
                                                    <AppText style={styles.studentName} numberOfLines={1}>{l.studentName || 'Student'}</AppText>
                                                    <AppText style={styles.studentRoomText}>Room {l.studentRoom || 'N/A'}</AppText>
                                                </View>
                                            </View>
                                            <View style={[styles.statusBadge, { backgroundColor: l.status === 'approved' ? '#DCFCE7' : l.status === 'rejected' ? '#FEF2F2' : '#FEF9C3' }]}>
                                                <AppText style={[styles.statusText, { color: l.status === 'approved' ? '#166534' : l.status === 'rejected' ? '#DC2626' : '#854D0E' }]}>{l.status?.toUpperCase() || 'PENDING'}</AppText>
                                            </View>
                                        </View>
                                        <View style={styles.cardContentDetailed}>
                                            <AppText style={styles.cardTitle} numberOfLines={1}>{l.reason || 'Leave Request'}</AppText>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                                <MaterialIcons name="calendar-range" size={14} color={colors.textSecondary} />
                                                <AppText style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '600' }}>
                                                    {l.startDate ? formatUniversalTime(l.startDate, { month: 'short', day: 'numeric' }) : '—'} → {l.endDate ? formatUniversalTime(l.endDate, { month: 'short', day: 'numeric' }) : '—'}  •  {l.days} day{l.days !== 1 ? 's' : ''}
                                                </AppText>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                    {l.status === 'pending' && (
                                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : '#FEF2F2' }]} onPress={() => props.handleLeaveAction(l.id, 'rejected')}>
                                                <AppText style={{ color: '#EF4444', fontWeight: '700', fontSize: 13 }}>Reject</AppText>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(34,197,94,0.15)' : '#F0FDF4' }]} onPress={() => props.handleLeaveAction(l.id, 'approved')}>
                                                <AppText style={{ color: '#22C55E', fontWeight: '700', fontSize: 13 }}>Approve</AppText>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            ))}
                        </ScrollView>
                    ) : (
                        <View style={styles.emptyStateContainer}><AppText style={styles.emptyStateText}>No pending leaves.</AppText></View>
                    )}
                </View>
            </View>
        </ScrollView>
    );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    headerBar: { paddingBottom: 28, paddingHorizontal: 20, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
    headerContentInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    hamburgerBtn: { width: 46, height: 46, justifyContent: 'center', alignItems: 'center', borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.12)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
    headerTextContainer: { flex: 1, paddingHorizontal: 14 },
    headerBarTitle: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 },
    headerBarSubtitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
    headerIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    notifBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#004e92', paddingHorizontal: 4 },
    notifBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
    searchBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingHorizontal: 16, height: 48, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, height: '100%', fontSize: 15, fontWeight: '600', color: '#fff' },
    resultsDropdown: { marginTop: 12, backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(0, 40, 80, 0.92)', borderRadius: 20, paddingVertical: 8, zIndex: 1000, maxHeight: 400, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    resultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
    resultIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    resultInfo: { flex: 1, gap: 2 },
    resultTitle: { fontSize: 15, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
    resultSubtitle: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
    section: { marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
    seeAllLink: { fontSize: 14, fontWeight: '700', color: colors.primary },
    emptyStateContainer: { alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.card, borderRadius: 24, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
    emptyStateText: { color: colors.textSecondary, fontSize: 15, fontWeight: '600' },
    cardItem: { width: SCREEN_WIDTH * 0.85, marginRight: 16, backgroundColor: isDark ? 'rgba(30, 41, 59, 0.5)' : colors.card, borderRadius: 20, padding: 14, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    studentInfoRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
    studentAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: isDark ? '#334155' : '#F1F5F9' },
    studentName: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 1 },
    studentRoomText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    cardContentDetailed: { marginBottom: 10 },
    cardTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 4, letterSpacing: -0.3 },
    cardSubtitle: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
    paginationRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 4 },
    dot: { height: 6, borderRadius: 3 },
    actionBtn: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center' }
});
