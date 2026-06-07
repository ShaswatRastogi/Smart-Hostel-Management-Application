import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sendChatMessage, ChatMessage } from '../utils/aiChat';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../utils/ThemeContext';
import AppText from '../components/AppText';

export default function AIChatScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
    
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    // Dynamic Theme Map
    const themeBg = isDark ? '#000000' : '#F8FAFC';
    const textMain = isDark ? '#FFFFFF' : '#111111';
    const textMuted = isDark ? '#888888' : '#64748B';
    const borderSubtle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF';
    const inputBorder = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
    const sendBtnBg = isDark ? '#FFFFFF' : '#111111';
    const sendBtnIcon = isDark ? '#000000' : '#FFFFFF';

    useEffect(() => {
        setMessages([{ id: 'welcome', text: `Hi ${user?.fullName?.split(' ')[0] || 'there'}! I'm your SmartStay AI Assistant.\n\nI can help you with:\n• Mess Menus & Meal Info\n• Your Account, Dues & Profile\n• Complaint Status & Filing Issues\n• Leave Applications\n• Visitor Registration\n• Bus Timings & Routes\n• Laundry Service Details\n• Emergency Contacts\n\nHow can I help you today?`, role: 'assistant', timestamp: new Date() }]);
    }, [user]);

    const handleSend = async () => {
        if (!inputText.trim() || isLoading) return;
        const userMsg: ChatMessage = { id: Date.now().toString(), text: inputText.trim(), role: 'user', timestamp: new Date() };
        setMessages((prev) => [...prev, userMsg]);
        setInputText(''); setIsLoading(true);
        try {
            const history = messages.map(m => ({ role: m.role, content: m.text }));
            const reply = await sendChatMessage(userMsg.text, history);
            setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), text: reply, role: 'assistant', timestamp: new Date() }]);
        } catch (error) {
            setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), text: "I'm having trouble connecting right now. Please try again later.", role: 'assistant', timestamp: new Date(), isError: true }]);
        } finally { setIsLoading(false); }
    };

    return (
        <View style={[styles.container, { backgroundColor: themeBg }]}>
            <StatusBar style={isDark ? "light" : "dark"} />
            
            <View style={[styles.header, { paddingTop: insets.top + 16, borderColor: borderSubtle }]}>
                <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]} onPress={() => router.back()}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={textMain} />
                </Pressable>
                <View style={styles.headerTitleWrap}>
                    <AppText style={[styles.headerTitle, { color: textMain }]}>AI Assistant</AppText>
                    <AppText style={styles.headerStatus}>ONLINE</AppText>
                </View>
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
                <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent} onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })} showsVerticalScrollIndicator={false}>
                    {messages.map((msg) => (
                        <View key={msg.id} style={styles.messageRow}>
                            <View style={styles.avatarWrap}>
                                {msg.role === 'assistant' ? <MaterialCommunityIcons name="robot-outline" size={24} color={textMain} /> : <AppText style={styles.userAvatarText}>YOU</AppText>}
                            </View>
                            <View style={styles.messageContent}>
                                <AppText style={[styles.messageText, { color: textMain }, msg.isError && { color: '#EF4444' }]}>{msg.text}</AppText>
                            </View>
                        </View>
                    ))}
                    {isLoading && (
                        <View style={styles.messageRow}>
                            <View style={styles.avatarWrap}>
                                <MaterialCommunityIcons name="robot-outline" size={24} color={textMain} />
                            </View>
                            <View style={styles.messageContent}>
                                <ActivityIndicator size="small" color={textMain} style={{ alignSelf: 'flex-start' }} />
                            </View>
                        </View>
                    )}
                </ScrollView>

                <View style={[styles.inputWrapper, { paddingBottom: Math.max(insets.bottom, 16), borderColor: borderSubtle }]}>
                    <View style={[styles.inputContainer, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                        <TextInput style={[styles.input, { color: textMain }]} value={inputText} onChangeText={setInputText} placeholder="Type a message..." placeholderTextColor={textMuted} multiline maxLength={500} />
                        <Pressable style={({ pressed }) => [styles.sendButton, { backgroundColor: sendBtnBg }, (!inputText.trim() || isLoading) && { opacity: 0.3 }, pressed && { opacity: 0.7 }]} onPress={handleSend} disabled={!inputText.trim() || isLoading}>
                            <MaterialCommunityIcons name="arrow-up" size={24} color={sendBtnIcon} />
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 24, borderBottomWidth: 1 },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    headerTitleWrap: { flex: 1, paddingRight: 40, alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '700', letterSpacing: 1 },
    headerStatus: { fontSize: 10, fontWeight: '800', color: '#10B981', letterSpacing: 2, marginTop: 4 },
    scrollContent: { paddingHorizontal: 24, paddingVertical: 32, gap: 32 },
    messageRow: { flexDirection: 'row', alignItems: 'flex-start' },
    avatarWrap: { width: 40, marginRight: 16, alignItems: 'center', paddingTop: 2 },
    userAvatarText: { fontSize: 11, fontWeight: '800', color: '#666666', letterSpacing: 1 },
    messageContent: { flex: 1 },
    messageText: { fontSize: 16, lineHeight: 24 },
    inputWrapper: { paddingHorizontal: 24, paddingTop: 16, borderTopWidth: 1 },
    inputContainer: { flexDirection: 'row', alignItems: 'flex-end', borderRadius: 24, borderWidth: 1, paddingLeft: 20, paddingRight: 6, paddingVertical: 6, minHeight: 52 },
    input: { flex: 1, maxHeight: 120, fontSize: 16, paddingTop: 10, paddingBottom: 10, marginRight: 10 },
    sendButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }
});
