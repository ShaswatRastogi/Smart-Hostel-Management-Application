import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../../context/AlertContext';
import { useTheme } from '../../utils/ThemeContext';
import * as FileSystem from 'expo-file-system/legacy';
import AppText from '../../components/AppText';

interface StorageBreakdown { label: string; icon: any; size: string; bytes: number; color: string; }

export default function DataStorage() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [totalCacheSize, setTotalCacheSize] = useState('0 KB');
  const [breakdown, setBreakdown] = useState<StorageBreakdown[]>([]);

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
            if (fileInfo.isDirectory) {
               totalSize += await getDirSize(fileUri);
            } else {
               totalSize += fileInfo.size || 0;
            }
        }
      }
      return totalSize;
    } catch (e) {
      return 0;
    }
  };

  const calculateStorage = async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      let chatBytes = 0, mediaBytes = 0, cacheBytes = 0, otherBytes = 0;
      
      // 1. Calculate AsyncStorage Size
      for (const key of allKeys) {
        const value = await AsyncStorage.getItem(key);
        const size = value ? new Blob([value]).size : 0;
        if (key.includes('chat') || key.includes('message')) chatBytes += size;
        else otherBytes += size;
      }

      // 2. Calculate File System Size
      const fsCacheSize = await getDirSize(FileSystem.cacheDirectory);
      const fsDocSize = await getDirSize(FileSystem.documentDirectory);
      
      cacheBytes += fsCacheSize;
      mediaBytes += fsDocSize;

      const totalBytes = chatBytes + mediaBytes + cacheBytes + otherBytes;

      setTotalCacheSize(formatBytes(totalBytes));
      setBreakdown([
        { label: 'Chat Data', icon: 'chat-outline', size: formatBytes(chatBytes), bytes: chatBytes, color: '#3B82F6' },
        { label: 'Media & Documents', icon: 'image-outline', size: formatBytes(mediaBytes), bytes: mediaBytes, color: '#8B5CF6' },
        { label: 'Cached Data', icon: 'database-outline', size: formatBytes(cacheBytes), bytes: cacheBytes, color: '#F59E0B' },
        { label: 'App Preferences', icon: 'tune-vertical', size: formatBytes(otherBytes), bytes: otherBytes, color: '#10B981' },
      ]);
    } catch (e) { console.error('Failed to calculate storage:', e); } finally { setLoading(false); }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleClearCache = () => {
    showAlert('Clear Cache', 'This will remove all cached data. Your account data will be preserved.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => {
        setClearing(true);
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#000428', '#004e92']} style={[styles.header, { paddingTop: insets.top + 10 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><MaterialCommunityIcons name="arrow-left" size={22} color="#fff" /></TouchableOpacity>
          <AppText style={styles.headerTitle}>Data & Storage</AppText>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {loading ? <View style={styles.center}><ActivityIndicator size="large" color="#004e92" /></View> : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Storage Overview */}
          <View style={[styles.overviewCard, { backgroundColor: isDark ? '#1e293b' : '#f0f4ff', borderColor: isDark ? '#334155' : '#dbeafe' }]}>
            <View style={styles.overviewRow}>
              <View style={[styles.storageIcon, { backgroundColor: isDark ? '#0F172A' : '#fff' }]}><MaterialCommunityIcons name="harddisk" size={32} color="#004e92" /></View>
              <View style={{ flex: 1 }}><AppText style={[styles.overviewLabel, { color: colors.textSecondary }]}>TOTAL APP STORAGE</AppText><AppText style={[styles.overviewValue, { color: colors.text }]}>{totalCacheSize}</AppText></View>
            </View>
            <View style={styles.barContainer}>
              {breakdown.map((item, i) => {
                const totalBytes = breakdown.reduce((sum, b) => sum + b.bytes, 0);
                const percent = totalBytes > 0 ? Math.max((item.bytes / totalBytes) * 100, 2) : 25;
                return <View key={i} style={[styles.barSegment, { width: `${percent}%` as any, backgroundColor: item.color, borderTopLeftRadius: i === 0 ? 8 : 0, borderBottomLeftRadius: i === 0 ? 8 : 0, borderTopRightRadius: i === breakdown.length - 1 ? 8 : 0, borderBottomRightRadius: i === breakdown.length - 1 ? 8 : 0 }]} />;
              })}
            </View>
            <View style={styles.legendGrid}>
              {breakdown.map((item, i) => (
                <View key={i} style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: item.color }]} /><AppText style={[styles.legendText, { color: colors.textSecondary }]}>{item.label}</AppText><AppText style={[styles.legendSize, { color: colors.text }]}>{item.size}</AppText></View>
              ))}
            </View>
          </View>

          {/* Manage Storage */}
          <AppText style={[styles.secTitle, { color: colors.textSecondary }]}>MANAGE STORAGE</AppText>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity style={styles.actionRow} onPress={handleClearCache}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(245,158,11,0.1)' }]}><MaterialCommunityIcons name="broom" size={22} color="#F59E0B" /></View>
              <View style={{ flex: 1 }}><AppText style={[styles.actionLabel, { color: colors.text }]}>Clear App Cache</AppText><AppText style={[styles.actionDesc, { color: colors.textSecondary }]}>Free up space by removing temporary files</AppText></View>
              {clearing ? <ActivityIndicator size="small" color="#F59E0B" /> : <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />}
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.actionRow} onPress={handleClearChatData}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(59,130,246,0.1)' }]}><MaterialCommunityIcons name="chat-remove-outline" size={22} color="#3B82F6" /></View>
              <View style={{ flex: 1 }}><AppText style={[styles.actionLabel, { color: colors.text }]}>Clear Chat Data</AppText><AppText style={[styles.actionDesc, { color: colors.textSecondary }]}>Remove locally stored messages</AppText></View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overviewCard: { borderRadius: 24, padding: 20, borderWidth: 1, marginBottom: 8 },
  overviewRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  storageIcon: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', shadowColor: '#004e92', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  overviewLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  overviewValue: { fontSize: 28, fontWeight: '800', letterSpacing: 0.5 },
  barContainer: { flexDirection: 'row', height: 10, borderRadius: 8, overflow: 'hidden', marginBottom: 16, gap: 2 },
  barSegment: { height: '100%' },
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '45%' },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, fontWeight: '500', flex: 1 },
  legendSize: { fontSize: 12, fontWeight: '700' },
  secTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 1.1, marginBottom: 10, marginTop: 16, marginLeft: 4 },
  card: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 4, shadowColor: '#004e92', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  actionRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  actionIcon: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: 15, fontWeight: '600' },
  actionDesc: { fontSize: 12, marginTop: 2 },
  divider: { height: 1, marginLeft: 72 },
});
