import MaterialIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from '../../../components/AppText';

interface StatsGridProps {
    totalStudents: number;
    activeStudents: number;
    roomsCount: number;
    colors: any;
}

export default function StatsGrid({ totalStudents, activeStudents, roomsCount, colors }: StatsGridProps) {
    return (
        <View style={styles.statsGrid}>
            {/* Hero Card: Total Students */}
            <LinearGradient
                colors={['#4F46E5', '#312E81']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
            >
                <View>
                    <AppText style={styles.heroLabel}>Total Students</AppText>
                    <AppText style={styles.heroValue}>{totalStudents}</AppText>
                </View>
                <MaterialIcons name="account-group" size={48} color="rgba(255,255,255,0.9)" />
                <View style={styles.cardWatermark}>
                    <MaterialIcons name="account-group" size={100} color="#fff" />
                </View>
            </LinearGradient>

            <View style={styles.statsRow}>
                {/* Active Students */}
                <LinearGradient
                    colors={['#059669', '#064E3B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.miniCard}
                >
                    <View style={styles.miniHeader}>
                        <MaterialIcons name="check-circle" size={18} color="rgba(255,255,255,0.9)" />
                        <AppText style={styles.miniLabel}>Active</AppText>
                    </View>
                    <AppText style={styles.miniValue}>{activeStudents}</AppText>
                    <View style={styles.cardWatermark}>
                        <MaterialIcons name="check-circle" size={80} color="#fff" />
                    </View>
                </LinearGradient>

                {/* Rooms Occupied */}
                <LinearGradient
                    colors={['#7E22CE', '#581C87']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.miniCard}
                >
                    <View style={styles.miniHeader}>
                        <MaterialIcons name="door-closed" size={18} color="rgba(255,255,255,0.9)" />
                        <AppText style={styles.miniLabel}>Rooms</AppText>
                    </View>
                    <AppText style={styles.miniValue}>{totalStudents}</AppText>
                    <View style={styles.cardWatermark}>
                        <MaterialIcons name="door-closed" size={80} color="#fff" />
                    </View>
                </LinearGradient>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    statsGrid: {
        paddingHorizontal: 20,
        marginBottom: 24,
        gap: 12,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    heroCard: {
        borderRadius: 24,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#4F46E5',
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
        overflow: 'hidden',
        height: 100,
    },
    miniCard: {
        flex: 1,
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
        overflow: 'hidden',
        height: 110,
        justifyContent: 'space-between',
    },
    cardWatermark: {
        position: 'absolute',
        right: -10,
        bottom: -10,
        opacity: 0.15,
        transform: [{ rotate: '-15deg' }, { scale: 1.5 }],
    },
    heroLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    heroValue: {
        color: '#fff',
        fontSize: 36,
        fontWeight: '800',
        letterSpacing: -1,
    },
    miniLabel: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
        fontWeight: '700',
        opacity: 0.9,
    },
    miniValue: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '800',
        marginTop: 4,
    },
    miniHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
});
