import api from './api';

export interface LeaveRequest {
    id: string;
    studentName: string;
    studentRoom: string;
    studentEmail: string;
    studentProfilePhoto?: string;
    startDate: string; // ISO String YYYY-MM-DD
    endDate: string;   // ISO String YYYY-MM-DD
    category: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: any;
    days: number;
    qrCode?: string;
}

// Create a new leave request
export const createLeaveRequest = async (request: Omit<LeaveRequest, 'id' | 'status' | 'createdAt'>) => {
    try {
        await api.post('/services/leaves', request);
        return true;
    } catch (error) {
        console.error("Error creating leave request:", error);
        throw error;
    }
};

// Get leave requests for a specific student
export const getStudentLeaves = async (studentEmail: string): Promise<LeaveRequest[]> => {
    try {
        const response = await api.get('/services/leaves');
        return response.data;
    } catch (error) {
        console.error("Error fetching student leaves:", error);
        return [];
    }
};

// Get all leave requests (for Admin)
export const getAllLeaves = async (): Promise<LeaveRequest[]> => {
    try {
        const response = await api.get('/services/leaves/all');
        return response.data;
    } catch (error) {
        console.error("Error fetching all leaves:", error);
        return [];
    }
};

// Update leave status (Approve/Reject)
export const updateLeaveStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
        await api.put(`/services/leaves/${id}`, { status });
    } catch (error) {
        console.error("Error updating leave status:", error);
        throw error;
    }
};

// Subscribe to pending leave requests (Admin)
export const subscribeToPendingLeaves = (
    callback: (leaves: LeaveRequest[]) => void,
    onError?: (error: any) => void
) => {
    const fetch = async () => {
        try {
            const leaves = await getAllLeaves();
            const pending = leaves.filter(l => l.status === 'pending');
            callback(pending);
        } catch (error) {
            if (onError) onError(error);
        }
    };
    fetch();
    const interval = setInterval(fetch, 10000);
    return () => clearInterval(interval);
};
