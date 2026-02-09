import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { API_URL } from './api';

export interface Student {
    id: string;
    fullName: string;
    rollNo: string;
    roomNo: string;
    email: string;
    phone: string;
    status: 'active' | 'inactive';
    dues: number;
    // ... other fields
    collegeName?: string;
    hostelName?: string;
    dob?: string;
    address?: string;
    personalEmail?: string;
    collegeEmail?: string; // Added field
    fatherName?: string;
    fatherPhone?: string;
    motherName?: string;
    motherPhone?: string;
    bloodGroup?: string;
    medicalHistory?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    createdAt?: any;
    profilePhoto?: string;
}

export const getAllStudents = async (): Promise<Student[]> => {
    try {
        const response = await api.get('/students/all');
        return response.data;
    } catch (error) {
        console.error("Error fetching students:", error);
        return [];
    }
};

export const createStudent = async (studentData: any) => {
    try {
        await api.post('/students/allot', studentData);
        return true;
    } catch (error) {
        console.error("Error creating student:", error);
        throw error;
    }
};

export const deleteStudent = async (id: string) => {
    try {
        await api.delete(`/students/${id}`);
    } catch (error) {
        console.error("Error deleting student:", error);
        throw error;
    }
};

export const updateStudent = async (id: string, updates: any) => {
    try {
        if (updates instanceof FormData) {
            // Use native fetch for FormData to avoid Axios serialization issues on RN
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_URL}/students/${id}`, {
                method: 'PUT',
                body: updates,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // Content-Type is left undefined so fetch sets the boundary automatically
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Upload failed: ${response.status} ${errorText}`);
            }
            return;
        }

        await api.put(`/students/${id}`, updates);
    } catch (error) {
        console.error("Error updating student:", error);
        throw error;
    }
};

export const subscribeToStudents = (callback: (students: Student[]) => void) => {
    const fetch = async () => {
        const data = await getAllStudents();
        callback(data);
    };
    fetch();
    const interval = setInterval(fetch, 10000); // Poll every 10s
    return () => clearInterval(interval);
};
