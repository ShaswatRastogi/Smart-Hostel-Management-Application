import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, DeviceEventEmitter, ScrollView, StyleSheet, View, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS, withRepeat, withSequence } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../../context/AlertContext';
import { API_BASE_URL } from '../../utils/api';
import { fetchUserData, getInitial, StudentData } from '../../utils/nameUtils';
import { useTheme } from '../../utils/ThemeContext';
import AppText from '../../components/AppText';

export default function Settings() {
  const router = useRouter();
  const { theme, toggleTheme, isDark } = useTheme();
  const { showAlert } = useAlert();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);

  // Dynamic Theme Map
  const themeBg = isDark ? '#000000' : '#F8FAFC';
  const textMain = isDark ? '#FFFFFF' : '#111111';
  const textMuted = isDark ? '#888888' : '#64748B';
  const textSecondary = isDark ? '#CCCCCC' : '#475569';
  const borderSubtle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const iconBoxBg = isDark ? '#1A1A1A' : '#F1F5F9';
  const iconBoxBorder = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const pressedBg = isDark ? '#111111' : '#E2E8F0';
  const btnBg = isDark ? '#FFFFFF' : '#111111';
  const btnText = isDark ? '#000000' : '#FFFFFF';

  const SettingRow = ({ icon, label, description, onPress, value, danger, isLast }: any) => {
    const scale = useSharedValue(1);
    
    const handlePress = (e?: any) => {
        if (!onPress) return;
        scale.value = withSequence(withTiming(0.8, { duration: 100 }), withTiming(1, { duration: 200, easing: Easing.bounce }));
        onPress(e);
    };

    const iconStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    return (
        <Pressable
          style={({ pressed }) => [styles.row, !isLast && { borderBottomWidth: 1, borderBottomColor: borderSubtle }, pressed && { opacity: 0.7, backgroundColor: pressedBg }]}
          onPress={handlePress}
          disabled={!onPress}
        >
          <View style={styles.rowLeft}>
            <View style={[styles.iconBox, { backgroundColor: iconBoxBg, borderColor: iconBoxBorder }]}>
              <Animated.View style={iconStyle}>
                  <MaterialCommunityIcons name={icon} size={20} color={danger ? '#EF4444' : textMain} />
              </Animated.View>
            </View>
            <View style={{ flex: 1 }}>
              <AppText style={[styles.rowLabel, { color: danger ? '#EF4444' : textMain }]}>{label}</AppText>
              {description && <AppText style={styles.rowDesc}>{description}</AppText>}
            </View>
          </View>
          {value ? (
            <AppText style={styles.rowValue}>{value}</AppText>
          ) : (
            onPress && <MaterialIcons name="chevron-right" size={22} color={textMuted} />
          )}
        </Pressable>
    );
  };

  useEffect(() => {
    loadUserData();
    const sub = DeviceEventEmitter.addListener('profileUpdated', loadUserData);
    return () => sub.remove();
  }, []);

  const loadUserData = async () => { try { const data = await fetchUserData(); setStudent(data); } catch (error) { console.error('Failed to load user data:', error); } finally { setLoading(false); } };



  const handleLogout = async () => {
    showAlert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel', onPress: () => {} },
      { text: 'Logout', style: 'destructive', onPress: async () => {
          try {
            const { performLogout } = await import('../../utils/authUtils');
            await performLogout(router);
          } catch (error) {
            console.error('Settings logout error:', error);
            showAlert('Error', 'Failed to logout properly', [], 'error');
          }
        }
      }
    ]);
  };

  const ProfileAura = () => {
      const auraScale = useSharedValue(1);
      const auraOpacity = useSharedValue(0.4);

      useEffect(() => {
          auraScale.value = withRepeat(withSequence(withTiming(1.15, { duration: 1500, easing: Easing.inOut(Easing.ease) }), withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })), -1, true);
          auraOpacity.value = withRepeat(withSequence(withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) }), withTiming(0.4, { duration: 1500, easing: Easing.inOut(Easing.ease) })), -1, true);
      }, []);

      const rStyle = useAnimatedStyle(() => ({
          transform: [{ scale: auraScale.value }],
          opacity: auraOpacity.value
      }));

      return (
          <Animated.View style={[StyleSheet.absoluteFillObject, { borderRadius: 60, backgroundColor: isDark ? '#FFFFFF' : '#3B82F6', zIndex: -1 }, rStyle]} />
      );
  };

  const logoutX = useSharedValue(0);
  const handleLogoutAction = () => {
      logoutX.value = withTiming(30, { duration: 200, easing: Easing.in(Easing.ease) });
      handleLogout();
  };
  const logoutIconStyle = useAnimatedStyle(() => ({ transform: [{ translateX: logoutX.value }] }));

  if (loading) return <View style={[styles.container, { backgroundColor: themeBg, justifyContent: 'center' }]}><ActivityIndicator size="large" color={textMain} /></View>;

  return (
    <View style={[styles.container, { backgroundColor: themeBg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <View style={styles.header}>
          <AppText style={[styles.headerTitle, { color: textMain }]}>Settings</AppText>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
          <View style={styles.heroProfile}>
            <View style={styles.avatarWrap}>
              <ProfileAura />
              {student?.profilePhoto ? (
                <Image source={{ uri: student.profilePhoto.startsWith('http') ? student.profilePhoto : `${API_BASE_URL}${student.profilePhoto}` }} style={[styles.avatar, { borderColor: borderSubtle }]} contentFit="cover" cachePolicy="memory-disk" />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback, { borderColor: borderSubtle }]}><AppText style={styles.avatarText}>{getInitial(student?.fullName || 'U')}</AppText></View>
              )}
              <View style={[styles.onlineDot, { borderColor: themeBg }]} />
            </View>
            <AppText style={[styles.profileName, { color: textMain }]}>{student?.fullName || 'Student'}</AppText>
            <AppText style={styles.profileMetaText}>{student?.email || 'No email'} • Room {student?.roomNo || '--'}</AppText>
            <Pressable style={({ pressed }) => [styles.editProfileBtn, { backgroundColor: btnBg }, pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] }]} onPress={() => router.push('/edit-profile')}>
              <MaterialCommunityIcons name="pencil" size={16} color={btnText} />
              <AppText style={[styles.editProfileText, { color: btnText }]}>Edit Profile</AppText>
            </Pressable>
          </View>

          <View style={{ paddingHorizontal: 24 }}>
            <AppText style={styles.sectionTitle}>Security & Access</AppText>
            <View style={styles.card}>
              <SettingRow icon="lock-outline" label="Change Password" description="Update your credentials" onPress={() => router.push('/account/change-password')} />
              <SettingRow icon="shield-check-outline" label="Two-Factor Auth" description="Extra layer of protection" onPress={() => router.push('/settings/two-factor')} />
              <SettingRow icon="devices" label="Manage Devices" description="View active sessions" onPress={() => router.push('/settings/devices')} />
              <SettingRow icon="link-variant" label="Linked Accounts" description="Google Account" onPress={() => router.push('/account/linked-accounts')} isLast />
            </View>

            <AppText style={styles.sectionTitle}>Preferences</AppText>
            <View style={styles.card}>
              <SettingRow icon="bell-outline" label="Push Notifications" description="Manage granular alerts" onPress={() => router.push('/account/notification-settings')} />
              <SettingRow icon="brightness-6" label="Theme Mode" description={isDark ? "Dark theme active" : "Light theme active"} onPress={() => router.push('/settings/theme')} value={isDark ? 'Dark' : 'Light'} />
              <SettingRow icon="translate" label="App Language" description="Choose interface language" onPress={() => router.push('/settings/language')} value="English" />
              <SettingRow icon="database-outline" label="Storage & Cache" description="Manage app storage" onPress={() => router.push('/settings/data-storage')} isLast />
            </View>

            <AppText style={styles.sectionTitle}>Support & About</AppText>
            <View style={styles.card}>
              <SettingRow icon="help-circle-outline" label="Help Center" description="FAQs and support" onPress={() => router.push('/about/help')} />
              <SettingRow icon="bug-outline" label="Report a Bug" onPress={() => showAlert('Bug Report', 'Send bug reports to support@smarthostel.com')} />
              <SettingRow icon="download-outline" label="Download My Data" description="Export your personal data" onPress={() => router.push('/account/download-data')} />
              <SettingRow icon="text-box-check-outline" label="Privacy & Terms" description="Policies and agreements" onPress={() => router.push('/about/privacy')} />
              <SettingRow icon="information-outline" label="About App" description="Version, licenses, share" onPress={() => router.push('/settings/about-app')} isLast />
            </View>

            <Pressable style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]} onPress={handleLogoutAction}>
              <Animated.View style={logoutIconStyle}>
                  <MaterialCommunityIcons name="logout-variant" size={20} color="#EF4444" />
              </Animated.View>
              <AppText style={styles.logoutText}>Log Out Session</AppText>
            </Pressable>

            <View style={styles.footerContainer}>
              <MaterialCommunityIcons name="tag-outline" size={14} color={textMuted} />
              <AppText style={styles.footerText}>SmartStay v{Application.nativeApplicationVersion} ({Application.nativeBuildVersion})</AppText>
            </View>
            <AppText style={styles.copyrightText}>SmartStay Hostels © 2026 • Premium Experience</AppText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16 },
  headerTitle: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  content: { flex: 1 },
  heroProfile: { alignItems: 'center', paddingTop: 12, paddingBottom: 32 },
  avatarWrap: { position: 'relative', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 2 },
  avatarFallback: { backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 36, fontWeight: '800', color: '#FFFFFF' },
  onlineDot: { position: 'absolute', bottom: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: '#10B981', borderWidth: 4 },
  profileName: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  profileMetaText: { fontSize: 14, color: '#888888', fontWeight: '600', marginTop: 4, marginBottom: 20 },
  editProfileBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, gap: 8 },
  editProfileText: { fontSize: 14, fontWeight: '700' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#666666', marginTop: 24, marginBottom: 10, marginLeft: 8, textTransform: 'uppercase', letterSpacing: 1 },
  card: { backgroundColor: 'transparent' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 16 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  rowLabel: { fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  rowDesc: { fontSize: 12, color: '#888888', marginTop: 2, fontWeight: '500' },
  rowValue: { fontSize: 14, fontWeight: '600', color: '#AAAAAA' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: 24, padding: 18, gap: 10, marginTop: 40, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  logoutText: { fontSize: 16, fontWeight: '800', color: '#EF4444' },
  footerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  footerText: { fontSize: 12, fontWeight: '600', color: '#666666' },
  copyrightText: { textAlign: 'center', fontSize: 11, color: '#444444', marginTop: 6, fontWeight: '500' },
});