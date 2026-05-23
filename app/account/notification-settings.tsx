import { MaterialIcons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../../context/AlertContext';
import { useTheme } from '../../utils/ThemeContext';
import api from '../../utils/api';
import AppText from '../../components/AppText';

const PreferenceItem = ({ icon, iconColor, iconBg, label, description, value, onValueChange, colors, isLast }: any) => (
  <View style={[styles.prefRow, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
    <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
      <MaterialIcons name={icon} size={22} color={iconColor} />
    </View>
    <View style={styles.textWrap}>
      <AppText style={[styles.prefLabel, { color: colors.text }]}>{label}</AppText>
      <AppText style={[styles.prefDesc, { color: colors.textSecondary }]}>{description}</AppText>
    </View>
    <Switch value={value} onValueChange={onValueChange} trackColor={{ false: '#CBD5E1', true: '#004e92' }} thumbColor={'#fff'} ios_backgroundColor="#CBD5E1" />
  </View>
);

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
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<any>({ master: true, notices: true, complaints: true, leaves: true, services: true, payments: true, mess: true, laundry: true, bus: true, visitors: true, messages: true });

  useEffect(() => { fetchPreferences(); }, []);

  const fetchPreferences = async () => {
    try { const response = await api.get('/notifications/preferences'); if (response.data) setPrefs((c: any) => ({ ...c, ...response.data })); } catch (error) { console.error('Error fetching preferences:', error); } finally { setLoading(false); }
  };

  const savePreferences = async (updatedPrefs: any) => {
    setSaving(true);
    try { await api.post('/notifications/preferences', { preferences: updatedPrefs }); } catch (error) { console.error('Error saving:', error); showAlert('Error', 'Failed to save preferences.'); } finally { setSaving(false); }
  };

  const togglePreference = (key: string) => { const newPrefs = { ...prefs, [key]: !prefs[key] }; setPrefs(newPrefs); savePreferences(newPrefs); };

  if (loading) return <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}><ActivityIndicator size="large" color="#004e92" /></View>;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#000428', '#004e92']} style={[styles.header, { paddingTop: insets.top + 10 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><MaterialCommunityIcons name="arrow-left" size={22} color="#fff" /></TouchableOpacity>
          <View>
            <AppText style={styles.headerTitle}>Push Notifications</AppText>
            <AppText style={styles.headerSub}>Changes save automatically{saving ? ' • Saving...' : ''}</AppText>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Master Toggle */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 20 }]}>
          <PreferenceItem icon="notifications-active" iconColor={isDark ? '#60A5FA' : '#004e92'} iconBg={isDark ? 'rgba(96,165,250,0.1)' : '#F1F5F9'} label="Allow Notifications" description="Toggle all push alerts on or off" value={prefs.master !== false} onValueChange={() => togglePreference('master')} colors={colors} isLast />
        </View>

        {/* Granular */}
        {prefs.master !== false && (<>
          <AppText style={[styles.secTitle, { color: colors.textSecondary }]}>GRANULAR PREFERENCES</AppText>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {CATEGORIES.map((cat, i) => (
              <PreferenceItem key={cat.key} icon={cat.icon} iconColor={cat.color} iconBg={cat.color + '15'} label={cat.label} description={cat.desc} value={prefs[cat.key]} onValueChange={() => togglePreference(cat.key)} colors={colors} isLast={i === CATEGORIES.length - 1} />
            ))}
          </View>
        </>)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  secTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 1.1, marginBottom: 10, marginLeft: 4 },
  card: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', shadowColor: '#004e92', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  prefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, gap: 12 },
  iconBox: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  textWrap: { flex: 1 },
  prefLabel: { fontSize: 15, fontWeight: '600' },
  prefDesc: { fontSize: 12, marginTop: 2, lineHeight: 16 },
});
