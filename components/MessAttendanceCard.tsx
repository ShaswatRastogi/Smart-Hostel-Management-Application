import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { getMyMessAttendance, markMessAttendance, MessAttendance } from '../utils/messAttendanceUtils';
import { useTheme } from '../utils/ThemeContext';
import AppText from './AppText';

const MEALS = ['breakfast', 'lunch', 'snacks', 'dinner'] as const;

const MessAttendanceCard = () => {
    const { isDark } = useTheme();
    const [loading, setLoading] = useState(false);
    const [attendance, setAttendance] = useState<MessAttendance[]>([]);
    const [marking, setMarking] = useState<string | null>(null);

    const getLocalDateStr = (date: Date) => {
        const offset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - offset);
        return localDate.toISOString().split('T')[0];
    };

    const fetchAttendance = useCallback(async () => {
        setLoading(true);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const startDate = getLocalDateStr(today);
        const endDate = getLocalDateStr(tomorrow);
        const data = await getMyMessAttendance(startDate, endDate);
        setAttendance(data);
        setLoading(false);
    }, []);

    useFocusEffect(useCallback(() => { fetchAttendance(); }, [fetchAttendance]));

    const handleMark = async (date: Date, meal: string, status: 'going' | 'skipping') => {
        const dateStr = getLocalDateStr(date);
        const key = `${dateStr}-${meal}-${status}`;
        setMarking(key);
        const previousAttendance = [...attendance];
        setAttendance(prev => {
            const temp = [...prev];
            const index = temp.findIndex(a => a.date === dateStr && a.meal === meal);
            if (index !== -1) temp[index] = { ...temp[index], status };
            else temp.push({ date: dateStr, meal, status });
            return temp;
        });
        try { await markMessAttendance(dateStr, meal, status); } 
        catch (e) { alert('Failed to update attendance'); setAttendance(previousAttendance); } 
        finally { setMarking(null); }
    };

    const getStatus = (date: Date, meal: string) => {
        const dateStr = getLocalDateStr(date);
        const record = attendance.find(a => a.date === dateStr && a.meal === meal);
        return record?.status || null;
    };

    // Dynamic Theme Variables
    const textMain = isDark ? '#FFFFFF' : '#111111';
    const textMuted = isDark ? '#888888' : '#64748B';
    const borderSubtle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    const activeBorder = isDark ? '#FFFFFF' : '#111111';
    const activeBg = isDark ? '#FFFFFF' : '#111111';
    const activeText = isDark ? '#000000' : '#FFFFFF';
    const inactiveText = isDark ? '#888888' : '#64748B';

    const renderDay = (date: Date, title: string) => {
        return (
            <View style={styles.dayContainer}>
                <AppText style={[styles.dayTitle, { color: textMain }]}>{title} ({date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })})</AppText>
                {MEALS.map((meal) => {
                    const status = getStatus(date, meal);
                    const isMarking = marking === `${date.toISOString().split('T')[0]}-${meal}`;
                    return (
                        <View key={meal} style={[styles.mealRow, { borderColor: borderSubtle }]}>
                            <AppText style={[styles.mealName, { color: textMain }]}>{meal.charAt(0).toUpperCase() + meal.slice(1)}</AppText>
                            <View style={styles.buttons}>
                                <TouchableOpacity
                                    style={[styles.statusBtn, { borderColor: status === 'going' ? activeBorder : borderSubtle, backgroundColor: status === 'going' ? activeBg : 'transparent' }]}
                                    onPress={() => handleMark(date, meal, 'going')}
                                    disabled={loading || !!marking}
                                >
                                    {isMarking && marking === `${getLocalDateStr(date)}-${meal}-going` ? (
                                        <ActivityIndicator size="small" color={status === 'going' ? activeText : textMain} />
                                    ) : (
                                        <AppText style={[styles.btnText, { color: status === 'going' ? activeText : inactiveText }]}>Eating</AppText>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.statusBtn, { borderColor: status === 'skipping' ? '#EF4444' : borderSubtle, backgroundColor: status === 'skipping' ? 'rgba(239,68,68,0.1)' : 'transparent' }]}
                                    onPress={() => handleMark(date, meal, 'skipping')}
                                    disabled={loading || !!marking}
                                >
                                    {isMarking && marking === `${getLocalDateStr(date)}-${meal}-skipping` ? (
                                        <ActivityIndicator size="small" color={status === 'skipping' ? '#EF4444' : textMain} />
                                    ) : (
                                        <AppText style={[styles.btnText, { color: status === 'skipping' ? '#EF4444' : inactiveText }]}>Skip</AppText>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })}
            </View>
        );
    };

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <AppText style={styles.title}>MARK ATTENDANCE</AppText>
            </View>
            {loading && attendance.length === 0 ? (
                <ActivityIndicator color={textMain} style={{ margin: 20 }} />
            ) : (
                <View>
                    {renderDay(today, 'Today')}
                    <View style={{ height: 32 }} />
                    {renderDay(tomorrow, 'Tomorrow')}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: { paddingHorizontal: 24, paddingVertical: 16 },
    header: { marginBottom: 24 },
    title: { fontSize: 11, fontWeight: '700', color: '#666666', letterSpacing: 1.5 },
    dayContainer: {},
    dayTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, letterSpacing: 0.5 },
    mealRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
    mealName: { fontSize: 16, fontWeight: '600', textTransform: 'capitalize' },
    buttons: { flexDirection: 'row', gap: 8 },
    statusBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5, minWidth: 80, alignItems: 'center', justifyContent: 'center' },
    btnText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
});

export default MessAttendanceCard;
