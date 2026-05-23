import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, TouchableOpacity, View, Modal, TextInput, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../utils/ThemeContext';
import { useAlert } from '../../context/AlertContext';
import api from '../../utils/api';
import AppText from '../../components/AppText';

export default function TwoFactorAuth() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();

  const [loading, setLoading] = useState(true);
  const [appEnabled, setAppEnabled] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [setupToken, setSetupToken] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);

  const [showSmsSetupModal, setShowSmsSetupModal] = useState(false);
  const [showSmsVerifyModal, setShowSmsVerifyModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => { fetch2FAStatus(); }, []);

  const fetch2FAStatus = async () => {
    try { 
      const response = await api.get('/auth/2fa/status'); 
      setAppEnabled(response.data.enabled); 
      setSmsEnabled(response.data.smsEnabled);
    } catch (e) { console.error('Failed to load 2FA status:', e); } finally { setLoading(false); }
  };

  const handleSmsToggle = async (value: boolean) => {
    if (value) {
      setShowSmsSetupModal(true);
    } else {
      try {
        await api.post('/auth/2fa/sms/disable'); 
        setSmsEnabled(false);
        showAlert('Success', 'SMS Two-Factor Authentication is disabled.', [], 'success');
      } catch (e: any) {
        showAlert('Error', e.response?.data?.error || 'Failed to disable SMS 2FA');
        setSmsEnabled(true);
      }
    }
  };

  const startSmsSetup = async () => {
    if (!phoneNumber || phoneNumber.length < 10) { showAlert('Error', 'Please enter a valid phone number'); return; }
    try {
      setSetupLoading(true);
      await api.post('/auth/2fa/sms/generate', { phoneNumber });
      setShowSmsSetupModal(false);
      setShowSmsVerifyModal(true);
    } catch (e: any) {
      showAlert('Error', e.response?.data?.error || 'Failed to start SMS setup');
    } finally {
      setSetupLoading(false);
    }
  };

  const verifyAndEnableSms = async () => {
    if (!setupToken || setupToken.length < 6) { showAlert('Error', 'Please enter a valid 6-digit code'); return; }
    try {
      setSetupLoading(true);
      await api.post('/auth/2fa/sms/verify', { token: setupToken, phoneNumber });
      setSmsEnabled(true);
      setShowSmsVerifyModal(false);
      setSetupToken('');
      showAlert('Success', 'SMS Two-Factor Authentication is now enabled.', [], 'success');
    } catch (e: any) {
      showAlert('Verification Failed', e.response?.data?.error || 'Failed to verify token');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleAppToggle = async (value: boolean) => {
    if (value) {
      setShowSetupModal(true);
      setQrCodeUrl(null);
      try { setSetupLoading(true); const response = await api.post('/auth/2fa/generate'); setQrCodeUrl(response.data.qrCodeUrl); } catch (e) { setShowSetupModal(false); showAlert('Error', 'Failed to start 2FA setup'); } finally { setSetupLoading(false); }
    } else { 
      try {
        await api.post('/auth/2fa/disable');
        setAppEnabled(false);
        showAlert('Success', 'Two-Factor Authentication is disabled.', [], 'success');
      } catch (e: any) {
        showAlert('Error', e.response?.data?.error || 'Failed to disable 2FA');
        setAppEnabled(true);
      }
    }
  };

  const verifyAndEnable = async () => {
    if (!setupToken || setupToken.length < 6) { showAlert('Error', 'Please enter a valid 6-digit code'); return; }
    try { setSetupLoading(true); await api.post('/auth/2fa/verify', { token: setupToken }); setAppEnabled(true); setShowSetupModal(false); setSetupToken(''); showAlert('Success', 'Two-Factor Authentication is now enabled.', [], 'success'); } catch (e: any) { showAlert('Verification Failed', e.response?.data?.error || 'Failed to verify token'); } finally { setSetupLoading(false); }
  };

  if (loading) return <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color="#004e92" /></View>;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#000428', '#004e92']} style={[styles.header, { paddingTop: insets.top + 10 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><MaterialCommunityIcons name="arrow-left" size={22} color="#fff" /></TouchableOpacity>
          <AppText style={styles.headerTitle}>Two-Factor Auth</AppText>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.heroIconWrap, { backgroundColor: isDark ? '#0F172A' : '#EFF6FF' }]}>
            <LinearGradient colors={['#004e92', '#000428']} style={styles.heroIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <MaterialCommunityIcons name="shield-lock" size={32} color="#fff" />
            </LinearGradient>
          </View>
          <AppText style={[styles.heroTitle, { color: colors.text }]}>Secure Your Account</AppText>
          <AppText style={[styles.heroSub, { color: colors.textSecondary }]}>
            Two-factor authentication adds an extra layer of security. You'll need a code in addition to your password when logging in.
          </AppText>
        </View>

        {/* Status Banner */}
        <View style={[styles.statusBanner, {
          backgroundColor: appEnabled ? (isDark ? '#052e16' : '#F0FDF4') : (isDark ? '#1c1917' : '#FFF7ED'),
          borderColor: appEnabled ? (isDark ? '#166534' : '#BBF7D0') : (isDark ? '#451a03' : '#FED7AA'),
        }]}>
          <MaterialCommunityIcons name={appEnabled ? 'shield-check' : 'shield-alert-outline'} size={20} color={appEnabled ? '#10B981' : '#F59E0B'} />
          <AppText style={[styles.statusText, { color: appEnabled ? (isDark ? '#4ADE80' : '#166534') : (isDark ? '#FCD34D' : '#92400E') }]}>
            {appEnabled ? '2FA is active — your account is protected' : '2FA is disabled — enable it for better security'}
          </AppText>
        </View>

        {/* SMS Option */}
        <AppText style={[styles.secTitle, { color: colors.textSecondary }]}>AUTHENTICATION METHODS</AppText>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.optionRow}>
            <View style={[styles.optIcon, { backgroundColor: 'rgba(59,130,246,0.1)' }]}><MaterialCommunityIcons name="message-text-lock-outline" size={22} color="#3B82F6" /></View>
            <View style={styles.optInfo}>
              <AppText style={[styles.optTitle, { color: colors.text }]}>Text Message (SMS)</AppText>
              <AppText style={[styles.optDesc, { color: colors.textSecondary }]}>Receive a code via SMS to your phone</AppText>
            </View>
            <Switch value={smsEnabled} onValueChange={handleSmsToggle} trackColor={{ false: colors.border, true: '#60A5FA' }} thumbColor={smsEnabled ? '#004e92' : '#f4f3f4'} />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.optionRow}>
            <View style={[styles.optIcon, { backgroundColor: 'rgba(16,185,129,0.1)' }]}><MaterialCommunityIcons name="cellphone-key" size={22} color="#10B981" /></View>
            <View style={styles.optInfo}>
              <AppText style={[styles.optTitle, { color: colors.text }]}>Authenticator App</AppText>
              <AppText style={[styles.optDesc, { color: colors.textSecondary }]}>Use Google Authenticator or Authy</AppText>
            </View>
            <Switch value={appEnabled} onValueChange={handleAppToggle} trackColor={{ false: colors.border, true: '#60A5FA' }} thumbColor={appEnabled ? '#004e92' : '#f4f3f4'} />
          </View>
        </View>

        {(smsEnabled || appEnabled) && (
          <TouchableOpacity style={[styles.backupBtn, { backgroundColor: isDark ? '#0F172A' : '#EFF6FF', borderColor: isDark ? '#1e3a5f' : '#BFDBFE' }]}>
            <MaterialCommunityIcons name="download-outline" size={20} color="#004e92" /><AppText style={styles.backupText}>Download Backup Codes</AppText>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Setup Modal */}
      <Modal visible={showSetupModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <AppText style={[styles.modalTitle, { color: colors.text }]}>Setup Authenticator</AppText>
            <AppText style={[styles.modalDesc, { color: colors.textSecondary }]}>Scan this QR code with your Authenticator App, then enter the 6-digit code below.</AppText>
            {qrCodeUrl ? <Image source={{ uri: qrCodeUrl }} style={{ width: 200, height: 200, marginVertical: 20 }} /> : <ActivityIndicator style={{ marginVertical: 40 }} />}
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]} placeholder="000000" placeholderTextColor={colors.textSecondary} keyboardType="number-pad" maxLength={6} value={setupToken} onChangeText={setSetupToken} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => { setShowSetupModal(false); setAppEnabled(false); }}><AppText style={styles.modalBtnTextCancel}>Cancel</AppText></TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnPrimary} onPress={verifyAndEnable} disabled={setupLoading}>{setupLoading ? <ActivityIndicator color="#fff" /> : <AppText style={styles.modalBtnTextPrimary}>Verify</AppText>}</TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SMS Setup Modal (Phone Input) */}
      <Modal visible={showSmsSetupModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <AppText style={[styles.modalTitle, { color: colors.text }]}>Setup SMS 2FA</AppText>
            <AppText style={[styles.modalDesc, { color: colors.textSecondary }]}>Enter your phone number with country code (e.g., +1234567890).</AppText>
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background, marginTop: 20, letterSpacing: 1 }]} placeholder="+1234567890" placeholderTextColor={colors.textSecondary} keyboardType="phone-pad" value={phoneNumber} onChangeText={setPhoneNumber} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => { setShowSmsSetupModal(false); setSmsEnabled(false); }}><AppText style={styles.modalBtnTextCancel}>Cancel</AppText></TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnPrimary} onPress={startSmsSetup} disabled={setupLoading}>{setupLoading ? <ActivityIndicator color="#fff" /> : <AppText style={styles.modalBtnTextPrimary}>Next</AppText>}</TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SMS Verify Modal */}
      <Modal visible={showSmsVerifyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <AppText style={[styles.modalTitle, { color: colors.text }]}>Verify Phone</AppText>
            <AppText style={[styles.modalDesc, { color: colors.textSecondary }]}>Enter the 6-digit code sent to your phone.</AppText>
            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background, marginTop: 20 }]} placeholder="000000" placeholderTextColor={colors.textSecondary} keyboardType="number-pad" maxLength={6} value={setupToken} onChangeText={setSetupToken} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => { setShowSmsVerifyModal(false); setSmsEnabled(false); }}><AppText style={styles.modalBtnTextCancel}>Cancel</AppText></TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnPrimary} onPress={verifyAndEnableSms} disabled={setupLoading}>{setupLoading ? <ActivityIndicator color="#fff" /> : <AppText style={styles.modalBtnTextPrimary}>Verify</AppText>}</TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  hero: { alignItems: 'center', marginBottom: 20, gap: 8 },
  heroIconWrap: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  heroIcon: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  heroTitle: { fontSize: 22, fontWeight: '800', letterSpacing: 0.3 },
  heroSub: { fontSize: 14, textAlign: 'center', lineHeight: 21, paddingHorizontal: 10 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  statusText: { fontSize: 13, fontWeight: '600', flex: 1 },
  secTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 1.1, marginBottom: 10, marginLeft: 4 },
  card: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', shadowColor: '#004e92', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  optionRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  optIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  optInfo: { flex: 1 },
  optTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  optDesc: { fontSize: 12, lineHeight: 17 },
  divider: { height: 1, marginLeft: 74 },
  backupBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, gap: 8, marginTop: 16, borderRadius: 16, borderWidth: 1 },
  backupText: { color: '#004e92', fontWeight: '600', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', borderRadius: 24, padding: 24, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 10 },
  modalDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  input: { width: '100%', height: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, fontSize: 20, letterSpacing: 4, textAlign: 'center', marginBottom: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 12 },
  modalBtnCancel: { flex: 1, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },
  modalBtnTextCancel: { color: '#64748b', fontWeight: '600', fontSize: 16 },
  modalBtnPrimary: { flex: 1, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: '#004e92' },
  modalBtnTextPrimary: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
