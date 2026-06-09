import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { LayoutAnimation, Linking, Platform, ScrollView, StyleSheet, Pressable, UIManager, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence, interpolate, Extrapolation } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../utils/ThemeContext';
import AppText from '../../components/AppText';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQS = [
  { icon: 'calendar-check-outline', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', q: 'How do I submit a leave request?', a: 'Go to the home tab, click on "Apply Leave", and fill out the form with your dates and reason. You will be notified via push notification once the warden approves or rejects it.' },
  { icon: 'silverware-fork-knife', color: '#10B981', bg: 'rgba(16,185,129,0.1)', q: 'Where do I find the mess menu?', a: 'The mess menu is accessible from the home screen under the quick actions section. It shows the daily schedule with breakfast, lunch, snacks, and dinner.' },
  { icon: 'wrench-outline', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', q: 'How do I report a maintenance issue?', a: 'Tap the "Complaints" section from the dashboard and choose the category of your issue (e.g., Electrical, Plumbing, Furniture). Add photos and a description for faster resolution.' },
  { icon: 'phone-outline', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', q: 'Can I change my registered phone number?', a: 'Yes, you can change your phone number in the Edit Profile section under Settings. Navigate to Settings → Edit Profile and update your contact details.' },
  { icon: 'account-group-outline', color: '#EC4899', bg: 'rgba(236,72,153,0.1)', q: 'How do I register a visitor?', a: 'Go to the "Visitors" section from campus services, tap "Register Visitor", and provide the visitor\'s name, purpose, and expected arrival time. The warden will receive a notification for approval.' },
  { icon: 'bell-outline', color: '#06B6D4', bg: 'rgba(6,182,212,0.1)', q: 'How do I manage notifications?', a: 'Go to Settings → Push Notifications. You can toggle individual notification categories like complaints, leaves, payments, and more. Changes save automatically.' },
];

const CONTACTS = [
  { icon: 'email-outline', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', label: 'Email Support', value: 'support@smarthostel.com', onPress: () => Linking.openURL('mailto:support@smarthostel.com') },
  { icon: 'phone-outline', color: '#10B981', bg: 'rgba(16,185,129,0.1)', label: 'Warden Desk', value: '+91 9876543210', onPress: () => Linking.openURL('tel:+919876543210') },
  { icon: 'clock-outline', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', label: 'Office Hours', value: 'Mon–Sat, 9:00 AM – 6:00 PM', onPress: undefined },
];

export default function HelpCenter() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  // Dynamic Theme Map
  const themeBg = isDark ? '#000000' : '#F8FAFC';
  const textMain = isDark ? '#FFFFFF' : '#111111';
  const textMuted = isDark ? '#888888' : '#64748B';
  const borderSubtle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const pressedBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
  const emergencyCardBg = isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)';
  const emergencyText = isDark ? '#FCA5A5' : '#B91C1C';

  const toggleFAQ = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const BouncingLifebuoy = () => {
      const floatY = useSharedValue(0);

      useEffect(() => {
          floatY.value = withRepeat(
              withSequence(
                  withTiming(-10, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                  withTiming(10, { duration: 1500, easing: Easing.inOut(Easing.ease) })
              ), -1, true
          );
      }, []);

      const buoyStyle = useAnimatedStyle(() => ({
          transform: [{ translateY: floatY.value }]
      }));

      return (
          <Animated.View style={[{ position: 'absolute', right: 0, top: 0 }, buoyStyle]}>
              <MaterialCommunityIcons name="lifebuoy" size={48} color="#EF4444" />
          </Animated.View>
      );
  };

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
          <AppText style={[styles.heroTitle, { color: textMain }]}>Help{"\n"}Center</AppText>
          <AppText style={[styles.heroSub, { color: textMuted }]}>Find quick answers to common questions below, or reach out to our support team.</AppText>
          <BouncingLifebuoy />
        </View>

        <View style={styles.section}>
          <AppText style={styles.secTitle}>FREQUENTLY ASKED QUESTIONS</AppText>
          {FAQS.map((faq, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <Pressable key={index} onPress={() => toggleFAQ(index)} style={({ pressed }) => [styles.faqRow, { borderColor: borderSubtle }, pressed && { backgroundColor: pressedBg }]}>
                <View style={styles.faqHeader}>
                  <View style={[styles.iconWrap, { backgroundColor: faq.bg }]}>
                    <MaterialCommunityIcons name={faq.icon as any} size={20} color={faq.color} />
                  </View>
                  <AppText style={[styles.faqQuestion, { color: textMain }]}>{faq.q}</AppText>
                  <MaterialCommunityIcons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={24} color={textMuted} />
                </View>
                {isExpanded && (
                  <View style={styles.faqAnswerContainer}>
                    <AppText style={[styles.faqAnswer, { color: textMuted }]}>{faq.a}</AppText>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.section}>
          <AppText style={styles.secTitle}>CONTACT SUPPORT</AppText>
          {CONTACTS.map((contact, i) => (
            <Pressable key={i} style={({ pressed }) => [styles.contactRow, { borderColor: borderSubtle }, pressed && contact.onPress && { backgroundColor: pressedBg }]} onPress={contact.onPress} disabled={!contact.onPress}>
              <View style={[styles.iconWrap, { backgroundColor: contact.bg }]}>
                <MaterialCommunityIcons name={contact.icon as any} size={22} color={contact.color} />
              </View>
              <View style={styles.contactInfo}>
                <AppText style={[styles.contactLabel, { color: textMuted }]}>{contact.label}</AppText>
                <AppText style={[styles.contactValue, { color: textMain }]}>{contact.value}</AppText>
              </View>
              {contact.onPress && <MaterialCommunityIcons name="chevron-right" size={24} color={textMuted} />}
            </Pressable>
          ))}
        </View>

        <View style={[styles.emergencyCard, { backgroundColor: emergencyCardBg }]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={28} color="#EF4444" style={{ marginTop: 2 }} />
          <View style={styles.emergencyInfo}>
            <AppText style={styles.emergencyTitle}>Emergency?</AppText>
            <AppText style={[styles.emergencyText, { color: emergencyText }]}>For urgent issues outside office hours, contact the security desk directly at the hostel gate.</AppText>
          </View>
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
  heroSub: { fontSize: 15, lineHeight: 22 },
  section: { marginBottom: 48 },
  secTitle: { fontSize: 11, fontWeight: '700', color: '#888888', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 },
  iconWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  faqRow: { paddingVertical: 16, borderBottomWidth: 1 },
  faqHeader: { flexDirection: 'row', alignItems: 'center' },
  faqQuestion: { flex: 1, fontSize: 16, fontWeight: '600', paddingRight: 16, lineHeight: 22 },
  faqAnswerContainer: { marginTop: 12, paddingLeft: 60, paddingRight: 16, paddingBottom: 8 },
  faqAnswer: { fontSize: 14, lineHeight: 22 },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  contactInfo: { flex: 1, paddingRight: 12 },
  contactLabel: { fontSize: 13, marginBottom: 4 },
  contactValue: { fontSize: 16, fontWeight: '600' },
  emergencyCard: { borderRadius: 24, padding: 24, flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  emergencyInfo: { flex: 1 },
  emergencyTitle: { fontSize: 16, fontWeight: '700', color: '#EF4444', marginBottom: 6 },
  emergencyText: { fontSize: 14, lineHeight: 22 },
});
