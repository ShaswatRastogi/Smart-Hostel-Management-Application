import { Request, Response } from 'express';
import { query } from '../config/db';

// Inventory Controllers
export const getInventory = async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT * FROM cleaning_inventory ORDER BY id ASC');
        res.json(result.rows);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateInventoryItem = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { stock, status } = req.body;
    try {
        const result = await query(
            'UPDATE cleaning_inventory SET stock = $1, status = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
            [stock, status, id]
        );
        res.json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Checklist Controllers
export const getChecklist = async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT * FROM cleaning_checklist ORDER BY id ASC');
        res.json(result.rows);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const toggleChecklistItem = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { is_done } = req.body;
    try {
        const completed_at = is_done ? 'NOW()' : null;
        const result = await query(
            'UPDATE cleaning_checklist SET is_done = $1, completed_at = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
            [is_done, completed_at, id]
        );
        res.json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const resetChecklist = async (req: Request, res: Response) => {
    try {
        await query('UPDATE cleaning_checklist SET is_done = FALSE, completed_at = NULL, updated_at = NOW()');
        res.json({ message: 'Checklist reset successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
