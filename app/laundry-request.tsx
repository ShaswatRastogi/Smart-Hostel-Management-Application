import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../context/AlertContext';
import { useRefresh } from '../hooks/useRefresh';
import { fetchLaundrySettings, LaundryRequestDisplay, LaundrySettings, subscribeToLaundry, subscribeToMyLaundryRequests } from '../utils/laundrySyncUtils';
import { fetchUserData, StudentData } from '../utils/nameUtils';
import { formatUniversalTime } from '../utils/timeUtils';
import { useTheme } from '../utils/ThemeContext';
import AppText from '../components/AppText';

export default function LaundryRequest() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { showAlert } = useAlert();
    const { isDark } = useTheme();
    const [student, setStudent] = useState<StudentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [settings, setSettings] = useState<LaundrySettings | null>(null);
    const [history, setHistory] = useState<LaundryRequestDisplay[]>([]);
    const [clothesDetails, setClothesDetails] = useState('');
    const [totalClothes, setTotalClothes] = useState('');

    // Dynamic Theme Map
    const themeBg = isDark ? '#000000' : '#F8FAFC';
    const textMain = isDark ? '#FFFFFF' : '#111111';
    const textMuted = isDark ? '#888888' : '#64748B';
    const textSecondary = isDark ? '#CCCCCC' : '#475569';
    const borderSubtle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    const infoBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    const primaryBtnBg = isDark ? '#FFFFFF' : '#111111';
    const primaryBtnText = isDark ? '#000000' : '#FFFFFF';
    const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF';
    const inputBorder = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';

    const { refreshing, onRefresh } = useRefresh(async () => {
        await Promise.all([loadUserData(), fetchLaundrySettings().then(setSettings)]);
    }, () => { setClothesDetails(''); setTotalClothes(''); });

    useEffect(() => {
        loadUserData();
        const unsubSettings = subscribeToLaundry(setSettings);
        const unsubHistory = subscribeToMyLaundryRequests(setHistory);
        return () => { unsubSettings(); unsubHistory(); };
    }, []);

    const loadUserData = async () => {
        try { const data = await fetchUserData(); setStudent(data); } catch (error) {} finally { setLoading(false); }
    };

    const handleSubmit = async () => {
        if (!clothesDetails.trim()) return showAlert('Missing Details', 'Please describe the clothes you are sending.', [], 'error');
        if (!totalClothes.trim() || isNaN(Number(totalClothes))) return showAlert('Invalid Count', 'Please enter a valid total number of clothes.', [], 'error');

        setSubmitting(true);
        try {
            const { default: api } = await import('../utils/api');
            await api.post('/services/laundry', { pickupDate: new Date().toISOString(), itemsCount: Number(totalClothes), notes: clothesDetails });
            showAlert('Success', 'Your laundry request has been submitted!', [{ text: 'OK' }], 'success');
            setClothesDetails(''); setTotalClothes('');
        } catch (error) { showAlert('Error', 'Failed to submit request. Please try again.', [], 'error'); } finally { setSubmitting(false); }
    };

    if (loading) return (
        <View style={[styles.loadingContainer, { backgroundColor: themeBg }]}>
            <ActivityIndicator size="large" color={textMain} />
            <AppText style={[styles.loadingText, { color: textMuted }]}>Loading Profile...</AppText>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: themeBg }]}>
            <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20} style={{ flex: 1 }}>
                <View style={[styles.headerActions, { paddingTop: insets.top + 16 }]}>
                    <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]} onPress={() => router.back()}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={textMain} />
                    </Pressable>
                </View>

                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, paddingBottom: 80, paddingHorizontal: 24 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={textMain} />} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
                    <View style={styles.hero}>
                        <AppText style={[styles.heroTitle, { color: textMain }]}>Laundry</AppText>
                        <AppText style={[styles.heroSubtitle, { color: textMuted }]}>Request Pickup</AppText>
                    </View>

                    <View style={styles.section}>
                        <AppText style={styles.sectionTitle}>STUDENT INFO</AppText>
                        <View style={[styles.infoRow, { borderColor: borderSubtle }]}><AppText style={styles.infoLabel}>Name</AppText><AppText style={[styles.infoValue, { color: textMain }]}>{student?.fullName || '--'}</AppText></View>
                        <View style={[styles.infoRow, { borderColor: borderSubtle }]}><AppText style={styles.infoLabel}>Room Number</AppText><AppText style={[styles.infoValue, { color: textMain }]}>{student?.roomNo || '--'}</AppText></View>
                    </View>

                    {settings && (
                        <View style={styles.section}>
                            <AppText style={styles.sectionTitle}>SERVICE STATUS</AppText>
                            <View style={[styles.infoRow, { borderColor: borderSubtle }]}><AppText style={styles.infoLabel}>Current Status</AppText><AppText style={[styles.infoValue, { color: settings.status === 'On Schedule' ? '#10B981' : settings.status === 'Delayed' ? '#F59E0B' : settings.status === 'No Service' ? '#EF4444' : '#6366F1' }]}>{settings.status}</AppText></View>
                            <View style={[styles.infoRow, { borderColor: borderSubtle }]}><AppText style={styles.infoLabel}>Next Pickup</AppText><AppText style={[styles.infoValue, { color: textMain }]}>{settings.pickupDay}, {settings.pickupTime} {settings.pickupPeriod}</AppText></View>
                            <View style={[styles.infoRow, { borderColor: borderSubtle }]}><AppText style={styles.infoLabel}>Next Drop-off</AppText><AppText style={[styles.infoValue, { color: textMain }]}>{settings.dropoffDay}, {settings.dropoffTime} {settings.dropoffPeriod}</AppText></View>
                            {settings.message ? (
                                <View style={[styles.messageBox, { backgroundColor: infoBg }]}><MaterialCommunityIcons name="information-outline" size={16} color={textMain} /><AppText style={[styles.messageText, { color: textSecondary }]}>"{settings.message}"</AppText></View>
                            ) : null}
                        </View>
                    )}

                    <View style={styles.section}>
                        <AppText style={styles.sectionTitle}>REQUEST DETAILS</AppText>
                        <View style={styles.inputGroup}>
                            <AppText style={styles.label}>Clothes Details</AppText>
                            <TextInput style={[styles.input, styles.textArea, { backgroundColor: inputBg, borderColor: inputBorder, color: textMain }]} placeholder="E.g., 2 Shirts, 1 Jeans, 1 Towel..." placeholderTextColor={textMuted} multiline textAlignVertical="top" value={clothesDetails} onChangeText={setClothesDetails} />
                        </View>
                        <View style={styles.inputGroup}>
                            <AppText style={styles.label}>Total Count</AppText>
                            <TextInput style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textMain }]} placeholder="e.g. 5" placeholderTextColor={textMuted} keyboardType="numeric" value={totalClothes} onChangeText={setTotalClothes} />
                        </View>
                    </View>

                    <Pressable onPress={handleSubmit} style={({ pressed }) => [styles.submitButton, { backgroundColor: primaryBtnBg }, submitting && { opacity: 0.7 }, pressed && { opacity: 0.8 }]} disabled={submitting}>
                        {submitting ? <ActivityIndicator color={primaryBtnText} /> : <AppText style={[styles.buttonText, { color: primaryBtnText }]}>SUBMIT REQUEST</AppText>}
                    </Pressable>

                    <View style={styles.section}>
                        <AppText style={[styles.sectionTitle, { marginTop: 16 }]}>RECENT ACTIVITY</AppText>
                        {history.length === 0 ? <AppText style={styles.emptyText}>No recent requests found</AppText> : (
                            history.slice(0, 3).map((req, index) => (
                                <View key={index} style={[styles.historyRow, { borderColor: borderSubtle }]}>
                                    <View style={{ flex: 1, paddingRight: 16 }}>
                                        <AppText style={styles.historyDate}>{formatUniversalTime(req.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}</AppText>
                                        <AppText style={[styles.historyDetails, { color: textMain }]}>{req.clothesDetails}</AppText>
                                        <AppText style={styles.historyTotal}>{req.totalClothes} Items</AppText>
                                    </View>
                                    {(() => {
                                        const statusConfig = { pending: { label: 'Requested', color: '#6366F1' }, processing: { label: 'Processing', color: '#F59E0B' }, ready: { label: 'Ready', color: '#10B981' }, completed: { label: 'Delivered', color: '#10B981' }, rejected: { label: 'Rejected', color: '#EF4444' } };
                                        const config = statusConfig[req.status as keyof typeof statusConfig] || statusConfig.pending;
                                        return <AppText style={[styles.statusText, { color: config.color }]}>{config.label}</AppText>;
                                    })()}
                                </View>
                            ))
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12 },
    headerActions: { paddingHorizontal: 24, paddingBottom: 16 },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    hero: { marginBottom: 48 },
    heroTitle: { fontSize: 40, fontWeight: '800', letterSpacing: -1.5, lineHeight: 44, marginBottom: 8 },
    heroSubtitle: { fontSize: 16, fontWeight: '600' },
    section: { marginBottom: 48 },
    sectionTitle: { fontSize: 11, fontWeight: '700', color: '#666666', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1 },
    infoLabel: { fontSize: 14, fontWeight: '600', color: '#888888', flex: 1, paddingRight: 16 },
    infoValue: { fontSize: 14, fontWeight: '600', flex: 1, textAlign: 'right' },
    messageBox: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16, padding: 16, borderRadius: 12 },
    messageText: { fontSize: 13, flex: 1, lineHeight: 20 },
    inputGroup: { marginBottom: 24 },
    label: { fontSize: 12, fontWeight: '700', color: '#888888', marginBottom: 8, letterSpacing: 1 },
    input: { borderWidth: 1, borderRadius: 12, padding: 16, fontSize: 16 },
    textArea: { height: 120 },
    submitButton: { paddingVertical: 18, borderRadius: 100, alignItems: 'center', marginBottom: 48 },
    buttonText: { fontSize: 16, fontWeight: '800', letterSpacing: 1 },
    emptyText: { color: '#888888', fontStyle: 'italic', fontSize: 14 },
    historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 16, borderBottomWidth: 1 },
    historyDate: { fontWeight: '700', fontSize: 12, color: '#888888', marginBottom: 4 },
    historyDetails: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
    historyTotal: { fontSize: 12, color: '#666666', fontWeight: '600' },
    statusText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
});
