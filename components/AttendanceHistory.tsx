import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import api from '../utils/api';
import { useTheme } from '../utils/ThemeContext';

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
            let color = colors.textSecondary;
            if (record.status === 'present') color = '#22C55E';
            if (record.status === 'absent') color = '#EF4444';
            if (record.status === 'late') color = '#F59E0B';
            if (record.status === 'leave') color = '#6366F1';

            marked[dateStr] = {
                selected: true,
                selectedColor: color,
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
                    selectedColor: '#94A3B8', // Gray for Not Marked
                };
            }
        }
        return marked;
    };

    if (loading) return <View style={{ height: 100, justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View>;

    return (
        <View style={{
            marginBottom: 16,
            backgroundColor: colors.background,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
        }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MaterialCommunityIcons name="calendar-check" size={18} color={colors.primary} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary }}>ATTENDANCE</Text>
                </View>
                <View style={{ backgroundColor: stats.percentage >= 75 ? '#DCFCE7' : '#FEE2E2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: stats.percentage >= 75 ? '#166534' : '#991B1B' }}>
                        {stats.percentage}%
                    </Text>
                </View>
            </View>

            <Calendar
                markedDates={getMarkedDates()}
                theme={{
                    calendarBackground: 'transparent',
                    todayTextColor: colors.primary,
                    arrowColor: colors.primary,
                    monthTextColor: colors.text,
                    textSectionTitleColor: colors.textSecondary,
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
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' }} />
                    <Text style={{ fontSize: 10, color: colors.textSecondary }}>Present</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' }} />
                    <Text style={{ fontSize: 10, color: colors.textSecondary }}>Absent</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B' }} />
                    <Text style={{ fontSize: 10, color: colors.textSecondary }}>Late</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366F1' }} />
                    <Text style={{ fontSize: 10, color: colors.textSecondary }}>Leave</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#94A3B8' }} />
                    <Text style={{ fontSize: 10, color: colors.textSecondary }}>Not Marked</Text>
                </View>
            </View>
        </View>
    );
};

export default AttendanceHistory;
