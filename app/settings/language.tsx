import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../../context/AlertContext';
import { useTheme } from '../../utils/ThemeContext';
import AppText from '../../components/AppText';

const LANGUAGES = [
  { id: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { id: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
];

export default function AppLanguage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { isDark } = useTheme();
  const [selectedLang, setSelectedLang] = useState('en');

  // Dynamic Theme Map
  const themeBg = isDark ? '#000000' : '#F8FAFC';
  const textMain = isDark ? '#FFFFFF' : '#111111';
  const textMuted = isDark ? '#888888' : '#64748B';
  const borderSubtle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const pressedBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
  const radioSelectedIcon = isDark ? '#000000' : '#FFFFFF';

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
    <View style={[styles.container, { backgroundColor: themeBg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={textMain} />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <AppText style={[styles.heroTitle, { color: textMain }]}>App{"\n"}Language</AppText>
          <AppText style={[styles.heroSub, { color: textMuted }]}>Select your preferred language for the application interface.</AppText>
        </View>

        <View style={styles.section}>
          <AppText style={styles.secTitle}>AVAILABLE LANGUAGES</AppText>
          {LANGUAGES.map((lang) => {
            const isSelected = selectedLang === lang.id;
            return (
              <Pressable
                key={lang.id}
                style={({ pressed }) => [styles.langRow, { borderColor: borderSubtle }, pressed && { backgroundColor: pressedBg }]}
                onPress={() => handleSelect(lang.id)}
              >
                <AppText style={styles.flag}>{lang.flag}</AppText>
                <View style={styles.langInfo}>
                  <AppText style={[styles.langName, { color: textMain }, isSelected && { color: '#10B981' }]}>{lang.name}</AppText>
                  <AppText style={[styles.langNative, { color: textMuted }]}>{lang.nativeName}</AppText>
                </View>
                <View style={[styles.radioOuter, isSelected ? styles.radioSelected : styles.radioUnselected]}>
                  {isSelected && <MaterialCommunityIcons name="check" size={14} color={radioSelectedIcon} />}
                </View>
              </Pressable>
            );
          })}
        </View>
        <AppText style={[styles.infoFooter, { color: textMuted }]}>Language changes will take full effect after restarting the application.</AppText>
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
  section: { marginBottom: 40 },
  secTitle: { fontSize: 11, fontWeight: '700', color: '#888888', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 },
  langRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1 },
  flag: { fontSize: 28, marginRight: 16 },
  langInfo: { flex: 1 },
  langName: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  langNative: { fontSize: 14 },
  radioOuter: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  radioSelected: { borderColor: '#10B981', backgroundColor: '#10B981' },
  radioUnselected: { borderColor: 'rgba(128,128,128,0.3)', backgroundColor: 'transparent' },
  infoFooter: { fontSize: 13, lineHeight: 20, marginTop: 16 },
});
