import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
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
    const insets = useSafeAreaInsets();
    const user = useUser();
    const { showAlert } = useAlert();
    const { isDark } = useTheme();

    const isUserAdmin = isAdmin(user);
    const currentUserId = isUserAdmin ? 'admin' : 'student';
    const currentUserName = isUserAdmin ? 'Admin' : ((user as any)?.displayName || (user as any)?.name || 'Student');
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

    // Dynamic Theme Map
    const themeBg = isDark ? '#000000' : '#F8FAFC';
    const textMain = isDark ? '#FFFFFF' : '#111111';
    const textMuted = isDark ? '#888888' : '#64748B';
    const borderSubtle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

    const myBubbleBg = isDark ? '#FFFFFF' : '#111111';
    const myBubbleText = isDark ? '#000000' : '#FFFFFF';
    const myTimeText = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)';
    const otherBubbleBg = isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF';
    const otherBubbleText = isDark ? '#FFFFFF' : '#111111';
    const otherTimeText = isDark ? '#888888' : '#64748B';

    const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF';
    const inputBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    const sendBtnBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
    const sendBtnActiveBg = isDark ? '#FFFFFF' : '#111111';
    const sendBtnIcon = isDark ? '#000000' : '#FFFFFF';

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
            (msg) => { setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [msg, ...prev]); },
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
            typingTimeoutRef.current = setTimeout(() => { emitStopTyping(targetId); }, 1500);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim() || !id) return;
        const textToSend = inputText.trim();
        const targetId = realConversationId || id;
        setInputText('');
        if (targetId) emitStopTyping(targetId);
        await sendMessage(id, textToSend, { _id: currentUserId, name: currentUserName }, staffId);
    };

    const handleDeleteStudent = () => {
        if (partnerDetails?.id) {
            showAlert("Delete Student", `Are you sure you want to delete ${partnerDetails.name} (Room ${partnerDetails.room})?`, [
                { text: "Cancel", style: "cancel", onPress: () => { } },
                { text: "Delete", style: "destructive", onPress: async () => { try { await deleteStudent(partnerDetails.id); setDetailsModalVisible(false); router.replace('/admin/students'); } catch (error) { showAlert('Error', 'Failed to delete student'); } } }
            ], 'warning');
        }
    };

    const handleEditStudent = () => {
        if (partnerDetails?.id) { setDetailsModalVisible(false); router.push({ pathname: '/admin/students', params: { openEditId: partnerDetails.id } }); }
    };

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
        for (let i = 0; i < msgs.length; i++) {
            const currentMsg = msgs[i];
            const currentDate = new Date(currentMsg.createdAt);
            const dateString = getDateText(currentDate);
            processed.push(currentMsg);
            const nextMsg = msgs[i + 1];
            if (nextMsg) {
                const nextDate = new Date(nextMsg.createdAt);
                const nextDateString = getDateText(nextDate);
                if (nextDateString !== dateString) processed.push({ _id: `day-${dateString}`, type: 'day', date: dateString });
            } else {
                processed.push({ _id: `day-${dateString}`, type: 'day', date: dateString });
            }
        }
        return processed;
    };

    const processedMessages = React.useMemo(() => processMessages(messages), [messages]);

    const renderMessage = ({ item, index }: { item: any, index: number }) => {
        if (item.type === 'day') return <View style={styles.dateSeparator}><AppText style={styles.dateText}>{item.date.toUpperCase()}</AppText></View>;

        const isMe = item.user._id === currentUserId;
        const nextItem = processedMessages[index + 1];
        const isContinuous = nextItem && 'user' in nextItem && 'user' in item && nextItem.user._id === item.user._id;

        return (
            <View style={[styles.messageRow, isMe ? styles.myMessageRow : styles.otherMessageRow, isContinuous ? { marginBottom: 2 } : { marginBottom: 16 }]}>
                <View style={[styles.bubble, isMe ? [styles.myBubble, { backgroundColor: myBubbleBg }] : [styles.otherBubble, { backgroundColor: otherBubbleBg, borderColor: borderSubtle, borderWidth: isDark ? 0 : 1 }]]}>
                    <AppText style={[styles.messageText, isMe ? { color: myBubbleText } : { color: otherBubbleText }]}>
                        {item.text}
                    </AppText>
                    <View style={styles.timeContainer}>
                        <AppText style={[styles.timeText, isMe ? { color: myTimeText } : { color: otherTimeText }]}>
                            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </AppText>
                        {isMe && (
                            <MaterialCommunityIcons
                                name={item.read ? "check-all" : "check"}
                                size={14}
                                color={item.read ? myBubbleText : myTimeText}
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
        const diff = (new Date().getTime() - date.getTime()) / 1000 / 60;
        if (diff < 60) return `Last seen ${Math.floor(diff)}m ago`;
        if (diff < 1440) return `Last seen ${Math.floor(diff / 60)}h ago`;
        return 'Offline';
    };

    return (
        <View style={[styles.container, { backgroundColor: themeBg }]}>
            <View style={[styles.header, { paddingTop: insets.top + 10, borderColor: borderSubtle }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={textMain} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.headerProfile} onPress={() => partnerDetails && setDetailsModalVisible(true)} disabled={!partnerDetails}>
                    <View style={[styles.headerAvatar, { backgroundColor: borderSubtle }]}>
                        {partnerDetails?.profilePhoto ? (
                            <Image source={{ uri: partnerDetails.profilePhoto.startsWith('http') ? partnerDetails.profilePhoto : `${API_BASE_URL}${partnerDetails.profilePhoto}` }} style={{ width: 44, height: 44, borderRadius: 22 }} contentFit="cover" />
                        ) : (
                            <AppText style={[styles.headerAvatarText, { color: textMain }]}>{chatTitle.charAt(0).toUpperCase()}</AppText>
                        )}
                        {partnerStatus.online && <View style={[styles.onlineDot, { borderColor: themeBg }]} />}
                    </View>
                    <View>
                        <AppText style={[styles.headerName, { color: textMain }]}>{chatTitle}</AppText>
                        <AppText style={[styles.headerStatus, { color: partnerStatus.online ? '#10B981' : textMuted }]}>{getStatusText()}</AppText>
                    </View>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                {loading ? (
                    <View style={styles.loadingContainer}><ActivityIndicator size="large" color={textMain} /></View>
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
                    <View style={styles.typingContainer}>
                        <AppText style={styles.typingText}>{chatTitle} is typing...</AppText>
                    </View>
                )}

                <View style={[styles.inputWrapper, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                    <View style={[styles.inputBox, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                        <TextInput
                            style={[styles.input, { color: textMain }]}
                            placeholder="Type a message..."
                            placeholderTextColor={textMuted}
                            value={inputText}
                            onChangeText={handleTyping}
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity style={[styles.sendBtn, { backgroundColor: sendBtnBg }, inputText.trim().length > 0 && { backgroundColor: sendBtnActiveBg }]} onPress={handleSend} disabled={inputText.trim().length === 0}>
                            <MaterialCommunityIcons name="arrow-up" size={20} color={inputText.trim().length > 0 ? sendBtnIcon : textMuted} />
                        </TouchableOpacity>
                    </View>
                </View>
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
    container: { flex: 1 },
    header: { paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
    backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
    headerProfile: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    headerAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    headerAvatarText: { fontSize: 20, fontWeight: '800' },
    onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#10B981', borderWidth: 2 },
    headerName: { fontSize: 18, fontWeight: '700' },
    headerStatus: { fontSize: 12, fontWeight: '600' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    messageRow: { flexDirection: 'row', width: '100%' },
    myMessageRow: { justifyContent: 'flex-end' },
    otherMessageRow: { justifyContent: 'flex-start' },
    dateSeparator: { alignItems: 'center', marginVertical: 24 },
    dateText: { fontSize: 11, fontWeight: '800', color: '#666666', letterSpacing: 1 },
    bubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, maxWidth: '80%' },
    myBubble: { borderBottomRightRadius: 4 },
    otherBubble: { borderBottomLeftRadius: 4 },
    messageText: { fontSize: 16, lineHeight: 22 },
    timeContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 },
    timeText: { fontSize: 11, fontWeight: '600' },
    inputWrapper: { paddingHorizontal: 16, paddingTop: 8 },
    inputBox: { flexDirection: 'row', alignItems: 'flex-end', borderRadius: 24, padding: 4, borderWidth: 1 },
    input: { flex: 1, fontSize: 16, maxHeight: 100, minHeight: 40, paddingHorizontal: 16, paddingVertical: 10 },
    sendBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 2, marginRight: 2 },
    typingContainer: { paddingHorizontal: 24, paddingBottom: 8 },
    typingText: { fontSize: 12, color: '#888888', fontStyle: 'italic' }
});
