import { Request, Response } from 'express';
import { query } from '../config/db';

// Helper to ensure column exists (Lazy Migration)
const ensureColumnExists = async () => {
    try {
        await query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS last_notifications_cleared_at TIMESTAMPTZ DEFAULT to_timestamp(0);

            ALTER TABLE bus_timings
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

            ALTER TABLE emergency_contacts
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
        `);
    } catch (e) {
        console.error("Auto-migration failed (columns):", e);
    }
};

// Run once on load
ensureColumnExists();

export const getStudentNotifications = async (req: Request, res: Response) => {
    try {
        const userId = req.currentUser?.id;

        // 1. Get Student ID
        const studentRes = await query('SELECT id FROM students WHERE user_id = $1', [userId]);
        if (studentRes.rows.length === 0) {
            return res.status(404).json({ error: 'Student profile not found' });
        }
        const studentId = studentRes.rows[0].id;

        // 2. Get Last Cleared Timestamp
        const userRes = await query('SELECT last_notifications_cleared_at FROM users WHERE id = $1', [userId]);
        const lastCleared = userRes.rows[0]?.last_notifications_cleared_at
            ? new Date(userRes.rows[0].last_notifications_cleared_at)
            : new Date(0);

        // 3. Bus Timing Updates (Global)
        const busRes = await query(`
            SELECT route_name, updated_at, created_at 
            FROM bus_timings 
            WHERE updated_at > $1 OR created_at > $1
        `, [lastCleared]);

        const busNotifs = busRes.rows.map(row => ({
            id: `bus-${row.route_name}-${row.updated_at}`,
            type: 'bus',
            title: 'Bus Timing Update',
            subtitle: `Route ${row.route_name} has been updated.`,
            time: row.updated_at || row.created_at,
            read: false
        }));

        // 4. Emergency Contact Updates (Global)
        const emergencyRes = await query(`
            SELECT name, designation, updated_at, created_at 
            FROM emergency_contacts 
            WHERE updated_at > $1 OR created_at > $1
        `, [lastCleared]);

        const emergencyNotifs = emergencyRes.rows.map(row => ({
            id: `emergency-${row.name}-${row.updated_at}`,
            type: 'emergency',
            title: 'Emergency Contact Update',
            subtitle: `${row.name} (${row.designation}) added/updated.`,
            time: row.updated_at || row.created_at,
            read: false
        }));

        // 5. Unread Messages (Personal)
        const msgRes = await query(`
            SELECT 
                u.full_name as sender_name, 
                c.student_unread as count,
                c.last_message_time as latest_at
            FROM conversations c
            JOIN users u ON u.role = 'admin' -- Assuming admin is sender? Or generic admin user?
            -- Actually sender_id in messages table would be better but we using conversation summary
            WHERE c.student_id = $1 AND c.student_unread > 0
        `, [studentId]);
        // Note: For simplicity assuming 1 admin chat per student or aggregared. 
        // In this schema, conversation is 1-to-1 student-admin? 
        // messages table has sender_id. conversations table has student_id.
        // It implies one conversation per student? Or multiple admins?
        // Schema: conversations has student_id. It doesn't have admin_id. So it's 1 conversation per student (with "The Admin").

        const msgNotifs = msgRes.rows.map(row => ({
            id: `msg-${studentId}`,
            type: 'message',
            title: 'New Message from Admin',
            subtitle: `${row.count} new message${row.count > 1 ? 's' : ''}`,
            time: row.latest_at,
            read: false
        }));

        // 6. Leave Request Updates (Personal)
        const leaveRes = await query(`
            SELECT status, start_date, updated_at 
            FROM leave_requests 
            WHERE student_id = $1 
            AND status IN ('approved', 'rejected') 
            AND updated_at > $2
        `, [studentId, lastCleared]);

        const leaveNotifs = leaveRes.rows.map(row => ({
            id: `leave-${row.updated_at}`,
            type: 'leave',
            title: `Leave Request ${row.status === 'approved' ? 'Approved' : 'Rejected'}`,
            subtitle: `Your leave for ${new Date(row.start_date).toLocaleDateString()} has been ${row.status}.`,
            time: row.updated_at,
            read: false
        }));

        // 7. Complaint Updates (Personal)
        const complaintRes = await query(`
            SELECT title, status, updated_at 
            FROM complaints 
            WHERE student_id = $1 
            AND status IN ('resolved', 'in-progress') 
            AND updated_at > $2
        `, [studentId, lastCleared]);

        const complaintNotifs = complaintRes.rows.map(row => ({
            id: `complaint-${row.updated_at}`,
            type: 'complaint',
            title: `Complaint Update`,
            subtitle: `"${row.title}" is now ${row.status}.`,
            time: row.updated_at,
            read: false
        }));

        // 8. Service Request Updates (Personal)
        const serviceRes = await query(`
            SELECT service_type, status, updated_at 
            FROM service_requests 
            WHERE student_id = $1 
            AND status IN ('approved', 'completed', 'rejected') 
            AND updated_at > $2
        `, [studentId, lastCleared]);

        const serviceNotifs = serviceRes.rows.map(row => ({
            id: `service-${row.updated_at}`,
            type: 'service',
            title: `Service Request Update`,
            subtitle: `${row.service_type} request is ${row.status}.`,
            time: row.updated_at,
            read: false
        }));

        // 9. Notices (Global)
        const noticeRes = await query(`
            SELECT title, content, priority, created_at 
            FROM notices 
            WHERE created_at > $1
        `, [lastCleared]);

        const noticeNotifs = noticeRes.rows.map(row => ({
            id: `notice-${row.created_at}`,
            type: 'notice',
            title: row.title,
            subtitle: row.content,
            time: row.created_at,
            read: false,
            priority: row.priority // generic, critical, etc.
        }));

        // Combine
        const allNotifications = [
            ...busNotifs,
            ...emergencyNotifs,
            ...msgNotifs,
            ...leaveNotifs,
            ...complaintNotifs,
            ...serviceNotifs,
            ...noticeNotifs
        ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

        res.json(allNotifications);

    } catch (error: any) {
        console.error("Get Student Notifications Error:", error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

export const clearStudentNotifications = async (req: Request, res: Response) => {
    try {
        const userId = req.currentUser?.id;
        await query('UPDATE users SET last_notifications_cleared_at = NOW() WHERE id = $1', [userId]);
        res.json({ success: true });
    } catch (error: any) {
        console.error("Clear Student Notifications Error:", error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

export const getAdminNotifications = async (req: Request, res: Response) => {
    try {
        const userId = req.currentUser?.id;

        // Get Last Cleared Timestamp
        const userRes = await query('SELECT last_notifications_cleared_at FROM users WHERE id = $1', [userId]);
        const lastCleared = userRes.rows[0]?.last_notifications_cleared_at
            ? new Date(userRes.rows[0].last_notifications_cleared_at)
            : new Date(0);

        // 1. Unread Messages (From Conversations)
        // We use conversations.admin_unread instead of messages table because messages lacks receiver_id
        const messagesRes = await query(`
            SELECT 
                c.student_id, 
                u.full_name as sender_name, 
                s.profile_photo,
                c.admin_unread as count,
                c.last_message_time as latest_at
            FROM conversations c
            JOIN students s ON c.student_id = s.id
            JOIN users u ON s.user_id = u.id
            WHERE c.admin_unread > 0
        `); // Messages are always "live" unread status, so we don't strictly filter by cleared time for badge, BUT user wants "unread only"
        // Wait, if I clear notifications, should I clear the unread BADGE on messages? 
        // User said: "show the new unread requests"
        // Message unread status is stateful in DB. If I "clear" notification panel, it shouldn't auto-read the message. 
        // BUT, for the PANEL LIST, we can hide them if they are older than clear time? 
        // No, unread messages are persistent until read. filtering by time might hide unread messages if you cleared them but didn't read them?
        // User said: "only the unread ones". If they are unread, they show. If I clear, that implies I "saw" the notification list?
        // Let's stick to showing ALL unread messages regardless of clear time, because "Unread" is the status.
        // For Complaints/Services, "Pending" is the status, but they stick around for days. THOSE should be filtered by time.

        const messageNotifs = messagesRes.rows.map(row => ({
            id: `msg-${row.student_id}`,
            type: 'message',
            title: `New messages from ${row.sender_name}`,
            subtitle: `${row.count} unread message${row.count > 1 ? 's' : ''}`,
            time: row.latest_at,
            data: { studentId: row.student_id, photo: row.profile_photo },
            read: false
        })).filter(n => new Date(n.time) > lastCleared); // Apply filter if user wants to hide even unread msg notifications? 
        // Logic: specific requirement "don't show the old ones... only the unread ones".
        // If I filter unread messages by cleared time, and I haven't read it, it disappears from panel?
        // That seems risky, but "Clear All" usually means "I've seen these headers, go away".
        // So yes, filter by lastCleared.

        // 2. Pending Complaints
        const complaintsRes = await query(`
            SELECT c.id, c.title, c.created_at, u.full_name
            FROM complaints c
            JOIN students s ON c.student_id = s.id
            JOIN users u ON s.user_id = u.id
            WHERE c.status = 'pending' AND c.created_at > $1
            ORDER BY c.created_at DESC
        `, [lastCleared]);

        const complaintNotifs = complaintsRes.rows.map(row => ({
            id: `complaint-${row.id}`,
            type: 'complaint',
            title: 'New Complaint',
            subtitle: `${row.title} - ${row.full_name}`,
            time: row.created_at,
            data: { id: row.id },
            read: false
        }));

        // 3. Pending Service Requests
        const serviceRes = await query(`
            SELECT sr.id, sr.service_type, sr.created_at, u.full_name
            FROM service_requests sr
            JOIN students s ON sr.student_id = s.id
            JOIN users u ON s.user_id = u.id
            WHERE sr.status = 'pending' AND sr.created_at > $1
            ORDER BY sr.created_at DESC
        `, [lastCleared]);

        const serviceNotifs = serviceRes.rows.map(row => ({
            id: `service-${row.id}`,
            type: 'service',
            title: 'Service Request',
            subtitle: `${row.service_type} - ${row.full_name}`,
            time: row.created_at,
            data: { id: row.id },
            read: false
        }));

        // 4. Pending Laundry Requests
        const laundryRes = await query(`
            SELECT lr.id, lr.items_count, lr.created_at, u.full_name
            FROM laundry_requests lr
            JOIN students s ON lr.student_id = s.id
            JOIN users u ON s.user_id = u.id
            WHERE lr.status = 'pending' AND lr.created_at > $1
            ORDER BY lr.created_at DESC
        `, [lastCleared]);

        const laundryNotifs = laundryRes.rows.map(row => ({
            id: `laundry-${row.id}`,
            type: 'laundry',
            title: 'Laundry Request',
            subtitle: `${row.items_count} items - ${row.full_name}`,
            time: row.created_at,
            data: { id: row.id },
            read: false
        }));

        // 5. Pending Leave Requests
        const leaveRes = await query(`
            SELECT lr.id, lr.start_date, lr.end_date, lr.created_at, u.full_name
            FROM leave_requests lr
            JOIN students s ON lr.student_id = s.id
            JOIN users u ON s.user_id = u.id
            WHERE lr.status = 'pending' AND lr.created_at > $1
            ORDER BY lr.created_at DESC
        `, [lastCleared]);

        const leaveNotifs = leaveRes.rows.map(row => ({
            id: `leave-${row.id}`,
            type: 'leave',
            title: 'Leave Request',
            subtitle: `${row.full_name} (${new Date(row.start_date).toLocaleDateString()})`,
            time: row.created_at,
            data: { id: row.id },
            read: false
        }));

        // Combine and Sort
        const allNotifications = [
            ...messageNotifs,
            ...complaintNotifs,
            ...serviceNotifs,
            ...laundryNotifs,
            ...leaveNotifs
        ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

        res.json(allNotifications);
    } catch (error: any) {
        console.error("Get Notifications Error:", error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

export const clearAdminNotifications = async (req: Request, res: Response) => {
    try {
        const userId = req.currentUser?.id;
        await query('UPDATE users SET last_notifications_cleared_at = NOW() WHERE id = $1', [userId]);
        res.json({ success: true });
    } catch (error: any) {
        console.error("Clear Notifications Error:", error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};
