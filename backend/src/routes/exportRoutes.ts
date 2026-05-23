import { Router } from 'express';
import {
    exportAttendance,
    exportComplaints,
    exportLeaveRequests,
    exportPayments,
    exportStudents,
    getExportFilters
} from '../controllers/exportController';
import { requireStaffOrHigher, requireAuth } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Get distinct filter options (admin only)
router.get('/filters', requireStaffOrHigher, getExportFilters);

// Student exports (admin only)
router.get('/students', requireStaffOrHigher, exportStudents);

// Attendance exports (admin only)
router.get('/attendance', requireStaffOrHigher, exportAttendance);

// Complaints exports (admin only)
router.get('/complaints', requireStaffOrHigher, exportComplaints);

// Payments exports (admin only)
router.get('/payments', requireStaffOrHigher, exportPayments);

// Leave requests exports (admin only)
router.get('/leave-requests', requireStaffOrHigher, exportLeaveRequests);

export default router;
