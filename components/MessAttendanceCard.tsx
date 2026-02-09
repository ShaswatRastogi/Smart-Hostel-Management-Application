
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getMyMessAttendance, markMessAttendance, MessAttendance } from '../utils/messAttendanceUtils';
import { useTheme } from '../utils/ThemeContext';

const MEALS = ['breakfast', 'lunch', 'snacks', 'dinner'] as const;

const MessAttendanceCard = () => {
    const { colors, theme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [attendance, setAttendance] = useState<MessAttendance[]>([]);
    const [marking, setMarking] = useState<string | null>(null); // "date-meal"

    // Helper to get local date string YYYY-MM-DD
    const getLocalDateStr = (date: Date) => {
        const offset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - offset);
        return localDate.toISOString().split('T')[0];
    };

    const fetchAttendance = useCallback(async () => {
        setLoading(true);
        // Fetch for today and tomorrow
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const startDate = getLocalDateStr(today);
        const endDate = getLocalDateStr(tomorrow);

        const data = await getMyMessAttendance(startDate, endDate);
        setAttendance(data);
        setLoading(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchAttendance();
        }, [fetchAttendance])
    );

    const handleMark = async (date: Date, meal: string, status: 'going' | 'skipping') => {
        const dateStr = getLocalDateStr(date);
        const key = `${dateStr}-${meal}-${status}`;
        setMarking(key);

        // Optimistic Update
        const previousAttendance = [...attendance];
        setAttendance(prev => {
            const temp = [...prev];
            const index = temp.findIndex(a => a.date === dateStr && a.meal === meal);
            if (index !== -1) {
                temp[index] = { ...temp[index], status };
            } else {
                temp.push({ date: dateStr, meal, status });
            }
            return temp;
        });

        try {
            await markMessAttendance(dateStr, meal, status);
            // We can skip re-fetching if we trust the optimistic update, 
            // but fetching ensures sync. Let's do it silently or just rely on optimistic for now?
            // Re-fetching is safer for validity but adds network delay visual. 
            // Since we updated properly, let's just let it be.
            // await fetchAttendance(); 
        } catch (e) {
            alert('Failed to update attendance');
            // Revert on failure
            setAttendance(previousAttendance);
        } finally {
            setMarking(null);
        }
    };

    const getStatus = (date: Date, meal: string) => {
        const dateStr = getLocalDateStr(date);
        const record = attendance.find(a => a.date === dateStr && a.meal === meal);
        return record?.status || null; // 'going', 'skipping', or null (not set)
    };

    const renderDay = (date: Date, title: string) => {
        return (
            <View style={styles.dayContainer}>
                <Text style={[styles.dayTitle, { color: colors.text }]}>{title} ({date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })})</Text>
                {MEALS.map((meal) => {
                    const status = getStatus(date, meal);
                    const isMarking = marking === `${date.toISOString().split('T')[0]}-${meal}`;

                    return (
                        <View key={meal} style={[styles.mealRow, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.mealName, { color: colors.text }]}>{meal.charAt(0).toUpperCase() + meal.slice(1)}</Text>

                            <View style={styles.buttons}>
                                <TouchableOpacity
                                    style={[
                                        styles.statusBtn,
                                        {
                                            borderColor: status === 'going' ? '#4CAF50' : (colors.border),
                                            backgroundColor: status === 'going' ? '#4CAF50' : 'transparent',
                                        }
                                    ]}
                                    onPress={() => handleMark(date, meal, 'going')}
                                    disabled={loading || !!marking}
                                >
                                    {isMarking && marking === `${getLocalDateStr(date)}-${meal}-going` ? (
                                        <ActivityIndicator size="small" color={status === 'going' ? '#fff' : colors.text} />
                                    ) : (
                                        <Text style={[
                                            styles.btnText,
                                            { color: status === 'going' ? '#fff' : (theme === 'dark' ? '#aaa' : '#666') }
                                        ]}>
                                            Eating
                                        </Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.statusBtn,
                                        {
                                            borderColor: status === 'skipping' ? '#EF4444' : (colors.border),
                                            backgroundColor: status === 'skipping' ? '#EF4444' : 'transparent',
                                        }
                                    ]}
                                    onPress={() => handleMark(date, meal, 'skipping')}
                                    disabled={loading || !!marking}
                                >
                                    {isMarking && marking === `${getLocalDateStr(date)}-${meal}-skipping` ? (
                                        <ActivityIndicator size="small" color={status === 'skipping' ? '#fff' : colors.text} />
                                    ) : (
                                        <Text style={[
                                            styles.btnText,
                                            { color: status === 'skipping' ? '#fff' : (theme === 'dark' ? '#aaa' : '#666') }
                                        ]}>
                                            Skip
                                        </Text>
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
        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
            <View style={styles.header}>
                <Ionicons name="fast-food-outline" size={20} color={colors.primary} />
                <Text style={[styles.title, { color: colors.text }]}>Mark Attendance</Text>
            </View>

            {loading && attendance.length === 0 ? (
                <ActivityIndicator color={colors.primary} style={{ margin: 20 }} />
            ) : (
                <View>
                    {renderDay(today, 'Today')}
                    <View style={{ height: 16 }} />
                    {renderDay(tomorrow, 'Tomorrow')}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        padding: 16,
        margin: 16,
        marginBottom: 8,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 8,
    },
    dayContainer: {},
    dayTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        opacity: 0.7,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    mealRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    mealName: {
        fontSize: 16,
        fontWeight: '500',
        textTransform: 'capitalize',
    },
    buttons: {
        flexDirection: 'row',
        gap: 8,
    },
    statusBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1.5,
        minWidth: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnText: {
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    // Dynamic styles will be applied inline in the component
});

export default MessAttendanceCard;
