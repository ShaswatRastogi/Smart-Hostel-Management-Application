import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import AppText from '../../../components/AppText';
import { useTheme } from '../../../utils/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MessStatsBanner from '../../../components/MessStatsBanner';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MessPortalProps {
    user: any;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

export default function MessPortal({ user, sidebarOpen, setSidebarOpen }: MessPortalProps) {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const actions = [
        { label: 'Update Menu', icon: 'silverware-fork-knife', route: '/admin/messMenu', color: '#F59E0B' },
        { label: 'Feedbacks', icon: 'message-draw', route: '/admin/messMenu', color: '#6366F1' },
        { label: 'Inventory', icon: 'clipboard-list', route: '/admin/facilities', color: '#10B981' },
        { label: 'Analytics', icon: 'chart-box', route: '/admin/analytics', color: '#8B5CF6' },
    ];

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={[styles.header, { paddingTop: insets.top + 20, backgroundColor: '#F59E0B' }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuBtn}>
                        <MaterialIcons name="menu" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerText}>
                        <AppText style={styles.greeting}>Mess Management</AppText>
                        <AppText style={styles.subGreeting}>Kitchen Operations</AppText>
                    </View>
                </View>

                <MessStatsBanner compact />
            </View>

            <View style={styles.content}>
                <AppText style={styles.sectionTitle}>Kitchen Tools</AppText>
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

                <View style={styles.menuSection}>
                    <View style={styles.sectionHeader}>
                        <AppText style={styles.sectionTitle}>Today's Menu</AppText>
                        <TouchableOpacity onPress={() => router.push('/admin/messMenu')}>
                            <AppText style={{ color: colors.primary, fontWeight: '700' }}>Edit Menu</AppText>
                        </TouchableOpacity>
                    </View>
                    
                    <View style={[styles.menuItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC' }]}>
                        <View style={styles.mealIcon}>
                            <MaterialIcons name="weather-sunny" size={24} color="#F59E0B" />
                        </View>
                        <View style={styles.mealInfo}>
                            <AppText style={[styles.mealType, { color: colors.text }]}>Lunch (Active)</AppText>
                            <AppText style={styles.mealDetails}>Paneer Butter Masala, Roti, Rice, Dal Fry, Salad</AppText>
                        </View>
                    </View>

                    <View style={[styles.menuItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC' }]}>
                        <View style={styles.mealIcon}>
                            <MaterialIcons name="weather-night" size={24} color="#6366F1" />
                        </View>
                        <View style={styles.mealInfo}>
                            <AppText style={[styles.mealType, { color: colors.text }]}>Dinner (Upcoming)</AppText>
                            <AppText style={styles.mealDetails}>Aloo Gobhi, Mix Veg, Roti, Rice, Kheer</AppText>
                        </View>
                    </View>
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
        backgroundColor: 'rgba(255,255,255,0.2)',
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
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
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
    menuSection: {
        gap: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 16,
    },
    mealIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mealInfo: {
        flex: 1,
    },
    mealType: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 4,
    },
    mealDetails: {
        fontSize: 13,
        color: '#94A3B8',
        lineHeight: 18,
    }
});
