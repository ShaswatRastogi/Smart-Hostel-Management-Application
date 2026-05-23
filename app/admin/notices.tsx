import MaterialIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Modal, RefreshControl, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAlert } from '../../context/AlertContext';
import { useRefresh } from '../../hooks/useRefresh';
import { isAdmin, useUser } from '../../utils/authUtils';
import { createNotice, deleteNotice, Notice, subscribeToNotices } from '../../utils/noticesSyncUtils';
import { useTheme } from '../../utils/ThemeContext';
import { formatUniversalTime } from '../../utils/timeUtils';
import AppText from '../../components/AppText';

export default function NoticesPage() {
  const { colors, theme } = useTheme();

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      paddingBottom: 20,
      minHeight: '100%',
    },
    header: {
      paddingVertical: 24,
      paddingHorizontal: 24,
      marginBottom: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: colors.primary,
      shadowOpacity: 0.25,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 12,
      elevation: 8,
    },
    headerContent: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: '#fff',
      letterSpacing: 0.5,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    createBtn: {
      marginHorizontal: 20,
      marginBottom: 24,
      backgroundColor: colors.primary,
      borderRadius: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      shadowColor: colors.primary,
      shadowOpacity: 0.3,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    createBtnText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    noticeCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 20,
      marginBottom: 16,
      marginHorizontal: 20,
      shadowColor: colors.textSecondary,
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 16,
      elevation: 3,
      borderWidth: 1,
      borderColor: colors.border,
    },
    noticeCardSelected: {
      borderColor: colors.primary,
      borderWidth: 1.5,
      shadowColor: colors.primary,
      shadowOpacity: 0.15,
    },
    noticeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    noticeTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    noticeTitleText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
    },
    priorityBadge: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 12,
    },
    priorityText: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    noticeDate: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 10,
      fontWeight: '500',
    },
    noticeBody: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 22,
      marginTop: 8,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    deleteBtn: {
      marginTop: 16,
      alignSelf: 'flex-end',
      backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.3)' : '#FECACA',
    },
    deleteBtnText: {
      color: '#EF4444',
      fontSize: 13,
      fontWeight: '700',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      justifyContent: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 24,
      elevation: 5,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 24,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: '800',
      marginBottom: 20,
      textAlign: 'center',
      color: colors.text,
    },
    label: {
      fontSize: 13,
      fontWeight: '700',
      marginTop: 12,
      marginBottom: 8,
      color: colors.textSecondary,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      backgroundColor: theme === 'dark' ? colors.background : '#F8FAFC',
      color: colors.text,
    },
    priorityRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 8,
      marginBottom: 24,
    },
    priorityOption: {
      flex: 1,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? colors.background : '#F8FAFC',
    },
    priorityOptionText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 12,
    },
    modalBtn: {
      flex: 1,
      padding: 16,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelBtn: {
      backgroundColor: colors.background,
    },
    saveBtn: {
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOpacity: 0.3,
      shadowOffset: { width: 0, height: 4 },
    },
    cancelBtnText: {
      color: colors.textSecondary,
      fontWeight: '700',
      fontSize: 15,
    },
    saveBtnText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 15,
    },
  }), [colors, theme]);

  const insets = useSafeAreaInsets();
  const user = useUser();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { openId } = useLocalSearchParams();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newPriority, setNewPriority] = useState<Notice['priority']>('medium');

  const [loading, setLoading] = useState(true);

  const { refreshing, onRefresh } = useRefresh(async () => {
    // Simulated refresh for real-time list
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, () => {
    setSelectedId(null);
  });

  // Auto-expand if openId is provided
  useEffect(() => {
    if (openId && notices.length > 0) {
      if (notices.some(n => n.id === openId)) {
        setSelectedId(openId as string);
      }
    }
  }, [openId, notices]);

  useEffect(() => {
    if (!isAdmin(user)) return;

    setLoading(true);
    const unsubscribe = subscribeToNotices((data) => {
      setNotices(data);
      setLoading(false);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  if (!isAdmin(user))
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <AppText>Access denied.</AppText>
      </View>
    );

  const handleCreate = async () => {
    if (!newTitle || !newBody) {
      showAlert('Error', 'Title and Body are required', [], 'error');
      return;
    }

    try {
      await createNotice({
        title: newTitle,
        body: newBody,
        priority: newPriority,
        date: new Date(),
      });

      setModalVisible(false);
      setNewTitle('');
      setNewBody('');
      setNewPriority('medium');
      showAlert('Success', 'Notice created', [], 'success');
    } catch (e: any) {
      showAlert('Error', e.message, [], 'error');
    }
  };

  const handleDelete = async (id: string) => {
    showAlert('Delete Notice', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteNotice(id);
          } catch (e: any) {
            showAlert('Error', e.message, [], 'error');
          }
        },
      },
    ], 'warning');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#DB2777';
      case 'medium':
        return '#F472B6';
      case 'low':
        return '#FB7185';
      default:
        return '#94A3B8';
    }
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['left', 'right', 'bottom']}>
      <FlatList
        data={notices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        ListHeaderComponent={
          <>
            <LinearGradient colors={['#000428', '#004e92']} style={[styles.header, { paddingTop: 24 + insets.top }]}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialIcons name="chevron-left" size={32} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerContent}>
                <AppText style={styles.headerTitle}>Notices</AppText>
              </View>
            </LinearGradient>

            <TouchableOpacity style={styles.createBtn} onPress={() => setModalVisible(true)}>
              <MaterialIcons name="plus-circle" size={20} color="#fff" />
              <AppText style={styles.createBtnText}>Create New Notice</AppText>
            </TouchableOpacity>
          </>
        }
        renderItem={({ item }) => {
          const isDark = theme === 'dark';
          const priorityColor = getPriorityColor(item.priority || 'medium');

          return (
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.noticeCard,
                selectedId === item.id && styles.noticeCardSelected,
                { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', marginHorizontal: 20 }
              ]}
              onPress={() => setSelectedId(selectedId === item.id ? null : item.id)}
            >
              <LinearGradient
                colors={isDark ? ['rgba(255,255,255,0.03)', 'transparent'] : ['rgba(0,0,0,0.01)', 'transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />

              <View style={styles.noticeHeader}>
                <View style={styles.noticeTitle}>
                  <LinearGradient
                    colors={isDark ? ['#312E81', '#1E1B4B'] : ['#E0E7FF', '#C7D2FE']}
                    style={{ width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}
                  >
                    <MaterialIcons name="bullhorn-outline" size={20} color={isDark ? '#C7D2FE' : '#4F46E5'} />
                  </LinearGradient>
                  <AppText style={[styles.noticeTitleText, { color: colors.text }]}>{item.title}</AppText>
                </View>
                <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '15' }]}>
                  <AppText style={[styles.priorityText, { color: priorityColor }]}>
                    {item.priority}
                  </AppText>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <MaterialIcons name="calendar-range" size={14} color={colors.textSecondary} />
                <AppText style={[styles.noticeDate, { color: colors.textSecondary, marginBottom: 0 }]}>
                  {formatUniversalTime(item.date, { day: 'numeric', month: 'short', year: 'numeric' })}
                </AppText>
              </View>

              {selectedId === item.id && (
                <View style={{ marginTop: 12 }}>
                  <View style={[styles.noticeBody, { borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>
                    <AppText style={{ color: colors.text, lineHeight: 22 }}>{item.body}</AppText>
                  </View>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                    <MaterialIcons name="delete-outline" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                    <AppText style={styles.deleteBtnText}>Delete Notice</AppText>
                  </TouchableOpacity>
                </View>
              )}

              {/* Subtle Watermark */}
              <MaterialIcons
                name="bullhorn"
                size={64}
                color={isDark ? '#FFF' : colors.primary}
                style={{
                  position: 'absolute',
                  right: -10,
                  bottom: -10,
                  opacity: isDark ? 0.03 : 0.02,
                  transform: [{ rotate: '-15deg' }]
                }}
              />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<AppText style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>No notices found.</AppText>}
      />

      {/* Create Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <AppText style={styles.modalTitle}>New Notice</AppText>

            <AppText style={styles.label}>Title</AppText>
            <TextInput style={styles.input} placeholder="Notice Title" value={newTitle} onChangeText={setNewTitle} />

            <AppText style={styles.label}>Body</AppText>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Notice Details..."
              multiline
              value={newBody}
              onChangeText={setNewBody}
            />

            <AppText style={styles.label}>Priority</AppText>
            <View style={styles.priorityRow}>
              {['low', 'medium', 'high'].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityOption,
                    newPriority === p && { backgroundColor: getPriorityColor(p), borderColor: getPriorityColor(p) }
                  ]}
                  onPress={() => setNewPriority(p as any)}
                >
                  <AppText style={[styles.priorityOptionText, newPriority === p && { color: '#fff' }]}>{p.toUpperCase()}</AppText>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                <AppText style={styles.cancelBtnText}>Cancel</AppText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleCreate}>
                <AppText style={styles.saveBtnText}>Post Notice</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


    </SafeAreaView>
  );
}


