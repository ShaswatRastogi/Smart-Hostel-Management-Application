import MaterialIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, RefreshControl, ScrollView, SectionList, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAlert } from '../../context/AlertContext';
import { performGlobalSearch } from '../../utils/adminSearchUtils';
import { isAdmin, useUser } from '../../utils/authUtils';
import { Payment } from '../../utils/financeUtils';
import { useTheme } from '../../utils/ThemeContext';
import AppText from '../../components/AppText';

export default function FinancePage() {
    const { colors, theme } = useTheme();
    const insets = useSafeAreaInsets();
    const user = useUser();
    const router = useRouter();
    const { showAlert } = useAlert();

    const [activeTab, setActiveTab] = useState<'requests' | 'history'>('requests');
    const pagerRef = React.useRef<PagerView>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [requests, setRequests] = useState<any[]>([]); // Pending requests
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filter state
    const [historySearch, setHistorySearch] = useState('');
    const [historySuggestions, setHistorySuggestions] = useState<any[]>([]);
    const [isSpecificStudentView, setIsSpecificStudentView] = useState(false);

    // Constants
    const [upiId, setUpiId] = useState('');
    const [payeeName, setPayeeName] = useState('');
    const [settingsModalVisible, setSettingsModalVisible] = useState(false);

    // Stats
    const [totalCollected, setTotalCollected] = useState(0);

    // Main Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [mode, setMode] = useState<'record' | 'request'>('request'); // 'record' = direct cash, 'request' = send invoice

    const [studentSearch, setStudentSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<{ id: string, name: string } | null>(null);
    const [studentSearchResults, setStudentSearchResults] = useState<any[]>([]);

    const [amount, setAmount] = useState('');
    const [type, setType] = useState<Payment['type']>('Hostel Fee');
    const [method, setMethod] = useState<Payment['method']>('Online');
    const [remarks, setRemarks] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Receipt gen state
    const [generatingReceiptId, setGeneratingReceiptId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const { getPaymentSettings } = await import('../../utils/financeUtils');
        const settings = await getPaymentSettings();
        if (settings) {
            setUpiId(settings.upiId);
            setPayeeName(settings.payeeName);
        }
    };

    const saveData = async () => {
        const { savePaymentSettings } = await import('../../utils/financeUtils');
        if (!upiId || !payeeName) {
            showAlert('Error', 'Please enter both UPI ID and Payee Name', [], 'error');
            return;
        }
        await savePaymentSettings(upiId, payeeName);
        setSettingsModalVisible(false);
        showAlert('Success', 'Payment settings saved', [], 'success');
    };

    const fetchData = async () => {
        setLoading(true);
        const { getRecentPayments, getAllRequests } = await import('../../utils/financeUtils');

        // Fetch History
        const pData = await getRecentPayments(50);
        const filteredPData = pData.filter(p => p.amount !== 20);
        setPayments(filteredPData);
        const total = filteredPData.reduce((sum, p) => sum + p.amount, 0);
        setTotalCollected(total);

        // Fetch Pending Requests
        const rData = await getAllRequests('paid_unverified'); // Prioritize unverified
        const allPending = await getAllRequests('pending');

        const combinedRequests = [...rData, ...allPending].filter(r => r.amount !== 20);
        setRequests(combinedRequests); // Show unverified first

        setLoading(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const handleHistorySearch = async (text: string) => {
        setHistorySearch(text);
        setIsSpecificStudentView(false); // Reset view if user types
        if (text.length > 2) {
            const results = await performGlobalSearch(text);
            setHistorySuggestions(results.filter(r => r.type === 'student'));
        } else {
            setHistorySuggestions([]);
            if (text.length === 0 && !isSpecificStudentView) fetchData(); // Reset if cleared
        }
    };

    const selectHistoryStudent = async (s: any) => {
        setHistorySuggestions([]);
        setHistorySearch(s.title); // Show name in box
        setIsSpecificStudentView(true); // Enable specific view mode
        setLoading(true);
        try {
            const { getStudentPayments } = await import('../../utils/financeUtils');
            const data = await getStudentPayments(s.id);
            const filteredData = data.filter(p => p.amount !== 20);
            setPayments(filteredData);
            // Don't update total collected maybe? Or update it to show student total?
            // Let's update it to reflect the CURRENT VIEW.
            const total = filteredData.reduce((sum, p) => sum + p.amount, 0);
            setTotalCollected(total);
        } catch (e: any) {
            showAlert('Error', 'Failed to fetch history', [], 'error');
        } finally {
            setLoading(false);
        }
    };

    const clearHistorySearch = () => {
        setHistorySearch('');
        setHistorySuggestions([]);
        setIsSpecificStudentView(false);
        fetchData();
    };

    // Helper to group by date
    const getGroupedHistory = () => {
        // If we have search text but haven't selected a student (manual filter)
        // We still filter the CURRENT `payments` list.
        // This handles the case where user types but doesn't select suggestion, or filters the loaded list.
        let filtered = payments;

        // Only apply text filter if NOT in specific student view
        // In specific view, we want to see ALL fetched payments for that student
        if (!isSpecificStudentView && historySearch.trim()) {
            const query = historySearch.toLowerCase();
            // Only filter if the current list allows it. 
            // If we just fetched specific student data, searching inside it is fine.
            filtered = filtered.filter(p =>
                p.studentName.toLowerCase().includes(query) ||
                p.receiptNumber?.toLowerCase().includes(query) ||
                p.amount.toString().includes(query)
            );
        }

        // 2. Group by Date
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        const newSections: { title: string, data: Payment[] }[] = [];
        filtered.forEach(p => {
            const d = new Date(p.date);
            const dateStr = d.toDateString();
            let title = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

            if (dateStr === today) title = "Today";
            else if (dateStr === yesterday) title = "Yesterday";

            // Check if last section has same title
            if (newSections.length > 0 && newSections[newSections.length - 1].title === title) {
                newSections[newSections.length - 1].data.push(p);
            } else {
                newSections.push({ title, data: [p] });
            }
        });

        return newSections;
    };

    const groupedHistory = React.useMemo(() => getGroupedHistory(), [payments, historySearch, isSpecificStudentView]);

    // Search for student when adding payment
    const handleStudentSearch = async (text: string) => {
        setStudentSearch(text);
        if (text.length > 2) {
            const results = await performGlobalSearch(text);
            setStudentSearchResults(results.filter(r => r.type === 'student'));
        } else {
            setStudentSearchResults([]);
        }
    };

    const selectStudent = (s: any) => {
        setSelectedStudent({ id: s.id, name: s.title });
        setStudentSearch(s.title);
        setStudentSearchResults([]);
    };

    const handleSubmit = async () => {
        if (!selectedStudent || !amount) {
            showAlert('Error', 'Please select a student and enter amount', [], 'error');
            return;
        }

        setSubmitting(true);
        try {
            const { recordPayment, createPaymentRequest } = await import('../../utils/financeUtils');

            if (mode === 'record') {
                // Direct Cash Payment
                const receiptNo = await recordPayment(
                    selectedStudent.id,
                    parseFloat(amount),
                    type,
                    method,
                    remarks
                );
                showAlert('Success', `Payment Recorded!\nReceipt: ${receiptNo}`, [{ text: 'OK', onPress: () => onRefresh() }], 'success');
            } else {
                // Create Request
                await createPaymentRequest(
                    selectedStudent.id,
                    selectedStudent.name,
                    parseFloat(amount),
                    type,
                    new Date(), // Due now
                    remarks
                );
                showAlert('Success', `Payment Request Sent to ${selectedStudent.name}`, [{ text: 'OK', onPress: () => onRefresh() }], 'success');
            }

            setModalVisible(false);
            // Reset form
            setStudentSearch('');
            setSelectedStudent(null);
            setAmount('');
            setRemarks('');
        } catch (e: any) {
            showAlert('Error', e.message, [], 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleVerify = async (req: any) => {
        // Verify payment
        try {
            const { verifyPaymentRequest } = await import('../../utils/financeUtils');
            const receipt = await verifyPaymentRequest(req.id);
            showAlert('Verified', `Payment verified. Receipt: ${receipt}`, [{ text: 'Cool', onPress: () => onRefresh() }], 'success');
        } catch (e: any) {
            showAlert('Error', e.message, [], 'error');
        }
    };

    const handleDownloadReceipt = async (payment: Payment) => {
        if (generatingReceiptId) return;
        setGeneratingReceiptId(payment.id);
        try {
            const { generateReceiptPDF } = await import('../../utils/financeUtils');
            await generateReceiptPDF(payment);
        } catch (e: any) {
            if (e.message && e.message.includes('Another share request')) {
                // Ignore
            } else {
                showAlert('Error', 'Could not generate PDF', [], 'error');
            }
        } finally {
            setGeneratingReceiptId(null);
        }
    };

    const handleDeletePayment = (payment: Payment) => {
        showAlert(
            'Delete Payment?',
            `Are you sure you want to delete the record of ₹${payment.amount}? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { deletePayment } = await import('../../utils/financeUtils');
                            await deletePayment(payment.id);
                            showAlert('Deleted', 'Payment record removed', [], 'success');

                            // Refresh data logic
                            if (isSpecificStudentView && payments.length > 0) {
                                const sid = payments[0].studentId;
                                const { getStudentPayments } = await import('../../utils/financeUtils');
                                const data = await getStudentPayments(sid);
                                setPayments(data);
                            } else {
                                onRefresh();
                            }
                        } catch (e: any) {
                            showAlert('Error', 'Failed to delete payment', [], 'error');
                        }
                    }
                }
            ],
            'warning'
        );
    };

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            paddingVertical: 24,
            paddingHorizontal: 24,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
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
        },
        navBar: {
            flexDirection: 'row',
            backgroundColor: colors.card,
            marginHorizontal: 16,
            marginTop: 20,
            marginBottom: 20,
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
        listContent: {
            padding: 20,
            paddingBottom: 100,
        },
        // Card Styles
        card: {
            backgroundColor: colors.card,
            borderRadius: 20,
            marginBottom: 12,
            shadowColor: colors.textSecondary,
            shadowOpacity: 0.08,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 3,
            overflow: 'hidden',
        },
        cardHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            backgroundColor: colors.card,
        },
        iconContainer: {
            marginRight: 14,
        },
        iconBox: {
            width: 50,
            height: 50,
            borderRadius: 18,
            justifyContent: 'center',
            alignItems: 'center',
        },
        info: {
            flex: 1,
        },
        name: {
            fontSize: 16,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 4,
        },
        metaContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
        },
        pill: {
            backgroundColor: theme === 'dark' ? '#1E293B' : '#F1F5F9',
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 6,
        },
        detailSmall: {
            fontSize: 11,
            color: colors.textSecondary,
            fontWeight: '700',
        },
        amount: {
            fontSize: 16,
            fontWeight: '800',
            color: '#10B981',
        },
        statusBadge: {
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 8,
            marginTop: 4,
            alignSelf: 'flex-start',
        },
        fab: {
            position: 'absolute',
            bottom: 30,
            right: 20,
            backgroundColor: colors.primary,
            width: 56,
            height: 56,
            borderRadius: 28,
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 6,
            zIndex: 50,
        },
        // Modal
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'flex-end',
        },
        modalContent: {
            backgroundColor: colors.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            maxHeight: '85%',
        },
        input: {
            backgroundColor: theme === 'dark' ? colors.background : '#F8FAFC',
            padding: 14,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            color: colors.text,
            marginBottom: 16,
        },
        label: {
            fontSize: 12,
            fontWeight: '700',
            color: colors.textSecondary,
            marginBottom: 8,
            textTransform: 'uppercase',
        },
        modeSwitch: {
            flexDirection: 'row',
            backgroundColor: theme === 'dark' ? '#1E293B' : '#F1F5F9',
            padding: 4,
            borderRadius: 12,
            marginBottom: 20,
        },
        modeOption: {
            flex: 1,
            paddingVertical: 10,
            alignItems: 'center',
            borderRadius: 10,
        },
        modeActive: {
            backgroundColor: colors.card,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 1,
            elevation: 2,
        },
        btn: {
            backgroundColor: colors.primary,
            padding: 16,
            borderRadius: 16,
            alignItems: 'center',
            marginTop: 10,
        },
        btnText: {
            color: '#fff',
            fontWeight: '700',
            fontSize: 16,
        },
        verifyBtn: {
            backgroundColor: colors.primary,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 8,
        },
    }), [colors, theme]);

    // Stats - Dynamic based on view
    const activeTotal = React.useMemo(() => {
        return groupedHistory.reduce((sum, section) => {
            return sum + section.data.reduce((s, p) => s + p.amount, 0);
        }, 0);
    }, [groupedHistory]);

    if (!isAdmin(user)) return null;

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#000428', '#004e92']} style={[styles.header, { paddingTop: 24 + insets.top }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialIcons name="chevron-left" size={32} color="#fff" />
                </TouchableOpacity>
                <AppText style={styles.headerTitle}>Finance</AppText>
                <TouchableOpacity onPress={() => setSettingsModalVisible(true)} style={[styles.backBtn, { marginLeft: 'auto', backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                    <MaterialIcons name="cog" size={24} color="#fff" />
                </TouchableOpacity>
            </LinearGradient>

            <View style={styles.navBar}>
                <TouchableOpacity
                    style={[styles.navItem, activeTab === 'requests' && styles.navItemActive]}
                    onPress={() => {
                        setActiveTab('requests');
                        pagerRef.current?.setPage(0);
                    }}
                >
                    <MaterialIcons name="clipboard-check-outline" size={20} color={activeTab === 'requests' ? colors.primary : colors.textSecondary} />
                    <AppText style={[styles.navItemLabel, activeTab === 'requests' && styles.navItemLabelActive]}>Requests & Verify</AppText>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.navItem, activeTab === 'history' && styles.navItemActive]}
                    onPress={() => {
                        setActiveTab('history');
                        pagerRef.current?.setPage(1);
                    }}
                >
                    <MaterialIcons name="history" size={20} color={activeTab === 'history' ? colors.primary : colors.textSecondary} />
                    <AppText style={[styles.navItemLabel, activeTab === 'history' && styles.navItemLabelActive]}>Payment History</AppText>
                </TouchableOpacity>
            </View>

            <PagerView
                ref={pagerRef}
                style={{ flex: 1 }}
                initialPage={0}
                onPageSelected={(e) => setActiveTab(e.nativeEvent.position === 0 ? 'requests' : 'history')}
            >

                {/* TAB 1: REQUESTS (Page 0) */}
                <View key="requests" style={{ flex: 1 }}>
                    <FlatList
                        data={requests}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                        ListEmptyComponent={<AppText style={{ textAlign: 'center', marginTop: 40, color: colors.textSecondary }}>No pending requests.</AppText>}
                        renderItem={({ item }) => (
                            <View style={[styles.card, item.status === 'paid_unverified' && { borderColor: '#F59E0B', borderWidth: 1 }]}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.iconContainer}>
                                        <View style={[styles.iconBox, { backgroundColor: item.status === 'paid_unverified' ? '#FFFBEB' : '#F1F5F9' }]}>
                                            <MaterialIcons
                                                name={item.status === 'paid_unverified' ? 'alert-circle' : 'clock-outline'}
                                                size={24}
                                                color={item.status === 'paid_unverified' ? '#D97706' : '#64748B'}
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.info}>
                                        <AppText style={styles.name}>{item.studentName}</AppText>
                                        <View style={styles.metaContainer}>
                                            <View style={styles.pill}>
                                                <AppText style={styles.detailSmall}>{item.type}</AppText>
                                            </View>
                                        </View>
                                        {item.status === 'paid_unverified' && (
                                            <AppText style={[styles.detailSmall, { color: '#D97706', marginTop: 4 }]}>
                                                Ref: {item.transactionId || 'N/A'}
                                            </AppText>
                                        )}
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <AppText style={styles.amount}>₹{item.amount.toLocaleString()}</AppText>
                                        {item.status === 'paid_unverified' ? (
                                            <TouchableOpacity onPress={() => handleVerify(item)} style={styles.verifyBtn}>
                                                <AppText style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Verify</AppText>
                                            </TouchableOpacity>
                                        ) : (
                                            <View style={[styles.pill, { marginTop: 4, backgroundColor: '#E2E8F0' }]}>
                                                <AppText style={{ fontSize: 10, fontWeight: '700', color: '#64748B' }}>PENDING</AppText>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        )}
                    />
                </View>

                {/* TAB 2: HISTORY (Page 1) */}
                <View key="history" style={{ flex: 1 }}>
                    {/* Revenue Card */}
                    <LinearGradient
                        colors={['#10B981', '#059669']}
                        style={{ margin: 20, marginBottom: 10, padding: 20, borderRadius: 20 }}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View>
                                <AppText style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                                    {isSpecificStudentView ? `Total Paid by ${historySearch}` : (historySearch ? 'Filtered Total' : 'Total Received (Recent)')}
                                </AppText>
                                <AppText style={{ color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 4 }}>₹{activeTotal.toLocaleString()}</AppText>
                            </View>
                            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                                <MaterialIcons name="cash-multiple" size={24} color="#fff" />
                            </View>
                        </View>
                    </LinearGradient>

                    {/* Search Bar */}
                    <View style={{ paddingHorizontal: 20, marginBottom: 10, zIndex: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, height: 46 }}>
                            <MaterialIcons name="magnify" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
                            <TextInput
                                style={{ flex: 1, color: colors.text, fontSize: 15 }}
                                placeholder="Search by name/receipt... (Global)"
                                placeholderTextColor={colors.textSecondary}
                                value={historySearch}
                                onChangeText={handleHistorySearch}
                            />
                            {historySearch ? (
                                <TouchableOpacity onPress={clearHistorySearch}>
                                    <MaterialIcons name="close-circle" size={18} color={colors.textSecondary} />
                                </TouchableOpacity>
                            ) : null}
                        </View>
                        {/* Suggestions Dropdown */}
                        {historySuggestions.length > 0 && (
                            <View style={{
                                position: 'absolute',
                                top: 50,
                                left: 20,
                                right: 20,
                                backgroundColor: colors.card,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: colors.border,
                                maxHeight: 200,
                                zIndex: 999,
                                elevation: 5,
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.1,
                                shadowRadius: 10,
                            }}>
                                <ScrollView keyboardShouldPersistTaps="handled">
                                    {historySuggestions.map((s) => (
                                        <TouchableOpacity
                                            key={s.id}
                                            onPress={() => selectHistoryStudent(s)}
                                            style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center' }}
                                        >
                                            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                                <MaterialIcons name="account" size={18} color={colors.primary} />
                                            </View>
                                            <View>
                                                <AppText style={{ fontWeight: '600', color: colors.text }}>{s.title}</AppText>
                                                <AppText style={{ fontSize: 10, color: colors.textSecondary }}>{s.subtitle}</AppText>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>

                    <SectionList
                        sections={groupedHistory}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                        stickySectionHeadersEnabled={false}
                        renderSectionHeader={({ section: { title } }) => (
                            <View style={{ paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ height: 1, backgroundColor: colors.border, flex: 1, marginRight: 12 }} />
                                <AppText style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    {title}
                                </AppText>
                                <View style={{ height: 1, backgroundColor: colors.border, flex: 1, marginLeft: 12 }} />
                            </View>
                        )}
                        renderItem={({ item }) => (
                            <View style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.iconContainer}>
                                        <View style={[styles.iconBox, { backgroundColor: '#ECFEFF' }]}>
                                            <MaterialIcons name="cash" size={24} color="#06B6D4" />
                                        </View>
                                    </View>
                                    <View style={styles.info}>
                                        <AppText style={styles.name}>{item.studentName}</AppText>
                                        <View style={styles.metaContainer}>
                                            <View style={styles.pill}>
                                                <AppText style={styles.detailSmall}>{item.type}</AppText>
                                            </View>
                                            <AppText style={[styles.detailSmall, { opacity: 0.7 }]}>• {item.method}</AppText>
                                        </View>
                                        <AppText style={[styles.detailSmall, { marginTop: 2, opacity: 0.5 }]}>
                                            {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </AppText>
                                    </View>
                                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                                        <AppText style={styles.amount}>₹{item.amount.toLocaleString()}</AppText>
                                        <View style={{ flexDirection: 'row' }}>
                                            <TouchableOpacity
                                                onPress={() => handleDeletePayment(item)}
                                                style={{ padding: 6 }}
                                            >
                                                <MaterialIcons name="trash-can-outline" size={20} color="#EF4444" />
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                onPress={() => handleDownloadReceipt(item)}
                                                disabled={generatingReceiptId === item.id}
                                                style={{ padding: 6 }}
                                            >
                                                {generatingReceiptId === item.id ? (
                                                    <ActivityIndicator size="small" color={colors.primary} />
                                                ) : (
                                                    <MaterialIcons name="file-document-outline" size={20} color={colors.primary} />
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}
                        ListEmptyComponent={
                            <View style={{ alignItems: 'center', marginTop: 40, opacity: 0.5 }}>
                                <MaterialIcons name="history" size={48} color={colors.textSecondary} />
                                <AppText style={{ marginTop: 12, color: colors.textSecondary }}>No records found</AppText>
                            </View>
                        }
                    />
                </View>
            </PagerView>

            <TouchableOpacity
                style={styles.fab}
                onPress={() => setModalVisible(true)}
            >
                <MaterialIcons name="plus" size={32} color="#fff" />
            </TouchableOpacity>

            {/* Entry/Request Modal */}
            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                            <AppText style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>New Transaction</AppText>
                            <TouchableOpacity onPress={() => setModalVisible(false)}><MaterialIcons name="close" size={24} color={colors.text} /></TouchableOpacity>
                        </View>

                        <View style={styles.modeSwitch}>
                            <TouchableOpacity onPress={() => setMode('request')} style={[styles.modeOption, mode === 'request' && styles.modeActive]}>
                                <AppText style={{ fontWeight: '700', color: mode === 'request' ? colors.primary : colors.textSecondary }}>Request Payment</AppText>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setMode('record')} style={[styles.modeOption, mode === 'record' && styles.modeActive]}>
                                <AppText style={{ fontWeight: '700', color: mode === 'record' ? colors.primary : colors.textSecondary }}>Record Cash</AppText>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <AppText style={styles.label}>Student</AppText>
                            <TextInput
                                style={styles.input}
                                placeholder="Search Student..."
                                value={studentSearch}
                                onChangeText={handleStudentSearch}
                                placeholderTextColor={colors.textSecondary}
                            />
                            {studentSearchResults.length > 0 && (
                                <View style={{ backgroundColor: theme === 'dark' ? '#1E293B' : '#F1F5F9', borderRadius: 8, marginBottom: 10 }}>
                                    {studentSearchResults.map((s) => (
                                        <TouchableOpacity key={s.id} onPress={() => selectStudent(s)} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                                            <AppText style={{ color: colors.text }}>{s.title}</AppText>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                            {selectedStudent && <AppText style={{ color: '#10B981', marginBottom: 10 }}>Selected: {selectedStudent.name}</AppText>}

                            <AppText style={styles.label}>Amount</AppText>
                            <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textSecondary} />

                            <AppText style={styles.label}>Type</AppText>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                                {['Hostel Fee', 'Mess Fee', 'Fine', 'Other'].map(t => (
                                    <TouchableOpacity key={t} onPress={() => setType(t as any)} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: type === t ? colors.primary : colors.border, marginRight: 8 }}>
                                        <AppText style={{ color: type === t ? '#fff' : colors.textSecondary }}>{t}</AppText>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <AppText style={styles.label}>Note / Remarks</AppText>
                            <TextInput style={styles.input} value={remarks} onChangeText={setRemarks} placeholder="Optional..." placeholderTextColor={colors.textSecondary} />

                            <TouchableOpacity onPress={handleSubmit} style={styles.btn} disabled={submitting}>
                                {submitting ? <ActivityIndicator color="#fff" /> : <AppText style={styles.btnText}>{mode === 'request' ? 'Send Request' : 'Record Payment'}</AppText>}
                            </TouchableOpacity>
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Settings Modal */}
            <Modal visible={settingsModalVisible} transparent animationType="fade" onRequestClose={() => setSettingsModalVisible(false)}>
                <View style={[styles.modalOverlay, { justifyContent: 'center', padding: 20 }]}>
                    <View style={[styles.modalContent, { borderRadius: 24, maxHeight: 400 }]}>
                        <AppText style={{ fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 20 }}>Payment Settings</AppText>
                        <AppText style={styles.label}>UPI ID (VPA)</AppText>
                        <TextInput style={styles.input} value={upiId} onChangeText={setUpiId} placeholder="e.g. hostel@upi" placeholderTextColor={colors.textSecondary} />

                        <AppText style={styles.label}>Payee Name (Merchant Name)</AppText>
                        <TextInput style={styles.input} value={payeeName} onChangeText={setPayeeName} placeholder="e.g. Smart Hostel Admin" placeholderTextColor={colors.textSecondary} />

                        <TouchableOpacity onPress={saveData} style={styles.btn}>
                            <AppText style={styles.btnText}>Save Settings</AppText>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setSettingsModalVisible(false)} style={{ marginTop: 16, alignItems: 'center' }}>
                            <AppText style={{ color: colors.textSecondary }}>Cancel</AppText>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View >
    );
}
