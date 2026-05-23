import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../utils/ThemeContext';
import { useAlert } from '../../context/AlertContext';
import AppText from '../../components/AppText';

const LANGUAGES = [
  { id: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { id: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { id: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { id: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
];

export default function AppLanguage() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const [selectedLang, setSelectedLang] = useState('en');

  useEffect(() => {
    AsyncStorage.getItem('app_language').then(lang => {
      if (lang) setSelectedLang(lang);
    });
  }, []);

  const handleSelect = async (id: string) => {
    setSelectedLang(id);
    await AsyncStorage.setItem('app_language', id);
    showAlert('Language Updated', `The app language has been set to ${LANGUAGES.find(l => l.id === id)?.name}. Some translations will apply upon restart.`, [], 'success');
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
          <AppText style={styles.headerTitle}>App Language</AppText>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.heroIconWrap, { backgroundColor: isDark ? '#0F172A' : '#EFF6FF' }]}>
            <LinearGradient colors={['#004e92', '#000428']} style={styles.heroIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <MaterialCommunityIcons name="translate" size={32} color="#fff" />
            </LinearGradient>
          </View>
          <AppText style={[styles.heroTitle, { color: colors.text }]}>Choose Language</AppText>
          <AppText style={[styles.heroSub, { color: colors.textSecondary }]}>
            Select your preferred language for the application interface.
          </AppText>
        </View>

        {/* Language List */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {LANGUAGES.map((lang, index) => {
            const isSelected = selectedLang === lang.id;
            return (
              <TouchableOpacity
                key={lang.id}
                style={[
                  styles.langRow,
                  index !== LANGUAGES.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  isSelected && { backgroundColor: isDark ? 'rgba(96,165,250,0.06)' : 'rgba(0,78,146,0.04)' },
                ]}
                onPress={() => handleSelect(lang.id)}
                activeOpacity={0.6}
              >
                <AppText style={styles.flag}>{lang.flag}</AppText>
                <View style={{ flex: 1 }}>
                  <AppText style={[styles.langName, { color: colors.text }]}>{lang.name}</AppText>
                  <AppText style={[styles.langNative, { color: colors.textSecondary }]}>{lang.nativeName}</AppText>
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

        {/* Info Note */}
        <View style={[styles.noteCard, {
          backgroundColor: isDark ? '#0c2d48' : '#EFF6FF',
          borderColor: isDark ? '#1e3a5f' : '#BFDBFE',
        }]}>
          <MaterialCommunityIcons name="information-outline" size={18} color={isDark ? '#93C5FD' : '#3B82F6'} />
          <AppText style={[styles.noteText, { color: isDark ? '#93C5FD' : '#1D4ED8' }]}>
            Language changes will take full effect after restarting the application.
          </AppText>
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
  heroSub: { fontSize: 14, textAlign: 'center', lineHeight: 21 },
  card: {
    borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 20,
    shadowColor: '#004e92', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  langRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  flag: { fontSize: 28 },
  langName: { fontSize: 16, fontWeight: '600' },
  langNative: { fontSize: 13, marginTop: 2 },
  radioOuter: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  noteCard: {
    borderRadius: 16, borderWidth: 1, padding: 14,
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
  },
  noteText: { fontSize: 13, lineHeight: 19, flex: 1 },
});
