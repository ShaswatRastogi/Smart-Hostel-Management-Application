import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../context/AlertContext';
import { useRefresh } from '../hooks/useRefresh';
import { fetchLaundrySettings, LaundryRequestDisplay, LaundrySettings, subscribeToLaundry, subscribeToMyLaundryRequests } from '../utils/laundrySyncUtils';
import { fetchUserData, StudentData } from '../utils/nameUtils';
import { useTheme } from '../utils/ThemeContext';
import { formatUniversalTime } from '../utils/timeUtils';
import AppText from '../components/AppText';

export default function LaundryRequest() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const { showAlert } = useAlert();
    const [student, setStudent] = useState<StudentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [settings, setSettings] = useState<LaundrySettings | null>(null);
    const [history, setHistory] = useState<LaundryRequestDisplay[]>([]);

    // Form State
    const [clothesDetails, setClothesDetails] = useState('');
    const [totalClothes, setTotalClothes] = useState('');

    const { refreshing, onRefresh } = useRefresh(async () => {
        await Promise.all([loadUserData(), fetchLaundrySettings().then(setSettings)]);
    }, () => {
        setClothesDetails('');
        setTotalClothes('');
    });

    useEffect(() => {
        loadUserData();
        const unsubSettings = subscribeToLaundry(setSettings);
        const unsubHistory = subscribeToMyLaundryRequests(setHistory);
        return () => {
            unsubSettings();
            unsubHistory();
        };
    }, []);

    const loadUserData = async () => {
        try {
            const data = await fetchUserData();
            setStudent(data);
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!clothesDetails.trim()) {
            showAlert('Missing Details', 'Please describe the clothes you are sending.', [], 'error');
            return;
        }
        if (!totalClothes.trim() || isNaN(Number(totalClothes))) {
            showAlert('Invalid Count', 'Please enter a valid total number of clothes.', [], 'error');
            return;
        }

        setSubmitting(true);
        try {
            const { default: api } = await import('../utils/api');
            await api.post('/services/laundry', {
                pickupDate: new Date().toISOString(), // Defaulting to now for pickup request
                itemsCount: Number(totalClothes),
                notes: clothesDetails
            });

            showAlert('Success', 'Your laundry request has been submitted!', [
                { text: 'OK' }
            ], 'success');
            setClothesDetails('');
            setTotalClothes('');
        } catch (error) {
            console.error(error);
            showAlert('Error', 'Failed to submit request. Please try again.', [], 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <AppText style={[styles.loadingText, { color: colors.textSecondary }]}>Loading Profile...</AppText>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <View style={{ flex: 1 }}>
                    <LinearGradient
                        colors={['#000428', '#004e92']}
                        style={[styles.headerGradient, { zIndex: 10, elevation: 5 }]}
                    >
                        <SafeAreaView edges={['top']} style={styles.safeArea}>
                            <View style={styles.header}>
                                <Pressable onPress={() => router.back()} style={styles.backButton}>
                                    <Ionicons name="arrow-back" size={24} color="#fff" />
                                </Pressable>
                                <AppText style={styles.headerTitle}>Laundry Request</AppText>
                                <View style={{ width: 40 }} />
                            </View>
                        </SafeAreaView>
                    </LinearGradient>
                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#fff" : colors.primary} colors={[colors.primary]} />}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                    >
                        <View style={{ padding: 24 }}>

                            {/* Student Info Card */}
                            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <View style={styles.infoRow}>
                                    <View style={[styles.iconBox, { backgroundColor: isDark ? '#172554' : '#EFF6FF' }]}>
                                        <MaterialCommunityIcons name="account-circle-outline" size={24} color={isDark ? '#60A5FA' : '#3B82F6'} />
                                    </View>
                                    <View>
                                        <AppText style={[styles.infoLabel, { color: colors.textSecondary }]}>Student Name</AppText>
                                        <AppText style={[styles.infoValue, { color: colors.text }]}>{student?.fullName || '--'}</AppText>
                                    </View>
                                </View>
                                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                                <View style={styles.infoRow}>
                                    <View style={[styles.iconBox, { backgroundColor: isDark ? '#172554' : '#EFF6FF' }]}>
                                        <MaterialCommunityIcons name="door-open" size={24} color={isDark ? '#60A5FA' : '#3B82F6'} />
                                    </View>
                                    <View>
                                        <AppText style={[styles.infoLabel, { color: colors.textSecondary }]}>Room Number</AppText>
                                        <AppText style={[styles.infoValue, { color: colors.text }]}>{student?.roomNo || '--'}</AppText>
                                    </View>
                                </View>
                            </View>

                            {/* Laundry Settings Info Card */}
                            {settings && (
                                <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                    <View style={styles.headerRow}>
                                        <View style={[styles.iconBox, { backgroundColor: isDark ? '#172554' : '#EFF6FF' }]}>
                                            <MaterialCommunityIcons name="washing-machine" size={24} color={isDark ? '#60A5FA' : '#3B82F6'} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <AppText style={[styles.infoLabel, { color: colors.textSecondary }]}>Service Status</AppText>
                                            <AppText style={[styles.infoValue, {
                                                color: settings.status === 'On Schedule' ? '#10B981' :
                                                    settings.status === 'Delayed' ? '#F59E0B' :
                                                        settings.status === 'No Service' ? '#EF4444' : '#6366F1'
                                            }]}>
                                                {settings.status}
                                            </AppText>
                                        </View>
                                    </View>

                                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                                    <View style={styles.infoRow}>
                                        <View style={{ flex: 1 }}>
                                            <AppText style={[styles.infoLabel, { color: colors.textSecondary }]}>Next Pickup</AppText>
                                            <AppText style={[styles.infoValue, { color: colors.text }]}>
                                                {settings.pickupDay}, {settings.pickupTime} {settings.pickupPeriod}
                                            </AppText>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <AppText style={[styles.infoLabel, { color: colors.textSecondary }]}>Next Drop-off</AppText>
                                            <AppText style={[styles.infoValue, { color: colors.text }]}>
                                                {settings.dropoffDay}, {settings.dropoffTime} {settings.dropoffPeriod}
                                            </AppText>
                                        </View>
                                    </View>

                                    {settings.message ? (
                                        <>
                                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                                            <View>
                                                <AppText style={[styles.infoLabel, { color: colors.textSecondary }]}>Message from Admin</AppText>
                                                <AppText style={[styles.messageText, { color: colors.text }]}>
                                                    "{settings.message}"
                                                </AppText>
                                            </View>
                                        </>
                                    ) : null}
                                </View>
                            )}

                            <AppText style={[styles.sectionTitle, { color: colors.text }]}>Request Details</AppText>

                            {/* Form */}
                            <View style={styles.formContainer}>

                                <View style={styles.inputGroup}>
                                    <AppText style={[styles.label, { color: colors.textSecondary }]}>Clothes Details</AppText>
                                    <TextInput
                                        style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                                        placeholder="E.g., 2 Shirts, 1 Jeans, 1 Towel..."
                                        placeholderTextColor={colors.textSecondary}
                                        multiline
                                        textAlignVertical="top"
                                        value={clothesDetails}
                                        onChangeText={setClothesDetails}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <AppText style={[styles.label, { color: colors.textSecondary }]}>Total Count</AppText>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                                        placeholder="e.g. 5"
                                        placeholderTextColor={colors.textSecondary}
                                        keyboardType="numeric"
                                        value={totalClothes}
                                        onChangeText={setTotalClothes}
                                    />
                                </View>
                            </View>

                            <Pressable
                                onPress={handleSubmit}
                                style={({ pressed }) => [
                                    styles.submitButton,
                                    submitting && styles.disabledButton,
                                    pressed && styles.buttonPressed
                                ]}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="send" size={20} color="#fff" style={{ marginRight: 8 }} />
                                        <AppText style={styles.buttonText}>Submit Request</AppText>
                                    </>
                                )}
                            </Pressable>

                            {/* Recent Requests History */}
                            <AppText style={[styles.sectionTitle, { color: colors.text, marginTop: 32 }]}>Recent Activity</AppText>
                            {history.length === 0 ? (
                                <View style={[styles.emptyState, { borderColor: colors.border }]}>
                                    <AppText style={{ color: colors.textSecondary }}>No recent requests found</AppText>
                                </View>
                            ) : (
                                history.slice(0, 3).map((req, index) => (
                                    <View key={index} style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <AppText style={[styles.historyDate, { color: colors.text }]}>
                                                {formatUniversalTime(req.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </AppText>
                                            {/* Dynamic Status Badge */}
                                            {(() => {
                                                const statusConfig = {
                                                    pending: { label: 'Requested', color: '#6366F1', bg: isDark ? 'rgba(99, 102, 241, 0.2)' : '#E0E7FF' },
                                                    processing: { label: 'Processing', color: '#F59E0B', bg: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7' },
                                                    ready: { label: 'Ready', color: '#10B981', bg: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5' },
                                                    completed: { label: 'Deivered', color: '#10B981', bg: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5' },
                                                    rejected: { label: 'Rejected', color: '#EF4444', bg: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2' },
                                                };
                                                // Default to pending if unknown status
                                                const config = statusConfig[req.status as keyof typeof statusConfig] || statusConfig.pending;

                                                return (
                                                    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                                                        <AppText style={[styles.statusText, { color: config.color }]}>{config.label}</AppText>
                                                    </View>
                                                );
                                            })()}
                                        </View>
                                        <AppText style={[styles.historyDetails, { color: colors.textSecondary }]}>
                                            {req.clothesDetails}
                                        </AppText>
                                        <AppText style={[styles.historyTotal, { color: colors.textSecondary, marginTop: 4 }]}>
                                            {req.totalClothes} Items
                                        </AppText>
                                    </View>
                                ))
                            )}

                        </View>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView >
        </View >
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 12,
        color: '#64748B',
    },
    headerGradient: {
        paddingBottom: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    safeArea: {
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    content: {
        flexGrow: 1,
    },
    infoCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    messageText: {
        fontSize: 14,
        fontStyle: 'italic',
        marginTop: 4,
        lineHeight: 20,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        color: '#1E293B',
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 16,
    },
    formContainer: {
        gap: 20,
        marginBottom: 30,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
    },
    textArea: {
        height: 120,
    },
    submitButton: {
        backgroundColor: '#004e92',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 18,
        borderRadius: 16,
        shadowColor: '#004e92',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 6,
    },
    buttonPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9,
    },
    disabledButton: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    emptyState: {
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderRadius: 12,
    },
    historyCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
    },
    historyDate: {
        fontWeight: '700',
        fontSize: 14,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    historyDetails: {
        fontSize: 14,
        lineHeight: 20,
    },
    historyTotal: {
        fontSize: 12,
        fontWeight: '600',
    },
});
