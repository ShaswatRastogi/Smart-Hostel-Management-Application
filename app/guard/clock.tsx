import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AppText from '../../components/AppText';
import { useTheme } from '../../utils/ThemeContext';
import { API_BASE_URL } from '../../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';

export default function GuardClockScreen() {
    const { colors, isDark } = useTheme();
    const router = useRouter();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const searchStudents = useCallback(async (query: string) => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('userToken');
            const res = await fetch(`${API_BASE_URL}/api/guard/students?q=${encodeURIComponent(query)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStudents(data);
            }
        } catch (error) {
            console.error('Error searching students:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        searchStudents('');
    }, [searchStudents]);

    // Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            searchStudents(searchQuery);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, searchStudents]);

    const handleClock = async (studentId: string, currentStatus: string, studentName: string) => {
        const movementType = currentStatus === 'in_campus' ? 'out' : 'in';
        
        Alert.alert(
            `Mark ${movementType.toUpperCase()}`,
            `Are you sure you want to log ${studentName} as going ${movementType}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Confirm', 
                    onPress: async () => {
                        try {
                            setActionLoading(studentId);
                            const token = await AsyncStorage.getItem('userToken');
                            const res = await fetch(`${API_BASE_URL}/api/guard/clock`, {
                                method: 'POST',
                                headers: { 
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ studentId, movementType })
                            });
                            
                            const data = await res.json();
                            if (res.ok) {
                                // Update local state immediately
                                setStudents(prev => prev.map(s => 
                                    s.id === studentId ? { ...s, campus_status: movementType === 'in' ? 'in_campus' : 'out_campus' } : s
                                ));
                            } else {
                                Alert.alert('Error', data.error || 'Failed to update status');
                            }
                        } catch (err) {
                            Alert.alert('Error', 'Network error. Try again.');
                        } finally {
                            setActionLoading(null);
                        }
                    } 
                }
            ]
        );
    };

    const renderStudent = ({ item }: { item: any }) => {
        const isInCampus = item.campus_status === 'in_campus' || !item.campus_status;
        const isLoading = actionLoading === item.id;

        return (
            <View style={[styles.studentCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0' }]}>
                <View style={styles.studentInfo}>
                    <Image 
                        source={{ uri: item.profile_photo ? (item.profile_photo.startsWith('http') ? item.profile_photo : `${API_BASE_URL}${item.profile_photo}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(item.full_name || 'S')}&background=E2E8F0&color=64748B` }} 
                        style={styles.avatar} 
                    />
                    <View style={{ flex: 1 }}>
                        <AppText style={[styles.studentName, { color: colors.text }]} numberOfLines={1}>{item.full_name}</AppText>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                            <AppText style={styles.studentDetail}>{item.roll_no || 'No Roll No'}</AppText>
                            <AppText style={styles.studentDetail}>•</AppText>
                            <AppText style={styles.studentDetail}>Room {item.room_number || 'N/A'}</AppText>
                        </View>
                    </View>
                </View>

                <View style={styles.actionRow}>
                    <View style={[styles.statusBadge, { backgroundColor: isInCampus ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)' }]}>
                        <View style={[styles.statusDot, { backgroundColor: isInCampus ? '#10B981' : '#F59E0B' }]} />
                        <AppText style={[styles.statusText, { color: isInCampus ? '#10B981' : '#F59E0B' }]}>
                            {isInCampus ? 'IN CAMPUS' : 'OUT CAMPUS'}
                        </AppText>
                    </View>

                    <TouchableOpacity 
                        style={[styles.clockBtn, { backgroundColor: isInCampus ? '#F59E0B' : '#10B981' }]}
                        onPress={() => handleClock(item.id, item.campus_status, item.full_name)}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <MaterialIcons name={isInCampus ? "logout" : "login"} size={16} color="#fff" />
                                <AppText style={styles.clockBtnText}>Mark {isInCampus ? 'OUT' : 'IN'}</AppText>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-left" size={28} color={colors.text} />
                </TouchableOpacity>
                <AppText style={[styles.headerTitle, { color: colors.text }]}>Clock In/Out</AppText>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <View style={[styles.searchBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }]}>
                    <MaterialIcons name="magnify" size={22} color={colors.textSecondary} style={{ marginLeft: 12 }} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search by name or roll number..."
                        placeholderTextColor={colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 8 }}>
                            <MaterialIcons name="close-circle" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* List */}
            {loading && students.length === 0 ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={students}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderStudent}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.centerBox}>
                            <MaterialIcons name="account-search-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.5, marginBottom: 12 }} />
                            <AppText style={{ color: colors.textSecondary, fontSize: 16 }}>No students found</AppText>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    headerTitle: { fontSize: 18, fontWeight: '700', marginLeft: 8 },
    searchContainer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    searchBox: { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 12 },
    searchInput: { flex: 1, height: '100%', paddingHorizontal: 10, fontSize: 15, fontWeight: '500' },
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
    
    studentCard: { padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1 },
    studentInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    avatar: { width: 46, height: 46, borderRadius: 23, marginRight: 12 },
    studentName: { fontSize: 16, fontWeight: '700' },
    studentDetail: { fontSize: 13, color: '#64748B', fontWeight: '500' },
    
    actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(150,150,150,0.1)', paddingTop: 12 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
    
    clockBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, gap: 6, minWidth: 100, justifyContent: 'center' },
    clockBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' }
});
