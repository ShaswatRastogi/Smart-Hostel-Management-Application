import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, DeviceEventEmitter, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, interpolate, Extrapolation } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StudentDetailsModal from '../components/StudentDetailsModal';
import { useAlert } from '../context/AlertContext';
import { API_BASE_URL } from '../utils/api';
import { setStoredUser } from '../utils/authUtils';
import { getSecureToken, removeSecureToken } from '../utils/tokenStorage';
import { fetchUserData, getInitial, StudentData } from '../utils/nameUtils';
import { useTheme } from '../utils/ThemeContext';
import AppText from '../components/AppText';
import { ProfileSkeleton } from '../components/SkeletonLists';

export default function ProfilePage() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { showAlert } = useAlert();
    const { isDark } = useTheme();

    const [student, setStudent] = useState<StudentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [attendanceModalVisible, setAttendanceModalVisible] = useState(false);
    const [pendingDues, setPendingDues] = useState<number>(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const flipRotation = useSharedValue(0);

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
        flipRotation.value = withTiming(isFlipped ? 0 : 180, { duration: 800, easing: Easing.inOut(Easing.ease) });
    };

    const frontAnimatedStyle = useAnimatedStyle(() => {
        const rotateY = interpolate(flipRotation.value, [0, 180], [0, 180], Extrapolation.CLAMP);
        return { transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }], backfaceVisibility: 'hidden' };
    });

    const backAnimatedStyle = useAnimatedStyle(() => {
        const rotateY = interpolate(flipRotation.value, [0, 180], [180, 360], Extrapolation.CLAMP);
        return { transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }], backfaceVisibility: 'hidden', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 };
    });

    // Dynamic Theme Mapping
    const themeBg = isDark ? '#000000' : '#F8FAFC';
    const textMain = isDark ? '#FFFFFF' : '#111111';
    const textMuted = isDark ? '#888888' : '#64748B';
    const borderSubtle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    const iconBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
    const statBoxBg = isDark ? 'transparent' : '#FFFFFF';
    const primaryBtnBg = isDark ? '#FFFFFF' : '#111111';

    useEffect(() => {
        loadUserData();
        const subscription = DeviceEventEmitter.addListener('profileUpdated', loadUserData);
        return () => subscription.remove();
    }, []);

    useEffect(() => {
        if (student?.email) loadPendingDues(student.email);
    }, [student]);

    const loadUserData = async () => {
        try {
            const data = await fetchUserData();
            setStudent(data);
        } catch (error) {
            console.error('Failed to load user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadPendingDues = async (email: string) => {
        try {
            const { getStudentRequests } = await import('../utils/financeUtils');
            const requests = await getStudentRequests(email);
            const totalPending = requests
                .filter(r => r.status === 'pending' || r.status === 'overdue')
                .reduce((sum, r) => sum + r.amount, 0);
            setPendingDues(totalPending);
        } catch (err) {}
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadUserData();
        setRefreshing(false);
    };

    const pickImage = async () => {
        try {
            const ImagePicker = await import('expo-image-picker');
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') return showAlert('Permission Required', 'Need camera roll permissions!');
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5 });
            if (!result.canceled && result.assets[0].uri) uploadImage(result.assets[0].uri);
        } catch (error) { console.error(error); }
    };

    const uploadImage = async (uri: string) => {
        if (!student?.id) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('profilePhoto', { uri, name: 'profile_photo.jpg', type: 'image/jpeg' } as any);
            const token = await getSecureToken('userToken');
            const response = await fetch(`${API_BASE_URL}/api/students/profile/photo`, { method: 'POST', body: formData, headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Upload failed');
            const result = await response.json();
            if (result.success && result.profilePhoto) {
                setStudent(prev => prev ? { ...prev, profilePhoto: result.profilePhoto } : null);
                showAlert('Success', 'Profile photo updated!', [], 'success');
                DeviceEventEmitter.emit('profileUpdated');
            }
        } catch (error: any) {
            showAlert('Error', 'Failed to upload image', [], 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleSignOut = () => {
        showAlert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel', onPress: () => {} },
            {
                text: 'Sign Out', style: 'destructive', onPress: async () => {
                    try {
                        const { performLogout } = await import('../utils/authUtils');
                        await performLogout(router);
                    } catch (error: any) {
                        console.error('Logout error:', error);
                        showAlert('Error', 'Failed to logout properly', [], 'error');
                    }
                }
            }
        ]);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Not Provided';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    if (loading) return (
        <View style={{ flex: 1, backgroundColor: themeBg }}>
            <Stack.Screen options={{ headerShown: false }} />
            <ProfileSkeleton />
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: themeBg }}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={textMain} />} showsVerticalScrollIndicator={false}>
                <View style={[styles.headerActions, { paddingTop: insets.top + 16 }]}>
                    <Pressable onPress={() => router.back()} style={styles.iconButton}><MaterialCommunityIcons name="arrow-left" size={24} color={textMain} /></Pressable>
                    <Pressable style={styles.iconButton} onPress={() => router.push('/edit-profile')}><MaterialCommunityIcons name="pencil" size={24} color={textMain} /></Pressable>
                </View>

                <View style={{ paddingHorizontal: 24, marginBottom: 48, paddingTop: 16 }}>
                    <Pressable onPress={handleFlip} style={{ position: 'relative' }}>
                        {/* Front of ID */}
                        <Animated.View style={[frontAnimatedStyle, { backgroundColor: isDark ? '#18181B' : '#FFFFFF', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: borderSubtle, elevation: 10, shadowColor: isDark ? '#3B82F6' : '#000000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: isDark ? 0.2 : 0.1, shadowRadius: 20 }]}>
                            <View style={[styles.avatarContainer, { marginBottom: 24, alignSelf: 'flex-start' }]}>
                                <View style={[styles.avatar, { backgroundColor: iconBg }]}>
                                    {student?.profilePhoto ? (
                                        <Image source={{ uri: student.profilePhoto.startsWith('http') ? student.profilePhoto : `${API_BASE_URL}${student.profilePhoto}` }} style={{ width: '100%', height: '100%', borderRadius: 60 }} contentFit="cover" cachePolicy="memory-disk" />
                                    ) : <AppText style={[styles.avatarText, { color: textMain }]}>{getInitial(student?.fullName || 'U')}</AppText>}
                                    {uploading && <View style={[styles.avatar, { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10 }]}><ActivityIndicator color="#fff" /></View>}
                                </View>
                                <Pressable style={[styles.cameraButton, { backgroundColor: textMain }]} onPress={pickImage} disabled={uploading}>
                                    <MaterialCommunityIcons name="camera" size={20} color={themeBg} />
                                </Pressable>
                            </View>
                            <AppText style={[styles.studentName, { color: textMain }]}>{student?.fullName || 'Student Name'}</AppText>
                            <AppText style={[styles.studentRoll, { color: textMuted }]}>{student?.rollNo || 'Roll No. --'}</AppText>
                            <View style={[styles.tagsRow, { marginTop: 16 }]}>
                                <View style={[styles.tag, { backgroundColor: iconBg }]}><AppText style={[styles.tagText, { color: textMain }]}>Room {student?.roomNo || '--'}</AppText></View>
                                <View style={[styles.tag, { backgroundColor: student?.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }]}>
                                    <AppText style={[styles.tagText, { color: student?.status === 'active' ? '#10B981' : '#EF4444' }]}>{student?.status === 'active' ? 'Active' : 'Inactive'}</AppText>
                                </View>
                            </View>
                            <View style={{ position: 'absolute', top: 24, right: 24, opacity: 0.1 }}><MaterialCommunityIcons name="fingerprint" size={60} color={textMain} /></View>
                        </Animated.View>

                        {/* Back of ID */}
                        <Animated.View style={[backAnimatedStyle, { backgroundColor: isDark ? '#18181B' : '#FFFFFF', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: borderSubtle, alignItems: 'center', justifyContent: 'center', elevation: 10 }]}>
                            <MaterialCommunityIcons name="qrcode" size={150} color={textMain} />
                            <AppText style={{ color: textMuted, marginTop: 24, fontSize: 16, fontWeight: '600' }}>Scan to verify identity</AppText>
                            <AppText style={{ color: textMuted, marginTop: 8, fontSize: 12 }}>{student?.email}</AppText>
                        </Animated.View>
                    </Pressable>
                </View>

                <View style={styles.statsGrid}>
                    <Pressable onPress={() => setAttendanceModalVisible(true)} style={({ pressed }) => [styles.statBox, { borderColor: borderSubtle, backgroundColor: statBoxBg }, pressed && { opacity: 0.7 }]}>
                        <MaterialCommunityIcons name="calendar-check" size={24} color={textMain} style={{ marginBottom: 12 }} />
                        <AppText style={styles.statLabel}>ATTENDANCE</AppText>
                        <AppText style={[styles.statValue, { color: textMain }]}>View History</AppText>
                    </Pressable>
                    <Pressable onPress={() => router.push('/payments')} style={({ pressed }) => [styles.statBox, { borderColor: borderSubtle, backgroundColor: statBoxBg }, pressed && { opacity: 0.7 }]}>
                        <MaterialCommunityIcons name="cash" size={24} color={pendingDues > 0 ? '#EF4444' : '#10B981'} style={{ marginBottom: 12 }} />
                        <AppText style={styles.statLabel}>PENDING DUES</AppText>
                        <AppText style={[styles.statValue, { color: pendingDues > 0 ? '#EF4444' : textMain }]}>{pendingDues > 0 ? `₹${pendingDues}` : 'No Dues'}</AppText>
                    </Pressable>
                </View>

                <View style={styles.section}>
                    <AppText style={styles.sectionTitle}>LOCATION</AppText>
                    <InfoRow label="Studying At" value={student?.collegeName} textMain={textMain} textMuted={textMuted} borderSubtle={borderSubtle} />
                    <InfoRow label="Living At" value={student?.hostelName} textMain={textMain} textMuted={textMuted} borderSubtle={borderSubtle} />
                </View>

                <View style={styles.section}>
                    <AppText style={styles.sectionTitle}>PERSONAL DETAILS</AppText>
                    <InfoRow label="Personal Email (Login ID)" value={student?.email} textMain={textMain} textMuted={textMuted} borderSubtle={borderSubtle} />
                    {student?.googleEmail && <InfoRow label="Google Mail (For Login)" value={student?.googleEmail} textMain={textMain} textMuted={textMuted} borderSubtle={borderSubtle} />}
                    {student?.collegeEmail && <InfoRow label="College Email" value={student?.collegeEmail} textMain={textMain} textMuted={textMuted} borderSubtle={borderSubtle} />}
                    <InfoRow label="Phone" value={student?.phone} textMain={textMain} textMuted={textMuted} borderSubtle={borderSubtle} />
                    <InfoRow label="Address" value={student?.address} textMain={textMain} textMuted={textMuted} borderSubtle={borderSubtle} />
                    <InfoRow label="Father Name" value={student?.fatherName} textMain={textMain} textMuted={textMuted} borderSubtle={borderSubtle} />
                    <InfoRow label="Father Phone" value={student?.fatherPhone} textMain={textMain} textMuted={textMuted} borderSubtle={borderSubtle} />
                    <InfoRow label="Mother Name" value={student?.motherName} textMain={textMain} textMuted={textMuted} borderSubtle={borderSubtle} />
                    <InfoRow label="Mother Phone" value={student?.motherPhone} textMain={textMain} textMuted={textMuted} borderSubtle={borderSubtle} />
                    <InfoRow label="Date of Birth" value={formatDate(student?.dob)} textMain={textMain} textMuted={textMuted} borderSubtle={borderSubtle} />
                    <InfoRow label="WiFi Name" value={student?.wifiSSID} textMain={textMain} textMuted={textMuted} borderSubtle={borderSubtle} />
                    <InfoRow label="WiFi Password" value={student?.wifiPassword || 'Not Set'} textMain={textMain} textMuted={textMuted} borderSubtle={borderSubtle} />
                </View>

                {(student as any)?.roomType && (
                    <View style={styles.section}>
                        <AppText style={styles.sectionTitle}>ROOM CONFIGURATION</AppText>
                        <InfoRow label="Room Type" value={(student as any).roomType} textMain={textMain} textMuted={textMuted} borderSubtle={borderSubtle} />
                        {(student as any).facilities && JSON.parse(typeof (student as any).facilities === 'string' ? (student as any).facilities : JSON.stringify((student as any).facilities)).map((f: any) => (
                            <InfoRow key={f.name} label={f.name} value={f.status} valueColor={f.status === 'Included' ? '#10B981' : '#EF4444'} textMain={textMain} textMuted={textMuted} borderSubtle={borderSubtle} />
                        ))}
                    </View>
                )}

                <View style={styles.section}>
                    <AppText style={styles.sectionTitle}>FINANCIAL INFORMATION</AppText>
                    <InfoRow label="Fee Frequency" value={student?.feeFrequency || 'Monthly'} textMain={textMain} textMuted={textMuted} borderSubtle={borderSubtle} />
                    <InfoRow label="Total Fees / Dues" value={`₹${student?.dues || 0}`} textMain={textMain} textMuted={textMuted} borderSubtle={borderSubtle} />
                    <InfoRow label="Current Status" value={pendingDues > 0 ? `Pending: ₹${pendingDues}` : 'All Dues Cleared'} valueColor={pendingDues > 0 ? '#EF4444' : '#10B981'} textMain={textMain} textMuted={textMuted} borderSubtle={borderSubtle} />
                </View>

                <View style={styles.section}>
                    <AppText style={styles.sectionTitle}>MEDICAL & EMERGENCY</AppText>
                    <InfoRow label="Blood Group" value={student?.bloodGroup} textMain={textMain} textMuted={textMuted} borderSubtle={borderSubtle} />
                    <InfoRow label="Emergency Contact" value={student?.emergencyContactName} textMain={textMain} textMuted={textMuted} borderSubtle={borderSubtle} />
                    <InfoRow label="Emergency Phone" value={student?.emergencyContactPhone} textMain={textMain} textMuted={textMuted} borderSubtle={borderSubtle} />
                    <InfoRow label="Medical History" value={student?.medicalHistory} textMain={textMain} textMuted={textMuted} borderSubtle={borderSubtle} />
                </View>

                <Pressable style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.7 }]} onPress={handleSignOut}>
                    <AppText style={styles.signOutText}>SIGN OUT</AppText>
                </Pressable>

                <AppText style={styles.versionText}>App Version 1.0.2</AppText>
            </ScrollView>

            <StudentDetailsModal visible={attendanceModalVisible} student={student} onClose={() => setAttendanceModalVisible(false)} onEdit={() => {}} onDelete={() => {}} viewMode="attendance" />
        </View>
    );
}

