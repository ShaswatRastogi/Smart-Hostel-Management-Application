import express from 'express';
import {
    getAttendanceAnalytics,
    getComplaintAnalytics,
    getComplaintTrends,
    getLeaveRequestStats,
    getOverviewStats,
    getPaymentAnalytics,
    getPaymentStats,
    getRecentActivity,
    getRoomOccupancy
} from '../controllers/analyticsController';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// All analytics routes require authentication
router.use(requireAuth);

// Overview statistics
router.get('/overview', getOverviewStats);

// Comprehensive analytics (Phase 1)
router.get('/payments/detailed', getPaymentAnalytics);
router.get('/complaints/detailed', getComplaintAnalytics);
router.get('/attendance/detailed', getAttendanceAnalytics);

// Complaint trends
router.get('/complaints/trends', getComplaintTrends);

// Room occupancy
router.get('/rooms/occupancy', getRoomOccupancy);

// Leave request statistics
router.get('/leaves/stats', getLeaveRequestStats);

// Payment statistics
router.get('/payments/stats', getPaymentStats);

// Recent activity feed
router.get('/activity/recent', getRecentActivity);

export default router;
