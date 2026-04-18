/**
 * Review Controller
 * 
 * Handles review and rating operations for completed and paid bookings
 * Requirements:
 * - Booking must be confirmed
 * - Payment must be made
 * - Service must be completed
 * - Admin approval required before public display
 */

const { Review, Booking, Pet, User, Payment } = require('../models');
const { Op } = require('sequelize');

/**
 * Create a new review
 * POST /api/reviews
 */
const createReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      booking_id,
      rating,
      comment
    } = req.body;

    console.log('📝 Creating review:', { booking_id, rating, comment: comment?.substring(0, 50) });

    // Validate required fields
    if (!booking_id) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required',
      });
    }

    if (!rating) {
      return res.status(400).json({
        success: false,
        message: 'Rating is required',
      });
    }

    // Validate rating value (1-5)
    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be a number between 1 and 5',
      });
    }

    // Check if booking exists
    const booking = await Booking.findByPk(booking_id, {
      include: [
        { model: Pet, as: 'pet' },
        { model: User, as: 'user' }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check if user owns this booking
    if (booking.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only review your own bookings',
      });
    }

    // Service must be completed
    if (booking.booking_status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: `Booking must be completed to review. Current status: ${booking.booking_status}`,
      });
    }

    //  Payment must be made
    if (booking.payment_status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment must be completed before submitting a review',
      });
    }

    // Prevent duplicate reviews
    const existingReview = await Review.findOne({
      where: { booking_id }
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this booking',
      });
    }

    // All validations passed - Create review
    const review = await Review.create({
      booking_id: parseInt(booking_id),
      user_id: userId,
      pet_id: booking.pet_id,
      service_type: booking.service_type,
      rating: ratingNum,
      comment: comment?.trim() || null,
      is_approved: false,  // ⚠️ Requires admin approval
      is_featured: false,
      rejection_reason: null
    });

    console.log(`Review #${review.review_id} created (pending approval)`);

    // Fetch created review with associations
    const createdReview = await Review.findByPk(review.review_id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'profile_picture'],
        },
        {
          model: Pet,
          as: 'pet',
          attributes: ['pet_id', 'name', 'breed'],
        },
        {
          model: Booking,
          as: 'booking',
          attributes: ['booking_id', 'service_type', 'start_date', 'end_date'],
        },
      ],
    });

    // Notify user that review is submitted and awaiting approval
    try {
      const { Notification } = require('../models');
      await Notification.create({
        user_id: userId,
        type: 'review_submitted',
        title: 'Review Submitted',
        message: 'Thank you for submitting your review! It is now pending admin approval and will be visible to other customers once approved.',
        reference_type: 'review',
        reference_id: review.review_id,
        is_read: false,
      });
      console.log(`📧 User notification created for review #${review.review_id}`);
    } catch (notifError) {
      console.error('❌ Error creating user notification:', notifError.message);
    }

    // Notify admins about new pending review
    try {
      const { Notification } = require('../models');
      const adminUsers = await User.findAll({
        where: { userType: 'admin' },
        attributes: ['id']
      });

      if (adminUsers.length > 0) {
        const adminNotifications = adminUsers.map(admin => ({
          user_id: admin.id,
          type: 'new_review',
          title: 'New Review Pending Approval',
          message: `New review submitted by ${booking.user.first_name} ${booking.user.last_name} for ${booking.service_type} service. Rating: ${ratingNum}/5. Please review and approve/reject.`,
          reference_type: 'review',
          reference_id: review.review_id,
          is_read: false,
        }));

        await Notification.bulkCreate(adminNotifications);
        console.log(`Admin notifications created for review #${review.review_id}`);
      }
    } catch (notifError) {
      console.error('Error creating admin notifications:', notifError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully! It is awaiting admin approval.',
      data: createdReview,
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create review',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get approved and featured reviews (public display)
 * GET /api/reviews/featured
 */
const getFeaturedReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, service_type } = req.query;

    console.log('Fetching featured reviews:', { service_type, page, limit });

    const whereClause = {
      is_approved: true,   // Must be approved
      is_featured: true    // Must be featured
    };

    if (service_type) {
      whereClause.service_type = service_type;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: reviews } = await Review.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'profile_picture'],
        },
        {
          model: Pet,
          as: 'pet',
          attributes: ['pet_id', 'name', 'breed'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
    });

    console.log(`✅ Found ${count} featured reviews`);

    res.status(200).json({
      success: true,
      count: count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      data: reviews,
    });
  } catch (error) {
    console.error('❌ Error fetching featured reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get all approved reviews (public display with filters)
 * GET /api/reviews
 */
const getApprovedReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, service_type, min_rating } = req.query;

    console.log('📊 Fetching approved reviews:', { service_type, min_rating, page, limit });

    const whereClause = {
      is_approved: true   // ✅ Only approved reviews
    };

    if (service_type) {
      whereClause.service_type = service_type;
    }

    if (min_rating) {
      whereClause.rating = { [Op.gte]: parseInt(min_rating) };
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: reviews } = await Review.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'profile_picture'],
        },
        {
          model: Pet,
          as: 'pet',
          attributes: ['pet_id', 'name', 'breed'],
        },
      ],
      order: [
        ['is_featured', 'DESC'],
        ['created_at', 'DESC']
      ],
      limit: parseInt(limit),
      offset: offset,
    });

    console.log(`✅ Found ${count} approved reviews`);

    res.status(200).json({
      success: true,
      count: count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      data: reviews,
    });
  } catch (error) {
    console.error('❌ Error fetching approved reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get review statistics (only for approved reviews)
 * GET /api/reviews/stats
 */
const getReviewStats = async (req, res) => {
  try {
    const stats = await Review.findOne({
      where: { is_approved: true },
      attributes: [
        ['rating', 'avg_rating'],
        ['review_id', 'total_count'],
      ],
      raw: true,
    });

    // Calculate average rating from approved reviews
    const approvedReviews = await Review.findAll({
      where: { is_approved: true },
      attributes: ['rating'],
      raw: true,
    });

    const avgRating = approvedReviews.length > 0
      ? (approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length).toFixed(1)
      : 0;

    const totalCount = approvedReviews.length;

    // Get rating distribution
    const distribution = await Review.count({
      where: { is_approved: true },
      group: ['rating'],
      raw: true,
      subQuery: false,
    });

    console.log(`📊 Review stats: avg=${avgRating}, total=${totalCount}`);

    res.status(200).json({
      success: true,
      data: {
        averageRating: avgRating,
        totalReviews: totalCount,
        distribution: distribution,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching review stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get user's own reviews
 * GET /api/reviews/my-reviews
 */
const getMyReviews = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`📋 Fetching reviews for user ${userId}`);

    const reviews = await Review.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Pet,
          as: 'pet',
          attributes: ['pet_id', 'name', 'breed'],
        },
        {
          model: Booking,
          as: 'booking',
          attributes: ['booking_id', 'service_type', 'start_date', 'end_date'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    console.log(`✅ Found ${reviews.length} reviews for user`);

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    console.error('❌ Error fetching user reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your reviews',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get reviewable bookings for current user
 * GET /api/reviews/reviewable-bookings
 */
const getReviewableBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`📋 Fetching reviewable bookings for user ${userId}`);

    // Get completed bookings with payment made, without reviews
    const bookings = await Booking.findAll({
      where: {
        user_id: userId,
        booking_status: 'completed',
        payment_status: 'paid'
      },
      include: [
        {
          model: Pet,
          as: 'pet',
          attributes: ['pet_id', 'name', 'breed', 'photo'],
        },
        {
          model: Review,
          as: 'review',
          required: false,
        }
      ],
      order: [['end_date', 'DESC']],
    });

    console.log(`Found ${bookings.length} completed bookings`);

    // Filter: only bookings without reviews
    const reviewableBookings = bookings.filter(
      booking => !booking.review
    );

    console.log(` ${reviewableBookings.length} bookings are reviewable`);

    res.status(200).json({
      success: true,
      count: reviewableBookings.length,
      data: reviewableBookings,
    });
  } catch (error) {
    console.error('❌ Error fetching reviewable bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviewable bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Update review (user can update their own review if not yet approved)
 * PUT /api/reviews/:id
 */
const updateReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const reviewId = parseInt(req.params.id);
    const { rating, comment } = req.body;

    console.log(`Updating review #${reviewId}`);

    const review = await Review.findByPk(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Only owner can update
    if (review.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own reviews',
      });
    }

    // Can't update if already approved
    if (review.is_approved) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update an approved review',
      });
    }

    const updateData = {};

    if (rating !== undefined) {
      const ratingNum = parseInt(rating);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5',
        });
      }
      updateData.rating = ratingNum;
    }

    if (comment !== undefined) {
      updateData.comment = comment?.trim() || null;
    }

    await review.update(updateData);

    console.log(`✅ Review #${reviewId} updated`);

    const updatedReview = await Review.findByPk(reviewId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name'],
        },
        {
          model: Pet,
          as: 'pet',
          attributes: ['pet_id', 'name', 'breed'],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: updatedReview,
    });
  } catch (error) {
    console.error('❌ Error updating review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Delete review (user can delete if not approved, admin can delete anytime)
 * DELETE /api/reviews/:id
 */
const deleteReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.userType;
    const reviewId = parseInt(req.params.id);

    console.log(`🗑️ Deleting review #${reviewId}`);

    const review = await Review.findByPk(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // User can only delete if not approved; admin can delete anytime
    if (review.user_id !== userId && userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this review',
      });
    }

    if (review.user_id === userId && review.is_approved && userType !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an approved review',
      });
    }

    await review.destroy();

    console.log(`✅ Review #${reviewId} deleted`);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Admin: Get all reviews (both approved and pending)
 * GET /api/reviews/admin/all
 */
