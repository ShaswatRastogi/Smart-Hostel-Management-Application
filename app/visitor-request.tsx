import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../context/AlertContext';
import { formatUniversalTime } from '../utils/timeUtils';
import { registerVisitor } from '../utils/visitorUtils';
import { useTheme } from '../utils/ThemeContext';
import AppText from '../components/AppText';

export default function VisitorRequest() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { showAlert } = useAlert();
    const { isDark } = useTheme();

    const [visitorName, setVisitorName] = useState('');
    const [visitorPhone, setVisitorPhone] = useState('');
    const [visitorRelation, setVisitorRelation] = useState('');
    const [purpose, setPurpose] = useState('');
    const [expectedDate, setExpectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [expectedTimeIn, setExpectedTimeIn] = useState(new Date());
    const [showTimeInPicker, setShowTimeInPicker] = useState(false);
    const [expectedTimeOut, setExpectedTimeOut] = useState(new Date());
    const [showTimeOutPicker, setShowTimeOutPicker] = useState(false);
    const [loading, setLoading] = useState(false);

    // Dynamic Theme Map
    const themeBg = isDark ? '#000000' : '#F8FAFC';
    const textMain = isDark ? '#FFFFFF' : '#111111';
    const textMuted = isDark ? '#888888' : '#64748B';
    const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF';
    const inputBorder = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
    const primaryBtnBg = isDark ? '#FFFFFF' : '#111111';
    const primaryBtnText = isDark ? '#000000' : '#FFFFFF';

    const handleSubmit = async () => {
        if (!visitorName.trim()) return showAlert('Missing Information', 'Please enter visitor name', [], 'error');
        if (!visitorPhone.trim() || !/^\d{10}$/.test(visitorPhone)) return showAlert('Invalid Phone', 'Please enter a valid 10-digit phone number', [], 'error');
        if (!purpose.trim()) return showAlert('Missing Information', 'Please enter purpose of visit', [], 'error');

        try {
            setLoading(true);
            const formattedDate = expectedDate.toISOString().split('T')[0];
            const formattedTimeIn = expectedTimeIn.toTimeString().split(' ')[0].substring(0, 5);
            const formattedTimeOut = expectedTimeOut.toTimeString().split(' ')[0].substring(0, 5);

            await registerVisitor({ visitorName: visitorName.trim(), visitorPhone: visitorPhone.trim(), visitorRelation: visitorRelation.trim(), purpose: purpose.trim(), expectedDate: formattedDate, expectedTimeIn: formattedTimeIn, expectedTimeOut: formattedTimeOut });

            showAlert('Success', 'Visitor request submitted successfully. You will be notified once approved.', [
                { text: 'View My Visitors', onPress: () => router.push('/my-visitors') },
                { text: 'OK', onPress: () => router.back() }
            ], 'success');

            setVisitorName(''); setVisitorPhone(''); setVisitorRelation(''); setPurpose(''); setExpectedDate(new Date()); setExpectedTimeIn(new Date()); setExpectedTimeOut(new Date());
        } catch (error: any) { showAlert('Error', error.response?.data?.error || 'Failed to submit visitor request', [], 'error'); } finally { setLoading(false); }
    };

    const formatDate = (date: Date) => formatUniversalTime(date, { day: 'numeric', month: 'short', year: 'numeric' });
    const formatTime = (date: Date) => formatUniversalTime(date, { hour: '2-digit', minute: '2-digit', hour12: true });

    return (
        <View style={[styles.container, { backgroundColor: themeBg }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={[styles.headerActions, { paddingTop: insets.top + 16 }]}>
                <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]} onPress={() => router.back()}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={textMain} />
                </Pressable>
            </View>

            <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20} style={{ flex: 1 }}>
                <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 24 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
                    <View style={styles.hero}>
                        <AppText style={[styles.heroTitle, { color: textMain }]}>Register Visitor</AppText>
                        <AppText style={[styles.heroSubtitle, { color: textMuted }]}>Submit details for approval</AppText>
                    </View>

                    <View style={styles.formContainer}>
                        <AppText style={styles.label}>VISITOR NAME *</AppText>
                        <TextInput style={[styles.inputBox, { backgroundColor: inputBg, borderColor: inputBorder, color: textMain }]} value={visitorName} onChangeText={setVisitorName} placeholder="Enter visitor's full name" placeholderTextColor={textMuted} />

                        <AppText style={styles.label}>VISITOR PHONE *</AppText>
                        <TextInput style={[styles.inputBox, { backgroundColor: inputBg, borderColor: inputBorder, color: textMain }]} value={visitorPhone} onChangeText={setVisitorPhone} placeholder="10-digit mobile number" placeholderTextColor={textMuted} keyboardType="phone-pad" maxLength={10} />

                        <AppText style={styles.label}>RELATION (OPTIONAL)</AppText>
                        <TextInput style={[styles.inputBox, { backgroundColor: inputBg, borderColor: inputBorder, color: textMain }]} value={visitorRelation} onChangeText={setVisitorRelation} placeholder="e.g., Father, Mother, Friend" placeholderTextColor={textMuted} />

                        <AppText style={styles.label}>PURPOSE OF VISIT *</AppText>
                        <TextInput style={[styles.inputBox, styles.textArea, { backgroundColor: inputBg, borderColor: inputBorder, color: textMain }]} value={purpose} onChangeText={setPurpose} placeholder="Describe the purpose of visit" placeholderTextColor={textMuted} multiline numberOfLines={4} textAlignVertical="top" />

                        <AppText style={styles.label}>EXPECTED DATE *</AppText>
                        <Pressable style={[styles.dateButton, { backgroundColor: inputBg, borderColor: inputBorder }]} onPress={() => setShowDatePicker(true)}>
                            <MaterialCommunityIcons name="calendar" size={20} color={textMuted} />
                            <AppText style={[styles.dateButtonText, { color: textMain }]}>{formatDate(expectedDate)}</AppText>
                        </Pressable>
                        {showDatePicker && <DateTimePicker value={expectedDate} mode="date" display="default" onChange={(event, date) => { setShowDatePicker(false); if (date) setExpectedDate(date); }} minimumDate={new Date()} />}

                        <View style={styles.timeRow}>
                            <View style={styles.timeGroup}>
                                <AppText style={styles.label}>TIME IN</AppText>
                                <Pressable style={[styles.dateButton, { backgroundColor: inputBg, borderColor: inputBorder }]} onPress={() => setShowTimeInPicker(true)}>
                                    <MaterialCommunityIcons name="clock-outline" size={20} color={textMuted} />
                                    <AppText style={[styles.dateButtonText, { color: textMain }]}>{formatTime(expectedTimeIn)}</AppText>
                                </Pressable>
                                {showTimeInPicker && <DateTimePicker value={expectedTimeIn} mode="time" display="default" onChange={(event, date) => { setShowTimeInPicker(false); if (date) setExpectedTimeIn(date); }} />}
                            </View>

                            <View style={styles.timeGroup}>
                                <AppText style={styles.label}>TIME OUT</AppText>
                                <Pressable style={[styles.dateButton, { backgroundColor: inputBg, borderColor: inputBorder }]} onPress={() => setShowTimeOutPicker(true)}>
                                    <MaterialCommunityIcons name="clock-outline" size={20} color={textMuted} />
                                    <AppText style={[styles.dateButtonText, { color: textMain }]}>{formatTime(expectedTimeOut)}</AppText>
                                </Pressable>
                                {showTimeOutPicker && <DateTimePicker value={expectedTimeOut} mode="time" display="default" onChange={(event, date) => { setShowTimeOutPicker(false); if (date) setExpectedTimeOut(date); }} />}
                            </View>
                        </View>

                        <Pressable style={({ pressed }) => [styles.submitButton, { backgroundColor: primaryBtnBg }, loading && { opacity: 0.7 }, pressed && { opacity: 0.8 }]} onPress={handleSubmit} disabled={loading}>
                            {loading ? <ActivityIndicator color={primaryBtnText} /> : <AppText style={[styles.submitButtonText, { color: primaryBtnText }]}>SUBMIT REQUEST</AppText>}
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerActions: { paddingHorizontal: 24, paddingBottom: 16 },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    hero: { marginBottom: 48 },
    heroTitle: { fontSize: 40, fontWeight: '800', letterSpacing: -1.5, lineHeight: 44, marginBottom: 8 },
    heroSubtitle: { fontSize: 16, fontWeight: '600' },
    content: { flex: 1 },
    formContainer: {},
    label: { fontSize: 11, fontWeight: '700', color: '#666666', letterSpacing: 1.5, marginBottom: 12 },
    inputBox: { borderWidth: 1, borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 24 },
    textArea: { height: 100 },
    dateButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 16, gap: 12, marginBottom: 24 },
    dateButtonText: { fontSize: 16, fontWeight: '500' },
    timeRow: { flexDirection: 'row', gap: 16 },
    timeGroup: { flex: 1 },
    submitButton: { paddingVertical: 18, borderRadius: 100, alignItems: 'center', marginTop: 16 },
    submitButtonText: { fontSize: 16, fontWeight: '800', letterSpacing: 1 },
});
