import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Linking,
    Modal,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../../context/AlertContext';
import { useRefresh } from '../../hooks/useRefresh';
import { useTheme } from '../../utils/ThemeContext';
import {
    approveVisitor,
    checkInVisitor,
    checkOutVisitor,
    formatDate,
    formatTime,
    getAllVisitors,
    getStatusColor,
    getStatusIcon,
    getStatusLabel,
    rejectVisitor,
    Visitor
} from '../../utils/visitorUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
type TabType = 'all' | 'pending' | 'active';

export default function AdminVisitors() {
    const { colors, isDark } = useTheme();
    const router = useRouter();
    const { showAlert } = useAlert();

    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const { studentId, studentName } = useLocalSearchParams();

    const flatListRef = useRef<FlatList>(null);
    const { refreshing, onRefresh } = useRefresh(loadVisitors);

    useEffect(() => {
        loadVisitors();
    }, []);

    // Sync FlatList with activeTab
    useEffect(() => {
        const tabIndex = ['all', 'pending', 'active'].indexOf(activeTab);
        if (flatListRef.current && tabIndex >= 0) {
            flatListRef.current.scrollToIndex({
                index: tabIndex,
                animated: true
            });
        }
    }, [activeTab]);

    async function loadVisitors() {
        try {
            setLoading(true);
            const filters: any = {};
            if (studentId) filters.studentId = Number(studentId);

            const data = await getAllVisitors(filters);
            setVisitors(data);
        } catch (error) {
            console.error('Error loading visitors:', error);
            showAlert('Error', 'Failed to load visitors', [], 'error');
        } finally {
            setLoading(false);
        }
    }

    const handleApprove = (visitor: Visitor) => {
        showAlert(
            'Approve Visitor',
            `Approve visitor request for ${visitor.visitor_name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    onPress: async () => {
                        try {
                            await approveVisitor(visitor.id);
                            showAlert('Success', 'Visitor approved successfully', [], 'success');
                            loadVisitors();
                        } catch (error) {
                            showAlert('Error', 'Failed to approve visitor', [], 'error');
                        }
                    }
                }
            ],
            'success'
        );
    };

    const handleReject = (visitor: Visitor) => {
        setSelectedVisitor(visitor);
        setShowRejectModal(true);
    };

    const submitRejection = async () => {
        if (!rejectReason.trim()) {
            showAlert('Missing Information', 'Please provide a reason for rejection', [], 'error');
            return;
        }

        if (!selectedVisitor) return;

        try {
            await rejectVisitor(selectedVisitor.id, rejectReason.trim());
            showAlert('Success', 'Visitor request rejected', [], 'success');
            setShowRejectModal(false);
            setRejectReason('');
            setSelectedVisitor(null);
            loadVisitors();
        } catch (error) {
            showAlert('Error', 'Failed to reject visitor', [], 'error');
        }
    };

    const handleCheckIn = (visitor: Visitor) => {
        showAlert(
            'Check In Visitor',
            `Check in ${visitor.visitor_name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Check In',
                    onPress: async () => {
                        try {
                            await checkInVisitor(visitor.id);
                            showAlert('Success', 'Visitor checked in', [], 'success');
                            loadVisitors();
                        } catch (error) {
                            showAlert('Error', 'Failed to check in visitor', [], 'error');
                        }
                    }
                }
            ],
            'info'
        );
    };

    const handleCheckOut = (visitor: Visitor) => {
        showAlert(
            'Check Out Visitor',
            `Check out ${visitor.visitor_name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Check Out',
                    onPress: async () => {
                        try {
                            await checkOutVisitor(visitor.id);
                            showAlert('Success', 'Visitor checked out', [], 'success');
                            loadVisitors();
                        } catch (error) {
                            showAlert('Error', 'Failed to check out visitor', [], 'error');
                        }
                    }
                }
            ],
            'info'
        );
    };

    const getFilteredVisitors = (tab: TabType) => {
        switch (tab) {
            case 'pending':
                return visitors.filter(v => v.status === 'pending');
            case 'active':
                return visitors.filter(v => v.status === 'checked_in');
            default:
                return visitors;
        }
    };

    const pendingCount = visitors.filter(v => v.status === 'pending').length;
    const activeCount = visitors.filter(v => v.status === 'checked_in').length;
    const todayCount = visitors.filter(v => {
        const today = new Date().toISOString().split('T')[0];
        return v.expected_date === today;
    }).length;

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background
        },
        header: {
            paddingBottom: 24,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
            marginBottom: 16
        },
        headerContent: {
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: 8
        },
        headerTop: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 0
        },
        headerTitle: {
            fontSize: 28,
            fontWeight: '700',
            color: '#fff',
            letterSpacing: 0.5
        },
        headerSubtitle: {
            fontSize: 14,
            color: 'rgba(255,255,255,0.8)',
            fontWeight: '500',
            marginTop: 4
        },
        statsRow: {
            flexDirection: 'row',
            gap: 12,
            marginTop: 0,
            marginBottom: 16,
            paddingHorizontal: 20
        },
        statCard: {
            flex: 1,
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 12,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 2,
            borderWidth: 1,
            borderColor: colors.border
        },
        iconContainer: {
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 6
        },
        statNumber: {
            fontSize: 20,
            fontWeight: '800',
            color: colors.text,
            marginBottom: 2
        },
        statLabel: {
            fontSize: 10,
            fontWeight: '600',
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 0.5
        },
        tabsContainer: {
            flexDirection: 'row',
            gap: 10,
            marginBottom: 12,
            paddingHorizontal: 20
        },
        tab: {
            paddingHorizontal: 20,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2
        },
        activeTab: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
            shadowOpacity: 0.2
        },
        tabText: {
            fontSize: 13,
            fontWeight: '600',
            color: colors.textSecondary
        },
        activeTabText: {
            color: '#fff'
        },
        page: {
            width: SCREEN_WIDTH,
            flex: 1
        },
        visitorsList: {
            padding: 20,
            paddingTop: 4,
            gap: 12
        },
        visitorCard: {
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 2,
            marginBottom: 12
        },
        visitorHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 10
        },
        visitorInfo: {
            flex: 1
        },
        visitorName: {
            fontSize: 16,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 2
        },
        visitorPhone: {
            fontSize: 13,
            color: colors.textSecondary,
            marginBottom: 2
        },
        studentInfo: {
            fontSize: 12,
            color: colors.primary,
            fontWeight: '600'
        },
        statusBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 10
        },
        statusText: {
            fontSize: 11,
            fontWeight: '700'
        },
        detailsRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 6
        },
        detailText: {
            fontSize: 13,
            color: colors.textSecondary,
            flex: 1
        },
        purpose: {
            fontSize: 13,
            color: colors.text,
            lineHeight: 18,
            marginTop: 6,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: colors.border
        },
        actionsRow: {
            flexDirection: 'row',
            gap: 8,
            marginTop: 10
        },
        actionButton: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            paddingVertical: 8,
            borderRadius: 10,
            borderWidth: 1
        },
        approveButton: {
            backgroundColor: '#10B981',
            borderColor: '#10B981'
        },
        rejectButton: {
            backgroundColor: 'transparent',
            borderColor: '#EF4444'
        },
        checkInButton: {
            backgroundColor: '#3B82F6',
            borderColor: '#3B82F6'
        },
        checkOutButton: {
            backgroundColor: '#F59E0B',
            borderColor: '#F59E0B'
        },
        actionButtonText: {
            fontSize: 13,
            fontWeight: '600'
        },
        emptyState: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 60
        },
        emptyIcon: {
            marginBottom: 16
        },
        emptyText: {
            fontSize: 15,
            color: colors.textSecondary,
            fontWeight: '500'
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24
        },
        modalContainer: {
            backgroundColor: colors.card,
            borderRadius: 24,
            padding: 24,
            width: '100%',
            maxWidth: 400
        },
        modalTitle: {
            fontSize: 20,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 16
        },
        modalLabel: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 8
        },
        modalInput: {
            backgroundColor: isDark ? colors.background : '#F8FAFC',
            borderRadius: 12,
            padding: 12,
            fontSize: 14,
            color: colors.text,
            borderWidth: 1,
            borderColor: colors.border,
            height: 100,
            textAlignVertical: 'top',
            marginBottom: 20
        },
        modalActions: {
            flexDirection: 'row',
            gap: 12
        },
        modalButton: {
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: 'center'
        },
        modalCancelButton: {
            backgroundColor: colors.border
        },
        modalSubmitButton: {
            backgroundColor: '#EF4444'
        },
        modalButtonText: {
            fontSize: 14,
            fontWeight: '600'
        }
    });

    const renderVisitorList = (data: Visitor[], tab: TabType) => {
        if (loading) {
            return (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            );
        }

        if (data.length === 0) {
            return (
                <View style={[styles.emptyState, { height: '100%' }]}>
                    <MaterialCommunityIcons
                        name="account-group-outline"
                        size={64}
                        color={colors.textSecondary}
                        style={styles.emptyIcon}
                    />
                    <Text style={styles.emptyText}>
                        {tab === 'all' ? 'No visitors yet' : `No ${tab} visitors`}
                    </Text>
                </View>
            );
        }

        return (
            <FlatList
                data={data}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.visitorsList}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={isDark ? '#fff' : colors.primary}
                        colors={[colors.primary]}
                    />
                }
                renderItem={({ item: visitor }) => (
                    <View style={styles.visitorCard}>
                        <View style={styles.visitorHeader}>
                            <View style={styles.visitorInfo}>
                                <Text style={styles.visitorName}>{visitor.visitor_name}</Text>
                                <TouchableOpacity
                                    onPress={() => Linking.openURL(`tel:${visitor.visitor_phone}`)}
                                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#1E3A8A' : '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginVertical: 4 }}
                                >
                                    <MaterialCommunityIcons name="phone" size={14} color={colors.primary} style={{ marginRight: 4 }} />
                                    <Text style={[styles.visitorPhone, { color: colors.primary, fontWeight: '600', marginBottom: 0 }]}>
                                        {visitor.visitor_phone}
                                    </Text>
                                </TouchableOpacity>
                                <Text style={styles.studentInfo}>Student: {visitor.student_name}</Text>
                                <Text style={[styles.studentInfo, { marginTop: 2 }]}>Room: {visitor.room_number}</Text>
                            </View>
                            <View
                                style={[
                                    styles.statusBadge,
                                    { backgroundColor: getStatusColor(visitor.status) + '20' }
                                ]}
                            >
                                <MaterialCommunityIcons
                                    name={getStatusIcon(visitor.status) as any}
                                    size={14}
                                    color={getStatusColor(visitor.status)}
                                />
                                <Text style={[styles.statusText, { color: getStatusColor(visitor.status) }]}>
                                    {getStatusLabel(visitor.status)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.detailsRow}>
                            <MaterialCommunityIcons name="calendar" size={16} color={colors.textSecondary} />
                            <Text style={styles.detailText}>{formatDate(visitor.expected_date)}</Text>
                        </View>

                        <View style={styles.detailsRow}>
                            <MaterialCommunityIcons name="clock-outline" size={16} color={colors.textSecondary} />
                            <Text style={styles.detailText}>
                                {visitor.expected_time_in ? formatTime(visitor.expected_time_in) : 'N/A'} -{' '}
                                {visitor.expected_time_out ? formatTime(visitor.expected_time_out) : 'N/A'}
                            </Text>
                        </View>

                        <Text style={styles.purpose}>{visitor.purpose}</Text>

                        {/* Actions based on status */}
                        {visitor.status === 'pending' && (
                            <View style={styles.actionsRow}>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.approveButton]}
                                    onPress={() => handleApprove(visitor)}
                                >
                                    <MaterialCommunityIcons name="check-circle" size={18} color="#fff" />
                                    <Text style={[styles.actionButtonText, { color: '#fff' }]}>Approve</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.rejectButton]}
                                    onPress={() => handleReject(visitor)}
                                >
                                    <MaterialCommunityIcons name="close-circle" size={18} color="#EF4444" />
                                    <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Reject</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {visitor.status === 'approved' && (
                            <View style={styles.actionsRow}>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.checkInButton]}
                                    onPress={() => handleCheckIn(visitor)}
                                >
                                    <MaterialCommunityIcons name="login" size={18} color="#fff" />
                                    <Text style={[styles.actionButtonText, { color: '#fff' }]}>Check In</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {visitor.status === 'checked_in' && (
                            <View style={styles.actionsRow}>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.checkOutButton]}
                                    onPress={() => handleCheckOut(visitor)}
                                >
                                    <MaterialCommunityIcons name="logout" size={18} color="#fff" />
                                    <Text style={[styles.actionButtonText, { color: '#fff' }]}>Check Out</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
            />
        );
    };

    const tabs: TabType[] = ['all', 'pending', 'active'];

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
                        <View style={styles.headerTop}>
                            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
                                <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                            </TouchableOpacity>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.headerTitle}>Visitor Management</Text>
                                {studentName ? (
                                    <TouchableOpacity onPress={() => router.setParams({ studentId: undefined, studentName: undefined })}>
                                        <Text style={styles.headerSubtitle}>
                                            Filtered: {studentName} <MaterialCommunityIcons name="close-circle" size={14} color="rgba(255,255,255,0.8)" />
                                        </Text>
                                    </TouchableOpacity>
                                ) : (
                                    <Text style={styles.headerSubtitle}>Approve and track visitors</Text>
                                )}
                            </View>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* Stats Cards */}
            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
                        <MaterialCommunityIcons name="clock-outline" size={18} color="#D97706" />
                    </View>
                    <Text style={styles.statNumber}>{pendingCount}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                </View>

                <View style={styles.statCard}>
                    <View style={[styles.iconContainer, { backgroundColor: '#D1FAE5' }]}>
                        <MaterialCommunityIcons name="check-circle-outline" size={18} color="#059669" />
                    </View>
                    <Text style={styles.statNumber}>{activeCount}</Text>
                    <Text style={styles.statLabel}>Active</Text>
                </View>

                <View style={styles.statCard}>
                    <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                        <MaterialCommunityIcons name="calendar-today" size={18} color="#2563EB" />
                    </View>
                    <Text style={styles.statNumber}>{todayCount}</Text>
                    <Text style={styles.statLabel}>Today</Text>
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                {tabs.map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.activeTab]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Swipeable Content */}
            <FlatList
                ref={flatListRef}
                data={tabs}
                keyExtractor={item => item}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={ev => {
                    const index = Math.round(ev.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                    setActiveTab(tabs[index]);
                }}
                renderItem={({ item: tab }) => (
                    <View style={styles.page}>
                        {renderVisitorList(getFilteredVisitors(tab), tab)}
                    </View>
                )}
            />

            {/* Reject Modal */}
            <Modal
                visible={showRejectModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowRejectModal(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setShowRejectModal(false)}>
                    <Pressable onPress={e => e.stopPropagation()}>
                        <View style={styles.modalContainer}>
                            <Text style={styles.modalTitle}>Reject Visitor Request</Text>
                            <Text style={styles.modalLabel}>Reason for Rejection *</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={rejectReason}
                                onChangeText={setRejectReason}
                                placeholder="Enter reason for rejection..."
                                placeholderTextColor={colors.textSecondary}
                                multiline
                                numberOfLines={4}
                            />
                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.modalCancelButton]}
                                    onPress={() => {
                                        setShowRejectModal(false);
                                        setRejectReason('');
                                        setSelectedVisitor(null);
                                    }}
                                >
                                    <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.modalSubmitButton]}
                                    onPress={submitRejection}
                                >
                                    <Text style={[styles.modalButtonText, { color: '#fff' }]}>Reject</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}
