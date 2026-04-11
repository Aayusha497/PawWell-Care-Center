/**
 * Review Routes
 * 
 * Defines all routes for review and rating management
 * Flow:
 * 1. User submits review (confirmed + completed + paid booking) → is_approved = false
 * 2. Admin approves/rejects → is_approved = true/false
 * 3. Admin can feature → is_featured = true
 * 4. Public sees only approved + featured reviews
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const {
  createReview,
  getApprovedReviews,
  getFeaturedReviews,
  getReviewStats,
  getMyReviews,
  getReviewableBookings,
  updateReview,
  deleteReview,
  getAllReviews,
  approveReview,
  featureReview,
} = require('../controllers/reviewController');

//  PUBLIC ROUTES 

/**
 * @route   GET /api/reviews/stats
 * @desc    Get review statistics (only approved reviews)
 * @access  Public
 */
router.get('/stats', getReviewStats);

/**
 * @route   GET /api/reviews/featured
 * @desc    Get featured reviews for landing page
 * @access  Public
 */
router.get('/featured', getFeaturedReviews);

/**
 * @route   GET /api/reviews
 * @desc    Get all approved reviews with filters
 * @access  Public
 */
router.get('/', getApprovedReviews);

// ========== PRIVATE ROUTES (User) ==========

/**
 * @route   POST /api/reviews
 * @desc    Create a new review (requires confirmed + completed + paid booking)
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  createReview
);

/**
 * @route   GET /api/reviews/my-reviews
 * @desc    Get current user's reviews (both pending and approved)
 * @access  Private
 */
router.get('/my-reviews', authenticate, getMyReviews);

/**
 * @route   GET /api/reviews/reviewable-bookings
 * @desc    Get completed and paid bookings eligible for review
 * @access  Private
 */
router.get('/reviewable-bookings', authenticate, getReviewableBookings);

/**
 * @route   PUT /api/reviews/:id
 * @desc    Update a review (only if not approved yet)
 * @access  Private (owner only)
 */
router.put('/:id', authenticate, updateReview);

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete a review (owner can delete pending, admin can delete any)
 * @access  Private (owner or admin)
 */
router.delete('/:id', authenticate, deleteReview);

// ========== ADMIN ROUTES ==========

/**
 * @route   GET /api/reviews/admin/all
 * @desc    Get all reviews (pending + approved)
 * @access  Private (admin/staff only)
 */
router.get('/admin/all', authenticate, getAllReviews);

/**
 * @route   PATCH /api/reviews/:id/approve
 * @desc    Approve or reject a review
 * @access  Private (admin/staff only)
 */
router.patch('/:id/approve', authenticate, approveReview);

/**
 * @route   PATCH /api/reviews/:id/feature
 * @desc    Feature or unfeature an approved review
 * @access  Private (admin/staff only)
 */
router.patch('/:id/feature', authenticate, featureReview);

module.exports = router;