const InfoRow = ({ label, value, valueColor, textMain, textMuted, borderSubtle }: any) => (
    <View style={[styles.infoRow, { borderColor: borderSubtle }]}>
        <AppText style={[styles.infoLabel, { color: textMuted }]}>{label}</AppText>
        <AppText style={[styles.infoValue, { color: textMain }, valueColor && { color: valueColor }]}>{value || 'Not provided'}</AppText>
    </View>
);

const styles = StyleSheet.create({
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerActions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 16 },
    iconButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    hero: { paddingHorizontal: 24, paddingBottom: 48, paddingTop: 16 },
    avatarContainer: { position: 'relative', alignSelf: 'flex-start', marginBottom: 24 },
    avatar: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 48, fontWeight: '700' },
    cameraButton: { position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    studentName: { fontSize: 40, fontWeight: '800', letterSpacing: -1.5, lineHeight: 44, marginBottom: 8 },
    studentRoll: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
    tagsRow: { flexDirection: 'row', gap: 12 },
    tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
    tagText: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
    statsGrid: { flexDirection: 'row', paddingHorizontal: 24, gap: 16, marginBottom: 48 },
    statBox: { flex: 1, padding: 20, borderRadius: 16, borderWidth: 1 },
    statLabel: { fontSize: 10, fontWeight: '700', color: '#888888', letterSpacing: 1.5, marginBottom: 4 },
    statValue: { fontSize: 16, fontWeight: '700' },
    section: { paddingHorizontal: 24, marginBottom: 48 },
    sectionTitle: { fontSize: 11, fontWeight: '700', color: '#666666', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1 },
    infoLabel: { fontSize: 14, fontWeight: '600', flex: 1, paddingRight: 16 },
    infoValue: { fontSize: 14, fontWeight: '600', flex: 1, textAlign: 'right' },
    signOutBtn: { marginHorizontal: 24, marginBottom: 24, paddingVertical: 18, borderRadius: 100, backgroundColor: 'rgba(239,68,68,0.1)', alignItems: 'center' },
    signOutText: { color: '#EF4444', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
    versionText: { textAlign: 'center', fontSize: 12, color: '#444444', fontWeight: '600', marginBottom: 40 },
});
