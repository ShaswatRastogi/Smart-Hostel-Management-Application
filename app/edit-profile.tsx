import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, DeviceEventEmitter, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../context/AlertContext';
import api, { API_BASE_URL } from '../utils/api';
import { getInitial } from '../utils/nameUtils';
import { getSecureToken } from '../utils/tokenStorage';
import { useTheme } from '../utils/ThemeContext';
import AppText from '../components/AppText';

export default function EditProfile() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { showAlert } = useAlert();
    const { isDark } = useTheme();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const [fullName, setFullName] = useState<string>('Student');

    const [formData, setFormData] = useState({
        phone: '', dob: '', bloodGroup: '', address: '', medicalHistory: '',
        fatherName: '', fatherPhone: '', motherName: '', motherPhone: '',
        emergencyContactName: '', emergencyContactPhone: '',
    });

    const [initialData, setInitialData] = useState<any>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dateValue, setDateValue] = useState(new Date(2000, 0, 1));

    // Dynamic Theme Map
    const themeBg = isDark ? '#000000' : '#F8FAFC';
    const textMain = isDark ? '#FFFFFF' : '#111111';
    const textMuted = isDark ? '#888888' : '#64748B';
    const borderSubtle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
    const iconBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
    const primaryBtnBg = isDark ? '#FFFFFF' : '#111111';
    const primaryBtnText = isDark ? '#000000' : '#FFFFFF';
    const inputPlaceholder = isDark ? '#444444' : '#94A3B8';

    useEffect(() => { loadProfileData(); }, []);

    const loadProfileData = async () => {
        try {
            const response = await api.get('/students/profile');
            const data = response.data;
            setProfilePhoto(data.profilePhoto || null);
            setFullName(data.fullName || 'Student');
            if (data.dob) setDateValue(new Date(data.dob));
            const loadedFormData = {
                phone: data.phone || '', dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : '',
                bloodGroup: data.bloodGroup || '', address: data.address || '', medicalHistory: data.medicalHistory || '',
                fatherName: data.fatherName || '', fatherPhone: data.fatherPhone || '', motherName: data.motherName || '',
                motherPhone: data.motherPhone || '', emergencyContactName: data.emergencyContactName || '', emergencyContactPhone: data.emergencyContactPhone || '',
            };
            setFormData(loadedFormData); setInitialData(loadedFormData);
        } catch (error) { console.error('Error loading profile data:', error); } finally { setLoading(false); }
    };

    const pickImage = async () => {
        try {
            const ImagePicker = await import('expo-image-picker');
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') return showAlert('Permission Required', 'Need camera roll permissions!');
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5 });
            if (!result.canceled && result.assets[0].uri) uploadImage(result.assets[0].uri);
        } catch (error) { console.error('Error picking image:', error); }
    };

    const uploadImage = async (uri: string) => {
        setUploading(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('profilePhoto', { uri, name: 'profile_photo.jpg', type: 'image/jpeg' } as any);
            const token = await getSecureToken('userToken');
            const response = await fetch(`${API_BASE_URL}/api/students/profile/photo`, { method: 'POST', body: formDataUpload, headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Upload failed');
            const result = await response.json();
            if (result.success && result.profilePhoto) {
                setProfilePhoto(result.profilePhoto);
                DeviceEventEmitter.emit('profileUpdated');
                showAlert('Success', 'Profile photo updated!', [], 'success');
            }
        } catch (error) { console.error('Error uploading image:', error); } finally { setUploading(false); }
    };

    const handleSave = async () => {
        if (initialData && JSON.stringify(formData) === JSON.stringify(initialData)) return showAlert('No Changes', 'No changes made.', [], 'info');
        setSaving(true);
        try {
            if (!formData.phone || formData.phone.length < 10) { showAlert('Validation Error', 'Enter valid phone number.'); setSaving(false); return; }
            await api.put('/students/profile', formData);
            DeviceEventEmitter.emit('profileUpdated');
            showAlert('Success', 'Profile updated!', [], 'success');
            router.back();
        } catch (error) { console.error('Error saving profile:', error); showAlert('Error', 'Failed to save profile', [], 'error'); } finally { setSaving(false); }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDateValue(selectedDate);
            setFormData(prev => ({ ...prev, dob: selectedDate.toISOString().split('T')[0] }));
        }
    };

    const renderInput = (label: string, key: keyof typeof formData, icon: any, placeholder: string, keyboardType: any = 'default', multiline = false) => (
        <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
                <MaterialCommunityIcons name={icon} size={18} color={textMuted} style={styles.inputIcon} />
                <AppText style={[styles.inputLabel, { color: textMuted }]}>{label}</AppText>
            </View>
            <TextInput
                style={[styles.input, { color: textMain, borderColor: borderSubtle }, multiline && { textAlignVertical: 'top', paddingTop: 8, paddingBottom: 16 }]}
                placeholder={placeholder} placeholderTextColor={inputPlaceholder}
                value={formData[key]} onChangeText={(val) => setFormData(prev => ({ ...prev, [key]: val }))}
                keyboardType={keyboardType} multiline={multiline}
            />
        </View>
    );

    const SpinningGear = () => {
        const rotation = useSharedValue(0);
        useEffect(() => {
            rotation.value = withRepeat(withTiming(360, { duration: 1000, easing: Easing.linear }), -1, false);
        }, []);

        const rStyle = useAnimatedStyle(() => ({
            transform: [{ rotateZ: `${rotation.value}deg` }]
        }));

        return (
            <Animated.View style={rStyle}>
                <MaterialCommunityIcons name="cog" size={24} color={primaryBtnText} />
            </Animated.View>
        );
    };

    if (loading) return (
        <View style={[styles.loadingContainer, { backgroundColor: themeBg }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <ActivityIndicator size="large" color={textMain} />
        </View>
    );

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: themeBg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]} onPress={() => router.back()}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={textMain} />
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.hero}>
                    <View style={styles.avatarContainer}>
                        <View style={[styles.avatar, { backgroundColor: iconBg }]}>
                            {profilePhoto ? (
                                <Image source={{ uri: profilePhoto.startsWith('http') ? profilePhoto : `${API_BASE_URL}${profilePhoto}` }} style={{ width: '100%', height: '100%', borderRadius: 60 }} contentFit="cover" cachePolicy="memory-disk" />
                            ) : <AppText style={[styles.avatarText, { color: textMain }]}>{getInitial(fullName)}</AppText>}
                            {uploading && <View style={[styles.avatar, { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10 }]}><ActivityIndicator color="#fff" /></View>}
                        </View>
                        <Pressable style={[styles.cameraButton, { backgroundColor: textMain }]} onPress={pickImage} disabled={uploading}>
                            <MaterialCommunityIcons name="camera" size={20} color={themeBg} />
                        </Pressable>
                    </View>
                    <AppText style={[styles.heroTitle, { color: textMain }]}>Edit Profile</AppText>
                    <AppText style={[styles.studentName, { color: textMuted }]}>{fullName}</AppText>
                </View>

                <View style={styles.section}>
                    <AppText style={styles.sectionTitle}>PERSONAL DETAILS</AppText>
                    {renderInput('Phone Number', 'phone', 'phone-outline', 'Enter phone number', 'phone-pad')}
                    <View style={styles.inputGroup}>
                        <View style={styles.inputLabelRow}>
                            <MaterialCommunityIcons name="calendar-outline" size={18} color={textMuted} style={styles.inputIcon} />
                            <AppText style={[styles.inputLabel, { color: textMuted }]}>Date of Birth</AppText>
                        </View>
                        <Pressable onPress={() => setShowDatePicker(true)} style={({ pressed }) => [styles.dateInputWrapper, pressed && { opacity: 0.5 }]}>
                            <AppText style={[styles.input, { color: formData.dob ? textMain : inputPlaceholder, borderColor: borderSubtle }]}>{formData.dob || 'Select Date'}</AppText>
                        </Pressable>
                    </View>
                    {showDatePicker && <DateTimePicker value={dateValue} mode="date" display="default" onChange={onDateChange} maximumDate={new Date()} />}
                    {renderInput('Blood Group', 'bloodGroup', 'water-outline', 'e.g., O+')}
                    {renderInput('Permanent Address', 'address', 'map-marker-outline', 'Full home address', 'default', true)}
                </View>

                <View style={styles.section}>
                    <AppText style={styles.sectionTitle}>FAMILY DETAILS</AppText>
                    {renderInput("Father's Name", 'fatherName', 'account-outline', "Enter father's name")}
                    {renderInput("Father's Phone", 'fatherPhone', 'phone-outline', "Enter father's phone", 'phone-pad')}
                    {renderInput("Mother's Name", 'motherName', 'face-woman-outline', "Enter mother's name")}
                    {renderInput("Mother's Phone", 'motherPhone', 'phone-outline', "Enter mother's phone", 'phone-pad')}
                </View>

                <View style={styles.section}>
                    <AppText style={styles.sectionTitle}>MEDICAL & EMERGENCY</AppText>
                    {renderInput("Emergency Contact", 'emergencyContactName', 'account-alert-outline', "Name of contact person")}
                    {renderInput("Emergency Phone", 'emergencyContactPhone', 'phone-alert-outline', "Emergency phone number", 'phone-pad')}
                    {renderInput('Medical History', 'medicalHistory', 'medical-bag', 'Any allergies or conditions?', 'default', true)}
                </View>

                <Pressable 
                    style={({ pressed }) => [styles.saveBtn, { backgroundColor: primaryBtnBg }, saving && { opacity: 0.7 }, pressed && !saving && { opacity: 0.8 }]} 
                    onPress={handleSave} disabled={saving}
                >
                    {saving ? (
                        <>
                            <SpinningGear />
                            <AppText style={[styles.saveBtnText, { color: primaryBtnText }]}>Saving...</AppText>
                        </>
                    ) : (<>
                        <MaterialCommunityIcons name="check" size={24} color={primaryBtnText} />
                        <AppText style={[styles.saveBtnText, { color: primaryBtnText }]}>Save Changes</AppText>
                    </>)}
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingHorizontal: 24, paddingBottom: 24 },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    hero: { alignItems: 'flex-start', marginBottom: 48 },
    avatarContainer: { position: 'relative', marginBottom: 24 },
    avatar: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 40, fontWeight: '700' },
    cameraButton: { position: 'absolute', bottom: -4, right: -4, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    heroTitle: { fontSize: 40, fontWeight: '800', letterSpacing: -1.5, lineHeight: 44, marginBottom: 8 },
    studentName: { fontSize: 18, fontWeight: '700' },
    section: { marginBottom: 48 },
    sectionTitle: { fontSize: 11, fontWeight: '700', color: '#666666', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 24 },
    inputGroup: { marginBottom: 24 },
    inputLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    inputIcon: { marginRight: 8 },
    inputLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { fontSize: 16, fontWeight: '600', paddingVertical: 12, borderBottomWidth: 1 },
    dateInputWrapper: { justifyContent: 'center' },
    saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 100, gap: 12, marginTop: 16 },
    saveBtnText: { fontSize: 18, fontWeight: '700' },
});
