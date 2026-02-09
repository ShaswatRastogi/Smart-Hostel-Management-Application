
import { Request, Response } from 'express';
import { query } from '../config/db';

export const markAttendance = async (req: Request, res: Response) => {
    // Note: removed useless 'BEGIN' query as we are using auto-commit pool queries
    try {
        const { date, updates } = req.body;
        // updates: { studentId: number, status: string }[]

        if (!date || !Array.isArray(updates)) {
            return res.status(400).json({ error: 'Invalid payload' });
        }

        // Upsert logic
        for (const update of updates) {
            if (update.status === 'clear') {
                await query(
                    `DELETE FROM attendance WHERE student_id = $1 AND date = $2::DATE`,
                    [update.studentId, date]
                );
            } else {
                await query(
                    `INSERT INTO attendance (student_id, date, status)
                 VALUES ($1, $2::DATE, $3)
                 ON CONFLICT (student_id, date) 
                 DO UPDATE SET status = $3, created_at = NOW()`,
                    [update.studentId, date, update.status]
                );
            }
        }

        res.json({ message: 'Attendance updated successfully' });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'Failed to mark attendance' });
    }
};

export const getDailyAttendance = async (req: Request, res: Response) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ error: 'Date is required' });

        const result = await query(
            `SELECT 
                s.id as "studentId", 
                u.full_name as "name", 
                r.room_number as "room", 
                s.profile_photo as "profilePhoto",
                a.status 
             FROM students s
             JOIN users u ON s.user_id = u.id
             LEFT JOIN room_allocations ra ON s.id = ra.student_id AND ra.is_active = true
             LEFT JOIN rooms r ON ra.room_id = r.id
             LEFT JOIN attendance a ON s.id = a.student_id AND a.date = $1::DATE
             WHERE s.status = 'active'
             ORDER BY r.room_number ASC, u.full_name ASC`,
            [date]
        );

        res.json(result.rows);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
};

export const getAttendanceStats = async (req: Request, res: Response) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ error: 'Date is required' });

        // Stats for the specific date
        // Note: This only counts marked records. Unmarked students (if any) are not counted as 'absent' here unless we query students table too.
        // Better: Count total students, and count specific statuses.

        const totalStudentsRes = await query(`SELECT COUNT(*) as total FROM students WHERE status = 'active'`);
        const statsRes = await query(
            `SELECT status, COUNT(*) as count FROM attendance WHERE date = $1 GROUP BY status`,
            [date]
        );

        const total = parseInt(totalStudentsRes.rows[0].total);
        const stats: any = { present: 0, absent: 0, late: 0, leave: 0 };

        let markedCount = 0;
        statsRes.rows.forEach(row => {
            stats[row.status] = parseInt(row.count);
            markedCount += parseInt(row.count);
        });

        // Implicitly absent/unmarked? Or just report what we have.
        // Let's just report what we have. UI can interpret difference as "Not Marked".

        res.json({ total, ...stats, marked: markedCount });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};

export const getStudentHistory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await query(
            `SELECT TO_CHAR(date, 'YYYY-MM-DD') as date, status FROM attendance WHERE student_id = $1 ORDER BY date DESC`,
            [id]
        );

        // Calculate aggregate
        const totalDays = result.rows.length;
        const presentDays = result.rows.filter(r => r.status === 'present' || r.status === 'late').length; // Assuming Late counts as present-ish? Or strictly Present.
        // Let's count strictly Present + Late (maybe 0.5?) -> For simplicity: Status breakdown

        const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

        res.json({
            history: result.rows,
            stats: {
                totalDays,
                presentDays,
                percentage
            }
        });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch student history' });
    }
};
