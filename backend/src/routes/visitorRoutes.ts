import express from 'express';
import {
    approveVisitor,
    cancelVisitor,
    checkInVisitor,
    checkOutVisitor,
    getActiveVisitors,
    getAllVisitors,
    getMyVisitors,
    getPendingVisitors,
    getVisitorById,
    registerVisitor,
    rejectVisitor,
    verifyQRCode
} from '../controllers/visitorController';
import { requireStaffOrHigher, requireAuth } from '../middleware/auth';

const router = express.Router();

// Student routes
router.post('/register', requireAuth, registerVisitor);
router.get('/my-visitors', requireAuth, getMyVisitors);
router.get('/:id', requireAuth, getVisitorById);
router.put('/:id/cancel', requireAuth, cancelVisitor);

// Admin routes
router.get('/admin/pending', requireAuth, requireStaffOrHigher, getPendingVisitors);
router.get('/admin/active', requireAuth, requireStaffOrHigher, getActiveVisitors);
router.get('/admin/all', requireAuth, requireStaffOrHigher, getAllVisitors);
router.put('/:id/approve', requireAuth, requireStaffOrHigher, approveVisitor);
router.put('/:id/reject', requireAuth, requireStaffOrHigher, rejectVisitor);

// Check-in/Check-out routes (admin or security)
router.put('/:id/check-in', requireAuth, requireStaffOrHigher, checkInVisitor);
router.put('/:id/check-out', requireAuth, requireStaffOrHigher, checkOutVisitor);

// QR verification route
router.get('/verify/:qrCode', requireAuth, verifyQRCode);

export default router;
