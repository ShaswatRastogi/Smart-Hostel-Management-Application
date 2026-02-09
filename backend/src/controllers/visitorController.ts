import { Request, Response } from 'express';
import { query } from '../config/db';

// Student: Register a new visitor
export const registerVisitor = async (req: Request, res: Response) => {
    const userId = req.currentUser?.id;

    try {
        // Get student ID from user ID
        const studentResult = await query(
            'SELECT id, roll_no FROM students WHERE user_id = $1',
            [userId]
        );

        if (studentResult.rows.length === 0) {
            res.status(404).json({ error: 'Student profile not found' });
            return;
        }

        const studentId = studentResult.rows[0].id;

        // Get student's room number
        const roomResult = await query(
            `SELECT r.room_number 
             FROM room_allocations ra 
             JOIN rooms r ON ra.room_id = r.id 
             WHERE ra.student_id = $1 AND ra.is_active = true`,
            [studentId]
        );

        const roomNumber = roomResult.rows.length > 0 ? roomResult.rows[0].room_number : 'N/A';

        const {
            visitorName,
            visitorPhone,
            visitorRelation,
            purpose,
            expectedDate,
            expectedTimeIn,
            expectedTimeOut,
            visitorPhoto,
            idProofType,
            idProofNumber
        } = req.body;

        // Validate required fields
        if (!visitorName || !visitorPhone || !purpose || !expectedDate) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        // Insert visitor
        const result = await query(
            `INSERT INTO visitors (
                student_id, visitor_name, visitor_phone, visitor_relation, 
                purpose, room_number, expected_date, expected_time_in, expected_time_out,
                visitor_photo, id_proof_type, id_proof_number, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending')
            RETURNING *`,
            [
                studentId, visitorName, visitorPhone, visitorRelation,
                purpose, roomNumber, expectedDate, expectedTimeIn, expectedTimeOut,
                visitorPhoto, idProofType, idProofNumber
            ]
        );

        res.status(201).json({
            message: 'Visitor registered successfully. Waiting for admin approval.',
            visitor: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error registering visitor:', error);
        res.status(500).json({ error: 'Failed to register visitor' });
    }
};

// Student: Get my visitors
export const getMyVisitors = async (req: Request, res: Response) => {
    const userId = req.currentUser?.id;

    try {
        const studentResult = await query(
            'SELECT id FROM students WHERE user_id = $1',
            [userId]
        );

        if (studentResult.rows.length === 0) {
            res.status(404).json({ error: 'Student profile not found' });
            return;
        }

        const studentId = studentResult.rows[0].id;

        const result = await query(
            `SELECT v.*, 
                    u.full_name as approved_by_name
             FROM visitors v
             LEFT JOIN users u ON v.approved_by = u.id
             WHERE v.student_id = $1
             ORDER BY v.created_at DESC`,
            [studentId]
        );

        res.json(result.rows);
    } catch (error: any) {
        console.error('Error fetching visitors:', error);
        res.status(500).json({ error: 'Failed to fetch visitors' });
    }
};

// Student: Get visitor by ID
export const getVisitorById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.currentUser?.id;

    try {
        const studentResult = await query(
            'SELECT id FROM students WHERE user_id = $1',
            [userId]
        );

        if (studentResult.rows.length === 0) {
            res.status(404).json({ error: 'Student profile not found' });
            return;
        }

        const studentId = studentResult.rows[0].id;

        const result = await query(
            `SELECT v.*, 
                    s.roll_no, 
                    u.full_name as student_name,
                    approver.full_name as approved_by_name
             FROM visitors v
             JOIN students s ON v.student_id = s.id
             JOIN users u ON s.user_id = u.id
             LEFT JOIN users approver ON v.approved_by = approver.id
             WHERE v.id = $1 AND v.student_id = $2`,
            [id, studentId]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Visitor not found' });
            return;
        }

        res.json(result.rows[0]);
    } catch (error: any) {
        console.error('Error fetching visitor:', error);
        res.status(500).json({ error: 'Failed to fetch visitor' });
    }
};

// Student: Cancel visitor request
export const cancelVisitor = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.currentUser?.id;

    try {
        const studentResult = await query(
            'SELECT id FROM students WHERE user_id = $1',
            [userId]
        );

        if (studentResult.rows.length === 0) {
            res.status(404).json({ error: 'Student profile not found' });
            return;
        }

        const studentId = studentResult.rows[0].id;

        // Check if visitor exists and belongs to student
        const visitorResult = await query(
            'SELECT status FROM visitors WHERE id = $1 AND student_id = $2',
            [id, studentId]
        );

        if (visitorResult.rows.length === 0) {
            res.status(404).json({ error: 'Visitor not found' });
            return;
        }

        const currentStatus = visitorResult.rows[0].status;

        // Can only cancel pending or approved visitors
        if (currentStatus !== 'pending' && currentStatus !== 'approved') {
            res.status(400).json({ error: `Cannot cancel visitor with status: ${currentStatus}` });
            return;
        }

        await query(
            'UPDATE visitors SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            ['cancelled', id]
        );

        res.json({ message: 'Visitor request cancelled successfully' });
    } catch (error: any) {
        console.error('Error cancelling visitor:', error);
        res.status(500).json({ error: 'Failed to cancel visitor' });
    }
};

// Admin: Get pending visitors
export const getPendingVisitors = async (req: Request, res: Response) => {
    try {
        const result = await query(
            `SELECT v.*, 
                    s.roll_no, 
                    u.full_name as student_name,
                    u.email as student_email
             FROM visitors v
             JOIN students s ON v.student_id = s.id
             JOIN users u ON s.user_id = u.id
             WHERE v.status = 'pending'
             ORDER BY v.created_at ASC`
        );

        res.json(result.rows);
    } catch (error: any) {
        console.error('Error fetching pending visitors:', error);
        res.status(500).json({ error: 'Failed to fetch pending visitors' });
    }
};

