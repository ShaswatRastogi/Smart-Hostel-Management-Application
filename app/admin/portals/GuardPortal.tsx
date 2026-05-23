import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Dimensions, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import AppText from '../../../components/AppText';
import { useTheme } from '../../../utils/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedGradientHeader from '../../../components/AnimatedGradientHeader';
import { formatUniversalTime } from '../../../utils/timeUtils';
import { API_BASE_URL } from '../../../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GridAction = ({ icon, label, route, iconColor, isDark, onPress }: any) => {
    const router = useRouter();
    const handlePress = () => { if (onPress) onPress(); else if (route) router.push(route); };
    return (
        <View style={{ width: '25%', alignItems: 'center', marginBottom: 20 }}>
            <TouchableOpacity activeOpacity={0.7} onPress={handlePress} style={{ alignItems: 'center', gap: 8 }}>
                <View style={{
                    width: 56, height: 56, borderRadius: 28,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9',
                    justifyContent: 'center', alignItems: 'center',
                    borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.03)',
                }}>
                    <MaterialIcons name={icon} size={28} color={iconColor} />
                </View>
                <AppText style={{
                    color: isDark ? 'rgba(255,255,255,0.9)' : '#334155',
                    fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 2,
                }} numberOfLines={2}>{label}</AppText>
            </TouchableOpacity>
        </View>
    );
};

const AnimatedThemeToggle = ({ isDark, toggleTheme }: any) => (
    <TouchableOpacity
        style={{ width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.12)' }}
        onPress={toggleTheme} activeOpacity={0.8}
    >
        <MaterialIcons name={isDark ? "weather-sunny" : "weather-night"} size={24} color={isDark ? "#fbbf24" : "#fff"} />
    </TouchableOpacity>
);

export default function GuardPortal(props: any) {
    const { colors, isDark, user } = props;
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const styles = createStyles(colors, isDark);

    const [stats, setStats] = useState({ inCampus: 0, outCampus: 0, visitorsToday: 0 });
    const [loadingStats, setLoadingStats] = useState(false);

    const fetchStats = useCallback(async () => {
        try {
            setLoadingStats(true);
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE_URL}/api/guard/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching guard stats:', error);
        } finally {
            setLoadingStats(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const onRefresh = async () => {
        if (props.onRefresh) await props.onRefresh();
        await fetchStats();
    };

    return (
        <ScrollView
            contentContainerStyle={{ paddingBottom: 60 }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={props.refreshing || loadingStats} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        >
            <AnimatedGradientHeader style={[styles.headerBar, { paddingTop: insets.top + 16 }]}>
                <View style={styles.headerContentInner}>
                    <TouchableOpacity style={styles.hamburgerBtn} onPress={() => props.setSidebarOpen(true)}>
                        <MaterialIcons name="menu" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerTextContainer}>
                        <AppText style={styles.headerBarTitle}>Security Command</AppText>
                        <AppText style={styles.headerBarSubtitle}>
                            {user?.name ? `Hi, ${user.name.split(' ')[0]}` : 'Main Gate'}
                        </AppText>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <AnimatedThemeToggle isDark={isDark} toggleTheme={props.toggleTheme} />
                        <TouchableOpacity onPress={() => props.setNotificationVisible(true)}>
                            <View style={styles.headerIcon}>
                                <MaterialIcons name="bell-outline" size={22} color="#fff" />
                                {props.unreadCount > 0 && (
                                    <View style={styles.notifBadge}>
                                        <AppText style={styles.notifBadgeText}>{props.unreadCount > 9 ? '9+' : props.unreadCount}</AppText>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Live Stats */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingHorizontal: 4 }}>
                    <View style={styles.statBox}>
                        <AppText style={styles.statLabel}>In Campus</AppText>
                        <AppText style={styles.statValue}>{stats.inCampus}</AppText>
                    </View>
                    <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }]}>
                        <AppText style={styles.statLabel}>Out Campus</AppText>
                        <AppText style={styles.statValue}>{stats.outCampus}</AppText>
                    </View>
                    <View style={styles.statBox}>
                        <AppText style={styles.statLabel}>Visitors Today</AppText>
                        <AppText style={styles.statValue}>{stats.visitorsToday}</AppText>
                    </View>
                </View>
            </AnimatedGradientHeader>

            <View style={{ paddingHorizontal: 24 }}>
                <View style={[styles.section, { marginBottom: 16, marginTop: 24, marginHorizontal: -24 }]}>
                    {/* ── Quick Actions Grid ── */}
                    <View style={{ width: SCREEN_WIDTH, flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 }}>
                        <GridAction icon="account-search" label="Clock IN/OUT" route="/guard/clock" iconColor={colors.primary} isDark={isDark} />
                        <GridAction icon="qrcode-scan" label="Scan Leave" route="/guard/scanner" iconColor={colors.primary} isDark={isDark} />
                        <GridAction icon="account-clock" label="Visitors" route="/admin/visitors" iconColor={colors.primary} isDark={isDark} />
                        <GridAction icon="account-group" label="Students" route="/admin/students" iconColor={colors.primary} isDark={isDark} />
                        <GridAction icon="bell-ring-outline" label="Emergency" route="/admin/emergency" iconColor={colors.primary} isDark={isDark} />
                    </View>
                </View>

                {/* Operations Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <AppText style={styles.sectionTitle}>Gate Instructions</AppText>
                    </View>
                    <View style={styles.instructionCard}>
                        <MaterialIcons name="shield-check" size={24} color={colors.primary} style={{ marginRight: 12 }} />
                        <View style={{ flex: 1 }}>
                            <AppText style={[styles.instructionText, { color: colors.text }]}>Always verify student identity before allowing entry or exit if QR Code is not provided.</AppText>
                        </View>
                    </View>
                    <View style={styles.instructionCard}>
                        <MaterialIcons name="card-account-details-outline" size={24} color={colors.primary} style={{ marginRight: 12 }} />
                        <View style={{ flex: 1 }}>
                            <AppText style={[styles.instructionText, { color: colors.text }]}>Record all visitors using the Visitors module. Keep a physical logbook backup if necessary.</AppText>
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    headerBar: { paddingBottom: 28, paddingHorizontal: 20, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
    headerContentInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    hamburgerBtn: { width: 46, height: 46, justifyContent: 'center', alignItems: 'center', borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.12)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
    headerTextContainer: { flex: 1, paddingHorizontal: 14 },
    headerBarTitle: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 },
    headerBarSubtitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
    headerIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    notifBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#004e92', paddingHorizontal: 4 },
    notifBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
    
    statBox: { flex: 1, alignItems: 'center', paddingVertical: 8 },
    statLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.5 },
    statValue: { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 4 },

    section: { marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
    
    instructionCard: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.card, 
        padding: 16, 
        borderRadius: 16, 
        marginBottom: 12,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
    },
    instructionText: { fontSize: 14, lineHeight: 20, fontWeight: '500' }
});
