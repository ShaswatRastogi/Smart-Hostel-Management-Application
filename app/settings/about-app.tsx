import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Linking, Platform, ScrollView, StyleSheet, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../../context/AlertContext';
import { useTheme } from '../../utils/ThemeContext';
import AppText from '../../components/AppText';

export default function AboutApp() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { isDark } = useTheme();
  const appVersion = Application.nativeApplicationVersion || '1.0.0';
  const buildNumber = Application.nativeBuildVersion || '1';

  // Dynamic Theme Map
  const themeBg = isDark ? '#000000' : '#F8FAFC';
  const textMain = isDark ? '#FFFFFF' : '#111111';
  const textMuted = isDark ? '#888888' : '#64748B';
  const borderSubtle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const pressedBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';

  const handleCheckUpdates = () => showAlert('Up to Date!', `You're running the latest version (v${appVersion}).`, [], 'success');

  const ACTIONS = [
    { icon: 'update', color: '#10B981', bg: 'rgba(16,185,129,0.1)', label: 'Check for Updates', desc: 'See if a newer version is available', onPress: handleCheckUpdates },
  ];

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
          <AppText style={[styles.heroTitle, { color: textMain }]}>About{"\n"}App</AppText>
          <AppText style={[styles.heroSub, { color: textMain }]}>SmartStay Hostels</AppText>
          <View style={[styles.badge, { backgroundColor: borderSubtle }]}>
            <AppText style={[styles.badgeText, { color: textMain }]}>v{appVersion} ({buildNumber})</AppText>
          </View>
        </View>

        <View style={styles.section}>
          <AppText style={styles.secTitle}>APP INFORMATION</AppText>
          {[['Version', `v${appVersion}`], ['Build', buildNumber], ['Platform', Platform.OS === 'ios' ? 'iOS' : 'Android'], ['Package', Application.applicationId || 'com.smarthostel.app']].map(([label, value]) => (
            <View key={label as string} style={[styles.infoRow, { borderColor: borderSubtle }]}>
              <AppText style={styles.infoLabel}>{label}</AppText>
              <AppText style={[styles.infoValue, { color: textMain }]}>{value}</AppText>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <AppText style={styles.secTitle}>ACTIONS</AppText>
          {ACTIONS.map((item) => (
            <Pressable key={item.label} style={({ pressed }) => [styles.actionRow, { borderColor: borderSubtle }, pressed && { backgroundColor: pressedBg }]} onPress={item.onPress}>
              <View style={[styles.actionIcon, { backgroundColor: item.bg }]}>
                <MaterialCommunityIcons name={item.icon as any} size={22} color={item.color} />
              </View>
              <View style={styles.actionInfo}>
                <AppText style={[styles.actionLabel, { color: textMain }]}>{item.label}</AppText>
                <AppText style={styles.actionDesc}>{item.desc}</AppText>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={textMuted} />
            </Pressable>
          ))}
        </View>

        <View style={styles.footer}>
          <AppText style={styles.footerCopyright}>© 2026 SmartStay Hostels</AppText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingBottom: 24 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  hero: { marginBottom: 48 },
  heroTitle: { fontSize: 40, fontWeight: '800', letterSpacing: -1.5, lineHeight: 44, marginBottom: 12 },
  heroSub: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  section: { marginBottom: 48 },
  secTitle: { fontSize: 11, fontWeight: '700', color: '#888888', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  infoLabel: { fontSize: 15, color: '#888888' },
  infoValue: { fontSize: 15, fontWeight: '600' },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  actionIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  actionInfo: { flex: 1, paddingRight: 12 },
  actionLabel: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  actionDesc: { fontSize: 13, color: '#888888' },
  footer: { alignItems: 'center', paddingVertical: 32 },
  footerCopyright: { fontSize: 12, color: '#666666' },
});
