import { Request, Response } from 'express';
import { query } from '../config/db';

export const getAllBusTimings = async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT * FROM bus_timings WHERE is_active = true ORDER BY departure_time ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching bus timings:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const createBusTiming = async (req: Request, res: Response) => {
    const { route_name, departure_time, destination, message } = req.body;
    try {
        const result = await query(
            'INSERT INTO bus_timings (route_name, departure_time, destination, message) VALUES ($1, $2, $3, $4) RETURNING *',
            [route_name, departure_time, destination, message]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error creating bus timing:', error);
        res.status(500).json({ error: (error as any).message });
    }
};

export const updateBusTiming = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { route_name, departure_time, destination, message } = req.body;
    try {
        const result = await query(
            'UPDATE bus_timings SET route_name = $1, departure_time = $2, destination = $3, message = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
            [route_name, departure_time, destination, message, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Bus timing not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating bus timing:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const deleteBusTiming = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await query('DELETE FROM bus_timings WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting bus timing:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
