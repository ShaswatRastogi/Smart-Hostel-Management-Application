
import { Request, Response } from 'express';
import { pool } from '../config/db';

interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        email: string;
        role: string;
    };
}

// Mark Attendance (or update)
export const markAttendance = async (req: Request, res: Response) => {
    // @ts-ignore
    const user = req.currentUser || req.user;
    try {
        const studentId = user?.id; // Assuming student is logged in
        const { date, meal, status } = req.body;

        if (!studentId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!date || !meal || !['breakfast', 'lunch', 'snacks', 'dinner'].includes(meal) || !['going', 'skipping'].includes(status)) {
            return res.status(400).json({ message: 'Invalid data' });
        }

        // Upsert logic (PostgreSQL)
        const query = `
            INSERT INTO mess_attendance (student_id, date, meal, status)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (student_id, date, meal)
            DO UPDATE SET status = EXCLUDED.status, created_at = CURRENT_TIMESTAMP
            RETURNING id, student_id, to_char(date, 'YYYY-MM-DD') as date, meal, status, created_at;
        `;

        const result = await pool.query(query, [studentId, date, meal, status]);
        res.json(result.rows[0]);

    } catch (error) {
        console.error('Error marking attendance:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get My Attendance (for a date range or specific dates)
export const getMyAttendance = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const user = req.currentUser || req.user;
        const studentId = user?.id;
        const { startDate, endDate } = req.query;

        if (!studentId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        let query = `SELECT id, student_id, to_char(date, 'YYYY-MM-DD') as date, meal, status, created_at FROM mess_attendance WHERE student_id = $1`;
        const params: any[] = [studentId];

        if (startDate && endDate) {
            query += ` AND date BETWEEN $2 AND $3`;
            params.push(startDate, endDate);
        }

        // Order by date descending
        query += ` ORDER BY date DESC, meal ASC`;

        const result = await pool.query(query, params);
        res.json(result.rows);

    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get Mess Stats (Admin Only)
export const getMessStats = async (req: Request, res: Response) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ message: 'Date is required' });
        }

        // Aggregate counts
        const query = `
            SELECT meal, status, COUNT(*) as count
            FROM mess_attendance
            WHERE date = $1
            GROUP BY meal, status
        `;

        const result = await pool.query(query, [date]);

        // Transform into a cleaner object
        const stats: any = {
            breakfast: { going: 0, skipping: 0 },
            lunch: { going: 0, skipping: 0 },
            snacks: { going: 0, skipping: 0 },
            dinner: { going: 0, skipping: 0 }
        };

        result.rows.forEach(row => {
            if (stats[row.meal]) {
                stats[row.meal][row.status] = parseInt(row.count);
            }
        });

        res.json(stats);

    } catch (error) {
        console.error('Error fetching mess stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
