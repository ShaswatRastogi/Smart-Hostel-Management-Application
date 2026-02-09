import { Request, Response } from 'express';
import { query } from '../config/db';

export const getAllNotices = async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT * FROM notices ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching notices:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const createNotice = async (req: Request, res: Response) => {
    const { title, content, priority } = req.body;
    try {
        const result = await query(
            'INSERT INTO notices (title, content, priority) VALUES ($1, $2, $3) RETURNING *',
            [title, content, priority || 'low']
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error creating notice:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const deleteNotice = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await query('DELETE FROM notices WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting notice:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
