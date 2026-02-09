import api from './api';

export interface HostelInfo {
    id: number;
    name: string;
    subtitle?: string;
    description: string;
    image_url?: string;
    contact_email?: string;
    contact_phone?: string;
    address?: string;
    footer_text?: string;
    location?: string;
}

export const getHostelInfo = async (): Promise<HostelInfo> => {
    const response = await api.get('/hostel-info');
    return response.data;
};

export const updateHostelInfo = async (data: Partial<HostelInfo>): Promise<HostelInfo> => {
    const response = await api.put('/hostel-info', data);
    return response.data;
};
