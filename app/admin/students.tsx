import MaterialIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Dimensions, KeyboardAvoidingView, Platform, RefreshControl, SectionList, StyleSheet, TouchableOpacity, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import AlphabetJumpBar from '../../components/AlphabetJumpBar';
import ExportModal from '../../components/ExportModal';
import StudentDetailsModal from '../../components/StudentDetailsModal';
import { useAlert } from '../../context/AlertContext';
import { useRefresh } from '../../hooks/useRefresh';
import { API_BASE_URL } from '../../utils/api';
import { isAdmin, useUser, isWardenOrOwner } from '../../utils/authUtils';
import { deleteStudent, getAllStudents, subscribeToStudents } from '../../utils/studentUtils';
import { useTheme } from '../../utils/ThemeContext';

// Modular components
import AddStudentForm from './components/AddStudentForm';
import EditStudentModal from './components/EditStudentModal';
import FilterHeader from './components/FilterHeader';
import StatsGrid from './components/StatsGrid';
import StudentCard from './components/StudentCard';
import AppText from '../../components/AppText';

export default function StudentsPage() {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useUser();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { search, openId, action, openEditId, openDeleteId } = useLocalSearchParams();

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      paddingBottom: 20,
    },
    header: {
      paddingVertical: 24,
      paddingHorizontal: 24,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: '#fff',
      letterSpacing: 0.5,
      textAlign: 'center',
    },
    navBar: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginTop: 20,
      marginBottom: 20,
      borderRadius: 16,
      padding: 6,
      shadowColor: colors.textSecondary,
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    navItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: 12,
    },
    navItemActive: {
      backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF',
    },
    navItemLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    navItemLabelActive: {
      color: colors.primary,
      fontWeight: '700',
    },
    statsGrid: {
      paddingHorizontal: 20,
      marginBottom: 24,
      gap: 12,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    heroCard: {
      borderRadius: 24,
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: '#4F46E5',
      shadowOpacity: 0.25,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
      overflow: 'hidden',
      height: 100,
    },
    miniCard: {
      flex: 1,
      borderRadius: 20,
      padding: 16,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
      overflow: 'hidden',
      height: 110,
      justifyContent: 'space-between',
    },
    cardWatermark: {
      position: 'absolute',
      right: -10,
      bottom: -10,
      opacity: 0.15,
      transform: [{ rotate: '-15deg' }, { scale: 1.5 }],
    },
    heroLabel: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    heroValue: {
      color: '#fff',
      fontSize: 36,
      fontWeight: '800',
      letterSpacing: -1,
    },
    miniLabel: {
      color: 'rgba(255,255,255,0.9)',
      fontSize: 12,
      fontWeight: '700',
      opacity: 0.9,
    },
    miniValue: {
      color: '#fff',
      fontSize: 28,
      fontWeight: '800',
      marginTop: 4,
    },
    miniHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginBottom: 20,
      backgroundColor: colors.card,
      borderRadius: 16,
      paddingHorizontal: 16,
      height: 56,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOpacity: 0.03,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    searchIcon: {
      marginRight: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      height: '100%',
    },
    listHeader: {
      paddingHorizontal: 20,
      marginBottom: 12,
    },
    listTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 40,
    },
    studentCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      marginBottom: 12,
      shadowColor: colors.textSecondary,
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
      overflow: 'hidden',
    },
    studentCardActive: {
      shadowColor: colors.primary,
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
      transform: [{ scale: 1.01 }],
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.card,
    },
    studentAvatarContainer: {
      marginRight: 14,
      position: 'relative',
    },
    studentAvatar: {
      width: 50,
      height: 50,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.card,
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 18,
    },
    studentInitial: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '800',
    },
    studentInfo: {
      flex: 1,
    },
    studentName: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    roomRollContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    pill: {
      backgroundColor: theme === 'dark' ? '#1E293B' : '#F1F5F9',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    detailSmall: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '700',
    },
    detailSmallLight: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    statusBadge: {
      width: 32,
      height: 32,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    expandedContent: {
      backgroundColor: colors.background,
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    infoSection: {
      marginBottom: 16,
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    detailLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    detailLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    detailValue: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 12,
      gap: 8,
    },
    editBtn: {
      backgroundColor: colors.primary,
    },
    deleteBtn: {
      backgroundColor: '#EF4444',
    },
    actionBtnText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '700',
    },
    // Modal Styles
    modalOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      zIndex: 1000,
      justifyContent: 'center',
      alignItems: 'center',
    },
    keyboardAvoidingView: {
      width: '100%',
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 24,
      width: '90%',
      height: Dimensions.get('window').height * 0.85,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 20,
      overflow: 'hidden',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 24,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
    },
    closeBtn: {
      padding: 4,
      backgroundColor: colors.background,
      borderRadius: 20,
    },
    modalBody: {
      flex: 1,
      padding: 24,
    },
    formSection: {
      marginBottom: 16,
    },
    modalLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 8,
      marginLeft: 4,
    },
    modalInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? '#0F172A' : '#FFFFFF', // Higher contrast background
      borderRadius: 16, // Rounder corners
      borderWidth: 1.5, // Thicker border
      borderColor: theme === 'dark' ? '#334155' : '#E2E8F0',
      height: 56, // Taller touch target
      paddingHorizontal: 16,
      shadowColor: theme === 'dark' ? '#000' : '#64748B',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme === 'dark' ? 0.3 : 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    disabledInputWrapper: {
      backgroundColor: theme === 'dark' ? '#1E293B' : '#F8FAFC',
      borderColor: colors.border,
      opacity: 0.7,
      elevation: 0,
    },
    inputIcon: {
      marginRight: 12,
    },
    modalInput: {
      flex: 1,
      fontSize: 15, // Larger text
      color: colors.text,
      fontWeight: '500',
    },
    disabledInput: {
      color: colors.textSecondary,
    },
    profilePhotoContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    profilePhoto: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginBottom: 10,
    },
    photoPlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme === 'dark' ? '#1E293B' : '#F1F5F9',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    changePhotoBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: theme === 'dark' ? '#1E293B' : '#F1F5F9',
    },
    changePhotoText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
    modalFooter: {
      padding: 24,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      flexDirection: 'row',
      gap: 12,
    },
    modalBtn: {
      flex: 1,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      height: 50,
    },
    cancelBtn: {
      backgroundColor: colors.background,
    },
    cancelBtnText: {
      color: colors.textSecondary,
      fontWeight: '700',
      fontSize: 14,
    },
    saveBtn: {
      overflow: 'hidden',
    },
    saveBtnGradient: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtnText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 14,
    },
    // Allotment Form Styles
    card: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 24,
      marginBottom: 20,
      elevation: 4,
      shadowColor: colors.textSecondary,
      shadowOpacity: 0.1,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
    sectionSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 20,
    },
    inputContainer: {
      marginBottom: 16,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 8,
      marginLeft: 4,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? '#1E293B' : '#F8FAFC',
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: colors.border,
      height: 56,
      paddingHorizontal: 16,
    },
    inputWrapperFocused: {
      borderColor: colors.primary,
      backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : '#F0F9FF',
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      height: '100%',
    },
    errorText: {
      color: '#EF4444',
      fontSize: 12,
      marginTop: 4,
      marginLeft: 4,
    },
    /* divider removed (duplicate) */
    submitButton: {
      marginTop: 12,
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: colors.primary,
      shadowOpacity: 0.3,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    gradientButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      gap: 10,
    },
    submitButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
  }), [colors, theme]);

  // Common States
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [isExportModalVisible, setExportModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0: Manage, 1: Allotment
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pagerRef = useRef<PagerView>(null);

  // UI State
  const [showAlphabet, setShowAlphabet] = useState(false);
  const hideTimeout = useRef<any>(null);
  const sectionListRef = useRef<SectionList>(null);

  // Modal visibility
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [isDetailsModalVisible, setDetailsModalVisible] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<any>(null);
  const [editingStudent, setEditingStudent] = useState<any>(null);

  // Fetching logic
  const fetchStudents = async () => {
    try {
      const data = await getAllStudents();
      setStudents(data);
    } catch (e) {
      console.error(e);
      showAlert('Error', 'Failed to fetch students.', [], 'error');
    }
  };

  const { onRefresh } = useRefresh(async () => {
    await fetchStudents();
  });

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    pagerRef.current?.setPage(index);
  };

  const handleEdit = (student: any) => {
    setEditingStudent(student);
    setEditModalVisible(true);
  };

  const handleDelete = async (id: string, name: string = '', room: string = '') => {
    showAlert(
      'Delete Student',
      `Are you sure you want to delete ${name}${room ? ` from Room ${room}` : ''}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStudent(id);
              showAlert('Success', 'Student deleted successfully.', [], 'success');
              setDetailsModalVisible(false);
              fetchStudents();
            } catch (error: any) {
              showAlert('Error', error.message || 'Failed to delete student', [], 'error');
            }
          }
        }
      ],
      'warning'
    );
  };

  // Real-time Subscriptions & Initial Fetch
  React.useEffect(() => {
    if (!isAdmin(user)) return;
    const unsubscribe = subscribeToStudents((data) => {
      setStudents(data);
      setLoading(false);
    });
    return () => unsubscribe && unsubscribe();
  }, [user]);

  // URL Parameter Handling
  React.useEffect(() => {
    if (search) setSearchQuery(search as string);
  }, [search]);

  React.useEffect(() => {
    if (openId && students.length > 0) {
      const student = students.find(s => String(s.id) === String(openId));
      if (student) {
        setViewingStudent(student);
        setDetailsModalVisible(true);
      }
    }
  }, [openId, students]);

  React.useEffect(() => {
    if (action === 'allot') {
      setTimeout(() => handleTabChange(1), 100);
    } else if (action === 'export') {
      setExportModalVisible(true);
    }
  }, [action]);

  React.useEffect(() => {
    if (openEditId && students.length > 0) {
      const student = students.find(s => String(s.id) === String(openEditId));
      if (student) handleEdit(student);
    }
  }, [openEditId, students]);

  React.useEffect(() => {
    if (openDeleteId && students.length > 0) {
      const student = students.find(s => String(s.id) === String(openDeleteId));
      if (student) handleDelete(student.id);
    }
  }, [openDeleteId, students]);

  // Alpha Jump Logic
  const handleScroll = () => {
    setShowAlphabet(true);
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => setShowAlphabet(false), 1500);
  };

  const sections = React.useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    const filtered = students.filter(
      (s) =>
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.room?.includes(searchQuery) ||
        s.rollNo?.includes(searchQuery)
    ).sort((a, b) => a.name.localeCompare(b.name));

    if (filtered.length === 0) return [];

    filtered.forEach(student => {
      const letter = student.name.charAt(0).toUpperCase();
      if (/[A-Z]/.test(letter)) {
        if (!groups[letter]) groups[letter] = [];
        groups[letter].push(student);
      } else {
        if (!groups['#']) groups['#'] = [];
        groups['#'].push(student);
      }
    });

    return Object.keys(groups).sort().map(key => ({
      title: key,
      data: groups[key]
    }));
  }, [students, searchQuery]);

  const handleLetterPress = (letter: string) => {
    const sectionIndex = sections.findIndex(s => s.title === letter);
    if (sectionIndex !== -1 && sectionListRef.current) {
      sectionListRef.current.scrollToLocation({
        sectionIndex,
        itemIndex: 0,
        animated: false
      });
    }
  };

  const activeStudentsCount = React.useMemo(() =>
    students.filter(s => s.status === 'active').length
    , [students]);

  const roomsCount = React.useMemo(() =>
    new Set(students.map(s => s.room).filter(Boolean)).size
    , [students]);

  const filteredCount = React.useMemo(() =>
    sections.reduce((acc, section) => acc + section.data.length, 0)
    , [sections]);

  if (!isAdmin(user)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <AppText>Access denied.</AppText>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <LinearGradient
          colors={['#000428', '#004e92']}
          style={[styles.header, { paddingTop: 24 + insets.top }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="chevron-left" size={32} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <AppText style={styles.headerTitle}>{activeTab === 0 ? 'Manage Students' : 'Student Allotment'}</AppText>
          </View>
          <TouchableOpacity onPress={() => setExportModalVisible(true)} style={styles.backButton}>
            <MaterialIcons name="download" size={22} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.navBar}>
          <TouchableOpacity style={[styles.navItem, activeTab === 0 && styles.navItemActive]} onPress={() => handleTabChange(0)}>
            <MaterialIcons name="account-group" size={20} color={activeTab === 0 ? colors.primary : colors.textSecondary} />
            <AppText style={[styles.navItemLabel, activeTab === 0 && styles.navItemLabelActive]}>Manage Students</AppText>
          </TouchableOpacity>
          {isWardenOrOwner(user) && (
            <TouchableOpacity style={[styles.navItem, activeTab === 1 && styles.navItemActive]} onPress={() => handleTabChange(1)}>
            <MaterialIcons name="account-plus" size={20} color={activeTab === 1 ? colors.primary : colors.textSecondary} />
            <AppText style={[styles.navItemLabel, activeTab === 1 && styles.navItemLabelActive]}>Student Allotment</AppText>
          </TouchableOpacity>
          )}
        </View>

        <PagerView
          ref={pagerRef}
          style={{ flex: 1 }}
          initialPage={0}
          onPageSelected={(e) => setActiveTab(e.nativeEvent.position)}
        >
          {/* PAGE 0: MANAGE STUDENTS LIST */}
          <View key="0" style={{ flex: 1 }}>
            <View style={{ flex: 1, position: 'relative' }}>
              <SectionList
                ref={sectionListRef}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                sections={sections}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
                renderSectionHeader={({ section: { title } }) => (
                  <View style={{ backgroundColor: colors.background, paddingVertical: 8, paddingHorizontal: 20 }}>
                    <AppText style={{ fontWeight: 'bold', color: colors.primary }}>{title}</AppText>
                  </View>
                )}
                ListHeaderComponent={
                  <View>
                    <StatsGrid totalStudents={students.length} activeStudents={activeStudentsCount} roomsCount={roomsCount} colors={colors} />
                    <FilterHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} resultsCount={filteredCount} colors={colors} />
                  </View>
                }
                renderItem={({ item }) => (
                  <StudentCard
                    item={item}
                    onPress={() => {
                      setViewingStudent(item);
                      setDetailsModalVisible(true);
                    }}
                    colors={colors}
                    theme={theme}
                    API_BASE_URL={API_BASE_URL}
                  />
                )}
              />
              {showAlphabet && (
                <AlphabetJumpBar
                  onLetterPress={handleLetterPress}
                  alphabets={sections.map(s => s.title)}
                />
              )}
            </View>
          </View>

          {/* PAGE 1: STUDENT ALLOTMENT FORM */}
          {isWardenOrOwner(user) ? (
            <View key="1" style={{ flex: 1 }}>
            <AddStudentForm
              colors={colors}
              theme={theme}
              showAlert={showAlert}
              handleTabChange={handleTabChange}
              onSuccess={fetchStudents}
            />
          </View>
          ) : (
            <View key="1" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <AppText>Access Restricted</AppText>
            </View>
          )}
        </PagerView>
      </KeyboardAvoidingView>

      <EditStudentModal
        visible={isEditModalVisible}
        onClose={() => setEditModalVisible(false)}
        student={editingStudent}
        colors={colors}
        theme={theme}
        showAlert={showAlert}
        onSuccess={fetchStudents}
        insets={insets}
        API_BASE_URL={API_BASE_URL}
      />

      <StudentDetailsModal
        visible={isDetailsModalVisible}
        student={viewingStudent}
        onClose={() => setDetailsModalVisible(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ExportModal
        visible={isExportModalVisible}
        onClose={() => setExportModalVisible(false)}
        exportType="students"
        title="Export Student Data"
      />
    </SafeAreaView>
  );
}
