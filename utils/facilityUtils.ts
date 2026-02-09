import api from './api';

export interface Facility {
    id: number;
    title: string;
    description: string;
    image_url?: string;
    icon?: string;
    created_at?: string;
}

export const getAllFacilities = async (): Promise<Facility[]> => {
    try {
        const response = await api.get('/facilities');
        return response.data;
    } catch (error) {
        console.error('Error fetching facilities:', error);
        throw error;
    }
};

export const addFacility = async (facility: Partial<Facility>): Promise<Facility> => {
    try {
        const response = await api.post('/facilities', facility);
        return response.data;
    } catch (error) {
        console.error('Error adding facility:', error);
        throw error;
    }
};

export const updateFacility = async (id: number, facility: Partial<Facility>): Promise<Facility> => {
    try {
        const response = await api.put(`/facilities/${id}`, facility);
        return response.data;
    } catch (error) {
        console.error('Error updating facility:', error);
        throw error;
    }
};

export const deleteFacility = async (id: number): Promise<void> => {
    try {
        await api.delete(`/facilities/${id}`);
    } catch (error) {
        console.error('Error deleting facility:', error);
        throw error;
    }
};

export const reorderFacilities = async (orderedIds: number[]): Promise<void> => {
    try {
        await api.put('/facilities/reorder', { orderedIds });
    } catch (error) {
        console.error('Error reordering facilities:', error);
        throw error;
    }
};
