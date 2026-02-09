import { Request, Response } from 'express';
import { query } from '../config/db';

export const globalSearch = async (req: Request, res: Response) => {
    try {
        const { query: searchText } = req.body;

        if (!searchText) {
            return res.json([]);
        }

        const searchTerm = `%${searchText}%`;
        const results = [];

        // Search Students
        const studentRes = await query(`
            SELECT s.id, u.full_name, s.roll_no, u.email 
            FROM students s
            JOIN users u ON s.user_id = u.id
            WHERE u.full_name ILIKE $1 OR s.roll_no ILIKE $1 OR u.email ILIKE $1
            LIMIT 5
        `, [searchTerm]);

        studentRes.rows.forEach(row => {
            results.push({
                id: row.id,
                type: 'student',
                title: row.full_name,
                subtitle: `Roll No: ${row.roll_no || 'N/A'}`,
                data: row
            });
        });

        // Search Rooms
        const roomRes = await query(`
            SELECT id, room_number, status 
            FROM rooms 
            WHERE room_number ILIKE $1
            LIMIT 5
        `, [searchTerm]);

        roomRes.rows.forEach(row => {
            results.push({
                id: row.id,
                type: 'room',
                title: `Room ${row.room_number}`,
                subtitle: `Status: ${row.status}`,
                data: row
            });
        });

        // Search Complaints (Optional)
        const complaintRes = await query(`
             SELECT c.id, c.title, c.status 
             FROM complaints c
             WHERE c.title ILIKE $1
             LIMIT 5
        `, [searchTerm]);

        complaintRes.rows.forEach(row => {
            results.push({
                id: row.id,
                type: 'complaint',
                title: row.title,
                subtitle: `Status: ${row.status}`,
                data: row
            });
        });

        res.json(results);

    } catch (error) {
        console.error('Search Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
