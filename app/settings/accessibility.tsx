import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../utils/ThemeContext';
import { useAccessibilityStore } from '../../store/useAccessibilityStore';
import { triggerHaptic } from '../../utils/haptics';
import AppText from '../../components/AppText';

const FONT_SIZES = [
  { id: 'small', label: 'Small', scale: 0.85, preview: 13 },
  { id: 'default', label: 'Default', scale: 1.0, preview: 15 },
  { id: 'large', label: 'Large', scale: 1.15, preview: 17 },
  { id: 'extra-large', label: 'Extra Large', scale: 1.3, preview: 20 },
];

export default function Accessibility() {
  const router = useRouter();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const {
    fontSize: selectedFontSize, hapticFeedback, highContrast, boldText,
    setFontSize, setHapticFeedback, setHighContrast, setBoldText
  } = useAccessibilityStore();

  // Dynamic Theme Map
  const themeBg = isDark ? '#000000' : '#F8FAFC';
  const textMain = isDark ? '#FFFFFF' : '#111111';
  const textMuted = isDark ? '#888888' : '#64748B';
  const borderSubtle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const cardBg = isDark ? '#111111' : '#FFFFFF';

  // Overrides for High Contrast
  const textContrastColor = highContrast ? (isDark ? '#FFFFFF' : '#000000') : textMain;
  const textSecondaryContrastColor = highContrast ? (isDark ? '#E2E8F0' : '#1E293B') : textMuted;
  const borderContrastColor = highContrast ? (isDark ? '#475569' : '#94A3B8') : borderSubtle;
  const cardBgContrast = highContrast ? (isDark ? '#000000' : '#FFFFFF') : cardBg;

  const handleToggle = (setter: any, value: boolean) => {
    triggerHaptic('light'); setter(value);
    import('../../utils/api').then(({ default: api }) => {
      let key = '';
      if (setter === setHapticFeedback) key = 'haptic_feedback';
      if (setter === setHighContrast) key = 'high_contrast';
      if (setter === setBoldText) key = 'bold_text';
      if (key) api.put('/preferences', { preferences: { [key]: value } }).catch(e => console.error(e));
    });
  };

  const handleFontSelect = (sizeId: string) => {
    triggerHaptic('light'); setFontSize(sizeId);
    import('../../utils/api').then(({ default: api }) => {
        api.put('/preferences', { preferences: { font_size: sizeId } }).catch(e => console.error(e));
    });
  };

  const ToggleRow = ({ icon, iconColor, iconBg, label, description, value, onToggle, isLast }: any) => (
    <View style={[styles.toggleRow, !isLast && { borderBottomWidth: highContrast ? 2 : 1, borderBottomColor: borderContrastColor }]}>
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={icon} size={22} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText style={[styles.rowLabel, { color: textContrastColor }]}>{label}</AppText>
        <AppText style={[styles.rowDesc, { color: textSecondaryContrastColor }]}>{description}</AppText>
      </View>
      <Switch value={value} onValueChange={onToggle} trackColor={{ false: borderContrastColor, true: highContrast ? '#2563EB' : '#10B981' }} thumbColor={value ? '#FFFFFF' : (isDark ? '#888888' : '#CBD5E1')} />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeBg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={textMain} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <AppText style={[styles.heroTitle, { color: textMain }]}>Accessibility</AppText>
          <AppText style={[styles.heroSub, { color: textMuted }]}>Adjust text size, contrast, and layout to make the app comfortable for you.</AppText>
        </View>

        <AppText style={[styles.sectionTitle, { color: textSecondaryContrastColor }]}>TEXT SIZE</AppText>
        <View style={[styles.card, { backgroundColor: cardBgContrast, borderColor: borderContrastColor, borderWidth: highContrast ? 2 : 1 }]}>
          {FONT_SIZES.map((size, index) => {
            const isSelected = selectedFontSize === size.id;
            return (
              <TouchableOpacity
                key={size.id}
                style={[
                  styles.fontRow,
                  index !== FONT_SIZES.length - 1 && { borderBottomWidth: highContrast ? 2 : 1, borderBottomColor: borderContrastColor },
                  isSelected && { backgroundColor: isDark ? (highContrast ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.05)') : (highContrast ? 'rgba(0,78,146,0.1)' : 'rgba(0,0,0,0.03)') },
                ]}
                onPress={() => handleFontSelect(size.id)}
              >
                <View style={{ flex: 1 }}>
                  <AppText style={[styles.fontLabel, { color: textContrastColor, fontSize: size.preview }]}>{size.label}</AppText>
                  <AppText style={[styles.fontPreview, { color: textSecondaryContrastColor, fontSize: size.preview - 2 }]}>Preview text at this size</AppText>
                </View>
                <View style={[styles.radioOuter, { borderColor: isSelected ? '#10B981' : borderContrastColor, backgroundColor: isSelected ? '#10B981' : 'transparent' }]}>
                  {isSelected && <MaterialCommunityIcons name="check" size={14} color="#000000" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <AppText style={[styles.sectionTitle, { color: textSecondaryContrastColor }]}>VISUAL</AppText>
        <View style={[styles.card, { backgroundColor: cardBgContrast, borderColor: borderContrastColor, borderWidth: highContrast ? 2 : 1 }]}>
          <ToggleRow icon="format-bold" iconColor="#8B5CF6" iconBg="rgba(139, 92, 246, 0.1)" label="Bold Text" description="Use heavier font weights throughout" value={boldText} onToggle={(v: boolean) => handleToggle(setBoldText, v)} />
          <ToggleRow icon="contrast-box" iconColor="#F59E0B" iconBg="rgba(245, 158, 11, 0.1)" label="High Contrast" description="Increase contrast for better readability" value={highContrast} onToggle={(v: boolean) => handleToggle(setHighContrast, v)} isLast />
        </View>

        <AppText style={[styles.sectionTitle, { color: textSecondaryContrastColor }]}>FEEDBACK</AppText>
        <View style={[styles.card, { backgroundColor: cardBgContrast, borderColor: borderContrastColor, borderWidth: highContrast ? 2 : 1 }]}>
          <ToggleRow icon="vibrate" iconColor="#10B981" iconBg="rgba(16, 185, 129, 0.1)" label="Haptic Feedback" description="Vibrate on button presses and actions" value={hapticFeedback} onToggle={(v: boolean) => handleToggle(setHapticFeedback, v)} isLast />
        </View>

        <AppText style={[styles.footerNote, { color: textSecondaryContrastColor }]}>These accessibility changes apply instantly across the entire app!</AppText>
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
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16, marginTop: 8 },
  card: { borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
  fontRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  fontLabel: { fontWeight: '600' },
  fontPreview: { marginTop: 2 },
  radioOuter: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  iconBox: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowDesc: { fontSize: 12, marginTop: 2 },
  footerNote: { fontSize: 13, paddingHorizontal: 4, marginTop: 16, lineHeight: 18, textAlign: 'center' },
});
