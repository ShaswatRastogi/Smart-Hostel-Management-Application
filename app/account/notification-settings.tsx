import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../../context/AlertContext';
import { useTheme } from '../../utils/ThemeContext';
import api from '../../utils/api';
import AppText from '../../components/AppText';

const CATEGORIES = [
  { key: 'notices', icon: 'announcement', color: '#3B82F6', label: 'Hostel Notices', desc: 'Announcements, events, and news' },
  { key: 'complaints', icon: 'assignment', color: '#8B5CF6', label: 'Complaints', desc: 'Status changes of filed complaints' },
  { key: 'leaves', icon: 'home', color: '#10B981', label: 'Leave Requests', desc: 'Approval or rejection updates' },
  { key: 'services', icon: 'build', color: '#F59E0B', label: 'Service Requests', desc: 'Technician assignment updates' },
  { key: 'payments', icon: 'payment', color: '#EC4899', label: 'Payments & Fees', desc: 'Fee requests and confirmations' },
  { key: 'mess', icon: 'restaurant', color: '#06B6D4', label: 'Mess Menu', desc: 'Menu update notifications' },
  { key: 'laundry', icon: 'local-laundry-service', color: '#EF4444', label: 'Laundry', desc: 'Pickup and dropoff updates' },
  { key: 'bus', icon: 'directions-bus', color: '#84CC16', label: 'Bus Schedule', desc: 'Routes or timing changes' },
  { key: 'visitors', icon: 'people', color: '#A855F7', label: 'Visitor Requests', desc: 'Registered visitor updates' },
  { key: 'messages', icon: 'chat', color: '#14B8A6', label: 'Direct Messages', desc: 'Admin message alerts' },
];

export default function NotificationSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<any>({ master: true, notices: true, complaints: true, leaves: true, services: true, payments: true, mess: true, laundry: true, bus: true, visitors: true, messages: true });

  // Dynamic Theme Map
  const themeBg = isDark ? '#000000' : '#F8FAFC';
  const textMain = isDark ? '#FFFFFF' : '#111111';
  const textMuted = isDark ? '#888888' : '#64748B';
  const borderSubtle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const iconWrapActiveBg = isDark ? '#111111' : '#E2E8F0';
  const iconWrapInactiveBg = isDark ? '#0A0A0A' : '#F1F5F9';
  const trackFalse = isDark ? '#222222' : '#CBD5E1';
  const thumbFalse = isDark ? '#888888' : '#FFFFFF';

  useEffect(() => { fetchPreferences(); }, []);

  const fetchPreferences = async () => {
    try { const response = await api.get('/notifications/preferences'); if (response.data) setPrefs((c: any) => ({ ...c, ...response.data })); }
    catch (error) {} finally { setLoading(false); }
  };

  const savePreferences = async (updatedPrefs: any) => {
    setSaving(true);
    try { await api.post('/notifications/preferences', { preferences: updatedPrefs }); } catch (error) { showAlert('Error', 'Failed to save preferences.'); } finally { setSaving(false); }
  };

  const togglePreference = (key: string) => { const newPrefs = { ...prefs, [key]: !prefs[key] }; setPrefs(newPrefs); savePreferences(newPrefs); };

  if (loading) return <View style={[styles.loadingContainer, { backgroundColor: themeBg }]}><ActivityIndicator size="large" color={textMain} /></View>;

  const PreferenceItem = ({ icon, label, description, value, onValueChange, isMaster = false, customColor }: any) => (
    <View style={[styles.prefRow, { borderColor: borderSubtle }]}>
      <View style={[styles.iconWrap, value ? (isMaster ? styles.iconWrapMaster : { backgroundColor: iconWrapActiveBg, borderColor: borderSubtle }) : { backgroundColor: iconWrapInactiveBg, borderColor: 'transparent' }]}>
        <MaterialIcons name={icon} size={24} color={value ? (isMaster ? "#10B981" : (customColor || textMain)) : "#666666"} />
      </View>
      <View style={styles.textWrap}>
        <AppText style={[styles.prefLabel, { color: textMain }]}>{label}</AppText>
        <AppText style={styles.prefDesc}>{description}</AppText>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: trackFalse, true: '#10B981' }} thumbColor={value ? '#FFFFFF' : thumbFalse} />
    </View>
  );

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
          <AppText style={[styles.heroTitle, { color: textMain }]}>Push{"\n"}Alerts</AppText>
          <View style={styles.subContainer}>
            <AppText style={[styles.heroSub, { color: textMuted }]}>Customize the alerts you receive on your device.</AppText>
            {saving && <View style={styles.savingBadge}><ActivityIndicator size="small" color="#10B981" /></View>}
          </View>
        </View>

        <View style={styles.section}>
          <AppText style={styles.secTitle}>GLOBAL NOTIFICATIONS</AppText>
          <PreferenceItem icon="notifications-active" label="Allow Notifications" description="Toggle all push alerts on or off globally." value={prefs.master !== false} onValueChange={() => togglePreference('master')} isMaster={true} />
        </View>

        {prefs.master !== false && (
          <View style={styles.section}>
            <AppText style={styles.secTitle}>GRANULAR PREFERENCES</AppText>
            {CATEGORIES.map((cat) => (
              <PreferenceItem key={cat.key} icon={cat.icon} label={cat.label} description={cat.desc} value={prefs[cat.key]} onValueChange={() => togglePreference(cat.key)} customColor={cat.color} />
            ))}
          </View>
        )}
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
  subContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroSub: { flex: 1, fontSize: 15, lineHeight: 22 },
  savingBadge: { padding: 4, borderRadius: 20, backgroundColor: 'rgba(16,185,129,0.1)' },
  section: { marginBottom: 40 },
  secTitle: { fontSize: 11, fontWeight: '700', color: '#888888', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 },
  prefRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1 },
  iconWrap: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16, borderWidth: 1 },
  iconWrapMaster: { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' },
  textWrap: { flex: 1, paddingRight: 12 },
  prefLabel: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  prefDesc: { fontSize: 14, color: '#888888' },
});
