
import { Router } from 'express';
import {
    clearNotifications,
    createStudent,
    deleteStudent,
    getAllStudents,
    getDashboardCounts,
    getStudentById,
    getStudentProfile,
    searchStudents,
    updateStudent,
    updateStudentProfilePhoto,
    updateStudentSelfProfile,
    exportStudentData
} from '../controllers/studentController';
import { requireStaffOrHigher, requireWardenOrOwner, requireAuth } from '../middleware/auth';
import { logUpload, upload } from '../middleware/uploadMiddleware';

const router = Router();

// Student Self-View
router.get('/profile', requireAuth, getStudentProfile);
// Student Dashboard Counts
router.get('/dashboard/counts', requireAuth, getDashboardCounts);
// Student Update Photo
router.post('/profile/photo', requireAuth, logUpload, upload.single('profilePhoto'), updateStudentProfilePhoto);
// Student Clear Notifications
router.post('/profile/notifications/clear', requireAuth, clearNotifications);
// Student Update Profile (Self)
router.put('/profile', requireAuth, updateStudentSelfProfile);
// Student Request Data Export
router.post('/export-data', requireAuth, exportStudentData);

// Admin Routes
router.get('/all', requireAuth, requireStaffOrHigher, getAllStudents);
router.post('/allot', requireAuth, requireWardenOrOwner, logUpload, (req, res, next) => {
    upload.single('profilePhoto')(req, res, (err: any) => {
        if (err) {
            console.error('Multer Error:', err);
            return res.status(400).json({ error: 'File upload error: ' + err.message });
        }
        next();
    });
}, createStudent);
router.get('/:id', requireAuth, requireStaffOrHigher, getStudentById);
router.delete('/:id', requireAuth, requireWardenOrOwner, deleteStudent);
router.put('/:id', requireAuth, requireWardenOrOwner, logUpload, upload.single('profilePhoto'), updateStudent);
router.post('/search', requireAuth, requireStaffOrHigher, searchStudents);

export default router;
