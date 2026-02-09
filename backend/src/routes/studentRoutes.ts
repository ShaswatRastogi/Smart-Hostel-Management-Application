
import { Router } from 'express';
import {
    clearNotifications,
    createStudent,
    deleteStudent,
    getAllStudents,
    getStudentById,
    getStudentProfile,
    searchStudents,
    updateStudent,
    updateStudentProfilePhoto
} from '../controllers/studentController';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { logUpload, upload } from '../middleware/uploadMiddleware';

const router = Router();

// Student Self-View
router.get('/profile', requireAuth, getStudentProfile);
// Student Update Photo
router.post('/profile/photo', requireAuth, logUpload, upload.single('profilePhoto'), updateStudentProfilePhoto);
// Student Clear Notifications
router.post('/profile/notifications/clear', requireAuth, clearNotifications);

// Admin Routes
router.get('/all', requireAuth, requireAdmin, getAllStudents);
router.post('/allot', requireAuth, requireAdmin, logUpload, upload.single('profilePhoto'), createStudent);
router.get('/:id', requireAuth, requireAdmin, getStudentById);
router.delete('/:id', requireAuth, requireAdmin, deleteStudent);
router.put('/:id', requireAuth, requireAdmin, logUpload, upload.single('profilePhoto'), updateStudent);
router.post('/search', requireAuth, requireAdmin, searchStudents);

export default router;
