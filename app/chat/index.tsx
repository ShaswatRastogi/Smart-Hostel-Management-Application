import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api, { API_BASE_URL } from '../../utils/api';
import { isAdmin, useUser } from '../../utils/authUtils';
import { subscribeToChatList } from '../../utils/chatUtils';
import { useTheme } from '../../utils/ThemeContext';
import AppText from '../../components/AppText';

interface Conversation {
    id: number;
    studentId: number;
    staffId: number | null;
    studentName: string;
    lastMessage: string;
    time: string;
    unread: number;
    profilePhoto: string | null;
}

export default function ChatIndex() {
    const { colors, theme, isDark } = useTheme();
    const router = useRouter();
    const user = useUser();
    const insets = useSafeAreaInsets();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Local state to track if we've finished checking the user from storage
    const [authChecking, setAuthChecking] = useState(true);
    const [currentUser, setCurrentUser] = useState(user);

    // Sync local user state and handle initialization check
    useEffect(() => {
        if (user !== null) {
            setCurrentUser(user);
            setAuthChecking(false);
        }
    }, [user]);

    // let's fetch manual to be sure
    useEffect(() => {
        let isMounted = true;
        import('../../utils/authUtils').then(({ getStoredUser }) => {
            getStoredUser().then(u => {
                if (isMounted) {
                    setCurrentUser(u);
                    setAuthChecking(false);
                }
            });
        });
        return () => { isMounted = false; };
    }, []);

    const isUserAdmin = isAdmin(currentUser);

    useEffect(() => {
        if (authChecking) return; // Wait for auth check to finish

        if (!loading && !isUserAdmin) {
            // Redirect Student immediately to their chat
            router.replace({
                pathname: '/chat/[id]',
                params: { id: 'admin', name: 'Admin Support' }
            });
        }
    }, [isUserAdmin, loading, authChecking]);

    const fetchConversations = async () => {
        try {
            const res = await api.get('/chats');
            setConversations(res.data);
        } catch (error) {
            console.error("Error fetching chats:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (authChecking) return;

        if (isUserAdmin) {
            fetchConversations();
            // Subscribe to real-time list updates via WebSockets
            const unsubscribe = subscribeToChatList(() => {
                fetchConversations();
            });
            return () => unsubscribe();
        } else {
            setLoading(false); // finish loading to trigger redirect
        }
    }, [isUserAdmin, authChecking]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchConversations();
    };

    const filteredConversations = conversations.filter(c => 
        c.studentName && c.studentName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }: { item: Conversation }) => {
        const date = new Date(item.time);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        return (
            <TouchableOpacity style={[styles.chatItem, { backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF', borderColor: theme === 'dark' ? '#334155' : '#E2E8F0' }]} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.studentId.toString(), name: item.studentName, staffId: item.staffId?.toString() || '' } })}><View style={styles.avatarWrapper}>{item.profilePhoto ? (<Image source={{ uri: item.profilePhoto.startsWith('http') ? item.profilePhoto : API_BASE_URL + item.profilePhoto }} style={styles.avatar} />) : (<View style={styles.avatarPlaceholder}><AppText style={styles.avatarText}>{item.studentName.charAt(0).toUpperCase()}</AppText></View>)}{item.unread > 0 ? <View style={styles.unreadDot} /> : null}</View><View style={styles.chatContent}><View style={styles.chatHeader}><AppText style={[styles.studentName, { color: theme === 'dark' ? '#F8FAFC' : '#0F172A' }]}>{item.studentName}</AppText><AppText style={[styles.timeText, { color: theme === 'dark' ? '#94A3B8' : '#64748B' }]}>{timeStr}</AppText></View><View style={styles.lastMessageRow}><AppText style={[styles.lastMessage, { color: item.unread > 0 ? (theme === 'dark' ? '#E2E8F0' : '#1E293B') : (theme === 'dark' ? '#94A3B8' : '#64748B'), fontWeight: item.unread > 0 ? '700' : '400' }]} numberOfLines={1}>{item.lastMessage || 'No messages yet'}</AppText>{item.unread > 0 ? <View style={styles.badge}><AppText style={styles.badgeText}>{item.unread}</AppText></View> : null}</View></View><MaterialCommunityIcons name="chevron-right" size={20} color={theme === 'dark' ? '#334155' : '#CBD5E1'} style={{ marginLeft: 8 }} /></TouchableOpacity>
        );
    };

    // If student, show loader while redirecting
    if (!isUserAdmin) {
        return (
            <View style={[styles.centered, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#0B1121' : '#F8FAFC' }]}>
            <LinearGradient colors={['#1e3c72', '#2a5298']} style={[styles.header, { paddingTop: insets.top + 10 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <MaterialIcons name="chevron-left" size={32} color="#fff" />
                    </TouchableOpacity>
                    <AppText style={styles.headerTitle}>Messages</AppText>
                    <TouchableOpacity onPress={() => router.push('/chat/new')} style={styles.backBtn}>
                        <MaterialIcons name="add" size={28} color="#fff" />
                    </TouchableOpacity>
                </View>
                {/* Search Bar */}
                <View style={[styles.searchContainer, { marginTop: 16 }]}>
                    <MaterialCommunityIcons name="magnify" size={22} color="rgba(255,255,255,0.7)" style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search students..."
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
            {loading ? (
                <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>
            ) : (
                <FlatList 
                    data={filteredConversations} 
                    renderItem={renderItem} 
                    keyExtractor={item => item.id.toString()} 
                    contentContainerStyle={{ padding: 16, gap: 12 }} 
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />} 
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name={searchQuery ? "chat-alert-outline" : "chat-outline"} size={64} color={colors.textSecondary} />
                            <AppText style={[styles.emptyText, { color: colors.textSecondary }]}>{searchQuery ? 'No students match search' : 'No conversations yet'}</AppText>
                        </View>
                    } 
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
    chatItem: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    avatarWrapper: {
        position: 'relative',
        marginRight: 16,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: '#E2E8F0',
    },
    avatarPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#2CB4FF',
    },
    avatarText: { color: '#fff', fontSize: 24, fontWeight: '800' },
    unreadDot: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#2CB4FF',
        borderWidth: 2,
        borderColor: '#fff',
    },
    chatContent: { flex: 1 },
    chatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    studentName: { fontSize: 17, fontWeight: '700' },
    timeText: { fontSize: 12, fontWeight: '600' },
    lastMessageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    lastMessage: { fontSize: 14, flex: 1, marginRight: 8 },
    badge: {
        backgroundColor: '#2CB4FF',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
    emptyContainer: { alignItems: 'center', marginTop: 100, gap: 16 },
    emptyText: { fontSize: 16, fontWeight: '600' },
});
