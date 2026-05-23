import MaterialIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Modal, Platform, RefreshControl, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAlert } from '../../context/AlertContext';
import { useTheme } from '../../utils/ThemeContext';
import { isAdmin, useUser } from '../../utils/authUtils';
import { ServiceRequest, subscribeToAllServiceRequests, updateServiceStatus } from '../../utils/serviceUtils';
import AppText from '../../components/AppText';

export default function ServiceRequestsPage() {
    const { colors, theme } = useTheme();
    const insets = useSafeAreaInsets();
    const user = useUser();
    const router = useRouter();
    const { showAlert } = useAlert();
    const { openId } = useLocalSearchParams();
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const flatListRef = React.useRef<FlatList<ServiceRequest>>(null);

    const styles = React.useMemo(() => StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
        header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 24, paddingHorizontal: 24 },
        backBtn: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.2)',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 10,
        },
        headerTitle: { flex: 1, textAlign: 'center', fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 0.5, marginRight: 38 },
        list: { padding: 16 },
        card: {
            backgroundColor: colors.card,
            padding: 16,
            borderRadius: 16,
            marginBottom: 16,
            elevation: 2,
            shadowColor: colors.textSecondary,
            shadowOpacity: 0.05,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 }
        },
        highlightedCard: {
            borderColor: colors.primary,
            borderWidth: 2,
            backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF',
        },
        cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
        userInfo: { flex: 1 },
        serviceType: { fontSize: 16, fontWeight: '700', color: colors.text },
        roomNo: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
        statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
        statusText: { fontSize: 11, fontWeight: '700' },
        date: { fontSize: 12, color: colors.textSecondary, marginTop: 8 },
        eta: { fontSize: 13, color: colors.primary, fontWeight: '600', marginTop: 4 },
        actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
        btn: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
        approveBtn: { backgroundColor: '#3B82F6' },
        denyBtn: { backgroundColor: '#EF4444' },
        completeBtn: { backgroundColor: '#10B981', marginTop: 12 },
        btnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
        empty: { textAlign: 'center', marginTop: 50, color: colors.textSecondary },
        modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
        modalContent: { backgroundColor: colors.card, borderRadius: 20, padding: 20 },
        modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 20, textAlign: 'center', color: colors.text },
        inputGroup: { marginBottom: 16 },
        label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
        input: {
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            padding: 12,
            fontSize: 14,
            backgroundColor: theme === 'dark' ? '#1E293B' : '#F8FAFC',
            color: colors.text
        },
        textArea: { height: 80, textAlignVertical: 'top' },
        modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
        modalBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
        cancelBtn: { backgroundColor: theme === 'dark' ? '#334155' : '#F1F5F9' },
        confirmBtn: { backgroundColor: colors.primary },
        cancelText: { color: colors.textSecondary, fontWeight: '600' },
        confirmText: { color: '#fff', fontWeight: '600' }
    }), [colors, theme]);
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReq, setSelectedReq] = useState<ServiceRequest | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [eta, setEta] = useState('');
    const [note, setNote] = useState('');
    const [actionType, setActionType] = useState<'approve' | 'deny' | null>(null);

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    }, []);

    useEffect(() => {
        const unsubscribe = subscribeToAllServiceRequests((data) => {
            setRequests(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (openId && requests.length > 0) {
            const index = requests.findIndex(r => r.id === openId);
            if (index !== -1) {
                setTimeout(() => {
                    flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
                    setHighlightedId(openId as string);
                    setTimeout(() => setHighlightedId(null), 3000);
                }, 500);
            }
        }
    }, [openId, requests]);

    const handleAction = (req: ServiceRequest, type: 'approve' | 'deny') => {
        setSelectedReq(req);
        setActionType(type);
        setEta('');
        setNote('');
        setModalVisible(true);
    };

    const submitAction = async () => {
        if (!selectedReq || !actionType) return;
        try {
            const status = actionType === 'approve' ? 'approved' : 'rejected';
            await updateServiceStatus(selectedReq.id, status, eta, note);
            setModalVisible(false);
            showAlert("Success", `Request ${status}.`, [], 'success');
        } catch (e) {
            showAlert("Error", "Failed to update request.", [], 'error');
        }
    };

    const handleStatusUpdate = (id: string, currentStatus: string, newStatus: string) => {
        showAlert(
            'Update Status',
            `Mark request as ${newStatus}?`,
            [
                { text: 'Cancel', style: 'cancel', onPress: () => { } },
                {
                    text: 'Update',
                    onPress: async () => {
                        try {
                            await updateServiceStatus(id, newStatus as any);
                            showAlert('Success', `Request marked as ${newStatus}`, [], 'success');
                        } catch (error) {
                            showAlert('Error', "Failed to update status", [], 'error');
                        }
                    }
                }
            ]
        );
    };

    if (!isAdmin(user)) return <View style={styles.center}><AppText>Access Denied</AppText></View>;

    const renderItem = ({ item }: { item: ServiceRequest }) => (
        <View style={[styles.card, highlightedId === item.id && styles.highlightedCard]}>
            <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                    <AppText style={styles.serviceType}>{item.serviceType}</AppText>
                    <AppText style={styles.roomNo}>Room {item.roomNo} • {item.studentName}</AppText>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <AppText style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status.toUpperCase()}</AppText>
                </View>
            </View>

            {item.description ? (
                <AppText style={{ fontSize: 13, color: colors.textSecondary, fontStyle: 'italic', marginBottom: 8 }}>
                    "{item.description}"
                </AppText>
            ) : null}

            {/* Timestamps */}
            <AppText style={styles.date}>Requested: {item.createdAt instanceof Date ? item.createdAt.toLocaleString() : ''}</AppText>
            {item.estimatedTime && <AppText style={styles.eta}>ETA: {item.estimatedTime}</AppText>}

            {/* Actions */}
            {item.status === 'pending' && (
                <View style={styles.actionRow}>
                    <TouchableOpacity style={[styles.btn, styles.approveBtn]} onPress={() => handleAction(item, 'approve')}>
                        <AppText style={styles.btnText}>Approve & Set ETA</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, styles.denyBtn]} onPress={() => handleAction(item, 'deny')}>
                        <AppText style={styles.btnText}>Deny</AppText>
                    </TouchableOpacity>
                </View>
            )}
            {item.status === 'approved' && (
                <TouchableOpacity style={[styles.btn, styles.completeBtn]} onPress={() => handleStatusUpdate(item.id, item.status, 'completed')}>
                    <AppText style={styles.btnText}>Mark Completed</AppText>
                </TouchableOpacity>
            )}
        </View>
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return '#F59E0B';
            case 'approved': return '#3B82F6';
            case 'completed': return '#10B981';
            case 'rejected': return '#EF4444';
            default: return '#999';
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
            <LinearGradient colors={['#000428', '#004e92']} style={[styles.header, { paddingTop: insets.top + 18 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialIcons name="chevron-left" size={32} color="#fff" />
                </TouchableOpacity>
                <AppText style={styles.headerTitle}>Service Requests</AppText>
            </LinearGradient>

            {loading ? <ActivityIndicator size="large" color="#004e92" style={{ marginTop: 50 }} /> : (
                <FlatList
                    ref={flatListRef}
                    data={requests}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
                    ListEmptyComponent={<AppText style={styles.empty}>No requests found.</AppText>}
                    onScrollToIndexFailed={(info) => {
                        const wait = new Promise(resolve => setTimeout(resolve, 500));
                        wait.then(() => {
                            flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
                        });
                    }}
                />
            )}

            <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <AppText style={styles.modalTitle}>{actionType === 'approve' ? 'Approve Request' : 'Deny Request'}</AppText>

                        {actionType === 'approve' && (
                            <View style={styles.inputGroup}>
                                <AppText style={styles.label}>Estimated Completion Time</AppText>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Today 5:00 PM"
                                    value={eta}
                                    onChangeText={setEta}
                                />
                            </View>
                        )}

                        <View style={styles.inputGroup}>
                            <AppText style={styles.label}>Admin Note (Optional)</AppText>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Add a note..."
                                value={note}
                                onChangeText={setNote}
                                multiline
                            />
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                                <AppText style={styles.cancelText}>Cancel</AppText>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, styles.confirmBtn]} onPress={submitAction}>
                                <AppText style={styles.confirmText}>Confirm</AppText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>


        </SafeAreaView>
    );
}


