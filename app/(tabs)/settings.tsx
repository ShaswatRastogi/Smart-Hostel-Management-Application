import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, DeviceEventEmitter, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../../context/AlertContext';
import { API_BASE_URL } from '../../utils/api';
import { fetchUserData, getInitial, StudentData } from '../../utils/nameUtils';
import { useTheme } from '../../utils/ThemeContext';
import AppText from '../../components/AppText';

// Reusable row component
const SettingRow = ({ icon, iconColor, iconBg, label, description, onPress, value, danger, isLast, colors, isDark }: any) => (
  <TouchableOpacity
    style={[styles.row, !isLast && [styles.rowBorder, { borderBottomColor: colors.border }]]}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={0.6}
  >
    <View style={styles.rowLeft}>
      <View style={[styles.iconBox, { backgroundColor: iconBg || (isDark ? '#1e293b' : '#F1F5F9') }]}>
        <MaterialCommunityIcons name={icon} size={20} color={iconColor || (danger ? '#EF4444' : (isDark ? '#60A5FA' : '#004e92'))} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText style={[styles.rowLabel, { color: danger ? '#EF4444' : colors.text }]}>{label}</AppText>
        {description && <AppText style={[styles.rowDesc, { color: colors.textSecondary }]}>{description}</AppText>}
      </View>
    </View>
    {value ? (
      <AppText style={[styles.rowValue, { color: colors.textSecondary }]}>{value}</AppText>
    ) : (
      onPress && <MaterialIcons name="chevron-right" size={20} color="#94A3B8" />
    )}
  </TouchableOpacity>
);

