import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../utils/ThemeContext';
import { useAlert } from '../../context/AlertContext';
import AppText from '../../components/AppText';

interface DeviceSession {
  id: string;
  device_name: string;
  location: string;
  last_active: string;
  is_current: boolean;
  ip_address: string;
  app_version: string;
}

export default function ManageDevices() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<DeviceSession[]>([]);

  const fetchSessions = async () => {
    try {
      const { default: api } = await import('../../utils/api');
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      const response = await api.get('/auth/sessions', {
        params: { refreshToken: refreshToken || undefined }
      });
      setSessions(response.data.sessions);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      showAlert('Error', 'Failed to load linked devices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const handleLogoutOther = (sessionId: string) => {
    showAlert('Terminate Session', 'Are you sure you want to log out of this device?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        try {
          const { default: api } = await import('../../utils/api');
          await api.delete(`/auth/sessions/${sessionId}`);
          setSessions(prev => prev.filter(s => s.id !== sessionId));
          showAlert('Success', 'Session terminated', [], 'success');
        } catch (e) { showAlert('Error', 'Failed to terminate session'); }
      }}
    ]);
  };

  const handleLogoutAllOther = () => {
    showAlert('Log out everywhere else?', 'This will sign you out of all other devices except this one.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Terminate All', style: 'destructive', onPress: async () => {
        try {
          const { default: api } = await import('../../utils/api');
          const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
          const refreshToken = await AsyncStorage.getItem('refreshToken');
          await api.delete('/auth/sessions/revoke-all', { data: { refreshToken } });
          setSessions(prev => prev.filter(s => s.is_current));
          showAlert('Success', 'All other sessions terminated', [], 'success');
        } catch (e) { showAlert('Error', 'Failed to terminate sessions'); }
      }}
    ]);
  };

  const currentSession = sessions.find(s => s.is_current);
  const otherSessions = sessions.filter(s => !s.is_current);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#000428', '#004e92']} style={[styles.header, { paddingTop: insets.top + 10 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><MaterialCommunityIcons name="arrow-left" size={22} color="#fff" /></TouchableOpacity>
          <View><AppText style={styles.headerTitle}>Devices</AppText><AppText style={styles.headerSub}>Online right now</AppText></View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#004e92" /></View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {currentSession && (<>
            <AppText style={[styles.secTitle, { color: colors.textSecondary }]}>THIS DEVICE</AppText>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sessionRow}>
                <View style={[styles.devIcon, { backgroundColor: 'rgba(16,185,129,0.1)' }]}><MaterialCommunityIcons name="cellphone" size={26} color="#10B981" /></View>
                <View style={{ flex: 1 }}>
                  <AppText style={[styles.devName, { color: colors.text }]}>{currentSession.device_name}</AppText>
                  <AppText style={[styles.devMeta, { color: colors.textSecondary }]}>{currentSession.location} • {currentSession.app_version}</AppText>
                  <View style={styles.activeBadge}><View style={styles.activeDot} /><AppText style={styles.activeText}>Online</AppText></View>
                </View>
              </View>
            </View>
          </>)}

          {otherSessions.length > 0 && (<>
            <AppText style={[styles.secTitle, { color: colors.textSecondary, marginTop: 24 }]}>OTHER ONLINE DEVICES</AppText>
            <TouchableOpacity style={[styles.termBtn, { backgroundColor: isDark ? '#170a0a' : '#FFF5F5', borderColor: isDark ? '#451a1a' : '#FEE2E2' }]} onPress={handleLogoutAllOther}>
              <MaterialCommunityIcons name="logout-variant" size={18} color="#EF4444" /><AppText style={styles.termText}>Log Out All Other Devices</AppText>
            </TouchableOpacity>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
              {otherSessions.map((session, i) => (
                <TouchableOpacity key={session.id} style={[styles.sessionRow, i !== otherSessions.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]} onPress={() => handleLogoutOther(session.id)} activeOpacity={0.6}>
                  <View style={[styles.devIcon, { backgroundColor: isDark ? '#1e293b' : '#F1F5F9' }]}><MaterialCommunityIcons name={session.device_name.includes('Web') ? 'laptop' : 'cellphone'} size={24} color={colors.textSecondary} /></View>
                  <View style={{ flex: 1 }}>
                    <AppText style={[styles.devName, { color: colors.text }]}>{session.device_name}</AppText>
                    <AppText style={[styles.devMeta, { color: colors.textSecondary }]}>{session.location} • {session.app_version}</AppText>
                    <View style={styles.activeBadge}><View style={[styles.activeDot, { backgroundColor: '#10B981' }]} /><AppText style={[styles.activeText, { color: '#10B981' }]}>Online</AppText></View>
                  </View>
                  <MaterialCommunityIcons name="close-circle-outline" size={22} color="#EF4444" style={{ opacity: 0.7 }} />
                </TouchableOpacity>
              ))}
            </View>
          </>)}

          {otherSessions.length === 0 && currentSession && (
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: isDark ? '#0F172A' : '#EFF6FF' }]}><MaterialCommunityIcons name="shield-check" size={36} color="#10B981" /></View>
              <AppText style={[styles.emptyTitle, { color: colors.text }]}>All Clear!</AppText>
              <AppText style={[styles.emptySub, { color: colors.textSecondary }]}>No other devices are online. Your account is secure.</AppText>
            </View>
          )}

          <View style={[styles.note, { backgroundColor: isDark ? '#0c2d48' : '#EFF6FF', borderColor: isDark ? '#1e3a5f' : '#BFDBFE' }]}>
            <MaterialCommunityIcons name="shield-alert-outline" size={18} color={isDark ? '#93C5FD' : '#3B82F6'} />
            <AppText style={[styles.noteText, { color: isDark ? '#93C5FD' : '#1D4ED8' }]}>If you don't recognize a device, terminate the session immediately and change your password.</AppText>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff', textAlign: 'center' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  secTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 1.1, marginBottom: 10, marginLeft: 4 },
  card: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', shadowColor: '#004e92', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  sessionRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  devIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  devName: { fontSize: 16, fontWeight: '600' },
  devMeta: { fontSize: 13, marginTop: 2 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  activeText: { fontSize: 13, color: '#10B981', fontWeight: '600' },
  termBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 16, gap: 8, borderWidth: 1 },
  termText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 40, gap: 8 },
  emptyIcon: { width: 72, height: 72, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 21 },
  note: { borderRadius: 16, borderWidth: 1, padding: 14, marginTop: 24, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  noteText: { fontSize: 13, lineHeight: 19, flex: 1 },
});
