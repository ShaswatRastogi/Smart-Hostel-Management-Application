import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../context/AlertContext';
import { useRefresh } from '../hooks/useRefresh';
import { roomServices } from '../utils/busTimingsUtils';
import { fetchUserData } from '../utils/nameUtils';
import { requestService, ServiceRequest, subscribeToStudentRequests } from '../utils/serviceUtils';
import { useTheme } from '../utils/ThemeContext';
import AppText from '../components/AppText';

export default function RoomService() {
    const SweepingBroom = () => {
        const broomX = useSharedValue(-50);
        const broomRotate = useSharedValue(0);

        useEffect(() => {
            broomX.value = withRepeat(
                withSequence(
                    withTiming(Dimensions.get('window').width + 50, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
                    withTiming(-50, { duration: 0 }),
                    withTiming(-50, { duration: 7000 })
                ),
                -1,
                false
            );

            broomRotate.value = withRepeat(
                withSequence(
                    withTiming(-20, { duration: 400, easing: Easing.inOut(Easing.ease) }),
                    withTiming(20, { duration: 400, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            );
        }, []);

        const broomStyle = useAnimatedStyle(() => ({
            transform: [{ translateX: broomX.value }, { rotate: `${broomRotate.value}deg` }]
        }));

        return (
            <Animated.View style={[{ position: 'absolute', bottom: -5, left: 0, opacity: 0.15, zIndex: 0 }, broomStyle]} pointerEvents="none">
                <MaterialCommunityIcons name="broom" size={100} color="#EAB308" />
            </Animated.View>
        );
    };

    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { showAlert } = useAlert();
    const { isDark } = useTheme();
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // Dynamic Theme Map
    const themeBg = isDark ? '#000000' : '#F8FAFC';
    const textMain = isDark ? '#FFFFFF' : '#111111';
    const textMuted = isDark ? '#888888' : '#64748B';
    const textSecondary = isDark ? '#CCCCCC' : '#475569';
    const borderSubtle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    const infoBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    const iconBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    const modalBg = isDark ? '#111111' : '#FFFFFF';
    const modalOverlay = isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.4)';
    const primaryBtnBg = isDark ? '#FFFFFF' : '#111111';
    const primaryBtnText = isDark ? '#000000' : '#FFFFFF';
    const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF';
    const inputBorder = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';

    const { refreshing, onRefresh } = useRefresh(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
    });

    useEffect(() => {
        const unsubscribe = subscribeToStudentRequests((data) => {
            setRequests(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedService, setSelectedService] = useState<{ id: string, name: string } | null>(null);
    const [description, setDescription] = useState('');

    const handleServiceRequest = (service: typeof roomServices[0]) => {
        setSelectedService(service);
        setDescription('');
        setModalVisible(true);
    };

    const confirmRequest = async () => {
        if (!selectedService) return;
        try {
            setSubmitting(true);
            const userData = await fetchUserData();
            if (!userData) { showAlert("Error", "Could not fetch user profile.", [], 'error'); return; }
            await requestService(selectedService.name, description, userData.fullName, userData.roomNo);
            setModalVisible(false);
            showAlert('Success', `Your request for ${selectedService.name} has been submitted!`, [], 'success');
        } catch (error) { showAlert('Error', "Failed to submit request.", [], 'error'); } finally { setSubmitting(false); }
    };

    const getStatusColor = (status: string) => {
        switch (status) { case 'pending': return '#F59E0B'; case 'approved': return '#3B82F6'; case 'completed': return '#10B981'; case 'rejected': return '#EF4444'; default: return '#888888'; }
    };

    return (
        <View style={[styles.container, { backgroundColor: themeBg }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={[styles.headerActions, { paddingTop: insets.top + 16 }]}>
                <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]} onPress={() => router.back()}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={textMain} />
                </Pressable>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 80 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={textMain} />} showsVerticalScrollIndicator={false}>
                <View style={[styles.hero, { position: 'relative', overflow: 'hidden' }]}>
                    <AppText style={[styles.heroTitle, { color: textMain, zIndex: 1 }]}>Services</AppText>
                    <AppText style={[styles.heroSubtitle, { color: textMuted, zIndex: 1 }]}>Housekeeping & Maintenance</AppText>
                    <SweepingBroom />
                </View>

                <View style={{ paddingHorizontal: 24 }}>
                    <AppText style={styles.sectionTitle}>AVAILABLE SERVICES</AppText>
                    {submitting && !modalVisible && <ActivityIndicator size="large" color={textMain} style={{ marginBottom: 20 }} />}
                    <View style={styles.servicesGrid}>
                        {roomServices.map((service) => (
                            <Pressable key={service.id} style={({ pressed }) => [styles.serviceRow, { borderColor: borderSubtle }, !service.available && { opacity: 0.5 }, pressed && service.available && { opacity: 0.7 }]} onPress={() => service.available && handleServiceRequest(service)} disabled={!service.available || submitting}>
                                <View style={[styles.serviceIconContainer, { backgroundColor: iconBg, borderColor: borderSubtle }]}>
                                    <MaterialCommunityIcons name={service.icon as any} size={24} color={textMain} />
                                </View>
                                <View style={styles.serviceContent}>
                                    <View style={styles.serviceHeader}>
                                        <AppText style={[styles.serviceName, { color: textMain }]}>{service.name}</AppText>
                                        {!service.available && <View style={[styles.unavailableBadge, { backgroundColor: borderSubtle }]}><AppText style={styles.unavailableText}>SOON</AppText></View>}
                                    </View>
                                    <AppText style={[styles.serviceDescription, { color: textMuted }]}>{service.description}</AppText>
                                </View>
                                {service.available && <MaterialIcons name="arrow-forward" size={20} color={textMuted} />}
                            </Pressable>
                        ))}
                    </View>

                    <AppText style={[styles.sectionTitle, { marginTop: 32 }]}>MY REQUESTS</AppText>
                    {loading ? <ActivityIndicator size="small" color={textMain} /> : requests.length === 0 ? (
                        <View style={styles.emptyState}><AppText style={styles.emptyText}>No active requests</AppText></View>
                    ) : (
                        <View style={styles.historyList}>
                            {requests.map(req => (
                                <View key={req.id} style={[styles.historyRow, { borderColor: borderSubtle }]}>
                                    <View style={{ flex: 1 }}>
                                        <AppText style={[styles.historyTitle, { color: textMain }]}>{req.serviceType}</AppText>
                                        {req.description ? <AppText style={[styles.historyDesc, { color: textSecondary }]}>"{req.description}"</AppText> : null}
                                        <View style={styles.historyFooter}>
                                            <AppText style={styles.historyDate}>{req.createdAt instanceof Date ? req.createdAt.toLocaleDateString() : ''}</AppText>
                                            {req.estimatedTime && <><MaterialCommunityIcons name="circle-small" size={16} color="#666666" /><AppText style={[styles.etaText, { color: textMain }]}>ETA: {req.estimatedTime}</AppText></>}
                                        </View>
                                    </View>
                                    <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                                        <AppText style={[styles.statusText, { color: getStatusColor(req.status) }]}>{req.status.toUpperCase()}</AppText>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    <View style={[styles.infoCard, { backgroundColor: infoBg, borderColor: borderSubtle }]}>
                        <View style={styles.infoContent}>
                            <AppText style={[styles.infoTitle, { color: textMain }]}>URGENT ASSISTANCE</AppText>
                            <AppText style={[styles.infoText, { color: textMuted }]}>For emergencies, call hostel office directly at +91 98765 43210</AppText>
                        </View>
                        <MaterialCommunityIcons name="phone-in-talk" size={24} color={textMain} />
                    </View>
                </View>
            </ScrollView>

            <Modal transparent animationType="fade" visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <BlurView intensity={isDark ? 40 : 60} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.3)' }]}>
                    <View style={[styles.modalContainer, { backgroundColor: modalBg, borderColor: borderSubtle }]}>
                        <AppText style={[styles.modalTitle, { color: textMain }]}>Request {selectedService?.name}</AppText>
                        <AppText style={[styles.modalSubtitle, { color: textMuted }]}>Add a description (optional)</AppText>
                        <TextInput style={[styles.inputBox, { backgroundColor: inputBg, borderColor: inputBorder, color: textMain }]} placeholder="e.g. Tap is leaking, light bulb fused..." placeholderTextColor={textMuted} value={description} onChangeText={setDescription} multiline textAlignVertical="top" autoFocus blurOnSubmit={true} />
                        <View style={styles.modalButtons}>
                            <Pressable style={[styles.modalBtn, styles.cancelBtn, { borderColor: inputBorder }]} onPress={() => setModalVisible(false)}>
                                <AppText style={[styles.cancelText, { color: textMain }]}>CANCEL</AppText>
                            </Pressable>
                            <Pressable style={[styles.modalBtn, { backgroundColor: primaryBtnBg, borderColor: primaryBtnBg }, submitting && { opacity: 0.7 }]} onPress={confirmRequest} disabled={submitting}>
                                {submitting ? <ActivityIndicator color={primaryBtnText} size="small" /> : <AppText style={[styles.confirmText, { color: primaryBtnText }]}>SUBMIT</AppText>}
                            </Pressable>
                        </View>
                    </View>
                </KeyboardAvoidingView>
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
    sectionTitle: { fontSize: 11, fontWeight: '700', color: '#666666', letterSpacing: 1.5, marginBottom: 24 },
    servicesGrid: {},
    serviceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, gap: 16 },
    serviceIconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    serviceContent: { flex: 1 },
    serviceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    serviceName: { fontSize: 16, fontWeight: '700' },
    serviceDescription: { fontSize: 13, lineHeight: 18 },
    unavailableBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    unavailableText: { color: '#888888', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    historyList: {},
    historyRow: { flexDirection: 'row', paddingVertical: 20, borderBottomWidth: 1, justifyContent: 'space-between' },
    historyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    historyDesc: { fontSize: 14, fontStyle: 'italic', marginBottom: 8 },
    historyFooter: { flexDirection: 'row', alignItems: 'center' },
    historyDate: { fontSize: 12, color: '#666666', fontWeight: '600' },
    etaText: { fontSize: 12, fontWeight: '700' },
    statusText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
    emptyState: { alignItems: 'flex-start', paddingTop: 8 },
    emptyText: { color: '#666666', fontStyle: 'italic', fontSize: 14 },
    infoCard: { flexDirection: 'row', alignItems: 'center', padding: 24, borderRadius: 16, borderWidth: 1, marginTop: 48, justifyContent: 'space-between' },
    infoContent: { flex: 1, paddingRight: 16 },
    infoTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
    infoText: { fontSize: 13, lineHeight: 20 },
    modalOverlay: { flex: 1, justifyContent: 'center', padding: 24 },
    modalContainer: { padding: 24, borderRadius: 24, borderWidth: 1 },
    modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
    modalSubtitle: { fontSize: 14, marginBottom: 24 },
    inputBox: { borderWidth: 1, borderRadius: 12, padding: 16, fontSize: 16, minHeight: 120, marginBottom: 32 },
    modalButtons: { flexDirection: 'row', gap: 12 },
    modalBtn: { flex: 1, padding: 18, borderRadius: 100, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    cancelBtn: { backgroundColor: 'transparent' },
    cancelText: { fontSize: 14, fontWeight: '800', letterSpacing: 1 },
    confirmText: { fontSize: 14, fontWeight: '800', letterSpacing: 1 }
});