export default function Settings() {
  const router = useRouter();
  const { theme, toggleTheme, colors, isDark } = useTheme();
  const { showAlert } = useAlert();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
    const sub = DeviceEventEmitter.addListener('profileUpdated', loadUserData);
    return () => sub.remove();
  }, []);

  const loadUserData = async () => {
    try {
      const data = await fetchUserData();
      setStudent(data);
    } catch (error) {
      console.error('Failed to load user data for settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    showAlert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel', onPress: () => {} },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          try {
            const { setStoredUser } = await import('../../utils/authUtils');
            const { deregisterPushToken } = await import('../../utils/usePushNotifications');
            const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
            const { useAuthStore } = await import('../../store/useAuthStore');
            const { default: api } = await import('../../utils/api');
            // Delete the session from the backend so it disappears from "online devices"
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            if (refreshToken) {
              await api.post('/auth/sessions/logout', { refreshToken }).catch(() => {});
            }
            await deregisterPushToken();
            await setStoredUser(null);
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('refreshToken');
            useAuthStore.getState().setUser(null);
            router.replace('/login');
          } catch (error) { console.error("Logout error:", error); }
        }
      }
    ]);
  };

  const getThemeLabel = () => {
    return isDark ? 'Dark' : 'Light';
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#004e92" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={['#000428', '#004e92']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <SafeAreaView edges={['top', 'left', 'right']}>
            <View style={styles.headerContent}>
              <View>
                <AppText style={styles.headerTitle}>Settings</AppText>
                <AppText style={styles.headerSubtitle}>Manage your account & app</AppText>
              </View>
              <View style={styles.headerIcon}>
                <MaterialCommunityIcons name="cog" size={24} color="#fff" />
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={{ padding: 20 }}>
          {/* ── Profile Card (Telegram-style) ── */}
          <TouchableOpacity
            style={[styles.profileCard, styles.shadow, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/profile')}
            activeOpacity={0.7}
          >
            <View style={styles.profileRow}>
              <View style={styles.avatarWrap}>
                {student?.profilePhoto ? (
                  <Image
                    source={{ uri: student.profilePhoto.startsWith('http') ? student.profilePhoto : `${API_BASE_URL}${student.profilePhoto}` }}
                    style={styles.avatar}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <AppText style={styles.avatarText}>{getInitial(student?.fullName || 'U')}</AppText>
                  </View>
                )}
                <View style={[styles.onlineDot, { borderColor: colors.card }]} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={[styles.profileName, { color: colors.text }]}>{student?.fullName || 'Student'}</AppText>
                <AppText style={[styles.profileEmail, { color: colors.textSecondary }]}>{student?.email || 'No email'}</AppText>
                <View style={styles.profileMeta}>
                  <View style={[styles.roleBadge, { backgroundColor: isDark ? '#0F172A' : '#EFF6FF' }]}>
                    <AppText style={[styles.roleBadgeText, { color: isDark ? '#60A5FA' : '#004e92' }]}>
                      Room {student?.roomNo || '--'}
                    </AppText>
                  </View>
                  <AppText style={[styles.rollText, { color: colors.textSecondary }]}>{student?.rollNo || ''}</AppText>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#94A3B8" />
            </View>
          </TouchableOpacity>

          {/* ── Account & Security ── */}
          <AppText style={[styles.sectionTitle, { color: colors.textSecondary }]}>Account & Security</AppText>
          <View style={[styles.card, styles.shadow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingRow icon="account-edit-outline" label="Edit Profile" description="Personal info, parent details" onPress={() => router.push('/edit-profile')} colors={colors} isDark={isDark} />
            <SettingRow icon="lock-outline" label="Change Password" description="Update your login credentials" onPress={() => router.push('/account/change-password')} colors={colors} isDark={isDark} />
            <SettingRow icon="shield-check-outline" label="Two-Factor Auth" description="Extra layer of protection" onPress={() => router.push('/settings/two-factor')} colors={colors} isDark={isDark} />
            <SettingRow icon="devices" label="Manage Devices" description="View active sessions" onPress={() => router.push('/settings/devices')} colors={colors} isDark={isDark} />
            <SettingRow icon="link-variant" label="Linked Accounts" description="Google Account" onPress={() => router.push('/account/linked-accounts')} colors={colors} isDark={isDark} isLast />
          </View>

          {/* ── Notifications ── */}
          <AppText style={[styles.sectionTitle, { color: colors.textSecondary }]}>Notifications</AppText>
          <View style={[styles.card, styles.shadow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingRow icon="bell-outline" label="Push Notifications" description="Manage granular push alerts" onPress={() => router.push('/account/notification-settings')} colors={colors} isDark={isDark} isLast />
          </View>

          {/* ── Appearance & Display ── */}
          <AppText style={[styles.sectionTitle, { color: colors.textSecondary }]}>Appearance & Display</AppText>
          <View style={[styles.card, styles.shadow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingRow icon="brightness-6" label="Theme Mode" description={isDark ? "Dark theme active" : "Light theme active"} onPress={toggleTheme} value={getThemeLabel()} colors={colors} isDark={isDark} />
            <SettingRow icon="translate" label="App Language" description="Choose interface language" value="English" onPress={() => router.push('/settings/language')} colors={colors} isDark={isDark} />
            <SettingRow icon="format-size" label="Accessibility" description="Font size, bold text, motion" onPress={() => router.push('/settings/accessibility')} colors={colors} isDark={isDark} isLast />
          </View>

          {/* ── Data & Storage ── */}
          <AppText style={[styles.sectionTitle, { color: colors.textSecondary }]}>Data & Storage</AppText>
          <View style={[styles.card, styles.shadow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingRow icon="database-outline" label="Storage & Cache" description="Manage app storage, clear cache" onPress={() => router.push('/settings/data-storage')} colors={colors} isDark={isDark} isLast />
          </View>

          {/* ── Privacy ── */}
          <AppText style={[styles.sectionTitle, { color: colors.textSecondary }]}>Privacy</AppText>
          <View style={[styles.card, styles.shadow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingRow icon="download-outline" label="Download My Data" description="Export your personal data" onPress={() => router.push('/account/download-data')} colors={colors} isDark={isDark} />
            <SettingRow icon="text-box-check-outline" label="Privacy Policy" description="How we handle your data" onPress={() => router.push('/about/privacy')} colors={colors} isDark={isDark} isLast />
          </View>

          {/* ── Support ── */}
          <AppText style={[styles.sectionTitle, { color: colors.textSecondary }]}>Support</AppText>
          <View style={[styles.card, styles.shadow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingRow icon="help-circle-outline" label="Help Center" description="FAQs and contact support" onPress={() => router.push('/about/help')} colors={colors} isDark={isDark} />
            <SettingRow icon="bug-outline" label="Report a Bug" onPress={() => showAlert('Bug Report', 'Send bug reports to support@smarthostel.com with screenshots and steps to reproduce.')} colors={colors} isDark={isDark} />
            <SettingRow icon="file-document-outline" label="Terms of Service" onPress={() => router.push('/about/terms')} colors={colors} isDark={isDark} />
            <SettingRow icon="information-outline" label="About App" description="Version, licenses, share" onPress={() => router.push('/settings/about-app')} colors={colors} isDark={isDark} isLast />
          </View>

          {/* ── Version Info ── */}
          <View style={[styles.versionRow, { marginTop: 8 }]}>
            <MaterialCommunityIcons name="tag-outline" size={16} color={colors.textSecondary} />
            <AppText style={[styles.versionText, { color: colors.textSecondary }]}>
              SmartStay v{Application.nativeApplicationVersion} ({Application.nativeBuildVersion})
            </AppText>
          </View>

          {/* ── Logout ── */}
          <TouchableOpacity
            style={[styles.logoutButton, styles.shadow, { backgroundColor: isDark ? '#170a0a' : '#FFF5F5', borderColor: isDark ? '#451a1a' : '#FEE2E2' }]}
            onPress={handleLogout}
          >
            <MaterialCommunityIcons name="logout-variant" size={22} color="#EF4444" />
            <AppText style={styles.logoutText}>Log Out Session</AppText>
          </TouchableOpacity>

          <AppText style={[styles.footerText, { color: colors.textSecondary }]}>SmartStay Hostels © 2026 • Premium Experience</AppText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingBottom: 32, borderBottomLeftRadius: 36, borderBottomRightRadius: 36,
    shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10,
  },
  headerContent: { paddingHorizontal: 24, paddingTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginTop: 4 },
  headerIcon: { width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  // Profile Card
  profileCard: { borderRadius: 24, borderWidth: 1, padding: 16, marginBottom: 8 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  avatarFallback: { backgroundColor: '#004e92', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 24, fontWeight: '700', color: '#fff' },
  onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#10B981', borderWidth: 2 },
  profileName: { fontSize: 18, fontWeight: '700' },
  profileEmail: { fontSize: 13, marginTop: 2 },
  profileMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  roleBadgeText: { fontSize: 11, fontWeight: '700' },
  rollText: { fontSize: 12, fontWeight: '500' },
  // Section
  sectionTitle: { fontSize: 13, fontWeight: '700', marginTop: 28, marginBottom: 12, marginLeft: 6, textTransform: 'uppercase', letterSpacing: 1.2 },
  card: { borderRadius: 24, overflow: 'hidden', borderWidth: 1 },
  // Row
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, paddingRight: 16 },
  rowBorder: { borderBottomWidth: 1 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 14 },
  iconBox: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowDesc: { fontSize: 11, marginTop: 1, fontWeight: '400' },
  rowValue: { fontSize: 14, fontWeight: '500' },
  // Version
  versionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 },
  versionText: { fontSize: 13, fontWeight: '500' },
  // Logout
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 20, padding: 16, gap: 10, marginTop: 24, marginBottom: 20, borderWidth: 1 },
  logoutText: { fontSize: 16, fontWeight: '700', color: '#EF4444' },
  footerText: { textAlign: 'center', fontSize: 11, marginTop: 10, marginBottom: 20, fontWeight: '500', letterSpacing: 0.5 },
  shadow: { shadowColor: '#004e92', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
});