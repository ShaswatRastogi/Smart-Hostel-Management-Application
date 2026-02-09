import { Request, Response } from 'express';
import pool from '../config/db';

/**
 * Get overview statistics
 */
export const getOverviewStats = async (req: Request, res: Response) => {
    try {
        const { period = '30' } = req.query;
        const days = parseInt(period as string);

        // Total students
        const studentsResult = await pool.query(
            'SELECT COUNT(*) as total FROM students WHERE status = $1',
            ['active']
        );
        const currentStudents = parseInt(studentsResult.rows[0].total);

        // Previous students (total minus those joined in current period)
        const prevStudentsResult = await pool.query(`
            SELECT COUNT(*) as total 
            FROM students 
            WHERE status = 'active' 
            AND created_at < CURRENT_DATE - INTERVAL '${days} days'
        `);
        const prevStudents = parseInt(prevStudentsResult.rows[0].total) || 1;
        const studentTrend = Math.round(((currentStudents - prevStudents) / prevStudents) * 100);

        // Total rooms and occupied
        const roomsResult = await pool.query(`
            SELECT 
                COUNT(*) as total_rooms,
                COUNT(CASE WHEN capacity > 0 THEN 1 END) as occupied_rooms
            FROM rooms
        `);
        const totalRooms = parseInt(roomsResult.rows[0].total_rooms) || 1;
        const occupiedRooms = parseInt(roomsResult.rows[0].occupied_rooms) || 0;
        const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);

        // Pending complaints
        const complaintsResult = await pool.query(
            'SELECT COUNT(*) as pending FROM complaints WHERE status = $1',
            ['pending']
        );
        const currentPending = parseInt(complaintsResult.rows[0].pending);

        // Previous pending (at start of period) - Approximate
        const prevPendingResult = await pool.query(`
            SELECT COUNT(*) as total 
            FROM complaints 
            WHERE status = 'pending' 
            AND created_at < CURRENT_DATE - INTERVAL '${days} days'
        `);
        const prevPending = parseInt(prevPendingResult.rows[0].total) || 1;
        const complaintTrend = Math.round(((currentPending - prevPending) / prevPending) * 100);

        // Active leave requests
        const leavesResult = await pool.query(`
            SELECT COUNT(*) as active 
            FROM leave_requests 
            WHERE status = 'pending' 
            AND end_date >= CURRENT_DATE
        `);

        res.json({
            totalStudents: currentStudents,
            studentGrowth: studentTrend > 0 ? `+${studentTrend}%` : `${studentTrend}%`,
            occupancyRate,
            pendingComplaints: currentPending,
            complaintGrowth: complaintTrend > 0 ? `+${complaintTrend}%` : `${complaintTrend}%`,
            activeLeaveRequests: parseInt(leavesResult.rows[0].active)
        });
    } catch (error) {
        console.error('Error fetching overview stats:', error);
        res.status(500).json({ error: 'Failed to fetch overview statistics' });
    }
};

/**
 * Get payment analytics
 */
