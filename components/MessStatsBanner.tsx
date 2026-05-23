import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { getMessStats, MessStats } from '../utils/messAttendanceUtils';
import { useTheme } from '../utils/ThemeContext';
import AppText from './AppText';

const CircularProgress = ({
    size = 50,
    strokeWidth = 4,
    progress = 0,
    color = '#6366f1',
    backgroundColor = 'rgba(0,0,0,0.05)',
    label = ""
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <View style={{ alignItems: 'center' }}>
            <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
                <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={backgroundColor}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        fill="transparent"
                    />
                </Svg>
                <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                    <AppText style={{ fontSize: 10, fontWeight: '800', color }}>{label}</AppText>
                </View>
            </View>
        </View>
    );
};

const MessStatsBanner = ({ compact = false }: { compact?: boolean }) => {
    const { colors, isDark } = useTheme();
    const [stats, setStats] = useState<MessStats | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localDate = new Date(now.getTime() - offset).toISOString().split('T')[0];

        const data = await getMessStats(localDate);
        setStats(data);
        setLoading(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchStats();
            const interval = setInterval(fetchStats, 10000);
            return () => clearInterval(interval);
        }, [fetchStats])
    );

    if (loading && !stats) return <ActivityIndicator style={{ margin: 10 }} color={colors.primary} />;
    if (!stats) return null;

    if (compact) {
        // Assume a target headcount of 200 for calculation, or dynamic based on data
        const maxAttendance = 200;
        const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        return (
            <View style={[
                styles.compactContainer,
                {
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.5)' : colors.card,
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border
                }
            ]}>
                <View style={[styles.compactHeader, { justifyContent: 'space-between' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={[styles.iconWrapper, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)' }]}>
                            <Ionicons name="restaurant" size={16} color={colors.primary} />
                        </View>
                        <AppText style={[styles.compactTitle, { color: colors.text }]}>Today's Presence</AppText>
                    </View>
                    <AppText style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, opacity: 0.8 }}>
                        {today}
                    </AppText>
                </View>
                <View style={styles.circularGrid}>
                    {(['breakfast', 'lunch', 'snacks', 'dinner'] as const).map(meal => {
                        const going = stats[meal].going;
                        const percentage = going > 0 ? Math.min((going / maxAttendance) * 100, 100) : 0;

                        return (
                            <View key={meal} style={styles.circularItem}>
                                <CircularProgress
                                    size={56}
                                    progress={percentage}
                                    label={going.toString()}
                                    color={colors.primary}
                                    backgroundColor={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'}
                                    strokeWidth={5}
                                />
                                <AppText style={[styles.compactLabel, { color: colors.textSecondary, marginTop: 8 }]}>
                                    {meal.charAt(0).toUpperCase() + meal.slice(1)}
                                </AppText>
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    }

    const renderStat = (label: string, data: { going: number, skipping: number }) => (
        <View style={styles.statRow}>
            <AppText style={[styles.mealLabel, { color: colors.text }]}>{label}</AppText>
            <View style={styles.counts}>
                <View style={[styles.badge, { backgroundColor: '#E8F5E9' }]}>
                    <AppText style={[styles.countText, { color: '#2E7D32' }]}>{data.going} Going</AppText>
                </View>
                <View style={[styles.badge, { backgroundColor: '#FFEBEE', marginLeft: 8 }]}>
                    <AppText style={[styles.countText, { color: '#C62828' }]}>{data.skipping} Skip</AppText>
                </View>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.header}>
                <Ionicons name="stats-chart" size={18} color={colors.primary} />
                <AppText style={[styles.title, { color: colors.text }]}>Today's Headcount</AppText>
            </View>

            <View style={styles.grid}>
                {renderStat('Breakfast', stats.breakfast)}
                {renderStat('Lunch', stats.lunch)}
                {renderStat('Snacks', stats.snacks)}
                {renderStat('Dinner', stats.dinner)}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        margin: 16,
        marginBottom: 8,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    compactContainer: {
        marginHorizontal: 0,
        marginBottom: 24,
        padding: 18,
        borderRadius: 24,
        borderWidth: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    iconWrapper: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    compactHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 8,
    },
    compactTitle: {
        fontSize: 13,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        opacity: 0.9
    },
    grid: {
        gap: 8,
    },
    circularGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4
    },
    circularItem: {
        alignItems: 'center',
        flex: 1,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    mealLabel: {
        fontSize: 14,
        fontWeight: '500',
        width: 80,
    },
    compactLabel: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    counts: {
        flexDirection: 'row',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    countText: {
        fontSize: 12,
        fontWeight: '700',
    }
});

export default MessStatsBanner;
