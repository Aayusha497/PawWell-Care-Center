/**
 * Booking Routes 
 * API endpoints for booking management
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
  checkAvailability,
  createBooking,
  getUserBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  getPendingBookings,
  approveBooking,
  rejectBooking,
  initiateKhaltiPayment,
  verifyKhaltiPayment,
  completeBooking,
  getAllBookings,
  getAdminBookingHistory,
  getBookingsSummary
} = require('../controllers/bookingController');

// Public routes (require authentication)
router.post('/check-availability', authenticate, checkAvailability);
router.post('/payment/initiate', authenticate, initiateKhaltiPayment); //backedn ednpoint to initiate khalti payment.

// Add console output whenever verify endpoint is accessed
router.post('/payment/verify', authenticate, (req, res, next) => {
  console.log('\n PAYMENT VERIFY ENDPOINT ACCESSED ');
  console.log('📨 Request Details:');
  console.log('   - Body:', JSON.stringify(req.body));
  console.log('   - User ID:', req.user?.id);
  console.log('   - User Email:', req.user?.email);
  console.log('   - User Type:', req.user?.userType);
  console.log('   - Token present:', !!req.headers.authorization);
  console.log('   - Content-Type:', req.headers['content-type']);
  console.log('╚════════════════════════════════════════════════════════╝\n');
  next();
}, verifyKhaltiPayment);

// Diagnostic endpoint to check system status
router.get('/payment/diagnostic', authenticate, (req, res) => {
  const config = require('../config/config');
  
  return res.status(200).json({
    success: true,
    message: 'Payment system diagnostic',
    system: {
      khalti_secret_configured: !!config.khalti.secretKey,
      khalti_initiate_url: config.khalti.initiateUrl,
      khalti_lookup_url: config.khalti.lookupUrl,
      node_env: config.NODE_ENV,
      frontend_url: config.frontendUrl
    },
    endpoints: {
      initiate: 'POST /api/bookings/payment/initiate',
      verify: 'POST /api/bookings/payment/verify',
      diagnostic: 'GET /api/bookings/payment/diagnostic'
    },
    timestamp: new Date().toISOString()
  });
});

router.post('/', authenticate, createBooking);

// Get summary of all booking categories (upcoming, manage, history)
router.get('/summary', authenticate, getBookingsSummary);

// Admin routes (MUST come before /:bookingId to be properly matched)
router.get('/admin/pending', authenticate, requireAdmin, getPendingBookings);
router.get('/admin/history', authenticate, requireAdmin, getAdminBookingHistory);
router.get('/admin/all', authenticate, requireAdmin, getAllBookings);
router.put('/admin/:bookingId/approve', authenticate, requireAdmin, approveBooking);
router.put('/admin/:bookingId/reject', authenticate, requireAdmin, rejectBooking);
router.put('/admin/:bookingId/complete', authenticate, requireAdmin, completeBooking);

// User routes (must come after admin routes)
router.get('/', authenticate, getUserBookings);
router.get('/:bookingId', authenticate, getBookingById);
router.put('/:bookingId', authenticate, updateBooking);
router.delete('/:bookingId', authenticate, cancelBooking);

module.exports = router;
