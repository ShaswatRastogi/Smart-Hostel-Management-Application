import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../utils/ThemeContext';
import AppText from '../components/AppText';

export default function BusTimings() {
    // Define BusRoute interface locally
    interface BusRoute {
        id: string;
        route: string;
        times: string[];
        destination: string;
        message?: string;
    }

    const { colors, isDark } = useTheme();
    const [routes, setRoutes] = useState<BusRoute[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTimings = async () => {
        try {
            const { default: api } = await import('../utils/api');
            const response = await api.get('/services/bus');

            const rawData = response.data;
            const grouped: { [key: string]: BusRoute } = {};

            rawData.forEach((item: any) => {
                if (!grouped[item.route]) {
                    grouped[item.route] = {
                        id: item.route, // Route name as ID for grouping
                        route: item.route,
                        times: [],
                        destination: item.destination,
                        message: item.message
                    };
                }
                grouped[item.route].times.push(item.time.substring(0, 5)); // HH:MM
            });

            setRoutes(Object.values(grouped));
        } catch (error) {
            console.error("Failed to fetch bus timings:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTimings();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchTimings();
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
                        <View>
                            <AppText style={styles.headerTitle}>Bus Schedule</AppText>
                            <AppText style={styles.headerSubtitle}>Campus Shuttle Timings</AppText>
                        </View>
                        <View style={styles.headerIcon}>
                            <MaterialCommunityIcons name="bus-clock" size={28} color="#fff" />
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#004e92']}
                        tintColor="#004e92"
                    />
                }
            >
                <View style={{ padding: 20 }}>
                    {routes.length === 0 ? (
                        <AppText style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 40 }}>
                            No bus timings available at the moment.
                        </AppText>
                    ) : (
                        routes.map((route) => (
                            <View key={route.id} style={styles.section}>
                                <View style={styles.routeHeader}>
                                    <View style={[styles.routeIconBox, { backgroundColor: isDark ? '#172554' : '#EFF6FF' }]}>
                                        <MaterialCommunityIcons name="bus-stop" size={22} color={isDark ? '#60A5FA' : '#004e92'} />
                                    </View>
                                    <AppText style={[styles.routeTitle, { color: colors.text }]}>{route.route}</AppText>
                                </View>

                                <View style={[styles.timingsCard, styles.shadowProp, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                    {route.times.map((item, idx) => (
                                        <View
                                            key={idx}
                                            style={[
                                                styles.timeItem,
                                                idx !== route.times.length - 1 && styles.borderBottom
                                            ]}
                                        >
                                            <View style={[styles.timeIconBox, { backgroundColor: isDark ? colors.background : '#F8FAFC' }]}>
                                                <MaterialCommunityIcons name="clock-time-four-outline" size={18} color={colors.textSecondary} />
                                            </View>
                                            <AppText style={[styles.timeText, { color: colors.text }]}>{item}</AppText>
                                        </View>
                                    ))}

                                    {/* Optional Message Display */}
                                    {route.message ? (
                                        <View style={{ padding: 12, backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#EFF6FF', borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0', flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                                            <MaterialCommunityIcons name="information-outline" size={16} color={colors.primary} />
                                            <AppText style={{ fontSize: 13, color: colors.textSecondary, flex: 1 }}>{route.message}</AppText>
                                        </View>
                                    ) : null}
                                </View>
                            </View>
                        ))
                    )}

                    <View style={styles.infoCard}>
                        <MaterialCommunityIcons name="information" size={24} color="#004e92" />
                        <AppText style={styles.infoText}>
                            Please arrive 5 minutes before the scheduled time at the pickup point. Timings are managed by the administration.
                        </AppText>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor handled dynamically
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
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
        marginTop: 4,
    },
    headerIcon: {
        width: 48,
        height: 48,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    section: {
        marginBottom: 24,
    },
    routeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
        paddingLeft: 4,
    },
    routeIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    routeTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        letterSpacing: 0.5,
    },
    timingsCard: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
    },
    timeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 16,
    },
    borderBottom: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(148, 163, 184, 0.2)',
    },
    timeIconBox: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timeText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#334155',
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        borderRadius: 16,
        gap: 12,
        marginBottom: 20,
        borderWidth: 1,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '500',
        color: '#1E40AF',
        lineHeight: 20,
    },
    shadowProp: {
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
});