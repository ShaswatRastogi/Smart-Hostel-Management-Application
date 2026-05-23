import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../../context/AlertContext';
import { useTheme } from '../../utils/ThemeContext';
import AppText from '../../components/AppText';

export default function ChangePassword() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showAlert('Error', 'Please fill in all fields', [], 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert('Error', 'New passwords do not match', [], 'error');
      return;
    }

    if (newPassword.length < 6) {
      showAlert('Error', 'Password must be at least 6 characters long', [], 'error');
      return;
    }

    setIsLoading(true);

    try {
      const { default: api } = await import('../../utils/api');
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });

      showAlert('Success', 'Password updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ], 'success');
    } catch (error: any) {
      console.error(error);
      let msg = 'Failed to update password.';
      if (error.response?.data?.error) {
        msg = error.response.data.error;
      }
      showAlert('Error', msg, [], 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    setValue: (val: string) => void,
    placeholder: string,
    showPassword: boolean,
    setShowPassword: (val: boolean) => void,
    icon: any
  ) => (
    <View style={styles.inputGroup}>
      <AppText style={[styles.inputLabel, { color: colors.textSecondary }]}>{label}</AppText>
      <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: colors.border }]}>
        <MaterialCommunityIcons name={icon} size={20} color={isDark ? '#60A5FA' : '#004e92'} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={value}
          onChangeText={setValue}
          secureTextEntry={!showPassword}
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
          <MaterialCommunityIcons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
          <AppText style={styles.headerTitle}>Change Password</AppText>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={[styles.heroIconWrap, { backgroundColor: isDark ? '#0F172A' : '#EFF6FF' }]}>
            <LinearGradient colors={['#004e92', '#000428']} style={styles.heroIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <MaterialCommunityIcons name="lock-reset" size={32} color="#fff" />
            </LinearGradient>
          </View>
          <AppText style={[styles.heroTitle, { color: colors.text }]}>Update Security</AppText>
          <AppText style={[styles.heroSub, { color: colors.textSecondary }]}>
            Ensure your account is protected by using a strong, unique password.
          </AppText>
        </View>

        {/* Input Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {renderInput(
            "Current Password",
            currentPassword,
            setCurrentPassword,
            "Enter current password",
            showCurrent,
            setShowCurrent,
            "lock-outline"
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {renderInput(
            "New Password",
            newPassword,
            setNewPassword,
            "Enter new password",
            showNew,
            setShowNew,
            "shield-lock-outline"
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {renderInput(
            "Confirm New Password",
            confirmPassword,
            setConfirmPassword,
            "Confirm new password",
            showConfirm,
            setShowConfirm,
            "check-decagram-outline"
          )}
        </View>

        {/* Info Note */}
        <View style={[styles.noteCard, {
          backgroundColor: isDark ? '#0c2d48' : '#EFF6FF',
          borderColor: isDark ? '#1e3a5f' : '#BFDBFE',
          marginTop: 20
        }]}>
          <MaterialCommunityIcons name="information-outline" size={18} color={isDark ? '#93C5FD' : '#3B82F6'} />
          <AppText style={[styles.noteText, { color: isDark ? '#93C5FD' : '#1D4ED8' }]}>
            Password must be at least 6 characters long and include a mix of letters and numbers.
          </AppText>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.saveBtn, isLoading && { opacity: 0.7 }]}
          onPress={handleChangePassword}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="shield-check-outline" size={22} color="#fff" />
              <AppText style={styles.saveBtnText}>Update Password</AppText>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  heroSub: { fontSize: 14, textAlign: 'center', lineHeight: 21, paddingHorizontal: 10 },
  card: {
    borderRadius: 24, borderWidth: 1, padding: 20,
    shadowColor: '#004e92', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
  },
  inputGroup: { gap: 8, marginVertical: 8 },
  inputLabel: { fontSize: 13, fontWeight: '700', marginLeft: 4, letterSpacing: 0.5, textTransform: 'uppercase' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, height: 54,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: '600' },
  eyeBtn: { padding: 4 },
  divider: { height: 1, marginVertical: 12, opacity: 0.5 },
  saveBtn: {
    backgroundColor: '#004e92', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', padding: 18, borderRadius: 20, gap: 10,
    marginTop: 32, shadowColor: '#004e92', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },
  noteCard: {
    borderRadius: 16, borderWidth: 1, padding: 14,
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
  },
  noteText: { fontSize: 13, lineHeight: 19, flex: 1 },
});
