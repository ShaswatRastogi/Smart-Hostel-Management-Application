import MaterialIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../../context/AlertContext';
import { isAdmin, useUser } from '../../utils/authUtils';
import AppText from '../../components/AppText';

const InputField = React.memo(({ label, icon, value, onChangeText, placeholder, keyboardType = 'default', required = false, hasSubmitted }: any) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.inputContainer}>
      <AppText style={[
        styles.label,
        isFocused && { color: '#004e92' } // Removed fontWeight change
      ]}>
        {label} {required && <AppText style={{ color: '#EF4444' }}>*</AppText>}
      </AppText>
      <View style={[
        styles.inputWrapper,
        isFocused && styles.inputWrapperFocused,
        hasSubmitted && required && !value && { borderColor: '#EF4444', borderWidth: 1 }
      ]}>
        <MaterialIcons
          name={icon}
          size={20}
          color={isFocused ? "#004e92" : "#64748B"}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize="none"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </View>
      {hasSubmitted && required && !value && (
        <AppText style={styles.errorText}>{label} is required</AppText>
      )}
    </View>
  );
});

export default function StudentAllotmentPage() {
  const user = useUser();
  const router = useRouter();
  const { showAlert } = useAlert();
  const [fullName, setFullName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [hostelName, setHostelName] = useState('');
  const [age, setAge] = useState('');
  const [room, setRoom] = useState('');
  const [emailUsername, setEmailUsername] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [totalFee, setTotalFee] = useState('');
  const [feeFrequency, setFeeFrequency] = useState<'Monthly' | 'Quarterly' | 'Yearly'>('Monthly');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [sharingType, setSharingType] = useState('Single Sharing');
  const [apartmentType, setApartmentType] = useState<string | null>(null);
  const [wifiSSID, setWifiSSID] = useState('Hostel_WiFi');
  const [wifiPassword, setWifiPassword] = useState('');
  const [facilities, setFacilities] = useState<any[]>([
    { name: 'WiFi', icon: 'wifi', status: 'Included' },
    { name: 'Laundry', icon: 'washing-machine', status: 'Not Included' },
    { name: 'Electricity', icon: 'lightning-bolt', status: 'Included' },
    { name: 'Fridge', icon: 'fridge', status: 'Not Included' },
    { name: 'Microwave', icon: 'microwave', status: 'Not Included' },
    { name: 'AC', icon: 'air-conditioner', status: 'Not Included' },
    { name: 'TV', icon: 'television', status: 'Not Included' },
    { name: 'Induction', icon: 'stove', status: 'Not Included' },
    { name: 'Cooler', icon: 'snowflake', status: 'Not Included' },
    { name: 'Fan', icon: 'fan', status: 'Included' },
    { name: 'Cleaning', icon: 'broom', status: 'Included' },
    { name: 'Bed', icon: 'bed', status: 'Included' },
  ]);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  React.useEffect(() => {
    // Generate a secure random password on mount
    const pwd = Math.random().toString(36).slice(-8); // 8 chars
    setGeneratedPassword(pwd);

    AsyncStorage.getItem('hostel_domain').then(d => {
      if (d) setEmailDomain(d);
    });
  }, []);

  const handleSubmit = async () => {
    setHasSubmitted(true);

    const domainStr = emailDomain.trim().startsWith('@') ? emailDomain.trim() : (emailDomain.trim() ? `@${emailDomain.trim()}` : '');
    const finalEmail = emailUsername && domainStr ? `${emailUsername.trim()}${domainStr}` : '';

    if (!fullName || !rollNo || !collegeName || !hostelName || !age || !room || !finalEmail || !phone) {
      showAlert('Missing details', 'Please fill all mandatory fields (marked red).', [], 'error');
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      showAlert('Invalid Phone', 'Phone number must be exactly 10 digits.', [], 'error');
      return;
    }

    try {
      if (emailDomain) {
        await AsyncStorage.setItem('hostel_domain', emailDomain);
      }

      const { default: api } = await import('../../utils/api');


      const data = {
        fullName,
        email: finalEmail,
        password: generatedPassword,
        rollNo,
        collegeName,
        hostelName,
        dob: age ? new Date(new Date().setFullYear(new Date().getFullYear() - parseInt(age))).toISOString() : undefined,
        roomNo: room,
        phone,
        status,
        wifiSSID: wifiSSID,
        feeFrequency,
        roomType: apartmentType ? `${apartmentType} ${sharingType}` : sharingType,
        facilities, // Send as array/object directly
        totalFee: parseFloat(totalFee) || 0,
        dues: 0,
        hostelFee: 0,
        messFee: 0,
        address: '',
        fatherName: '',
        fatherPhone: '',
        motherName: '',
        motherPhone: '',
        bloodGroup: '',
        medicalHistory: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        wifiPassword: wifiPassword,
        profilePhoto: null
      };

      await api.post('/students/allot', data);

      showAlert(
        'Success',
        `Student allotted to Room ${room}.\n\nLogin Password: ${generatedPassword}\n\nPlease share this with the student.`,
        [
          { text: 'Copy & Close', onPress: () => router.replace('/admin/students') }
        ],
        'success'
      );
    } catch (error: any) {
      console.error(error);
      let msg = 'Failed to allot student.';
      if (error.response?.data?.error) {
        msg = error.response.data.error;
      }
      showAlert('Error', msg, [], 'error');
    }
  };

  if (!isAdmin(user))
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <AppText>Access denied.</AppText>
      </View>
    );

  return (
    <View style={styles.mainContainer}>
      <LinearGradient
        colors={['#000428', '#004e92']}
        style={styles.headerBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/admin/students')} style={styles.backButton}>
            <MaterialIcons name="arrow-left" size={28} color="#fff" />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>New Allotment</AppText>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Navigation Tabs */}
          <View style={styles.navBar}>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => router.replace('/admin/students')}
            >
              <MaterialIcons name="account-group" size={20} color="#64748B" />
              <AppText style={styles.navItemLabel}>Students</AppText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
              <MaterialIcons name="account-plus" size={20} color="#004e92" />
              <AppText style={[styles.navItemLabel, styles.navItemLabelActive]}>Allotment</AppText>
            </TouchableOpacity>
          </View>

          {/* Generator Card */}
          <View style={[styles.card, styles.generatorCard]}>
            <View style={styles.generatorHeader}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="key-variant" size={20} color="#16A34A" />
              </View>
              <View>
                <AppText style={styles.generatorTitle}>Login Credentials</AppText>
                <AppText style={styles.generatorSubtitle}>Share this with the student</AppText>
              </View>
            </View>
            <View style={styles.passwordBox}>
              <AppText style={styles.passwordLabel}>Generated Password</AppText>
              <AppText style={styles.passwordValue}>{generatedPassword}</AppText>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <AppText style={styles.sectionTitle}>Student Details</AppText>

            <InputField
              label="Full Name"
              icon="account"
              value={fullName}
              onChangeText={setFullName}
              placeholder="e.g. John Doe"
              required
              hasSubmitted={hasSubmitted}
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <InputField
                  label="Roll No"
                  icon="identifier"
                  value={rollNo}
                  onChangeText={setRollNo}
                  placeholder="e.g. CS-24-001"
                  required
                  hasSubmitted={hasSubmitted}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <InputField
                  label="Room"
                  icon="door"
                  value={room}
                  onChangeText={setRoom}
                  placeholder="e.g. 101"
                  required
                  hasSubmitted={hasSubmitted}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1.5, marginRight: 8 }}>
                <InputField
                  label="Email Username"
                  icon="account"
                  value={emailUsername}
                  onChangeText={setEmailUsername}
                  placeholder="e.g. john"
                  required
                  hasSubmitted={hasSubmitted}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <InputField
                  label="Hostel Domain"
                  icon="at"
                  value={emailDomain}
                  onChangeText={setEmailDomain}
                  placeholder="@college.edu"
                  required
                  hasSubmitted={hasSubmitted}
                />
              </View>
            </View>

            <InputField
              label="Phone Number"
              icon="phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
              required
              hasSubmitted={hasSubmitted}
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <InputField
                  label="Age"
                  icon="calendar-account"
                  value={age}
                  onChangeText={setAge}
                  placeholder="Years"
                  keyboardType="numeric"
                  required
                  hasSubmitted={hasSubmitted}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <View style={styles.inputContainer}>
                  <AppText style={styles.label}>Status</AppText>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons name="toggle-switch" size={20} color={status === 'active' ? '#16A34A' : '#64748B'} style={styles.inputIcon} />
                    <Picker
                      selectedValue={status}
                      style={{ flex: 1, color: '#1E293B', marginLeft: -8 }}
                      onValueChange={(v) => setStatus(v as 'active' | 'inactive')}
                    >
                      <Picker.Item label="Active" value="active" />
                      <Picker.Item label="Inactive" value="inactive" />
                    </Picker>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Room Configuration Card */}
          <View style={styles.card}>
            <AppText style={styles.sectionTitle}>Room Configuration</AppText>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                 <InputField label="WiFi SSID" icon="wifi" value={wifiSSID} onChangeText={setWifiSSID} placeholder="e.g. Hostel_WiFi" hasSubmitted={hasSubmitted} />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                 <InputField label="WiFi Password" icon="lock" value={wifiPassword} onChangeText={setWifiPassword} placeholder="Password" hasSubmitted={hasSubmitted} />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <AppText style={[styles.label, { fontSize: 13, marginBottom: 8 }]}>Sharing Options</AppText>
              <View style={[styles.typeContainer, { marginBottom: 12 }]}>
                {['Single Sharing', 'Double Sharing', 'Triple Sharing'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeChip, sharingType === type && styles.typeChipActive]}
                    onPress={() => setSharingType(type)}
                  >
                    <AppText style={[styles.typeChipText, sharingType === type && styles.typeChipTextActive, { fontSize: 12 }]}>{type}</AppText>
                  </TouchableOpacity>
                ))}
              </View>

              <AppText style={[styles.label, { fontSize: 13, marginBottom: 8 }]}>BHK / Studio Options (Optional)</AppText>
              <View style={styles.typeContainer}>
                {['1BHK', '2BHK', '3BHK', 'Studio'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeChip, apartmentType === type && styles.typeChipActive]}
                    onPress={() => setApartmentType(apartmentType === type ? null : type)}
                  >
                    <AppText style={[styles.typeChipText, apartmentType === type && styles.typeChipTextActive, { fontSize: 12 }]}>{type}</AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <AppText style={[styles.label, { marginTop: 8 }]}>Facilities & Amenities</AppText>
            <View style={{ marginTop: 8 }}>
              {facilities.map((facility, index) => (
                <View key={facility.name} style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 8,
                  borderBottomWidth: index === facilities.length - 1 ? 0 : 1,
                  borderBottomColor: '#F1F5F9'
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <MaterialIcons name={facility.icon} size={20} color="#004e92" />
                    <AppText style={{ fontSize: 15, fontWeight: '500', color: '#1E293B' }}>{facility.name}</AppText>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 12,
                        backgroundColor: facility.status === 'Included' ? '#004e92' : '#F8FAFC',
                        borderWidth: 1,
                        borderColor: facility.status === 'Included' ? '#004e92' : '#E2E8F0'
                      }}
                      onPress={() => {
                        const newFac = [...facilities];
                        newFac[index].status = 'Included';
                        setFacilities(newFac);
                      }}
                    >
                      <AppText style={{ fontSize: 11, fontWeight: '700', color: facility.status === 'Included' ? '#fff' : '#64748B' }}>Included</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 12,
                        backgroundColor: facility.status === 'Not Included' ? '#004e92' : '#F8FAFC',
                        borderWidth: 1,
                        borderColor: facility.status === 'Not Included' ? '#004e92' : '#E2E8F0'
                      }}
                      onPress={() => {
                        const newFac = [...facilities];
                        newFac[index].status = 'Not Included';
                        setFacilities(newFac);
                      }}
                    >
                      <AppText style={{ fontSize: 11, fontWeight: '700', color: facility.status === 'Not Included' ? '#fff' : '#64748B' }}>Not Included</AppText>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>


          {/* Details & Fees Card */}
          <View style={styles.card}>
            <AppText style={styles.sectionTitle}>College & Fees</AppText>

            <InputField
              label="College Name"
              icon="school"
              value={collegeName}
              onChangeText={setCollegeName}
              placeholder="e.g. Engineering College"
              required
              hasSubmitted={hasSubmitted}
            />

            <InputField
              label="Hostel Name"
              icon="office-building"
              value={hostelName}
              onChangeText={setHostelName}
              placeholder="e.g. Block A"
              required
              hasSubmitted={hasSubmitted}
            />

            <View style={styles.divider} />

            <AppText style={styles.sectionTitle}>Fee Structure</AppText>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <InputField
                  label="Total Annual Fee"
                  icon="cash-multiple"
                  value={totalFee}
                  onChangeText={setTotalFee}
                  placeholder="0.00"
                  keyboardType="numeric"
                  hasSubmitted={hasSubmitted}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <AppText style={styles.label}>Payment Frequency</AppText>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="calendar-clock" size={20} color={feeFrequency ? '#004e92' : '#64748B'} style={styles.inputIcon} />
                <Picker
                  selectedValue={feeFrequency}
                  style={{ flex: 1, color: '#1E293B', marginLeft: -8 }}
                  onValueChange={(v) => setFeeFrequency(v as any)}
                >
                  <Picker.Item label="Monthly" value="Monthly" />
                  <Picker.Item label="Quarterly" value="Quarterly" />
                  <Picker.Item label="Yearly" value="Yearly" />
                </Picker>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <LinearGradient
              colors={['#004e92', '#000428']}
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <AppText style={styles.submitButtonText}>Confirm Allotment</AppText>
              <MaterialIcons name="check-circle-outline" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView >
      </SafeAreaView >
    </View >
  );
}


const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  headerBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 120, // Extended header background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
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
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 6,
    marginTop: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  navItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  navItemActive: {
    backgroundColor: '#EFF6FF',
  },
  navItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  navItemLabelActive: {
    color: '#004e92',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#64748B',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  generatorCard: {
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderLeftColor: '#16A34A',
  },
  generatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  generatorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  generatorSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  passwordBox: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  passwordLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    color: '#15803D',
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 1,
  },
  passwordValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#166534',
    letterSpacing: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    height: 56,
    paddingHorizontal: 16,
  },
  inputWrapperFocused: {
    borderColor: '#004e92',
    backgroundColor: '#F0F9FF',
    // Removed elevation and shadow to prevent flickering on focus
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    height: '100%',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 24,
  },
  submitButton: {
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#004e92',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  typeChip: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  typeChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#004e92',
  },
  typeChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  typeChipTextActive: {
    color: '#004e92',
    fontWeight: '700',
  },
  facilitiesGrid: {
    marginTop: 8,
    gap: 12,
  },
  facilityCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  facilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  facilityName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  facilityStatusContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  statusChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  statusChipActive: {
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  statusChipTextActive: {
    color: '#004e92',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