export const getPaymentAnalytics = async (req: Request, res: Response) => {
    try {
        const { period = '30' } = req.query;
        const days = parseInt(period as string);

        // Total revenue (current period)
        const revenueResult = await pool.query(`
            SELECT COALESCE(SUM(amount), 0) as total_revenue
            FROM payments
            WHERE status = 'paid'
            AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
        `);
        const currentRevenue = parseFloat(revenueResult.rows[0].total_revenue);

        // Previous revenue (period before current)
        const prevRevenueResult = await pool.query(`
            SELECT COALESCE(SUM(amount), 0) as total_revenue
            FROM payments
            WHERE status = 'paid'
            AND created_at >= CURRENT_DATE - INTERVAL '${days * 2} days'
            AND created_at < CURRENT_DATE - INTERVAL '${days} days'
        `);
        const prevRevenue = parseFloat(prevRevenueResult.rows[0].total_revenue) || 1;
        const revenueTrend = Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 100);

        // Outstanding dues
        const duesResult = await pool.query(`
            SELECT COALESCE(SUM(dues), 0) as total_dues
            FROM students
            WHERE status = 'active'
        `);

        // Collection rate (current)
        const collectionResult = await pool.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as paid,
                COALESCE(SUM(amount), 1) as total
            FROM payments
            WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
        `);
        const collectionRate = Math.round((parseFloat(collectionResult.rows[0].paid) / parseFloat(collectionResult.rows[0].total)) * 100);

        // Collection rate (previous)
        const prevCollectionResult = await pool.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as paid,
                COALESCE(SUM(amount), 1) as total
            FROM payments
            WHERE created_at >= CURRENT_DATE - INTERVAL '${days * 2} days'
            AND created_at < CURRENT_DATE - INTERVAL '${days} days'
        `);
        const prevCollectionRate = Math.round((parseFloat(prevCollectionResult.rows[0].paid) / parseFloat(prevCollectionResult.rows[0].total)) * 100) || 1;
        const collectionTrend = Math.round(((collectionRate - prevCollectionRate) / prevCollectionRate) * 100);

        // ... rest of the payment analytics logic ...
        const statusBreakdown = await pool.query(`
            SELECT status, COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount
            FROM payments
            WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
            GROUP BY status
        `);

        const trendResult = await pool.query(`
            SELECT 
                TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') as month,
                COALESCE(SUM(amount), 0) as revenue
            FROM payments
            WHERE status = 'paid'
            AND created_at >= CURRENT_DATE - INTERVAL '6 months'
            GROUP BY DATE_TRUNC('month', created_at)
            ORDER BY DATE_TRUNC('month', created_at) ASC
        `);

        const defaultersResult = await pool.query(`
            SELECT s.id, u.full_name, s.roll_no, s.dues
            FROM students s
            JOIN users u ON s.user_id = u.id
            WHERE s.status = 'active' AND s.dues > 0
            ORDER BY s.dues DESC
            LIMIT 10
        `);

        res.json({
            totalRevenue: currentRevenue,
            revenueGrowth: revenueTrend > 0 ? `+${revenueTrend}%` : `${revenueTrend}%`,
            outstandingDues: parseFloat(duesResult.rows[0].total_dues),
            collectionRate,
            collectionGrowth: collectionTrend > 0 ? `+${collectionTrend}%` : `${collectionTrend}%`,
            statusBreakdown: statusBreakdown.rows,
            revenueTrend: trendResult.rows,
            topDefaulters: defaultersResult.rows
        });
    } catch (error) {
        console.error('Error fetching payment analytics:', error);
        res.status(500).json({ error: 'Failed to fetch payment analytics' });
    }
};

/**
 * Get complaint analytics
 */
