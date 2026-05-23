import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../context/AlertContext';
import { useRefresh } from '../hooks/useRefresh';
import { useUser } from '../utils/authUtils';
import { fetchUserData } from '../utils/nameUtils';
import { useTheme } from '../utils/ThemeContext';
import AppText from '../components/AppText';

export default function NewComplaintPage() {
  const router = useRouter();
  const user = useUser();
  const { colors, isDark } = useTheme();
  const { showAlert } = useAlert();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'emergency'>('low');
  const [loading, setLoading] = useState(false);

  const { refreshing, onRefresh } = useRefresh(async () => {
    // No data to fetch for new complaint form specifically, maybe refresh user data if it was displayed?
    // User data is fetched on submit, so we just simulate a quick checks or meaningful delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }, () => {
    // Reset Inputs
    setTitle('');
    setDescription('');
    setPriority('low');
  });

  const handleSubmit = async () => {
    if (!title || !description) {
      showAlert('Error', 'Please fill in all required fields', [], 'error');
      return;
    }

    setLoading(true);
    try {
      const { default: api } = await import('../utils/api');

      const user = await fetchUserData();
      if (!user || !user.email) {
        showAlert('Error', 'User data not found', [], 'error');
        setLoading(false);
        return;
      }

      await api.post('/services/complaints', {
        title,
        description,
        category: priority, // Using 'category' field in DB for priority/category, or map it. DB schema has 'category'
        // priority: priority // If DB has priority column, use it. Schema checked earlier had: title, description, category, status, student_id
      });

      showAlert('Success', 'Complaint submitted successfully', [], 'success');
      router.back();
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Failed to submit complaint', [], 'error');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (priorityLevel: string): any => {
    const icons: Record<string, string> = {
      low: 'check-circle-outline',
      medium: 'alert-circle-outline',
      high: 'alert',
      emergency: 'alert-decagram'
    };
    return icons[priorityLevel] || icons.low;
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <LinearGradient
        colors={['#000428', '#004e92']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={['top', 'left', 'right']}>
          <View style={styles.headerContent}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </Pressable>
            <View>
              <AppText style={styles.headerTitle}>New Complaint</AppText>
              <AppText style={styles.headerSubtitle}>Raise an Issue</AppText>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 80 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#fff" : colors.primary} colors={[colors.primary]} />}
        >
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Title Input */}
            <View style={styles.inputGroup}>
              <AppText style={[styles.label, { color: colors.textSecondary }]}>Title</AppText>
              <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <MaterialIcons name="edit" size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Briefly summarize the issue"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            {/* Priority Selector */}
            <View style={styles.inputGroup}>
              <AppText style={[styles.label, { color: colors.textSecondary }]}>Priority Level</AppText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.priorityContainer}
              >
                {(['low', 'medium', 'high', 'emergency'] as const).map((level) => (
                  <Pressable
                    key={level}
                    style={[
                      styles.priorityButton,
                      { backgroundColor: colors.background, borderColor: colors.border },
                      priority === level && styles.prioritySelected,
                      priority === level && (styles as any)[`bg${capitalize(level)}`],
                    ]}
                    onPress={() => setPriority(level)}
                  >
                    <MaterialCommunityIcons
                      name={getPriorityIcon(level)}
                      size={18}
                      color={priority === level ? '#fff' : colors.textSecondary}
                    />
                    <AppText style={[
                      styles.priorityText,
                      {
                        color: priority === level
                          ? '#fff'
                          : (isDark ? '#E2E8F0' : '#64748B')
                      }
                    ]}>
                      {capitalize(level)}
                    </AppText>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Description Input */}
            <View style={styles.inputGroup}>
              <AppText style={[styles.label, { color: colors.textSecondary }]}>Description</AppText>
              <View style={[styles.inputWrapper, styles.textAreaWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, styles.textArea, { color: colors.text }]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Provide details about the problem..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Submit Button */}
            <Pressable
              style={[styles.submitContainer, (!title || !description) && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={!title || !description || loading}
            >
              <LinearGradient
                colors={['#000428', '#004e92']}
                style={styles.submitButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <View style={styles.btnContent}>
                    <AppText style={styles.submitButtonText}>Submit Complaint</AppText>
                    <MaterialIcons name="send" size={18} color="white" />
                  </View>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#004e92",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  headerContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  content: {
    padding: 24,
  },
  formCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginLeft: 4,
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '500',
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
    paddingVertical: 0,
  },
  textArea: {
    height: 100,
    marginTop: 12,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  prioritySelected: {
    borderWidth: 0,
  },
  bgLow: { backgroundColor: '#10B981' }, // Green
  bgMedium: { backgroundColor: '#F59E0B' }, // Amber
  bgHigh: { backgroundColor: '#F97316' }, // Orange
  bgEmergency: { backgroundColor: '#EF4444' }, // Red

  priorityText: {
    fontSize: 13,
    fontWeight: '600',
  },
  priorityTextSelected: {
    color: '#fff',
  },
  submitContainer: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#004e92',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});