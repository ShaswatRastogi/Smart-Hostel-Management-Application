import api from './api';

export type InventoryItem = {
    id: string;
    name: string;
    stock: string;
    status: 'Good' | 'Low' | 'Out of Stock';
    updated_at: Date;
};

export type ChecklistItem = {
    id: string;
    area_name: string;
    is_done: boolean;
    completed_at?: Date;
    updated_at: Date;
};

// Inventory API
export const fetchInventory = async (): Promise<InventoryItem[]> => {
    try {
        const response = await api.get('/cleaning/inventory');
        return response.data.map((item: any) => ({
            ...item,
            id: item.id.toString(),
            updated_at: new Date(item.updated_at)
        }));
    } catch (error) {
        console.error("Error fetching inventory:", error);
        throw error;
    }
};

export const updateInventoryItem = async (id: string, stock: string, status: string) => {
    try {
        const response = await api.put(`/cleaning/inventory/${id}`, { stock, status });
        return response.data;
    } catch (error) {
        console.error("Error updating inventory:", error);
        throw error;
    }
};

// Checklist API
export const fetchChecklist = async (): Promise<ChecklistItem[]> => {
    try {
        const response = await api.get('/cleaning/checklist');
        return response.data.map((item: any) => ({
            ...item,
            id: item.id.toString(),
            updated_at: new Date(item.updated_at),
            completed_at: item.completed_at ? new Date(item.completed_at) : undefined
        }));
    } catch (error) {
        console.error("Error fetching checklist:", error);
        throw error;
    }
};

export const toggleChecklistItem = async (id: string, is_done: boolean) => {
    try {
        const response = await api.put(`/cleaning/checklist/${id}`, { is_done });
        return response.data;
    } catch (error) {
        console.error("Error toggling checklist item:", error);
        throw error;
    }
};

export const resetChecklist = async () => {
    try {
        const response = await api.post('/cleaning/checklist/reset');
        return response.data;
    } catch (error) {
        console.error("Error resetting checklist:", error);
        throw error;
    }
};
