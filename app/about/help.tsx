import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { LayoutAnimation, Linking, Platform, ScrollView, StyleSheet, TouchableOpacity, UIManager, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../utils/ThemeContext';
import AppText from '../../components/AppText';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQS = [
  {
    icon: 'calendar-check-outline', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',
    q: 'How do I submit a leave request?',
    a: 'Go to the home tab, click on "Apply Leave", and fill out the form with your dates and reason. You will be notified via push notification once the warden approves or rejects it.',
  },
  {
    icon: 'silverware-fork-knife', color: '#10B981', bg: 'rgba(16,185,129,0.1)',
    q: 'Where do I find the mess menu?',
    a: 'The mess menu is accessible from the home screen under the quick actions section. It shows the daily schedule with breakfast, lunch, snacks, and dinner.',
  },
  {
    icon: 'wrench-outline', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',
    q: 'How do I report a maintenance issue?',
    a: 'Tap the "Complaints" section from the dashboard and choose the category of your issue (e.g., Electrical, Plumbing, Furniture). Add photos and a description for faster resolution.',
  },
  {
    icon: 'phone-outline', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)',
    q: 'Can I change my registered phone number?',
    a: 'Yes, you can change your phone number in the Edit Profile section under Settings. Navigate to Settings → Edit Profile and update your contact details.',
  },
  {
    icon: 'account-group-outline', color: '#EC4899', bg: 'rgba(236,72,153,0.1)',
    q: 'How do I register a visitor?',
    a: 'Go to the "Visitors" section from campus services, tap "Register Visitor", and provide the visitor\'s name, purpose, and expected arrival time. The warden will receive a notification for approval.',
  },
  {
    icon: 'bell-outline', color: '#06B6D4', bg: 'rgba(6,182,212,0.1)',
    q: 'How do I manage notifications?',
    a: 'Go to Settings → Push Notifications. You can toggle individual notification categories like complaints, leaves, payments, and more. Changes save automatically.',
  },
];

const CONTACTS = [
  {
    icon: 'email-outline', color: '#3B82F6', bg: 'rgba(59,130,246,0.08)',
    label: 'Email Support',
    value: 'support@smarthostel.com',
    onPress: () => Linking.openURL('mailto:support@smarthostel.com'),
  },
  {
    icon: 'phone-outline', color: '#10B981', bg: 'rgba(16,185,129,0.08)',
    label: 'Warden Desk',
    value: '+91 9876543210',
    onPress: () => Linking.openURL('tel:+919876543210'),
  },
  {
    icon: 'clock-outline', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',
    label: 'Office Hours',
    value: 'Mon–Sat, 9:00 AM – 6:00 PM',
    onPress: undefined,
  },
];

export default function HelpCenter() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient
        colors={['#000428', '#004e92']}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <View>
            <AppText style={styles.headerTitle}>Help Center</AppText>
            <AppText style={styles.headerSubtitle}>FAQs & Support</AppText>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.heroIconWrap, { backgroundColor: isDark ? '#0F172A' : '#EFF6FF' }]}>
            <LinearGradient colors={['#004e92', '#000428']} style={styles.heroIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <MaterialCommunityIcons name="lifebuoy" size={32} color="#fff" />
            </LinearGradient>
          </View>
          <AppText style={[styles.heroTitle, { color: colors.text }]}>How can we help?</AppText>
          <AppText style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Find quick answers to common questions below, or reach out to our support team.
          </AppText>
        </View>

        {/* FAQ Section */}
        <AppText style={[styles.sectionTitle, { color: colors.textSecondary }]}>FREQUENTLY ASKED QUESTIONS</AppText>

        {FAQS.map((faq, index) => {
          const isExpanded = expandedIndex === index;
          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.7}
              onPress={() => toggleFAQ(index)}
              style={[styles.card, {
                backgroundColor: colors.card,
                borderColor: isExpanded ? (isDark ? '#334155' : '#BFDBFE') : colors.border,
              }]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconBox, { backgroundColor: faq.bg }]}>
                  <MaterialCommunityIcons name={faq.icon as any} size={20} color={faq.color} />
                </View>
                <AppText style={[styles.cardQuestion, { color: colors.text, flex: 1 }]}>{faq.q}</AppText>
                <MaterialCommunityIcons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={22}
                  color={colors.textSecondary}
                />
              </View>
              {isExpanded && (
                <AppText style={[styles.cardAnswer, { color: colors.textSecondary }]}>{faq.a}</AppText>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Contact Section */}
        <AppText style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 32 }]}>CONTACT SUPPORT</AppText>

        <View style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {CONTACTS.map((contact, i) => (
            <React.Fragment key={i}>
              <TouchableOpacity
                style={styles.contactRow}
                onPress={contact.onPress}
                disabled={!contact.onPress}
                activeOpacity={0.6}
              >
                <View style={[styles.contactIconBox, { backgroundColor: contact.bg }]}>
                  <MaterialCommunityIcons name={contact.icon as any} size={22} color={contact.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText style={[styles.contactLabel, { color: colors.textSecondary }]}>{contact.label}</AppText>
                  <AppText style={[styles.contactValue, { color: colors.text }]}>{contact.value}</AppText>
                </View>
                {contact.onPress && (
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
              {i < CONTACTS.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
            </React.Fragment>
          ))}
        </View>

        {/* Emergency Notice */}
        <View style={[styles.emergencyCard, {
          backgroundColor: isDark ? '#1c1917' : '#FFF7ED',
          borderColor: isDark ? '#451a03' : '#FED7AA',
        }]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={22} color="#F59E0B" />
          <View style={{ flex: 1 }}>
            <AppText style={[styles.emergencyTitle, { color: isDark ? '#FCD34D' : '#92400E' }]}>Emergency?</AppText>
            <AppText style={[styles.emergencyText, { color: isDark ? '#FDE68A' : '#B45309' }]}>
              For urgent issues outside office hours, contact the security desk directly at the hostel gate.
            </AppText>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff', textAlign: 'center' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 2 },
  hero: { alignItems: 'center', marginBottom: 24, gap: 8 },
  heroIconWrap: {
    width: 80, height: 80, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  heroIcon: {
    width: 64, height: 64, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  heroTitle: { fontSize: 22, fontWeight: '800', letterSpacing: 0.3 },
  heroSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 21, paddingHorizontal: 10 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', letterSpacing: 1.1,
    marginBottom: 12, marginLeft: 4,
  },
  card: {
    borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 10,
    shadowColor: '#004e92', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIconBox: {
    width: 38, height: 38, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  cardQuestion: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  cardAnswer: { fontSize: 14, lineHeight: 22, marginTop: 12, marginLeft: 50 },
  contactCard: {
    borderRadius: 20, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#004e92', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  contactIconBox: {
    width: 44, height: 44, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  contactLabel: { fontSize: 12, fontWeight: '500' },
  contactValue: { fontSize: 15, fontWeight: '600', marginTop: 2 },
  divider: { height: 1, marginLeft: 74 },
  emergencyCard: {
    borderRadius: 20, borderWidth: 1, padding: 16, marginTop: 20,
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
  },
  emergencyTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  emergencyText: { fontSize: 13, lineHeight: 19 },
});
