import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Pressable, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence, runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../../context/AlertContext';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from '../../utils/ThemeContext';
import AppText from '../../components/AppText';

interface StorageBreakdown { label: string; icon: any; size: string; bytes: number; color: string; }

export default function DataStorage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [totalCacheSize, setTotalCacheSize] = useState('0 KB');
  const [breakdown, setBreakdown] = useState<StorageBreakdown[]>([]);

  // Dynamic Theme Map
  const themeBg = isDark ? '#000000' : '#F8FAFC';
  const textMain = isDark ? '#FFFFFF' : '#111111';
  const textMuted = isDark ? '#888888' : '#64748B';
  const borderSubtle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const pressedBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
  const otherIconColor = isDark ? '#FFFFFF' : '#111111';

  useEffect(() => { calculateStorage(); }, []);

  const getDirSize = async (dirUri: string | null): Promise<number> => {
    if (!dirUri) return 0;
    try {
      const info = await FileSystem.getInfoAsync(dirUri);
      if (!info.exists) return 0;
      if (!info.isDirectory) return info.size || 0;
      let totalSize = 0;
      const files = await FileSystem.readDirectoryAsync(dirUri);
      for (const file of files) {
        const fileUri = dirUri.endsWith('/') ? `${dirUri}${file}` : `${dirUri}/${file}`;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (fileInfo.exists) {
            if (fileInfo.isDirectory) totalSize += await getDirSize(fileUri);
            else totalSize += fileInfo.size || 0;
        }
      }
      return totalSize;
    } catch (e) { return 0; }
  };

  const calculateStorage = async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      let chatBytes = 0, mediaBytes = 0, cacheBytes = 0, otherBytes = 0;
      for (const key of allKeys) {
        const value = await AsyncStorage.getItem(key);
        const size = value ? new Blob([value]).size : 0;
        if (key.includes('chat') || key.includes('message')) chatBytes += size;
        else otherBytes += size;
      }
      const fsCacheSize = await getDirSize(FileSystem.cacheDirectory);
      const fsDocSize = await getDirSize(FileSystem.documentDirectory);
      cacheBytes += fsCacheSize;
      mediaBytes += fsDocSize;
      const totalBytes = chatBytes + mediaBytes + cacheBytes + otherBytes;
      setTotalCacheSize(formatBytes(totalBytes));
      setBreakdown([
        { label: 'Chat Data', icon: 'chat-outline', size: formatBytes(chatBytes), bytes: chatBytes, color: '#3B82F6' },
        { label: 'Media & Docs', icon: 'image-outline', size: formatBytes(mediaBytes), bytes: mediaBytes, color: '#8B5CF6' },
        { label: 'Cached Data', icon: 'database-outline', size: formatBytes(cacheBytes), bytes: cacheBytes, color: '#10B981' },
        { label: 'App Prefs', icon: 'tune-vertical', size: formatBytes(otherBytes), bytes: otherBytes, color: otherIconColor },
      ]);
    } catch (e) {} finally { setLoading(false); }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const vacuumX = useSharedValue(0);
  const handleClearCache = () => {
    showAlert('Clear Cache', 'This will remove all cached data. Your account data will be preserved.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => {
        setClearing(true);
        vacuumX.value = withSequence(
            withTiming(20, { duration: 200, easing: Easing.inOut(Easing.ease) }),
            withTiming(-20, { duration: 200, easing: Easing.inOut(Easing.ease) }),
            withTiming(20, { duration: 200, easing: Easing.inOut(Easing.ease) }),
            withTiming(0, { duration: 200, easing: Easing.inOut(Easing.ease) })
        );
        try {
          const keysToKeep = ['userToken', 'user', 'app_theme', 'app_language', 'app_country', 'auto_download_wifi', 'auto_download_mobile', 'data_saver'];
          const allKeys = await AsyncStorage.getAllKeys();
          const keysToClear = allKeys.filter(key => !keysToKeep.includes(key) && !key.startsWith('onboarding_completed'));
          if (keysToClear.length > 0) await AsyncStorage.multiRemove(keysToClear);
          if (FileSystem.cacheDirectory) {
            const files = await FileSystem.readDirectoryAsync(FileSystem.cacheDirectory);
            for (const file of files) {
              const fileUri = FileSystem.cacheDirectory.endsWith('/') ? `${FileSystem.cacheDirectory}${file}` : `${FileSystem.cacheDirectory}/${file}`;
              await FileSystem.deleteAsync(fileUri, { idempotent: true });
            }
          }
          await calculateStorage();
          showAlert('Done', 'Cache cleared successfully!', [], 'success');
        } catch (e) { showAlert('Error', 'Failed to clear cache.'); } finally { setClearing(false); }
      }}
    ]);
  };

  const handleClearChatData = () => {
    showAlert('Clear Chat Data', 'This will clear all locally stored chat messages.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear Chats', style: 'destructive', onPress: async () => {
        try {
          const allKeys = await AsyncStorage.getAllKeys();
          const chatKeys = allKeys.filter(k => k.includes('chat') || k.includes('message'));
          if (chatKeys.length > 0) await AsyncStorage.multiRemove(chatKeys);
          await calculateStorage();
          showAlert('Done', 'Chat data cleared.', [], 'success');
        } catch (e) { showAlert('Error', 'Failed to clear chat data.'); }
      }}
    ]);
  };

  const vacuumStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: vacuumX.value }]
  }));

  if (loading) return <View style={[styles.loadingContainer, { backgroundColor: themeBg }]}><ActivityIndicator size="large" color={textMain} /></View>;

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
          <AppText style={[styles.heroTitle, { color: textMain }]}>Data &{"\n"}Storage</AppText>
          <AppText style={[styles.heroSub, { color: textMuted }]}>Manage local data and free up space on your device.</AppText>
        </View>

        <View style={styles.section}>
          <AppText style={styles.secTitle}>STORAGE USAGE</AppText>
          <View style={styles.usageRow}>
            <MaterialCommunityIcons name="harddisk" size={48} color={textMain} />
            <View style={styles.usageInfo}>
              <AppText style={styles.usageLabel}>TOTAL APP SIZE</AppText>
              <AppText style={[styles.usageValue, { color: textMain }]}>{totalCacheSize}</AppText>
            </View>
          </View>
          <View style={styles.barContainer}>
            {breakdown.map((item, i) => {
              const totalBytes = breakdown.reduce((sum, b) => sum + b.bytes, 0);
              const percent = totalBytes > 0 ? Math.max((item.bytes / totalBytes) * 100, 2) : 25;
              return (
                <View key={i} style={[styles.barSegment, { width: `${percent}%` as any, backgroundColor: item.color, borderTopLeftRadius: i === 0 ? 8 : 0, borderBottomLeftRadius: i === 0 ? 8 : 0, borderTopRightRadius: i === breakdown.length - 1 ? 8 : 0, borderBottomRightRadius: i === breakdown.length - 1 ? 8 : 0 }]} />
              );
            })}
          </View>
          <View style={styles.legendGrid}>
            {breakdown.map((item, i) => (
              <View key={i} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <View style={styles.legendTextWrap}>
                  <AppText style={[styles.legendText, { color: textMain }]}>{item.label}</AppText>
                  <AppText style={styles.legendSize}>{item.size}</AppText>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <AppText style={styles.secTitle}>MANAGE STORAGE</AppText>
          <Pressable style={({ pressed }) => [styles.actionRow, { borderColor: borderSubtle }, pressed && { backgroundColor: pressedBg }]} onPress={handleClearCache}>
            <Animated.View style={[styles.actionIcon, { backgroundColor: 'rgba(16,185,129,0.1)' }, vacuumStyle]}>
              <MaterialCommunityIcons name="broom" size={24} color="#10B981" />
            </Animated.View>
            <View style={styles.actionInfo}>
              <AppText style={[styles.actionLabel, { color: textMain }]}>Clear App Cache</AppText>
              <AppText style={[styles.actionDesc, { color: textMuted }]}>Free up space by removing temporary files</AppText>
            </View>
            {clearing ? <ActivityIndicator size="small" color="#10B981" /> : <MaterialCommunityIcons name="chevron-right" size={24} color={textMuted} />}
          </Pressable>
          <Pressable style={({ pressed }) => [styles.actionRow, { borderBottomWidth: 0 }, pressed && { backgroundColor: pressedBg }]} onPress={handleClearChatData}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
              <MaterialCommunityIcons name="chat-remove-outline" size={24} color="#EF4444" />
            </View>
            <View style={styles.actionInfo}>
              <AppText style={[styles.actionLabel, { color: textMain }]}>Clear Chat Data</AppText>
              <AppText style={[styles.actionDesc, { color: textMuted }]}>Remove locally stored messages</AppText>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={textMuted} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 24, paddingBottom: 24 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  hero: { marginBottom: 48 },
  heroTitle: { fontSize: 40, fontWeight: '800', letterSpacing: -1.5, lineHeight: 44, marginBottom: 12 },
  heroSub: { fontSize: 15, lineHeight: 22 },
  section: { marginBottom: 48 },
  secTitle: { fontSize: 11, fontWeight: '700', color: '#888888', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 24 },
  usageRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 32 },
  usageInfo: { flex: 1 },
  usageLabel: { fontSize: 12, fontWeight: '700', color: '#888888', letterSpacing: 1, marginBottom: 4 },
  usageValue: { fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  barContainer: { flexDirection: 'row', height: 12, borderRadius: 8, overflow: 'hidden', marginBottom: 24, gap: 2 },
  barSegment: { height: '100%' },
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'flex-start', width: '45%', gap: 10 },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  legendTextWrap: { flex: 1 },
  legendText: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  legendSize: { fontSize: 13, color: '#888888' },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1 },
  actionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  actionInfo: { flex: 1, paddingRight: 12 },
  actionLabel: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  actionDesc: { fontSize: 14 },
});
