import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, DeviceEventEmitter, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StudentDetailsModal from '../components/StudentDetailsModal';
import { useAlert } from '../context/AlertContext';
import { API_BASE_URL } from '../utils/api';
import { setStoredUser } from '../utils/authUtils';
import { fetchUserData, getInitial, StudentData } from '../utils/nameUtils';
import { useTheme } from '../utils/ThemeContext';
import AppText from '../components/AppText';

export default function ProfilePage() {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { showAlert } = useAlert();
    const [student, setStudent] = useState<StudentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [attendanceModalVisible, setAttendanceModalVisible] = useState(false);

    useEffect(() => {
        loadUserData();
        const subscription = DeviceEventEmitter.addListener('profileUpdated', loadUserData);
        return () => subscription.remove();
    }, []);

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

    const onRefresh = async () => {
        setRefreshing(true);
        await loadUserData();
        setRefreshing(false);
    };

    const pickImage = async () => {
        try {
            const ImagePicker = await import('expo-image-picker');
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                showAlert('Permission Required', 'Sorry, we need camera roll permissions to make this work!');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled && result.assets[0].uri) {
                uploadImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            showAlert('Error', 'Failed to pick image');
        }
    };

    const uploadImage = async (uri: string) => {
        if (!student?.id) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('profilePhoto', {
                uri: uri,
                name: 'profile_photo.jpg',
                type: 'image/jpeg',
                // @ts-ignore
            } as any);

            // Use native fetch to bypass Axios issues
            const token = await import('@react-native-async-storage/async-storage').then(m => m.default.getItem('userToken'));

            const response = await fetch(`${API_BASE_URL}/api/students/profile/photo`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // Let fetch set Content-Type with boundary
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Upload failed: ${response.status} ${errorText}`);
            }

            const result = await response.json();

            // Update local state immediately
            if (result.success && result.profilePhoto) {
                setStudent(prev => prev ? { ...prev, profilePhoto: result.profilePhoto } : null);
                showAlert('Success', 'Profile photo updated successfully!');

                // Trigger global refresh
                DeviceEventEmitter.emit('profileUpdated');
                // Trigger global refresh if needed (e.g. notify listeners)
            }
        } catch (error: any) {
            console.error('Error uploading image:', error);
            showAlert('Error', 'Failed to upload image: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    // Fetch Pending Dues (Dynamic)
    const [pendingDues, setPendingDues] = useState<number>(0);

    useEffect(() => {
        if (student?.email) {
            loadPendingDues(student.email);
        }
    }, [student]);

    const loadPendingDues = async (email: string) => {
        try {
            const { getStudentRequests } = await import('../utils/financeUtils');
            const requests = await getStudentRequests(email);
            // Sum up amounts of requests that are 'pending' or 'overdue'
            const totalPending = requests
                .filter(r => r.status === 'pending' || r.status === 'overdue')
                .reduce((sum, r) => sum + r.amount, 0);
            setPendingDues(totalPending);
        } catch (err) {
            console.error("Failed to load pending dues:", err);
        }
    };

    const handleSignOut = () => {
        showAlert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel', onPress: () => { } },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { deregisterPushToken } = await import('../utils/usePushNotifications');
                            const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
                            const { useAuthStore } = await import('../store/useAuthStore');

                            await deregisterPushToken();
                            await setStoredUser(null);
                            await AsyncStorage.removeItem('userToken');
                            useAuthStore.getState().setUser(null);
                            router.replace('/login');
                        } catch (error: any) {
                            console.error('Error signing out:', error);
                            showAlert('Error', 'Failed to sign out: ' + error.message, [], 'error');
                        }
                    }
                }
            ]
        );
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Not Provided';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ headerShown: false }} />
                <AppText style={{ color: colors.textSecondary }}>Loading Profile...</AppText>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
                showsVerticalScrollIndicator={false}
            >
                {/* Modern Gradient Header */}
                <View style={styles.headerContainer}>
                    <LinearGradient
                        colors={['#000428', '#004e92']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.headerGradient, { paddingTop: insets.top + 20 }]}
                    >
                        <View style={styles.headerContent}>
                            <Pressable onPress={() => router.back()} style={styles.backButton}>
                                <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                            </Pressable>
                            <AppText style={styles.headerTitle}>My Profile</AppText>
                            <Pressable style={styles.editButton}>
                                {/* Placeholder for Edit or Settings action */}
                                <MaterialCommunityIcons name="dots-vertical" size={24} color="rgba(255,255,255,0.8)" />
                            </Pressable>
                        </View>

                        <View style={styles.profileCard}>
                            <View style={styles.avatarContainer}>
                                <View style={styles.avatar}>
                                    {student?.profilePhoto ? (
                                        <Image
                                            source={{ uri: student.profilePhoto.startsWith('http') ? student.profilePhoto : `${API_BASE_URL}${student.profilePhoto}` }}
                                            style={{ width: '100%', height: '100%', borderRadius: 50 }}
                                            contentFit="cover"
                                            cachePolicy="none"
                                        />
                                    ) : (
                                        <AppText style={styles.avatarText}>{getInitial(student?.fullName || 'U')}</AppText>
                                    )}
                                    {/* Upload Indicator Overlay */}
                                    {uploading && (
                                        <View style={[styles.avatar, { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10 }]}>
                                            <ActivityIndicator color="#fff" />
                                        </View>
                                    )}
                                </View>

                                {/* Camera Button */}
                                <Pressable
                                    style={styles.cameraButton}
                                    onPress={pickImage}
                                    disabled={uploading}
                                >
                                    <MaterialCommunityIcons name="camera" size={20} color="#fff" />
                                </Pressable>

                            </View>

                            <AppText style={styles.studentName}>{student?.fullName || 'Student Name'}</AppText>
                            <AppText style={styles.studentRoll}>{student?.rollNo || 'Roll No. --'}</AppText>



                            <View style={styles.tagsRow}>
                                <View style={styles.roomTag}>
                                    <MaterialCommunityIcons name="door-open" size={16} color="#fff" />
                                    <AppText style={styles.roomText}>Room {student?.roomNo || '--'}</AppText>
                                </View>

                                <View style={[styles.statusBadge, { backgroundColor: student?.status === 'active' ? '#10B981' : '#EF4444' }]}>
                                    <MaterialIcons name={student?.status === 'active' ? 'check-circle' : 'cancel'} size={16} color="#fff" />
                                    <AppText style={styles.statusText}>{student?.status === 'active' ? 'Active' : 'Inactive'}</AppText>
                                </View>
                            </View>
                        </View>
                    </LinearGradient>

                    <View style={[styles.curveBlock, { backgroundColor: colors.background }]} />
                </View>

                {/* Beautiful Info Card - Unified Location Style */}
                <View style={[styles.glassCard, {
                    backgroundColor: isDark ? colors.card : '#FFFFFF',
                    borderColor: isDark ? colors.border : '#E6EEF5'
                }]}>
                    <View style={styles.locationBlock}>
                        {/* Connector Line adjusted for smaller spacing */}
                        <View style={[styles.connectorLine, {
                            top: 30, bottom: 30, left: 18,
                            backgroundColor: isDark ? colors.border : '#D1E0F0'
                        }]} />

                        {/* College Section */}
                        <View style={styles.locItem}>
                            <View style={[styles.locIcon, {
                                backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                                borderColor: isDark ? colors.border : '#F1F5F9'
                            }]}>
                                <MaterialCommunityIcons name="school" size={20} color={isDark ? '#60A5FA' : '#004e92'} />
                            </View>
                            <View style={styles.locContent}>
                                <AppText style={[styles.locLabel, { color: colors.textSecondary }]}>Studying At</AppText>
                                <AppText style={[styles.locValue, { color: colors.text }]} numberOfLines={2}>{student?.collegeName || 'Not Assigned'}</AppText>
                            </View>
                        </View>

                        {/* Smaller Spacer */}
                        <View style={{ height: 12 }} />

                        {/* Hostel Section */}
                        <View style={styles.locItem}>
                            <View style={[styles.locIcon, {
                                backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                                borderColor: isDark ? colors.border : '#F1F5F9'
                            }]}>
                                <MaterialCommunityIcons name="office-building" size={20} color={isDark ? '#60A5FA' : '#2B6CB0'} />
                            </View>
                            <View style={styles.locContent}>
                                <AppText style={[styles.locLabel, { color: colors.textSecondary }]}>Living At</AppText>
                                <AppText style={[styles.locValue, { color: colors.text }]} numberOfLines={2}>{student?.hostelName || 'Not Assigned'}</AppText>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Quick Stats Grid */}
                <View style={styles.statsContainer}>




                    <Pressable
                        onPress={() => setAttendanceModalVisible(true)}
                        style={({ pressed }) => [
                            styles.statCard,
                            {
                                backgroundColor: isDark ? '#1e293b' : '#eff6ff',
                                borderColor: isDark ? '#334155' : '#dbeafe',
                                opacity: pressed ? 0.7 : 1
                            }
                        ]}
                    >
                        <View style={[styles.statIcon, { backgroundColor: '#8B5CF6' }]}>
                            <MaterialCommunityIcons name="calendar-check" size={20} color="#fff" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AppText style={[styles.statLabel, { color: colors.textSecondary }]}>Attendance</AppText>
                            <AppText style={[styles.statValue, { color: colors.text, fontSize: 13 }]}>View History</AppText>
                        </View>

                    </Pressable>

                    <Pressable
                        onPress={() => router.push('/payments')}
                        style={({ pressed }) => [
                            styles.statCard,
                            {
                                backgroundColor: isDark ? '#1e293b' : '#eff6ff',
                                borderColor: isDark ? '#334155' : '#dbeafe',
                                opacity: pressed ? 0.7 : 1
                            }
                        ]}
                    >
                        <View style={[styles.statIcon, { backgroundColor: pendingDues > 0 ? '#EF4444' : '#10B981' }]}>
                            <MaterialCommunityIcons name="cash" size={20} color="#fff" />
                        </View>
                        <View>
                            <AppText style={[styles.statLabel, { color: colors.textSecondary }]}>Pending Dues</AppText>
                            <AppText style={[styles.statValue, { color: pendingDues > 0 ? '#EF4444' : colors.text }]}>
                                {pendingDues > 0 ? `₹${pendingDues}` : 'No Dues'}
                            </AppText>
                        </View>
                    </Pressable>
                </View>


                {/* Detailed Info Section */}
                <View style={styles.detailsSection}>
                    <AppText style={[styles.sectionHeader, { color: colors.text }]}>Personal Details</AppText>

                    <View style={[styles.infoBlock, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <InfoRow icon="email-lock" label="Personal Email (Login ID)" value={student?.email} colors={colors} isLast={false} />
                        {student?.googleEmail && (
                            <InfoRow icon="google" label="Google Mail (For Login)" value={student?.googleEmail} colors={colors} isLast={false} />
                        )}
                        {student?.collegeEmail && (
                            <InfoRow icon="email-check" label="College Email" value={student?.collegeEmail} colors={colors} isLast={false} />
                        )}
                        <InfoRow icon="phone" label="Phone" value={student?.phone} colors={colors} isLast={false} />
                        <InfoRow icon="map-marker" label="Address" value={student?.address} colors={colors} isLast={false} />
                        <InfoRow icon="account-tie" label="Father Name" value={student?.fatherName} colors={colors} isLast={false} />
                        <InfoRow icon="phone" label="Father Phone" value={student?.fatherPhone} colors={colors} isLast={false} />
                        <InfoRow icon="face-woman" label="Mother Name" value={student?.motherName} colors={colors} isLast={false} />
                        <InfoRow icon="phone" label="Mother Phone" value={student?.motherPhone} colors={colors} isLast={false} />
                        <InfoRow icon="calendar-account" label="Date of Birth" value={formatDate(student?.dob)} colors={colors} isLast={false} />
                        <InfoRow icon="wifi" label="WiFi Name" value={student?.wifiSSID} colors={colors} isLast={false} />
                        <InfoRow icon="wifi-lock" label="WiFi Password" value={student?.wifiPassword || 'Not Set'} colors={colors} isLast={true} />
                    </View>
                </View>

                {/* Room Configuration Section */}
                {(student as any)?.roomType && (
                    <View style={styles.detailsSection}>
                        <AppText style={[styles.sectionHeader, { color: colors.text, marginTop: 12 }]}>Room Configuration</AppText>
                        <View style={[styles.infoBlock, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <InfoRow icon="door-closed" label="Room Type" value={(student as any).roomType} colors={colors} isLast={!(student as any).facilities} />

                            {(student as any).facilities && (
                                <View style={styles.facilitiesContainer}>
                                    {JSON.parse(typeof (student as any).facilities === 'string' ? (student as any).facilities : JSON.stringify((student as any).facilities)).map((f: any, index: number, arr: any[]) => (
                                        <View key={f.name} style={[styles.facilityItem, index === arr.length - 1 && { borderBottomWidth: 0 }]}>
                                            <View style={styles.facilityInfo}>
                                                <MaterialCommunityIcons name={f.icon} size={20} color={colors.textSecondary} />
                                                <AppText style={[styles.facilityName, { color: colors.text }]}>{f.name}</AppText>
                                            </View>
                                            <View style={[styles.miniStatusBadge, { backgroundColor: f.status === 'Included' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                                                <AppText style={[styles.miniStatusText, { color: f.status === 'Included' ? '#10B981' : '#EF4444' }]}>{f.status}</AppText>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Financial Section */}
                <View style={styles.detailsSection}>
                    <AppText style={[styles.sectionHeader, { color: colors.text, marginTop: 12 }]}>Financial Information</AppText>
                    <View style={[styles.infoBlock, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <InfoRow icon="calendar-clock" label="Fee Frequency" value={student?.feeFrequency || 'Monthly'} colors={colors} isLast={false} />
                        <InfoRow icon="cash-multiple" label="Total Fees / Dues" value={`₹${student?.dues || 0}`} colors={colors} isLast={false} />
                        <InfoRow
                            icon="information"
                            label="Current Status"
                            value={pendingDues > 0 ? `Pending: ₹${pendingDues}` : 'All Dues Cleared'}
                            colors={colors}
                            isLast={true}
                            valueColor={pendingDues > 0 ? '#EF4444' : '#10B981'}
                        />
                    </View>
                </View>

                {/* Medical & Emergency Section */}
                <View style={styles.detailsSection}>
                    <AppText style={[styles.sectionHeader, { color: colors.text, marginTop: 12 }]}>Medical & Emergency</AppText>
                    <View style={[styles.infoBlock, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <InfoRow icon="water" label="Blood Group" value={student?.bloodGroup} colors={colors} isLast={false} />
                        <InfoRow icon="account-alert" label="Emergency Contact" value={student?.emergencyContactName} colors={colors} isLast={false} />
                        <InfoRow icon="phone-alert" label="Emergency Phone" value={student?.emergencyContactPhone} colors={colors} isLast={false} />
                        <InfoRow icon="medical-bag" label="Medical History" value={student?.medicalHistory} colors={colors} isLast={true} />
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionSection}>
                    <Pressable
                        style={({ pressed }) => [styles.signOutBtn, pressed && styles.btnPressed]}
                        onPress={handleSignOut}
                    >
                        <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
                        <AppText style={styles.signOutText}>Sign Out</AppText>
                    </Pressable>

                    <AppText style={[styles.versionText, { color: colors.textSecondary }]}>App Version 1.0.2</AppText>
                </View>

            </ScrollView >

            <StudentDetailsModal
                visible={attendanceModalVisible}
                student={student}
                onClose={() => setAttendanceModalVisible(false)}
                onEdit={() => { }}
                onDelete={() => { }}
                viewMode="attendance"
            />
        </View >
    );
}

const InfoRow = ({ icon, label, value, colors, isLast, valueColor }: any) => (
    <View style={[styles.infoRow, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
        <View style={styles.infoIconWrapper}>
            <MaterialCommunityIcons name={icon} size={22} color={colors.textSecondary} />
        </View>
        <View style={styles.infoTextWrapper}>
            <AppText style={[styles.infoRowLabel, { color: colors.textSecondary }]}>{label}</AppText>
            <AppText style={[styles.infoRowValue, { color: valueColor || colors.text }]}>{value || 'Not provided'}</AppText>
        </View>
    </View>
);

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContainer: {
        position: 'relative',
        marginBottom: 0,
    },
    headerGradient: {
        paddingBottom: 40,
        alignItems: 'center',
    },
    headerContent: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 24,
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
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    editButton: {
        width: 40,
        alignItems: 'flex-end',
    },
    profileCard: {
        alignItems: 'center',
        gap: 8,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 8,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    avatarText: {
        fontSize: 40,
        fontWeight: '700',
        color: '#004e92',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#004e92',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
        zIndex: 25,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    tagsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        // Borders removed for cleaner pill look
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    studentName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.5,
    },
    studentRoll: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
        marginBottom: 8,
    },
    hostelNameText: {
        fontSize: 18,
        color: '#fff',
        fontWeight: '700',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    roomTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    roomText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    curveBlock: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 30,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
    },

    // Stats
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 16,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        gap: 12,
        borderWidth: 1,
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 2,
    },
    statValue: {
        fontSize: 15,
        fontWeight: '700',
    },
    glassCard: {
        width: 'auto',
        marginHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        marginTop: 8,
        marginBottom: 24,
        shadowColor: '#004e92',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E6EEF5',
    },
    locationBlock: {
        position: 'relative',
    },
    connectorLine: {
        position: 'absolute',
        left: 20,
        top: 40,
        bottom: 40,
        width: 2,
        backgroundColor: '#D1E0F0',
        zIndex: -1,
    },
    locItem: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
    },
    locIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        backgroundColor: '#F8FAFC',
    },
    locContent: {
        flex: 1,
        paddingTop: 0,
        justifyContent: 'center',
        minHeight: 36,
    },
    locLabel: {
        fontSize: 10,
        color: '#64748B',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 2,
    },
    locValue: {
        fontSize: 14,
        color: '#0F172A',
        fontWeight: '700',
        lineHeight: 20,
    },

    // Details
    detailsSection: {
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    infoBlock: {
        borderRadius: 24,
        borderWidth: 1,
        overflow: 'hidden',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 16,
    },
    infoIconWrapper: {
        width: 36,
        alignItems: 'center',
    },
    infoTextWrapper: {
        flex: 1,
    },
    infoRowLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 2,
    },
    infoRowValue: {
        fontSize: 15,
        fontWeight: '600',
    },

    // Actions
    actionSection: {
        paddingHorizontal: 20,
        alignItems: 'center',
        gap: 20,
    },
    signOutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 100,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    btnPressed: {
        opacity: 0.7,
    },
    signOutText: {
        color: '#EF4444',
        fontSize: 15,
        fontWeight: '700',
    },
    versionText: {
        fontSize: 12,
    },
    facilitiesContainer: {
        paddingHorizontal: 16,
    },
    facilityItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    facilityInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    facilityName: {
        fontSize: 14,
        fontWeight: '600',
    },
    miniStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    miniStatusText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
});
