import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../../components/AppText';
import { useTheme } from '../../utils/ThemeContext';
import { useRefresh } from '../../hooks/useRefresh';
import api, { API_BASE_URL } from '../../utils/api';
import { Image } from 'expo-image';
import { formatUniversalTime } from '../../utils/timeUtils';

export default function MovementsLogPage() {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    
    const [movements, setMovements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMovements = async () => {
        setLoading(true);
        try {
            const res = await api.get('/services/movements/all');
            setMovements(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const { refreshing, onRefresh } = useRefresh(fetchMovements);

    useFocusEffect(
        useCallback(() => {
            fetchMovements();
        }, [])
    );

    const formatDuration = (minutes: number) => {
        if (!minutes || minutes < 0) return 'Pending...';
        if (minutes < 60) return `${Math.floor(minutes)} mins`;
        const hours = Math.floor(minutes / 60);
        const mins = Math.floor(minutes % 60);
        return `${hours} hr ${mins} min`;
    };

    const renderItem = ({ item }: { item: any }) => {
        const isComplete = item.inTime !== null;

        return (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Header */}
                <View style={styles.cardHeader}>
                    <View style={styles.studentInfo}>
                        <Image 
                            source={{ uri: item.studentProfilePhoto ? (item.studentProfilePhoto.startsWith('http') ? item.studentProfilePhoto : `${API_BASE_URL}${item.studentProfilePhoto}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(item.studentName || 'S')}&background=E2E8F0&color=64748B` }} 
                            style={styles.avatar} 
                        />
                        <View>
                            <AppText style={[styles.nameText, { color: colors.text }]}>{item.studentName}</AppText>
                            <AppText style={[styles.roomText, { color: colors.textSecondary }]}>Room {item.studentRoom}</AppText>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: isComplete ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)' }]}>
                        <AppText style={[styles.statusText, { color: isComplete ? '#10B981' : '#F59E0B' }]}>
                            {isComplete ? 'RETURNED' : 'OUT'}
                        </AppText>
                    </View>
                </View>

                {/* Times */}
                <View style={styles.timeRow}>
                    <View style={styles.timeBox}>
                        <AppText style={[styles.timeLabel, { color: colors.textSecondary }]}>Time Out</AppText>
                        <AppText style={[styles.timeValue, { color: colors.text }]}>
                            {formatUniversalTime(item.outTime, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </AppText>
                    </View>
                    
                    <MaterialCommunityIcons name="arrow-right" size={20} color={colors.textSecondary} style={{ marginHorizontal: 10 }} />
                    
                    <View style={styles.timeBox}>
                        <AppText style={[styles.timeLabel, { color: colors.textSecondary }]}>Time In</AppText>
                        <AppText style={[styles.timeValue, { color: colors.text }]}>
                            {item.inTime ? formatUniversalTime(item.inTime, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </AppText>
                    </View>
                </View>

                {/* Duration Footer */}
                <View style={[styles.durationFooter, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderTopColor: colors.border }]}>
                    <MaterialCommunityIcons name="clock-outline" size={16} color={colors.textSecondary} />
                    <AppText style={[styles.durationLabel, { color: colors.textSecondary }]}>Duration:</AppText>
                    <AppText style={[styles.durationValue, { color: colors.text }]}>{formatDuration(item.durationMinutes)}</AppText>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={['#000428', '#004e92']}
                style={[styles.header, { paddingTop: insets.top + 16 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialIcons name="chevron-left" size={28} color="#fff" />
                </TouchableOpacity>
                <AppText style={styles.headerTitle}>Clock In/Out Log</AppText>
            </LinearGradient>

            <FlatList
                data={movements}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshing={refreshing}
                onRefresh={onRefresh}
                ListEmptyComponent={
                    loading ? (
                        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
                    ) : (
                        <View style={{ alignItems: 'center', marginTop: 60 }}>
                            <MaterialCommunityIcons name="walk" size={60} color={colors.textSecondary} style={{ opacity: 0.5, marginBottom: 16 }} />
                            <AppText style={{ color: colors.textSecondary, fontSize: 16 }}>No movements logged yet.</AppText>
                        </View>
                    )
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingBottom: 24, paddingHorizontal: 20,
        flexDirection: 'row', alignItems: 'center',
        borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center', alignItems: 'center'
    },
    headerTitle: {
        fontSize: 20, fontWeight: '800', color: '#fff', marginLeft: 16,
    },
    listContent: { padding: 20, paddingBottom: 60 },
    
    card: {
        borderRadius: 16, marginBottom: 16, borderWidth: 1,
        overflow: 'hidden'
    },
    cardHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 16, paddingBottom: 12
    },
    studentInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E2E8F0' },
    nameText: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
    roomText: { fontSize: 13 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
    
    timeRow: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16,
    },
    timeBox: { flex: 1 },
    timeLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
    timeValue: { fontSize: 14, fontWeight: '700' },
    
    durationFooter: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
        borderTopWidth: 1,
    },
    durationLabel: { fontSize: 13, marginLeft: 6, marginRight: 8, fontWeight: '600' },
    durationValue: { fontSize: 14, fontWeight: '800' },
});
