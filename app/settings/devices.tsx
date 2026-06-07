import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../../context/AlertContext';
import { useTheme } from '../../utils/ThemeContext';
import AppText from '../../components/AppText';

interface DeviceSession {
  id: string; device_name: string; location: string; last_active: string; is_current: boolean; ip_address: string; app_version: string;
}

export default function ManageDevices() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<DeviceSession[]>([]);

  // Dynamic Theme Map
  const themeBg = isDark ? '#000000' : '#F8FAFC';
  const textMain = isDark ? '#FFFFFF' : '#111111';
  const textMuted = isDark ? '#888888' : '#64748B';
  const borderSubtle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const primaryBtnBg = isDark ? '#FFFFFF' : '#111111';
  const primaryBtnText = isDark ? '#000000' : '#FFFFFF';
  const inactiveDevIconBg = isDark ? '#1A1A1A' : '#E2E8F0';
  const inactiveDevIcon = isDark ? '#666666' : '#94A3B8';

  const fetchSessions = async () => {
    try {
      const { default: api } = await import('../../utils/api');
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      const response = await api.get('/auth/sessions', { params: { refreshToken: refreshToken || undefined } });
      setSessions(response.data.sessions);
    } catch (error) { showAlert('Error', 'Failed to load linked devices'); } finally { setLoading(false); }
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
          showAlert('Success', 'Session terminated successfully');
        } catch (e) { 
          showAlert('Error', 'Failed to terminate session'); 
        }
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
          showAlert('Success', 'All other sessions terminated');
        } catch (e) { showAlert('Error', 'Failed to terminate sessions'); }
      }}
    ]);
  };

  const currentSession = sessions.find(s => s.is_current);
  const otherSessions = sessions.filter(s => !s.is_current);

  if (loading) return <View style={[styles.loadingContainer, { backgroundColor: themeBg }]}><ActivityIndicator size="large" color={textMain} /></View>;

  return (
    <View style={[styles.container, { backgroundColor: themeBg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={textMain} />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <AppText style={[styles.heroTitle, { color: textMain }]}>Active{"\n"}Devices</AppText>
          <AppText style={[styles.heroSub, { color: textMuted }]}>You're currently signed in on these devices. Terminate any unrecognized sessions immediately.</AppText>
        </View>

        {currentSession && (
          <View style={styles.section}>
            <AppText style={styles.secTitle}>CURRENT DEVICE</AppText>
            <View style={[styles.deviceRow, { borderColor: borderSubtle }]}>
              <View style={styles.devIconWrap}>
                <MaterialCommunityIcons name={currentSession.device_name.includes('Web') ? 'laptop' : 'cellphone'} size={24} color="#10B981" />
              </View>
              <View style={styles.devInfo}>
                <AppText style={[styles.devName, { color: textMain }]}>{currentSession.device_name}</AppText>
                <AppText style={[styles.devMeta, { color: textMuted }]}>{currentSession.location} • {currentSession.app_version}</AppText>
                <View style={styles.activeBadge}>
                  <View style={styles.activeDot} />
                  <AppText style={styles.activeText}>Active Now</AppText>
                </View>
              </View>
            </View>
          </View>
        )}

        {otherSessions.length > 0 && (
          <View style={[styles.section, { marginTop: 16 }]}>
            <AppText style={styles.secTitle}>OTHER SESSIONS</AppText>
            {otherSessions.map((session) => (
              <View key={session.id} style={[styles.deviceRow, { borderColor: borderSubtle }]}>
                <View style={[styles.devIconWrapInactive, { backgroundColor: inactiveDevIconBg }]}>
                  <MaterialCommunityIcons name={session.device_name.includes('Web') ? 'laptop' : 'cellphone'} size={24} color={inactiveDevIcon} />
                </View>
                <View style={styles.devInfo}>
                  <AppText style={[styles.devName, { color: textMain }]}>{session.device_name}</AppText>
                  <AppText style={[styles.devMeta, { color: textMuted }]}>{session.location} • {session.app_version}</AppText>
                </View>
                <Pressable onPress={() => handleLogoutOther(session.id)} style={({ pressed }) => [styles.termIconBtn, pressed && { opacity: 0.5 }]}>
                  <MaterialCommunityIcons name="close" size={24} color={textMuted} />
                </Pressable>
              </View>
            ))}

            <Pressable style={({ pressed }) => [styles.termAllBtn, { backgroundColor: primaryBtnBg }, pressed && { transform: [{ scale: 0.98 }] }]} onPress={handleLogoutAllOther}>
              <MaterialCommunityIcons name="shield-off-outline" size={20} color={primaryBtnText} />
              <AppText style={[styles.termAllText, { color: primaryBtnText }]}>Sign out everywhere else</AppText>
            </Pressable>
          </View>
        )}

        {otherSessions.length === 0 && currentSession && (
          <View style={styles.emptyContainer}>
            <AppText style={[styles.emptyTitle, { color: textMain }]}>All Clear!</AppText>
            <AppText style={[styles.emptySub, { color: textMuted }]}>No other devices are currently logged into your account.</AppText>
          </View>
        )}

        <AppText style={[styles.infoFooter, { color: textMuted }]}>If you don't recognize a device, terminate the session and change your password immediately.</AppText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 24, paddingBottom: 24 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  hero: { marginBottom: 48 },
  heroTitle: { fontSize: 40, fontWeight: '800', letterSpacing: -1.5, lineHeight: 44, marginBottom: 12 },
  heroSub: { fontSize: 15, lineHeight: 22 },
  section: { marginBottom: 32 },
  secTitle: { fontSize: 11, fontWeight: '700', color: '#888888', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 },
  deviceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1 },
  devIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(16,185,129,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' },
  devIconWrapInactive: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  devInfo: { flex: 1 },
  devName: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  devMeta: { fontSize: 13, lineHeight: 18 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 6 },
  activeText: { fontSize: 12, fontWeight: '700', color: '#10B981', letterSpacing: 0.5, textTransform: 'uppercase' },
  termIconBtn: { padding: 8 },
  termAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 32, marginTop: 32, gap: 8 },
  termAllText: { fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  emptyContainer: { alignItems: 'flex-start', marginTop: 16, marginBottom: 32 },
  emptyTitle: { fontSize: 24, fontWeight: '700', marginBottom: 8, letterSpacing: -0.5 },
  emptySub: { fontSize: 15, lineHeight: 22 },
  infoFooter: { fontSize: 13, lineHeight: 20, marginTop: 16 },
});
