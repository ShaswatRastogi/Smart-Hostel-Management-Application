import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../../utils/api';
import { isAdmin, useUser } from '../../utils/authUtils';
import { subscribeToStudents } from '../../utils/studentUtils';
import { useTheme } from '../../utils/ThemeContext';
import AppText from '../../components/AppText';

export default function NewChatScreen() {
    const { colors, theme, isDark } = useTheme();
    const router = useRouter();
    const user = useUser();
    const insets = useSafeAreaInsets();

    const [searchQuery, setSearchQuery] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch students from API via subscription
    useEffect(() => {
        if (!isAdmin(user)) return;

        const unsubscribe = subscribeToStudents((data) => {
            setStudents(data);
            setLoading(false);
        });

        return () => {
            unsubscribe();
        };
    }, [user]);

    const filteredStudents = useMemo(() => {
        if (!searchQuery) return students;
        const lowerQ = searchQuery.toLowerCase();
        return students.filter(s =>
            (s.name && s.name.toLowerCase().includes(lowerQ)) ||
            (s.phone && s.phone.includes(lowerQ)) ||
            (s.room && s.room.toLowerCase().includes(lowerQ))
        );
    }, [searchQuery, students]);

    const handleSelectStudent = (student: any) => {
        router.replace({ pathname: '/chat/[id]', params: { id: student.id.toString(), name: student.name } });
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.contactCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E2E8F0' }]}
            onPress={() => handleSelectStudent(item)}
            activeOpacity={0.7}
        >
            <View style={styles.reqProfile}>
                {item.profilePhoto ? (
                    <Image
                        source={{ uri: item.profilePhoto.startsWith('http') ? item.profilePhoto : `${API_BASE_URL}${item.profilePhoto}` }}
                        style={styles.avatar}
                    />
                ) : (
                    <View style={styles.reqAvatar}>
                        <AppText style={styles.avatarText}>
                            {item.name?.charAt(0).toUpperCase()}
                        </AppText>
                    </View>
                )}
                <View style={styles.reqNameBlock}>
                    <AppText style={[styles.reqName, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>{item.name}</AppText>
                    <View style={styles.reqRoomBadge}>
                        <AppText style={styles.reqRoomText}>Room {item.room}</AppText>
                    </View>
                </View>
            </View>
            <MaterialCommunityIcons name="message-text" size={24} color={colors.primary} />
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#0B1121' : '#F8FAFC' }]}>
            <LinearGradient colors={['#1e3c72', '#2a5298']} style={[styles.header, { paddingTop: insets.top + 10 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <MaterialIcons name="chevron-left" size={32} color="#fff" />
                    </TouchableOpacity>
                    <AppText style={styles.headerTitle}>New Message</AppText>
                    <View style={{ width: 44 }} />
                </View>
                {/* Search Bar */}
                <View style={[styles.searchContainer, { marginTop: 16 }]}>
                    <MaterialCommunityIcons name="magnify" size={22} color="rgba(255,255,255,0.7)" style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search students to message..."
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <MaterialCommunityIcons name="close-circle" size={20} color="rgba(255,255,255,0.7)" />
                        </TouchableOpacity>
                    )}
                </View>
            </LinearGradient>

            <FlatList
                style={{ flex: 1 }}
                data={filteredStudents}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="account-search-outline" size={48} color={theme === 'dark' ? '#334155' : '#CBD5E1'} />
                            <AppText style={[styles.emptyText, { color: colors.textSecondary }]}>No students found</AppText>
                        </View>
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingBottom: 20,
        paddingHorizontal: 16,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 8,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: {
        width: 44,
        height: 44,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.5,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 48,
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
    },
    content: {
        paddingHorizontal: 16,
        paddingBottom: 40,
        paddingTop: 16,
        gap: 12,
    },
    contactCard: {
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    reqProfile: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        flex: 1,
    },
    reqAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#2CB4FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#E2E8F0',
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
    },
    reqNameBlock: {
        gap: 4,
        flex: 1,
    },
    reqName: {
        fontSize: 16,
        fontWeight: '700',
    },
    reqRoomBadge: {
        backgroundColor: '#DBEAFE',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    reqRoomText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#2563EB',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
    }
});
