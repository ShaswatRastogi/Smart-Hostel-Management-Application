import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient'; // Added LinearGradient
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StudentDetailsModal from '../../components/StudentDetailsModal';
import { useAlert } from '../../context/AlertContext';
import { API_BASE_URL } from '../../utils/api';

import { isAdmin, useUser } from '../../utils/authUtils';
import { ChatMessage, emitStopTyping, emitTyping, sendMessage, subscribeToMessages } from '../../utils/chatUtils';
import { deleteStudent } from '../../utils/studentUtils';
import { useTheme } from '../../utils/ThemeContext';
import AppText from '../../components/AppText';

export default function ChatScreen() {
    const { id, name, staffId } = useLocalSearchParams<{ id: string, name?: string, staffId?: string }>();
    const router = useRouter();
    const { colors, theme } = useTheme();
    const insets = useSafeAreaInsets();
    const user = useUser();
    const { showAlert } = useAlert();

    // Determine current user role/id
    const isUserAdmin = isAdmin(user);
    const currentUserId = isUserAdmin ? 'admin' : 'student';
    const currentUserName = isUserAdmin ? 'Admin' : ((user as any)?.displayName || (user as any)?.name || 'Student');

    // Determine Chat Title
    const chatTitle = name || (isUserAdmin ? 'Student Chat' : 'Admin Support');

    const [partnerStatus, setPartnerStatus] = useState<{ online: boolean; lastSeen: string | null }>({ online: false, lastSeen: null });
    const [partnerDetails, setPartnerDetails] = useState<any>(null);
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [isPartnerTyping, setIsPartnerTyping] = useState(false);
    const [realConversationId, setRealConversationId] = useState<string | null>(null);
    const flatListRef = React.useRef<FlatList>(null);
    const typingTimeoutRef = React.useRef<any>(null);

    useEffect(() => {
        if (!id) return;
        const unsubscribe = subscribeToMessages(
            id,
            (newMessages, status, details, realConvId) => {
                setMessages(newMessages);
                if (status) setPartnerStatus(status);
                if (details) setPartnerDetails(details);
                if (realConvId) setRealConversationId(realConvId);
                setLoading(false);
            },
            (msg) => {
                // Handle new incoming message in real-time
                setMessages(prev => {
                    if (prev.some(m => m._id === msg._id)) return prev;
                    return [msg, ...prev];
                });
            },
            (isTyping) => setIsPartnerTyping(isTyping),
            staffId
        );
        return () => unsubscribe();
    }, [id, staffId]);

    const handleTyping = (text: string) => {
        setInputText(text);
        const targetId = realConversationId || id;
        if (targetId) {
            emitTyping(targetId, { _id: currentUserId, name: currentUserName });
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                emitStopTyping(targetId);
            }, 1500);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim() || !id) return;
        const textToSend = inputText.trim();
        const targetId = realConversationId || id;

        setInputText(''); // Clear immediately for responsiveness
        if (targetId) emitStopTyping(targetId);

        console.log(`[DEBUG] handleSend: sending to ${id}, staffId=${staffId}`);
        await sendMessage(id, textToSend, {
            _id: currentUserId,
            name: currentUserName
        }, staffId);
    };

    const handleDeleteStudent = () => {
        if (partnerDetails?.id) {
            showAlert(
                "Delete Student",
                `Are you sure you want to delete ${partnerDetails.name} (Room ${partnerDetails.room})? This action cannot be undone.`,
                [
                    { text: "Cancel", style: "cancel", onPress: () => { } },
                    {
                        text: "Delete",
                        style: "destructive",
                        onPress: async () => {
                            try {
                                await deleteStudent(partnerDetails.id);
                                setDetailsModalVisible(false);
                                router.replace('/admin/students');
                            } catch (error) {
                                showAlert('Error', 'Failed to delete student');
                            }
                        }
                    }
                ],
                'warning'
            );
        }
    };

    const handleEditStudent = () => {
        if (partnerDetails?.id) {
            setDetailsModalVisible(false);
            router.push({
                pathname: '/admin/students',
                params: { openEditId: partnerDetails.id }
            });
        }
    };

    // Date Divider Logic
    const getDateText = (date: Date) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString();
    };

    const processMessages = (msgs: ChatMessage[]) => {
        const processed: (ChatMessage | { _id: string, type: 'day', date: string })[] = [];
        let lastDateString = '';

        for (let i = 0; i < msgs.length; i++) {
            const currentMsg = msgs[i];
            const currentDate = new Date(currentMsg.createdAt);
            const dateString = getDateText(currentDate);

            processed.push(currentMsg);

            const nextMsg = msgs[i + 1];
            if (nextMsg) {
                const nextDate = new Date(nextMsg.createdAt);
                const nextDateString = getDateText(nextDate);
                if (nextDateString !== dateString) {
                    processed.push({ _id: `day-${dateString}`, type: 'day', date: dateString });
                }
            } else {
                processed.push({ _id: `day-${dateString}`, type: 'day', date: dateString });
            }
        }
        return processed;
    };

    const processedMessages = React.useMemo(() => processMessages(messages), [messages]);

    const renderMessage = ({ item, index }: { item: any, index: number }) => {
        if (item.type === 'day') {
            return (
                <View style={[styles.dateSeparator, { marginVertical: 16 }]}>
                    <AppText style={[
                        styles.dateText,
                        {
                            color: theme === 'dark' ? '#94A3B8' : '#64748B',
                            backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 0.8)'
                        }
                    ]}>
                        {item.date}
                    </AppText>
                </View>
            );
        }

        const isMe = item.user._id === currentUserId;
        const nextItem = processedMessages[index + 1];
        const isContinuous = nextItem &&
            'user' in nextItem &&
            'user' in item &&
            nextItem.user._id === item.user._id;

        return (
            <View style={[
                styles.messageRow,
                isMe ? styles.myMessageRow : styles.otherMessageRow,
                isContinuous ? { marginBottom: 2 } : { marginBottom: 12 }
            ]}>
                {!isMe && !isContinuous && (
                    <View style={styles.messageAvatar}>
                        {item.user.avatar ? (
                            <Image
                                source={{ uri: item.user.avatar.startsWith('http') ? item.user.avatar : `${API_BASE_URL}${item.user.avatar}` }}
                                style={{ width: 36, height: 36, borderRadius: 18 }}
                                contentFit="cover"
                            />
                        ) : (
                            <AppText style={styles.avatarLetter}>{chatTitle.charAt(0)}</AppText>
                        )}
                    </View>
                )}
                {!isMe && isContinuous && <View style={{ width: 36, marginRight: 8 }} />}

                <View style={[
                    styles.bubble,
                    isMe ? styles.myBubble : styles.otherBubble,
                    {
                        backgroundColor: isMe ? '#2CB4FF' : (theme === 'dark' ? '#1E293B' : '#FFFFFF'),
                        borderBottomRightRadius: isMe && !isContinuous ? 4 : 20,
                        borderTopRightRadius: isMe && isContinuous ? 4 : 20,
                        borderBottomLeftRadius: !isMe && !isContinuous ? 4 : 20,
                        borderTopLeftRadius: !isMe && isContinuous ? 4 : 20,
                        borderWidth: isMe ? 0 : (theme === 'dark' ? 1 : 0),
                        borderColor: theme === 'dark' ? '#334155' : 'transparent',
                    }
                ]}>
                    <AppText style={[
                        styles.messageText,
                        { color: isMe ? '#ffffff' : (theme === 'dark' ? '#F8FAFC' : '#0F172A') }
                    ]}>
                        {item.text}
                    </AppText>
                    <View style={styles.timeContainer}>
                        <AppText style={[
                            styles.timeText,
                            { color: isMe ? 'rgba(255,255,255,0.85)' : (theme === 'dark' ? '#94A3B8' : '#64748B') }
                        ]}>
                            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </AppText>
                        {isMe && (
                            <MaterialCommunityIcons
                                name={item.read ? "check-all" : "check"}
                                size={14}
                                color={item.read ? "#E0F2FE" : "rgba(255,255,255,0.7)"}
                                style={{ marginLeft: 4 }}
                            />
                        )}
                    </View>
                </View>
            </View>
        );
    };

    const getStatusText = () => {
        if (partnerStatus.online) return 'Online';
        if (!partnerStatus.lastSeen) return 'Offline';
        const date = new Date(partnerStatus.lastSeen);
        const diff = (new Date().getTime() - date.getTime()) / 1000 / 60; // minutes
        if (diff < 60) return `Last seen ${Math.floor(diff)}m ago`;
        if (diff < 1440) return `Last seen ${Math.floor(diff / 60)}h ago`;
        return 'Offline';
    };

    return (
        <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#0F172A' : '#F1F5F9' }]}>
            <LinearGradient
                colors={['#1e3c72', '#2a5298']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: insets.top + 10 }]}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="chevron-left" size={32} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.headerProfile}
                        onPress={() => partnerDetails && setDetailsModalVisible(true)}
                        disabled={!partnerDetails}
                    >
                        <View style={styles.headerAvatar}>
                            {partnerDetails?.profilePhoto ? (
                                <Image
                                    source={{ uri: partnerDetails.profilePhoto.startsWith('http') ? partnerDetails.profilePhoto : `${API_BASE_URL}${partnerDetails.profilePhoto}` }}
                                    style={{ width: 44, height: 44, borderRadius: 22 }}
                                    contentFit="cover"
                                />
                            ) : (
                                <AppText style={styles.headerAvatarText}>{chatTitle.charAt(0).toUpperCase()}</AppText>
                            )}
                            {partnerStatus.online && <View style={styles.onlineDot} />}
                        </View>
                        <View>
                            <AppText style={styles.headerName}>{chatTitle}</AppText>
                            {staffId && !isUserAdmin && (
                                <AppText style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>Direct Message to Warden</AppText>
                            )}
                            <AppText style={[styles.headerStatus, { color: partnerStatus.online ? '#4ADE80' : 'rgba(255,255,255,0.7)' }]}>
                                {getStatusText()}
                            </AppText>
                        </View>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <LinearGradient
                    colors={theme === 'dark' ? ['#0B1121', '#0F172A'] : ['#F8FAFC', '#F1F5F9']}
                    style={{ flex: 1 }}
                >
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#2CB4FF" />
                        </View>
                    ) : (
                        <FlatList
                            ref={flatListRef}
                            data={processedMessages}
                            renderItem={renderMessage}
                            keyExtractor={item => item._id}
                            inverted
                            style={{ flex: 1 }}
                            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, paddingTop: 24 }}
                            showsVerticalScrollIndicator={false}
                        />
                    )}

                    {isPartnerTyping && (
                        <View style={styles.typingIndicatorContainer}>
                            <View style={[styles.typingBubble, { backgroundColor: theme === 'dark' ? '#1E293B' : '#E2E8F0' }]}>
                                <AppText style={[styles.typingIndicatorText, { color: theme === 'dark' ? '#94A3B8' : '#64748B' }]}>
                                    {chatTitle} is typing...
                                </AppText>
                            </View>
                        </View>
                    )}

                    <View style={[styles.inputWrapper, { paddingBottom: Math.max(insets.bottom, 12), paddingTop: 8, backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)' }]}>
                        <View style={[styles.inputContainer, { backgroundColor: theme === 'dark' ? '#1E293B' : '#F1F5F9', borderColor: theme === 'dark' ? '#334155' : '#E2E8F0', borderWidth: 1 }]}>
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Message..."
                                placeholderTextColor={theme === 'dark' ? '#64748B' : '#94A3B8'}
                                value={inputText}
                                onChangeText={handleTyping}
                                multiline
                                maxLength={500}
                            />
                            <TouchableOpacity
                                style={[styles.sendBtn, { backgroundColor: inputText.trim().length > 0 ? '#2CB4FF' : (theme === 'dark' ? '#334155' : '#E2E8F0') }]}
                                onPress={handleSend}
                                disabled={inputText.trim().length === 0}
                            >
                                <MaterialCommunityIcons name="send" size={18} color={inputText.trim().length > 0 ? "#fff" : (theme === 'dark' ? '#64748B' : '#94A3B8')} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </LinearGradient>
            </KeyboardAvoidingView>

            <StudentDetailsModal
                visible={detailsModalVisible}
                student={partnerDetails}
                onClose={() => setDetailsModalVisible(false)}
                onEdit={handleEditStudent}
                onDelete={handleDeleteStudent}
                viewMode="full"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingBottom: 20,
        paddingHorizontal: 16,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
        zIndex: 10,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    backBtn: {
        width: 44,
        height: 44,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerProfile: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    headerAvatarText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1e3c72',
    },
    onlineDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4ADE80',
        borderWidth: 2,
        borderColor: '#fff',
    },
    headerName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.5,
    },
    headerStatus: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageRow: {
        flexDirection: 'row',
        width: '100%',
        alignItems: 'flex-end',
    },
    myMessageRow: {
        justifyContent: 'flex-end',
    },
    otherMessageRow: {
        justifyContent: 'flex-start',
    },
    messageAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    avatarLetter: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
    },
    dateSeparator: {
        alignItems: 'center',
        marginVertical: 16,
    },
    dateText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#94A3B8',
        backgroundColor: 'rgba(241, 245, 249, 0.5)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        overflow: 'hidden',
    },
    bubble: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        maxWidth: '78%',
        minWidth: 80,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    myBubble: {},
    otherBubble: {},
    messageText: {
        fontSize: 15,
        lineHeight: 22,
        letterSpacing: 0.2,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 4,
    },
    timeText: {
        fontSize: 10,
        fontWeight: '500',
    },
    inputWrapper: {
        paddingHorizontal: 16,
        paddingTop: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderRadius: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    input: {
        flex: 1,
        fontSize: 16,
        maxHeight: 100,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    typingIndicatorContainer: {
        paddingHorizontal: 16,
        paddingBottom: 4,
        flexDirection: 'row',
    },
    typingBubble: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        borderBottomLeftRadius: 4,
    },
    typingIndicatorText: {
        fontSize: 12,
        fontWeight: '600',
        fontStyle: 'italic',
    },
});
