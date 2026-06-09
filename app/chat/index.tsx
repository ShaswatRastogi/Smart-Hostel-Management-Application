import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api, { API_BASE_URL } from '../../utils/api';
import { isAdmin, useUser } from '../../utils/authUtils';
import { subscribeToChatList } from '../../utils/chatUtils';
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
    const router = useRouter();
    const user = useUser();
    const insets = useSafeAreaInsets();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [authChecking, setAuthChecking] = useState(true);
    const [currentUser, setCurrentUser] = useState(user);

    useEffect(() => {
        if (user !== null) {
            setCurrentUser(user);
            setAuthChecking(false);
        }
    }, [user]);

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
        if (authChecking) return;
        if (!loading && !isUserAdmin) {
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
            const unsubscribe = subscribeToChatList(() => {
                fetchConversations();
            });
            return () => unsubscribe();
        } else {
            setLoading(false);
        }
    }, [isUserAdmin, authChecking]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchConversations();
    };

    const filteredConversations = conversations.filter(c => 
        c.studentName && c.studentName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const ConversationItem = React.memo(({ item }: { item: Conversation }) => {
        const date = new Date(item.time);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        
        return (
            <TouchableOpacity 
                style={styles.chatRow} 
                onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.studentId.toString(), name: item.studentName, staffId: item.staffId?.toString() || '' } })}
            >
                <View style={styles.avatarContainer}>
                    {item.profilePhoto ? (
                        <Image source={{ uri: item.profilePhoto.startsWith('http') ? item.profilePhoto : API_BASE_URL + item.profilePhoto }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <AppText style={styles.avatarText}>{item.studentName.charAt(0).toUpperCase()}</AppText>
                        </View>
                    )}
                    {item.unread > 0 && <View style={styles.unreadDot} />}
                </View>

                <View style={styles.chatContent}>
                    <View style={styles.chatHeader}>
                        <AppText style={styles.studentName}>{item.studentName}</AppText>
                        <AppText style={[styles.timeText, item.unread > 0 && styles.timeTextUnread]}>{timeStr}</AppText>
                    </View>
                    <View style={styles.messagePreviewRow}>
                        <AppText style={[styles.messagePreview, item.unread > 0 && styles.messagePreviewUnread]} numberOfLines={1}>
                            {item.lastMessage || 'No messages yet'}
                        </AppText>
                        {item.unread > 0 && (
                            <View style={styles.badge}>
                                <AppText style={styles.badgeText}>{item.unread}</AppText>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    });

    const renderItem = React.useCallback(({ item }: { item: Conversation }) => <ConversationItem item={item} />, []);

    if (!isUserAdmin) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push('/chat/new')} style={styles.iconBtn}>
                        <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
                <AppText style={styles.headerTitle}>Messages</AppText>

                <View style={styles.searchBar}>
                    <MaterialCommunityIcons name="magnify" size={20} color="#666666" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search conversations..."
                        placeholderTextColor="#666666"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <MaterialCommunityIcons name="close-circle" size={16} color="#666666" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading ? (
                <View style={styles.loaderContainer}><ActivityIndicator size="large" color="#FFFFFF" /></View>
            ) : (
                <FlashList 
                    data={filteredConversations} 
                    renderItem={renderItem} 
                    keyExtractor={item => item.id.toString()} 
                    contentContainerStyle={styles.listContent} 
                    estimatedItemSize={90}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />} 
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <AppText style={styles.emptyText}>{searchQuery ? 'No matches found' : 'No conversations yet'}</AppText>
                        </View>
                    } 
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000000' },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' },
    
    header: { paddingHorizontal: 24, paddingBottom: 16 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    
    headerTitle: { fontSize: 40, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1.5, marginBottom: 24 },
    
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 48,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, color: '#FFFFFF', fontSize: 16 },
    
    listContent: { paddingBottom: 40 },
    
    chatRow: {
        flexDirection: 'row',
        paddingVertical: 20,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center'
    },
    
    avatarContainer: { marginRight: 16, position: 'relative' },
    avatar: { width: 56, height: 56, borderRadius: 28 },
    avatarPlaceholder: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
    unreadDot: { position: 'absolute', top: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#000000' },
    
    chatContent: { flex: 1, justifyContent: 'center' },
    chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    studentName: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', flex: 1, marginRight: 8 },
    timeText: { fontSize: 12, fontWeight: '600', color: '#666666' },
    timeTextUnread: { color: '#FFFFFF', fontWeight: '800' },
    
    messagePreviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    messagePreview: { fontSize: 15, color: '#888888', flex: 1, marginRight: 16 },
    messagePreviewUnread: { color: '#FFFFFF', fontWeight: '700' },
    
    badge: { backgroundColor: '#FFFFFF', paddingHorizontal: 8, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    badgeText: { color: '#000000', fontSize: 11, fontWeight: '800' },
    
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 14, color: '#666666', fontStyle: 'italic' }
});
