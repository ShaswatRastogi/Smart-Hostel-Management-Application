import { NextFunction, Request, Response } from 'express';
import { query } from '../config/db';

// Get Hostel Info
export const getHostelInfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const result = await query('SELECT * FROM hostel_info WHERE id = 1');

        if (result.rows.length === 0) {
            // Should not happen if migration ran correctly, but fallback
            res.status(404).json({ message: 'Hostel info not found' });
            return;
        }

        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
};

// Update Hostel Info
export const updateHostelInfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { name, subtitle, description, image_url, contact_email, contact_phone, address, footer_text, location } = req.body;

    try {
        const result = await query(
            `UPDATE hostel_info 
             SET name = $1, subtitle = $2, description = $3, image_url = $4, contact_email = $5, contact_phone = $6, address = $7, footer_text = $8, location = $9, updated_at = NOW()
             WHERE id = 1 
             RETURNING *`,
            [name, subtitle, description, image_url, contact_email, contact_phone, address, footer_text, location]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ message: 'Hostel info not found' });
            return;
        }

        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
};
