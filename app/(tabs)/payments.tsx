import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
// Mock Razorpay to bypass New Architecture native crash
const RazorpayCheckout = {
    open: (options: any) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve({
                    razorpay_order_id: options.order_id,
                    razorpay_payment_id: 'pay_mock' + Math.random().toString().slice(2, 10),
                    razorpay_signature: 'mock_signature'
                });
            }, 1500);
        });
    }
};
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../../context/AlertContext';
import { useRefresh } from '../../hooks/useRefresh';
import api from '../../utils/api';
import { fetchUserData } from '../../utils/nameUtils';
import { useTheme } from '../../utils/ThemeContext';
import AppText from '../../components/AppText';

export default function PaymentsPage() {
    const { colors, isDark } = useTheme();
    const { showAlert } = useAlert();
    const [dues, setDues] = useState(0);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);

    const { refreshing, onRefresh } = useRefresh(async () => {
        await loadData();
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const user = await fetchUserData();
            if (user) {
                setDues(user.dues || 0);
            }
            // Load history
            const historyRes = await api.get('/payments/history');
            setHistory(historyRes.data);
        } catch (error) {
            console.error('Error loading payment data:', error);
        }
    };

    const handlePay = async () => {
        if (dues <= 0) {
            showAlert('Info', 'No pending dues.', [], 'info');
            return;
        }

        setLoading(true);
        try {
            // 1. Create Order on Backend
            const orderRes = await api.post('/payments/create-order', { amount: dues });
            const order = orderRes.data;

            const options = {
                description: 'Hostel Dues Payment',
                image: 'https://i.imgur.com/3g7nmJC.png', // App Logo
                currency: 'INR',
                key: 'rzp_test_YourKeyHere', // Replace with Env Var
                amount: order.amount,
                name: 'SmartHostel',
                order_id: order.id,
                prefill: {
                    email: 'student@example.com',
                    contact: '9999999999',
                    name: 'Student Name'
                },
                theme: { color: '#7C3AED' }
            };

            // 2. Open Razorpay Checkout
            RazorpayCheckout.open(options).then(async (data: any) => {
                // success
                // 3. Verify Payment on Backend
                try {
                    const verifyRes = await api.post('/payments/verify', {
                        razorpay_order_id: data.razorpay_order_id,
                        razorpay_payment_id: data.razorpay_payment_id,
                        razorpay_signature: data.razorpay_signature,
                        amount: dues
                    });

                    if (verifyRes.data.success) {
                        showAlert('Success', 'Payment Successful! Dues cleared.', [], 'success');
                        setDues(0);
                        loadData(); // Reload history
                    }
                } catch (verifyError) {
                    console.error('Verification Error:', verifyError);
                    showAlert('Error', 'Payment verification failed. Please contact admin.', [], 'error');
                }
            }).catch((error: any) => {
                // error
                console.log('Payment Error:', error);
                if (error.code !== 0) { // 0 is cancelled by user
                    showAlert('Error', `Payment Failed: ${error.description}`, [], 'error');
                }
            });

        } catch (error) {
            console.error('Payment Init Error:', error);
            showAlert('Error', 'Failed to initiate payment.', [], 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                <AppText style={[styles.title, { color: colors.text }]}>Payments & Dues</AppText>

                {/* Dues Card */}
                <LinearGradient
                    colors={dues > 0 ? ['#EF4444', '#B91C1C'] : ['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.card}
                >
                    <AppText style={styles.cardLabel}>Current Dues</AppText>
                    <AppText style={styles.amount}>₹{dues.toLocaleString()}</AppText>
                    <AppText style={styles.status}>{dues > 0 ? 'Payment Pending' : 'All Clear'}</AppText>
                </LinearGradient>

                <TouchableOpacity
                    style={[styles.payBtn, dues <= 0 && { opacity: 0.5 }]}
                    onPress={handlePay}
                    disabled={dues <= 0 || loading}
                >
                    <LinearGradient
                        colors={['#7C3AED', '#6D28D9']}
                        style={styles.btnGradient}
                    >
                        <AppText style={styles.btnText}>{loading ? 'Processing...' : 'Pay Now'}</AppText>
                    </LinearGradient>
                </TouchableOpacity>

                <AppText style={[styles.sectionTitle, { color: colors.textSecondary }]}>Transaction History</AppText>

                {history.length === 0 ? (
                    <AppText style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 20 }}>No transactions yet.</AppText>
                ) : (
                    history.map((item) => (
                        <View key={item.id} style={[styles.historyItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View>
                                <AppText style={[styles.historyAmount, { color: colors.text }]}>₹{item.amount}</AppText>
                                <AppText style={[styles.historyDate, { color: colors.textSecondary }]}>{new Date(item.created_at).toLocaleDateString()}</AppText>
                            </View>
                            <View style={[styles.badge, { backgroundColor: '#DCFCE7' }]}>
                                <AppText style={[styles.badgeText, { color: '#166534' }]}>SUCCESS</AppText>
                            </View>
                        </View>
                    ))
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 24,
        paddingBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 24,
    },
    card: {
        padding: 24,
        borderRadius: 24,
        marginBottom: 24,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    cardLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    amount: {
        fontSize: 48,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 8,
    },
    status: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        paddingVertical: 4,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        overflow: 'hidden',
    },
    payBtn: {
        marginBottom: 40,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: "#7C3AED",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    btnGradient: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    btnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
    },
    historyAmount: {
        fontSize: 18,
        fontWeight: '700',
    },
    historyDate: {
        fontSize: 12,
        marginTop: 2,
    },
    badge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
    }
});
