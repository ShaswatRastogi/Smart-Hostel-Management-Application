import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Switch, Pressable, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence, interpolate, Extrapolation } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../../context/AlertContext';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { useTheme } from '../../utils/ThemeContext';
import AppText from '../../components/AppText';

const DATA_CATEGORIES = [
  { id: 'profile', icon: 'account-circle', label: 'Profile Information', desc: 'Name, email, phone, address', color: '#3B82F6' },
  { id: 'complaints', icon: 'clipboard-text', label: 'Complaints History', desc: 'All filed complaints and responses', color: '#8B5CF6' },
  { id: 'leaves', icon: 'calendar-check', label: 'Leave Records', desc: 'Leave applications and approvals', color: '#10B981' },
  { id: 'payments', icon: 'cash-multiple', label: 'Payment History', desc: 'Fee payments and transactions', color: '#F59E0B' },
  { id: 'visitors', icon: 'account-group', label: 'Visitor Logs', desc: 'All registered visitor entries', color: '#EC4899' },
  { id: 'services', icon: 'wrench', label: 'Service Requests', desc: 'Maintenance history', color: '#06B6D4' },
  { id: 'messages', icon: 'chat', label: 'Chat Messages', desc: 'Direct messages with admin', color: '#EF4444' },
];

export default function DownloadData() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Record<string, boolean>>(Object.fromEntries(DATA_CATEGORIES.map(c => [c.id, true])));

  // Dynamic Theme Map
  const themeBg = isDark ? '#000000' : '#F8FAFC';
  const textMain = isDark ? '#FFFFFF' : '#111111';
  const textMuted = isDark ? '#888888' : '#64748B';
  const borderSubtle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const pressedBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
  const btnBg = isDark ? '#FFFFFF' : '#111111';
  const btnText = isDark ? '#000000' : '#FFFFFF';

  const toggleCategory = (id: string) => setSelectedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  const selectedCount = Object.values(selectedCategories).filter(Boolean).length;

  const handleDownload = async () => {
    if (selectedCount === 0) return showAlert('Select Data', 'Please select at least one category.');
    setLoading(true);
    try {
      const api = (await import('../../utils/api')).default;
      const categories = Object.entries(selectedCategories).filter(([, v]) => v).map(([k]) => k);
      const response = await api.post('/students/export-data', { categories });
      if (response.data?.success && response.data?.data) {
        const exportData = response.data.data;
        const fileName = `SmartStay_Data_Export_${new Date().getTime()}.pdf`;
        let html = `<html><body style="font-family: Arial, sans-serif; padding: 20px;"><h1 style="color: #000000;">Smart Hostel Data Export</h1><p>Generated on: ${new Date().toLocaleString()}</p><hr/>`;
        for (const [key, val] of Object.entries(exportData)) {
            html += `<h2 style="text-transform: capitalize; color: #333333;">${key}</h2>`;
            if (Array.isArray(val)) {
                if (val.length === 0) html += `<p>No records found.</p>`;
                else {
                    html += `<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;"><tr style="background-color: #f1f5f9;">`;
                    Object.keys(val[0] as any).forEach(k => { html += `<th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">${k}</th>`; });
                    html += `</tr>`;
                    val.forEach(row => {
                        html += `<tr>`;
                        Object.values(row as any).forEach(v => { html += `<td style="border: 1px solid #cbd5e1; padding: 8px;">${v !== null && typeof v !== 'object' ? v : JSON.stringify(v)}</td>`; });
                        html += `</tr>`;
                    });
                    html += `</table>`;
                }
            } else if (typeof val === 'object' && val !== null) {
                html += `<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">`;
                for (const [k, v] of Object.entries(val)) {
                    if (k === 'profilePhoto' || k === 'profile_photo') continue;
                    html += `<tr><td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; width: 30%; background-color: #f8fafc;">${k}</td><td style="border: 1px solid #cbd5e1; padding: 8px;">${v !== null && typeof v !== 'object' ? v : JSON.stringify(v)}</td></tr>`;
                }
                html += `</table>`;
            } else { html += `<p>${val}</p>`; }
        }
        html += `</body></html>`;
        const { uri: pdfUri } = await Print.printToFileAsync({ html });
        if (Platform.OS === 'android') {
          const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (permissions.granted) {
            const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, fileName, 'application/pdf');
            const base64Data = await FileSystem.readAsStringAsync(pdfUri, { encoding: FileSystem.EncodingType.Base64 });
            await FileSystem.writeAsStringAsync(fileUri, base64Data, { encoding: FileSystem.EncodingType.Base64 });
            showAlert('Download Complete', 'Your PDF export has been saved successfully.', [], 'success');
          } else showAlert('Permission Denied', 'Storage permission is required to save the file.', [], 'error');
        } else {
          if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(pdfUri, { mimeType: 'application/pdf', dialogTitle: 'Save your data export', UTI: 'com.adobe.pdf' });
          else showAlert('Download Complete', `Your PDF export has been generated.`, [], 'success');
        }
      } else throw new Error('Invalid response from server');
    } catch (error: any) { showAlert('Export Failed', 'There was an error generating your data export. Please try again.', [], 'error'); } finally { setLoading(false); }
  };

  const DroppingFiles = () => {
      const dropY = useSharedValue(-20);
      const dropOpacity = useSharedValue(0);

      useEffect(() => {
          if (loading) {
              dropY.value = withRepeat(withTiming(20, { duration: 1000, easing: Easing.in(Easing.ease) }), -1, false);
              dropOpacity.value = withRepeat(
                  withSequence(
                      withTiming(1, { duration: 200 }),
                      withTiming(1, { duration: 600 }),
                      withTiming(0, { duration: 200 })
                  ), -1, false
              );
          } else {
              dropY.value = -20;
              dropOpacity.value = 0;
          }
      }, [loading]);

      const rStyle = useAnimatedStyle(() => ({
          transform: [{ translateY: dropY.value }],
          opacity: dropOpacity.value
      }));

      return (
          <View style={{ position: 'absolute', right: 0, top: 0, width: 64, height: 64, justifyContent: 'center', alignItems: 'center' }}>
              <MaterialCommunityIcons name="folder-download-outline" size={48} color={textMuted} />
              <Animated.View style={[{ position: 'absolute', top: -10 }, rStyle]}>
                  <MaterialCommunityIcons name="file-document" size={24} color="#10B981" />
              </Animated.View>
          </View>
      );
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
        <View style={[styles.hero, { position: 'relative' }]}>
          <AppText style={[styles.heroTitle, { color: textMain }]}>Download{"\n"}Data</AppText>
          <AppText style={[styles.heroSub, { color: textMuted }]}>Select the categories below and we'll generate a downloadable copy of your data directly to your device.</AppText>
          <DroppingFiles />
        </View>

        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <AppText style={styles.secTitle}>DATA CATEGORIES</AppText>
            <Pressable onPress={() => { const allSelected = selectedCount === DATA_CATEGORIES.length; setSelectedCategories(Object.fromEntries(DATA_CATEGORIES.map(c => [c.id, !allSelected]))); }} style={({ pressed }) => [pressed && { opacity: 0.5 }]}>
              <AppText style={styles.selectAllText}>{selectedCount === DATA_CATEGORIES.length ? 'Deselect All' : 'Select All'}</AppText>
            </Pressable>
          </View>

          {DATA_CATEGORIES.map((cat) => (
            <Pressable key={cat.id} style={({ pressed }) => [styles.catRow, { borderColor: borderSubtle }, pressed && { backgroundColor: pressedBg }]} onPress={() => toggleCategory(cat.id)}>
              <View style={[styles.catIcon, { backgroundColor: cat.color + '20' }]}>
                <MaterialCommunityIcons name={cat.icon as any} size={22} color={cat.color} />
              </View>
              <View style={styles.catInfo}>
                <AppText style={[styles.catLabel, { color: textMain }]}>{cat.label}</AppText>
                <AppText style={styles.catDesc}>{cat.desc}</AppText>
              </View>
              <Switch value={selectedCategories[cat.id]} onValueChange={() => toggleCategory(cat.id)} trackColor={{ false: '#333333', true: '#10B981' }} thumbColor="#FFFFFF" />
            </Pressable>
          ))}
        </View>

        <Pressable style={({ pressed }) => [styles.downloadBtn, { backgroundColor: btnBg }, selectedCount === 0 && { opacity: 0.4 }, pressed && selectedCount > 0 && { opacity: 0.8 }]} onPress={handleDownload} disabled={loading || selectedCount === 0}>
          {loading ? <ActivityIndicator color={btnText} /> : (<>
            <MaterialCommunityIcons name="download" size={24} color={btnText} />
            <AppText style={[styles.downloadText, { color: btnText }]}>Request Download ({selectedCount})</AppText>
          </>)}
        </Pressable>

        <AppText style={[styles.footerNote, { color: textMuted }]}>Data will be generated and saved securely to your device in PDF format.</AppText>
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
  section: { marginBottom: 32 },
  secTitle: { fontSize: 11, fontWeight: '700', color: '#888888', letterSpacing: 1.5, textTransform: 'uppercase' },
  selectAllText: { fontSize: 14, fontWeight: '600', color: '#10B981' },
  catRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  catIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  catInfo: { flex: 1, paddingRight: 12 },
  catLabel: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  catDesc: { fontSize: 13, color: '#888888' },
  downloadBtn: { padding: 18, borderRadius: 100, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 },
  downloadText: { fontSize: 18, fontWeight: '700' },
  footerNote: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
});
