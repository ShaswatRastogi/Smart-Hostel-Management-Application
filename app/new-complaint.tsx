import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, withSequence, runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../context/AlertContext';
import { useRefresh } from '../hooks/useRefresh';
import { useUser } from '../utils/authUtils';
import { fetchUserData } from '../utils/nameUtils';
import { useTheme } from '../utils/ThemeContext';
import AppText from '../components/AppText';

export default function NewComplaintPage() {
  const router = useRouter();
  const user = useUser();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { isDark } = useTheme();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'emergency'>('low');
  const [loading, setLoading] = useState(false);

  // Dynamic Theme Map
  const themeBg = isDark ? '#000000' : '#F8FAFC';
  const textMain = isDark ? '#FFFFFF' : '#111111';
  const textMuted = isDark ? '#888888' : '#64748B';
  const borderSubtle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF';
  const inputBorder = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
  const primaryBtnBg = isDark ? '#FFFFFF' : '#111111';
  const primaryBtnText = isDark ? '#000000' : '#FFFFFF';
  const chipBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const chipSelectedBg = isDark ? '#FFFFFF' : '#111111';
  const chipSelectedText = isDark ? '#000000' : '#FFFFFF';

  const { refreshing, onRefresh } = useRefresh(async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
  }, () => { setTitle(''); setDescription(''); setPriority('low'); });

  const planeX = useSharedValue(0);
  const planeY = useSharedValue(0);
  const planeScale = useSharedValue(1);

  const handleSubmit = async () => {
    if (!title || !description) return showAlert('Error', 'Please fill in all required fields', [], 'error');
    
    // Fly animation
    planeScale.value = withSequence(withTiming(0.8, { duration: 100 }), withTiming(1, { duration: 100 }));
    planeX.value = withTiming(200, { duration: 600, easing: Easing.in(Easing.ease) });
    planeY.value = withTiming(-100, { duration: 600, easing: Easing.in(Easing.ease) }, () => {
        runOnJS(executeSubmit)();
    });
  };

  const executeSubmit = async () => {
    setLoading(true);
    try {
      const { default: api } = await import('../utils/api');
      const userData = await fetchUserData();
      if (!userData || !userData.email) { showAlert('Error', 'User data not found', [], 'error'); setLoading(false); return; }
      await api.post('/services/complaints', { title, description, category: priority });
      showAlert('Success', 'Complaint submitted successfully', [], 'success');
      router.back();
    } catch (error) { 
        showAlert('Error', 'Failed to submit complaint', [], 'error');
        planeX.value = 0;
        planeY.value = 0;
    } finally { setLoading(false); }
  };

  const planeStyle = useAnimatedStyle(() => ({
      transform: [
          { translateX: planeX.value },
          { translateY: planeY.value },
          { scale: planeScale.value }
      ]
  }));

  const PriorityChip = ({ level }: { level: 'low' | 'medium' | 'high' | 'emergency' }) => {
      const scale = useSharedValue(1);
      
      const handlePress = () => {
          scale.value = withSequence(withTiming(0.9, { duration: 100 }), withTiming(1, { duration: 150, easing: Easing.bounce }));
          setPriority(level);
      };

      const rStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

      return (
          <Pressable onPress={handlePress}>
              <Animated.View style={[styles.priorityButton, { backgroundColor: chipBg, borderColor: inputBorder }, priority === level && [styles.prioritySelected, { backgroundColor: chipSelectedBg, borderColor: chipSelectedBg }], rStyle]}>
                  <AppText style={[styles.priorityText, { color: textMuted }, priority === level && [styles.priorityTextSelected, { color: chipSelectedText }]]}>{capitalize(level)}</AppText>
              </Animated.View>
          </Pressable>
      );
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <View style={[styles.container, { backgroundColor: themeBg }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.headerActions, { paddingTop: insets.top + 16 }]}>
        <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={textMain} />
        </Pressable>
      </View>

      <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 80 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={textMain} />}>
          <View style={styles.hero}>
            <AppText style={[styles.heroTitle, { color: textMain }]}>New Issue</AppText>
            <AppText style={[styles.heroSubtitle, { color: textMuted }]}>Report a problem</AppText>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <AppText style={styles.label}>TITLE</AppText>
              <TextInput style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textMain }]} value={title} onChangeText={setTitle} placeholder="Briefly summarize the issue" placeholderTextColor={textMuted} />
            </View>

            <View style={styles.inputGroup}>
              <AppText style={styles.label}>PRIORITY LEVEL</AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.priorityContainer}>
                {(['low', 'medium', 'high', 'emergency'] as const).map((level) => (
                  <PriorityChip key={level} level={level} />
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <AppText style={styles.label}>DESCRIPTION</AppText>
              <TextInput style={[styles.input, styles.textArea, { backgroundColor: inputBg, borderColor: inputBorder, color: textMain }]} value={description} onChangeText={setDescription} placeholder="Provide details about the problem..." placeholderTextColor={textMuted} multiline numberOfLines={4} textAlignVertical="top" />
            </View>

            <Pressable onPress={handleSubmit} style={({ pressed }) => [styles.submitButton, { backgroundColor: primaryBtnBg, flexDirection: 'row', justifyContent: 'center', gap: 10, overflow: 'hidden' }, (!title || !description || loading) && { opacity: 0.5 }, pressed && { opacity: 0.8 }]} disabled={!title || !description || loading}>
                {loading ? <ActivityIndicator color={primaryBtnText} /> : (
                    <>
                        <AppText style={[styles.buttonText, { color: primaryBtnText }]}>SUBMIT COMPLAINT</AppText>
                        <Animated.View style={planeStyle}>
                            <MaterialCommunityIcons name="paperplane" size={20} color={primaryBtnText} />
                        </Animated.View>
                    </>
                )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerActions: { paddingHorizontal: 24, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  content: { paddingHorizontal: 24 },
  hero: { marginBottom: 48 },
  heroTitle: { fontSize: 40, fontWeight: '800', letterSpacing: -1.5, lineHeight: 44, marginBottom: 8 },
  heroSubtitle: { fontSize: 16, fontWeight: '600' },
  formContainer: {},
  inputGroup: { marginBottom: 32 },
  label: { fontSize: 11, fontWeight: '700', color: '#666666', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 12, padding: 16, fontSize: 16 },
  textArea: { height: 120 },
  priorityContainer: { flexDirection: 'row', gap: 12 },
  priorityButton: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 100, borderWidth: 1 },
  prioritySelected: {},
  priorityText: { fontSize: 14, fontWeight: '600' },
  priorityTextSelected: { fontWeight: '800' },
  submitButton: { paddingVertical: 18, borderRadius: 100, alignItems: 'center', marginTop: 16 },
  buttonText: { fontSize: 16, fontWeight: '800', letterSpacing: 1 },
});