import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, View, Modal, TextInput, ActivityIndicator, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../../context/AlertContext';
import { useTheme } from '../../utils/ThemeContext';
import api from '../../utils/api';
import AppText from '../../components/AppText';

export default function TwoFactorAuth() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { isDark } = useTheme();

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

  // Dynamic Theme Map
  const themeBg = isDark ? '#000000' : '#F8FAFC';
  const textMain = isDark ? '#FFFFFF' : '#111111';
  const textMuted = isDark ? '#888888' : '#64748B';
  const borderSubtle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const pillBg = isDark ? '#111111' : '#E2E8F0';
  const dotInactive = isDark ? '#444444' : '#94A3B8';
  const thumbFalse = isDark ? '#888888' : '#FFFFFF';
  const trackFalse = isDark ? '#222222' : '#CBD5E1';
  const modalBg = isDark ? '#111111' : '#FFFFFF';
  const btnCancelBg = isDark ? '#222222' : '#E2E8F0';
  const btnCancelText = isDark ? '#FFFFFF' : '#000000';
  const btnPrimaryBg = isDark ? '#FFFFFF' : '#111111';
  const btnPrimaryText = isDark ? '#000000' : '#FFFFFF';
  const modalBorderColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';

  useEffect(() => { fetch2FAStatus(); }, []);

  const fetch2FAStatus = async () => {
    try { const response = await api.get('/auth/2fa/status'); setAppEnabled(response.data.enabled); setSmsEnabled(response.data.smsEnabled); }
    catch (e) {} finally { setLoading(false); }
  };

  const handleSmsToggle = async (value: boolean) => {
    if (value) { setShowSmsSetupModal(true); } else {
      try { await api.post('/auth/2fa/sms/disable'); setSmsEnabled(false); } catch (e: any) { showAlert('Error', e.response?.data?.error || 'Failed to disable SMS 2FA'); setSmsEnabled(true); }
    }
  };

  const startSmsSetup = async () => {
    if (!phoneNumber || phoneNumber.length < 10) return showAlert('Error', 'Please enter a valid phone number');
    try { setSetupLoading(true); await api.post('/auth/2fa/sms/generate', { phoneNumber }); setShowSmsSetupModal(false); setShowSmsVerifyModal(true); }
    catch (e: any) { showAlert('Error', e.response?.data?.error || 'Failed to start SMS setup'); } finally { setSetupLoading(false); }
  };

  const verifyAndEnableSms = async () => {
    if (!setupToken || setupToken.length < 6) return showAlert('Error', 'Please enter a valid 6-digit code');
    try { setSetupLoading(true); await api.post('/auth/2fa/sms/verify', { token: setupToken, phoneNumber }); setSmsEnabled(true); setShowSmsVerifyModal(false); setSetupToken(''); }
    catch (e: any) { showAlert('Verification Failed', e.response?.data?.error || 'Failed to verify token'); } finally { setSetupLoading(false); }
  };

  const handleAppToggle = async (value: boolean) => {
    if (value) {
      setShowSetupModal(true); setQrCodeUrl(null);
      try { setSetupLoading(true); const response = await api.post('/auth/2fa/generate'); setQrCodeUrl(response.data.qrCodeUrl); }
      catch (e) { setShowSetupModal(false); showAlert('Error', 'Failed to start 2FA setup'); setAppEnabled(false); } finally { setSetupLoading(false); }
    } else {
      try { await api.post('/auth/2fa/disable'); setAppEnabled(false); } catch (e: any) { showAlert('Error', e.response?.data?.error || 'Failed to disable 2FA'); setAppEnabled(true); }
    }
  };

  const verifyAndEnable = async () => {
    if (!setupToken || setupToken.length < 6) return showAlert('Error', 'Please enter a valid 6-digit code');
    try { setSetupLoading(true); await api.post('/auth/2fa/verify', { token: setupToken }); setAppEnabled(true); setShowSetupModal(false); setSetupToken(''); }
    catch (e: any) { showAlert('Verification Failed', e.response?.data?.error || 'Failed to verify token'); } finally { setSetupLoading(false); }
  };

  if (loading) return <View style={[styles.loadingContainer, { backgroundColor: themeBg }]}><ActivityIndicator size="large" color={textMain} /></View>;

  const isActive = appEnabled || smsEnabled;

  const ScanningLaser = () => {
      const laserY = useSharedValue(0);

      useEffect(() => {
          laserY.value = withRepeat(
              withSequence(
                  withTiming(40, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
                  withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
              ), -1, true
          );
      }, []);

      const laserStyle = useAnimatedStyle(() => ({
          transform: [{ translateY: laserY.value }]
      }));

      return (
          <View style={{ position: 'absolute', right: 0, top: 0, width: 48, height: 48, justifyContent: 'center', alignItems: 'center' }}>
              <MaterialCommunityIcons name="shield-check-outline" size={48} color={isActive ? "#10B981" : textMuted} />
              <Animated.View style={[{ position: 'absolute', top: 4, width: '80%', height: 2, backgroundColor: isActive ? '#10B981' : textMuted, shadowColor: isActive ? '#10B981' : textMuted, shadowOpacity: 0.8, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } }, laserStyle]} />
          </View>
      );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeBg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={textMain} />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { position: 'relative' }]}>
          <AppText style={[styles.heroTitle, { color: textMain }]}>Two-Factor{"\n"}Auth</AppText>
          <AppText style={[styles.heroSub, { color: textMuted }]}>Add an extra layer of security to your account to prevent unauthorized access.</AppText>
          <ScanningLaser />
        </View>

        <View style={[styles.statusPill, { backgroundColor: pillBg }, isActive && styles.statusPillActive]}>
          <View style={[styles.statusDot, { backgroundColor: dotInactive }, isActive && styles.dotActive]} />
          <AppText style={[styles.statusText, { color: textMuted }, isActive && styles.statusTextActive]}>{isActive ? 'SECURITY ACTIVE' : 'SECURITY INACTIVE'}</AppText>
        </View>

        <View style={styles.listContainer}>
          <View style={[styles.row, { borderColor: borderSubtle }]}>
            <View style={styles.rowLeft}>
              <AppText style={[styles.rowTitle, { color: textMain }]}>Text Message (SMS)</AppText>
              <AppText style={[styles.rowDesc, { color: textMuted }]}>Receive a one-time code via SMS</AppText>
            </View>
            <Switch value={smsEnabled} onValueChange={handleSmsToggle} trackColor={{ false: trackFalse, true: '#10B981' }} thumbColor={smsEnabled ? '#FFFFFF' : thumbFalse} />
          </View>

          <View style={[styles.row, { borderColor: borderSubtle }]}>
            <View style={styles.rowLeft}>
              <AppText style={[styles.rowTitle, { color: textMain }]}>Authenticator App</AppText>
              <AppText style={[styles.rowDesc, { color: textMuted }]}>Use an app like Authy or Google Auth</AppText>
            </View>
            <Switch value={appEnabled} onValueChange={handleAppToggle} trackColor={{ false: trackFalse, true: '#10B981' }} thumbColor={appEnabled ? '#FFFFFF' : thumbFalse} />
          </View>
        </View>
      </ScrollView>

      {/* App Setup Modal */}
      <Modal visible={showSetupModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: modalBg }]}>
            <AppText style={[styles.modalTitle, { color: textMain }]}>App Setup</AppText>
            <AppText style={[styles.modalDesc, { color: textMuted }]}>Scan this QR code with your Authenticator App, then enter the 6-digit code below.</AppText>
            
            <View style={styles.qrContainer}>
              {qrCodeUrl ? <Image source={{ uri: qrCodeUrl }} style={styles.qrImage} /> : <ActivityIndicator color="#000000" />}
            </View>

            <TextInput style={[styles.modalInput, { borderColor: modalBorderColor, color: textMain }]} placeholder="000 000" placeholderTextColor={textMuted} keyboardType="number-pad" maxLength={6} value={setupToken} onChangeText={setSetupToken} />
            
            <View style={styles.modalActions}>
              <Pressable style={[styles.btnCancel, { backgroundColor: btnCancelBg }]} onPress={() => { setShowSetupModal(false); setAppEnabled(false); }}>
                <AppText style={[styles.btnCancelText, { color: btnCancelText }]}>Cancel</AppText>
              </Pressable>
              <Pressable style={[styles.btnPrimary, { backgroundColor: btnPrimaryBg }]} onPress={verifyAndEnable} disabled={setupLoading}>
                {setupLoading ? <ActivityIndicator color={btnPrimaryText} /> : <AppText style={[styles.btnPrimaryText, { color: btnPrimaryText }]}>Verify</AppText>}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* SMS Setup Modal */}
      <Modal visible={showSmsSetupModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: modalBg }]}>
            <AppText style={[styles.modalTitle, { color: textMain }]}>SMS Setup</AppText>
            <AppText style={[styles.modalDesc, { color: textMuted }]}>Enter your phone number with country code (e.g., +1234567890).</AppText>
            
            <TextInput style={[styles.modalInput, { borderColor: modalBorderColor, color: textMain }]} placeholder="+1 234 567 8900" placeholderTextColor={textMuted} keyboardType="phone-pad" value={phoneNumber} onChangeText={setPhoneNumber} />
            
            <View style={styles.modalActions}>
              <Pressable style={[styles.btnCancel, { backgroundColor: btnCancelBg }]} onPress={() => { setShowSmsSetupModal(false); setSmsEnabled(false); }}>
                <AppText style={[styles.btnCancelText, { color: btnCancelText }]}>Cancel</AppText>
              </Pressable>
              <Pressable style={[styles.btnPrimary, { backgroundColor: btnPrimaryBg }]} onPress={startSmsSetup} disabled={setupLoading}>
                {setupLoading ? <ActivityIndicator color={btnPrimaryText} /> : <AppText style={[styles.btnPrimaryText, { color: btnPrimaryText }]}>Next</AppText>}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* SMS Verify Modal */}
      <Modal visible={showSmsVerifyModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: modalBg }]}>
            <AppText style={[styles.modalTitle, { color: textMain }]}>Verify Code</AppText>
            <AppText style={[styles.modalDesc, { color: textMuted }]}>Enter the 6-digit code sent to your phone.</AppText>
            
            <TextInput style={[styles.modalInput, { borderColor: modalBorderColor, color: textMain }]} placeholder="000 000" placeholderTextColor={textMuted} keyboardType="number-pad" maxLength={6} value={setupToken} onChangeText={setSetupToken} />
            
            <View style={styles.modalActions}>
              <Pressable style={[styles.btnCancel, { backgroundColor: btnCancelBg }]} onPress={() => { setShowSmsVerifyModal(false); setSmsEnabled(false); }}>
                <AppText style={[styles.btnCancelText, { color: btnCancelText }]}>Cancel</AppText>
              </Pressable>
              <Pressable style={[styles.btnPrimary, { backgroundColor: btnPrimaryBg }]} onPress={verifyAndEnableSms} disabled={setupLoading}>
                {setupLoading ? <ActivityIndicator color={btnPrimaryText} /> : <AppText style={[styles.btnPrimaryText, { color: btnPrimaryText }]}>Verify</AppText>}
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 24, paddingBottom: 24 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  hero: { marginBottom: 32 },
  heroTitle: { fontSize: 40, fontWeight: '800', letterSpacing: -1.5, lineHeight: 44, marginBottom: 12 },
  heroSub: { fontSize: 15, lineHeight: 22 },
  statusPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginBottom: 48, borderWidth: 1, borderColor: 'transparent' },
  statusPillActive: { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  dotActive: { backgroundColor: '#10B981' },
  statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
  statusTextActive: { color: '#10B981' },
  listContainer: { marginBottom: 48 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20, borderBottomWidth: 1 },
  rowLeft: { flex: 1, paddingRight: 16 },
  rowTitle: { fontSize: 18, fontWeight: '600', marginBottom: 6 },
  rowDesc: { fontSize: 14, lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 32, paddingBottom: 48 },
  modalTitle: { fontSize: 24, fontWeight: '800', marginBottom: 12, letterSpacing: -0.5 },
  modalDesc: { fontSize: 15, lineHeight: 22, marginBottom: 32 },
  qrContainer: { width: 200, height: 200, backgroundColor: '#FFFFFF', borderRadius: 16, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginBottom: 32, padding: 16 },
  qrImage: { width: '100%', height: '100%' },
  modalInput: { width: '100%', height: 64, borderBottomWidth: 1, fontSize: 24, fontWeight: '600', letterSpacing: 4, textAlign: 'center', marginBottom: 32 },
  modalActions: { flexDirection: 'row', gap: 16 },
  btnCancel: { flex: 1, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  btnCancelText: { fontWeight: '600', fontSize: 16 },
  btnPrimary: { flex: 1, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  btnPrimaryText: { fontWeight: '800', fontSize: 16 },
});
