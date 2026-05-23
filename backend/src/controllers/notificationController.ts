import { Request, Response } from 'express';
import { query } from '../config/db';


export const getStudentNotifications = async (req: Request, res: Response) => {
    try {
        const userId = req.currentUser?.id;

        // 1. Get Student ID
        // 1. Get Student ID and Account Creation Date
        const studentRes = await query('SELECT id, created_at FROM students WHERE user_id = $1', [userId]);
        if (studentRes.rows.length === 0) {
            return res.status(404).json({ error: 'Student profile not found' });
        }
        const studentId = studentRes.rows[0].id;
        const studentCreatedAt = new Date(studentRes.rows[0].created_at);

        // 2. Get Last Cleared Timestamp
        const userRes = await query('SELECT last_notifications_cleared_at FROM users WHERE id = $1', [userId]);
        const lastCleared = userRes.rows[0]?.last_notifications_cleared_at
            ? new Date(userRes.rows[0].last_notifications_cleared_at)
            : new Date(0);

        // Effective Start Date for Global Items (Notices, Bus, Contacts)
        // Show only items created AFTER student joined AND AFTER they last cleared list.
        const effectiveStartDate = new Date(Math.max(studentCreatedAt.getTime(), lastCleared.getTime()));

        // 3. Bus Timing Updates (Global)
        const busRes = await query(`
            SELECT route_name, updated_at, created_at 
            FROM bus_timings 
            WHERE updated_at > $1 OR created_at > $1
        `, [effectiveStartDate]);

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
        `, [effectiveStartDate]);

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
            JOIN users u ON u.role = 'admin' 
            WHERE c.student_id = $1 AND c.student_unread > 0
        `, [studentId]);

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
            AND status IN ('resolved', 'in-progress', 'inProgress') 
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
            AND status IN ('approved', 'in_progress', 'completed', 'rejected') 
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
            ORDER BY created_at DESC
        `, [effectiveStartDate]);

        const noticeNotifs = noticeRes.rows.map(row => ({
            id: `notice-${row.created_at}`,
            type: 'notice',
            title: row.title,
            subtitle: row.content,
            time: row.created_at,
            read: false,
            priority: row.priority // generic, critical, etc.
        }));

        // 10. Laundry Updates (Personal)
        const laundryRes = await query(`
            SELECT status, updated_at 
            FROM laundry_requests 
            WHERE student_id = $1 
            AND status IN ('approved', 'completed', 'rejected') 
            AND updated_at > $2
        `, [studentId, lastCleared]);

        const laundryNotifs = laundryRes.rows.map(row => ({
            id: `laundry-${row.updated_at}`,
            type: 'laundry',
            title: `Laundry Update`,
            subtitle: `Your laundry request is ${row.status}.`,
            time: row.updated_at,
            read: false
        }));

        // 11. Visitor Updates (Personal)
        const visitorRes = await query(`
            SELECT visitor_name, status, updated_at 
            FROM visitors 
            WHERE student_id = $1 
            AND status IN ('approved', 'rejected') 
            AND updated_at > $2
        `, [studentId, lastCleared]);

        const visitorNotifs = visitorRes.rows.map(row => ({
            id: `visitor-${row.updated_at}`,
            type: 'visitor',
            title: `Visitor Request Update`,
            subtitle: `Visitor ${row.visitor_name} request is ${row.status}.`,
            time: row.updated_at,
            read: false
        }));

        // 12. Mess Menu Updates (Global - check if menu updated recently)
        const messRes = await query(`
            SELECT day_of_week, meal_type, updated_at 
            FROM mess_schedule 
            WHERE updated_at > $1
        `, [effectiveStartDate]);

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        const messNotifs = messRes.rows.map(row => {
            const dayName = days[row.day_of_week];
            return {
                id: `mess-${row.day_of_week}-${row.meal_type}-${row.updated_at}`,
                type: 'mess',
                title: `Mess Menu Update`,
                subtitle: `${dayName}'s ${row.meal_type} menu has been updated.`,
                time: row.updated_at,
                data: { tab: 'menu', day: dayName, meal: row.meal_type },
                read: false
            };
        });

        // 13. Fee Requests (Personal - pending payments)
        const feeRes = await query(`
            SELECT purpose, amount, created_at 
            FROM payments 
            WHERE student_id = $1 
            AND status = 'pending' 
            AND created_at > $2
        `, [studentId, lastCleared]);

        const feeNotifs = feeRes.rows.map(row => ({
            id: `fee-${row.created_at}`,
            type: 'payment',
            title: `Fee Payment Request`,
            subtitle: `Payment request for ${row.purpose} (₹${row.amount}).`,
            time: row.created_at,
            read: false
        }));

        // Combine
        const allNotifications = [
            ...busNotifs,
            ...emergencyNotifs,
            ...msgNotifs,
            ...leaveNotifs,
            ...complaintNotifs,
            ...serviceNotifs,
            ...noticeNotifs,
            ...laundryNotifs,
            ...visitorNotifs,
            ...messNotifs,
            ...feeNotifs
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
                c.id as conversation_id,
                c.student_id, 
                u.full_name as sender_name, 
                s.profile_photo,
                c.admin_unread as count,
                c.last_message_time as latest_at
            FROM conversations c
            JOIN students s ON c.student_id = s.id
            JOIN users u ON s.user_id = u.id
            WHERE c.admin_unread > 0
            AND (c.staff_id = $1 OR (c.staff_id IS NULL AND $2 = ANY($3)))
        `, [userId, req.currentUser?.role, ['admin', 'owner']]);

        const messageNotifs = messagesRes.rows.map(row => ({
            id: `msg-${row.conversation_id}`,
            type: 'message',
            title: `New messages from ${row.sender_name}`,
            subtitle: `${row.count} unread message${row.count > 1 ? 's' : ''}`,
            time: row.latest_at,
            data: { studentId: row.student_id, photo: row.profile_photo, studentName: row.sender_name },
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
            WHERE c.status IN ('pending', 'open') AND c.created_at > $1
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

        // 6. Pending Visitor Requests
        const visitorRes = await query(`
            SELECT v.id, v.visitor_name, v.created_at, u.full_name
            FROM visitors v
            JOIN students s ON v.student_id = s.id
            JOIN users u ON s.user_id = u.id
            WHERE v.status = 'pending' AND v.created_at > $1
            ORDER BY v.created_at DESC
        `, [lastCleared]);

        const visitorNotifs = visitorRes.rows.map(row => ({
            id: `visitor-${row.id}`,
            type: 'visitor',
            title: 'Visitor Request',
            subtitle: `${row.visitor_name} to see ${row.full_name}`,
            time: row.created_at,
            data: { id: row.id },
            read: false
        }));

        // 7. Recent Payments (Success)
        // Show payments made since last clear
        const paymentRes = await query(`
            SELECT p.id, p.amount, p.created_at, u.full_name
            FROM payments p
            JOIN students s ON p.student_id = s.id
            JOIN users u ON s.user_id = u.id
            WHERE p.status = 'success' AND p.created_at > $1
            ORDER BY p.created_at DESC
        `, [lastCleared]);

        const paymentNotifs = paymentRes.rows.map(row => ({
            id: `payment-${row.id}`,
            type: 'payment',
            title: 'Payment Received',
            subtitle: `₹${row.amount} from ${row.full_name}`,
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
            ...leaveNotifs,
            ...visitorNotifs,
            ...paymentNotifs
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

export const getPreferences = async (req: Request, res: Response) => {
    const userId = req.currentUser?.id;

    try {
        const result = await query(
            'SELECT notification_preferences FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const prefs = result.rows[0].notification_preferences || {};
        res.json(prefs);
    } catch (error) {
        console.error('Error fetching notification preferences:', error);
        res.status(500).json({ error: 'Server error fetching preferences' });
    }
};

export const updatePreferences = async (req: Request, res: Response) => {
    const userId = req.currentUser?.id;
    const { preferences } = req.body;

    if (!preferences || typeof preferences !== 'object') {
        return res.status(400).json({ error: 'Invalid preferences payload' });
    }

    try {
        await query(
            'UPDATE users SET notification_preferences = $1 WHERE id = $2',
            [JSON.stringify(preferences), userId]
        );

        res.json({ message: 'Preferences updated successfully', preferences });
    } catch (error) {
        console.error('Error updating notification preferences:', error);
        res.status(500).json({ error: 'Server error updating preferences' });
    }
};

