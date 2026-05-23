import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import AppText from '../../../components/AppText';
import { useTheme } from '../../../utils/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MaintenancePortalProps {
    user: any;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

export default function MaintenancePortal({ user, sidebarOpen, setSidebarOpen }: MaintenancePortalProps) {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const stats = [
        { label: 'Open', value: '14', icon: 'wrench-outline', color: '#EF4444' },
        { label: 'Pending', value: '5', icon: 'clock-outline', color: '#F59E0B' },
        { label: 'Resolved', value: '82', icon: 'check-circle-outline', color: '#10B981' },
    ];

    const actions = [
        { label: 'Complaints', icon: 'alert-circle-outline', route: '/admin/complaints', color: '#EF4444' },
        { label: 'Room Service', icon: 'room-service-outline', route: '/admin/services', color: '#3B82F6' },
        { label: 'Inventory', icon: 'toolbox-outline', route: '/admin/facilities', color: '#6366F1' },
        { label: 'Reports', icon: 'file-chart-outline', route: '/admin/analytics', color: '#8B5CF6' },
    ];

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={[styles.header, { paddingTop: insets.top + 20, backgroundColor: '#334155' }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuBtn}>
                        <MaterialIcons name="menu" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerText}>
                        <AppText style={styles.greeting}>Maintenance Portal</AppText>
                        <AppText style={styles.subGreeting}>Facility & Repair Operations</AppText>
                    </View>
                </View>

                <View style={styles.statsRow}>
                    {stats.map((stat, i) => (
                        <View key={i} style={[styles.statCard, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                            <MaterialIcons name={stat.icon as any} size={20} color={stat.color} />
                            <AppText style={styles.statValue}>{stat.value}</AppText>
                            <AppText style={styles.statLabel}>{stat.label}</AppText>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.content}>
                <AppText style={styles.sectionTitle}>Maintenance Tools</AppText>
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
                        <AppText style={styles.sectionTitle}>High Priority Tasks</AppText>
                        <TouchableOpacity onPress={() => router.push('/admin/complaints')}>
                            <AppText style={{ color: colors.primary, fontWeight: '700' }}>View All</AppText>
                        </TouchableOpacity>
                    </View>
                    
                    {[1, 2].map((_, i) => (
                        <View key={i} style={[styles.taskItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC' }]}>
                            <View style={[styles.taskPriority, { backgroundColor: '#FEE2E2' }]}>
                                <MaterialIcons name="alert" size={20} color="#EF4444" />
                            </View>
                            <View style={styles.taskInfo}>
                                <AppText style={[styles.taskTitle, { color: colors.text }]}>AC Leakage in Room 204</AppText>
                                <AppText style={styles.taskMeta}>Reported by Rahul Sharma • 2h ago</AppText>
                            </View>
                            <TouchableOpacity style={styles.taskAction}>
                                <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
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
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 16,
        gap: 12,
    },
    taskPriority: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    taskInfo: {
        flex: 1,
    },
    taskTitle: {
        fontSize: 15,
        fontWeight: '700',
    },
    taskMeta: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 2,
    },
    taskAction: {
        padding: 4,
    }
});
