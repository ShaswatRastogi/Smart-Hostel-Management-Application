import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sendChatMessage, ChatMessage } from '../utils/aiChat';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../utils/ThemeContext';
import AppText from '../components/AppText';

export default function AIChatScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        // Initial greeting
        setMessages([
            {
                id: 'welcome',
                text: `Hi ${user?.fullName?.split(' ')[0] || 'there'}! I'm your SmartStay AI Assistant.\n\nI can help you with:\n• 🍔 Mess Menus & Meal Info\n• 📋 Your Account, Dues & Profile\n• 📝 Complaint Status & Filing Issues\n• 🏠 Leave Applications\n• 👥 Visitor Registration\n• 🚌 Bus Timings & Routes\n• 🧺 Laundry Service Details\n• 🚨 Emergency Contacts\n\nHow can I help you today?`,
                role: 'assistant',
                timestamp: new Date(),
            }
        ]);
    }, [user]);

    const handleSend = async () => {
        if (!inputText.trim() || isLoading) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            text: inputText.trim(),
            role: 'user',
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);

        try {
            // Convert to LangChain format history
            const history = messages.map(m => ({
                role: m.role,
                content: m.text
            }));

            const reply = await sendChatMessage(userMsg.text, history);

            setMessages((prev) => [...prev, {
                id: (Date.now() + 1).toString(),
                text: reply,
                role: 'assistant',
                timestamp: new Date(),
            }]);
        } catch (error) {
            setMessages((prev) => [...prev, {
                id: (Date.now() + 1).toString(),
                text: "I'm having trouble connecting right now. Please try again later.",
                role: 'assistant',
                timestamp: new Date(),
                isError: true,
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            {/* Custom Header */}
            <View style={[styles.header, { 
                borderBottomColor: isDark ? '#334155' : '#E2E8F0', 
                backgroundColor: isDark ? '#1E293B' : '#ffffff',
            }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <View style={styles.avatarContainer}>
                        <MaterialCommunityIcons name="robot-outline" size={24} color="#fff" />
                    </View>
                    <View>
                        <AppText style={[styles.headerTitle, { color: colors.text }]}>SmartStay Assistant</AppText>
                        <View style={styles.statusContainer}>
                            <View style={styles.onlineDot} />
                            <AppText style={styles.headerSubtitle}>Always Online</AppText>
                        </View>
                    </View>
                </View>
            </View>

            {/* Chat Area */}
            <KeyboardAvoidingView 
                style={{ flex: 1 }} 
                behavior="padding"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={styles.scrollContent}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                >
                    {messages.map((msg) => (
                        <View
                            key={msg.id}
                            style={[
                                styles.messageWrapper,
                                msg.role === 'user' ? styles.messageWrapperUser : styles.messageWrapperAssistant,
                            ]}
                        >
                            {msg.role === 'assistant' && (
                                <View style={[styles.smallAvatar, { backgroundColor: colors.primary }]}>
                                    <MaterialCommunityIcons name="robot-outline" size={16} color="#fff" />
                                </View>
                            )}
                            <View style={styles.messageGroup}>
                                <View
                                    style={[
                                        styles.messageBubble,
                                        msg.role === 'user' 
                                            ? { 
                                                backgroundColor: colors.primary, 
                                                borderTopLeftRadius: 20,
                                                borderTopRightRadius: 20,
                                                borderBottomLeftRadius: 20,
                                                borderBottomRightRadius: 4, 
                                              }
                                            : { 
                                                backgroundColor: isDark ? '#334155' : '#F1F5F9', 
                                                borderTopLeftRadius: 20,
                                                borderTopRightRadius: 20,
                                                borderBottomRightRadius: 20,
                                                borderBottomLeftRadius: 4,
                                              },
                                        msg.isError && { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#EF4444' }
                                    ]}
                                >
                                    <AppText style={[
                                        styles.messageText,
                                        { color: msg.role === 'user' ? '#ffffff' : (msg.isError ? '#B91C1C' : colors.text) }
                                    ]}>
                                        {msg.text}
                                    </AppText>
                                </View>
                                <AppText style={[
                                    styles.timestamp, 
                                    { 
                                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                        color: isDark ? '#94A3B8' : '#94A3B8'
                                    }
                                ]}>
                                    {formatTime(msg.timestamp)}
                                </AppText>
                            </View>
                        </View>
                    ))}
                    
                    {isLoading && (
                        <View style={[styles.messageWrapper, styles.messageWrapperAssistant]}>
                             <View style={[styles.smallAvatar, { backgroundColor: colors.primary }]}>
                                <MaterialCommunityIcons name="robot-outline" size={16} color="#fff" />
                            </View>
                            <View style={styles.messageGroup}>
                                <View style={[
                                    styles.messageBubble, 
                                    { 
                                        backgroundColor: isDark ? '#334155' : '#F1F5F9',
                                        borderTopLeftRadius: 20,
                                        borderTopRightRadius: 20,
                                        borderBottomRightRadius: 20,
                                        borderBottomLeftRadius: 4,
                                        paddingVertical: 14,
                                        paddingHorizontal: 20,
                                        minWidth: 60,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }
                                ]}>
                                    <ActivityIndicator size="small" color={colors.primary} />
                                </View>
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* Input Area */}
                <View style={[styles.inputWrapper, { 
                    backgroundColor: isDark ? '#1E293B' : '#ffffff', 
                    borderTopColor: isDark ? '#334155' : '#E2E8F0',
                    paddingBottom: Math.max(insets.bottom, 12)
                }]}>
                    <View style={[styles.inputContainer, {
                        backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                        borderColor: isDark ? '#334155' : '#E2E8F0',
                    }]}>
                        <TextInput
                            style={[styles.input, { color: colors.text }]}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Ask about menu, leave, visitors, complaints..."
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity 
                            style={[
                                styles.sendButton, 
                                { backgroundColor: inputText.trim() ? colors.primary : (isDark ? '#334155' : '#E2E8F0') }
                            ]}
                            onPress={handleSend}
                            disabled={!inputText.trim() || isLoading}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="send" size={16} color={inputText.trim() ? "#fff" : colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
        zIndex: 10,
    },
    backButton: { padding: 4, marginRight: 12 },
    headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
    avatarContainer: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: '#6366f1',
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    headerTitle: { fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
    statusContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 6 },
    headerSubtitle: { fontSize: 13, fontWeight: '500', color: '#10B981' },
    scrollContent: { padding: 16, paddingBottom: 24 },
    messageWrapper: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-end', maxWidth: '85%' },
    messageWrapperUser: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
    messageWrapperAssistant: { alignSelf: 'flex-start', justifyContent: 'flex-start', maxWidth: '90%' },
    smallAvatar: {
        width: 28, height: 28, borderRadius: 14,
        justifyContent: 'center', alignItems: 'center', marginRight: 8, marginBottom: 18
    },
    messageGroup: { flexDirection: 'column' },
    messageBubble: {
        paddingHorizontal: 18, 
        paddingVertical: 14, 
    },
    messageText: { fontSize: 15.5, lineHeight: 22, letterSpacing: 0.1 },
    timestamp: { fontSize: 11, marginTop: 4, fontWeight: '500' },
    inputWrapper: {
        padding: 12, 
        borderTopWidth: 1, 
        paddingHorizontal: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        borderRadius: 24,
        borderWidth: 1,
        paddingLeft: 16,
        paddingRight: 6,
        paddingVertical: 6,
        minHeight: 52,
    },
    input: {
        flex: 1, 
        maxHeight: 120, 
        fontSize: 15.5, 
        paddingTop: 10, 
        paddingBottom: 10,
        marginRight: 10,
    },
    sendButton: {
        width: 38, height: 38, borderRadius: 19,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 2,
    }
});
