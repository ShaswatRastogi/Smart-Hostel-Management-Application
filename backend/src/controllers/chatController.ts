import { Request, Response } from 'express';
import { query } from '../config/db';
import { getAdminTokens, getUserToken, sendPushNotification } from '../services/pushService';
import { getIO } from '../socket'; // Import WebSockets via helper

// Helper to get conversation ID (Find or Create)
const getConversationId = async (studentId: number, staffId?: number | null) => {
    let res;
    if (staffId) {
        res = await query(
            'SELECT id FROM conversations WHERE student_id = $1 AND staff_id = $2',
            [studentId, staffId]
        );
        if (res.rows.length === 0) {
            res = await query(
                'INSERT INTO conversations (student_id, staff_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING id',
                [studentId, staffId]
            );
        }
    } else {
        // General support chat (shared)
        res = await query('SELECT id FROM conversations WHERE student_id = $1 AND staff_id IS NULL', [studentId]);
        if (res.rows.length === 0) {
            res = await query(
                'INSERT INTO conversations (student_id, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING id',
                [studentId]
            );
        }
    }
    return res.rows[0].id;
};

const STAFF_ROLES = ['admin', 'owner', 'warden', 'cleaning_staff', 'mess_staff', 'laundry_staff', 'guard', 'maintenance_staff'];
const isStaff = (role?: string) => role && STAFF_ROLES.includes(role);

