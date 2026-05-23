import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, DeviceEventEmitter, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../context/AlertContext';
import api, { API_BASE_URL } from '../utils/api';
import { getInitial } from '../utils/nameUtils';
import { useTheme } from '../utils/ThemeContext';
import AppText from '../components/AppText';

export default function EditProfile() {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { showAlert } = useAlert();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const [fullName, setFullName] = useState<string>('Student');

    const [formData, setFormData] = useState({
        phone: '',
        dob: '',
        bloodGroup: '',
        address: '',
        medicalHistory: '',
        fatherName: '',
        fatherPhone: '',
        motherName: '',
        motherPhone: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
    });

    const [initialData, setInitialData] = useState<any>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dateValue, setDateValue] = useState(new Date(2000, 0, 1));

    useEffect(() => {
        loadProfileData();
    }, []);

    const loadProfileData = async () => {
        try {
            const response = await api.get('/students/profile');
            const data = response.data;
            setProfilePhoto(data.profilePhoto || null);
            setFullName(data.fullName || 'Student');
            const dobString = data.dob ? new Date(data.dob).toISOString().split('T')[0] : '';
            if (data.dob) setDateValue(new Date(data.dob));
            const loadedFormData = {
                phone: data.phone || '',
                dob: dobString,
                bloodGroup: data.bloodGroup || '',
                address: data.address || '',
                medicalHistory: data.medicalHistory || '',
                fatherName: data.fatherName || '',
                fatherPhone: data.fatherPhone || '',
                motherName: data.motherName || '',
                motherPhone: data.motherPhone || '',
                emergencyContactName: data.emergencyContactName || '',
                emergencyContactPhone: data.emergencyContactPhone || '',
            };
            setFormData(loadedFormData);
            setInitialData(loadedFormData);
        } catch (error: any) {
            console.error('Error loading profile:', error.response?.data || error.message);
            showAlert('Error', 'Failed to load profile details.');
        } finally {
            setLoading(false);
        }
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
            if (!result.canceled && result.assets[0].uri) uploadImage(result.assets[0].uri);
        } catch (error) {
            console.error('Error picking image:', error);
            showAlert('Error', 'Failed to open image picker');
        }
    };

    const uploadImage = async (uri: string) => {
        setUploading(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('profilePhoto', {
                uri: uri,
                name: 'profile_photo.jpg',
                type: 'image/jpeg',
            } as any);

            const token = await import('@react-native-async-storage/async-storage').then(m => m.default.getItem('userToken'));

            const response = await fetch(`${API_BASE_URL}/api/students/profile/photo`, {
                method: 'POST',
                body: formDataUpload,
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Upload failed: ${response.status} ${errorText}`);
            }

            const result = await response.json();

            if (result.success && result.profilePhoto) {
                setProfilePhoto(result.profilePhoto);
                DeviceEventEmitter.emit('profileUpdated');
                showAlert('Success', 'Profile photo updated successfully!', [], 'success');
            }
        } catch (error: any) {
            console.error('Error uploading image:', error);
            showAlert('Upload Failed', error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (initialData && JSON.stringify(formData) === JSON.stringify(initialData)) {
            showAlert('No Changes', 'You have not made any changes to your profile.', [], 'info');
            return;
        }
        setSaving(true);
        try {
            if (!formData.phone || formData.phone.length < 10) {
                showAlert('Validation Error', 'Please enter a valid phone number.');
                setSaving(false);
                return;
            }
            await api.put('/students/profile', formData);
            DeviceEventEmitter.emit('profileUpdated');
            showAlert('Success', 'Profile updated successfully!', [], 'success');
            router.back();
        } catch (error: any) {
            console.error('Error saving profile:', error);
            showAlert('Update Failed', error.message);
        } finally {
            setSaving(false);
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDateValue(selectedDate);
            const formattedDate = selectedDate.toISOString().split('T')[0];
            setFormData(prev => ({ ...prev, dob: formattedDate }));
        }
    };

    const renderInput = (label: string, key: keyof typeof formData, icon: any, placeholder: string, keyboardType: any = 'default', multiline = false) => (
        <View style={styles.inputGroup}>
            <AppText style={[styles.inputLabel, { color: colors.textSecondary }]}>{label}</AppText>
            <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: colors.border }]}>
                <MaterialCommunityIcons name={icon} size={20} color={isDark ? '#60A5FA' : '#004e92'} style={styles.inputIcon} />
                <TextInput
                    style={[styles.input, { color: colors.text, minHeight: multiline ? 80 : 48 }, multiline && { textAlignVertical: 'top', paddingTop: 12 }]}
                    placeholder={placeholder}
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    value={formData[key]}
                    onChangeText={(val) => setFormData(prev => ({ ...prev, [key]: val }))}
                    keyboardType={keyboardType}
                    multiline={multiline}
                />
            </View>
        </View>
    );

    if (loading) return (
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <ActivityIndicator size="large" color="#004e92" />
            <AppText style={{ color: colors.textSecondary, marginTop: 12 }}>Loading Details...</AppText>
        </View>
    );

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.headerContainer}>
                    <LinearGradient colors={['#000428', '#004e92']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.headerGradient, { paddingTop: insets.top + 10 }]}>
                        <View style={styles.headerContent}>
                            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                                <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
                            </TouchableOpacity>
                            <AppText style={styles.headerTitle}>Edit Profile</AppText>
                            <View style={{ width: 40 }} />
                        </View>
                        <View style={styles.profileCard}>
                            <View style={styles.avatarContainer}>
                                <View style={[styles.avatar, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)' }]}>
                                    {profilePhoto ? (
                                        <Image source={{ uri: profilePhoto.startsWith('http') ? profilePhoto : `${API_BASE_URL}${profilePhoto}` }} style={{ width: '100%', height: '100%', borderRadius: 60 }} contentFit="cover" cachePolicy="none" />
                                    ) : (
                                        <AppText style={styles.avatarText}>{getInitial(fullName)}</AppText>
                                    )}
                                    {uploading && <View style={[styles.avatar, { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10, borderWidth: 0 }]}><ActivityIndicator color="#fff" /></View>}
                                </View>
                                <TouchableOpacity style={styles.cameraButton} onPress={pickImage} disabled={uploading} activeOpacity={0.8}>
                                    <View style={styles.cameraButtonInner}><MaterialCommunityIcons name="camera" size={18} color="#004e92" /></View>
                                </TouchableOpacity>
                            </View>
                            <AppText style={styles.studentName}>{fullName}</AppText>
                        </View>
                    </LinearGradient>
                    <View style={[styles.curveBlock, { backgroundColor: colors.background }]} />
                </View>

                <View style={styles.scrollContent}>
                    <AppText style={[styles.sectionTitle, { color: colors.textSecondary }]}>PERSONAL DETAILS</AppText>
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {renderInput('Phone Number', 'phone', 'phone-outline', 'Enter phone number', 'phone-pad')}
                        <View style={styles.inputGroup}>
                            <AppText style={[styles.inputLabel, { color: colors.textSecondary }]}>Date of Birth</AppText>
                            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.inputContainer, { height: 52, backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: colors.border }]}>
                                <MaterialCommunityIcons name="calendar-outline" size={20} color={isDark ? '#60A5FA' : '#004e92'} style={styles.inputIcon} />
                                <AppText style={[styles.input, { color: formData.dob ? colors.text : (isDark ? '#64748b' : '#94a3b8'), lineHeight: 52 }]}>{formData.dob || 'Select Date'}</AppText>
                            </TouchableOpacity>
                        </View>
                        {showDatePicker && <DateTimePicker value={dateValue} mode="date" display="default" onChange={onDateChange} maximumDate={new Date()} />}
                        {renderInput('Blood Group', 'bloodGroup', 'water-outline', 'e.g., O+')}
                        {renderInput('Permanent Address', 'address', 'map-marker-outline', 'Full home address', 'default', true)}
                    </View>

                    <AppText style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 24 }]}>FAMILY DETAILS</AppText>
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {renderInput("Father's Name", 'fatherName', 'account-outline', "Enter father's name")}
                        {renderInput("Father's Phone", 'fatherPhone', 'phone-outline', "Enter father's phone", 'phone-pad')}
                        {renderInput("Mother's Name", 'motherName', 'face-woman-outline', "Enter mother's name")}
                        {renderInput("Mother's Phone", 'motherPhone', 'phone-outline', "Enter mother's phone", 'phone-pad')}
                    </View>

                    <AppText style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 24 }]}>MEDICAL & EMERGENCY</AppText>
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {renderInput("Emergency Contact", 'emergencyContactName', 'account-alert-outline', "Name of contact person")}
                        {renderInput("Emergency Phone", 'emergencyContactPhone', 'phone-alert-outline', "Emergency phone number", 'phone-pad')}
                        {renderInput('Medical History', 'medicalHistory', 'medical-bag', 'Any allergies or conditions?', 'default', true)}
                    </View>

                    <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving} activeOpacity={0.8}>
                        {saving ? <ActivityIndicator color="#fff" /> : <><MaterialCommunityIcons name="check-decagram-outline" size={22} color="#fff" /><AppText style={styles.saveBtnText}>Save Profile Changes</AppText></>}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerContainer: { position: 'relative', marginBottom: 10 },
    headerGradient: { paddingBottom: 60, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerContent: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
    profileCard: { alignItems: 'center', gap: 10 },
    avatarContainer: { position: 'relative' },
    avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 8 },
    avatarText: { fontSize: 48, fontWeight: '700', color: '#004e92' },
    cameraButton: { position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5, zIndex: 20 },
    cameraButtonInner: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
    studentName: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
    curveBlock: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 30, borderTopLeftRadius: 35, borderTopRightRadius: 35 },
    scrollContent: { paddingHorizontal: 20 },
    sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 1.2, marginBottom: 12, marginLeft: 4 },
    card: { borderRadius: 24, padding: 20, borderWidth: 1, gap: 16, shadowColor: '#004e92', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    inputGroup: { gap: 6 },
    inputLabel: { fontSize: 12, fontWeight: '700', marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, paddingHorizontal: 14 },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, fontSize: 15, fontWeight: '600' },
    saveBtn: { backgroundColor: '#004e92', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 20, gap: 10, marginTop: 32, marginBottom: 20, shadowColor: '#004e92', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
    saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },
});
