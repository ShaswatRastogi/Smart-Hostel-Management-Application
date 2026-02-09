import { Router } from 'express';
import {
    createEmergencyContact,
    deleteEmergencyContact,
    getBusTimings,
    getEmergencyContacts,
    getMessMenu,
    getNotices,
    updateEmergencyContact,
    updateMessMenu
} from '../controllers/infoController';
import {
    createComplaint,
    createLaundryRequest,
    createLeaveRequest,
    createPaymentRequest,
    createServiceRequest,
    deletePayment,
    getAllComplaints,
    getAllLaundryRequests,
    getAllLeaves,
    getAllPayments,
    getAllServiceRequests,
    getLaundryRequests,
    getLaundrySettings,
    getLeaveRequests,
    getMyComplaints,
    getMyPayments,
    getPaymentsByStudentId,
    getServiceRequests,
    recordPayment,
    updateComplaintStatus,
    updateLaundrySettings,
    updateLeaveStatus,
    updateServiceRequestStatus,
    verifyPayment
} from '../controllers/serviceController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Public / Info Routes
router.get('/notices', requireAuth, getNotices);
router.get('/mess', requireAuth, getMessMenu);
router.post('/mess/update', requireAuth, updateMessMenu); // Admin only ideal, but auth for now
router.get('/bus', requireAuth, getBusTimings);

// Contacts
router.get('/contacts', requireAuth, getEmergencyContacts);
router.post('/contacts', requireAuth, createEmergencyContact);
router.put('/contacts/:id', requireAuth, updateEmergencyContact);
router.delete('/contacts/:id', requireAuth, deleteEmergencyContact);

// Service Routes
router.get('/complaints', requireAuth, getMyComplaints);
router.post('/complaints', requireAuth, createComplaint);
router.get('/complaints/all', requireAuth, getAllComplaints); // Admin
router.put('/complaints/:id/status', requireAuth, updateComplaintStatus); // Admin

router.get('/payments', requireAuth, getMyPayments);
router.post('/payments/:id/pay', requireAuth, verifyPayment); // Student Pay
router.put('/payments/:id/verify', requireAuth, verifyPayment); // Admin Verify
router.post('/payments/request', requireAuth, createPaymentRequest); // Admin Create Request
router.post('/payments/record', requireAuth, recordPayment); // Admin Record Cash
router.get('/payments/all', requireAuth, getAllPayments); // Admin View All
router.get('/payments/student/:id', requireAuth, getPaymentsByStudentId); // Admin View Student
router.delete('/payments/:id', requireAuth, deletePayment); // Admin Delete

// Generic Service Requests
router.get('/requests', requireAuth, getServiceRequests);
router.post('/requests', requireAuth, createServiceRequest);
router.get('/requests/all', requireAuth, getAllServiceRequests); // Admin
router.put('/requests/:id', requireAuth, updateServiceRequestStatus); // Admin

// Laundry (Student)
router.get('/laundry', requireAuth, getLaundryRequests);
router.post('/laundry', requireAuth, createLaundryRequest);

// Laundry (Settings & Admin)
router.get('/laundry/settings', requireAuth, getLaundrySettings);
router.post('/laundry/settings', requireAuth, updateLaundrySettings);
router.get('/laundry/all', requireAuth, getAllLaundryRequests);

// Leaves
router.get('/leaves', requireAuth, getLeaveRequests);
router.post('/leaves', requireAuth, createLeaveRequest);
router.get('/leaves/all', requireAuth, getAllLeaves); // Admin
router.put('/leaves/:id', requireAuth, updateLeaveStatus); // Admin

export default router;
