import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../../context/AlertContext';
import { useTheme } from '../../utils/ThemeContext';
import AppText from '../../components/AppText';

export default function ChangePassword() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Dynamic Theme Map
  const themeBg = isDark ? '#000000' : '#F8FAFC';
  const textMain = isDark ? '#FFFFFF' : '#111111';
  const textMuted = isDark ? '#888888' : '#64748B';
  const borderSubtle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)';
  const saveBtnBg = isDark ? '#FFFFFF' : '#111111';
  const saveBtnText = isDark ? '#000000' : '#FFFFFF';

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) return showAlert('Error', 'Please fill in all fields', [], 'error');
    if (newPassword !== confirmPassword) return showAlert('Error', 'New passwords do not match', [], 'error');
    if (newPassword.length < 6) return showAlert('Error', 'Password must be at least 6 characters long', [], 'error');
    
    setIsLoading(true);
    try {
      const { default: api } = await import('../../utils/api');
      await api.post('/auth/change-password', { currentPassword, newPassword });
      showAlert('Success', 'Password updated successfully!', [{ text: 'OK', onPress: () => router.back() }], 'success');
    } catch (error: any) {
      let msg = error.response?.data?.error || 'Failed to update password.';
      showAlert('Error', msg, [], 'error');
    } finally { setIsLoading(false); }
  };

  const renderInput = (label: string, value: string, setValue: (val: string) => void, placeholder: string, showPassword: boolean, setShowPassword: (val: boolean) => void) => (
    <View style={styles.inputWrapper}>
      <AppText style={styles.inputLabel}>{label}</AppText>
      <View style={[styles.inputContainer, { borderColor: borderSubtle }]}>
        <TextInput
          style={[styles.input, { color: textMain }]}
          value={value}
          onChangeText={setValue}
          secureTextEntry={!showPassword}
          placeholder={placeholder}
          placeholderTextColor={textMuted}
          selectionColor={textMain}
        />
        <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
          <MaterialCommunityIcons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={textMuted} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: themeBg }]} behavior="padding">
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={textMain} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}>
        <View style={styles.hero}>
          <AppText style={[styles.heroTitle, { color: textMain }]}>New{"\n"}Password</AppText>
          <AppText style={[styles.heroSub, { color: textMuted }]}>Create a secure password with at least 6 characters.</AppText>
        </View>

        <View style={styles.form}>
          {renderInput("Current Password", currentPassword, setCurrentPassword, "Enter current", showCurrent, setShowCurrent)}
          {renderInput("New Password", newPassword, setNewPassword, "Enter new", showNew, setShowNew)}
          {renderInput("Confirm Password", confirmPassword, setConfirmPassword, "Confirm new", showConfirm, setShowConfirm)}
        </View>

        <Pressable style={({ pressed }) => [styles.saveBtn, { backgroundColor: saveBtnBg }, pressed && { transform: [{ scale: 0.98 }] }, isLoading && { opacity: 0.7 }]} onPress={handleChangePassword} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color={saveBtnText} /> : <AppText style={[styles.saveBtnTextLabel, { color: saveBtnText }]}>Update</AppText>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingBottom: 24 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  hero: { marginBottom: 48 },
  heroTitle: { fontSize: 40, fontWeight: '800', letterSpacing: -1.5, lineHeight: 44, marginBottom: 12 },
  heroSub: { fontSize: 15, lineHeight: 22 },
  form: { gap: 32, marginBottom: 48 },
  inputWrapper: { flexDirection: 'column' },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#888888', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingBottom: 12 },
  input: { flex: 1, fontSize: 20, fontWeight: '500', padding: 0 },
  eyeBtn: { padding: 4, marginLeft: 12 },
  saveBtn: { justifyContent: 'center', alignItems: 'center', paddingVertical: 18, borderRadius: 32 },
  saveBtnTextLabel: { fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
});
