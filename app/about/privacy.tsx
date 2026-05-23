import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Animated, LayoutAnimation, Platform, ScrollView, StyleSheet, TouchableOpacity, UIManager, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../utils/ThemeContext';
import AppText from '../../components/AppText';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SECTIONS = [
  {
    icon: 'database-search', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',
    title: 'Information We Collect',
    content: 'We collect information that you provide directly to us, such as your name, roll number, email address, phone number, and emergency contact details when you register or use the SmartStay Hostels application.',
  },
  {
    icon: 'cog-outline', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)',
    title: 'How We Use Your Information',
    content: 'We use the information we collect to manage your hostel stay, process leave requests, handle complaints, and send important notifications related to hostel administration.',
  },
  {
    icon: 'shield-lock-outline', color: '#10B981', bg: 'rgba(16,185,129,0.1)',
    title: 'Data Security',
    content: 'We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, modification, or disclosure. However, no internet transmission is 100% secure.',
  },
  {
    icon: 'account-group-outline', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',
    title: 'Sharing Your Information',
    content: 'Your data is strictly accessible only to authorized hostel administrators. We do not sell or share your personal information with third parties for marketing purposes.',
  },
  {
    icon: 'email-outline', color: '#EC4899', bg: 'rgba(236,72,153,0.1)',
    title: 'Contact Us',
    content: 'If you have questions about this Privacy Policy, please contact the administration office or email us at privacy@smarthostel.com.',
  },
];

export default function PrivacyPolicy() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const toggleSection = (index: number) => {
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
          <AppText style={styles.headerTitle}>Privacy Policy</AppText>
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
              <MaterialCommunityIcons name="shield-check" size={32} color="#fff" />
            </LinearGradient>
          </View>
          <AppText style={[styles.heroTitle, { color: colors.text }]}>Your Privacy Matters</AppText>
          <AppText style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            We are committed to protecting your personal data and being transparent about how we use it.
          </AppText>
        </View>

        {/* Accordion Sections */}
        {SECTIONS.map((section, index) => {
          const isExpanded = expandedIndex === index;
          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.7}
              onPress={() => toggleSection(index)}
              style={[styles.card, {
                backgroundColor: colors.card,
                borderColor: isExpanded ? (isDark ? '#334155' : '#BFDBFE') : colors.border,
              }]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconBox, { backgroundColor: section.bg }]}>
                  <MaterialCommunityIcons name={section.icon as any} size={22} color={section.color} />
                </View>
                <AppText style={[styles.cardTitle, { color: colors.text, flex: 1 }]}>{section.title}</AppText>
                <MaterialCommunityIcons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={22}
                  color={colors.textSecondary}
                />
              </View>
              {isExpanded && (
                <AppText style={[styles.cardContent, { color: colors.textSecondary }]}>{section.content}</AppText>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={[styles.footerBadge, { backgroundColor: isDark ? '#1e293b' : '#F1F5F9' }]}>
            <MaterialCommunityIcons name="calendar-clock" size={14} color={colors.textSecondary} />
            <AppText style={[styles.footerText, { color: colors.textSecondary }]}>Last Updated: April 2026</AppText>
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
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
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
  card: {
    borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 12,
    shadowColor: '#004e92', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  cardIconBox: {
    width: 42, height: 42, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardContent: { fontSize: 14, lineHeight: 22, marginTop: 12, marginLeft: 56 },
  footer: { alignItems: 'center', marginTop: 20 },
  footerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  footerText: { fontSize: 12, fontWeight: '600' },
});