export const getComplaintAnalytics = async (req: Request, res: Response) => {
    try {
        const { period = '30' } = req.query;
        const days = parseInt(period as string);

        // Total complaints (current)
        const totalResult = await pool.query(`
            SELECT COUNT(*) as total
            FROM complaints
            WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
        `);
        const currentTotal = parseInt(totalResult.rows[0].total);

        // Previous complaints (period before current)
        const prevTotalResult = await pool.query(`
            SELECT COUNT(*) as total
            FROM complaints
            WHERE created_at >= CURRENT_DATE - INTERVAL '${days * 2} days'
            AND created_at < CURRENT_DATE - INTERVAL '${days} days'
        `);
        const prevTotal = parseInt(prevTotalResult.rows[0].total) || 1;
        const totalTrend = Math.round(((currentTotal - prevTotal) / prevTotal) * 100);

        // Resolution rate (current)
        const resolutionResult = await pool.query(`
            SELECT 
                COALESCE(COUNT(CASE WHEN status = 'resolved' THEN 1 END), 0)::float as resolved,
                COALESCE(COUNT(*), 1)::float as total
            FROM complaints
            WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
        `);
        const resolutionRate = Math.round((parseFloat(resolutionResult.rows[0].resolved) / parseFloat(resolutionResult.rows[0].total)) * 100);

        // Resolution rate (previous)
        const prevResolutionResult = await pool.query(`
            SELECT 
                COALESCE(COUNT(CASE WHEN status = 'resolved' THEN 1 END), 0)::float as resolved,
                COALESCE(COUNT(*), 1)::float as total
            FROM complaints
            WHERE created_at >= CURRENT_DATE - INTERVAL '${days * 2} days'
            AND created_at < CURRENT_DATE - INTERVAL '${days} days'
        `);
        const prevResolutionRate = Math.round((parseFloat(prevResolutionResult.rows[0].resolved) / parseFloat(prevResolutionResult.rows[0].total)) * 100) || 1;
        const resolutionTrend = Math.round(((resolutionRate - prevResolutionRate) / prevResolutionRate) * 100);

        // Average resolution time (current)
        const avgTimeResult = await pool.query(`
            SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as avg_hours
            FROM complaints
            WHERE status = 'resolved'
            AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
        `);
        const currentAvgTime = parseFloat(avgTimeResult.rows[0]?.avg_hours || '0');

        // Average resolution time (previous)
        const prevAvgTimeResult = await pool.query(`
            SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as avg_hours
            FROM complaints
            WHERE status = 'resolved'
            AND created_at >= CURRENT_DATE - INTERVAL '${days * 2} days'
            AND created_at < CURRENT_DATE - INTERVAL '${days} days'
        `);
        const prevAvgTime = parseFloat(prevAvgTimeResult.rows[0]?.avg_hours || '0') || 1;
        const timeTrend = Math.round(((currentAvgTime - prevAvgTime) / prevAvgTime) * 100);

        // ... other existing logic for statusBreakdown, categoryBreakdown, dailyTrend ...
        const statusResult = await pool.query(`
            SELECT status, COUNT(*) as count FROM complaints
            WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
            GROUP BY status
        `);

        const categoryResult = await pool.query(`
            SELECT category, COUNT(*) as count FROM complaints
            WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
            GROUP BY category
            ORDER BY count DESC
        `);

        const trendResult = await pool.query(`
            SELECT DATE(created_at) as date, COUNT(*) as count FROM complaints
            WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);

        res.json({
            totalComplaints: currentTotal,
            totalGrowth: totalTrend > 0 ? `+${totalTrend}%` : `${totalTrend}%`,
            resolutionRate,
            resolutionGrowth: resolutionTrend > 0 ? `+${resolutionTrend}%` : `${resolutionTrend}%`,
            avgResolutionTime: currentAvgTime.toFixed(1),
            timeGrowth: timeTrend > 0 ? `+${timeTrend}%` : `${timeTrend}%`,
            statusBreakdown: statusResult.rows,
            categoryBreakdown: categoryResult.rows,
            dailyTrend: trendResult.rows
        });
    } catch (error) {
        console.error('Error fetching complaint analytics:', error);
        res.status(500).json({ error: 'Failed to fetch complaint analytics' });
    }
};

/**
 * Get attendance analytics
 */
export const getAttendanceAnalytics = async (req: Request, res: Response) => {
    try {
        const { period = '30' } = req.query;
        const days = parseInt(period as string);

        // Today's attendance (current)
        const todayResult = await pool.query(`
            SELECT 
                COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
                COUNT(*) as total
            FROM attendance
            WHERE DATE(date) = CURRENT_DATE
        `);
        const todayPresent = parseInt(todayResult.rows[0]?.present || '0');
        const todayTotal = parseInt(todayResult.rows[0]?.total || '1');
        const todayRate = Math.round((todayPresent / todayTotal) * 100);

        // Yesterday's attendance (for trend)
        const yesterdayResult = await pool.query(`
            SELECT 
                COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
                COUNT(*) as total
            FROM attendance
            WHERE DATE(date) = CURRENT_DATE - INTERVAL '1 day'
        `);
        const yesterdayPresent = parseInt(yesterdayResult.rows[0]?.present || '0') || 1;
        const attendanceTrend = Math.round(((todayPresent - yesterdayPresent) / yesterdayPresent) * 100);

        // Weekly average (current)
        const weeklyResult = await pool.query(`
            SELECT AVG(CASE WHEN status = 'present' THEN 1.0 ELSE 0.0 END) * 100 as avg_rate
            FROM attendance
            WHERE date >= CURRENT_DATE - INTERVAL '7 days'
        `);
        const currentWeeklyRate = parseFloat(weeklyResult.rows[0]?.avg_rate || '0');

        // Previous weekly average
        const prevWeeklyResult = await pool.query(`
            SELECT AVG(CASE WHEN status = 'present' THEN 1.0 ELSE 0.0 END) * 100 as avg_rate
            FROM attendance
            WHERE date >= CURRENT_DATE - INTERVAL '14 days'
            AND date < CURRENT_DATE - INTERVAL '7 days'
        `);
        const prevWeeklyRate = parseFloat(prevWeeklyResult.rows[0]?.avg_rate || '0') || 1;
        const weeklyTrend = Math.round(((currentWeeklyRate - prevWeeklyRate) / prevWeeklyRate) * 100);

        // ... rest of attendance logic ...
        const trendResult = await pool.query(`
            SELECT DATE(date) as date, COUNT(CASE WHEN status = 'present' THEN 1 END) as present, COUNT(*) as total
            FROM attendance
            WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
            GROUP BY DATE(date)
            ORDER BY date ASC
        `);

        const statusResult = await pool.query(`
            SELECT status, COUNT(*) as count FROM attendance
            WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
            GROUP BY status
        `);

        res.json({
            todayPresent,
            todayTotal,
            attendanceGrowth: attendanceTrend > 0 ? `+${attendanceTrend}` : `${attendanceTrend}`,
            todayRate,
            weeklyAvgRate: currentWeeklyRate.toFixed(1),
            weeklyGrowth: weeklyTrend > 0 ? `+${weeklyTrend}%` : `${weeklyTrend}%`,
            dailyTrend: trendResult.rows.map(row => ({
                date: row.date,
                rate: Math.round((parseInt(row.present) / parseInt(row.total)) * 100),
                present: parseInt(row.present),
                total: parseInt(row.total)
            })),
            statusBreakdown: statusResult.rows
        });
    } catch (error) {
        console.error('Error fetching attendance analytics:', error);
        res.status(500).json({ error: 'Failed to fetch attendance analytics' });
    }
};

/**
 * Get complaint trends (last 30 days)
 */
export const getComplaintTrends = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT 
                DATE(created_at) as date,
                category,
                COUNT(*) as count
            FROM complaints
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY DATE(created_at), category
            ORDER BY date ASC
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching complaint trends:', error);
        res.status(500).json({ error: 'Failed to fetch complaint trends' });
    }
};

/**
 * Get room occupancy breakdown
 */
export const getRoomOccupancy = async (req: Request, res: Response) => {
    try {
        // Check if rooms table exists and has data
        const result = await pool.query(`
            SELECT 
                COUNT(*) FILTER (WHERE capacity > 0) as occupied,
                COUNT(*) FILTER (WHERE capacity = 0 OR capacity IS NULL) as vacant
            FROM rooms
        `);

        const occupied = parseInt(result.rows[0]?.occupied || '0');
        const vacant = parseInt(result.rows[0]?.vacant || '0');

        // Return in expected format
        res.json([
            { status: 'Occupied', count: occupied },
            { status: 'Vacant', count: vacant }
        ]);
    } catch (error) {
        console.error('Error fetching room occupancy:', error);
        // Return empty data instead of error to allow frontend to load
        res.json([
            { status: 'Occupied', count: 0 },
            { status: 'Vacant', count: 0 }
        ]);
    }
};

/**
 * Get leave request statistics
 */
export const getLeaveRequestStats = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT 
                status,
                COUNT(*) as count
            FROM leave_requests
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY status
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching leave request stats:', error);
        res.status(500).json({ error: 'Failed to fetch leave request statistics' });
    }
};

/**
 * Get recent activity feed
 */
export const getRecentActivity = async (req: Request, res: Response) => {
    try {
        const allActivities: any[] = [];

        // Get recent complaints (safe query)
        try {
            const complaints = await pool.query(`
                SELECT 
                    'complaint' as type,
                    id,
                    COALESCE(category, 'Complaint') as title,
                    COALESCE(description, '') as description,
                    created_at,
                    student_id
                FROM complaints
                ORDER BY created_at DESC
                LIMIT 5
            `);
            allActivities.push(...complaints.rows);
        } catch (e) {
            console.log('Complaints query failed:', e);
        }

        // Get recent leave requests (safe query)
        try {
            const leaves = await pool.query(`
                SELECT 
                    'leave' as type,
                    id,
                    COALESCE(reason, 'Leave Request') as title,
                    COALESCE(start_date::text, '') || ' to ' || COALESCE(end_date::text, '') as description,
                    created_at,
                    student_id
                FROM leave_requests
                ORDER BY created_at DESC
                LIMIT 5
            `);
            allActivities.push(...leaves.rows);
        } catch (e) {
            console.log('Leave requests query failed:', e);
        }

        // Get recent student enrollments (safe query)
        try {
            const students = await pool.query(`
                SELECT 
                    'enrollment' as type,
                    s.id,
                    COALESCE(u.full_name, 'Student') as title,
                    'New student enrolled' as description,
                    s.created_at,
                    s.id as student_id
                FROM students s
                JOIN users u ON s.user_id = u.id
                ORDER BY s.created_at DESC
                LIMIT 5
            `);
            allActivities.push(...students.rows);
        } catch (e) {
            console.log('Students query failed:', e);
        }

        // Combine and sort by date
        const sortedActivities = allActivities
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 10);

        res.json(sortedActivities);
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        // Return empty array instead of error
        res.json([]);
    }
};

/**
 * Get payment statistics
 */
export const getPaymentStats = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT 
                status,
                COUNT(*) as count,
                SUM(amount) as total_amount
            FROM payments
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY status
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching payment stats:', error);
        res.status(500).json({ error: 'Failed to fetch payment statistics' });
    }
};
