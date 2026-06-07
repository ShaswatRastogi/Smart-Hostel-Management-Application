import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { LayoutAnimation, Platform, ScrollView, StyleSheet, Pressable, UIManager, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const toggleSection = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable 
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]} 
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Typographic Hero */}
        <View style={styles.hero}>
          <AppText style={styles.heroTitle}>Privacy{"\n"}Policy</AppText>
          <AppText style={styles.heroSub}>
            We are committed to protecting your personal data and being transparent about how we use it.
          </AppText>
        </View>

        {/* Accordion Sections */}
        <View style={styles.section}>
          {SECTIONS.map((section, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <Pressable
                key={index}
                onPress={() => toggleSection(index)}
                style={({ pressed }) => [
                  styles.cardRow,
                  pressed && { backgroundColor: 'rgba(255,255,255,0.05)' }
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconWrap, { backgroundColor: section.bg }]}>
                    <MaterialCommunityIcons name={section.icon as any} size={22} color={section.color} />
                  </View>
                  <AppText style={styles.cardTitle}>{section.title}</AppText>
                  <MaterialCommunityIcons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color="#666666"
                  />
                </View>
                {isExpanded && (
                  <View style={styles.cardContentContainer}>
                    <AppText style={styles.cardContent}>{section.content}</AppText>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <AppText style={styles.footerText}>Last Updated: April 2026</AppText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: { paddingHorizontal: 24, paddingBottom: 24 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  
  hero: { marginBottom: 48 },
  heroTitle: { fontSize: 40, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1.5, lineHeight: 44, marginBottom: 12 },
  heroSub: { fontSize: 15, color: '#666666', lineHeight: 22 },
  
  section: { marginBottom: 32 },
  
  iconWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  
  cardRow: { 
    paddingVertical: 16, 
    borderBottomWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)' 
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#FFFFFF', paddingRight: 16, lineHeight: 22 },
  cardContentContainer: { marginTop: 12, paddingLeft: 60, paddingRight: 16, paddingBottom: 8 },
  cardContent: { fontSize: 14, color: '#888888', lineHeight: 22 },
  
  footer: { alignItems: 'center', marginTop: 24 },
  footerText: { fontSize: 12, fontWeight: '600', color: '#666666', textTransform: 'uppercase', letterSpacing: 1 },
});
