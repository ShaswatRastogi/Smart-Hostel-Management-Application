import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, SectionList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AlphabetJumpBar from '../../components/AlphabetJumpBar';
import StudentDetailsModal from '../../components/StudentDetailsModal';
import { useAlert } from '../../context/AlertContext';
import { useRefresh } from '../../hooks/useRefresh';
import api, { API_BASE_URL } from '../../utils/api';
import { useTheme } from '../../utils/ThemeContext';

const AttendancePage = () => {
    const { colors, theme } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { showAlert } = useAlert();

    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [students, setStudents] = useState<any[]>([]);
    const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, leave: 0, total: 0, marked: 0 });
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const sectionListRef = useRef<SectionList>(null);
    const [showAlphabet, setShowAlphabet] = useState(false);
    const hideTimeout = useRef<any>(null); // Use any for timeout to avoid type issues

    const handleScroll = () => {
        setShowAlphabet(true);
        if (hideTimeout.current) clearTimeout(hideTimeout.current);
        hideTimeout.current = setTimeout(() => {
            setShowAlphabet(false);
        }, 1500);
    };

    const handleLetterPress = (letter: string) => {
        const sectionIndex = sections.findIndex(s => s.title === letter);
        if (sectionIndex !== -1 && sectionListRef.current) {
            sectionListRef.current.scrollToLocation({
                sectionIndex,
                itemIndex: 0,
                animated: false,
                viewOffset: 0
            });
            // Keep visible
            setShowAlphabet(true);
            if (hideTimeout.current) clearTimeout(hideTimeout.current);
            hideTimeout.current = setTimeout(() => {
                setShowAlphabet(false);
            }, 2000);
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    // Details Modal
    const [detailsVisible, setDetailsVisible] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);

    const openDetails = (student: any) => {
        setSelectedStudent(student);
        setDetailsVisible(true);
    };

    // Fix: Use local time for date string to avoid timezone shifts (e.g. UTC-5 vs local)
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/attendance/daily?date=${formattedDate}`);
            setStudents(response.data.sort((a: any, b: any) => a.name.localeCompare(b.name)));

            const statsRes = await api.get(`/attendance/stats?date=${formattedDate}`);
            setStats(statsRes.data);
        } catch (error) {
            console.error(error);
            showAlert('Error', 'Failed to fetch attendance', [], 'error');
        } finally {
            setLoading(false);
        }
    };

    const { refreshing, onRefresh } = useRefresh(fetchAttendance);

    useFocusEffect(
        useCallback(() => {
            fetchAttendance();
        }, [date])
    );

    const updateLocalStatus = (studentId: number, newStatus: string) => {
        setStudents(prev => prev.map(s => s.studentId === studentId ? { ...s, status: newStatus === 'clear' ? null : newStatus } : s));
    };

    const handleMark = async (studentId: number, status: string) => {
        updateLocalStatus(studentId, status);
        try {
            await api.post('/attendance/mark', {
                date: formattedDate,
                updates: [{ studentId, status }]
            });
            const statsRes = await api.get(`/attendance/stats?date=${formattedDate}`);
            setStats(statsRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    const markAll = async (status: string) => {
        showAlert(
            `Mark All ${status.charAt(0).toUpperCase() + status.slice(1)}?`,
            `Are you sure you want to mark ALL displaying students as ${status}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm', onPress: async () => {
                        setMarking(true);
                        try {
                            const updates = students.map(s => ({ studentId: s.studentId, status }));
                            await api.post('/attendance/mark', { date: formattedDate, updates });
                            fetchAttendance();
                            showAlert('Success', `All students marked as ${status}`, [], 'success');
                        } catch (err) {
                            showAlert('Error', 'Failed to update all.', [], 'error');
                        } finally {
                            setMarking(false);
                        }
                    }
                }
            ],
            'warning'
        );
    };

    // Filter students
    const filteredStudents = students.filter(student =>
        (student.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.rollNo || '').includes(searchQuery) ||
        (student.room || '').includes(searchQuery)
    );

    // Group by first letter
    const sections = React.useMemo(() => {
        const groups: { [key: string]: any[] } = {};
        if (filteredStudents.length === 0) return [];

        filteredStudents.forEach(student => {
            const letter = student.name.charAt(0).toUpperCase();
            // Basic group check
            if (/[A-Z]/.test(letter)) {
                if (!groups[letter]) groups[letter] = [];
                groups[letter].push(student);
            } else {
                if (!groups['#']) groups['#'] = [];
                groups['#'].push(student);
            }
        });

        const sortedKeys = Object.keys(groups).sort();
        return sortedKeys.map(key => ({
            title: key,
            data: groups[key]
        }));
    }, [filteredStudents]);



    const changeDate = (days: number) => {
        const newDate = new Date(date);
        newDate.setDate(newDate.getDate() + days);

        // Prevent future dates
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today
        if (newDate > today) return;

        setDate(newDate);
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            paddingTop: insets.top + 24,
            paddingBottom: 24,
            paddingHorizontal: 24,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
        },
        headerTitle: {
            fontSize: 22,
            fontWeight: '800',
            color: '#fff',
            letterSpacing: 0.5,
            textAlign: 'center',
            flex: 1,
            marginRight: 40, // Optical centering with back button
        },
        controlsContainer: {
            backgroundColor: colors.card,
            marginTop: 2, // Minimal gap
            marginHorizontal: -16, // Stretch to edges
            borderRadius: 20,
            paddingVertical: 16, // Sleeker look
            paddingHorizontal: 16,
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            elevation: 4,
            zIndex: 10,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: colors.border,
        },
        dateRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
            backgroundColor: colors.card,
            padding: 8,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 3,
        },
        dateBtn: {
            width: 40,
            height: 40,
            borderRadius: 20, // Circle
            backgroundColor: theme === 'dark' ? '#334155' : '#F1F5F9',
            justifyContent: 'center',
            alignItems: 'center',
        },
        dateText: {
            fontSize: 16,
            fontWeight: '700',
            color: colors.text,
            marginHorizontal: 12,
        },
        statsGrid: {
            flexDirection: 'row',
            gap: 8,
            marginBottom: 20,
        },
        statsCard: {
            flex: 1,
            borderRadius: 12,
            paddingVertical: 10,
            paddingHorizontal: 4,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
            elevation: 3,
        },
        statsValue: {
            fontSize: 18,
            fontWeight: '800',
            color: '#fff',
            marginBottom: 2,
        },
        statsLabel: {
            fontSize: 10,
            fontWeight: '700',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.9)',
            letterSpacing: 0.5,
        },
        searchBox: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme === 'dark' ? '#1E293B' : '#F1F5F9',
            paddingHorizontal: 12,
            height: 44,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
        },
        searchInput: {
            flex: 1,
            marginLeft: 8,
            color: colors.text,
            fontSize: 14,
            fontWeight: '500',
        },
        listContent: {
            paddingHorizontal: 20,
            paddingBottom: 40,
            paddingTop: 16,
        },
        studentCard: {
            backgroundColor: colors.card,
            borderRadius: 16,
            marginBottom: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: '#000',
            shadowOpacity: 0.03,
            shadowRadius: 6,
            elevation: 2,
        },
        cardHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        studentInfo: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            flex: 1,
        },
        avatar: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: theme === 'dark' ? '#334155' : '#E2E8F0',
        },
        avatarPlaceholder: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: theme === 'dark' ? '#334155' : '#E2E8F0',
            justifyContent: 'center',
            alignItems: 'center',
        },
        nameText: {
            fontSize: 15,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 2,
        },
        roomText: {
            fontSize: 12,
            color: colors.textSecondary,
        },
        statusRow: {
            flexDirection: 'row',
            marginTop: 12,
            backgroundColor: theme === 'dark' ? '#0F172A' : '#F8FAFC',
            padding: 4,
            borderRadius: 12,
            gap: 4,
        },
        statusBtn: {
            flex: 1,
            alignItems: 'center',
            paddingVertical: 8,
            borderRadius: 8,
        },
        calendarContainer: {
            marginTop: 16,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingTop: 12,
        },
    });

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#000428', '#004e92']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <TouchableOpacity onPress={() => router.back()} style={{
                    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)',
                    justifyContent: 'center', alignItems: 'center'
                }}>
                    <MaterialIcons name="chevron-left" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Attendance</Text>
            </LinearGradient>

            <View style={{ flex: 1, position: 'relative' }}>
                <SectionList
                    ref={sectionListRef}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    sections={sections}
                    keyExtractor={(item) => item.studentId.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListHeaderComponent={
                        <View style={styles.controlsContainer}>
                            {/* Date Navigation */}
                            <View style={styles.dateRow}>
                                <TouchableOpacity style={styles.dateBtn} onPress={() => changeDate(-1)}>
                                    <MaterialIcons name="chevron-left" size={24} color={colors.text} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <MaterialCommunityIcons name="calendar-month" size={20} color={colors.primary} />
                                    <Text style={styles.dateText}>
                                        {(() => {
                                            const d = new Date(date);
                                            const today = new Date();
                                            const yesterday = new Date();
                                            yesterday.setDate(today.getDate() - 1);

                                            if (d.toDateString() === today.toDateString()) return 'Today';
                                            if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
                                            return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'long' });
                                        })()}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.dateBtn, { opacity: date.getTime() + 86400000 > new Date().setHours(23, 59, 59, 999) ? 0.3 : 1 }]} onPress={() => changeDate(1)}>
                                    <MaterialIcons name="chevron-right" size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={date}
                                    mode="date"
                                    display="default"
                                    onChange={onDateChange}
                                    maximumDate={new Date()}
                                />
                            )}

                            {/* Stats */}
                            <View style={styles.statsGrid}>
                                <LinearGradient
                                    colors={['#10B981', '#059669']}
                                    style={styles.statsCard}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Text style={styles.statsValue}>{stats.present}</Text>
                                    <Text style={styles.statsLabel}>Present</Text>
                                </LinearGradient>

                                <LinearGradient
                                    colors={['#EF4444', '#B91C1C']}
                                    style={styles.statsCard}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Text style={styles.statsValue}>{stats.absent}</Text>
                                    <Text style={styles.statsLabel}>Absent</Text>
                                </LinearGradient>

                                <LinearGradient
                                    colors={['#F59E0B', '#B45309']}
                                    style={styles.statsCard}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Text style={styles.statsValue}>{stats.late}</Text>
                                    <Text style={styles.statsLabel}>Late</Text>
                                </LinearGradient>

                                <LinearGradient
                                    colors={['#6366F1', '#4338CA']}
                                    style={styles.statsCard}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Text style={styles.statsValue}>{stats.total}</Text>
                                    <Text style={styles.statsLabel}>Total</Text>
                                </LinearGradient>
                            </View>

                            {/* Search & Actions */}
                            {/* Search & Actions */}
                            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                                {/* Mark All Absent */}
                                <TouchableOpacity
                                    style={{
                                        width: 44, height: 44, borderRadius: 12, backgroundColor: '#EF4444',
                                        justifyContent: 'center', alignItems: 'center',
                                        shadowColor: '#EF4444', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4
                                    }}
                                    onPress={() => markAll('absent')}
                                >
                                    <MaterialCommunityIcons name="close-circle-outline" size={24} color="#fff" />
                                </TouchableOpacity>

                                {/* Search Box */}
                                <View style={[styles.searchBox, { flex: 1 }]}>
                                    <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
                                    <TextInput
                                        style={styles.searchInput}
                                        placeholder="Search..."
                                        placeholderTextColor={colors.textSecondary}
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                    />
                                    {searchQuery.length > 0 && (
                                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                                            <MaterialIcons name="close" size={20} color={colors.textSecondary} />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* Mark All Present */}
                                <TouchableOpacity
                                    style={{
                                        width: 44, height: 44, borderRadius: 12, backgroundColor: '#10B981',
                                        justifyContent: 'center', alignItems: 'center',
                                        shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4
                                    }}
                                    onPress={() => markAll('present')}
                                >
                                    <MaterialCommunityIcons name="check-all" size={24} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    }
                    ListEmptyComponent={
                        loading ? (
                            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
                        ) : (
                            <Text style={{ textAlign: 'center', marginTop: 30, color: colors.textSecondary }}>No students found</Text>
                        )
                    }
                    renderSectionHeader={({ section: { title } }) => (
                        <View style={{ backgroundColor: colors.background, paddingVertical: 8, paddingHorizontal: 20 }}>
                            <Text style={{ fontWeight: 'bold', color: colors.primary }}>{title}</Text>
                        </View>
                    )}
                    renderItem={({ item: student }) => {
                        return (
                            <View style={styles.studentCard}>
                                <View style={styles.cardHeader}>
                                    <TouchableOpacity style={styles.studentInfo} onPress={() => openDetails(student)}>
                                        {student.profilePhoto ? (
                                            <Image
                                                source={{ uri: `${API_BASE_URL}${student.profilePhoto}` }}
                                                style={styles.avatar}
                                            />
                                        ) : (
                                            <View style={styles.avatarPlaceholder}>
                                                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textSecondary }}>
                                                    {student.name.charAt(0)}
                                                </Text>
                                            </View>
                                        )}
                                        <View>
                                            <Text style={styles.nameText}>{student.name}</Text>
                                            <Text style={styles.roomText}>Room {student.room}</Text>
                                        </View>
                                    </TouchableOpacity>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <TouchableOpacity
                                            style={{ paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#EF444415', borderRadius: 8 }}
                                            onPress={() => handleMark(student.studentId, 'clear')}
                                        >
                                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#EF4444' }}>Clear</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Status Toggle Row */}
                                <View style={styles.statusRow}>
                                    {['present', 'absent', 'late', 'leave'].map((status) => {
                                        const isActive = student.status === status;
                                        let activeColor = '#16A34A';
                                        let textColor = isActive ? '#fff' : colors.textSecondary;

                                        if (status === 'absent') activeColor = '#EF4444';
                                        if (status === 'late') activeColor = '#F59E0B';
                                        if (status === 'leave') activeColor = '#6366F1';

                                        return (
                                            <TouchableOpacity
                                                key={status}
                                                style={[
                                                    styles.statusBtn,
                                                    isActive && { backgroundColor: activeColor },
                                                ]}
                                                onPress={() => handleMark(student.studentId, status)}
                                            >
                                                <Text style={{
                                                    fontSize: 12,
                                                    fontWeight: '700',
                                                    color: textColor,
                                                    textTransform: 'capitalize'
                                                }}>
                                                    {status}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        );
                    }}
                />
                <AlphabetJumpBar
                    onLetterPress={handleLetterPress}
                    visible={showAlphabet}
                    alphabets={sections.map(s => s.title)}
                />
            </View>

            {/* Modal Restored */}
            <StudentDetailsModal
                visible={detailsVisible}
                student={selectedStudent}
                onClose={() => setDetailsVisible(false)}
                onEdit={() => { }}
                onDelete={() => { }}
                viewMode="attendance"
            />
        </View>
    );
};

export default AttendancePage;
