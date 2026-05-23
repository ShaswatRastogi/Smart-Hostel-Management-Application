import MaterialIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, FlatList, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isAdmin, useUser } from '../../utils/authUtils';
import { useTheme } from '../../utils/ThemeContext';
import AppText from '../../components/AppText';

const { width } = Dimensions.get('window');
const COLUMN_count = 2;
const GAP = 16;
const ITEM_WIDTH = (width - 48 - GAP) / COLUMN_count; // 48 = paddingHorizontal (24*2)

const functionalities = [
    { id: 'students', label: 'Students', icon: 'account-group', color: '#6366F1', path: '/admin/students', desc: 'Manage profiles & allocations', roles: ['owner', 'warden', 'admin'] },
    { id: 'attendance', label: 'Attendance', icon: 'calendar-check', color: '#10B981', path: '/admin/attendance', desc: 'Track daily attendance', roles: ['owner', 'warden', 'admin', 'guard'] },
    { id: 'contacts', label: 'Student Contacts', icon: 'contacts', color: '#10B981', path: '/admin/contacts', desc: 'Directory & Quick Actions', roles: ['owner', 'warden', 'admin'] },
    { id: 'rooms', label: 'Rooms', icon: 'door-closed', color: '#8B5CF6', path: '/admin/rooms', desc: 'Occupancy & availability', roles: ['owner', 'warden', 'admin'] },
    { id: 'services', label: 'Room Services', icon: 'room-service', color: '#F59E0B', path: '/admin/services', desc: 'Housekeeping & repairs', roles: ['owner', 'warden', 'admin', 'cleaning_staff'] },
    { id: 'complaints', label: 'Complaints', icon: 'alert-circle', color: '#EC4899', path: '/admin/complaints', desc: 'Track & resolve issues', roles: ['owner', 'warden', 'admin', 'maintenance_staff'] },
    { id: 'leaves', label: 'Leaves', icon: 'calendar-clock', color: '#06B6D4', path: '/admin/leaveRequests', desc: 'Approve student leaves', roles: ['owner', 'warden', 'admin'] },
    { id: 'notices', label: 'Notices', icon: 'bullhorn', color: '#3B82F6', path: '/admin/notices', desc: 'Broadcast updates', roles: ['owner', 'warden', 'admin'] },
    { id: 'busTimings', label: 'Bus Timings', icon: 'bus-clock', color: '#F59E0B', path: '/admin/busTimings', desc: 'Schedule & routes' },
    { id: 'messMenu', label: 'Mess Menu', icon: 'food-fork-drink', color: '#EC4899', path: '/admin/messMenu', desc: 'Weekly food plan', roles: ['owner', 'warden', 'admin', 'mess_staff'] },
    { id: 'finance', label: 'Fees', icon: 'cash-multiple', color: '#10B981', path: '/admin/finance', desc: 'Fees & payments', roles: ['owner', 'warden', 'admin'] },
    { id: 'laundry', label: 'Laundry', icon: 'washing-machine', color: '#06B6D4', path: '/admin/laundry', desc: 'Status & requests', roles: ['owner', 'warden', 'admin', 'laundry_staff'] },
    { id: 'visitors', label: 'Visitors', icon: 'account-multiple-check', color: '#8B5CF6', path: '/admin/visitors', desc: 'Approve & track visitors', roles: ['owner', 'warden', 'admin', 'guard'] },
    { id: 'facilities', label: 'About Hostel', icon: 'office-building', color: '#10B981', path: '/admin/facilities', desc: 'Hostel info & facility management' },
    { id: 'emergency', label: 'Emergency', icon: 'phone-alert', color: '#EF4444', path: '/admin/emergency', desc: 'Contacts & SOS' },
];

export default function StudentManagementPage() {
    const { colors, theme } = useTheme();
    const insets = useSafeAreaInsets();
    const user = useUser();
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState('');

    const filteredItems = functionalities.filter(item => {
        // 1. Check Role Permission
        if (item.roles && !item.roles.includes(user?.role || '')) {
            return false;
        }

        // 2. Search query filter
        const lowerQ = searchQuery.toLowerCase();
        return item.label.toLowerCase().includes(lowerQ) ||
               item.desc.toLowerCase().includes(lowerQ);
    });

    if (!isAdmin(user)) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <AppText>Access denied.</AppText>
            </View>
        );
    }

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            paddingBottom: 24,
            paddingHorizontal: 24,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
            shadowColor: colors.primary,
            shadowOpacity: 0.2,
            shadowOffset: { width: 0, height: 8 },
            shadowRadius: 16,
            elevation: 8,
        },
        headerTop: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 20,
        },
        backBtn: {
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.2)',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 16,
        },
        headerTitle: {
            fontSize: 24,
            fontWeight: '800',
            color: '#fff',
            flex: 1,
        },
        searchContainer: {
            backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.9)',
            borderRadius: 16,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            height: 50,
        },
        searchInput: {
            flex: 1,
            color: theme === 'dark' ? '#fff' : '#1E293B',
            fontSize: 16,
            fontWeight: '600',
            marginLeft: 12,
        },
        content: {
            padding: 24,
            paddingBottom: 40,
        },
        card: {
            width: ITEM_WIDTH,
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 16,
            marginBottom: GAP,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: colors.textSecondary,
            shadowOpacity: 0.05,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            elevation: 3,
            minHeight: 140,
            justifyContent: 'space-between',
        },
        iconBox: {
            width: 48,
            height: 48,
            borderRadius: 14,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 12,
        },
        cardTitle: {
            fontSize: 16,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 4,
        },
        cardDesc: {
            fontSize: 12,
            color: colors.textSecondary,
            lineHeight: 16,
        },
        arrowIcon: {
            alignSelf: 'flex-end',
            opacity: 0.5
        }
    }), [colors, theme]);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#000428', '#004e92']}
                style={[styles.header, { paddingTop: insets.top + 20 }]}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity
                        onPress={() => {
                            if (router.canGoBack()) {
                                router.back();
                            } else {
                                router.replace('/admin');
                            }
                        }}
                        style={styles.backBtn}
                    >
                        <MaterialIcons name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                    <AppText style={styles.headerTitle}>Student Management</AppText>
                </View>

                <View style={styles.searchContainer}>
                    <MaterialIcons name="magnify" size={24} color={theme === 'dark' ? '#94A3B8' : '#64748B'} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search functionality..."
                        placeholderTextColor={theme === 'dark' ? '#94A3B8' : '#94A3B8'}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <MaterialIcons name="close-circle" size={20} color={theme === 'dark' ? '#94A3B8' : '#64748B'} />
                        </TouchableOpacity>
                    )}
                </View>
            </LinearGradient>

            <FlatList
                data={filteredItems}
                keyExtractor={item => item.id}
                numColumns={COLUMN_count}
                columnWrapperStyle={{ justifyContent: 'space-between' }}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => router.push(item.path as any)}
                        activeOpacity={0.7}
                    >
                        <View>
                            <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                                <MaterialIcons name={item.icon as any} size={26} color={item.color} />
                            </View>
                            <AppText style={styles.cardTitle}>{item.label}</AppText>
                            <AppText style={styles.cardDesc} numberOfLines={2}>{item.desc}</AppText>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', marginTop: 40 }}>
                        <AppText style={{ color: colors.textSecondary }}>No results found.</AppText>
                    </View>
                }
            />
        </View>
    );
}
