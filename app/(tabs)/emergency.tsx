import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence, interpolate, Extrapolation } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../utils/authUtils';
import { EmergencyContact, subscribeToContacts } from '../../utils/emergencySyncUtils';
import { fetchUserData, StudentData } from '../../utils/nameUtils';
import { useTheme } from '../../utils/ThemeContext';
import AppText from '../../components/AppText';
import api from '../../utils/api';

export default function Emergency() {
  const router = useRouter();
  const user = useUser();
  const { isDark } = useTheme();
  
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [wardens, setWardens] = useState<any[]>([]);
  const [userData, setUserData] = useState<StudentData | null>(null);
  const [loadingWardens, setLoadingWardens] = useState(true);

  // Dynamic Theme Colors
  const themeBg = isDark ? '#000000' : '#F8FAFC';
  const textMain = isDark ? '#FFFFFF' : '#111111';
  const textMuted = isDark ? '#888888' : '#64748B';
  const borderSubtle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const iconWrapBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
  const pressedBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';

  useEffect(() => {
    const unsubscribe = subscribeToContacts((data) => setContacts(data));
    fetchUserData().then(setUserData);
    fetchWardens();
    return () => unsubscribe();
  }, []);

  const fetchWardens = async () => {
    try {
      const res = await api.get('/team/wardens');
      setWardens(res.data);
    } catch (error) {
      console.error('Error fetching wardens:', error);
    } finally {
      setLoadingWardens(false);
    }
  };

  const isOnline = (lastSeen: string | null) => {
    if (!lastSeen) return false;
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    return (now.getTime() - lastSeenDate.getTime()) < 5 * 60 * 1000;
  };

  const getStatusColor = (lastSeen: string | null) => {
    return isOnline(lastSeen) ? '#10B981' : textMuted;
  };

  const handleMessage = (warden?: any) => {
    if (warden?.id) {
      router.push({
        pathname: `/chat/${user?.uid || user?.email || 'guest'}`,
        params: { staffId: warden.id.toString(), name: warden.fullName }
      });
    } else {
      router.push(`/chat/${user?.uid || user?.email || 'guest'}`);
    }
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const SectionHeader = ({ title, icon }: { title: string, icon: any }) => (
    <View style={styles.sectionHeader}>
      <MaterialCommunityIcons name={icon} size={16} color={textMuted} />
      <AppText style={[styles.sectionTitle, { color: textMuted }]}>{title}</AppText>
    </View>
  );

  const SosHeartbeat = () => {
      const pulse = useSharedValue(0);
      useEffect(() => {
          pulse.value = withRepeat(
              withSequence(
                  withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) }),
                  withTiming(0, { duration: 1200, easing: Easing.in(Easing.ease) })
              ), -1, false
          );
      }, []);

      const ringStyle = useAnimatedStyle(() => ({
          transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 2.5], Extrapolation.CLAMP) }],
          opacity: interpolate(pulse.value, [0, 1], [0.6, 0], Extrapolation.CLAMP)
      }));
      
      const iconStyle = useAnimatedStyle(() => ({
          transform: [{ scale: interpolate(pulse.value, [0, 0.2, 1], [1, 1.2, 1], Extrapolation.CLAMP) }]
      }));

      return (
          <View style={[styles.heroIconWrap, { position: 'relative' }]}>
              <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#EF4444', borderRadius: 26 }, ringStyle]} />
              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderRadius: 26 }]} />
              <Animated.View style={iconStyle}>
                  <MaterialCommunityIcons name="alarm-light" size={28} color="#EF4444" />
              </Animated.View>
          </View>
      );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeBg }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <View style={styles.header}>
          <AppText style={[styles.headerTitle, { color: textMain }]}>Emergency</AppText>
          <AppText style={[styles.headerSubtitle, { color: textMuted }]}>24/7 Support & Help</AppText>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO SOS ACTION */}
          <Pressable
            style={({ pressed }) => [styles.heroRow, { borderColor: borderSubtle }, pressed && { backgroundColor: pressedBg }]}
            onPress={() => handleCall('112')}
          >
            <SosHeartbeat />
            <View style={styles.heroTextContent}>
              <AppText style={[styles.heroSosTitle, { color: '#EF4444' }]}>Call Security</AppText>
              <AppText style={styles.heroSosSubtitle}>Immediate Assistance</AppText>
            </View>
            <MaterialCommunityIcons name="phone" size={24} color="#EF4444" />
          </Pressable>

          {/* WARDENS ON DUTY */}
          <View style={styles.section}>
            <SectionHeader title="WARDENS ON DUTY" icon="shield-account" />
            {loadingWardens ? (
              <ActivityIndicator color={textMain} size="small" style={{ marginVertical: 20 }} />
            ) : wardens.length > 0 ? (
              wardens.map((warden) => (
                <Pressable
                  key={warden.id}
                  style={({ pressed }) => [styles.row, { borderColor: borderSubtle }, pressed && { backgroundColor: pressedBg }]}
                  onPress={() => handleMessage(warden)}
                >
                  <View style={[styles.avatar, { backgroundColor: iconWrapBg }]}>
                    <MaterialCommunityIcons name="account" size={24} color={textMain} />
                    <View style={[styles.onlineIndicator, { backgroundColor: getStatusColor(warden.lastSeen), borderColor: themeBg }]} />
                  </View>
                  <View style={styles.rowInfo}>
                    <AppText style={[styles.rowTitle, { color: textMain }]} numberOfLines={1}>{warden.fullName}</AppText>
                    <AppText style={[styles.rowSubtitle, { color: textMuted }]}>{warden.role}</AppText>
                  </View>
                  <MaterialCommunityIcons name="message-text" size={22} color={textMain} />
                </Pressable>
              ))
            ) : (
              <Pressable
                style={({ pressed }) => [styles.row, { borderColor: borderSubtle }, pressed && { backgroundColor: pressedBg }]}
                onPress={() => handleMessage()}
              >
                <View style={[styles.avatar, { backgroundColor: iconWrapBg }]}>
                  <MaterialCommunityIcons name="message-alert" size={24} color={textMain} />
                </View>
                <View style={styles.rowInfo}>
                  <AppText style={[styles.rowTitle, { color: textMain }]}>Admin Support</AppText>
                  <AppText style={[styles.rowSubtitle, { color: textMuted }]}>Direct Message</AppText>
                </View>
                <MaterialCommunityIcons name="message-text" size={22} color={textMain} />
              </Pressable>
            )}
          </View>

          {/* MEDICAL ID */}
          {userData && (
            <View style={styles.section}>
              <SectionHeader title="MEDICAL ID" icon="medical-bag" />
              
              <View style={[styles.row, { borderColor: borderSubtle }]}>
                <View style={[styles.iconWrap, { backgroundColor: iconWrapBg }]}>
                  <MaterialIcons name="water-drop" size={20} color="#EF4444" />
                </View>
                <View style={styles.rowInfo}>
                  <AppText style={[styles.rowTitle, { color: textMain }]}>Blood Group</AppText>
                  <AppText style={[styles.rowSubtitle, { color: textMuted }]}>{userData.bloodGroup || 'Not provided'}</AppText>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [styles.row, { borderColor: borderSubtle }, pressed && userData.emergencyContactPhone && userData.emergencyContactPhone !== 'N/A' && { backgroundColor: pressedBg }]}
                onPress={() => {
                  if (userData.emergencyContactPhone && userData.emergencyContactPhone !== 'N/A') {
                    handleCall(userData.emergencyContactPhone);
                  }
                }}
              >
                <View style={[styles.iconWrap, { backgroundColor: iconWrapBg }]}>
                  <MaterialCommunityIcons name="heart-pulse" size={20} color="#F59E0B" />
                </View>
                <View style={styles.rowInfo}>
                  <AppText style={[styles.rowTitle, { color: textMain }]}>{userData.emergencyContactName || 'Emergency Contact'}</AppText>
                  <AppText style={[styles.rowSubtitle, { color: textMuted }]}>{userData.emergencyContactPhone || 'Not provided'}</AppText>
                </View>
                {userData.emergencyContactPhone && userData.emergencyContactPhone !== 'N/A' && (
                  <MaterialCommunityIcons name="phone" size={22} color={textMain} />
                )}
              </Pressable>

              {(userData.medicalHistory && userData.medicalHistory !== 'None') && (
                <View style={[styles.historyRow, { borderColor: borderSubtle }]}>
                  <AppText style={[styles.historyLabel, { color: textMain }]}>Medical History / Allergies</AppText>
                  <AppText style={[styles.historyText, { color: textMuted }]}>{userData.medicalHistory}</AppText>
                </View>
              )}
            </View>
          )}

          {/* QUICK DIAL */}
          <View style={styles.section}>
            <SectionHeader title="QUICK DIAL" icon="phone-classic" />
            {contacts.map((contact) => (
              <Pressable
                key={contact.id}
                style={({ pressed }) => [styles.row, { borderColor: borderSubtle }, pressed && { backgroundColor: pressedBg }]}
                onPress={() => handleCall(contact.number)}
              >
                <View style={[styles.iconWrap, { backgroundColor: iconWrapBg }]}>
                  <MaterialCommunityIcons name={contact.icon as any || 'phone'} size={20} color={textMain} />
                </View>
                <View style={styles.rowInfo}>
                  <AppText style={[styles.rowTitle, { color: textMain }]}>{contact.title}</AppText>
                  <AppText style={[styles.rowSubtitle, { color: textMuted }]}>{contact.number}</AppText>
                </View>
                <MaterialCommunityIcons name="phone" size={22} color={textMain} />
              </Pressable>
            ))}
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24 },
  headerTitle: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  headerSubtitle: { fontSize: 15, fontWeight: '600', marginTop: 4, letterSpacing: 0.2 },
  content: { flex: 1 },
  
  heroRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, paddingHorizontal: 24, borderTopWidth: 1, borderBottomWidth: 1, marginBottom: 32 },
  heroIconWrap: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  heroTextContent: { flex: 1 },
  heroSosTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  heroSosSubtitle: { fontSize: 13, fontWeight: '600', color: '#EF4444', marginTop: 2 },

  section: { marginBottom: 40 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginBottom: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '800', marginLeft: 8, letterSpacing: 1.5 },

  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 24, borderBottomWidth: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  onlineIndicator: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  rowInfo: { flex: 1, paddingRight: 12 },
  rowTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  rowSubtitle: { fontSize: 13, fontWeight: '500' },

  historyRow: { paddingVertical: 16, paddingHorizontal: 24, borderBottomWidth: 1 },
  historyLabel: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  historyText: { fontSize: 14, lineHeight: 22 },
});