// Admin: Get active (checked-in) visitors
export const getActiveVisitors = async (req: Request, res: Response) => {
    try {
        const result = await query(
            `SELECT v.*, 
                    s.roll_no, 
                    u.full_name as student_name
             FROM visitors v
             JOIN students s ON v.student_id = s.id
             JOIN users u ON s.user_id = u.id
             WHERE v.status = 'checked_in'
             ORDER BY v.checked_in_at DESC`
        );

        res.json(result.rows);
    } catch (error: any) {
        console.error('Error fetching active visitors:', error);
        res.status(500).json({ error: 'Failed to fetch active visitors' });
    }
};

// Admin: Get all visitors with filters
export const getAllVisitors = async (req: Request, res: Response) => {
    try {
        const { status, startDate, endDate, studentId } = req.query;

        let queryText = `
            SELECT v.*, 
                   s.roll_no, 
                   u.full_name as student_name,
                   approver.full_name as approved_by_name
            FROM visitors v
            JOIN students s ON v.student_id = s.id
            JOIN users u ON s.user_id = u.id
            LEFT JOIN users approver ON v.approved_by = approver.id
            WHERE 1=1
        `;

        const params: any[] = [];
        let paramCount = 1;

        if (status) {
            queryText += ` AND v.status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }

        if (startDate) {
            queryText += ` AND v.expected_date >= $${paramCount}`;
            params.push(startDate);
            paramCount++;
        }

        if (endDate) {
            queryText += ` AND v.expected_date <= $${paramCount}`;
            params.push(endDate);
            paramCount++;
        }

        if (studentId) {
            queryText += ` AND v.student_id = $${paramCount}`;
            params.push(studentId);
            paramCount++;
        }

        queryText += ' ORDER BY v.created_at DESC';

        const result = await query(queryText, params);

        res.json(result.rows);
    } catch (error: any) {
        console.error('Error fetching all visitors:', error);
        res.status(500).json({ error: 'Failed to fetch visitors' });
    }
};

// Admin: Approve visitor
export const approveVisitor = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.currentUser?.id;
    const { remarks } = req.body;

    try {
        // Generate QR code data (simple format: visitor_id_timestamp)
        const qrCode = `VISITOR_${id}_${Date.now()}`;

        const result = await query(
            `UPDATE visitors 
             SET status = 'approved', 
                 approved_by = $1, 
                 approved_at = CURRENT_TIMESTAMP,
                 admin_remarks = $2,
                 qr_code = $3,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4 AND status = 'pending'
             RETURNING *`,
            [userId, remarks, qrCode, id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Visitor not found or already processed' });
            return;
        }

        // TODO: Send notification to student

        res.json({
            message: 'Visitor approved successfully',
            visitor: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error approving visitor:', error);
        res.status(500).json({ error: 'Failed to approve visitor' });
    }
};

// Admin: Reject visitor
export const rejectVisitor = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.currentUser?.id;
    const { remarks } = req.body;

    try {
        if (!remarks) {
            res.status(400).json({ error: 'Rejection reason is required' });
            return;
        }

        const result = await query(
            `UPDATE visitors 
             SET status = 'rejected', 
                 approved_by = $1, 
                 approved_at = CURRENT_TIMESTAMP,
                 admin_remarks = $2,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3 AND status = 'pending'
             RETURNING *`,
            [userId, remarks, id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Visitor not found or already processed' });
            return;
        }

        // TODO: Send notification to student

        res.json({
            message: 'Visitor rejected',
            visitor: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error rejecting visitor:', error);
        res.status(500).json({ error: 'Failed to reject visitor' });
    }
};

// Admin/Security: Check-in visitor
export const checkInVisitor = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const result = await query(
            `UPDATE visitors 
             SET status = 'checked_in', 
                 checked_in_at = CURRENT_TIMESTAMP,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND status = 'approved'
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Visitor not found or not approved' });
            return;
        }

        // TODO: Send notification to student

        res.json({
            message: 'Visitor checked in successfully',
            visitor: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error checking in visitor:', error);
        res.status(500).json({ error: 'Failed to check in visitor' });
    }
};

// Admin/Security: Check-out visitor
export const checkOutVisitor = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const result = await query(
            `UPDATE visitors 
             SET status = 'checked_out', 
                 checked_out_at = CURRENT_TIMESTAMP,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND status = 'checked_in'
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Visitor not found or not checked in' });
            return;
        }

        // TODO: Send notification to student

        res.json({
            message: 'Visitor checked out successfully',
            visitor: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error checking out visitor:', error);
        res.status(500).json({ error: 'Failed to check out visitor' });
    }
};

// Verify QR code
export const verifyQRCode = async (req: Request, res: Response) => {
    const { qrCode } = req.params;

    try {
        const result = await query(
            `SELECT v.*, 
                    s.roll_no, 
                    u.full_name as student_name
             FROM visitors v
             JOIN students s ON v.student_id = s.id
             JOIN users u ON s.user_id = u.id
             WHERE v.qr_code = $1`,
            [qrCode]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Invalid QR code' });
            return;
        }

        const visitor = result.rows[0];

        // Check if visitor is approved and not expired
        if (visitor.status !== 'approved' && visitor.status !== 'checked_in') {
            res.status(400).json({ error: `Visitor status is ${visitor.status}` });
            return;
        }

        res.json({
            valid: true,
            visitor: visitor
        });
    } catch (error: any) {
        console.error('Error verifying QR code:', error);
        res.status(500).json({ error: 'Failed to verify QR code' });
    }
};
