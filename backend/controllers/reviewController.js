/**
 * Review Controller
 * 
 * Handles review and rating operations for completed bookings
 */

const { Review, Booking, Pet, User } = require('../models');
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
      rating_service,
      rating_staff,
      rating_cleanliness,
      rating_value,
      rating_communication,
      rating_pet_condition,
      review_text
    } = req.body;

    // Validate required fields
    if (!booking_id || !rating_service || !rating_staff || !rating_cleanliness || 
        !rating_value || !rating_communication || !rating_pet_condition) {
      return res.status(400).json({
        success: false,
        message: 'All rating fields are required',
      });
    }

    // Validate rating values (1-5)
    const ratings = [
      rating_service, rating_staff, rating_cleanliness, 
      rating_value, rating_communication, rating_pet_condition
    ];
    
    if (ratings.some(r => r < 1 || r > 5)) {
      return res.status(400).json({
        success: false,
        message: 'All ratings must be between 1 and 5',
      });
    }

    // Check if booking exists
    const booking = await Booking.findByPk(booking_id, {
      include: [{ model: Pet, as: 'pet' }]
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

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'You can only review completed bookings',
      });
    }

    // Check if review already exists for this booking
    const existingReview = await Review.findOne({ where: { booking_id } });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this booking',
      });
    }

    // Calculate overall rating
    const overall_rating = (
      parseInt(rating_service) + 
      parseInt(rating_staff) + 
      parseInt(rating_cleanliness) + 
      parseInt(rating_value) + 
      parseInt(rating_communication) + 
      parseInt(rating_pet_condition)
    ) / 6.0;

    // Get photo URL if uploaded
    const photoUrl = req.file ? req.file.path : null;

    // Create review
    const review = await Review.create({
      booking_id: parseInt(booking_id),
      user_id: userId,
      pet_id: booking.pet_id,
      service_type: booking.service_type,
      rating_service: parseInt(rating_service),
      rating_staff: parseInt(rating_staff),
      rating_cleanliness: parseInt(rating_cleanliness),
      rating_value: parseInt(rating_value),
      rating_communication: parseInt(rating_communication),
      rating_pet_condition: parseInt(rating_pet_condition),
      overall_rating: overall_rating.toFixed(1),
      review_text: review_text?.trim() || null,
      photos: photoUrl,
      is_verified: true,
      is_approved: true, // Auto-approved - no admin approval needed
    });

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
          attributes: ['booking_id', 'service_type', 'start_date'],
        },
      ],
    });

    // Create notification for user
    try {
      const { Notification } = require('../models');
      await Notification.create({
        user_id: userId,
        type: 'review',
        title: 'Thank You for Your Review!',
        message: `Thank you for your review! Your feedback has been posted and is now visible to other customers.`,
        reference_type: 'review',
        reference_id: review.review_id,
        is_read: false,
      });
      console.log(`✅ Created user notification for review #${review.review_id}`);
    } catch (notifError) {
      console.error('❌ Error creating user notification:', notifError);
      // Don't fail the request if notification creation fails
    }

    // Create notification for admin
    try {
      const { Notification } = require('../models');
      const { User } = require('../models');
      
      // Get all admin users
      const adminUsers = await User.findAll({
        where: { userType: 'admin' },
        attributes: ['id']
      });

      console.log(`📧 Found ${adminUsers.length} admin users for notifications`);

      // Create notification for each admin
      const adminNotifications = adminUsers.map(admin => ({
        user_id: admin.id,
        type: 'review',
        title: 'New Review Posted',
        message: `New review posted by ${createdReview.user.first_name} ${createdReview.user.last_name} for ${createdReview.service_type} service. Review is now live on the landing page.`,
        reference_type: 'review',
        reference_id: review.review_id,
        is_read: false,
      }));

      if (adminNotifications.length > 0) {
        await Notification.bulkCreate(adminNotifications);
        console.log(`✅ Created ${adminNotifications.length} admin notifications for review #${review.review_id}`);
      }
    } catch (notifError) {
      console.error('❌ Error creating admin notifications:', notifError);
      // Don't fail the request if notification creation fails
    }

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully and is now visible to other customers.',
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
 * Get all approved reviews (public)
 * GET /api/reviews
 */
