import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppText from './AppText';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import {
  exportAttendance,
  exportComplaints,
  exportLeaveRequests,
  ExportOptions,
  exportPayments,
  exportStudents,
  fetchExportFilters
} from '../utils/exportUtils';

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  exportType: 'students' | 'attendance' | 'complaints' | 'payments' | 'leave-requests';
  title: string;
}

const ExportModal: React.FC<ExportModalProps> = ({
  visible,
  onClose,
  exportType,
  title
}) => {
  const { isDark } = useTheme();
  const [format, setFormat] = useState<'excel' | 'pdf'>('excel');
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ExportOptions>({});
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [availableFilters, setAvailableFilters] = useState<{ branches: string[], bloodGroups: string[], hostels: string[], roomTypes: string[] }>({ branches: [], bloodGroups: [], hostels: [], roomTypes: [] });

  useEffect(() => {
    const loadFilters = async () => {
      if (visible && exportType === 'students') {
        const data = await fetchExportFilters();
        setAvailableFilters(data);
      }
    };
    loadFilters();
  }, [visible, exportType]);

  const updateFilter = (key: keyof ExportOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = async () => {
    try {
      setLoading(true);

      const exportOptions: ExportOptions = {
        format,
        ...filters
      };

      switch (exportType) {
        case 'students':
          await exportStudents(exportOptions);
          break;
        case 'attendance':
          await exportAttendance(exportOptions);
          break;
        case 'complaints':
          await exportComplaints(exportOptions);
          break;
        case 'payments':
          await exportPayments(exportOptions);
          break;
        case 'leave-requests':
          await exportLeaveRequests(exportOptions);
          break;
      }

      onClose();
      Alert.alert('Success', 'Report exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      width: '100%',
      maxHeight: '90%',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 10,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
      letterSpacing: 0.5,
    },
    closeButton: {
      padding: 8,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      borderRadius: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: isDark ? '#9CA3AF' : '#4B5563',
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    formatContainer: {
      flexDirection: 'row',
      gap: 16,
    },
    formatOption: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: isDark ? '#374151' : '#E5E7EB',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
    },
    formatOptionSelected: {
      borderColor: '#3B82F6',
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF',
    },
    formatText: {
      marginLeft: 12,
      fontSize: 15,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#374151',
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderRadius: 12,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      marginBottom: 16,
    },
    filterText: {
      fontSize: 15,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    exportButton: {
      backgroundColor: '#3B82F6',
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: '#3B82F6',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    exportButtonDisabled: {
      backgroundColor: isDark ? '#4B5563' : '#9CA3AF',
      shadowOpacity: 0,
      elevation: 0,
    },
    exportButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    input: {
      backgroundColor: isDark ? '#374151' : '#F9FAFB',
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#E5E7EB',
      borderRadius: 12,
      padding: 14,
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 16,
      fontSize: 15,
    },
    filterLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#D1D5DB' : '#4B5563',
      marginBottom: 8,
      marginLeft: 4,
    },
    pickerContainer: {
      backgroundColor: isDark ? '#374151' : '#F9FAFB',
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#E5E7EB',
      borderRadius: 12,
      marginBottom: 16,
      overflow: 'hidden',
    },
    picker: {
      height: 54,
      width: '100%',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    datePickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? '#374151' : '#F9FAFB',
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#E5E7EB',
      borderRadius: 12,
      padding: 14,
      marginBottom: 16,
    },
    dateText: {
      fontSize: 15,
      color: isDark ? '#F9FAFB' : '#111827',
    },
    datePlaceholder: {
      color: isDark ? '#9CA3AF' : '#9CA3AF',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <AppText style={styles.title}>{title}</AppText>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={isDark ? '#F3F4F6' : '#111827'}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flexShrink: 1, width: '100%' }} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>Export Format</AppText>
              <View style={styles.formatContainer}>
                <TouchableOpacity
                  style={[
                    styles.formatOption,
                    format === 'excel' && styles.formatOptionSelected
                  ]}
                  onPress={() => setFormat('excel')}
                >
                  <MaterialCommunityIcons
                    name="microsoft-excel"
                    size={20}
                    color={format === 'excel' ? '#3B82F6' : (isDark ? '#9CA3AF' : '#6B7280')}
                  />
                  <AppText style={styles.formatText}>Excel</AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.formatOption,
                    format === 'pdf' && styles.formatOptionSelected
                  ]}
                  onPress={() => setFormat('pdf')}
                >
                  <MaterialCommunityIcons
                    name="file-pdf-box"
                    size={20}
                    color={format === 'pdf' ? '#3B82F6' : (isDark ? '#9CA3AF' : '#6B7280')}
                  />
                  <AppText style={styles.formatText}>PDF</AppText>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowFilters(!showFilters)}
            >
              <AppText style={styles.filterText}>Advanced Filters</AppText>
              <MaterialCommunityIcons
                name={showFilters ? "chevron-up" : "chevron-down"}
                size={20}
                color={isDark ? '#9CA3AF' : '#6B7280'}
              />
            </TouchableOpacity>

            {showFilters && (
              <View style={styles.section}>
                <AppText style={styles.sectionTitle}>Filters (Optional)</AppText>

                {exportType === 'students' && (
                  <>
                    <AppText style={styles.filterLabel}>Branch / College</AppText>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={filters.branch || ''}
                        onValueChange={(itemValue) => updateFilter('branch', itemValue)}
                        style={styles.picker}
                        dropdownIconColor={isDark ? '#F3F4F6' : '#111827'}
                      >
                        <Picker.Item label="All Branches" value="" color={isDark ? '#F3F4F6' : '#111827'} />
                        {availableFilters.branches.map(branch => (
                          <Picker.Item key={branch} label={branch} value={branch} color={isDark ? '#F3F4F6' : '#111827'} />
                        ))}
                      </Picker>
                    </View>

                    <AppText style={styles.filterLabel}>Blood Group</AppText>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={filters.bloodGroup || ''}
                        onValueChange={(itemValue) => updateFilter('bloodGroup', itemValue)}
                        style={styles.picker}
                        dropdownIconColor={isDark ? '#F3F4F6' : '#111827'}
                      >
                        <Picker.Item label="All Blood Groups" value="" color={isDark ? '#F3F4F6' : '#111827'} />
                        {availableFilters.bloodGroups.map(bg => (
                          <Picker.Item key={bg} label={bg} value={bg} color={isDark ? '#F3F4F6' : '#111827'} />
                        ))}
                      </Picker>
                      <AppText style={styles.filterLabel}>Hostel Name</AppText>
                      <View style={styles.pickerContainer}>
                        <Picker
                          selectedValue={filters.hostelName || ''}
                          onValueChange={(itemValue) => updateFilter('hostelName', itemValue)}
                          style={styles.picker}
                          dropdownIconColor={isDark ? '#F3F4F6' : '#111827'}
                        >
                          <Picker.Item label="All Hostels" value="" color={isDark ? '#F3F4F6' : '#111827'} />
                          {availableFilters.hostels.map(h => (
                            <Picker.Item key={h} label={h} value={h} color={isDark ? '#F3F4F6' : '#111827'} />
                          ))}
                        </Picker>
                      </View>

                      <AppText style={styles.filterLabel}>Room Number</AppText>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 101"
                        placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                        value={filters.roomNumber || ''}
                        onChangeText={(text) => updateFilter('roomNumber', text)}
                      />

                      <AppText style={styles.filterLabel}>Room Type</AppText>
                      <View style={styles.pickerContainer}>
                        <Picker
                          selectedValue={filters.roomType || ''}
                          onValueChange={(itemValue) => updateFilter('roomType', itemValue)}
                          style={styles.picker}
                          dropdownIconColor={isDark ? '#F3F4F6' : '#111827'}
                        >
                          <Picker.Item label="All Room Types" value="" color={isDark ? '#F3F4F6' : '#111827'} />
                          {availableFilters.roomTypes.map(rt => (
                            <Picker.Item key={rt} label={rt} value={rt} color={isDark ? '#F3F4F6' : '#111827'} />
                          ))}
                        </Picker>
                      </View>

                      <AppText style={styles.filterLabel}>Student Status</AppText>
                      <View style={styles.pickerContainer}>
                        <Picker
                          selectedValue={filters.status || ''}
                          onValueChange={(itemValue) => updateFilter('status', itemValue)}
                          style={styles.picker}
                          dropdownIconColor={isDark ? '#F3F4F6' : '#111827'}
                        >
                          <Picker.Item label="All (Active & Inactive)" value="" color={isDark ? '#F3F4F6' : '#111827'} />
                          <Picker.Item label="Active Only" value="active" color={isDark ? '#F3F4F6' : '#111827'} />
                          <Picker.Item label="Inactive Only" value="inactive" color={isDark ? '#F3F4F6' : '#111827'} />
                        </Picker>
                      </View>

                      <AppText style={styles.filterLabel}>Fee Frequency</AppText>
                      <View style={styles.pickerContainer}>
                        <Picker
                          selectedValue={filters.feeFrequency || ''}
                          onValueChange={(itemValue) => updateFilter('feeFrequency', itemValue)}
                          style={styles.picker}
                          dropdownIconColor={isDark ? '#F3F4F6' : '#111827'}
                        >
                          <Picker.Item label="All Frequencies" value="" color={isDark ? '#F3F4F6' : '#111827'} />
                          <Picker.Item label="Monthly" value="Monthly" color={isDark ? '#F3F4F6' : '#111827'} />
                          <Picker.Item label="Semester" value="Semester" color={isDark ? '#F3F4F6' : '#111827'} />
                          <Picker.Item label="Yearly" value="Yearly" color={isDark ? '#F3F4F6' : '#111827'} />
                        </Picker>
                      </View>

                      <AppText style={styles.filterLabel}>Dues Status</AppText>
                      <View style={styles.pickerContainer}>
                        <Picker
                          selectedValue={filters.duesStatus || ''}
                          onValueChange={(itemValue) => updateFilter('duesStatus', itemValue)}
                          style={styles.picker}
                          dropdownIconColor={isDark ? '#F3F4F6' : '#111827'}
                        >
                          <Picker.Item label="All" value="" color={isDark ? '#F3F4F6' : '#111827'} />
                          <Picker.Item label="Has Dues" value="has_dues" color={isDark ? '#F3F4F6' : '#111827'} />
                          <Picker.Item label="No Dues" value="no_dues" color={isDark ? '#F3F4F6' : '#111827'} />
                        </Picker>
                      </View>
                    </View>
                  </>
                )}

                {['students', 'attendance', 'complaints', 'payments', 'leave-requests'].includes(exportType) && (
                  <>
                    <AppText style={styles.filterLabel}>{exportType === 'students' ? 'Joined After Date' : 'Start Date'}</AppText>
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => setShowStartPicker(true)}
                    >
                      <AppText style={[styles.dateText, !filters.startDate && styles.datePlaceholder]}>
                        {filters.startDate ? filters.startDate : 'Select Start Date'}
                      </AppText>
                      <MaterialCommunityIcons name="calendar" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                    </TouchableOpacity>
                    {showStartPicker && (
                      <DateTimePicker
                        value={filters.startDate ? new Date(filters.startDate) : new Date()}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                          setShowStartPicker(Platform.OS === 'ios');
                          if (selectedDate) {
                            const dateString = selectedDate.toISOString().split('T')[0];
                            updateFilter('startDate', dateString);
                          }
                        }}
                      />
                    )}

                    <AppText style={styles.filterLabel}>{exportType === 'students' ? 'Joined Before Date' : 'End Date'}</AppText>
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => setShowEndPicker(true)}
                    >
                      <AppText style={[styles.dateText, !filters.endDate && styles.datePlaceholder]}>
                        {filters.endDate ? filters.endDate : 'Select End Date'}
                      </AppText>
                      <MaterialCommunityIcons name="calendar" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                    </TouchableOpacity>
                    {showEndPicker && (
                      <DateTimePicker
                        value={filters.endDate ? new Date(filters.endDate) : new Date()}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                          setShowEndPicker(Platform.OS === 'ios');
                          if (selectedDate) {
                            const dateString = selectedDate.toISOString().split('T')[0];
                            updateFilter('endDate', dateString);
                          }
                        }}
                      />
                    )}
                  </>
                )}

                {exportType === 'complaints' && (
                  <>
                    <AppText style={styles.filterLabel}>Complaint Type</AppText>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={filters.type || ''}
                        onValueChange={(itemValue) => updateFilter('type', itemValue)}
                        style={styles.picker}
                        dropdownIconColor={isDark ? '#F3F4F6' : '#111827'}
                      >
                        <Picker.Item label="All Types" value="" color={isDark ? '#F3F4F6' : '#111827'} />
                        <Picker.Item label="Maintenance" value="Maintenance" color={isDark ? '#F3F4F6' : '#111827'} />
                        <Picker.Item label="Food" value="Food" color={isDark ? '#F3F4F6' : '#111827'} />
                        <Picker.Item label="Cleaning" value="Cleaning" color={isDark ? '#F3F4F6' : '#111827'} />
                        <Picker.Item label="Internet" value="Internet" color={isDark ? '#F3F4F6' : '#111827'} />
                        <Picker.Item label="Others" value="Others" color={isDark ? '#F3F4F6' : '#111827'} />
                      </Picker>
                    </View>
                  </>
                )}
              </View>
            )}
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.exportButton,
              loading && styles.exportButtonDisabled,
              { marginTop: 16 }
            ]}
            onPress={handleExport}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <AppText style={styles.exportButtonText}>
                Export {format === 'excel' ? 'Excel' : 'PDF'}
              </AppText>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ExportModal;
