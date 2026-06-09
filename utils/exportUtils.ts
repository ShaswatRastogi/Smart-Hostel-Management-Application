import { getSecureToken } from './tokenStorage';
import axios from 'axios';
import { Alert } from 'react-native';
import { API_BASE_URL } from './api';
const FileSystem = require('expo-file-system/legacy');

export interface ExportOptions {
  format?: 'excel' | 'pdf';
  startDate?: string;
  endDate?: string;
  status?: string;
  type?: string;
  studentId?: string;
  branch?: string;
  bloodGroup?: string;
  hostelName?: string;
  roomType?: string;
  feeFrequency?: string;
  duesStatus?: string;
  roomNumber?: string;
}

/**
 * Get auth token from AsyncStorage
 */
const getAuthToken = async (): Promise<string | null> => {
  return await getSecureToken('userToken');
};

/**
 * Export students data
 */
export const exportStudents = async (options: ExportOptions = {}) => {
  try {
    const params = new URLSearchParams();
    params.append('format', options.format || 'excel');
    if (options.status) params.append('status', options.status);
    if (options.branch) params.append('branch', options.branch);
    if (options.bloodGroup) params.append('bloodGroup', options.bloodGroup);
    if (options.hostelName) params.append('hostelName', options.hostelName);
    if (options.roomType) params.append('roomType', options.roomType);
    if (options.feeFrequency) params.append('feeFrequency', options.feeFrequency);
    if (options.duesStatus) params.append('duesStatus', options.duesStatus);
    if (options.roomNumber) params.append('roomNumber', options.roomNumber);
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);

    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please login again.');
    }

    const response = await axios.get(`${API_BASE_URL}/api/export/students?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': options.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      responseType: 'blob' // Use blob to read as base64 reliably in React Native
    });

    const filename = `students_report_${new Date().toISOString().split('T')[0]}.${options.format || 'xlsx'}`;
    await saveBlobToDevice(response.data, filename);
  } catch (error) {
    console.error('Error exporting students:', error);
    throw new Error('Failed to export student data');
  }
};

/**
 * Export attendance data
 */
export const exportAttendance = async (options: ExportOptions = {}) => {
  try {
    const params = new URLSearchParams();
    params.append('format', options.format || 'excel');
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);
    if (options.studentId) params.append('studentId', options.studentId);

    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please login again.');
    }

    const response = await axios.get(`${API_BASE_URL}/api/export/attendance?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': options.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      responseType: 'blob'
    });

    const filename = `attendance_report_${new Date().toISOString().split('T')[0]}.${options.format || 'xlsx'}`;
    await saveBlobToDevice(response.data, filename);
  } catch (error) {
    console.error('Error exporting attendance:', error);
    throw new Error('Failed to export attendance data');
  }
};

/**
 * Export complaints data
 */
export const exportComplaints = async (options: ExportOptions = {}) => {
  try {
    const params = new URLSearchParams();
    params.append('format', options.format || 'excel');
    if (options.status) params.append('status', options.status);
    if (options.type) params.append('type', options.type);
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);

    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please login again.');
    }

    const response = await axios.get(`${API_BASE_URL}/api/export/complaints?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': options.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      responseType: 'blob'
    });

    const filename = `complaints_report_${new Date().toISOString().split('T')[0]}.${options.format || 'xlsx'}`;
    await saveBlobToDevice(response.data, filename);
  } catch (error) {
    console.error('Error exporting complaints:', error);
    throw new Error('Failed to export complaints data');
  }
};

/**
 * Export payments data
 */
export const exportPayments = async (options: ExportOptions = {}) => {
  try {
    const params = new URLSearchParams();
    params.append('format', options.format || 'excel');
    if (options.status) params.append('status', options.status);
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);

    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please login again.');
    }

    const response = await axios.get(`${API_BASE_URL}/api/export/payments?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': options.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      responseType: 'blob'
    });

    const filename = `payments_report_${new Date().toISOString().split('T')[0]}.${options.format || 'xlsx'}`;
    await saveBlobToDevice(response.data, filename);
  } catch (error) {
    console.error('Error exporting payments:', error);
    throw new Error('Failed to export payments data');
  }
};

/**
 * Export leave requests data
 */
export const exportLeaveRequests = async (options: ExportOptions = {}) => {
  try {
    const params = new URLSearchParams();
    params.append('format', options.format || 'excel');
    if (options.status) params.append('status', options.status);
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);

    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please login again.');
    }

    const response = await axios.get(`${API_BASE_URL}/api/export/leave-requests?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': options.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      responseType: 'blob'
    });

    const filename = `leave_requests_report_${new Date().toISOString().split('T')[0]}.${options.format || 'xlsx'}`;
    await saveBlobToDevice(response.data, filename);
  } catch (error) {
    console.error('Error exporting leave requests:', error);
    throw new Error('Failed to export leave requests data');
  }
};

/**
 * Fetch distinct filter options (branch, blood group) from the backend
 */
export const fetchExportFilters = async (): Promise<{ branches: string[], bloodGroups: string[], hostels: string[], roomTypes: string[] }> => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('No auth token found');

    const response = await axios.get(`${API_BASE_URL}/api/export/filters`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching export filters:', error);
    return { branches: [], bloodGroups: [], hostels: [], roomTypes: [] };
  }
};

/**
 * Save Blob directly to device using StorageAccessFramework
 */
const saveBlobToDevice = async (data: any, filename: string) => {
  try {
    // 1. Convert Blob to Base64 using FileReader
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
      reader.readAsDataURL(data);
    });

    const mimeType = filename.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    // 2. Request user directory to save the file via StorageAccessFramework
    if (FileSystem.StorageAccessFramework) {
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (permissions.granted) {
        // Create the file in the selected directory
        const uri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          filename,
          mimeType
        );

        // Write the base64 data to that file
        await FileSystem.writeAsStringAsync(uri, base64Data, {
          encoding: 'base64',
        });

        Alert.alert('Success', `File downloaded successfully as ${filename}`);
      } else {
        Alert.alert('Permission Denied', 'Unable to save the file without storage permissions.');
      }
    } else {
      // Fallback if SAF is somehow missing
      let documentDir = FileSystem.documentDirectory || "file:///data/user/0/com.shaswatrastogi.smarthostel/files/";
      const fileUri = documentDir + filename;

      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: 'base64',
      });

      Alert.alert('Success', `File saved internally mapped to the app: ${fileUri}`);
    }
  } catch (error) {
    console.error('Error saving file natively:', error);
    Alert.alert('Download Failed', 'There was an error saving the downloaded file to your device.');
    throw new Error('Failed to save file');
  }
};
