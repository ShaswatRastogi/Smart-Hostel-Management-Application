import MaterialIcons from '@expo/vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native';
import { updateStudent } from '../../../utils/studentUtils';
import AppText from '../../../components/AppText';

interface EditStudentModalProps {
    visible: boolean;
    student: any;
    onClose: () => void;
    colors: any;
    theme: 'light' | 'dark';
    insets: any;
    showAlert: (title: string, message: string, buttons?: any[], type?: any) => void;
    onSuccess: () => void;
    API_BASE_URL: string;
}

export default function EditStudentModal({
    visible,
    student,
    onClose,
    colors,
    theme,
    insets,
    showAlert,
    onSuccess,
    API_BASE_URL
}: EditStudentModalProps) {
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editRollNo, setEditRollNo] = useState('');
    const [editRoom, setEditRoom] = useState('');
    const [editSharingType, setEditSharingType] = useState('Single Sharing');
    const [editApartmentType, setEditApartmentType] = useState<string | null>(null);
    const [editFacilities, setEditFacilities] = useState<any[]>([]);
    const [editCollege, setEditCollege] = useState('');
    const [editHostelName, setEditHostelName] = useState('');
    const [editDob, setEditDob] = useState('');
    const [showEditDatePicker, setShowEditDatePicker] = useState(false);
    const [editPhone, setEditPhone] = useState('');
    const [editGoogleEmail, setEditGoogleEmail] = useState('');
    const [editCollegeEmail, setEditCollegeEmail] = useState('');
    const [editStatus, setEditStatus] = useState('active');
    const [editWifiSSID, setEditWifiSSID] = useState('');
    const [editWifiPassword, setEditWifiPassword] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [editAddress, setEditAddress] = useState('');
    const [editFatherName, setEditFatherName] = useState('');
    const [editFatherPhone, setEditFatherPhone] = useState('');
    const [editMotherName, setEditMotherName] = useState('');
    const [editMotherPhone, setEditMotherPhone] = useState('');
    const [editTotalFee, setEditTotalFee] = useState('');
    const [editDues, setEditDues] = useState('');
    const [editFeeFrequency, setEditFeeFrequency] = useState<'Monthly' | 'Semester' | 'Yearly'>('Monthly');
    const [editBloodGroup, setEditBloodGroup] = useState('');
    const [editMedicalHistory, setEditMedicalHistory] = useState('');
    const [editEmergencyContactName, setEditEmergencyContactName] = useState('');
    const [editEmergencyContactPhone, setEditEmergencyContactPhone] = useState('');
    const [editImage, setEditImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (student && visible) {
            setEditName(student.name || '');
            setEditEmail(student.email || '');
            setEditRollNo(student.rollNo || '');
            setEditRoom(student.room || '');
            setEditCollege(student.collegeName || '');
            setEditHostelName(student.hostelName || '');
            setEditDob(fromISODate(student.dob) || '');
            setEditPhone(student.phone || '');
            setEditGoogleEmail(student.googleEmail || '');
            setEditCollegeEmail(student.collegeEmail || '');
            setEditStatus(student.status || 'active');
            setEditWifiSSID(student.wifiSSID || '');
            setEditWifiPassword(student.wifiPassword || '');
            setEditPassword(student.password || student.tempPassword || '');
            setEditAddress(student.address || '');
            setEditFatherName(student.fatherName || '');
            setEditFatherPhone(student.fatherPhone || '');
            setEditMotherName(student.motherName || '');
            setEditMotherPhone(student.motherPhone || '');
            setEditTotalFee(student.totalFee ? String(student.totalFee) : '');
            setEditDues(student.dues ? String(student.dues) : '');
            setEditFeeFrequency(student.feeFrequency || 'Monthly');
            setEditBloodGroup(student.bloodGroup || '');
            setEditMedicalHistory(student.medicalHistory || '');
            setEditEmergencyContactName(student.emergencyContactName || '');
            setEditEmergencyContactPhone(student.emergencyContactPhone || '');
            setEditImage(student.profilePhoto ? (student.profilePhoto.startsWith('http') ? student.profilePhoto : `${API_BASE_URL}${student.profilePhoto}`) : null);

            // Parse Room Type
            const rt = student.roomType || '';
            if (rt.includes('BHK') || rt.includes('Studio')) {
                const parts = rt.split(' ');
                const foundApt = parts.find((p: string) => p.includes('BHK') || p === 'Studio');
                setEditApartmentType(foundApt || null);
                setEditSharingType(rt.replace(foundApt || '', '').trim() || 'Single Sharing');
            } else {
                setEditApartmentType(null);
                setEditSharingType(rt || 'Single Sharing');
            }

            // Parse Facilities
            let parsedFacilities: any[] = [];
            try {
                if (Array.isArray(student.facilities)) {
                    parsedFacilities = student.facilities;
                } else if (typeof student.facilities === 'string') {
                    parsedFacilities = JSON.parse(student.facilities);
                }
            } catch (e) {
                console.error('Error parsing facilities:', e);
            }

            const defaultFacilities = [
                { name: 'WiFi', icon: 'wifi' as const, status: 'Included' },
                { name: 'Laundry', icon: 'washing-machine' as const, status: 'Not Included' },
                { name: 'Cleaning', icon: 'broom' as const, status: 'Included' },
                { name: 'Meals', icon: 'food' as const, status: 'Included' },
                { name: 'Electricity', icon: 'lightning-bolt' as const, status: 'Included' },
                { name: 'Fridge', icon: 'fridge' as const, status: 'Not Included' },
                { name: 'Microwave', icon: 'microwave' as const, status: 'Not Included' },
                { name: 'AC', icon: 'air-conditioner' as const, status: 'Not Included' },
                { name: 'TV', icon: 'television' as const, status: 'Not Included' },
                { name: 'Induction', icon: 'stove' as const, status: 'Not Included' },
                { name: 'Cooler', icon: 'snowflake' as const, status: 'Not Included' },
                { name: 'Fan', icon: 'fan' as const, status: 'Included' },
            ];

            const merged = defaultFacilities.map(defItem => {
                const existing = parsedFacilities.find((f: any) => f.name === defItem.name);
                return existing ? { ...defItem, status: existing.status } : defItem;
            });
            setEditFacilities(merged);
        }
    }, [student, visible]);

    const fromISODate = (dateStr: string) => {
        if (!dateStr) return '';
        if (dateStr.includes('/') && dateStr.split('/')[0].length === 2) return dateStr;
        if (dateStr.includes('-')) {
            const parts = dateStr.split('-');
            if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    };

    const toISODate = (dateStr: string) => {
        if (!dateStr) return null;
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dateStr;
    };

    const pickEditImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showAlert('Permission needed', 'Sorry, we need camera roll permissions!', [], 'error');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });
        if (!result.canceled) {
            setEditImage(result.assets[0].uri);
        }
    };

    const onEditDateChange = (event: any, selectedDate?: Date) => {
        setShowEditDatePicker(false);
        if (selectedDate) {
            const day = selectedDate.getDate().toString().padStart(2, '0');
            const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
            const year = selectedDate.getFullYear();
            setEditDob(`${day}/${month}/${year}`);
        }
    };

    const handleSaveEdit = async () => {
        if (!student) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('fullName', editName);
            formData.append('rollNo', editRollNo);
            formData.append('roomNo', editRoom);
            formData.append('collegeName', editCollege);
            formData.append('hostelName', editHostelName);
            formData.append('dob', toISODate(editDob) || editDob);
            formData.append('phone', editPhone);
            formData.append('googleEmail', editGoogleEmail);
            formData.append('collegeEmail', editCollegeEmail);
            formData.append('status', editStatus);
            formData.append('wifiSSID', editWifiSSID);
            formData.append('wifiPassword', editWifiPassword);
            formData.append('address', editAddress);
            formData.append('fatherName', editFatherName);
            formData.append('fatherPhone', editFatherPhone);
            formData.append('motherName', editMotherName);
            formData.append('motherPhone', editMotherPhone);
            formData.append('totalFee', editTotalFee);
            formData.append('dues', editDues);
            formData.append('feeFrequency', editFeeFrequency);
            formData.append('bloodGroup', editBloodGroup);
            formData.append('medicalHistory', editMedicalHistory);
            formData.append('emergencyContactName', editEmergencyContactName);
            formData.append('emergencyContactPhone', editEmergencyContactPhone);
            formData.append('email', editEmail);
            formData.append('password', editPassword);

            const finalRoomType = editApartmentType ? `${editApartmentType} ${editSharingType}` : editSharingType;
            formData.append('roomType', finalRoomType);
            formData.append('facilities', JSON.stringify(editFacilities));

            if (editImage && editImage !== student.profilePhoto && !editImage.startsWith('http')) {
                // @ts-ignore
                formData.append('profilePhoto', {
                    uri: editImage,
                    name: 'profile_edit.jpg',
                    type: 'image/jpeg',
                });
            }

            await updateStudent(student.id, formData);
            onSuccess();
            showAlert('Success', 'Student details updated successfully.', [], 'success');
            onClose();
        } catch (e: any) {
            console.error(e);
            showAlert('Error', 'Failed to update student: ' + (e.response?.data?.error || e.message), [], 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!visible) return null;

    return (
        <View style={styles.modalOverlay}>
            <View style={styles.keyboardAvoidingView}>
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                    <View style={[styles.modalHeader, { paddingTop: insets.top, borderBottomColor: colors.border }]}>
                        <AppText style={[styles.modalTitle, { color: colors.text }]}>Edit Student</AppText>
                        <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.background }]}>
                            <MaterialIcons name="close" size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 20 }}>
                        {/* Profile Photo Section */}
                        <View style={styles.profilePhotoContainer}>
                            <View style={[styles.photoPlaceholder, { backgroundColor: theme === 'dark' ? '#1E293B' : '#F1F5F9' }]}>
                                {editImage ? (
                                    <Image source={{ uri: editImage }} style={styles.profilePhoto} contentFit="cover" />
                                ) : (
                                    <MaterialIcons name="account" size={40} color={colors.textSecondary} />
                                )}
                            </View>
                            <TouchableOpacity style={[styles.changePhotoBtn, { backgroundColor: theme === 'dark' ? '#1E293B' : '#F1F5F9' }]} onPress={pickEditImage}>
                                <MaterialIcons name="camera" size={16} color={colors.primary} />
                                <AppText style={[styles.changePhotoText, { color: colors.primary }]}>Change Photo</AppText>
                            </TouchableOpacity>
                        </View>

                        {[
                            { label: 'Login Email (Official ID)', value: editEmail, setter: setEditEmail, icon: 'email-outline', type: 'email-address' },
                            { label: 'Login Password', value: editPassword, setter: setEditPassword, icon: 'key' },
                            { label: 'Google Mail (For Login)', value: editGoogleEmail, setter: setEditGoogleEmail, icon: 'google', type: 'email-address' },
                            { label: 'College Email', value: editCollegeEmail, setter: setEditCollegeEmail, icon: 'email', type: 'email-address' },
                            { label: 'Full Name', value: editName, setter: setEditName, icon: 'account' },
                            { label: 'Roll No', value: editRollNo, setter: setEditRollNo, icon: 'identifier' },
                            { label: 'Room', value: editRoom, setter: setEditRoom, icon: 'door' },
                            { label: 'WiFi SSID', value: editWifiSSID, setter: setEditWifiSSID, icon: 'wifi' },
                            { label: 'WiFi Password', value: editWifiPassword, setter: setEditWifiPassword, icon: 'lock' },
                            { label: 'College Name', value: editCollege, setter: setEditCollege, icon: 'school' },
                            { label: 'Hostel Name', value: editHostelName, setter: setEditHostelName, icon: 'office-building' },
                        ].map((field, idx) => (
                            <View key={idx} style={styles.formSection}>
                                <AppText style={[styles.modalLabel, { color: colors.textSecondary }]}>{field.label}</AppText>
                                <View style={[styles.modalInputWrapper, { backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF', borderColor: theme === 'dark' ? '#334155' : '#E2E8F0' }]}>
                                    {/* @ts-ignore */}
                                    <MaterialIcons name={field.icon} size={20} color="#64748B" style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.modalInput, { color: colors.text }]}
                                        value={field.value}
                                        onChangeText={field.setter}
                                        placeholder={field.label}
                                        autoCapitalize="none"
                                        // @ts-ignore
                                        keyboardType={field.type || 'default'}
                                    />
                                </View>
                            </View>
                        ))}

                        <View style={styles.formSection}>
                            <AppText style={[styles.modalLabel, { color: colors.primary, marginBottom: 12 }]}>Room Configuration</AppText>
                            <View style={{ marginBottom: 16 }}>
                                <AppText style={[styles.modalLabel, { fontSize: 13, marginBottom: 8 }]}>Sharing Options</AppText>
                                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                                    {['Single Sharing', 'Double Sharing', 'Triple Sharing'].map((type) => (
                                        <TouchableOpacity
                                            key={type}
                                            style={{
                                                paddingHorizontal: 12,
                                                paddingVertical: 8,
                                                borderRadius: 12,
                                                backgroundColor: editSharingType === type ? colors.primary : (theme === 'dark' ? '#1E293B' : '#F1F5F9'),
                                                borderWidth: 1,
                                                borderColor: editSharingType === type ? colors.primary : colors.border
                                            }}
                                            onPress={() => setEditSharingType(type)}
                                        >
                                            <AppText style={{ color: editSharingType === type ? '#fff' : colors.textSecondary, fontWeight: '600', fontSize: 12 }}>{type}</AppText>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <AppText style={[styles.modalLabel, { fontSize: 13, marginBottom: 8 }]}>BHK / Studio Options (Optional)</AppText>
                                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                                    {['1BHK', '2BHK', '3BHK', 'Studio'].map((type) => (
                                        <TouchableOpacity
                                            key={type}
                                            style={{
                                                paddingHorizontal: 16,
                                                paddingVertical: 8,
                                                borderRadius: 12,
                                                backgroundColor: editApartmentType === type ? colors.primary : (theme === 'dark' ? '#1E293B' : '#F1F5F9'),
                                                borderWidth: 1,
                                                borderColor: editApartmentType === type ? colors.primary : colors.border
                                            }}
                                            onPress={() => setEditApartmentType(editApartmentType === type ? null : type)}
                                        >
                                            <AppText style={{ color: editApartmentType === type ? '#fff' : colors.textSecondary, fontWeight: '600', fontSize: 12 }}>{type}</AppText>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <AppText style={[styles.modalLabel, { marginTop: 4, marginBottom: 8 }]}>Facilities & Amenities</AppText>
                            <View>
                                {editFacilities.map((fac, idx) => (
                                    <View key={fac.name} style={[styles.facilityRow, { borderBottomColor: colors.border, borderBottomWidth: idx === editFacilities.length - 1 ? 0 : 1 }]}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                            <MaterialIcons name={fac.icon} size={20} color={colors.primary} />
                                            <AppText style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{fac.name}</AppText>
                                        </View>
                                        <View style={{ flexDirection: 'row', gap: 6 }}>
                                            {['Included', 'Not Included'].map((s) => (
                                                <TouchableOpacity
                                                    key={s}
                                                    onPress={() => {
                                                        const f = [...editFacilities];
                                                        f[idx].status = s as any;
                                                        setEditFacilities(f);
                                                    }}
                                                    style={{
                                                        paddingHorizontal: 12,
                                                        paddingVertical: 6,
                                                        borderRadius: 8,
                                                        backgroundColor: fac.status === s ? colors.primary : (theme === 'dark' ? '#1E293B' : '#F1F5F9'),
                                                        borderWidth: 1,
                                                        borderColor: fac.status === s ? colors.primary : colors.border
                                                    }}>
                                                    <AppText style={{ fontSize: 11, fontWeight: '700', color: fac.status === s ? '#fff' : colors.textSecondary }}>{s}</AppText>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <AppText style={styles.modalLabel}>Date of Birth</AppText>
                                <TouchableOpacity onPress={() => setShowEditDatePicker(true)} style={[styles.modalInputWrapper, { backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF', borderColor: theme === 'dark' ? '#334155' : '#E2E8F0' }]}>
                                    <MaterialIcons name="calendar-account" size={20} color="#64748B" style={styles.inputIcon} />
                                    <AppText style={[styles.modalInput, { color: editDob ? colors.text : '#94A3B8', paddingVertical: 14 }]}>{editDob || 'DD/MM/YYYY'}</AppText>
                                </TouchableOpacity>
                                {showEditDatePicker && (
                                    <DateTimePicker
                                        value={editDob && editDob.includes('/') ? new Date(editDob.split('/').reverse().join('-')) : new Date()}
                                        mode="date"
                                        display="default"
                                        onChange={onEditDateChange}
                                        maximumDate={new Date()}
                                    />
                                )}
                            </View>
                            <View style={{ flex: 1 }}>
                                <AppText style={styles.modalLabel}>Phone</AppText>
                                <View style={[styles.modalInputWrapper, { backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF', borderColor: theme === 'dark' ? '#334155' : '#E2E8F0' }]}>
                                    <MaterialIcons name="phone" size={20} color="#64748B" style={styles.inputIcon} />
                                    <TextInput style={[styles.modalInput, { color: colors.text }]} value={editPhone} onChangeText={setEditPhone} keyboardType="phone-pad" placeholder="Phone" />
                                </View>
                            </View>
                        </View>

                        <View style={styles.formSection}>
                            <AppText style={styles.modalLabel}>Address</AppText>
                            <View style={[styles.modalInputWrapper, { backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF', borderColor: theme === 'dark' ? '#334155' : '#E2E8F0', height: 'auto', minHeight: 56 }]}>
                                <MaterialIcons name="map-marker" size={20} color="#64748B" style={styles.inputIcon} />
                                <TextInput style={[styles.modalInput, { color: colors.text }]} value={editAddress} onChangeText={setEditAddress} placeholder="Permanent Address" multiline />
                            </View>
                        </View>

                        {[
                            { label: "Father's Name", value: editFatherName, setter: setEditFatherName, icon: 'account-tie' },
                            { label: "Father's Phone", value: editFatherPhone, setter: setEditFatherPhone, icon: 'phone', type: 'phone-pad' },
                            { label: "Mother's Name", value: editMotherName, setter: setEditMotherName, icon: 'face-woman' },
                            { label: "Mother's Phone", value: editMotherPhone, setter: setEditMotherPhone, icon: 'phone', type: 'phone-pad' },
                            { label: 'Total Fee', value: editTotalFee, setter: setEditTotalFee, icon: 'cash-multiple', type: 'numeric' },
                            { label: 'Current Dues', value: editDues, setter: setEditDues, icon: 'cash-register', type: 'numeric' },
                        ].map((field, idx) => (
                            <View key={idx} style={{ marginTop: 12 }}>
                                <AppText style={styles.modalLabel}>{field.label}</AppText>
                                <View style={[styles.modalInputWrapper, { backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF', borderColor: theme === 'dark' ? '#334155' : '#E2E8F0' }]}>
                                    {/* @ts-ignore */}
                                    <MaterialIcons name={field.icon} size={20} color="#64748B" style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.modalInput, { color: colors.text }]}
                                        value={field.value}
                                        onChangeText={field.setter}
                                        placeholder={field.label}
                                        // @ts-ignore
                                        keyboardType={field.type || 'default'}
                                    />
                                </View>
                            </View>
                        ))}

                        <View style={[styles.formSection, { marginTop: 12 }]}>
                            <AppText style={styles.modalLabel}>Fee Frequency</AppText>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {(['Monthly', 'Semester', 'Yearly'] as const).map((freq) => (
                                    <TouchableOpacity
                                        key={freq}
                                        style={{
                                            flex: 1,
                                            paddingVertical: 8,
                                            backgroundColor: editFeeFrequency === freq ? colors.primary : (theme === 'dark' ? '#1E293B' : '#F1F5F9'),
                                            borderRadius: 8,
                                            alignItems: 'center',
                                            borderWidth: 1,
                                            borderColor: editFeeFrequency === freq ? colors.primary : colors.border
                                        }}
                                        onPress={() => setEditFeeFrequency(freq)}
                                    >
                                        <AppText style={{ fontSize: 12, fontWeight: '600', color: editFeeFrequency === freq ? '#fff' : colors.textSecondary }}>{freq}</AppText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.formSection}>
                            <AppText style={[styles.modalLabel, { color: colors.primary, marginTop: 12 }]}>Medical Info (Optional)</AppText>
                            <View>
                                <AppText style={styles.modalLabel}>Blood Group</AppText>
                                <View style={[styles.modalInputWrapper, { backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF', borderColor: theme === 'dark' ? '#334155' : '#E2E8F0' }]}>
                                    <MaterialIcons name="water" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                                    <TextInput style={[styles.modalInput, { color: colors.text }]} value={editBloodGroup} onChangeText={setEditBloodGroup} placeholder="e.g. O+" />
                                </View>
                            </View>
                            <View style={{ marginTop: 12 }}>
                                <AppText style={styles.modalLabel}>Emergency Contact Name</AppText>
                                <View style={[styles.modalInputWrapper, { backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF', borderColor: theme === 'dark' ? '#334155' : '#E2E8F0' }]}>
                                    <MaterialIcons name="account-alert" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                                    <TextInput style={[styles.modalInput, { color: colors.text }]} value={editEmergencyContactName} onChangeText={setEditEmergencyContactName} placeholder="Contact Name" />
                                </View>
                            </View>
                            <View style={{ marginTop: 12 }}>
                                <AppText style={styles.modalLabel}>Emergency Phone</AppText>
                                <View style={[styles.modalInputWrapper, { backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF', borderColor: theme === 'dark' ? '#334155' : '#E2E8F0' }]}>
                                    <MaterialIcons name="phone-alert" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                                    <TextInput style={[styles.modalInput, { color: colors.text }]} value={editEmergencyContactPhone} onChangeText={setEditEmergencyContactPhone} placeholder="Phone" keyboardType="phone-pad" />
                                </View>
                            </View>
                            <View style={{ marginTop: 12 }}>
                                <AppText style={styles.modalLabel}>Medical History / Allergies</AppText>
                                <View style={[styles.modalInputWrapper, { backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF', borderColor: theme === 'dark' ? '#334155' : '#E2E8F0', height: 'auto', minHeight: 80, paddingVertical: 8, alignItems: 'flex-start' }]}>
                                    <MaterialIcons name="medical-bag" size={20} color={colors.textSecondary} style={[styles.inputIcon, { marginTop: 4 }]} />
                                    <TextInput
                                        style={[styles.modalInput, { color: colors.text, textAlignVertical: 'top' }]}
                                        value={editMedicalHistory}
                                        onChangeText={setEditMedicalHistory}
                                        placeholder="Any known allergies or conditions..."
                                        multiline
                                        numberOfLines={3}
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.formSection}>
                            <AppText style={styles.modalLabel}>Status</AppText>
                            <View style={[styles.modalInputWrapper, { backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF', borderColor: theme === 'dark' ? '#334155' : '#E2E8F0', justifyContent: 'space-between', paddingRight: 8 }]}>
                                <AppText style={{ fontSize: 14, fontWeight: '600', color: editStatus === 'active' ? '#16A34A' : '#EF4444' }}>{editStatus === 'active' ? 'Active' : 'Inactive'}</AppText>
                                <Switch
                                    trackColor={{ false: "#FEE2E2", true: "#DCFCE7" }}
                                    thumbColor={editStatus === 'active' ? "#16A34A" : "#EF4444"}
                                    onValueChange={(val) => setEditStatus(val ? 'active' : 'inactive')}
                                    value={editStatus === 'active'}
                                />
                            </View>
                        </View>
                    </ScrollView>
                    <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                        <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn, { backgroundColor: colors.background }]} onPress={onClose}>
                            <AppText style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</AppText>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleSaveEdit} disabled={loading}>
                            <LinearGradient colors={['#004e92', '#000428']} style={styles.saveBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                <AppText style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save Changes'}</AppText>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        zIndex: 1000,
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyboardAvoidingView: {
        width: '100%',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        borderRadius: 24,
        width: '90%',
        height: Dimensions.get('window').height * 0.85,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 20,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
    },
    closeBtn: {
        padding: 4,
        borderRadius: 20,
    },
    modalBody: {
        flex: 1,
        padding: 24,
    },
    formSection: {
        marginBottom: 16,
    },
    modalLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
    },
    modalInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 1.5,
        height: 56,
        paddingHorizontal: 16,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    inputIcon: {
        marginRight: 12,
    },
    modalInput: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
    },
    profilePhotoContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    profilePhoto: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    photoPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    changePhotoBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    changePhotoText: {
        fontSize: 13,
        fontWeight: '600',
    },
    modalFooter: {
        padding: 24,
        borderTopWidth: 1,
        flexDirection: 'row',
        gap: 12,
    },
    modalBtn: {
        flex: 1,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
    },
    cancelBtn: {},
    cancelBtnText: {
        fontWeight: '700',
        fontSize: 14,
    },
    saveBtn: {
        overflow: 'hidden',
    },
    saveBtnGradient: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    facilityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
    },
});
