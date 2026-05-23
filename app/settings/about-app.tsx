import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Linking, Platform, ScrollView, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../../context/AlertContext';
import { useTheme } from '../../utils/ThemeContext';
import AppText from '../../components/AppText';

const LICENSES = [
  { name: 'React Native', license: 'MIT', url: 'https://github.com/facebook/react-native' },
  { name: 'Expo', license: 'MIT', url: 'https://github.com/expo/expo' },
  { name: 'Zustand', license: 'MIT', url: 'https://github.com/pmndrs/zustand' },
  { name: 'Axios', license: 'MIT', url: 'https://github.com/axios/axios' },
  { name: 'React Navigation', license: 'MIT', url: 'https://reactnavigation.org' },
];

export default function AboutApp() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const appVersion = Application.nativeApplicationVersion || '1.0.0';
  const buildNumber = Application.nativeBuildVersion || '1';

  const handleRateApp = () => showAlert('Coming Soon', 'App store listing will be available soon!');
  const handleShareApp = async () => {
    try { await Share.share({ message: '🏠 Check out SmartStay Hostels — the smartest way to manage hostel life! Download now.', title: 'SmartStay Hostels' }); } catch (e) { console.error('Share failed:', e); }
  };
  const handleCheckUpdates = () => showAlert('Up to Date!', `You're running the latest version (v${appVersion}).`, [], 'success');

  const ACTIONS = [
    { icon: 'update', color: '#10B981', bg: 'rgba(16,185,129,0.1)', label: 'Check for Updates', desc: 'See if a newer version is available', onPress: handleCheckUpdates },
    { icon: 'star-outline', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', label: 'Rate This App', desc: 'Love SmartStay? Leave us a review!', onPress: handleRateApp },
    { icon: 'share-variant-outline', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', label: 'Share App', desc: 'Invite your friends to SmartStay', onPress: handleShareApp },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#000428', '#004e92']} style={[styles.header, { paddingTop: insets.top + 10 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><MaterialCommunityIcons name="arrow-left" size={22} color="#fff" /></TouchableOpacity>
          <AppText style={styles.headerTitle}>About App</AppText>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.iconWrap, { backgroundColor: isDark ? '#0F172A' : '#EFF6FF' }]}>
            <LinearGradient colors={['#000428', '#004e92']} style={styles.appIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <MaterialCommunityIcons name="home-city" size={40} color="#fff" />
            </LinearGradient>
          </View>
          <AppText style={[styles.appName, { color: colors.text }]}>SmartStay Hostels</AppText>
          <AppText style={{ fontSize: 14, color: colors.textSecondary }}>Premium Hostel Management</AppText>
          <View style={[styles.badge, { backgroundColor: isDark ? '#1e293b' : '#eff6ff', borderColor: isDark ? '#334155' : '#dbeafe' }]}>
            <AppText style={[styles.badgeText, { color: isDark ? '#60A5FA' : '#004e92' }]}>v{appVersion} ({buildNumber})</AppText>
          </View>
        </View>

        {/* App Info */}
        <AppText style={[styles.secTitle, { color: colors.textSecondary }]}>APP INFORMATION</AppText>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[['Version', `v${appVersion}`], ['Build', buildNumber], ['Platform', Platform.OS === 'ios' ? 'iOS' : 'Android'], ['OS Version', `${Platform.Version}`], ['Package', Application.applicationId || 'com.smarthostel.app']].map(([label, value], i, arr) => (
            <View key={label as string} style={[styles.infoRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <AppText style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</AppText>
              <AppText style={[styles.infoValue, { color: colors.text }]}>{value}</AppText>
            </View>
          ))}
        </View>

        {/* Actions */}
        <AppText style={[styles.secTitle, { color: colors.textSecondary }]}>ACTIONS</AppText>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {ACTIONS.map((item, i) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity style={styles.actionRow} onPress={item.onPress}>
                <View style={[styles.actionIcon, { backgroundColor: item.bg }]}><MaterialCommunityIcons name={item.icon as any} size={22} color={item.color} /></View>
                <View style={{ flex: 1 }}><AppText style={[{ fontSize: 15, fontWeight: '600', color: colors.text }]}>{item.label}</AppText><AppText style={[{ fontSize: 12, marginTop: 2, color: colors.textSecondary }]}>{item.desc}</AppText></View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              {i < ACTIONS.length - 1 && <View style={[styles.div, { backgroundColor: colors.border }]} />}
            </React.Fragment>
          ))}
        </View>

        {/* Open Source */}
        <AppText style={[styles.secTitle, { color: colors.textSecondary }]}>OPEN SOURCE LIBRARIES</AppText>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {LICENSES.map((lib, i) => (
            <TouchableOpacity key={lib.name} style={[styles.licRow, i < LICENSES.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]} onPress={() => Linking.openURL(lib.url).catch(() => {})}>
              <View style={{ flex: 1 }}><AppText style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>{lib.name}</AppText><AppText style={{ fontSize: 12, color: colors.textSecondary }}>{lib.license} License</AppText></View>
              <MaterialCommunityIcons name="open-in-new" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ alignItems: 'center', paddingVertical: 32, gap: 6 }}>
          <AppText style={{ fontSize: 14, color: colors.textSecondary }}>Made with ❤️ for hostel students</AppText>
          <AppText style={{ fontSize: 12, color: colors.textSecondary }}>© 2026 SmartStay Hostels</AppText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  hero: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  iconWrap: { width: 96, height: 96, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  appIcon: { width: 80, height: 80, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  appName: { fontSize: 24, fontWeight: '800', letterSpacing: 0.5 },
  badge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginTop: 4 },
  badgeText: { fontSize: 13, fontWeight: '700' },
  secTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 1.1, marginBottom: 10, marginTop: 16, marginLeft: 4 },
  card: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 4, shadowColor: '#004e92', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  infoLabel: { fontSize: 15, fontWeight: '500' },
  infoValue: { fontSize: 15, fontWeight: '600' },
  actionRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  actionIcon: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  div: { height: 1, marginLeft: 72 },
  licRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
});
