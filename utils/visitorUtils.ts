import api from './api';

export interface Visitor {
    id: number;
    student_id: number;
    visitor_name: string;
    visitor_phone: string;
    visitor_relation?: string;
    purpose: string;
    room_number: string;
    expected_date: string;
    expected_time_in?: string;
    expected_time_out?: string;
    status: 'pending' | 'approved' | 'rejected' | 'checked_in' | 'checked_out' | 'cancelled';
    admin_remarks?: string;
    approved_by?: number;
    approved_at?: string;
    checked_in_at?: string;
    checked_out_at?: string;
    visitor_photo?: string;
    id_proof_type?: string;
    id_proof_number?: string;
    qr_code?: string;
    created_at: string;
    updated_at: string;
    // Joined fields
    roll_no?: string;
    student_name?: string;
    student_email?: string;
    approved_by_name?: string;
}

export interface VisitorRegistrationData {
    visitorName: string;
    visitorPhone: string;
    visitorRelation?: string;
    purpose: string;
    expectedDate: string;
    expectedTimeIn?: string;
    expectedTimeOut?: string;
    visitorPhoto?: string;
    idProofType?: string;
    idProofNumber?: string;
}

// Student APIs
export const registerVisitor = async (data: VisitorRegistrationData) => {
    const response = await api.post('/visitors/register', data);
    return response.data;
};

export const getMyVisitors = async (): Promise<Visitor[]> => {
    const response = await api.get('/visitors/my-visitors');
    return response.data;
};

export const getVisitorById = async (id: number): Promise<Visitor> => {
    const response = await api.get(`/visitors/${id}`);
    return response.data;
};

export const cancelVisitor = async (id: number) => {
    const response = await api.put(`/visitors/${id}/cancel`);
    return response.data;
};

// Admin APIs
export const getPendingVisitors = async (): Promise<Visitor[]> => {
    const response = await api.get('/visitors/admin/pending');
    return response.data;
};

export const getActiveVisitors = async (): Promise<Visitor[]> => {
    const response = await api.get('/visitors/admin/active');
    return response.data;
};

export const getAllVisitors = async (filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    studentId?: number;
}): Promise<Visitor[]> => {
    const response = await api.get('/visitors/admin/all', { params: filters });
    return response.data;
};

// Get visitors for a specific student by email (admin use)
export async function getVisitorsByStudentEmail(studentEmail: string): Promise<Visitor[]> {
    const response = await api.get(`/visitors/admin/all`, {
        params: { studentEmail }
    });
    return response.data;
}

export const approveVisitor = async (id: number, remarks?: string) => {
    const response = await api.put(`/visitors/${id}/approve`, { remarks });
    return response.data;
};

export const rejectVisitor = async (id: number, remarks: string) => {
    const response = await api.put(`/visitors/${id}/reject`, { remarks });
    return response.data;
};

export const checkInVisitor = async (id: number) => {
    const response = await api.put(`/visitors/${id}/check-in`);
    return response.data;
};

export const checkOutVisitor = async (id: number) => {
    const response = await api.put(`/visitors/${id}/check-out`);
    return response.data;
};

export const verifyQRCode = async (qrCode: string) => {
    const response = await api.get(`/visitors/verify/${qrCode}`);
    return response.data;
};

// Helper functions
export const getStatusColor = (status: Visitor['status']): string => {
    switch (status) {
        case 'pending':
            return '#F59E0B'; // Amber
        case 'approved':
            return '#10B981'; // Green
        case 'checked_in':
            return '#3B82F6'; // Blue
        case 'checked_out':
            return '#6B7280'; // Gray
        case 'rejected':
            return '#EF4444'; // Red
        case 'cancelled':
            return '#9CA3AF'; // Light Gray
        default:
            return '#6B7280';
    }
};

export const getStatusLabel = (status: Visitor['status']): string => {
    switch (status) {
        case 'pending':
            return 'Pending Approval';
        case 'approved':
            return 'Approved';
        case 'checked_in':
            return 'Checked In';
        case 'checked_out':
            return 'Checked Out';
        case 'rejected':
            return 'Rejected';
        case 'cancelled':
            return 'Cancelled';
        default:
            return status;
    }
};

export const getStatusIcon = (status: Visitor['status']): string => {
    switch (status) {
        case 'pending':
            return 'clock-outline';
        case 'approved':
            return 'check-circle';
        case 'checked_in':
            return 'login';
        case 'checked_out':
            return 'logout';
        case 'rejected':
            return 'close-circle';
        case 'cancelled':
            return 'cancel';
        default:
            return 'help-circle';
    }
};


export const formatDate = (date: string | Date): string => {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

export const formatTime = (time: string | Date): string => {
    if (!time) return '';

    if (time instanceof Date) {
        return time.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
};
