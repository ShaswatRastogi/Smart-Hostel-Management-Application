import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, Pressable } from 'react-native';
import Animated, { FadeInRight, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../components/AppText';
import api from '../utils/api';
import { useTheme } from '../utils/ThemeContext';

export default function BusTimings() {
    interface BusRoute {
        id: string;
        route: string;
        times: string[];
        destination: string;
        message?: string;
    }

    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { isDark } = useTheme();
    const [routes, setRoutes] = useState<BusRoute[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Dynamic Theme Map
    const themeBg = isDark ? '#000000' : '#F8FAFC';
    const textMain = isDark ? '#FFFFFF' : '#111111';
    const textMuted = isDark ? '#888888' : '#64748B';
    const textSecondary = isDark ? '#CCCCCC' : '#475569';
    const borderSubtle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    const infoBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    const fetchTimings = async () => {
        try {
            const response = await api.get('/services/bus');
            const rawData = response.data;
            const grouped: { [key: string]: BusRoute } = {};

            rawData.forEach((item: any) => {
                if (!grouped[item.route]) {
                    grouped[item.route] = {
                        id: item.route, route: item.route, times: [], destination: item.destination, message: item.message
                    };
                }
                grouped[item.route].times.push(item.time.substring(0, 5));
            });
            // Sort times for each route
            Object.values(grouped).forEach(route => {
                route.times.sort((a, b) => {
                    const [ah, am] = a.split(':').map(Number);
                    const [bh, bm] = b.split(':').map(Number);
                    return ah * 60 + am - (bh * 60 + bm);
                });
            });
            setRoutes(Object.values(grouped));
        } catch (error) { console.error(error); } finally { setLoading(false); setRefreshing(false); }
    };

    useEffect(() => { fetchTimings(); }, []);

    const getNextTimeIndex = (times: string[]) => {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const index = times.findIndex(t => {
            const [h, m] = t.split(':').map(Number);
            return (h * 60 + m) >= currentMinutes;
        });
        return index === -1 ? 0 : index;
    };

    const AnimatedBusIcon = ({ bg }: { bg: string }) => {
        const scale = useSharedValue(1);
        useEffect(() => {
            scale.value = withRepeat(withSequence(withTiming(1.15, {duration: 600}), withTiming(1, {duration: 600})), -1, true);
        }, []);
        const rStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
        return (
            <Animated.View style={[{ position: 'absolute', left: 14, zIndex: 2, backgroundColor: bg, paddingVertical: 4 }, rStyle]}>
                <MaterialCommunityIcons name="bus-side" size={24} color="#3B82F6" />
            </Animated.View>
        );
    };

    const onRefresh = () => { setRefreshing(true); fetchTimings(); };

    return (
        <View style={[styles.container, { backgroundColor: themeBg }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]} onPress={() => router.back()}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={textMain} />
                </Pressable>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 60, paddingHorizontal: 24 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={textMain} />}
            >
                <View style={styles.hero}>
                    <AppText style={[styles.heroTitle, { color: textMain }]}>Bus Schedule</AppText>
                    <AppText style={[styles.heroSubtitle, { color: textMuted }]}>Campus Shuttle Timings</AppText>
                </View>

                {routes.length === 0 && !loading ? (
                    <AppText style={[styles.emptyText, { color: textMuted }]}>No bus timings available at the moment.</AppText>
                ) : (
                    routes.map((route) => (
                        <View key={route.id} style={styles.section}>
                            <AppText style={styles.sectionTitle}>{route.route}</AppText>
                            <View style={styles.listContainer}>
                                {route.times.map((item, idx) => {
                                    const nextIdx = getNextTimeIndex(route.times);
                                    const isNext = idx === nextIdx;
                                    const isPast = idx < nextIdx && nextIdx !== 0;

                                    return (
                                        <Animated.View key={idx} entering={FadeInRight.delay(idx * 100).springify()} style={[styles.timeRow, { borderBottomWidth: 0, paddingVertical: 20 }]}>
                                            <View style={{ width: 2, height: '100%', backgroundColor: borderSubtle, position: 'absolute', left: 25 }} />
                                            {isNext ? (
                                                <AnimatedBusIcon bg={themeBg} />
                                            ) : (
                                                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: isPast ? borderSubtle : textMuted, position: 'absolute', left: 21, zIndex: 2 }} />
                                            )}
                                            <AppText style={[styles.timeText, { color: isPast ? textMuted : textMain, marginLeft: 50, textDecorationLine: isPast ? 'line-through' : 'none' }]}>{item}</AppText>
                                        </Animated.View>
                                    );
                                })}
                                {route.message ? (
                                    <View style={[styles.messageBox, { backgroundColor: infoBg }]}>
                                        <MaterialCommunityIcons name="information-outline" size={16} color={textMain} />
                                        <AppText style={[styles.messageText, { color: textSecondary }]}>{route.message}</AppText>
                                    </View>
                                ) : null}
                            </View>
                        </View>
                    ))
                )}

                <View style={[styles.infoFooter, { borderColor: borderSubtle }]}>
                    <AppText style={styles.infoFooterText}>
                        Please arrive 5 minutes before the scheduled time at the pickup point. Timings are managed by the administration.
                    </AppText>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 24, paddingBottom: 24 },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    content: { flex: 1 },
    hero: { marginBottom: 48 },
    heroTitle: { fontSize: 40, fontWeight: '800', letterSpacing: -1.5, lineHeight: 44, marginBottom: 8 },
    heroSubtitle: { fontSize: 16, fontWeight: '600' },
    emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16 },
    section: { marginBottom: 40 },
    sectionTitle: { fontSize: 11, fontWeight: '700', color: '#666666', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 },
    listContainer: { },
    timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1 },
    timeText: { fontSize: 24, fontWeight: '700' },
    messageBox: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16, padding: 16, borderRadius: 12 },
    messageText: { fontSize: 13, flex: 1, lineHeight: 20 },
    infoFooter: { marginTop: 20, paddingTop: 32, borderTopWidth: 1 },
    infoFooterText: { fontSize: 12, color: '#666666', lineHeight: 20, textAlign: 'center' },
});