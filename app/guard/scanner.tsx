import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AppText from '../../components/AppText';
import { useTheme } from '../../utils/ThemeContext';
import { API_BASE_URL } from '../../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatUniversalTime } from '../../utils/timeUtils';
import { Image } from 'expo-image';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCANNER_SIZE = SCREEN_WIDTH * 0.7;

export default function GuardScannerScreen() {
    const { colors, isDark } = useTheme();
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();

    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);
    const [leaveData, setLeaveData] = useState<any>(null);
    const [movementDetails, setMovementDetails] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleBarCodeScanned = useCallback(async ({ data }: { data: string }) => {
        if (scanned || loading) return;
        setScanned(true);
        setLoading(true);
        setError(null);

        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await fetch(`${API_BASE_URL}/api/guard/verify-leave/${encodeURIComponent(data.trim())}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();

            if (res.ok) {
                setLeaveData(result.leaveDetails);
                setMovementDetails(result);
            } else {
                setError(result.error || 'Invalid or expired QR code.');
            }
        } catch (err) {
            console.error('QR verify error:', err);
            setError('Network error. Check your connection.');
        } finally {
            setLoading(false);
        }
    }, [scanned, loading]);

    const resetScanner = () => {
        setLeaveData(null);
        setMovementDetails(null);
        setScanned(false);
        setError(null);
    };

    // Permission not yet determined
    if (!permission) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    // Permission denied
    if (!permission.granted) {
        return (
            <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]} edges={['top']}>
                <MaterialIcons name="camera-off" size={64} color={colors.textSecondary} />
                <AppText style={[styles.permTitle, { color: colors.text }]}>Camera Access Needed</AppText>
                <AppText style={[styles.permDesc, { color: colors.textSecondary }]}>
                    Grant camera permission to scan student leave QR codes at the gate.
                </AppText>
                <TouchableOpacity style={[styles.permBtn, { backgroundColor: colors.primary }]} onPress={requestPermission}>
                    <MaterialIcons name="camera" size={20} color="#fff" />
                    <AppText style={styles.permBtnText}>Allow Camera</AppText>
                </TouchableOpacity>
                <TouchableOpacity style={{ marginTop: 16 }} onPress={() => router.back()}>
                    <AppText style={{ color: colors.textSecondary, fontWeight: '600' }}>Go Back</AppText>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // Main camera scanner
    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            {/* Live Camera */}
            <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            />

            {/* Top Bar */}
            <SafeAreaView style={styles.topBar} edges={['top']}>
                <TouchableOpacity onPress={() => router.back()} style={styles.topBtn}>
                    <MaterialIcons name="arrow-left" size={26} color="#fff" />
                </TouchableOpacity>
                <AppText style={styles.topTitle}>Scan Leave QR</AppText>
                <View style={{ width: 44 }} />
            </SafeAreaView>

            {/* Scanner Frame Overlay */}
            {!scanned && !leaveData && (
                <View style={styles.frameOverlay}>
                    <View style={styles.frameDarkTop} />
                    <View style={{ flexDirection: 'row' }}>
                        <View style={styles.frameDarkSide} />
                        <View style={styles.frameBox}>
                            <View style={[styles.corner, styles.cornerTL]} />
                            <View style={[styles.corner, styles.cornerTR]} />
                            <View style={[styles.corner, styles.cornerBL]} />
                            <View style={[styles.corner, styles.cornerBR]} />
                        </View>
                        <View style={styles.frameDarkSide} />
                    </View>
                    <View style={styles.frameDarkBottom}>
                        <AppText style={styles.scanHint}>Point camera at student's QR code</AppText>
                    </View>
                </View>
            )}

            {/* Loading Overlay */}
            {loading && (
                <View style={styles.loadingOverlay}>
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color="#7C3AED" />
                        <AppText style={styles.loadingText}>Verifying pass...</AppText>
                    </View>
                </View>
            )}

            {/* Error Overlay */}
            {error && !loading && (
                <View style={styles.loadingOverlay}>
                    <View style={[styles.errorCard, { backgroundColor: isDark ? '#1E293B' : '#fff' }]}>
                        <View style={styles.errorIcon}>
                            <MaterialIcons name="close-circle" size={48} color="#EF4444" />
                        </View>
                        <AppText style={[styles.errorTitle, { color: colors.text }]}>Verification Failed</AppText>
                        <AppText style={[styles.errorMsg, { color: colors.textSecondary }]}>{error}</AppText>
                        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={resetScanner}>
                            <MaterialIcons name="refresh" size={20} color="#fff" />
                            <AppText style={styles.retryText}>Scan Again</AppText>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Success Result Card */}
            {leaveData && !loading && (
                <View style={[styles.resultCard, { backgroundColor: isDark ? '#1E293B' : '#fff' }]}>
                    {/* Success Banner */}
                    <View style={[styles.banner, { backgroundColor: movementDetails?.movement === 'out' ? '#F59E0B' : '#10B981' }]}>
                        <MaterialIcons
                            name={movementDetails?.movement === 'out' ? 'logout' : 'login'}
                            size={24} color="#fff"
                        />
                        <AppText style={styles.bannerText}>
                            Student Logged {movementDetails?.movement?.toUpperCase()}
                        </AppText>
                    </View>

                    {/* Student Info */}
                    <View style={styles.studentRow}>
                        <Image
                            source={{
                                uri: leaveData.profilePhoto
                                    ? (leaveData.profilePhoto.startsWith('http') ? leaveData.profilePhoto : `${API_BASE_URL}${leaveData.profilePhoto}`)
                                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(leaveData.studentName || 'S')}&background=E2E8F0&color=64748B`
                            }}
                            style={styles.avatar}
                        />
                        <View style={{ flex: 1 }}>
                            <AppText style={[styles.studentName, { color: colors.text }]} numberOfLines={1}>
                                {leaveData.studentName}
                            </AppText>
                            <AppText style={styles.roomText}>Room {leaveData.roomNo}</AppText>
                        </View>
                    </View>

                    {/* Leave Details */}
                    <View style={[styles.detailBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC' }]}>
                        <AppText style={[styles.detailLabel, { color: colors.textSecondary }]}>Leave Duration</AppText>
                        <AppText style={[styles.detailVal, { color: colors.text }]}>
                            {formatUniversalTime(leaveData.startDate, { month: 'short', day: 'numeric' })} → {formatUniversalTime(leaveData.endDate, { month: 'short', day: 'numeric' })}
                        </AppText>
                        <AppText style={[styles.detailLabel, { color: colors.textSecondary, marginTop: 12 }]}>Reason</AppText>
                        <AppText style={[styles.detailVal, { color: colors.text }]}>{leaveData.reason || 'N/A'}</AppText>
                    </View>

                    {/* Scan Another */}
                    <TouchableOpacity style={styles.scanAnotherBtn} onPress={resetScanner}>
                        <MaterialIcons name="qrcode-scan" size={20} color="#fff" />
                        <AppText style={styles.scanAnotherText}>Scan Another</AppText>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const DARK_OVERLAY = 'rgba(0,0,0,0.6)';

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },

    // Permission screen
    permTitle: { fontSize: 20, fontWeight: '800', marginTop: 20, marginBottom: 8 },
    permDesc: { textAlign: 'center', fontSize: 14, lineHeight: 20, marginBottom: 28, paddingHorizontal: 20 },
    permBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
    permBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    // Top bar
    topBar: {
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 8,
    },
    topBtn: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center',
    },
    topTitle: { fontSize: 18, fontWeight: '700', color: '#fff', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } },

    // Scanner frame overlay
    frameOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
    frameDarkTop: { flex: 1, backgroundColor: DARK_OVERLAY },
    frameDarkSide: { flex: 1, backgroundColor: DARK_OVERLAY },
    frameDarkBottom: { flex: 1, backgroundColor: DARK_OVERLAY, alignItems: 'center', paddingTop: 32 },
    frameBox: { width: SCANNER_SIZE, height: SCANNER_SIZE },
    corner: { position: 'absolute', width: 28, height: 28, borderColor: '#7C3AED', },
    cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
    cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 },
    cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 12 },
    cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 },
    scanHint: {
        color: '#fff', fontSize: 15, fontWeight: '600',
        backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24,
    },

    // Loading
    loadingOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 30, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 32 },
    loadingBox: { backgroundColor: '#fff', borderRadius: 20, padding: 32, alignItems: 'center', width: '80%' },
    loadingText: { marginTop: 16, fontSize: 16, fontWeight: '600', color: '#334155' },

    // Error
    errorCard: { borderRadius: 24, padding: 32, alignItems: 'center', width: '100%' },
    errorIcon: { marginBottom: 16 },
    errorTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
    errorMsg: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
    retryText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    // Result card
    resultCard: {
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30,
        padding: 24, paddingBottom: 40,
        borderTopLeftRadius: 32, borderTopRightRadius: 32,
        elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12,
    },
    banner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 14, borderRadius: 16, marginBottom: 20, gap: 10,
    },
    bannerText: { color: '#fff', fontSize: 17, fontWeight: '800' },
    studentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 16 },
    studentName: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
    roomText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
    detailBox: { padding: 16, borderRadius: 16 },
    detailLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '700', marginBottom: 4 },
    detailVal: { fontSize: 15, fontWeight: '600' },
    scanAnotherBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        backgroundColor: '#7C3AED', paddingVertical: 15, borderRadius: 14, marginTop: 20,
    },
    scanAnotherText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
