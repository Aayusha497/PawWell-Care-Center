/**
 * Booking Routes
 * 
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
  getAllBookings
} = require('../controllers/bookingController');

// Public routes (require authentication)
router.post('/check-availability', authenticate, checkAvailability);
router.post('/', authenticate, createBooking);
router.get('/', authenticate, getUserBookings);
router.get('/:bookingId', authenticate, getBookingById);
router.put('/:bookingId', authenticate, updateBooking);
router.delete('/:bookingId', authenticate, cancelBooking);

// Admin routes
router.get('/admin/pending', authenticate, requireAdmin, getPendingBookings);
router.get('/admin/all', authenticate, requireAdmin, getAllBookings);
router.put('/admin/:bookingId/approve', authenticate, requireAdmin, approveBooking);
router.put('/admin/:bookingId/reject', authenticate, requireAdmin, rejectBooking);

module.exports = router;
