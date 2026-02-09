import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { query } from '../config/db';

// --- Student Self-Profile ---
export const getStudentProfile = async (req: Request, res: Response) => {
    const userId = req.currentUser?.id;

    try {
        const result = await query(
            `SELECT s.*, u.email as user_email, u.full_name,
            r.room_number, r.wifi_ssid, r.wifi_password
            FROM students s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN room_allocations ra ON s.id = ra.student_id AND ra.is_active = true
            LEFT JOIN rooms r ON ra.room_id = r.id
            WHERE u.id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            // Check if user exists but has no student profile (e.g. admin or new user)
            const userRes = await query('SELECT * FROM users WHERE id = $1', [userId]);
            if (userRes.rows.length > 0) {
                res.json({
                    fullName: userRes.rows[0].full_name,
                    email: userRes.rows[0].email,
                    role: userRes.rows[0].role
                });
                return;
            }
            res.status(404).json({ error: 'Profile not found' });
            return;
        }

        const data = result.rows[0];

        // Transform snake_case DB fields to camelCase for frontend
        const responseData = {
            id: data.id, // Added ID for reference
            fullName: data.full_name,
            roomNo: data.room_number || 'N/A',
            rollNo: data.roll_no,
            collegeName: data.college_name,
            hostelName: data.hostel_name,
            dob: data.dob,
            phone: data.phone,
            googleEmail: data.google_email,
            collegeEmail: data.college_email, // Added College Email
            status: data.status,
            dues: parseFloat(data.dues),
            wifiSSID: data.wifi_ssid,
            wifiPassword: data.wifi_password,
            email: data.user_email,
            address: data.address,
            fatherName: data.father_name,
            fatherPhone: data.father_phone,
            motherName: data.mother_name,
            motherPhone: data.mother_phone,
            bloodGroup: data.blood_group,
            medicalHistory: data.medical_history,
            emergencyContactName: data.emergency_contact_name,
            emergencyContactPhone: data.emergency_contact_phone,
            feeFrequency: data.fee_frequency || 'Monthly',
            profilePhoto: data.profile_photo,
            lastNotificationsClearedAt: parseInt(data.last_notifications_cleared_at || '0', 10),
            role: 'student'
        };

        res.json(responseData);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// --- Student: Update Profile Photo ---
export const updateStudentProfilePhoto = async (req: Request, res: Response) => {
    const userId = req.currentUser?.id;

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const profilePhoto = `/uploads/profiles/${req.file.filename}`;

        // Get student ID from user ID
        const studentRes = await query('SELECT id FROM students WHERE user_id = $1', [userId]);
        if (studentRes.rows.length === 0) {
            return res.status(404).json({ error: 'Student profile not found' });
        }

        await query('UPDATE students SET profile_photo = $1 WHERE user_id = $2', [profilePhoto, userId]);

        res.json({ success: true, profilePhoto });
    } catch (error) {
        console.error('Error updating profile photo:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// --- Student: Clear Notifications ---
export const clearNotifications = async (req: Request, res: Response) => {
    const userId = req.currentUser?.id;
    try {
        const now = Date.now();
        await query(
            'UPDATE students SET last_notifications_cleared_at = $1 WHERE user_id = $2',
            [now, userId]
        );
        res.json({ success: true, timestamp: now });
    } catch (error) {
        console.error('Error clearing notifications:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// --- Admin: Get All Students ---
export const getAllStudents = async (req: Request, res: Response) => {
    try {
        const result = await query(`
            SELECT s.*, u.email, u.full_name, r.room_number, r.wifi_ssid, r.wifi_password
            FROM students s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN room_allocations ra ON s.id = ra.student_id AND ra.is_active = true
            LEFT JOIN rooms r ON ra.room_id = r.id
            ORDER BY s.created_at DESC
        `);

        const students = result.rows.map(row => ({
            id: row.id,
            rollNo: row.roll_no,
            fullName: row.full_name,
            name: row.full_name, // Alias for frontend compatibility
            roomNo: row.room_number || 'N/A',
            room: row.room_number || 'N/A', // Alias for frontend compatibility
            email: row.email,
            phone: row.phone,
            status: row.status,
            dues: parseFloat(row.dues),
            createdAt: row.created_at,
            // Additional details for display
            collegeName: row.college_name,
            hostelName: row.hostel_name,
            dob: row.dob,
            address: row.address,
            googleEmail: row.google_email,
            collegeEmail: row.college_email, // Added College Email
            fatherName: row.father_name,
            fatherPhone: row.father_phone,
            motherName: row.mother_name,
            motherPhone: row.mother_phone,
            bloodGroup: row.blood_group,
            medicalHistory: row.medical_history,
            emergencyContactName: row.emergency_contact_name,
            emergencyContactPhone: row.emergency_contact_phone,
            feeFrequency: row.fee_frequency || 'Monthly',
            wifiSSID: row.wifi_ssid || 'N/A',
            wifiPassword: row.wifi_password || 'N/A',
            profilePhoto: row.profile_photo,
            password: row.password || '', // Plain text password for admin
            tempPassword: row.password || '' // Backwards compatibility
        }));

        res.json(students);
    } catch (error) {
        console.error("Error fetching all students:", error);
        res.status(500).json({ error: 'Server error' });
    }
};

// --- Admin: Get Student by ID ---
export const getStudentById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await query(`
            SELECT s.*, u.email, u.full_name, r.room_number, r.wifi_ssid, r.wifi_password
            FROM students s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN room_allocations ra ON s.id = ra.student_id AND ra.is_active = true
            LEFT JOIN rooms r ON ra.room_id = r.id
            WHERE s.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const row = result.rows[0];
        const student = {
            id: row.id,
            rollNo: row.roll_no,
            fullName: row.full_name,
            name: row.full_name,
            roomNo: row.room_number || 'N/A',
            room: row.room_number || 'N/A',
            email: row.email,
            phone: row.phone,
            status: row.status,
            dues: parseFloat(row.dues),
            createdAt: row.created_at,
            collegeName: row.college_name,
            hostelName: row.hostel_name,
            dob: row.dob,
            address: row.address,
            googleEmail: row.google_email,
            collegeEmail: row.college_email, // Added College Email
            fatherName: row.father_name,
            fatherPhone: row.father_phone,
            motherName: row.mother_name,
            motherPhone: row.mother_phone,
            bloodGroup: row.blood_group,
            medicalHistory: row.medical_history,
            emergencyContactName: row.emergency_contact_name,
            emergencyContactPhone: row.emergency_contact_phone,
            feeFrequency: row.fee_frequency || 'Monthly',
            wifiSSID: row.wifi_ssid || 'N/A',
            wifiPassword: row.wifi_password || 'N/A',
            profilePhoto: row.profile_photo,
        };

        res.json(student);
    } catch (error) {
        console.error("Error fetching student details:", error);
        res.status(500).json({ error: 'Server error' });
    }
};

// --- Admin: Create Student (Allotment) ---
export const createStudent = async (req: Request, res: Response) => {
    console.log('📸 createStudent called');
    console.log('Has file:', !!req.file);
    console.log('File details:', req.file ? { filename: req.file.filename, size: req.file.size } : 'No file');
    console.log('Body keys:', Object.keys(req.body));

    const client = await import('../config/db').then(m => m.pool.connect());
    try {
        await client.query('BEGIN');
        const {
            fullName, email, password, rollNo, collegeName, hostelName, dob,
            roomNo, phone, googleEmail, collegeEmail, address, fatherName, fatherPhone,
            motherName, motherPhone, dues, bloodGroup, medicalHistory,
            emergencyContactName, emergencyContactPhone, status, wifiSSID, wifiPassword, feeFrequency
        } = req.body;

        const profilePhoto = req.file ? `/uploads/profiles/${req.file.filename}` : null;
        console.log('Profile photo path:', profilePhoto);

        // 1. Create User
        // Check if user exists
        const userCheck = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            throw new Error(`User with email ${email} already exists`);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userRes = await client.query(
            'INSERT INTO users (email, full_name, role, password_hash) VALUES ($1, $2, $3, $4) RETURNING id',
            [email, fullName, 'student', hashedPassword]
        );
        const userId = userRes.rows[0].id;

        // 2. Create Student Profile
        const studentRes = await client.query(
            `INSERT INTO students (
                user_id, roll_no, college_name, hostel_name, dob, phone, google_email, college_email, address,
                father_name, father_phone, mother_name, mother_phone, blood_group, medical_history,
                emergency_contact_name, emergency_contact_phone, status, dues, fee_frequency, password, profile_photo
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
            ) RETURNING id`,
            [
                userId, rollNo, collegeName, hostelName, dob, phone, googleEmail, collegeEmail, address,
                fatherName, fatherPhone, motherName, motherPhone, bloodGroup, medicalHistory,
                emergencyContactName, emergencyContactPhone, status, dues || 0, feeFrequency || 'Monthly', password, profilePhoto
            ]
        );
        const studentId = studentRes.rows[0].id;

        // 3. Room Allocation
        if (roomNo) {
            // Check room exists or create? Assuming pre-seeded rooms, but let's handle upsert for robustness
            let roomId;
            const roomCheck = await client.query('SELECT id, status, capacity FROM rooms WHERE room_number = $1', [roomNo]);

            if (roomCheck.rows.length === 0) {
                // Create room if not exists
                const roomRes = await client.query(
                    'INSERT INTO rooms (room_number, status, wifi_ssid, wifi_password) VALUES ($1, $2, $3, $4) RETURNING id',
                    [roomNo, 'occupied', wifiSSID, wifiPassword]
                );
                roomId = roomRes.rows[0].id;
            } else {
                roomId = roomCheck.rows[0].id;
                // Ideally check capacity
            }

            // Create Allocation
            await client.query(
                'INSERT INTO room_allocations (student_id, room_id) VALUES ($1, $2)',
                [studentId, roomId]
            );

            // Update Room Status logic (simplified)
            await client.query("UPDATE rooms SET status = 'occupied' WHERE id = $1", [roomId]);
        }

        await client.query('COMMIT');
        res.json({ success: true, studentId });
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error("Error creating student:", error);
        res.status(400).json({ error: error.message });
    } finally {
        client.release();
    }
};

// --- Admin: Delete Student ---
export const deleteStudent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // Student ID

        // Use a transaction to delete user as well? 
        // Schema has ON DELETE CASCADE on students.user_id? No, students references users.
        // So deleting USERS deletes students (CASCADE).
        // But we likely get student ID here.

        // Find user_id first
        const sRes = await query('SELECT user_id FROM students WHERE id = $1', [id]);
        if (sRes.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
        const userId = sRes.rows[0].user_id;

        // Delete User (cascades to student, allocations, etc.)
        await query('DELETE FROM users WHERE id = $1', [userId]);

        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting student:", error);
        res.status(500).json({ error: 'Server error' });
    }
};

