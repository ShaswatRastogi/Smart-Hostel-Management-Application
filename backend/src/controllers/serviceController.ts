import { Request, Response } from 'express';
import { query } from '../config/db';

// --- Complaints ---
export const getMyComplaints = async (req: Request, res: Response) => {
    try {
        const studentRes = await query('SELECT id FROM students WHERE user_id = $1', [req.currentUser?.id]);
        if (studentRes.rows.length === 0) {
            res.json([]); return;
        }
        const sId = studentRes.rows[0].id;

        const result = await query('SELECT * FROM complaints WHERE student_id = $1 ORDER BY created_at DESC', [sId]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const createComplaint = async (req: Request, res: Response) => {
    try {
        const { title, description, category } = req.body;
        const studentRes = await query('SELECT id FROM students WHERE user_id = $1', [req.currentUser?.id]);
        if (studentRes.rows.length === 0) {
            res.status(404).json({ error: 'Student profile not found' }); return;
        }
        const sId = studentRes.rows[0].id;

        await query(
            'INSERT INTO complaints (student_id, title, description, category, status) VALUES ($1, $2, $3, $4, $5)',
            [sId, title, description, category, 'pending']
        );
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// --- Payments ---
export const getMyPayments = async (req: Request, res: Response) => {
    try {
        const studentRes = await query('SELECT id FROM students WHERE user_id = $1', [req.currentUser?.id]);
        if (studentRes.rows.length === 0) {
            res.json([]); return;
        }
        const sId = studentRes.rows[0].id;

        const result = await query('SELECT * FROM payments WHERE student_id = $1 ORDER BY created_at DESC', [sId]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const verifyPayment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { transactionId, status } = req.body; // status optional, defaults to paid_unverified if verifying via student

        let newStatus = 'paid_unverified';
        if (status) newStatus = status; // Admin verify uses 'verified'

        await query(
            'UPDATE payments SET status = $1, paid_at = NOW(), transaction_id = $2 WHERE id = $3',
            [newStatus, transactionId, id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const createPaymentRequest = async (req: Request, res: Response) => {
    try {
        const { studentId, amount, type, dueDate, remarks } = req.body;
        await query(
            'INSERT INTO payments (student_id, amount, purpose, due_date, status) VALUES ($1, $2, $3, $4, $5)',
            [studentId, amount, type, dueDate, 'pending']
        );
        res.json({ success: true });
    } catch (error) {
        console.error("Create Payment Request Error:", error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const recordPayment = async (req: Request, res: Response) => {
    try {
        const { studentId, amount, type, method, remarks } = req.body;
        const result = await query(
            'INSERT INTO payments (student_id, amount, purpose, status, paid_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id',
            [studentId, amount, type, 'verified']
        );
        res.json({ id: result.rows[0].id });
    } catch (error) {
        console.error("Record Payment Error:", error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getAllPayments = async (req: Request, res: Response) => {
    try {
        const result = await query(`
            SELECT p.*, u.full_name as studentName, s.roll_no 
            FROM payments p
            JOIN students s ON p.student_id = s.id
            JOIN users u ON s.user_id = u.id
            ORDER BY p.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error("Get All Payments Error:", error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const deletePayment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM payments WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error("Delete Payment Error:", error);
        res.status(500).json({ error: 'Server error' });
    }
};

// --- Laundry ---
export const getLaundryRequests = async (req: Request, res: Response) => {
    try {
        const studentRes = await query('SELECT id FROM students WHERE user_id = $1', [req.currentUser?.id]);
        if (studentRes.rows.length === 0) {
            res.json([]); return;
        }
        const sId = studentRes.rows[0].id;

        const result = await query('SELECT * FROM laundry_requests WHERE student_id = $1 ORDER BY created_at DESC', [sId]);

        const mappedRequests = result.rows.map(row => ({
            id: row.id,
            clothesDetails: row.notes,
            totalClothes: row.items_count,
            status: row.status,
            createdAt: row.created_at
        }));

        res.json(mappedRequests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const createLaundryRequest = async (req: Request, res: Response) => {
    try {
        const { pickupDate, itemsCount, notes } = req.body;
        const studentRes = await query('SELECT id FROM students WHERE user_id = $1', [req.currentUser?.id]);
        if (studentRes.rows.length === 0) {
            res.status(404).json({ error: 'Student profile not found' }); return;
        }
        const sId = studentRes.rows[0].id;

        await query(
            'INSERT INTO laundry_requests (student_id, pickup_date, items_count, notes, status) VALUES ($1, $2, $3, $4, $5)',
            [sId, pickupDate, itemsCount, notes, 'pending']
        );
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
}

// --- Leave Requests ---
export const getLeaveRequests = async (req: Request, res: Response) => {
    try {
        const studentRes = await query('SELECT id FROM students WHERE user_id = $1', [req.currentUser?.id]);
        if (studentRes.rows.length === 0) {
            res.json([]); return;
        }
        const sId = studentRes.rows[0].id;

        const result = await query('SELECT * FROM leave_requests WHERE student_id = $1 ORDER BY created_at DESC', [sId]);

        const mappedLeaves = result.rows.map(row => {
            const start = new Date(row.start_date);
            const end = new Date(row.end_date);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            return {
                id: row.id,
                studentId: row.student_id,
                startDate: row.start_date,
                endDate: row.end_date,
                reason: row.reason,
                status: row.status,
                days: days,
                createdAt: row.created_at
            };
        });

        res.json(mappedLeaves);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const createLeaveRequest = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, reason } = req.body;
        const studentRes = await query('SELECT id FROM students WHERE user_id = $1', [req.currentUser?.id]);
        if (studentRes.rows.length === 0) {
            res.status(404).json({ error: 'Student profile not found' }); return;
        }
        const sId = studentRes.rows[0].id;

        await query(
            'INSERT INTO leave_requests (student_id, start_date, end_date, reason, status) VALUES ($1, $2, $3, $4, $5)',
            [sId, startDate, endDate, reason, 'pending']
        );
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
}

// --- Admin Laundry ---
export const getAllLaundryRequests = async (req: Request, res: Response) => {
    try {
        const result = await query(`
            SELECT lr.*, u.full_name as studentName, r.room_number as roomNo 
            FROM laundry_requests lr
            JOIN students s ON lr.student_id = s.id
            JOIN users u ON s.user_id = u.id
            LEFT JOIN room_allocations ra ON s.id = ra.student_id AND ra.is_active = true
            LEFT JOIN rooms r ON ra.room_id = r.id
            ORDER BY lr.created_at DESC
        `);

        const keyMap = result.rows.map(row => ({
            id: row.id,
            roomNo: row.roomno || 'N/A',
            studentName: row.studentname,
            clothesDetails: row.notes || 'No details',
            totalClothes: row.items_count,
            status: row.status,
            createdAt: row.created_at
        }));

        res.json(keyMap);
    } catch (error) {
        console.error('Get All Laundry Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getLaundrySettings = async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT * FROM laundry_settings LIMIT 1');
        if (result.rows.length === 0) {
            // Should verify script ran, but fallback safe
            res.json({
                pickupDay: 'Monday', pickupTime: '09:00', pickupPeriod: 'AM',
                dropoffDay: 'Wednesday', dropoffTime: '05:00', dropoffPeriod: 'PM',
                status: 'On Schedule', message: 'Regular service available',
            });
            return;
        }
        const row = result.rows[0];
        res.json({
            pickupDay: row.pickup_day,
            pickupTime: row.pickup_time,
            pickupPeriod: row.pickup_period,
            dropoffDay: row.dropoff_day,
            dropoffTime: row.dropoff_time,
            dropoffPeriod: row.dropoff_period,
            status: row.status,
            message: row.message,
            lastUpdated: row.updated_at
        });
    } catch (error) {
        console.error('Get Laundry Settings Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const updateLaundrySettings = async (req: Request, res: Response) => {
    try {
        const { pickupDay, pickupTime, pickupPeriod, dropoffDay, dropoffTime, dropoffPeriod, status, message } = req.body;

        const check = await query('SELECT id FROM laundry_settings LIMIT 1');

        if (check.rows.length === 0) {
            await query(`
                INSERT INTO laundry_settings 
                (pickup_day, pickup_time, pickup_period, dropoff_day, dropoff_time, dropoff_period, status, message)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [pickupDay, pickupTime, pickupPeriod, dropoffDay, dropoffTime, dropoffPeriod, status, message]);
        } else {
            await query(`
                UPDATE laundry_settings 
                SET pickup_day=$1, pickup_time=$2, pickup_period=$3, 
                    dropoff_day=$4, dropoff_time=$5, dropoff_period=$6, 
                    status=$7, message=$8, updated_at=NOW()
                 WHERE id = ${check.rows[0].id}
            `, [pickupDay, pickupTime, pickupPeriod, dropoffDay, dropoffTime, dropoffPeriod, status, message]);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Update Laundry Settings Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// --- Service Requests (New) ---
export const createServiceRequest = async (req: Request, res: Response) => {
    try {
        const { serviceType, description } = req.body;
        const studentRes = await query('SELECT id FROM students WHERE user_id = $1', [req.currentUser?.id]);
        if (studentRes.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
        const sId = studentRes.rows[0].id;

        await query(
            'INSERT INTO service_requests (student_id, service_type, description) VALUES ($1, $2, $3)',
            [sId, serviceType, description]
        );
        res.json({ success: true });
    } catch (error) {
        console.error("Create Service Error:", error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getServiceRequests = async (req: Request, res: Response) => {
    try {
        const studentRes = await query('SELECT id FROM students WHERE user_id = $1', [req.currentUser?.id]);
        if (studentRes.rows.length === 0) return res.json([]);

        const result = await query(
            'SELECT * FROM service_requests WHERE student_id = $1 ORDER BY created_at DESC',
            [studentRes.rows[0].id]
        );
        res.json(result.rows.map(row => ({
            id: row.id,
            serviceType: row.service_type,
            description: row.description,
            status: row.status,
            estimatedTime: row.estimated_time,
            adminNote: row.admin_note,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        })));
    } catch (error) {
        console.error("Get Service Error:", error);
        res.status(500).json({ error: 'Server error' });
    }
};

// ...
export const getAllServiceRequests = async (req: Request, res: Response) => { // Admin
    // ... (existing code)
    try {
        const result = await query(`
            SELECT sr.*, u.full_name, r.room_number as roomNo 
            FROM service_requests sr
            JOIN students s ON sr.student_id = s.id
            JOIN users u ON s.user_id = u.id
            LEFT JOIN room_allocations ra ON s.id = ra.student_id AND ra.is_active = true
            LEFT JOIN rooms r ON ra.room_id = r.id
            ORDER BY sr.created_at DESC
        `);
        res.json(result.rows.map(row => ({
            id: row.id,
            studentName: row.full_name,
            roomNo: row.roomno || 'N/A',
            serviceType: row.service_type,
            description: row.description,
            status: row.status,
            estimatedTime: row.estimated_time,
            adminNote: row.admin_note,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        })));
    } catch (error) {
        console.error("Get All Service Error:", error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getPaymentsByStudentId = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // student_id OR email

        let queryParam = id;
        let whereClause = 'p.student_id = $1';

        // Check if id looks like an email
        if (id.includes('@')) {
            const studentRes = await query(`
                SELECT s.id FROM students s
                JOIN users u ON s.user_id = u.id
                WHERE u.email = $1
             `, [id]);

            if (studentRes.rows.length === 0) {
                res.status(404).json({ error: 'Student found via email' });
                return;
            }
            queryParam = studentRes.rows[0].id;
        }

        const result = await query(`
            SELECT p.*, u.full_name as studentName, s.roll_no 
            FROM payments p
            JOIN students s ON p.student_id = s.id
            JOIN users u ON s.user_id = u.id
            WHERE p.student_id = $1 
            ORDER BY p.created_at DESC
        `, [queryParam]);
        res.json(result.rows);
    } catch (error) {
        console.error("Get Student Payments Error:", error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const updateServiceRequestStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, estimatedTime, adminNote } = req.body;
        await query(
            'UPDATE service_requests SET status = $1, estimated_time = $2, admin_note = $3, updated_at = NOW() WHERE id = $4',
            [status, estimatedTime, adminNote, id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error("Update Service Status Error:", error);
        res.status(500).json({ error: 'Server error' });
    }
};

// --- Missing Admin Endpoints ---

// Leaves - Admin
// --- Leaves - Admin ---
export const getAllLeaves = async (req: Request, res: Response) => {
    try {
        const result = await query(`
            SELECT lr.*, u.full_name, u.email, r.room_number, s.profile_photo 
            FROM leave_requests lr
            JOIN students s ON lr.student_id = s.id
            JOIN users u ON s.user_id = u.id
            LEFT JOIN room_allocations ra ON s.id = ra.student_id AND ra.is_active = true
            LEFT JOIN rooms r ON ra.room_id = r.id
            ORDER BY lr.created_at DESC
        `);
        res.json(result.rows.map(row => {
            const start = new Date(row.start_date);
            const end = new Date(row.end_date);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            return {
                id: row.id,
                studentName: row.full_name,
                studentEmail: row.email,
                studentRoom: row.room_number || 'N/A',
                studentProfilePhoto: row.profile_photo,
                startDate: row.start_date,
                endDate: row.end_date,
                reason: row.reason,
                days: days,
                status: row.status,
                createdAt: row.created_at
            };
        }));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const updateLeaveStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await query('UPDATE leave_requests SET status = $1 WHERE id = $2', [status, id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// --- Complaints - Admin ---
export const getAllComplaints = async (req: Request, res: Response) => {
    try {
        const result = await query(`
            SELECT c.*, u.full_name, u.email, s.profile_photo 
            FROM complaints c
            JOIN students s ON c.student_id = s.id
            JOIN users u ON s.user_id = u.id
            ORDER BY c.created_at DESC
        `);
        res.json(result.rows.map(row => ({
            id: row.id,
            title: row.title,
            description: row.description,
            priority: row.priority,
            status: row.status,
            category: row.category,
            studentName: row.full_name,
            studentEmail: row.email,
            studentProfilePhoto: row.profile_photo,
            createdAt: row.created_at
        })));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const updateComplaintStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await query('UPDATE complaints SET status = $1 WHERE id = $2', [status, id]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
