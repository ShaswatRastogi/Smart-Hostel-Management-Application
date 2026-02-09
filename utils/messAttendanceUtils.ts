
import api from './api';

export interface MessAttendance {
    id: number;
    student_id: number;
    date: string; // YYYY-MM-DD
    meal: 'breakfast' | 'lunch' | 'snacks' | 'dinner';
    status: 'going' | 'skipping';
    created_at?: string;
}

export interface MessStats {
    breakfast: { going: number; skipping: number };
    lunch: { going: number; skipping: number };
    snacks: { going: number; skipping: number };
    dinner: { going: number; skipping: number };
}

// Mark attendance
export const markMessAttendance = async (date: string, meal: string, status: 'going' | 'skipping') => {
    try {
        const response = await api.post('/mess/attendance', { date, meal, status });
        return response.data;
    } catch (error) {
        console.error('Error marking mess attendance:', error);
        throw error;
    }
};

// Get my attendance
export const getMyMessAttendance = async (startDate?: string, endDate?: string) => {
    try {
        const params: any = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        const response = await api.get('/mess/attendance/my', { params });
        return response.data as MessAttendance[];
    } catch (error) {
        console.error('Error fetching my mess attendance:', error);
        return [];
    }
};

// Get stats (dmin only)
export const getMessStats = async (date: string) => {
    try {
        const response = await api.get('/mess/stats', { params: { date } });
        return response.data as MessStats;
    } catch (error) {
        console.error('Error fetching mess stats:', error);
        return null;
    }
};
