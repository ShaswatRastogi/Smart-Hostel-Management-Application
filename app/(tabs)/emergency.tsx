import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../utils/authUtils';
import { EmergencyContact, subscribeToContacts } from '../../utils/emergencySyncUtils';
import { fetchUserData, StudentData } from '../../utils/nameUtils';
import { useTheme } from '../../utils/ThemeContext';
import AppText from '../../components/AppText';
import api from '../../utils/api';


export default function Emergency() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const user = useUser();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [wardens, setWardens] = useState<any[]>([]);
  const [userData, setUserData] = useState<StudentData | null>(null);
  const [loadingWardens, setLoadingWardens] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToContacts((data) => {
      setContacts(data);
    });

    // Fetch user data for medical info
    fetchUserData().then(setUserData);

    // Fetch Wardens
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
    // Consider online if seen in the last 5 minutes
    return (now.getTime() - lastSeenDate.getTime()) < 5 * 60 * 1000;
  };

  const getStatusColor = (lastSeen: string | null) => {
    return isOnline(lastSeen) ? '#10B981' : '#94A3B8';
  };

  const handleMessage = (warden?: any) => {
    if (warden?.id) {
      // Private chat with specific warden
      router.push({
        pathname: `/chat/${user?.uid || user?.email || 'guest'}`,
        params: { staffId: warden.id.toString(), name: warden.fullName }
      });
    } else {
      // General Admin Support
      router.push(`/chat/${user?.uid || user?.email || 'guest'}`);
    }
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

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
              <AppText style={styles.headerTitle}>Emergency</AppText>
              <AppText style={styles.headerSubtitle}>24/7 Support & Help</AppText>
            </View>
            <View style={styles.sosIconContainer}>
              <MaterialCommunityIcons name="alarm-light" size={28} color="#EF4444" />
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ padding: 24 }}>
          {/* Helper Banner */}
          <View style={[styles.banner, {
            backgroundColor: isDark ? colors.card : '#EFF6FF',
            borderColor: isDark ? colors.border : '#DBEAFE'
          }]}>
            <MaterialCommunityIcons name="information-outline" size={24} color={isDark ? colors.primary : "#004e92"} />
            <AppText style={[styles.bannerText, { color: isDark ? colors.text : '#1E40AF' }]}>
              {wardens.length > 0 ? "Message our wardens directly for immediate assistance." : "Tap on any contact card below to initiate an immediate call."}
            </AppText>
          </View>

          {/* Support Chat Card */}
          {/* Wardens Section */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 }}>
              <MaterialCommunityIcons name="shield-account" size={22} color={colors.primary} />
              <AppText style={{ fontSize: 18, fontWeight: '800', color: colors.text, marginLeft: 10 }}>
                Wardens on Duty
              </AppText>
            </View>

            {loadingWardens ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : wardens.length > 0 ? (
              <View style={{ gap: 12 }}>
                {wardens.map((warden) => (
                  <Pressable
                    key={warden.id}
                    style={[styles.contactCard, styles.shadowProp, {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    }]}
                    onPress={() => handleMessage(warden)}
                  >
                    <View style={styles.cardInner}>
                      <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#F1F5F9' }]}>
                        <MaterialCommunityIcons name="account" size={26} color={colors.primary} />
                        <View style={[styles.onlineIndicator, { backgroundColor: getStatusColor(warden.lastSeen) }]} />
                      </View>
                      
                      <View style={styles.contactInfo}>
                        <AppText style={[styles.contactName, { color: colors.text }]}>{warden.fullName}</AppText>
                        <AppText style={[styles.contactNumber, { color: colors.textSecondary, fontSize: 12, textTransform: 'capitalize' }]}>
                          {warden.role} • {isOnline(warden.lastSeen) ? 'Active Now' : 'Away'}
                        </AppText>
                      </View>

                      <TouchableOpacity 
                        style={[styles.callBtn, { backgroundColor: colors.primary }]}
                        onPress={() => handleMessage(warden)}
                      >
                        <MaterialCommunityIcons name="message-text" size={20} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Pressable
                style={[styles.contactCard, styles.shadowProp, {
                  backgroundColor: isDark ? colors.card : '#FFFFFF',
                  borderColor: colors.border,
                }]}
                onPress={() => handleMessage()}
              >
                <View style={styles.cardInner}>
                  <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                    <MaterialCommunityIcons name="whatsapp" size={24} color="#25D366" />
                  </View>
                  <View style={styles.contactInfo}>
                    <AppText style={[styles.contactName, { color: colors.text }]}>Admin Support Chat</AppText>
                    <AppText style={[styles.contactNumber, { color: colors.textSecondary }]}>Direct Message to Hostel Admin</AppText>
                  </View>
                  <View style={[styles.callBtn, { backgroundColor: '#25D366' }]}>
                    <MaterialCommunityIcons name="message-text" size={20} color="#fff" />
                  </View>
                </View>
              </Pressable>
            )}
          </View>

























          {/* Medical Profile Card */}
          {userData && (
            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 }}>
                <MaterialCommunityIcons name="medical-bag" size={20} color={isDark ? colors.text : '#1E293B'} />
                <AppText style={{ fontSize: 16, fontWeight: '700', color: isDark ? colors.text : '#1E293B', marginLeft: 8 }}>
                  My Medical Profile
                </AppText>
              </View>

              <View style={[styles.contactCard, styles.shadowProp, { backgroundColor: colors.card, borderColor: colors.border, padding: 16 }]}>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  {/* Blood Group Badge */}
                  <View style={{
                    width: 60, height: 60,
                    borderRadius: 16,
                    backgroundColor: '#FEF2F2',
                    justifyContent: 'center', alignItems: 'center',
                    borderWidth: 1, borderColor: '#FECACA'
                  }}>
                    <MaterialIcons name="water" size={24} color="#EF4444" />
                    <AppText style={{ fontSize: 14, fontWeight: '800', color: '#B91C1C', marginTop: 2 }}>
                      {userData.bloodGroup || 'N/A'}
                    </AppText>
                  </View>

                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <View style={{ marginBottom: 8 }}>
                      <AppText style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 2 }}>Specific Emergency Contact</AppText>
                      <AppText style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{userData.emergencyContactName || 'Not set'}</AppText>
                      {userData.emergencyContactPhone && userData.emergencyContactPhone !== 'N/A' && (
                        <AppText style={{ fontSize: 13, color: colors.primary, fontWeight: '600' }} onPress={() => handleCall(userData.emergencyContactPhone!)}>
                          {userData.emergencyContactPhone}
                        </AppText>
                      )}
                    </View>
                  </View>
                </View>

                {(userData.medicalHistory && userData.medicalHistory !== 'None') && (
                  <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
                    <AppText style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>Medical History / Allergies</AppText>
                    <AppText style={{ fontSize: 14, color: colors.text, lineHeight: 20 }}>
                      {userData.medicalHistory}
                    </AppText>
                  </View>
                )}
              </View>
            </View>
          )}

          <View style={styles.contactsContainer}>
            <View style={{ paddingHorizontal: 4, marginBottom: 4 }}>
              <AppText style={{ fontSize: 16, fontWeight: '700', color: isDark ? colors.text : '#1E293B' }}>
                Quick Support
              </AppText>
            </View>
            {contacts.map((contact, index) => (
              <Pressable
                key={contact.id}
                style={[styles.contactCard, styles.shadowProp, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => handleCall(contact.number)}
              >
                <View style={styles.cardInner}>
                  <View style={[styles.iconBox, { backgroundColor: index === 0 ? '#FEF2F2' : (isDark ? '#172554' : '#EFF6FF') }]}>
                    <MaterialCommunityIcons
                      name={contact.icon as any || 'phone-in-talk'}
                      size={24} // keeping red for emergency
                      color={index === 0 ? "#EF4444" : (isDark ? '#60A5FA' : "#004e92")}
                    />
                  </View>

                  <View style={styles.contactInfo}>
                    <AppText style={[styles.contactName, { color: colors.text }]}>{contact.title} {contact.name ? `• ${contact.name}` : ''}</AppText>
                    <AppText style={[styles.contactNumber, { color: colors.textSecondary }]}>{contact.number}</AppText>
                  </View>

                  <View style={[styles.callBtn, { backgroundColor: index === 0 ? '#EF4444' : '#10B981' }]}>
                    <MaterialIcons name="call" size={20} color="#fff" />
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#004e92",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  headerContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginTop: 4,
  },
  sosIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    gap: 12,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
    fontWeight: '500',
  },
  contactsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  contactCard: {
    borderRadius: 20,
    borderWidth: 1,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff'
  },
  // Removed old iconBox
  dummyIconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  contactNumber: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sosButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 8,
  },
  sosGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  sosTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  sosSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  shadowProp: {
    shadowColor: '#64748B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
});