import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
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
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const {
    fontSize: selectedFontSize,
    hapticFeedback,
    highContrast,
    boldText,
    setFontSize,
    setHapticFeedback,
    setHighContrast,
    setBoldText
  } = useAccessibilityStore();

  const textContrastColor = highContrast ? (isDark ? '#FFFFFF' : '#000000') : colors.text;
  const textSecondaryContrastColor = highContrast ? (isDark ? '#E2E8F0' : '#1E293B') : colors.textSecondary;
  const borderContrastColor = highContrast ? (isDark ? '#475569' : '#94A3B8') : colors.border;

  const handleToggle = (setter: any, value: boolean) => {
    triggerHaptic('light');
    setter(value);
    
    // Also sync to API
    import('../../utils/api').then(({ default: api }) => {
      // Need to find the key. For simplicity here, we'll map setter names to API keys, 
      // or we can just send the whole pref payload in real app.
      let key = '';
      if (setter === setHapticFeedback) key = 'haptic_feedback';
      if (setter === setHighContrast) key = 'high_contrast';
      if (setter === setBoldText) key = 'bold_text';
      
      if (key) {
        api.put('/preferences', { preferences: { [key]: value } }).catch(e => console.error(e));
      }
    });
  };

  const handleFontSelect = (sizeId: string) => {
    triggerHaptic('light');
    setFontSize(sizeId);
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
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: borderContrastColor, true: highContrast ? '#2563EB' : '#60A5FA' }}
        thumbColor={value ? (highContrast ? '#003366' : '#004e92') : '#f4f3f4'}
      />
    </View>
  );

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
          <AppText style={styles.headerTitle}>Accessibility</AppText>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.heroIconWrap, { backgroundColor: isDark ? '#0F172A' : '#EFF6FF' }]}>
            <LinearGradient colors={['#004e92', '#000428']} style={styles.heroIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <MaterialCommunityIcons name="human-handsup" size={32} color="#fff" />
            </LinearGradient>
          </View>
          <AppText style={[styles.heroTitle, { color: textContrastColor }]}>Personalize Your Experience</AppText>
          <AppText style={[styles.heroSub, { color: textSecondaryContrastColor }]}>
            Adjust text size, contrast, and layout to make the app comfortable for you.
          </AppText>
        </View>

        {/* Font Size Section */}
        <AppText style={[styles.sectionTitle, { color: textSecondaryContrastColor }]}>TEXT SIZE</AppText>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: borderContrastColor, borderWidth: highContrast ? 2 : 1 }]}>
          {FONT_SIZES.map((size, index) => {
            const isSelected = selectedFontSize === size.id;
            return (
              <TouchableOpacity
                key={size.id}
                style={[
                  styles.fontRow,
                  index !== FONT_SIZES.length - 1 && { borderBottomWidth: highContrast ? 2 : 1, borderBottomColor: borderContrastColor },
                  isSelected && { backgroundColor: isDark ? (highContrast ? 'rgba(96,165,250,0.15)' : 'rgba(96,165,250,0.06)') : (highContrast ? 'rgba(0,78,146,0.1)' : 'rgba(0,78,146,0.04)') },
                ]}
                onPress={() => handleFontSelect(size.id)}
              >
                <View style={{ flex: 1 }}>
                  <AppText style={[styles.fontLabel, { color: textContrastColor, fontSize: size.preview }]}>{size.label}</AppText>
                  <AppText style={[styles.fontPreview, { color: textSecondaryContrastColor, fontSize: size.preview - 2 }]}>
                    Preview text at this size
                  </AppText>
                </View>
                <View style={[styles.radioOuter, {
                  borderColor: isSelected ? '#004e92' : colors.border,
                  backgroundColor: isSelected ? '#004e92' : 'transparent',
                }]}>
                  {isSelected && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Visual Section */}
        <AppText style={[styles.sectionTitle, { color: textSecondaryContrastColor }]}>VISUAL</AppText>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: borderContrastColor, borderWidth: highContrast ? 2 : 1 }]}>
          <ToggleRow
            icon="format-bold"
            iconColor="#8B5CF6"
            iconBg="rgba(139, 92, 246, 0.1)"
            label="Bold Text"
            description="Use heavier font weights throughout"
            value={boldText}
            onToggle={(v: boolean) => handleToggle(setBoldText, v)}
          />
          <ToggleRow
            icon="contrast-box"
            iconColor="#F59E0B"
            iconBg="rgba(245, 158, 11, 0.1)"
            label="High Contrast"
            description="Increase contrast for better readability"
            value={highContrast}
            onToggle={(v: boolean) => handleToggle(setHighContrast, v)}
            isLast
          />
        </View>

        {/* Feedback */}
        <AppText style={[styles.sectionTitle, { color: textSecondaryContrastColor }]}>FEEDBACK</AppText>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: borderContrastColor, borderWidth: highContrast ? 2 : 1 }]}>
          <ToggleRow
            icon="vibrate"
            iconColor="#10B981"
            iconBg="rgba(16, 185, 129, 0.1)"
            label="Haptic Feedback"
            description="Vibrate on button presses and actions"
            value={hapticFeedback}
            onToggle={(v: boolean) => handleToggle(setHapticFeedback, v)}
            isLast
          />
        </View>

        <AppText style={[styles.footerNote, { color: textSecondaryContrastColor }]}>
          These accessibility changes apply instantly across the entire app!
        </AppText>
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
  heroSub: { fontSize: 14, textAlign: 'center', lineHeight: 21 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', letterSpacing: 1.1,
    marginBottom: 10, marginTop: 8, marginLeft: 4,
  },
  card: {
    borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 8,
    shadowColor: '#004e92', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  fontRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, gap: 16,
  },
  fontLabel: { fontWeight: '600' },
  fontPreview: { marginTop: 2 },
  radioOuter: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, gap: 14,
  },
  iconBox: {
    width: 42, height: 42, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowDesc: { fontSize: 12, marginTop: 2 },
  footerNote: {
    fontSize: 13, paddingHorizontal: 4,
    marginTop: 16, lineHeight: 18, textAlign: 'center',
  },
});
