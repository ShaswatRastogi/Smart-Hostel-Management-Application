
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { getMessStats, MessStats } from '../utils/messAttendanceUtils';
import { useTheme } from '../utils/ThemeContext';

const MessStatsBanner = ({ compact = false }: { compact?: boolean }) => {
    const { colors } = useTheme();
    const [stats, setStats] = useState<MessStats | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        // Fix: Use local date to match Student side
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
            // Optional: Poll every 10 seconds for standard "real-time" feel
            const interval = setInterval(fetchStats, 10000);
            return () => clearInterval(interval);
        }, [fetchStats])
    );

    if (loading && !stats) return <ActivityIndicator style={{ margin: 10 }} color={colors.primary} />;
    if (!stats) return null;

    if (compact) {
        // Sleek horizontal layout for Homepage
        return (
            <View style={[styles.compactContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.compactHeader}>
                    <Ionicons name="restaurant" size={14} color={colors.primary} />
                    <Text style={[styles.compactTitle, { color: colors.text }]}>Today's mess</Text>
                </View>
                <View style={styles.compactGrid}>
                    {(['breakfast', 'lunch', 'snacks', 'dinner'] as const).map(meal => (
                        <View key={meal} style={styles.compactItem}>
                            <Text style={[styles.compactLabel, { color: colors.textSecondary }]}>
                                {meal.charAt(0).toUpperCase() + meal.slice(1)}
                            </Text>
                            <Text style={[styles.compactCount, { color: colors.primary }]}>{stats[meal].going}</Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    }

    const renderStat = (label: string, data: { going: number, skipping: number }) => (
        <View style={styles.statRow}>
            <Text style={[styles.mealLabel, { color: colors.text }]}>{label}</Text>
            <View style={styles.counts}>
                <View style={[styles.badge, { backgroundColor: '#E8F5E9' }]}>
                    <Text style={[styles.countText, { color: '#2E7D32' }]}>{data.going} Going</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: '#FFEBEE', marginLeft: 8 }]}>
                    <Text style={[styles.countText, { color: '#C62828' }]}>{data.skipping} Skip</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.header}>
                <Ionicons name="stats-chart" size={18} color={colors.primary} />
                <Text style={[styles.title, { color: colors.text }]}>Today's Headcount</Text>
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
        padding: 16, // Increased padding
        borderRadius: 20, // More rounded
        borderWidth: 1,
        // Removed flexDirection: 'row' to stack vertically
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    compactHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16 // Space between header and grid
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 8,
    },
    compactTitle: {
        fontSize: 14, // Slightly larger
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        opacity: 0.8
    },
    grid: {
        gap: 8,
    },
    compactGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between', // Spread out
        paddingHorizontal: 8
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
    compactItem: {
        alignItems: 'center',
        gap: 2
    },
    compactLabel: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase'
    },
    compactCount: {
        fontSize: 14,
        fontWeight: '800'
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