const getAllReviews = async (req, res) => {
  try {
    const userType = req.user.userType;

    if (userType !== 'admin' && userType !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Admin or staff access required',
      });
    }

    const { page = 1, limit = 10, status } = req.query;

    console.log(`📊 Admin fetching reviews with status: ${status || 'all'}`);

    const whereClause = {};
    if (status === 'pending') {
      whereClause.is_approved = false;
    } else if (status === 'approved') {
      whereClause.is_approved = true;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: reviews } = await Review.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email', 'profile_picture'],
        },
        {
          model: Pet,
          as: 'pet',
          attributes: ['pet_id', 'name', 'breed'],
        },
        {
          model: Booking,
          as: 'booking',
          attributes: ['booking_id', 'service_type', 'start_date', 'end_date'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
    });

    console.log(`✅ Found ${count} reviews for admin`);

    res.status(200).json({
      success: true,
      count: count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      data: reviews,
    });
  } catch (error) {
    console.error('❌ Error fetching all reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Admin: Approve or reject a review
 * PATCH /api/reviews/:id/approve
 */
const approveReview = async (req, res) => {
  try {
    const userType = req.user.userType;
    const reviewId = parseInt(req.params.id);
    const { is_approved, rejection_reason } = req.body;

    console.log(`📝 Admin approval request for review #${reviewId}:`, { is_approved, rejection_reason });

    if (userType !== 'admin' && userType !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Admin or staff access required',
      });
    }

    const review = await Review.findByPk(reviewId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email'],
        },
      ],
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    const updateData = {
      is_approved: is_approved === true,
    };

    if (is_approved === false) {
      updateData.rejection_reason = rejection_reason || 'Review does not meet our guidelines';
    } else {
      updateData.rejection_reason = null;
    }

    await review.update(updateData);

    console.log(`✅ Review #${reviewId} ${is_approved ? 'APPROVED' : 'REJECTED'}`);

    // 📧 Notify user about approval/rejection
    try {
      const { Notification } = require('../models');
      await Notification.create({
        user_id: review.user_id,
        type: is_approved ? 'review_approved' : 'review_rejected',
        title: is_approved ? 'Your Review is Approved!' : 'Your Review Was Rejected',
        message: is_approved
          ? 'Congratulations! Your review has been approved and is now visible to other customers.'
          : `Your review was not approved. Reason: ${updateData.rejection_reason}`,
        reference_type: 'review',
        reference_id: review.review_id,
        is_read: false,
      });
      console.log(`📧 Notification sent to user ${review.user_id}`);
    } catch (notifError) {
      console.error('❌ Error creating notification:', notifError.message);
    }

    const updatedReview = await Review.findByPk(reviewId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name'],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: `Review ${is_approved ? 'approved' : 'rejected'} successfully`,
      data: updatedReview,
    });
  } catch (error) {
    console.error('❌ Error approving review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Admin: Feature/unfeature a review
 * PATCH /api/reviews/:id/feature
 */
const featureReview = async (req, res) => {
  try {
    const userType = req.user.userType;
    const reviewId = parseInt(req.params.id);
    const { is_featured } = req.body;

    console.log(`⭐ Featured update for review #${reviewId}:`, { is_featured });

    if (userType !== 'admin' && userType !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Admin or staff access required',
      });
    }

    const review = await Review.findByPk(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Can only feature approved reviews
    if (!review.is_approved) {
      return res.status(400).json({
        success: false,
        message: 'Can only feature approved reviews',
      });
    }

    await review.update({ is_featured: is_featured === true });

    console.log(`⭐ Review #${reviewId} ${is_featured ? 'FEATURED' : 'UNFEATURED'}`);

    const updatedReview = await Review.findByPk(reviewId);

    res.status(200).json({
      success: true,
      message: `Review ${is_featured ? 'featured' : 'unfeatured'} successfully`,
      data: updatedReview,
    });
  } catch (error) {
    console.error('❌ Error featuring review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
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
};
