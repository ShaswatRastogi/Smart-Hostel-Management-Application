import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View, Modal, TouchableOpacity, KeyboardAvoidingView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, Easing, withRepeat, runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../context/AlertContext';
import { useRefresh } from '../hooks/useRefresh';
import { createLeaveRequest, getStudentLeaves, LeaveRequest } from '../utils/leavesUtils';
import { fetchUserData } from '../utils/nameUtils';
import { formatUniversalTime } from '../utils/timeUtils';
import { useTheme } from '../utils/ThemeContext';
import AppText from '../components/AppText';
import QRCode from 'react-native-qrcode-svg';

export default function LeaveRequestPage() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { showAlert } = useAlert();
    const { isDark } = useTheme();

    const [reason, setReason] = useState('');
    const [category, setCategory] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<LeaveRequest[]>([]);
    
    const [qrModalVisible, setQrModalVisible] = useState(false);
    const [selectedQrCode, setSelectedQrCode] = useState<string | null>(null);

    // Dynamic Theme Map
    const themeBg = isDark ? '#000000' : '#F8FAFC';
    const textMain = isDark ? '#FFFFFF' : '#111111';
    const textMuted = isDark ? '#888888' : '#64748B';
    const textSecondary = isDark ? '#CCCCCC' : '#475569';
    const borderSubtle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF';
    const inputBorder = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
    const primaryBtnBg = isDark ? '#FFFFFF' : '#111111';
    const primaryBtnText = isDark ? '#000000' : '#FFFFFF';
    const modalBg = isDark ? '#111111' : '#FFFFFF';
    const modalOverlay = isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.4)';
    const qrBg = '#FFFFFF';
    const passBoxBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    const AnimatedDate = ({ date, textMainStyle }: { date: Date, textMainStyle: any }) => {
        const flip = useSharedValue(0);
        const [displayDate, setDisplayDate] = useState(date);

        useEffect(() => {
            if (date.getTime() !== displayDate.getTime()) {
                flip.value = withSequence(
                    withTiming(90, { duration: 150, easing: Easing.in(Easing.ease) }),
                    withTiming(0, { duration: 0 }, () => {
                        runOnJS(setDisplayDate)(date);
                    }),
                    withTiming(-90, { duration: 0 }),
                    withTiming(0, { duration: 150, easing: Easing.out(Easing.ease) })
                );
            }
        }, [date]);

        const rStyle = useAnimatedStyle(() => ({ transform: [{ rotateX: `${flip.value}deg` }] }));

        return (
            <Animated.View style={rStyle}>
                <AppText style={[styles.inputText, textMainStyle]}>
                    {formatUniversalTime(displayDate, { day: 'numeric', month: 'short', year: 'numeric' })}
                </AppText>
            </Animated.View>
        );
    };

    const PackingSuitcase = ({ isComplete, isSubmitting }: { isComplete: boolean, isSubmitting: boolean }) => {
        const shake = useSharedValue(0);
        useEffect(() => {
            if (isSubmitting) {
                shake.value = withRepeat(withSequence(withTiming(-10, {duration: 50}), withTiming(10, {duration: 50})), 10, true, () => {
                    shake.value = withTiming(0);
                });
            }
        }, [isSubmitting]);
        const rStyle = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${shake.value}deg` }] }));
        
        return (
            <View style={{ position: 'absolute', right: 24, top: 0 }} pointerEvents="none">
                <Animated.View style={[{ width: 80, height: 80, justifyContent: 'center', alignItems: 'center' }, rStyle]}>
                    <MaterialCommunityIcons name={isSubmitting ? "bag-suitcase" : (isComplete ? "bag-personal" : "bag-suitcase-outline")} size={80} color="#3B82F6" />
                    {isSubmitting && <Animated.View><MaterialCommunityIcons name="lock" size={24} color="#F59E0B" style={{ position: 'absolute', bottom: -5, right: -5 }} /></Animated.View>}
                </Animated.View>
            </View>
        );
    };

    const { refreshing, onRefresh } = useRefresh(async () => {
        await loadHistory();
    }, () => { setReason(''); setCategory(''); setStartDate(new Date()); setEndDate(new Date()); });

    useEffect(() => { loadHistory(); }, []);

    const loadHistory = async () => {
        try {
            const user = await fetchUserData();
            if (user && user.email) {
                const leaves = await getStudentLeaves(user.email);
                setHistory(leaves);
            }
        } catch (error) { console.error(error); }
    };

    const handleSubmit = async () => {
        if (!reason.trim()) return showAlert('Error', 'Please provide a reason for your leave.', [], 'error');
        if (endDate < startDate) return showAlert('Error', 'End date cannot be before start date.', [], 'error');

        setLoading(true);
        try {
            const user = await fetchUserData();
            if (!user) throw new Error("User not found");
            const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            await createLeaveRequest({ studentName: user.fullName, studentRoom: user.roomNo || 'N/A', studentEmail: user.email || '', startDate: startDate.toISOString().split('T')[0], endDate: endDate.toISOString().split('T')[0], category: category, reason: reason, days: diffDays });
            showAlert('Success', 'Leave request submitted successfully!', [], 'success');
            setReason(''); setCategory(''); loadHistory();
        } catch (error) { showAlert('Error', 'Failed to submit leave request. Please try again.', [], 'error'); } finally { setLoading(false); }
    };

    const onChangeStart = (event: any, selectedDate?: Date) => { setShowStartPicker(Platform.OS === 'ios'); if (selectedDate) setStartDate(selectedDate); };
    const onChangeEnd = (event: any, selectedDate?: Date) => { setShowEndPicker(Platform.OS === 'ios'); if (selectedDate) setEndDate(selectedDate); };

    const getStatusColor = (status: string) => { switch (status) { case 'approved': return '#10B981'; case 'rejected': return '#EF4444'; default: return '#F59E0B'; } };

    return (
        <View style={[styles.container, { backgroundColor: themeBg }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={[styles.headerActions, { paddingTop: insets.top + 16 }]}>
                <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]} onPress={() => router.back()}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={textMain} />
                </Pressable>
            </View>

            <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={textMain} />}>
                    <View style={[styles.hero, { position: 'relative' }]}>
                        <AppText style={[styles.heroTitle, { color: textMain }]}>Apply Leave</AppText>
                        <AppText style={[styles.heroSubtitle, { color: textMuted }]}>Request time off</AppText>
                        <PackingSuitcase isComplete={reason.length > 5 && category.length > 2} isSubmitting={loading} />
                    </View>

                    <View style={{ paddingHorizontal: 24 }}>
                        <View style={styles.section}>
                            <AppText style={styles.sectionTitle}>NEW REQUEST</AppText>

                            <View style={styles.dateRow}>
                                <View style={styles.dateField}>
                                    <AppText style={styles.label}>FROM DATE</AppText>
                                    <Pressable onPress={() => setShowStartPicker(true)} style={[styles.inputBox, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                                        <MaterialCommunityIcons name="calendar" size={20} color={textMuted} />
                                        <AnimatedDate date={startDate} textMainStyle={{ color: textMain }} />
                                    </Pressable>
                                    {showStartPicker && <DateTimePicker value={startDate} mode="date" display="default" onChange={onChangeStart} minimumDate={new Date()} />}
                                </View>

                                <View style={styles.dateField}>
                                    <AppText style={styles.label}>TO DATE</AppText>
                                    <Pressable onPress={() => setShowEndPicker(true)} style={[styles.inputBox, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                                        <MaterialCommunityIcons name="calendar" size={20} color={textMuted} />
                                        <AnimatedDate date={endDate} textMainStyle={{ color: textMain }} />
                                    </Pressable>
                                    {showEndPicker && <DateTimePicker value={endDate} mode="date" display="default" onChange={onChangeEnd} minimumDate={startDate} />}
                                </View>
                            </View>

                            <AppText style={styles.label}>GOING TO</AppText>
                            <TextInput style={[styles.inputBox, styles.textInput, { backgroundColor: inputBg, borderColor: inputBorder, color: textMain }]} placeholder="e.g. Home, Market, Hospital..." placeholderTextColor={textMuted} value={category} onChangeText={setCategory} />

                            <AppText style={styles.label}>REASON</AppText>
                            <TextInput style={[styles.inputBox, styles.textArea, { backgroundColor: inputBg, borderColor: inputBorder, color: textMain }]} placeholder="e.g. Visiting home for festival..." placeholderTextColor={textMuted} multiline numberOfLines={3} value={reason} onChangeText={setReason} textAlignVertical="top" />

                            <Pressable style={({ pressed }) => [styles.submitBtn, { backgroundColor: primaryBtnBg }, loading && { opacity: 0.7 }, pressed && { opacity: 0.8 }]} onPress={handleSubmit} disabled={loading}>
                                {loading ? <AppText style={[styles.btnText, { color: primaryBtnText }]}>SUBMITTING...</AppText> : <AppText style={[styles.btnText, { color: primaryBtnText }]}>SUBMIT REQUEST</AppText>}
                            </Pressable>
                        </View>

                        <AppText style={[styles.sectionTitle, { marginTop: 40 }]}>PAST REQUESTS</AppText>
                        {history.length === 0 ? (
                            <View style={styles.emptyState}><AppText style={styles.emptyText}>No leave history found</AppText></View>
                        ) : (
                            <View style={styles.historyList}>
                                {history.map((item) => (
                                    <View key={item.id} style={[styles.historyRow, { borderColor: borderSubtle }]}>
                                        <View style={{ flex: 1 }}>
                                            <View style={styles.dateInfo}>
                                                <AppText style={[styles.historyDate, { color: textMain }]}>{formatUniversalTime(item.startDate, { day: 'numeric', month: 'short', year: 'numeric' })}</AppText>
                                                <MaterialCommunityIcons name="arrow-right" size={16} color={textMuted} />
                                                <AppText style={[styles.historyDate, { color: textMain }]}>{formatUniversalTime(item.endDate, { day: 'numeric', month: 'short', year: 'numeric' })}</AppText>
                                            </View>
                                            <AppText style={styles.historyCategory}>{item.category || 'General'}</AppText>
                                            <AppText style={[styles.historyReason, { color: textSecondary }]}>{item.reason}</AppText>
                                            <AppText style={styles.durationText}>{item.days} days</AppText>
                                        </View>
                                        <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
                                            <AppText style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status.toUpperCase()}</AppText>
                                            {item.status === 'approved' && item.qrCode && (
                                                <TouchableOpacity style={[styles.qrBtn, { backgroundColor: primaryBtnBg }]} onPress={() => { setSelectedQrCode(item.qrCode || null); setQrModalVisible(true); }}>
                                                    <MaterialCommunityIcons name="qrcode-scan" size={16} color={primaryBtnText} />
                                                    <AppText style={[styles.qrBtnText, { color: primaryBtnText }]}>Show Pass</AppText>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <Modal visible={qrModalVisible} transparent={true} animationType="fade" onRequestClose={() => setQrModalVisible(false)}>
                <View style={[styles.modalOverlay, { backgroundColor: modalOverlay }]}>
                    <View style={[styles.modalContent, { backgroundColor: modalBg, borderColor: borderSubtle }]}>
                        <View style={styles.modalHeader}>
                            <AppText style={[styles.modalTitle, { color: textMain }]}>Gate Pass</AppText>
                            <TouchableOpacity onPress={() => setQrModalVisible(false)} style={styles.closeBtn}>
                                <MaterialIcons name="close" size={24} color={textMuted} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.qrContainer}>
                            {selectedQrCode && (
                                <View style={[styles.qrWrapper, { backgroundColor: qrBg }]}>
                                    <QRCode value={selectedQrCode} size={180} />
                                    <AppText style={styles.qrVerifiedText}>VERIFIED PASS</AppText>
                                </View>
                            )}
                            {selectedQrCode && (
                                <View style={[styles.passCodeWrapper, { backgroundColor: passBoxBg, borderColor: borderSubtle }]}>
                                    <AppText style={styles.passCodeLabel}>PASS CODE</AppText>
                                    <AppText style={[styles.passCodeText, { color: textMain }]} selectable>{selectedQrCode}</AppText>
                                </View>
                            )}
                            <AppText style={styles.qrHint}>Show this QR code to the Guard at the Main Gate to log your movement.</AppText>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerActions: { paddingHorizontal: 24, paddingBottom: 16 },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    hero: { paddingHorizontal: 24, marginBottom: 48 },
    heroTitle: { fontSize: 40, fontWeight: '800', letterSpacing: -1.5, lineHeight: 44, marginBottom: 8 },
    heroSubtitle: { fontSize: 16, fontWeight: '600' },
    content: { paddingBottom: 80 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 11, fontWeight: '700', color: '#666666', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 24 },
    dateRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
    dateField: { flex: 1 },
    label: { fontSize: 11, fontWeight: '700', color: '#666666', letterSpacing: 1.5, marginBottom: 12 },
    inputBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 16, gap: 12 },
    textInput: { fontSize: 16, marginBottom: 24 },
    inputText: { fontSize: 16, fontWeight: '500' },
    textArea: { height: 100, fontSize: 16, marginBottom: 32 },
    submitBtn: { paddingVertical: 18, borderRadius: 100, alignItems: 'center' },
    btnText: { fontSize: 16, fontWeight: '800', letterSpacing: 1 },
    historyList: { marginTop: 16 },
    historyRow: { flexDirection: 'row', paddingVertical: 24, borderBottomWidth: 1, justifyContent: 'space-between' },
    dateInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    historyDate: { fontSize: 14, fontWeight: '700' },
    historyCategory: { fontSize: 12, color: '#888888', fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
    historyReason: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
    durationText: { fontSize: 12, color: '#666666', fontWeight: '600' },
    statusText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    qrBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 100, gap: 6 },
    qrBtnText: { fontSize: 12, fontWeight: '800' },
    emptyState: { alignItems: 'flex-start', paddingTop: 16 },
    emptyText: { color: '#666666', fontStyle: 'italic', fontSize: 14 },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalContent: { width: '100%', borderRadius: 24, padding: 24, borderWidth: 1 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
    modalTitle: { fontSize: 20, fontWeight: '800' },
    closeBtn: { padding: 4 },
    qrContainer: { alignItems: 'center' },
    qrWrapper: { padding: 24, borderRadius: 16, marginBottom: 24, alignItems: 'center' },
    qrVerifiedText: { color: '#000000', fontSize: 13, fontWeight: '800', marginTop: 16, letterSpacing: 1 },
    passCodeWrapper: { borderRadius: 12, padding: 16, width: '100%', marginBottom: 24, borderWidth: 1 },
    passCodeLabel: { color: '#888888', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
    passCodeText: { fontSize: 16, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    qrHint: { textAlign: 'center', fontSize: 13, color: '#888888', lineHeight: 20 },
});
