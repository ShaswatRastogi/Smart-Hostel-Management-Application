import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View, Modal, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../context/AlertContext';
import { useRefresh } from '../hooks/useRefresh';
import { createLeaveRequest, getStudentLeaves, LeaveRequest } from '../utils/leavesUtils';
import { fetchUserData } from '../utils/nameUtils';
import { useTheme } from '../utils/ThemeContext';
import { formatUniversalTime } from '../utils/timeUtils';
import AppText from '../components/AppText';
import QRCode from 'react-native-qrcode-svg';

export default function LeaveRequestPage() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const { showAlert } = useAlert();
    const [reason, setReason] = useState('');
    const [category, setCategory] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<LeaveRequest[]>([]);
    
    // QR Modal State
    const [qrModalVisible, setQrModalVisible] = useState(false);
    const [selectedQrCode, setSelectedQrCode] = useState<string | null>(null);

    const { refreshing, onRefresh } = useRefresh(async () => {
        await loadHistory();
    }, () => {
        setReason('');
        setCategory('');
        setStartDate(new Date());
        setEndDate(new Date());
    });

    /* Replaced by useRefresh
    const onRefresh = async () => {
        setRefreshing(true);
        await loadHistory();
        setRefreshing(false);
    };
    */

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const user = await fetchUserData();
            if (user && user.email) {
                const leaves = await getStudentLeaves(user.email);
                setHistory(leaves);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async () => {
        if (!reason.trim()) {
            showAlert('Error', 'Please provide a reason for your leave.', [], 'error');
            return;
        }

        if (endDate < startDate) {
            showAlert('Error', 'End date cannot be before start date.', [], 'error');
            return;
        }

        setLoading(true);
        try {
            const user = await fetchUserData();
            if (!user) throw new Error("User not found");

            const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include start day

            await createLeaveRequest({
                studentName: user.fullName,
                studentRoom: user.roomNo || 'N/A',
                studentEmail: user.email || '',
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                category: category,
                reason: reason,
                days: diffDays,
            });

            showAlert('Success', 'Leave request submitted successfully!', [], 'success');
            setReason('');
            setCategory('');
            loadHistory();
        } catch (error) {
            showAlert('Error', 'Failed to submit leave request. Please try again.', [], 'error');
        } finally {
            setLoading(false);
        }
    };

    const onChangeStart = (event: any, selectedDate?: Date) => {
        setShowStartPicker(Platform.OS === 'ios');
        if (selectedDate) setStartDate(selectedDate);
    };

    const onChangeEnd = (event: any, selectedDate?: Date) => {
        setShowEndPicker(Platform.OS === 'ios');
        if (selectedDate) setEndDate(selectedDate);
    };

    /* Handled by useRefresh
    const handleRefresh = async () => {
        setRefreshing(true);
        await loadHistory();
        setRefreshing(false);
    };
    */

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return '#10B981';
            case 'rejected': return '#EF4444';
            default: return '#F59E0B';
        }
    };

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
                        <Pressable onPress={() => router.back()} style={styles.backBtn}>
                            <MaterialIcons name="arrow-back" size={24} color="#fff" />
                        </Pressable>
                        <View style={{ flex: 1 }}>
                            <AppText style={styles.headerTitle}>Apply for Leave</AppText>
                            <AppText style={styles.headerSubtitle}>Request Time Off</AppText>
                        </View>

                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#fff" : colors.primary} colors={[colors.primary]} />}
            >
                <View style={{ padding: 24 }}>
                    {/* Form Section */}
                    <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <AppText style={[styles.sectionTitle, { color: colors.textSecondary }]}>NEW REQUEST</AppText>

                        <View style={styles.dateRow}>
                            <View style={styles.dateField}>
                                <AppText style={[styles.label, { color: colors.textSecondary }]}>From Date</AppText>
                                <Pressable onPress={() => setShowStartPicker(true)} style={[styles.dateInput, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                    <MaterialCommunityIcons name="calendar" size={20} color={colors.textSecondary} />
                                    <AppText style={[styles.dateText, { color: colors.text }]}>{formatUniversalTime(startDate, { day: 'numeric', month: 'short', year: 'numeric' })}</AppText>
                                </Pressable>
                                {showStartPicker && (
                                    <DateTimePicker
                                        value={startDate}
                                        mode="date"
                                        display="default"
                                        onChange={onChangeStart}
                                        minimumDate={new Date()}
                                    />
                                )}
                            </View>

                            <View style={styles.dateField}>
                                <AppText style={[styles.label, { color: colors.textSecondary }]}>To Date</AppText>
                                <Pressable onPress={() => setShowEndPicker(true)} style={[styles.dateInput, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                    <MaterialCommunityIcons name="calendar" size={20} color={colors.textSecondary} />
                                    <AppText style={[styles.dateText, { color: colors.text }]}>{formatUniversalTime(endDate, { day: 'numeric', month: 'short', year: 'numeric' })}</AppText>
                                </Pressable>
                                {showEndPicker && (
                                    <DateTimePicker
                                        value={endDate}
                                        mode="date"
                                        display="default"
                                        onChange={onChangeEnd}
                                        minimumDate={startDate}
                                    />
                                )}
                            </View>
                        </View>

                        <AppText style={[styles.label, { marginTop: 16, color: colors.textSecondary }]}>Going to:</AppText>
                        <TextInput
                            style={[styles.dateInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text, marginBottom: 16 }]}
                            placeholder="e.g. Home, Market, Hospital..."
                            placeholderTextColor={colors.textSecondary}
                            value={category}
                            onChangeText={setCategory}
                        />

                        <AppText style={[styles.label, { color: colors.textSecondary }]}>Reason</AppText>
                        <TextInput
                            style={[styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                            placeholder="e.g. Visiting home for festival..."
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            numberOfLines={3}
                            value={reason}
                            onChangeText={setReason}
                            textAlignVertical="top"
                        />

                        <Pressable
                            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#7C3AED', '#6D28D9']}
                                style={styles.btnGradient}
                            >
                                {loading ? (
                                    <AppText style={styles.btnText}>Submitting...</AppText>
                                ) : (
                                    <AppText style={styles.btnText}>Submit Request</AppText>
                                )}
                            </LinearGradient>
                        </Pressable>
                    </View>

                    {/* History Section */}
                    <AppText style={[styles.sectionTitle, { marginTop: 24, marginLeft: 4, color: colors.textSecondary }]}>PAST REQUESTS</AppText>
                    {history.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="calendar-blank-outline" size={48} color={colors.textSecondary} />
                            <AppText style={[styles.emptyText, { color: colors.textSecondary }]}>No leave history found</AppText>
                        </View>
                    ) : (
                        <View style={styles.historyList}>
                            {history.map((item) => (
                                <View key={item.id} style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                    <View style={styles.historyHeader}>
                                        <View style={styles.dateInfo}>
                                            <AppText style={[styles.historyDate, { color: colors.text }]}>
                                                {formatUniversalTime(item.startDate, { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </AppText>
                                            <MaterialCommunityIcons name="arrow-right" size={16} color={colors.textSecondary} />
                                            <AppText style={[styles.historyDate, { color: colors.text }]}>
                                                {formatUniversalTime(item.endDate, { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </AppText>
                                        </View>
                                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                                            <AppText style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                                                {item.status.toUpperCase()}
                                            </AppText>
                                        </View>
                                    </View>
                                    <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6}}>
                                        <View style={{backgroundColor: colors.primary + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6}}>
                                            <AppText style={{color: colors.primary, fontSize: 10, fontWeight: '700'}}>{item.category || 'General'}</AppText>
                                        </View>
                                    </View>
                                    <AppText style={[styles.historyReason, { color: colors.textSecondary }]}>{item.reason}</AppText>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                        <AppText style={[styles.durationText, { color: colors.textSecondary }]}>{item.days} days</AppText>
                                        
                                        {item.status === 'approved' && item.qrCode && (
                                            <TouchableOpacity 
                                                style={[styles.qrBtn, { backgroundColor: colors.primary + '15', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }]} 
                                                onPress={() => {
                                                    setSelectedQrCode(item.qrCode || null);
                                                    setQrModalVisible(true);
                                                }}
                                            >
                                                <MaterialCommunityIcons name="qrcode-scan" size={16} color={colors.primary} />
                                                <AppText style={{ color: colors.primary, fontSize: 12, fontWeight: '700', marginLeft: 4 }}>Show Pass</AppText>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                </View>
            </ScrollView>

            {/* QR Code Modal */}
            <Modal
                visible={qrModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setQrModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E293B' : '#fff' }]}>
                        <View style={styles.modalHeader}>
                            <AppText style={[styles.modalTitle, { color: colors.text }]}>Gate Pass</AppText>
                            <TouchableOpacity onPress={() => setQrModalVisible(false)} style={styles.closeBtn}>
                                <MaterialIcons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.qrContainer}>
                            {selectedQrCode && (
                                <View style={styles.qrWrapper}>
                                    <View style={{ backgroundColor: '#fff', padding: 16, borderRadius: 24, justifyContent: 'center', alignItems: 'center' }}>
                                        <QRCode value={selectedQrCode} size={180} />
                                        <AppText style={{ color: '#7C3AED', fontSize: 13, fontWeight: '800', marginTop: 12, textAlign: 'center', letterSpacing: 1 }}>VERIFIED PASS</AppText>
                                    </View>
                                </View>
                            )}
                            
                            {selectedQrCode && (
                                <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9', borderRadius: 12, padding: 14, width: '100%', marginBottom: 16 }}>
                                    <AppText style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Pass Code (Fallback)</AppText>
                                    <AppText style={{ color: colors.text, fontSize: 14, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }} selectable>{selectedQrCode}</AppText>
                                </View>
                            )}

                            <AppText style={[styles.qrHint, { color: colors.textSecondary }]}>
                                Show this QR code to the Guard at the Main Gate to log your movement.
                            </AppText>
                        </View>
                    </View>
                </View>
            </Modal>
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
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
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
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
    },
    content: {
        flexGrow: 1,
    },
    formCard: {
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748B',
        marginBottom: 16,
        letterSpacing: 1,
    },
    dateRow: {
        flexDirection: 'row',
        gap: 16,
    },
    dateField: {
        flex: 1,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 8,
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        gap: 8,
    },
    dateText: {
        color: '#1E293B',
        fontWeight: '500',
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        height: 80,
        marginBottom: 20,
    },
    submitBtn: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    btnGradient: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    btnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    historyList: {
        gap: 12,
    },
    historyCard: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    dateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    historyDate: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    historyReason: {
        color: '#64748B',
        fontSize: 13,
        marginBottom: 4,
    },
    durationText: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        color: '#94A3B8',
        marginTop: 12,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
    },
    closeBtn: {
        padding: 4,
    },
    qrContainer: {
        alignItems: 'center',
    },
    qrWrapper: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
    },
    qrHint: {
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 20,
    }
});
