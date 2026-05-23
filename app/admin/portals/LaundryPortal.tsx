import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import AppText from '../../../components/AppText';
import { useTheme } from '../../../utils/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LaundryPortalProps {
    user: any;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

export default function LaundryPortal({ user, sidebarOpen, setSidebarOpen }: LaundryPortalProps) {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const stats = [
        { label: 'Received', value: '42', icon: 'tshirt-v-outline', color: '#3B82F6' },
        { label: 'Ready', value: '18', icon: 'check-all', color: '#10B981' },
        { label: 'Delivered', value: '156', icon: 'truck-delivery-outline', color: '#8B5CF6' },
    ];

    const actions = [
        { label: 'Requests', icon: 'washing-machine', route: '/admin/laundry', color: '#3B82F6' },
        { label: 'Scan QR', icon: 'qrcode-scan', route: '/admin/laundry', color: '#6366F1' },
        { label: 'Inventory', icon: 'basket-outline', route: '/admin/facilities', color: '#F59E0B' },
        { label: 'Analytics', icon: 'chart-arc', route: '/admin/analytics', color: '#10B981' },
    ];

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={[styles.header, { paddingTop: insets.top + 20, backgroundColor: '#3B82F6' }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuBtn}>
                        <MaterialIcons name="menu" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerText}>
                        <AppText style={styles.greeting}>Laundry Service</AppText>
                        <AppText style={styles.subGreeting}>Processing & Delivery</AppText>
                    </View>
                </View>

                <View style={styles.statsRow}>
                    {stats.map((stat, i) => (
                        <View key={i} style={[styles.statCard, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                            <MaterialIcons name={stat.icon as any} size={20} color="#fff" />
                            <AppText style={styles.statValue}>{stat.value}</AppText>
                            <AppText style={styles.statLabel}>{stat.label}</AppText>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.content}>
                <AppText style={styles.sectionTitle}>Laundry Tools</AppText>
                <View style={styles.actionGrid}>
                    {actions.map((action, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[styles.actionCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff' }]}
                            onPress={() => router.push(action.route as any)}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                                <MaterialIcons name={action.icon as any} size={28} color={action.color} />
                            </View>
                            <AppText style={[styles.actionLabel, { color: colors.text }]}>{action.label}</AppText>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.recentSection}>
                    <View style={styles.sectionHeader}>
                        <AppText style={styles.sectionTitle}>Pending Pickups</AppText>
                        <TouchableOpacity onPress={() => router.push('/admin/laundry')}>
                            <AppText style={{ color: colors.primary, fontWeight: '700' }}>View All</AppText>
                        </TouchableOpacity>
                    </View>
                    
                    {[1, 2].map((_, i) => (
                        <View key={i} style={[styles.requestItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC' }]}>
                            <View style={[styles.requestIcon, { backgroundColor: '#F0F9FF' }]}>
                                <MaterialIcons name="bag-checked" size={24} color="#0EA5E9" />
                            </View>
                            <View style={styles.requestInfo}>
                                <AppText style={[styles.requestTitle, { color: colors.text }]}>Room 305 - Aman Verma</AppText>
                                <AppText style={styles.requestMeta}>12 Items • Requested at 10:00 AM</AppText>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: '#DBEAFE' }]}>
                                <AppText style={{ color: '#1E40AF', fontSize: 10, fontWeight: '800' }}>PENDING</AppText>
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 24,
        paddingBottom: 30,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    menuBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        marginLeft: 16,
    },
    greeting: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
    },
    subGreeting: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        gap: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
    },
    statLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    content: {
        padding: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 16,
    },
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 32,
    },
    actionCard: {
        width: (SCREEN_WIDTH - 48 - 16) / 2,
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    actionIcon: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: '700',
    },
    recentSection: {
        gap: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    requestItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 16,
        gap: 12,
    },
    requestIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    requestInfo: {
        flex: 1,
    },
    requestTitle: {
        fontSize: 15,
        fontWeight: '700',
    },
    requestMeta: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    }
});
