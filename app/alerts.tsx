import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Dimensions, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NoticeListSkeleton, StudentComplaintListSkeleton } from '../components/SkeletonLists';
import { useRefresh } from '../hooks/useRefresh';
import { Complaint, subscribeToStudentComplaints } from '../utils/complaintsSyncUtils';
import { Notice, subscribeToNotices } from '../utils/noticesSyncUtils';
import { useTheme } from '../utils/ThemeContext';
import { formatUniversalTime } from '../utils/timeUtils';
import AppText from '../components/AppText';

const { width } = Dimensions.get('window');

// Centered Layout Config
const CONTAINER_WIDTH = Math.min(width * 0.85, 380); // Max width of 380 or 85% of screen
const CLEARED_TIMESTAMP_KEY = 'NOTIFICATIONS_CLEARED_TIMESTAMP';

export default function Alerts() {
    const [activeTab, setActiveTab] = useState<'alerts' | 'complaints' | 'documents'>('alerts');
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [complaintsLoading, setComplaintsLoading] = useState(true);
    const [allNotices, setAllNotices] = useState<Notice[]>([]);
    const [filteredNotices, setFilteredNotices] = useState<Notice[]>([]);
    const [noticesLoading, setNoticesLoading] = useState(true);
    const [lastClearedTime, setLastClearedTime] = useState<number>(0);
    const { colors, isDark, theme } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const { refreshing, onRefresh } = useRefresh(async () => {
        // Refresh logic - re-apply filters or re-fetch if needed
        await loadClearedTime();
        await new Promise(resolve => setTimeout(resolve, 1000));
    });

    // Load cleared timestamp on mount
    const loadClearedTime = async () => {
        try {
            const storedTime = await AsyncStorage.getItem(CLEARED_TIMESTAMP_KEY);
            if (storedTime) {
                setLastClearedTime(parseInt(storedTime, 10));
            }
        } catch (e) {
            console.error("Failed to load cleared timestamp", e);
        }
    };

    useEffect(() => {
        loadClearedTime();
    }, []);

    // Filter notices whenever allNotices or lastClearedTime changes
    useEffect(() => {
        if (allNotices.length > 0) {
            const visible = allNotices.filter(n => {
                const time = n.date instanceof Date ? n.date.getTime() : new Date(n.date).getTime();
                return !isNaN(time) && time > lastClearedTime;
            });
            setFilteredNotices(visible);
        } else {
            setFilteredNotices([]);
        }
    }, [allNotices, lastClearedTime]);

    useFocusEffect(
        useCallback(() => {
            setComplaintsLoading(true);
            const unsubscribe = subscribeToStudentComplaints((data) => {
                setComplaints(data);
                setComplaintsLoading(false);
            });

            return () => {
                if (unsubscribe) unsubscribe();
            };
        }, [])
    );

    useFocusEffect(
        useCallback(() => {
            setNoticesLoading(true);
            const unsubscribe = subscribeToNotices((data) => {
                setAllNotices(data);
                setNoticesLoading(false);
            });

            return () => {
                if (unsubscribe) unsubscribe();
            };
        }, [])
    );

    const handleClearNotifications = async () => {
        if (filteredNotices.length === 0) {
            Alert.alert("No Notifications", "There are no new notifications to clear.");
            return;
        }

        Alert.alert(
            "Clear Notifications",
            "Are you sure you want to clear all current notifications?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear All",
                    style: 'destructive',
                    onPress: async () => {
                        const now = Date.now();
                        try {
                            await AsyncStorage.setItem(CLEARED_TIMESTAMP_KEY, now.toString());
                            setLastClearedTime(now);
                        } catch (e) {
                            console.error("Failed to save cleared timestamp", e);
                        }
                    }
                }
            ]
        );
    };

    const getPriorityColor = (priority?: string) => {
        const priorityColors: Record<string, string> = {
            low: '#10B981',
            medium: '#F59E0B',
            high: '#EF4444',
            emergency: '#7F1D1D',
        };
        return priorityColors[priority || 'low'] || '#3B82F6';
    };

    const getStatusIcon = (status: string): any => {
        const icons: Record<string, string> = {
            open: 'clock-outline',
            inProgress: 'progress-wrench',
            resolved: 'check-circle-outline',
            closed: 'close-circle-outline',
        };
        return icons[status] || 'help-circle-outline';
    };

    const formatDate = (date: Date) => {
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays <= 7) return `${diffDays} days ago`;
        return formatUniversalTime(date, { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header - Full Width but content centered */}
            <LinearGradient
                colors={['#000428', '#004e92']}
                style={[styles.header, { paddingTop: 24 + insets.top }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={[styles.centeredContent, { flexDirection: 'row', alignItems: 'center', gap: 12, width: CONTAINER_WIDTH }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <MaterialIcons name="chevron-left" size={32} color="#fff" />
                    </TouchableOpacity>
                    <AppText style={styles.headerTitle}>Notifications</AppText>

                    {/* Clear Button (Always visible on Alerts tab) */}
                    {activeTab === 'alerts' ? (
                        <TouchableOpacity
                            onPress={handleClearNotifications}
                            style={styles.clearBtn}
                            activeOpacity={0.7}
                        >
                            <AppText style={styles.clearBtnText}>CLEAR</AppText>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.notificationBadge}>
                            <MaterialIcons name="notifications-none" size={24} color="#fff" />
                            {filteredNotices.length > 0 && <View style={styles.dot} />}
                        </View>
                    )}
                </View>
            </LinearGradient>

            <View style={{ flex: 1, alignItems: 'center' }}>
                {/* Responsive Tab Bar */}
                <View style={[styles.navBar, { width: CONTAINER_WIDTH, backgroundColor: colors.card, shadowColor: colors.textSecondary }]}>
                    {(['alerts', 'complaints', 'documents'] as const).map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[
                                styles.navItem,
                                activeTab === tab && { backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF' }
                            ]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <AppText style={[
                                styles.navItemLabel,
                                { color: activeTab === tab ? colors.primary : colors.textSecondary },
                                activeTab === tab && { fontWeight: '700' }
                            ]}>
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </AppText>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Main Content Area */}
                <ScrollView
                    style={{ flex: 1, width: '100%' }}
                    contentContainerStyle={{ paddingBottom: 100, alignItems: 'center' }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#fff" : colors.primary} colors={[colors.primary]} />}
                >
                    <View style={{ width: CONTAINER_WIDTH, gap: 12 }}>
                        {/* Alerts Tab */}
                        {activeTab === 'alerts' && (
                            <>
                                {noticesLoading ? (
                                    <NoticeListSkeleton />
                                ) : filteredNotices.length > 0 ? (
                                    filteredNotices.map((notice) => (
                                        <View
                                            key={notice.id}
                                            style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.textSecondary }]}
                                        >
                                            <View style={styles.cardHeaderRow}>
                                                <View style={[styles.iconBox, { backgroundColor: isDark ? '#172554' : '#EFF6FF' }]}>
                                                    <MaterialCommunityIcons name="bullhorn" size={20} color={isDark ? '#60A5FA' : '#004e92'} />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <AppText style={[styles.cardTitle, { color: colors.text }]}>{notice.title}</AppText>
                                                    <AppText style={[styles.cardDate, { color: colors.textSecondary }]}>{formatUniversalTime(notice.date)}</AppText>
                                                </View>
                                                {notice.priority === 'emergency' && <MaterialIcons name="warning" size={20} color="#EF4444" />}
                                            </View>
                                            <AppText style={[styles.cardBody, { color: colors.text }]}>{notice.body}</AppText>
                                        </View>
                                    ))
                                ) : (
                                    <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                        <MaterialCommunityIcons name="bell-sleep" size={48} color={isDark ? colors.secondary : "#CBD5E1"} />
                                        <AppText style={[styles.emptyText, { color: colors.text }]}>No new notices</AppText>
                                    </View>
                                )}
                            </>
                        )}

                        {/* Complaints Tab */}
                        {activeTab === 'complaints' && (
                            <>
                                {complaintsLoading ? (
                                    <StudentComplaintListSkeleton />
                                ) : complaints.length > 0 ? (
                                    complaints.map((complaint) => (
                                        <View
                                            key={complaint.id}
                                            style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.textSecondary }]}
                                        >
                                            <View style={styles.cardHeaderRow}>
                                                <AppText style={[styles.cardTitle, { color: colors.text }]}>{complaint.title}</AppText>
                                                <View style={[styles.statusTag, { backgroundColor: getPriorityColor(complaint.priority) + '20' }]}>
                                                    <AppText style={[styles.statusTagText, { color: getPriorityColor(complaint.priority) }]}>
                                                        {complaint.priority?.toUpperCase()}
                                                    </AppText>
                                                </View>
                                            </View>

                                            <AppText style={[styles.cardBody, { marginTop: 8, color: colors.text }]}>{complaint.description}</AppText>

                                            <View style={[styles.divider, { backgroundColor: colors.border }]} />

                                            <View style={styles.cardFooter}>
                                                <View style={[styles.statusRow, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
                                                    <MaterialCommunityIcons
                                                        name={getStatusIcon(complaint.status)}
                                                        size={16}
                                                        color={complaint.status === 'resolved' ? '#10B981' : colors.textSecondary}
                                                    />
                                                    <AppText style={[
                                                        styles.statusText,
                                                        { color: complaint.status === 'resolved' ? '#10B981' : colors.textSecondary },
                                                        complaint.status === 'resolved' && { fontWeight: '600' }
                                                    ]}>
                                                        {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                                                    </AppText>
                                                </View>
                                                <AppText style={[styles.cardDate, { color: colors.textSecondary }]}>{formatDate(complaint.createdAt)}</AppText>
                                            </View>
                                        </View>
                                    ))
                                ) : (
                                    <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                        <MaterialCommunityIcons name="clipboard-check-outline" size={48} color={isDark ? colors.secondary : "#CBD5E1"} />
                                        <AppText style={[styles.emptyText, { color: colors.text }]}>No complaints history</AppText>
                                    </View>
                                )}
                            </>
                        )}

                        {/* Documents Tab */}
                        {activeTab === 'documents' && (
                            <View style={[styles.card, styles.emptyState, { height: 200, backgroundColor: colors.card, shadowColor: colors.textSecondary }]}>
                                <MaterialCommunityIcons name="file-document-outline" size={48} color={isDark ? colors.secondary : "#CBD5E1"} />
                                <AppText style={[styles.emptyText, { color: colors.text }]}>No documents available</AppText>
                                <AppText style={[styles.subEmptyText, { color: colors.textSecondary }]}>Hostel circulars and forms will appear here.</AppText>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </View>
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
        zIndex: 10,
        alignItems: 'center', // Center content horizontally
    },
    centeredContent: {
        // Width is handled inline
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.5,
        flex: 1,
    },
    notificationBadge: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    clearBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    clearBtnText: {
        color: '#004e92',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
        position: 'absolute',
        top: 10,
        right: 10,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    navBar: {
        flexDirection: 'row',
        marginTop: 20,
        marginBottom: 10,
        borderRadius: 16,
        padding: 6,
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
    },
    navItemLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    card: {
        borderRadius: 20,
        padding: 16,
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        gap: 14,
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    iconBox: {
        width: 42,
        height: 42,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
        lineHeight: 22,
        flex: 1,
    },
    cardDate: {
        fontSize: 12,
        fontWeight: '600',
    },
    cardBody: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500',
    },
    statusTag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusTagText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    divider: {
        height: 1,
        marginVertical: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        borderRadius: 24,
        borderWidth: 1,
        gap: 12,
        marginTop: 10,
    },
    emptyText: {
        fontSize: 15,
        fontWeight: '600',
    },
    subEmptyText: {
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
    },
});