// --- Admin: Update Student ---
export const updateStudent = async (req: Request, res: Response) => {
    console.log('📸 updateStudent called');
    console.log('Has file:', !!req.file);
    console.log('File details:', req.file ? { filename: req.file.filename, size: req.file.size } : 'No file');
    console.log('Body keys:', Object.keys(req.body));

    const client = await import('../config/db').then(m => m.pool.connect());
    try {
        const { id } = req.params;
        console.log('Updating student ID:', id);

        await client.query('BEGIN');

        const {
            fullName, rollNo, roomNo, status, dues,
            collegeName, hostelName, dob, phone, googleEmail, collegeEmail, address,
            fatherName, fatherPhone, motherName, motherPhone,
            bloodGroup, medicalHistory, emergencyContactName, emergencyContactPhone,
            email, password, wifiSSID, wifiPassword, feeFrequency
        } = req.body;

        const profilePhoto = req.file ? `/uploads/profiles/${req.file.filename}` : undefined;
        console.log('Profile photo path:', profilePhoto);

        // Build UPDATE query dynamically to include profile_photo only if a new file was uploaded
        let updateQuery = `UPDATE students SET 
            roll_no = $1, status = $2, dues = $3, college_name = $4, hostel_name = $5,
            dob = $6, phone = $7, google_email = $8, college_email = $9, address = $10,
            father_name = $11, father_phone = $12, mother_name = $13, mother_phone = $14,
            blood_group = $15, medical_history = $16, emergency_contact_name = $17,
            emergency_contact_phone = $18, fee_frequency = $19, password = $20`;

        const updateParams: any[] = [
            rollNo, status, dues, collegeName, hostelName,
            dob, phone, googleEmail, collegeEmail, address,
            fatherName, fatherPhone, motherName, motherPhone,
            bloodGroup, medicalHistory, emergencyContactName,
            emergencyContactPhone, feeFrequency, password
        ];

        if (profilePhoto) {
            updateQuery += `, profile_photo = $${updateParams.length + 1}`;
            updateParams.push(profilePhoto);
        }

        updateQuery += ` WHERE id = $${updateParams.length + 1}`;
        updateParams.push(id);

        console.log('Updating students table...');
        await client.query(updateQuery, updateParams);
        console.log('Students table updated');

        // Get user_id for Account updates
        const sRes = await client.query('SELECT user_id FROM students WHERE id = $1', [id]);
        if (sRes.rows.length > 0) {
            const userId = sRes.rows[0].user_id;

            // 2. Update Users Table (Name, Email, Password)
            let userUpdateQuery = 'UPDATE users SET full_name = $1, email = $2';
            const userUpdateParams: any[] = [fullName, email];
            let paramIndex = 3;

            if (password && password.length >= 6) {
                const hashedPassword = await bcrypt.hash(password, 10);
                userUpdateQuery += `, password_hash = $${paramIndex}`;
                userUpdateParams.push(hashedPassword);
                paramIndex++;
            }

            userUpdateQuery += ` WHERE id = $${paramIndex}`;
            userUpdateParams.push(userId);

            console.log('Updating users table...');
            await client.query(userUpdateQuery, userUpdateParams);
            console.log('Users table updated');
        }

        // 3. Update Rooms Table (WiFi) via Allocation (Assuming Room is consistent/managed separately or we update current room)
        // Find current room for this student
        const allocRes = await client.query(
            'SELECT room_id FROM room_allocations WHERE student_id = $1 AND is_active = true',
            [id]
        );

        if (allocRes.rows.length > 0) {
            const roomId = allocRes.rows[0].room_id;
            // Update WiFi for this room
            console.log('Updating room WiFi...');
            await client.query(
                'UPDATE rooms SET wifi_ssid = $1, wifi_password = $2 WHERE id = $3',
                [wifiSSID, wifiPassword, roomId]
            );
            console.log('Room updated');
        }

        await client.query('COMMIT');
        console.log('✅ Student update committed successfully');

        res.json({ success: true });
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('❌ Error updating student:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: 'Server error: ' + error.message });
    } finally {
        client.release();
    }
};

// --- Global Search ---
export const searchStudents = async (req: Request, res: Response) => {
    try {
        const { query: searchTerm } = req.body;
        if (!searchTerm) {
            return res.json([]);
        }

        const term = `%${searchTerm}%`;

        // Search Students
        const studentRes = await query(`
            SELECT s.id, s.roll_no, u.full_name, r.room_number
            FROM students s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN room_allocations ra ON s.id = ra.student_id AND ra.is_active = true
            LEFT JOIN rooms r ON ra.room_id = r.id
            WHERE u.full_name ILIKE $1 OR s.roll_no ILIKE $1
            LIMIT 5
        `, [term]);

        const students = studentRes.rows.map(row => ({
            id: row.id,
            type: 'student',
            title: row.full_name,
            subtitle: `Roll: ${row.roll_no} • Room: ${row.room_number || 'N/A'}`,
            data: row
        }));

        // Search Rooms
        const roomRes = await query(`
            SELECT id, room_number, status, capacity
            FROM rooms
            WHERE room_number ILIKE $1
            LIMIT 5
        `, [term]);

        const rooms = roomRes.rows.map(row => ({
            id: row.id,
            type: 'room',
            title: `Room ${row.room_number}`,
            subtitle: `${row.status}`,
            data: row
        }));

        res.json([...students, ...rooms]);
    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).json({ error: 'Server error' });
    }
};
