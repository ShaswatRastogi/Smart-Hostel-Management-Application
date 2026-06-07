import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import api from '../utils/api';
import { useTheme } from '../utils/ThemeContext';
import AppText from './AppText';

const AttendanceHistory = ({ studentId }: { studentId: string }) => {
    const { colors } = useTheme();
    const [history, setHistory] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalDays: 0, presentDays: 0, percentage: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!studentId) return;
            try {
                const res = await api.get(`/attendance/student/${studentId}`);
                setHistory(res.data.history);
                setStats(res.data.stats);
            } catch (e) {
                console.error("Failed to load attendance", e);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [studentId]);

    const getMarkedDates = () => {
        const marked: any = {};

        // 1. Mark existing history
        history.forEach((record: any) => {
            const dateStr = record.date;
            let color = '#444444';
            if (record.status === 'present') color = '#FFFFFF';
            if (record.status === 'absent') color = '#EF4444';
            if (record.status === 'late') color = '#F59E0B';
            if (record.status === 'leave') color = '#3B82F6';

            marked[dateStr] = {
                selected: true,
                selectedColor: color,
                selectedTextColor: record.status === 'present' ? '#000000' : '#FFFFFF',
            };
        });

        // 2. Fill in gaps for the current month up to today
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const todayDay = now.getDate();

        for (let i = 1; i <= todayDay; i++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            if (!marked[dateStr]) {
                marked[dateStr] = {
                    selected: true,
                    selectedColor: '#111111', // Dark Gray for Not Marked
                    selectedTextColor: '#666666',
                };
            }
        }
        return marked;
    };

    if (loading) return <View style={{ height: 100, justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View>;

    return (
        <View style={{
            marginBottom: 16,
            backgroundColor: '#000000',
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
        }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MaterialCommunityIcons name="calendar-check" size={18} color="#FFFFFF" />
                    <AppText style={{ fontSize: 13, fontWeight: '700', color: '#888888' }}>ATTENDANCE</AppText>
                </View>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                    <AppText style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>
                        {stats.percentage}%
                    </AppText>
                </View>
            </View>

            <Calendar
                markedDates={getMarkedDates()}
                theme={{
                    calendarBackground: 'transparent',
                    todayTextColor: '#FFFFFF',
                    arrowColor: '#FFFFFF',
                    monthTextColor: '#FFFFFF',
                    textSectionTitleColor: '#888888',
                    textDayFontSize: 12,
                    textMonthFontSize: 14,
                    textDayHeaderFontSize: 12,
                }}
                disableMonthChange={true}
                firstDay={1}
                hideExtraDays={true}
            />

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12, justifyContent: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' }} />
                    <AppText style={{ fontSize: 10, color: '#888888' }}>Present</AppText>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' }} />
                    <AppText style={{ fontSize: 10, color: '#888888' }}>Absent</AppText>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B' }} />
                    <AppText style={{ fontSize: 10, color: '#888888' }}>Late</AppText>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6' }} />
                    <AppText style={{ fontSize: 10, color: '#888888' }}>Leave</AppText>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#111111' }} />
                    <AppText style={{ fontSize: 10, color: '#888888' }}>Not Marked</AppText>
                </View>
            </View>
        </View>
    );
};

export default AttendanceHistory;