export const getMessages = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.currentUser?.id;
        const role = req.currentUser?.role;
        const staffIdRaw = req.query.staffId as string;
        const staffIdParam = (staffIdRaw && staffIdRaw !== 'undefined' && staffIdRaw !== 'null') ? parseInt(staffIdRaw) : null;
        let targetStaffId: number | null = (staffIdParam && !isNaN(staffIdParam)) ? staffIdParam : null;

        let targetStudentId: number;

        if (isStaff(role)) {
            const parsedId = parseInt(id);
            if (isNaN(parsedId)) {
                console.error(`[ERROR] getMessages: Invalid student ID '${id}' for admin`);
                res.status(400).json({ error: 'Invalid student ID' });
                return;
            }
            targetStudentId = parsedId;
            // If staff is viewing, and no staffIdParam, we assume it's their private chat or general
            // Actually, staff usually clicks a conversation which has an ID.
            // But the frontend currently uses studentId as the URL param.
            if (!targetStaffId) {
                targetStaffId = userId ?? null; // Assume they want to see their own chats with this student
            }
        } else {
            // Student
            const sRes = await query('SELECT id FROM students WHERE user_id = $1', [userId]);
            if (sRes.rows.length === 0) {
                res.status(404).json({ error: 'Student profile not found' });
                return;
            }
            targetStudentId = sRes.rows[0].id;
        }

        // Update current user last_seen
        await query('UPDATE users SET last_seen = NOW() WHERE id = $1', [userId]);

        const conversationId = await getConversationId(targetStudentId, targetStaffId);

        // Mark incoming messages as read AND reset conversation counter
        await query(
            'UPDATE messages SET is_read = TRUE WHERE conversation_id = $1 AND sender_id != $2 AND is_read = FALSE',
            [conversationId, userId]
        );

        // Reset unread count for the viewer
        if (isStaff(role)) {
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

        if (isStaff(role)) {
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
                r.room_number, r.wifi_ssid as room_wifi_ssid, r.wifi_password as room_wifi_password,
                r.room_type, r.facilities
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
                    googleEmail: r.google_email,
                    collegeEmail: r.college_email,
                    roomType: r.room_type,
                    facilities: r.facilities,
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
            // Check Admin Status (Any staff active recently?)
            const statusRes = await query(`
                SELECT MAX(last_seen) as last_seen FROM users WHERE role = ANY($1)
            `, [STAFF_ROLES]);
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
                _id: isStaff(row.role) ? 'admin' : 'student',
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
            conversationId,
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
        const { id } = req.params; // target student ID (if admin) or ignored
        const { text, staffId } = req.body;
        const userId = req.currentUser?.id;
        const role = req.currentUser?.role;

        if (!text) {
            res.status(400).json({ error: 'Text required' });
            return;
        }

        let targetStudentId: number;
        const staffIdRaw = req.body.staffId;
        let targetStaffId: number | null = (staffIdRaw && staffIdRaw !== 'undefined' && staffIdRaw !== 'null') ? parseInt(staffIdRaw) : null;

        if (isStaff(role)) {
            targetStudentId = parseInt(id);
            if (!targetStaffId) targetStaffId = userId ?? null;
        } else {
            const sRes = await query('SELECT id FROM students WHERE user_id = $1', [userId]);
            if (sRes.rows.length === 0) {
                res.status(404).json({ error: 'Student profile not found' });
                return;
            }
            targetStudentId = sRes.rows[0].id;
        }

        const conversationId = await getConversationId(targetStudentId, targetStaffId);

        // Insert Message
        const insertRes = await query(
            'INSERT INTO messages (conversation_id, sender_id, text, sent, created_at) VALUES ($1, $2, $3, true, NOW()) RETURNING id, created_at',
            [conversationId, userId, text]
        );

        // Update Conversation (Last message + Increment Unread)
        if (isStaff(role)) {
            await query(
                'UPDATE conversations SET last_message = $1, last_message_time = NOW(), updated_at = NOW(), student_unread = COALESCE(student_unread, 0) + 1 WHERE id = $2',
                [text, conversationId]
            );
        } else {
            await query(
                'UPDATE conversations SET last_message = $1, last_message_time = NOW(), updated_at = NOW(), admin_unread = COALESCE(admin_unread, 0) + 1 WHERE id = $2',
                [text, conversationId]
            );
        }

        const newMessage = {
            _id: insertRes.rows[0].id.toString(),
            text,
            createdAt: insertRes.rows[0].created_at,
            user: { _id: isStaff(role) ? 'admin' : 'student' }
        };

        // --- Broadcast via WebSockets ---
        getIO().to(conversationId.toString()).emit('newMessage', newMessage);

        // Notify the specific staff member to refresh their conversation list
        if (targetStaffId) {
            getIO().to(`staff:${targetStaffId}:conversations`).emit('updateChatList');
        }
        // Also notify admins to refresh their conversation list (for general support)
        getIO().to('admin:conversations').emit('updateChatList');

        res.json({
            success: true,
            message: newMessage
        });

        // --- Push Notification ---
        try {
            if (isStaff(role)) {
                // Notify Student
                const studentUserRes = await query(
                    'SELECT u.id, u.full_name FROM users u JOIN students s ON s.user_id = u.id WHERE s.id = $1',
                    [targetStudentId]
                );
                if (studentUserRes.rows.length > 0) {
                    const tokens = await getUserToken(studentUserRes.rows[0].id, 'messages');
                    sendPushNotification(
                        tokens,
                        '💬 New Message from Admin',
                        text.length > 50 ? text.substring(0, 47) + '...' : text,
                        { type: 'message', sender: 'admin' }
                    );
                }
            } else {
                // Notify Admins
                const adminTokens = await getAdminTokens();
                const studentRes = await query('SELECT full_name FROM users WHERE id = $1', [userId]);
                const studentName = studentRes.rows[0]?.full_name || 'A student';

                sendPushNotification(
                    adminTokens,
                    `💬 Message from ${studentName}`,
                    text.length > 50 ? text.substring(0, 47) + '...' : text,
                    { type: 'message', sender: 'student', studentId: targetStudentId.toString(), studentName }
                );
            }
        } catch (pushError) {
            console.error("[Push] Failed to send chat notification:", pushError);
        }

    } catch (error) {
        console.error("Send Message Error:", error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Admin/Warden: Get All Conversations relevant to them
export const getConversations = async (req: Request, res: Response) => {
    try {
        const userId = req.currentUser?.id;
        const role = req.currentUser?.role;

        // Each staff member only sees conversations addressed to THEM (staff_id = their user id)
        // Admin/owner additionally sees general support (staff_id IS NULL)
        const result = await query(`
            SELECT c.*, s.roll_no, u.full_name, u.email, s.profile_photo, s.id as student_id
            FROM conversations c
            JOIN students s ON c.student_id = s.id
            JOIN users u ON s.user_id = u.id
            WHERE (c.staff_id = $1 OR (c.staff_id IS NULL AND $2 = ANY($3)))
            AND c.last_message IS NOT NULL AND c.last_message != ''
            ORDER BY c.updated_at DESC
        `, [userId, role, ['admin', 'owner']]);
        console.log(`[DEBUG] getConversations: found ${result.rows.length} conversations for user ${userId} (role: ${role})`);

        const conversations = result.rows.map(row => ({
            id: row.id,
            studentId: row.student_id, // Important for navigation
            staffId: row.staff_id,     // Pass staffId so frontend can route correctly
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
