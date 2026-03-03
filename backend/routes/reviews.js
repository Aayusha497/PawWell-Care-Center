/**
 * Review Routes
 * 
 * Defines all routes for review and rating management
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const {
  createReview,
  getReviews,
  getReviewStats,
  getMyReviews,
  getReviewableBookings,
  updateReview,
  deleteReview,
  getAllReviews,
  approveReview,
} = require('../controllers/reviewController');

/**
 * @route   GET /api/reviews
 * @desc    Get all approved reviews (public)
 * @access  Public
 */
router.get('/', getReviews);

/**
 * @route   GET /api/reviews/stats
 * @desc    Get review statistics
 * @access  Public
 */
router.get('/stats', getReviewStats);

/**
 * @route   GET /api/reviews/my-reviews
 * @desc    Get current user's reviews
 * @access  Private
 */
router.get('/my-reviews', authenticate, getMyReviews);

/**
 * @route   GET /api/reviews/reviewable-bookings
 * @desc    Get completed bookings that can be reviewed
 * @access  Private
 */
router.get('/reviewable-bookings', authenticate, getReviewableBookings);

/**
 * @route   POST /api/reviews
 * @desc    Create a new review
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  upload.single('photo'),
  createReview
);

/**
 * @route   PUT /api/reviews/:id
 * @desc    Update a review
 * @access  Private (owner only)
 */
router.put(
  '/:id',
  authenticate,
  upload.single('photo'),
  updateReview
);

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete a review
 * @access  Private (owner or admin)
 */
router.delete('/:id', authenticate, deleteReview);

/**
 * @route   GET /api/reviews/admin/all
 * @desc    Get all reviews (including unapproved) - Admin
 * @access  Private (admin, staff)
 */
router.get('/admin/all', authenticate, getAllReviews);

/**
 * @route   PATCH /api/reviews/:id/approve
 * @desc    Approve/reject or feature a review - Admin
 * @access  Private (admin, staff)
 */
router.patch('/:id/approve', authenticate, approveReview);

module.exports = router;