const getReviews = async (req, res) => {
  try {
    const { 
      service_type, 
      min_rating, 
      page = 1, 
      limit = 10,
      featured,
    } = req.query;

    console.log('📊 getReviews called with params:', { service_type, min_rating, page, limit, featured });

    // First, let's check what reviews exist in the database
    const totalReviews = await Review.count();
    const approvedReviews = await Review.count({ where: { is_approved: true } });
    const featuredReviews = await Review.count({ where: { is_approved: true, is_featured: true } });
    
    console.log('📊 Database stats:', {
      total: totalReviews,
      auto_approved: approvedReviews,
      featured: featuredReviews
    });

    // Build where clause - all reviews are auto-approved
    const whereClause = { is_approved: true };
    
    if (service_type) {
      whereClause.service_type = service_type;
    }
    
    if (min_rating) {
      whereClause.overall_rating = { [Op.gte]: parseFloat(min_rating) };
    }

    if (featured === 'true') {
      whereClause.is_featured = true;
    }

    console.log('📊 WHERE clause:', whereClause);

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
          attributes: ['pet_id', 'name', 'breed', 'photo'],
        },
      ],
      order: [
        ['is_featured', 'DESC'],
        ['created_at', 'DESC']
      ],
      limit: parseInt(limit),
      offset: offset,
    });

    console.log(`📊 Found ${count} reviews matching criteria, returning ${reviews.length} reviews`);
    console.log(`📊 Reviews:`, reviews.map(r => ({ 
      id: r.review_id, 
      approved: r.is_approved, 
      featured: r.is_featured,
      service: r.service_type 
    })));

    res.status(200).json({
      success: true,
      count: count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      data: reviews,
    });
  } catch (error) {
    console.error('❌ Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get review statistics
 * GET /api/reviews/stats
 */
const getReviewStats = async (req, res) => {
  try {
    const stats = await Review.findAll({
      where: { is_approved: true },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating_service')), 'avg_service'],
        [sequelize.fn('AVG', sequelize.col('rating_staff')), 'avg_staff'],
        [sequelize.fn('AVG', sequelize.col('rating_cleanliness')), 'avg_cleanliness'],
        [sequelize.fn('AVG', sequelize.col('rating_value')), 'avg_value'],
        [sequelize.fn('AVG', sequelize.col('rating_communication')), 'avg_communication'],
        [sequelize.fn('AVG', sequelize.col('rating_pet_condition')), 'avg_pet_condition'],
        [sequelize.fn('AVG', sequelize.col('overall_rating')), 'avg_overall'],
        [sequelize.fn('COUNT', sequelize.col('review_id')), 'total_reviews'],
      ],
      raw: true,
    });

    // Get rating distribution
    const distribution = await Review.findAll({
      where: { is_approved: true },
      attributes: [
        [sequelize.fn('FLOOR', sequelize.col('overall_rating')), 'rating'],
        [sequelize.fn('COUNT', sequelize.col('review_id')), 'count'],
      ],
      group: [sequelize.fn('FLOOR', sequelize.col('overall_rating'))],
      raw: true,
    });

    res.status(200).json({
      success: true,
      data: {
        averages: stats[0],
        distribution: distribution,
      },
    });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get user's reviews
 * GET /api/reviews/my-reviews
 */
const getMyReviews = async (req, res) => {
  try {
    const userId = req.user.id;

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
          attributes: ['booking_id', 'service_type', 'start_date'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your reviews',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get completed bookings that can be reviewed
 * GET /api/reviews/reviewable-bookings
 */
const getReviewableBookings = async (req, res) => {
  try {
    console.log('📋 getReviewableBookings called');
    console.log('👤 User from req.user:', req.user);
    console.log('🍪 Cookies:', req.cookies);
    console.log('📨 Headers:', req.headers.authorization);
    
    if (!req.user || !req.user.id) {
      console.error('❌ No user found in request');
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }
    
    const userId = req.user.id;
    console.log('✅ User ID:', userId);

    // Get completed bookings without reviews
    const bookings = await Booking.findAll({
      where: {
        user_id: userId,
        status: 'completed',
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
        },
      ],
      order: [['end_date', 'DESC']],
    });

    console.log(`📊 Found ${bookings.length} completed bookings for user ${userId}`);

    // Filter out bookings that already have reviews
    const reviewableBookings = bookings.filter(booking => !booking.review);
    
    console.log(`✅ ${reviewableBookings.length} bookings are reviewable (without existing reviews)`);

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
 * Update review (user can update their own review)
 * PUT /api/reviews/:id
 */
const updateReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const reviewId = parseInt(req.params.id);
    const {
      rating_service,
      rating_staff,
      rating_cleanliness,
      rating_value,
      rating_communication,
      rating_pet_condition,
      review_text
    } = req.body;

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

    // Prepare update data
    const updateData = {};
    
    if (rating_service) {
      updateData.rating_service = parseInt(rating_service);
    }
    if (rating_staff) {
      updateData.rating_staff = parseInt(rating_staff);
    }
    if (rating_cleanliness) {
      updateData.rating_cleanliness = parseInt(rating_cleanliness);
    }
    if (rating_value) {
      updateData.rating_value = parseInt(rating_value);
    }
    if (rating_communication) {
      updateData.rating_communication = parseInt(rating_communication);
    }
    if (rating_pet_condition) {
      updateData.rating_pet_condition = parseInt(rating_pet_condition);
    }
    if (review_text !== undefined) {
      updateData.review_text = review_text?.trim() || null;
    }

    // Recalculate overall rating if any rating changed
    if (Object.keys(updateData).some(key => key.startsWith('rating_'))) {
      const ratings = {
        rating_service: updateData.rating_service || review.rating_service,
        rating_staff: updateData.rating_staff || review.rating_staff,
        rating_cleanliness: updateData.rating_cleanliness || review.rating_cleanliness,
        rating_value: updateData.rating_value || review.rating_value,
        rating_communication: updateData.rating_communication || review.rating_communication,
        rating_pet_condition: updateData.rating_pet_condition || review.rating_pet_condition,
      };

      const overall_rating = (
        ratings.rating_service + 
        ratings.rating_staff + 
        ratings.rating_cleanliness + 
        ratings.rating_value + 
        ratings.rating_communication + 
        ratings.rating_pet_condition
      ) / 6.0;

      updateData.overall_rating = overall_rating.toFixed(1);
      updateData.is_approved = false; // Require re-approval after edit
    }

    // Handle photo update
    if (req.file) {
      updateData.photos = req.file.path;
    }

    await review.update(updateData);

    // Fetch updated review with associations
    const updatedReview = await Review.findByPk(reviewId, {
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
          attributes: ['booking_id', 'service_type', 'start_date'],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: updatedReview,
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Delete review
 * DELETE /api/reviews/:id
 */
const deleteReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.userType;
    const reviewId = parseInt(req.params.id);

    const review = await Review.findByPk(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Only owner or admin can delete
    if (review.user_id !== userId && userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this review',
      });
    }

    await review.destroy();

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Admin: Get all reviews (including unapproved)
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

    const { page = 1, limit = 100, status } = req.query;

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
          attributes: ['pet_id', 'name', 'breed', 'photo'],
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

    res.status(200).json({
      success: true,
      count: count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      data: reviews,
    });
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Admin: Approve/reject review
 * PATCH /api/reviews/:id/approve
 */
const approveReview = async (req, res) => {
  try {
    const userType = req.user.userType;
    const reviewId = parseInt(req.params.id);
    const { is_approved, is_featured, admin_response } = req.body;

    console.log(`📝 Approve review request:`, { reviewId, is_approved, is_featured, admin_response, userType });

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

    console.log(`📝 Current review state:`, { 
      id: review.review_id, 
      is_approved: review.is_approved, 
      is_featured: review.is_featured 
    });

    const updateData = {};
    if (is_approved !== undefined) {
      updateData.is_approved = is_approved;
    }
    if (is_featured !== undefined) {
      updateData.is_featured = is_featured;
    }
    if (admin_response) {
      updateData.admin_response = admin_response;
      updateData.admin_response_date = new Date();
    }

    console.log(`📝 Updating review with:`, updateData);

    await review.update(updateData);

    console.log(`✅ Review #${reviewId} updated successfully`);

    const updatedReview = await Review.findByPk(reviewId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email'],
        },
      ],
    });

    console.log(`📝 Updated review state:`, { 
      id: updatedReview.review_id, 
      is_approved: updatedReview.is_approved, 
      is_featured: updatedReview.is_featured 
    });

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
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

// Import sequelize for stats query
const { sequelize } = require('../config/database');

module.exports = {
  createReview,
  getReviews,
  getReviewStats,
  getMyReviews,
  getReviewableBookings,
  updateReview,
  deleteReview,
  getAllReviews,
  approveReview,
};
