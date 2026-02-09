import { Request, Response } from 'express';
import { pool } from '../config/db';

export const getAllFacilities = async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM facilities ORDER BY position ASC, created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching facilities:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const addFacility = async (req: Request, res: Response) => {
    const { title, description, image_url, icon } = req.body;
    try {
        // Get max position to append to end
        const maxPosResult = await pool.query('SELECT MAX(position) as max_pos FROM facilities');
        const nextPos = (maxPosResult.rows[0].max_pos || 0) + 1;

        const result = await pool.query(
            'INSERT INTO facilities (title, description, image_url, icon, position) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, description, image_url, icon || 'star', nextPos]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error adding facility:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const updateFacility = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, description, image_url, icon } = req.body;
    try {
        const result = await pool.query(
            'UPDATE facilities SET title = $1, description = $2, image_url = $3, icon = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
            [title, description, image_url, icon, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Facility not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating facility:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const deleteFacility = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM facilities WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Facility not found' });
        }
        res.json({ message: 'Facility deleted successfully' });
    } catch (error) {
        console.error('Error deleting facility:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const reorderFacilities = async (req: Request, res: Response) => {
    const { orderedIds } = req.body; // Array of IDs in new order
    if (!Array.isArray(orderedIds)) {
        return res.status(400).json({ error: 'Invalid data' });
    }

    try {
        // Update each facility's position
        // This could be optimized but a loop is fine for small lists
        for (let i = 0; i < orderedIds.length; i++) {
            await pool.query('UPDATE facilities SET position = $1 WHERE id = $2', [i + 1, orderedIds[i]]);
        }
        res.json({ message: 'Facilities reordered successfully' });
    } catch (error) {
        console.error('Error reordering facilities:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
