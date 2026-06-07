import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, Pressable } from 'react-native';
// Mock Razorpay to bypass New Architecture native crash
const RazorpayCheckout = { open: (options: any) => new Promise((resolve, reject) => { setTimeout(() => { resolve({ razorpay_order_id: options.order_id, razorpay_payment_id: 'pay_mock' + Math.random().toString().slice(2, 10), razorpay_signature: 'mock_signature' }); }, 1500); }) };
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../../context/AlertContext';
import { useRefresh } from '../../hooks/useRefresh';
import api from '../../utils/api';
import { fetchUserData } from '../../utils/nameUtils';
import { useTheme } from '../../utils/ThemeContext';
import AppText from '../../components/AppText';

export default function PaymentsPage() {
    const { showAlert } = useAlert();
    const { isDark } = useTheme();
    const [dues, setDues] = useState(0);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);

    // Dynamic Theme Map
    const themeBg = isDark ? '#000000' : '#F8FAFC';
    const textMain = isDark ? '#FFFFFF' : '#111111';
    const textMuted = isDark ? '#888888' : '#64748B';
    const borderSubtle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    const primaryBtnBg = isDark ? '#FFFFFF' : '#111111';
    const primaryBtnText = isDark ? '#000000' : '#FFFFFF';
    
    const { refreshing, onRefresh } = useRefresh(async () => { await loadData(); });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const user = await fetchUserData();
            if (user) setDues(user.dues || 0);
            const historyRes = await api.get('/payments/history');
            setHistory(historyRes.data);
        } catch (error) {}
    };

    const handlePay = async () => {
        if (dues <= 0) return showAlert('Info', 'No pending dues.', [], 'info');
        setLoading(true);
        try {
            const orderRes = await api.post('/payments/create-order', { amount: dues });
            const order = orderRes.data;
            const options = { description: 'Hostel Dues Payment', image: 'https://i.imgur.com/3g7nmJC.png', currency: 'INR', key: 'rzp_test_YourKeyHere', amount: order.amount, name: 'SmartHostel', order_id: order.id, prefill: { email: 'student@example.com', contact: '9999999999', name: 'Student Name' }, theme: { color: isDark ? '#FFFFFF' : '#000000' } };
            RazorpayCheckout.open(options).then(async (data: any) => {
                try {
                    const verifyRes = await api.post('/payments/verify', { razorpay_order_id: data.razorpay_order_id, razorpay_payment_id: data.razorpay_payment_id, razorpay_signature: data.razorpay_signature, amount: dues });
                    if (verifyRes.data.success) { showAlert('Success', 'Payment Successful! Dues cleared.', [], 'success'); setDues(0); loadData(); }
                } catch (verifyError) { showAlert('Error', 'Payment verification failed. Please contact admin.', [], 'error'); }
            }).catch((error: any) => { if (error.code !== 0) showAlert('Error', `Payment Failed: ${error.description}`, [], 'error'); });
        } catch (error) { showAlert('Error', 'Failed to initiate payment.', [], 'error'); } finally { setLoading(false); }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: themeBg }} edges={['top']}>
            <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={textMain} />}>
                <View style={styles.hero}>
                    <AppText style={[styles.heroTitle, { color: textMain }]}>Payments{"\n"}& Dues</AppText>
                </View>

                <View style={styles.duesSection}>
                    <AppText style={styles.duesLabel}>CURRENT DUES</AppText>
                    <AppText style={[styles.amount, { color: dues > 0 ? '#EF4444' : '#10B981' }]}>₹{dues.toLocaleString()}</AppText>
                    <AppText style={styles.status}>{dues > 0 ? 'Payment Pending' : 'All Clear'}</AppText>
                </View>

                <Pressable style={({ pressed }) => [styles.payBtn, { backgroundColor: primaryBtnBg }, dues <= 0 && { opacity: 0.5 }, pressed && dues > 0 && { opacity: 0.8 }]} onPress={handlePay} disabled={dues <= 0 || loading}>
                    <AppText style={[styles.btnText, { color: primaryBtnText }]}>{loading ? 'Processing...' : 'Pay Now'}</AppText>
                </Pressable>

                <View style={styles.section}>
                    <AppText style={styles.sectionTitle}>TRANSACTION HISTORY</AppText>
                    {history.length === 0 ? (
                        <AppText style={styles.emptyText}>No transactions yet.</AppText>
                    ) : (
                        history.map((item) => (
                            <View key={item.id} style={[styles.historyRow, { borderColor: borderSubtle }]}>
                                <View style={styles.historyInfo}>
                                    <AppText style={[styles.historyAmount, { color: textMain }]}>₹{item.amount}</AppText>
                                    <AppText style={styles.historyDate}>{new Date(item.created_at).toLocaleDateString()}</AppText>
                                </View>
                                <View style={styles.badge}>
                                    <AppText style={styles.badgeText}>SUCCESS</AppText>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { paddingHorizontal: 24, paddingBottom: 60, paddingTop: 16 },
    hero: { marginBottom: 48 },
    heroTitle: { fontSize: 40, fontWeight: '800', letterSpacing: -1.5, lineHeight: 44 },
    duesSection: { marginBottom: 32 },
    duesLabel: { fontSize: 11, fontWeight: '700', color: '#888888', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
    amount: { fontSize: 56, fontWeight: '800', letterSpacing: -2, marginBottom: 4 },
    status: { fontSize: 16, fontWeight: '600', color: '#888888' },
    payBtn: { paddingVertical: 18, borderRadius: 100, alignItems: 'center', justifyContent: 'center', marginBottom: 48 },
    btnText: { fontSize: 18, fontWeight: '700' },
    section: { marginBottom: 32 },
    sectionTitle: { fontSize: 11, fontWeight: '700', color: '#666666', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 },
    emptyText: { fontSize: 14, color: '#888888' },
    historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
    historyInfo: { flex: 1 },
    historyAmount: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
    historyDate: { fontSize: 13, color: '#888888' },
    badge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 100, backgroundColor: 'rgba(16,185,129,0.1)' },
    badgeText: { fontSize: 10, fontWeight: '800', color: '#10B981', letterSpacing: 1 }
});
