import { Request, Response } from 'express';
import { query } from '../config/db';
import { sendPushNotification, getUserToken } from '../services/pushService';

// --- Dashboard Stats ---
export const getGuardStats = async (req: Request, res: Response) => {
    try {
        const inCampusRes = await query(`SELECT COUNT(*) FROM students WHERE campus_status = 'in_campus'`);
        const outCampusRes = await query(`SELECT COUNT(*) FROM students WHERE campus_status = 'out_campus'`);
        const visitorsRes = await query(`SELECT COUNT(*) FROM visitors WHERE status IN ('pending', 'approved', 'checked_in') AND DATE(expected_date) = CURRENT_DATE`);

        res.json({
            inCampus: parseInt(inCampusRes.rows[0].count),
            outCampus: parseInt(outCampusRes.rows[0].count),
            visitorsToday: parseInt(visitorsRes.rows[0].count)
        });
    } catch (error) {
        console.error("Error fetching guard stats:", error);
        res.status(500).json({ error: 'Server error' });
    }
};

// --- Clock In / Out (Manual) ---
export const clockStudent = async (req: Request, res: Response) => {
    try {
        const { studentId, movementType } = req.body; // 'in' or 'out'
        const guardId = req.currentUser?.id;

        if (movementType !== 'in' && movementType !== 'out') {
            res.status(400).json({ error: 'Invalid movement type' });
            return;
        }

        const campusStatus = movementType === 'in' ? 'in_campus' : 'out_campus';

        // 1. Update Student status
        await query('UPDATE students SET campus_status = $1 WHERE id = $2', [campusStatus, studentId]);

        // 2. Log movement
        if (movementType === 'out') {
            await query(
                'INSERT INTO student_movements (student_id, recorded_by_out) VALUES ($1, $2)',
                [studentId, guardId]
            );
        } else {
            // Clock In: Find the most recent active "out" movement and close it
            await query(`
                UPDATE student_movements 
                SET in_time = NOW(), 
                    recorded_by_in = $2,
                    duration_minutes = EXTRACT(EPOCH FROM (NOW() - out_time)) / 60
                WHERE id = (
                    SELECT id FROM student_movements 
                    WHERE student_id = $1 AND in_time IS NULL 
                    ORDER BY out_time DESC LIMIT 1
                )
            `, [studentId, guardId]);
        }

        // 3. Optional: Notify student
        try {
            const studentUserRes = await query(
                'SELECT u.id, u.full_name FROM users u JOIN students s ON s.user_id = u.id WHERE s.id = $1', [studentId]
            );
            if (studentUserRes.rows.length > 0) {
                const tokens = await getUserToken(studentUserRes.rows[0].id, 'general');
                const timeString = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                sendPushNotification(
                    tokens,
                    movementType === 'in' ? '🏫 Campus Entry' : '🚪 Campus Exit',
                    `You were logged as moving ${movementType} at ${timeString}.`,
                    { type: 'movement', studentId }
                );
            }
        } catch (pushErr) {
            console.error("Failed to send push notification:", pushErr);
        }

        res.json({ success: true, message: `Student marked as ${movementType.toUpperCase()}` });
    } catch (error) {
        console.error("Error clocking student:", error);
        res.status(500).json({ error: 'Server error' });
    }
};

// --- Verify Leave QR ---
export const verifyLeaveQR = async (req: Request, res: Response) => {
    try {
        const { qrCode } = req.params;
        const guardId = req.currentUser?.id;

        const leaveRes = await query(`
            SELECT lr.*, s.id as student_id, s.roll_no, s.profile_photo, s.campus_status, u.full_name as student_name, r.room_number
            FROM leave_requests lr
            JOIN students s ON lr.student_id = s.id
            JOIN users u ON s.user_id = u.id
            LEFT JOIN room_allocations ra ON s.id = ra.student_id AND ra.is_active = true
            LEFT JOIN rooms r ON ra.room_id = r.id
            WHERE lr.qr_code = $1
        `, [qrCode]);

        if (leaveRes.rows.length === 0) {
            res.status(404).json({ error: 'Invalid QR code' });
            return;
        }

        const leave = leaveRes.rows[0];

        if (leave.status === 'completed') {
            res.status(400).json({ error: 'This leave request has already been completed.' });
            return;
        }

        if (leave.status !== 'approved' && leave.status !== 'active') {
            res.status(400).json({ error: `Leave request is ${leave.status}.` });
            return;
        }

        const isFirstScan = leave.status === 'approved';
        const nextMovementType = isFirstScan ? 'out' : 'in';
        const nextCampusStatus = isFirstScan ? 'out_campus' : 'in_campus';
        const nextLeaveStatus = isFirstScan ? 'active' : 'completed';

        // Update student campus status
        await query('UPDATE students SET campus_status = $1 WHERE id = $2', [nextCampusStatus, leave.student_id]);
        
        // Update leave request status
        await query('UPDATE leave_requests SET status = $1 WHERE id = $2', [nextLeaveStatus, leave.id]);

        // Log movement
        if (nextMovementType === 'out') {
            await query(
                'INSERT INTO student_movements (student_id, recorded_by_out) VALUES ($1, $2)',
                [leave.student_id, guardId]
            );
        } else {
            await query(`
                UPDATE student_movements 
                SET in_time = NOW(), 
                    recorded_by_in = $2,
                    duration_minutes = EXTRACT(EPOCH FROM (NOW() - out_time)) / 60
                WHERE id = (
                    SELECT id FROM student_movements 
                    WHERE student_id = $1 AND in_time IS NULL 
                    ORDER BY out_time DESC LIMIT 1
                )
            `, [leave.student_id, guardId]);
        }

        res.json({
            success: true,
            message: `Student ${leave.student_name} marked as ${nextMovementType.toUpperCase()}`,
            movement: nextMovementType,
            leaveDetails: {
                studentName: leave.student_name,
                roomNo: leave.room_number || 'N/A',
                startDate: leave.start_date,
                endDate: leave.end_date,
                reason: leave.reason,
                profilePhoto: leave.profile_photo
            }
        });

    } catch (error) {
        console.error("Error verifying leave QR:", error);
        res.status(500).json({ error: 'Server error' });
    }
};

// --- Get Students for Search ---
export const searchStudents = async (req: Request, res: Response) => {
    try {
        const { q } = req.query;
        let queryStr = `
            SELECT s.id, s.roll_no, s.campus_status, s.profile_photo, u.full_name, r.room_number
            FROM students s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN room_allocations ra ON s.id = ra.student_id AND ra.is_active = true
            LEFT JOIN rooms r ON ra.room_id = r.id
        `;
        
        let params: any[] = [];
        if (q && typeof q === 'string' && q.trim().length > 0) {
            queryStr += ` WHERE u.full_name ILIKE $1 OR s.roll_no ILIKE $1`;
            params.push(`%${q}%`);
        }
        
        queryStr += ` ORDER BY u.full_name ASC LIMIT 50`;

        const result = await query(queryStr, params);
        res.json(result.rows);
    } catch (error) {
        console.error("Error searching students:", error);
        res.status(500).json({ error: 'Server error' });
    }
};
