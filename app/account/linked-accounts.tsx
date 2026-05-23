import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import api from '../../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../../context/AlertContext';
import { useTheme } from '../../utils/ThemeContext';
import { fetchUserData, StudentData } from '../../utils/nameUtils';
import AppText from '../../components/AppText';

interface LinkedService { id: string; name: string; icon: any; color: string; bgColor: string; linked: boolean; email?: string; linkedDate?: string; }

export default function LinkedAccounts() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [services, setServices] = useState<LinkedService[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data = await fetchUserData();
      setStudent(data);
      setServices([
        { id: 'google', name: 'Google', icon: 'google', color: '#EA4335', bgColor: 'rgba(234,67,53,0.1)', linked: !!data?.googleEmail, email: data?.googleEmail || undefined, linkedDate: data?.googleEmail ? 'Connected' : undefined },
      ]);
    } catch (e) { console.error('Failed to load linked accounts:', e); } finally { setLoading(false); }
  };

  const handleToggleLink = async (service: LinkedService) => {
    if (service.linked) {
      showAlert(`Unlink ${service.name}?`, `You will no longer be able to sign in with ${service.name}.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Unlink', style: 'destructive', onPress: async () => {
          if (service.id === 'google') {
            try { setLoading(true); await api.post('/auth/unlink-google'); try { await GoogleSignin.signOut(); } catch (err) {} setServices(prev => prev.map(s => s.id === service.id ? { ...s, linked: false, email: undefined, linkedDate: undefined } : s)); showAlert('Unlinked', `${service.name} has been unlinked.`, [], 'success'); } catch (e) { showAlert('Error', 'Failed to unlink Google account.'); } finally { setLoading(false); }
          }
        }}
      ]);
    } else {
      if (service.id === 'google') {
        try {
          setLoading(true); await GoogleSignin.hasPlayServices();
          try { await GoogleSignin.signOut(); } catch (err) {}
          const userInfo: any = await GoogleSignin.signIn();
          const idToken = userInfo.data?.idToken || userInfo.idToken;
          if (idToken) { const res = await api.post('/auth/link-google', { token: idToken }); setServices(prev => prev.map(s => s.id === 'google' ? { ...s, linked: true, email: res.data.email, linkedDate: 'Just now' } : s)); showAlert('Linked!', 'Google account successfully linked.', [], 'success'); }
        } catch (e: any) { console.error(e); showAlert('Error', e.response?.data?.error || 'Failed to link Google account.'); } finally { setLoading(false); }
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#000428', '#004e92']} style={[styles.header, { paddingTop: insets.top + 10 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><MaterialCommunityIcons name="arrow-left" size={22} color="#fff" /></TouchableOpacity>
          <AppText style={styles.headerTitle}>Linked Accounts</AppText>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {loading ? <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#004e92" /></View> : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={styles.hero}>
            <View style={[styles.heroIconWrap, { backgroundColor: isDark ? '#0F172A' : '#EFF6FF' }]}>
              <LinearGradient colors={['#004e92', '#000428']} style={styles.heroIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <MaterialCommunityIcons name="link-variant" size={32} color="#fff" />
              </LinearGradient>
            </View>
            <AppText style={[styles.heroTitle, { color: colors.text }]}>Connected Services</AppText>
            <AppText style={[styles.heroSub, { color: colors.textSecondary }]}>Manage external accounts linked to your SmartStay profile for alternative sign-in methods.</AppText>
          </View>

          {/* Primary Login */}
          <AppText style={[styles.secTitle, { color: colors.textSecondary }]}>PRIMARY LOGIN</AppText>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.serviceRow}>
              <View style={[styles.serviceIcon, { backgroundColor: 'rgba(16,185,129,0.1)' }]}><MaterialCommunityIcons name="email-lock" size={24} color="#10B981" /></View>
              <View style={{ flex: 1 }}><AppText style={[styles.serviceName, { color: colors.text }]}>Email & Password</AppText><AppText style={[styles.serviceEmail, { color: colors.textSecondary }]}>{student?.email || 'Not set'}</AppText></View>
              <View style={[styles.statusBadge, { backgroundColor: 'rgba(16,185,129,0.1)' }]}><AppText style={[styles.statusText, { color: '#10B981' }]}>Primary</AppText></View>
            </View>
          </View>

          {/* Linked Services */}
          <AppText style={[styles.secTitle, { color: colors.textSecondary, marginTop: 20 }]}>LINKED SERVICES</AppText>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {services.map((service, i) => (
              <View key={service.id}>
                <View style={styles.serviceRow}>
                  <View style={[styles.serviceIcon, { backgroundColor: service.bgColor }]}><MaterialCommunityIcons name={service.icon} size={24} color={service.color} /></View>
                  <View style={{ flex: 1 }}>
                    <AppText style={[styles.serviceName, { color: colors.text }]}>{service.name}</AppText>
                    {service.linked ? (<>
                      {service.email && <AppText style={[styles.serviceEmail, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">{service.email}</AppText>}
                      {service.linkedDate && <AppText style={[styles.serviceDate, { color: colors.textSecondary }]}>{service.linkedDate}</AppText>}
                    </>) : <AppText style={[styles.serviceEmail, { color: colors.textSecondary }]}>Not connected</AppText>}
                  </View>
                  <TouchableOpacity style={[styles.linkBtn, { backgroundColor: service.linked ? (isDark ? '#1e293b' : '#F1F5F9') : '#004e92', borderColor: service.linked ? colors.border : '#004e92' }]} onPress={() => handleToggleLink(service)}>
                    <AppText style={[styles.linkBtnText, { color: service.linked ? colors.text : '#fff' }]}>{service.linked ? 'Unlink' : 'Link'}</AppText>
                  </TouchableOpacity>
                </View>
                {i < services.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              </View>
            ))}
          </View>

          {/* Security Note */}
          <View style={[styles.noteCard, { backgroundColor: isDark ? '#0c2d48' : '#EFF6FF', borderColor: isDark ? '#1e3a5f' : '#BFDBFE' }]}>
            <MaterialCommunityIcons name="shield-check" size={18} color={isDark ? '#93C5FD' : '#3B82F6'} />
            <AppText style={[styles.noteText, { color: isDark ? '#93C5FD' : '#1D4ED8' }]}>Linked accounts use industry-standard OAuth 2.0 for secure authentication. We never store passwords from linked services.</AppText>
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
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  hero: { alignItems: 'center', marginBottom: 24, gap: 8 },
  heroIconWrap: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  heroIcon: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  heroTitle: { fontSize: 22, fontWeight: '800', letterSpacing: 0.3 },
  heroSub: { fontSize: 14, textAlign: 'center', lineHeight: 21, paddingHorizontal: 10 },
  secTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 1.1, marginBottom: 10, marginLeft: 4 },
  card: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', shadowColor: '#004e92', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  serviceRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  serviceIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  serviceName: { fontSize: 16, fontWeight: '600' },
  serviceEmail: { fontSize: 13, marginTop: 2 },
  serviceDate: { fontSize: 11, marginTop: 1 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
  linkBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  linkBtnText: { fontSize: 14, fontWeight: '600' },
  divider: { height: 1, marginLeft: 78 },
  noteCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginTop: 24, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  noteText: { fontSize: 13, lineHeight: 19, flex: 1 },
});
