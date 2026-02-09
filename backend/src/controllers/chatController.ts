import { Request, Response } from 'express';
import { query } from '../config/db';

// Helper to get conversation ID (Find or Create)
const getConversationId = async (studentId: number) => {
    let res = await query('SELECT id FROM conversations WHERE student_id = $1', [studentId]);
    if (res.rows.length === 0) {
        res = await query('INSERT INTO conversations (student_id, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING id', [studentId]);
    }
    return res.rows[0].id;
};

export const getMessages = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // potentially studentId from URL
        const userId = req.currentUser?.id;
        const role = req.currentUser?.role;

        let targetStudentId: number;

        if (role === 'admin') {
            const parsedId = parseInt(id);
            if (isNaN(parsedId)) {
                console.error(`[ERROR] getMessages: Invalid student ID '${id}' for admin`);
                res.status(400).json({ error: 'Invalid student ID' });
                return;
            }
            targetStudentId = parsedId;
        } else {
            // Student can only see their own chat
            const sRes = await query('SELECT id FROM students WHERE user_id = $1', [userId]);
            if (sRes.rows.length === 0) {
                res.status(404).json({ error: 'Student profile not found' });
                return;
            }
            targetStudentId = sRes.rows[0].id;
        }

        // Update current user last_seen
        await query('UPDATE users SET last_seen = NOW() WHERE id = $1', [userId]);

        const conversationId = await getConversationId(targetStudentId);

        // Mark incoming messages as read AND reset conversation counter
        await query(
            'UPDATE messages SET is_read = TRUE WHERE conversation_id = $1 AND sender_id != $2 AND is_read = FALSE',
            [conversationId, userId]
        );

        // Reset unread count for the viewer
        if (role === 'admin') {
            await query('UPDATE conversations SET admin_unread = 0 WHERE id = $1', [conversationId]);
        } else {
            await query('UPDATE conversations SET student_unread = 0 WHERE id = $1', [conversationId]);
        }

        // Fetch messages with profile photos and read status
        const messagesRes = await query(`
            SELECT m.*, m.is_read, u.full_name, u.role, u.id as user_id, s.profile_photo
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            LEFT JOIN students s ON u.id = s.user_id
            WHERE m.conversation_id = $1
            ORDER BY m.created_at DESC
            LIMIT 50
        `, [conversationId]);

        // Determine Partner Status & Details
        let partnerOnline = false;
        let partnerLastSeen = null;
        let partnerDetails = null;

        if (role === 'admin') {
            // Check Student Status
            const statusRes = await query(`
                SELECT u.last_seen 
                FROM users u
                JOIN students s ON s.user_id = u.id
                WHERE s.id = $1
            `, [targetStudentId]);
            if (statusRes.rows.length > 0) {
                const lastSeen = new Date(statusRes.rows[0].last_seen);
                partnerLastSeen = lastSeen;
                // Online if seen in last 2 minutes
                partnerOnline = (new Date().getTime() - lastSeen.getTime()) < 2 * 60 * 1000;
            }

            // Fetch Full Student Details for Admin View
            const detailsRes = await query(`
                SELECT s.*, u.email, u.full_name as name, 
                r.room_number, r.wifi_ssid as room_wifi_ssid, r.wifi_password as room_wifi_password
                FROM students s
                JOIN users u ON s.user_id = u.id
                LEFT JOIN room_allocations ra ON s.id = ra.student_id AND ra.is_active = true
                LEFT JOIN rooms r ON ra.room_id = r.id
                WHERE s.id = $1
            `, [targetStudentId]);
            if (detailsRes.rows.length > 0) {
                // Map snake_case DB fields to camelCase for frontend component
                const r = detailsRes.rows[0];
                partnerDetails = {
                    id: r.id,
                    studentId: r.id,
                    name: r.name,
                    email: r.email,
                    rollNo: r.roll_no,
                    room: r.room_number || 'N/A', // Use joined room_number
                    collegeName: r.college_name,
                    hostelName: r.hostel_name,
                    phone: r.phone, // match studentController (was phone_no)
                    profilePhoto: r.profile_photo,
                    fatherName: r.father_name,
                    fatherPhone: r.father_phone,
                    motherName: r.mother_name,
                    motherPhone: r.mother_phone,
                    address: r.address,
                    dues: parseFloat(r.dues || '0'), // match studentController parsing
                    status: r.status,
                    dob: r.dob,
                    wifiSSID: r.room_wifi_ssid || r.wifi_ssid, // Prefer room wifi, fallback to student wifi if exists
                    wifiPassword: r.room_wifi_password || r.wifi_password,
                    bloodGroup: r.blood_group,
                    medicalHistory: r.medical_history,
                    emergencyContactName: r.emergency_contact_name,
                    emergencyContactPhone: r.emergency_contact_phone,
                    feeFrequency: r.fee_frequency || 'Monthly', // Add feeFrequency
                    password: r.password, // Plain text password for admin
                    tempPassword: r.password, // Backwards compatibility
                    createdAt: r.created_at
                };
            }

        } else {
            // Check Admin Status (Any admin active recently?)
            const statusRes = await query(`
                SELECT MAX(last_seen) as last_seen FROM users WHERE role = 'admin'
            `);
            if (statusRes.rows.length > 0 && statusRes.rows[0].last_seen) {
                const lastSeen = new Date(statusRes.rows[0].last_seen);
                partnerLastSeen = lastSeen;
                partnerOnline = (new Date().getTime() - lastSeen.getTime()) < 2 * 60 * 1000;
            }
        }

        // Map for frontend
        const messages = messagesRes.rows.map(row => ({
            _id: row.id.toString(),
            text: row.text,
            createdAt: row.created_at,
            user: {
                _id: row.role === 'admin' ? 'admin' : 'student',
                name: row.full_name,
                originalId: row.user_id,
                avatar: row.profile_photo // Return avatar (URL)
            },
            sent: true,
            received: true,
            read: row.is_read // Include read status
        }));

        res.json({
            messages,
            partnerStatus: {
                online: partnerOnline,
                lastSeen: partnerLastSeen,
            },
            partnerDetails // Include full details if admin
        });
    } catch (error) {
        console.error("Get Messages Error:", error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const sendMessage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // target student ID (if admin) or ignored/used for verify
        const { text } = req.body;
        const userId = req.currentUser?.id;
        const role = req.currentUser?.role;

        if (!text) {
            res.status(400).json({ error: 'Text required' });
            return;
        }

        let targetStudentId: number;

        if (role === 'admin') {
            targetStudentId = parseInt(id);
        } else {
            const sRes = await query('SELECT id FROM students WHERE user_id = $1', [userId]);
            if (sRes.rows.length === 0) {
                res.status(404).json({ error: 'Student profile not found' });
                return;
            }
            targetStudentId = sRes.rows[0].id;
        }

        const conversationId = await getConversationId(targetStudentId);

        // Insert Message
        const insertRes = await query(
            'INSERT INTO messages (conversation_id, sender_id, text, sent, created_at) VALUES ($1, $2, $3, true, NOW()) RETURNING id, created_at',
            [conversationId, userId, text]
        );

        // Update Conversation (Last message + Increment Unread)
        if (role === 'admin') {
            await query(
                'UPDATE conversations SET last_message = $1, last_message_time = NOW(), updated_at = NOW(), student_unread = student_unread + 1 WHERE id = $2',
                [text, conversationId]
            );
        } else {
            await query(
                'UPDATE conversations SET last_message = $1, last_message_time = NOW(), updated_at = NOW(), admin_unread = admin_unread + 1 WHERE id = $2',
                [text, conversationId]
            );
        }

        res.json({
            success: true,
            message: {
                _id: insertRes.rows[0].id.toString(),
                text,
                createdAt: insertRes.rows[0].created_at,
                user: { _id: role === 'admin' ? 'admin' : 'student' }
            }
        });

    } catch (error) {
        console.error("Send Message Error:", error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Admin: Get All Conversations
export const getConversations = async (req: Request, res: Response) => {
    try {
        // Assume Admin only for now, or secure via route
        const result = await query(`
            SELECT c.*, s.roll_no, u.full_name, u.email, s.profile_photo, s.id as student_id
            FROM conversations c
            JOIN students s ON c.student_id = s.id
            JOIN users u ON s.user_id = u.id
            WHERE c.last_message IS NOT NULL AND c.last_message != ''
            ORDER BY c.updated_at DESC
        `);

        const conversations = result.rows.map(row => ({
            id: row.id,
            studentId: row.student_id, // Important for navigation
            studentName: row.full_name,
            lastMessage: row.last_message,
            time: row.last_message_time,
            unread: row.admin_unread || 0,
            profilePhoto: row.profile_photo
        }));

        res.json(conversations);
    } catch (error) {
        console.error("Get Conversations Error:", error);
        res.status(500).json({ error: 'Server error' });
    }
};
