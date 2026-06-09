import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence, interpolate, Extrapolation } from 'react-native-reanimated';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import api from '../../utils/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../../context/AlertContext';
import { fetchUserData, StudentData } from '../../utils/nameUtils';
import { useTheme } from '../../utils/ThemeContext';
import AppText from '../../components/AppText';

interface LinkedService { id: string; name: string; icon: any; linked: boolean; email?: string; linkedDate?: string; }

export default function LinkedAccounts() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [services, setServices] = useState<LinkedService[]>([]);

  // Dynamic Theme Map
  const themeBg = isDark ? '#000000' : '#F8FAFC';
  const textMain = isDark ? '#FFFFFF' : '#111111';
  const textMuted = isDark ? '#888888' : '#64748B';
  const borderSubtle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const iconWrapBg = isDark ? '#111111' : '#E2E8F0';
  const iconWrapInactiveBg = isDark ? '#0A0A0A' : '#F1F5F9';
  const linkBtnBg = isDark ? '#FFFFFF' : '#111111';
  const linkBtnText = isDark ? '#000000' : '#FFFFFF';

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data = await fetchUserData();
      setStudent(data);
      setServices([{ id: 'google', name: 'Google', icon: 'google', linked: !!data?.googleEmail, email: data?.googleEmail || undefined, linkedDate: data?.googleEmail ? 'Connected' : undefined }]);
    } catch (e) {} finally { setLoading(false); }
  };

  const handleToggleLink = async (service: LinkedService) => {
    if (service.linked) {
      showAlert(`Unlink ${service.name}?`, `You will no longer be able to sign in with ${service.name}.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Unlink', style: 'destructive', onPress: async () => {
          if (service.id === 'google') {
            try { setLoading(true); await api.post('/auth/unlink-google'); try { await GoogleSignin.signOut(); } catch (err) {} setServices(prev => prev.map(s => s.id === service.id ? { ...s, linked: false, email: undefined, linkedDate: undefined } : s)); }
            catch (e) { showAlert('Error', 'Failed to unlink Google account.'); } finally { setLoading(false); }
          }
        }}
      ]);
    } else {
      if (service.id === 'google') {
        try {
          setLoading(true); await GoogleSignin.hasPlayServices(); try { await GoogleSignin.signOut(); } catch (err) {}
          const userInfo: any = await GoogleSignin.signIn();
          const idToken = userInfo.data?.idToken || userInfo.idToken;
          if (idToken) { const res = await api.post('/auth/link-google', { token: idToken }); setServices(prev => prev.map(s => s.id === 'google' ? { ...s, linked: true, email: res.data.email, linkedDate: 'Just now' } : s)); }
        } catch (e: any) { showAlert('Error', e.response?.data?.error || 'Failed to link Google account.'); } finally { setLoading(false); }
      }
    }
  };

  const isGoogleLinked = services.find(s => s.id === 'google')?.linked || false;

  const ConnectingChains = () => {
      const link1X = useSharedValue(-10);
      const link2X = useSharedValue(10);

      useEffect(() => {
          if (isGoogleLinked) {
              link1X.value = withTiming(2, { duration: 500, easing: Easing.bounce });
              link2X.value = withTiming(-2, { duration: 500, easing: Easing.bounce });
          } else {
              link1X.value = withTiming(-10, { duration: 500 });
              link2X.value = withTiming(10, { duration: 500 });
          }
      }, [isGoogleLinked]);

      const style1 = useAnimatedStyle(() => ({ transform: [{ translateX: link1X.value }] }));
      const style2 = useAnimatedStyle(() => ({ transform: [{ translateX: link2X.value }] }));

      return (
          <View style={{ position: 'absolute', right: 0, top: 0, flexDirection: 'row', alignItems: 'center' }}>
              <Animated.View style={style1}><MaterialCommunityIcons name="link-variant" size={32} color={isGoogleLinked ? "#10B981" : textMuted} style={{ transform: [{ rotate: '45deg' }] }} /></Animated.View>
              <Animated.View style={style2}><MaterialCommunityIcons name="link-variant" size={32} color={isGoogleLinked ? "#EA4335" : textMuted} style={{ transform: [{ rotate: '45deg' }] }} /></Animated.View>
          </View>
      );
  };

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
        <View style={[styles.hero, { position: 'relative' }]}>
          <AppText style={[styles.heroTitle, { color: textMain }]}>Linked{"\n"}Accounts</AppText>
          <AppText style={[styles.heroSub, { color: textMuted }]}>Manage external accounts linked to your profile for faster, alternative sign-in methods.</AppText>
          <ConnectingChains />
        </View>

        <View style={styles.section}>
          <AppText style={styles.secTitle}>PRIMARY LOGIN</AppText>
          <View style={[styles.row, { borderColor: borderSubtle }]}>
            <View style={[styles.iconWrap, { backgroundColor: iconWrapBg, borderColor: borderSubtle }]}>
              <MaterialCommunityIcons name="email" size={24} color="#10B981" />
            </View>
            <View style={styles.rowInfo}>
              <AppText style={[styles.rowName, { color: textMain }]}>Email & Password</AppText>
              <AppText style={styles.rowEmail}>{student?.email || 'Not set'}</AppText>
            </View>
            <View style={styles.statusPill}>
              <AppText style={styles.statusPillText}>Primary</AppText>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <AppText style={styles.secTitle}>EXTERNAL SERVICES</AppText>
          {services.map((service) => (
            <View key={service.id} style={[styles.row, { borderColor: borderSubtle }]}>
              <View style={[styles.iconWrap, !service.linked && styles.iconWrapInactive, { backgroundColor: service.linked ? iconWrapBg : iconWrapInactiveBg, borderColor: service.linked ? borderSubtle : 'transparent' }]}>
                <MaterialCommunityIcons name={service.icon} size={24} color={service.linked ? (service.id === 'google' ? '#EA4335' : textMain) : "#666666"} />
              </View>
              <View style={styles.rowInfo}>
                <AppText style={[styles.rowName, { color: textMain }]}>{service.name}</AppText>
                {service.linked ? (
                  <>{service.email && <AppText style={styles.rowEmail} numberOfLines={1} ellipsizeMode="tail">{service.email}</AppText>}</>
                ) : (
                  <AppText style={styles.rowEmail}>Not connected</AppText>
                )}
              </View>
              <Pressable style={({ pressed }) => [styles.linkBtn, { backgroundColor: linkBtnBg }, service.linked && styles.unlinkBtn, pressed && { opacity: 0.7 }]} onPress={() => handleToggleLink(service)}>
                <AppText style={[styles.linkBtnText, { color: linkBtnText }, service.linked && styles.unlinkBtnText]}>{service.linked ? 'Unlink' : 'Link'}</AppText>
              </Pressable>
            </View>
          ))}
        </View>

        <AppText style={[styles.infoFooter, { color: textMuted }]}>Linked accounts use industry-standard OAuth 2.0. We never store passwords from your connected services.</AppText>
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
  section: { marginBottom: 40 },
  secTitle: { fontSize: 11, fontWeight: '700', color: '#888888', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1 },
  iconWrap: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16, borderWidth: 1 },
  iconWrapInactive: {},
  rowInfo: { flex: 1, paddingRight: 12 },
  rowName: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  rowEmail: { fontSize: 14, color: '#888888' },
  statusPill: { backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' },
  statusPillText: { color: '#10B981', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  linkBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  linkBtnText: { fontSize: 14, fontWeight: '800' },
  unlinkBtn: { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  unlinkBtnText: { color: '#EF4444' },
  infoFooter: { fontSize: 13, lineHeight: 20, marginTop: 16 },
});
