import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api, { API_BASE_URL } from '../../utils/api';
import { isAdmin, useUser } from '../../utils/authUtils';
import { useTheme } from '../../utils/ThemeContext';

interface Conversation {
    id: number;
    studentId: number;
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
            // Poll for list updates
            const interval = setInterval(fetchConversations, 10000); // 10s polling for list
            return () => clearInterval(interval);
        } else {
            setLoading(false); // finish loading to trigger redirect
        }
    }, [isUserAdmin, authChecking]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchConversations();
    };

    const renderItem = ({ item }: { item: Conversation }) => {
        // Format time logic could be extracted
        const date = new Date(item.time);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
            <TouchableOpacity
                style={[styles.chatItem, { backgroundColor: isDark ? '#1E293B' : '#fff', borderColor: isDark ? '#334155' : '#E2E8F0' }]}
                onPress={() => router.push({
                    pathname: '/chat/[id]',
                    params: { id: item.studentId.toString(), name: item.studentName }
                })}
            >
                <View style={styles.avatarContainer}>
                    {item.profilePhoto ? (
                        <Image source={{ uri: API_BASE_URL + item.profilePhoto }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                            <Text style={styles.avatarText}>{item.studentName.charAt(0)}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.chatContent}>
                    <View style={styles.chatHeader}>
                        <Text style={[styles.studentName, { color: colors.text }]}>{item.studentName}</Text>
                        <Text style={styles.timeText}>{timeStr}</Text>
                    </View>
                    <Text
                        style={[styles.lastMessage, { color: item.unread > 0 ? colors.text : colors.textSecondary, fontWeight: item.unread > 0 ? '700' : '400' }]}
                        numberOfLines={1}
                    >
                        {item.lastMessage || 'No messages yet'}
                    </Text>
                </View>

                {item.unread > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.unread}</Text>
                    </View>
                )}
            </TouchableOpacity>
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

    // Admin View
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={['#000428', '#004e92']}
                style={[styles.header, { paddingTop: insets.top + 24 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <TouchableOpacity onPress={() => router.back()} style={{
                    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)',
                    justifyContent: 'center', alignItems: 'center'
                }}>
                    <MaterialIcons name="chevron-left" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Messages</Text>
            </LinearGradient>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ padding: 16, gap: 12 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="chat-outline" size={64} color={colors.textSecondary} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No conversations yet</Text>
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
    chatItem: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
    },
    avatarContainer: { marginRight: 16 },
    avatar: { width: 50, height: 50, borderRadius: 25 },
    avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    chatContent: { flex: 1 },
    chatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    studentName: { fontSize: 16, fontWeight: '600' },
    timeText: { fontSize: 12, color: '#94A3B8' },
    lastMessage: { fontSize: 14 },
    badge: {
        backgroundColor: '#EF4444',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        paddingHorizontal: 8
    },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    emptyContainer: { alignItems: 'center', marginTop: 100, gap: 16 },
    emptyText: { fontSize: 16 },
});
