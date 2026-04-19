/**
 * Booking Controller
 * 
 * Handles all booking operations including CRUD, availability checks, and admin actions
 */

const { Booking, Pet, Payment, User, Service } = require('../models');
const { Op } = require('sequelize');
const { createNotification } = require('./notificationController');
const config = require('../config/config');

// Service pricing and capacity configuration
const SERVICE_CONFIG = {
  'Pet Sitting': {
    pricePerDay: 3250,
    maxCapacityPerDay: 10,
    requiresDateRange: false
  },
  'Pet Boarding': {
    pricePerNight: 2600,
    maxCapacityPerDay: 10,
    requiresDateRange: true
  },
  'Grooming': {
    flatRate: 3900,
    maxCapacityPerDay: 10,
    requiresDateRange: false
  }
};

const BOOKING_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
};

const PAYMENT_STATUS = {
  UNPAID: 'unpaid',
  PENDING_PAYMENT: 'pending_payment',
  PAID: 'paid',
  FAILED: 'failed'
};

const toLegacyStatus = (bookingStatus) => {
  switch (bookingStatus) {
    case BOOKING_STATUS.CONFIRMED:
    case BOOKING_STATUS.APPROVED:
      return 'confirmed';
    case BOOKING_STATUS.COMPLETED:
      return 'completed';
    case BOOKING_STATUS.REJECTED:
    case BOOKING_STATUS.CANCELLED:
      return 'cancelled';
    case BOOKING_STATUS.PENDING:
    default:
      return 'pending';
  }
};

const parseKhaltiError = async (response) => {
  try {
    const payload = await response.json();
    return payload?.detail || payload?.message || JSON.stringify(payload);
  } catch (error) {
    return `Khalti request failed with HTTP ${response.status}`;
  }
};

/**
 * Calculate price based on service type and duration
 */
const calculatePrice = (serviceType, startDate, endDate) => {
  const config = SERVICE_CONFIG[serviceType];
  if (!config) {
    throw new Error('Invalid service type');
  }

  if (serviceType === 'Pet Boarding') {
    // Calculate nights between dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return {
      price: config.pricePerNight * nights,
      numberOfDays: nights
    };
  } else if (serviceType === 'Grooming') {
    return {
      price: config.flatRate,
      numberOfDays: 1
    };
  } else { // Daycation
    return {
      price: config.pricePerDay,
      numberOfDays: 1
    };
  }
};

/**
 * Check availability for a service on specific dates
 * POST /api/bookings/check-availability
 */
const checkAvailability = async (req, res) => {
  try {
    const { service_type, start_date, end_date } = req.body;

    if (!service_type || !start_date) {
      return res.status(400).json({
        success: false,
        message: 'Service type and start date are required'
      });
    }

    const config = SERVICE_CONFIG[service_type];
    if (!config) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service type'
      });
    }

    // Validate date range for boarding
    if (config.requiresDateRange && !end_date) {
      return res.status(400).json({
        success: false,
        message: 'End date is required for Pet Boarding'
      });
    }

    const startDate = new Date(start_date);
    const endDate = end_date ? new Date(end_date) : startDate;

    // Check if dates are in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDate < today) {
      return res.status(400).json({
        success: false,
        available: false,
        message: 'Cannot book dates in the past'
      });
    }

    // For single-day services, check only start date
    if (!config.requiresDateRange) {
      const bookingsOnDate = await Booking.count({
        where: {
          service_type,
          start_date: {
            [Op.gte]: new Date(startDate.setHours(0, 0, 0, 0)),
            [Op.lt]: new Date(startDate.setHours(23, 59, 59, 999))
          },
          status: {
            [Op.in]: ['pending', 'confirmed']
          },
          booking_status: {
            [Op.in]: [BOOKING_STATUS.PENDING, BOOKING_STATUS.APPROVED, BOOKING_STATUS.CONFIRMED]
          }
        }
      });

      const available = bookingsOnDate < config.maxCapacityPerDay;
      return res.status(200).json({
        success: true,
        available,
        remaining: config.maxCapacityPerDay - bookingsOnDate,
        message: available ? 'Service available' : `No availability for ${service_type} on this date`
      });
    }

    // For boarding, check each day in range
    const unavailableDates = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const bookingsOnDate = await Booking.count({
        where: {
          service_type: 'Pet Boarding',
          [Op.or]: [
            {
              start_date: {
                [Op.lte]: dayEnd
              },
              end_date: {
                [Op.gte]: dayStart
              }
            }
          ],
          status: {
            [Op.in]: ['pending', 'confirmed']
          },
          booking_status: {
            [Op.in]: [BOOKING_STATUS.PENDING, BOOKING_STATUS.APPROVED, BOOKING_STATUS.CONFIRMED]
          }
        }
      });

      if (bookingsOnDate >= config.maxCapacityPerDay) {
        unavailableDates.push(currentDate.toISOString().split('T')[0]);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    const available = unavailableDates.length === 0;
    return res.status(200).json({
      success: true,
      available,
      unavailableDates,
      message: available ? 'All dates available' : `No availability on: ${unavailableDates.join(', ')}`
    });

  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check availability',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Create a new booking
 * POST /api/bookings
 */
const createBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      pet_id,
      service_type,
      start_date,
      end_date,
      requires_pickup,
      pickup_address,
      pickup_time,
      dropoff_address,
      dropoff_time
    } = req.body;

    // Validation
    if (!pet_id || !service_type || !start_date) {
      return res.status(400).json({
        success: false,
        message: 'Pet, service type, and start date are required'
      });
    }

    // Verify pet belongs to user
    const pet = await Pet.findOne({
      where: {
        pet_id,
        user_id: userId
      }
    });

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found or does not belong to you'
      });
    }

    // Validate service type
    const config = SERVICE_CONFIG[service_type];
    if (!config) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service type'
      });
    }

    // Validate pickup details if required
    if (requires_pickup) {
      if (!pickup_address || !pickup_time || !dropoff_time) {
        return res.status(400).json({
          success: false,
          message: 'Pickup address, pickup time, and drop-off time are required when pickup service is selected'
        });
      }
    }

    // Check availability before creating
    const availabilityCheck = await checkAvailabilityInternal(
      service_type,
      start_date,
      end_date
    );

    if (!availabilityCheck.available) {
      return res.status(400).json({
        success: false,
        message: availabilityCheck.message
      });
    }

    // Calculate price and duration
    const { price, numberOfDays } = calculatePrice(service_type, start_date, end_date);

    // Fetch service_id from services table
    const service = await Service.findOne({
      where: { name: service_type }
    });

    if (!service) {
      return res.status(400).json({
        success: false,
        message: `Service "${service_type}" not found in database. Please ensure services are seeded.`
      });
    }

    // Generate confirmation code
    const confirmationCode = `BK${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Create booking
    const booking = await Booking.create({
      user_id: userId,
      pet_id,
      service_id: service.service_id,
      service_type,
      start_date,
      end_date: config.requiresDateRange ? end_date : start_date,
      number_of_days: numberOfDays,
      price,
      requires_pickup: requires_pickup || false,
      pickup_address: requires_pickup ? pickup_address : null,
      pickup_time: requires_pickup ? pickup_time : null,
      dropoff_address: requires_pickup ? (dropoff_address || pickup_address) : null,
      dropoff_time: requires_pickup ? dropoff_time : null,
      status: 'pending',
      booking_status: BOOKING_STATUS.PENDING, // bookingis created first with booking status pending and payment status unpaid
      payment_status: PAYMENT_STATUS.UNPAID,
      confirmation_code: confirmationCode,
      created_at: new Date(),
      updated_at: new Date()
    });

    // Fetch complete booking with pet details
    const completeBooking = await Booking.findByPk(booking.booking_id, {
      include: [{
        model: Pet,
        as: 'pet',
        attributes: ['pet_id', 'name', 'breed', 'photo']
      }]
    });

    // Create notification for booking submission
    await createNotification(
      booking.user_id,
      'booking_created',
      'Booking Submitted',
      'Your booking has been sent. Wait for approval.',
      'booking',
      booking.booking_id
    );

    // Create notification for admins
    try {
      const { Notification } = require('../models');
      const admins = await User.findAll({ where: { userType: 'admin' } });
      
      if (admins.length > 0) {
        const petName = completeBooking.pet?.name || 'A pet';
        const serviceType = completeBooking.service_type || 'Service';
        const adminNotifications = admins.map((admin) => ({
          user_id: admin.id,
          type: 'booking_created',
          title: 'New Booking Request',
          message: `New booking for ${petName} - ${serviceType}`,
          reference_type: 'booking',
          reference_id: booking.booking_id,
          is_read: false
        }));
        
        await Notification.bulkCreate(adminNotifications);
      }
    } catch (notificationError) {
      console.error('Error creating admin booking notification:', notificationError);
      // Don't throw error - booking was created successfully
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully and is pending admin approval',
      data: completeBooking
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Internal availability check (for use within other functions)
 */
const checkAvailabilityInternal = async (service_type, start_date, end_date) => {
  const config = SERVICE_CONFIG[service_type];
  const startDate = new Date(start_date);
  const endDate = end_date ? new Date(end_date) : startDate;

  // Check if dates are in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (startDate < today) {
    return {
      available: false,
      message: 'Cannot book dates in the past'
    };
  }

  if (!config.requiresDateRange) {
    const bookingsOnDate = await Booking.count({
      where: {
        service_type,
        start_date: {
          [Op.gte]: new Date(startDate.setHours(0, 0, 0, 0)),
          [Op.lt]: new Date(startDate.setHours(23, 59, 59, 999))
        },
        status: {
          [Op.in]: ['pending', 'confirmed']
        },
        booking_status: {
          [Op.in]: [BOOKING_STATUS.PENDING, BOOKING_STATUS.APPROVED, BOOKING_STATUS.CONFIRMED]
        }
      }
    });

    const available = bookingsOnDate < config.maxCapacityPerDay;
    return {
      available,
      message: available ? 'Service available' : `No availability for ${service_type} on this date`
    };
  }

  // For boarding, check each day
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);

    const bookingsOnDate = await Booking.count({
      where: {
        service_type: 'Pet Boarding',
        [Op.or]: [
          {
            start_date: {
              [Op.lte]: dayEnd
            },
            end_date: {
              [Op.gte]: dayStart
            }
          }
        ],
        status: {
          [Op.in]: ['pending', 'confirmed']
        },
        booking_status: {
          [Op.in]: [BOOKING_STATUS.PENDING, BOOKING_STATUS.APPROVED, BOOKING_STATUS.CONFIRMED]
        }
      }
    });

    if (bookingsOnDate >= config.maxCapacityPerDay) {
      return {
        available: false,
        message: `No availability on ${currentDate.toISOString().split('T')[0]}`
      };
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    available: true,
    message: 'All dates available'
  };
};

/**
 * Get all bookings for logged-in user
 * GET /api/bookings
 */
/**
 * Get user bookings - with support for categorization
 * GET /api/bookings
 * Query params:
 *   - category: 'upcoming' | 'history' | 'manage' | 'all' (default: 'all')
 *   - status: filter by booking_status
 *   - upcoming: 'true' (legacy, use category=upcoming instead)
 *   - past: 'true' (legacy, use category=history instead)
 */
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, upcoming, past, category = 'all' } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Determine which category to use (legacy params or new category param)
    let finalCategory = category;
    if (upcoming === 'true') finalCategory = 'upcoming';
    if (past === 'true') finalCategory = 'history';

    const whereClause = {
      user_id: userId
    };

    // Apply status filter if provided
    if (status) {
      whereClause.booking_status = status;
    }

    // Apply category-based filtering
    switch (finalCategory) {
      case 'upcoming':
        // Upcoming: start_date >= today and not cancelled/rejected
        whereClause.start_date = { [Op.gte]: today };
        whereClause.booking_status = {
          [Op.notIn]: [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.REJECTED]
        };
        break;

      case 'manage':
        // Manage: bookings that are pending approval or confirmed (awaiting payment or action)
        whereClause.$and = [
          { start_date: { [Op.gte]: today } },
          {
            [Op.or]: [
              { booking_status: BOOKING_STATUS.PENDING },
              { booking_status: BOOKING_STATUS.APPROVED },
              { booking_status: BOOKING_STATUS.CONFIRMED }
            ]
          }
        ];
        break;

      case 'history':
        // History: past/completed bookings or cancelled/rejected ones
        whereClause[Op.or] = [
          { booking_status: BOOKING_STATUS.COMPLETED },
          { booking_status: BOOKING_STATUS.CANCELLED },
          { booking_status: BOOKING_STATUS.REJECTED },
          {
            [Op.and]: [
              { end_date: { [Op.lt]: today } },
              {
                booking_status: {
                  [Op.in]: [
                    BOOKING_STATUS.PENDING,
                    BOOKING_STATUS.APPROVED,
                    BOOKING_STATUS.CONFIRMED
                  ]
                }
              }
            ]
          }
        ];
        break;

      case 'all':
      default:
        // All bookings for user
        break;
    }

    // Determine sort order based on category
    let order = [['created_at', 'DESC']]; // default: most recently created
    if (finalCategory === 'upcoming' || finalCategory === 'manage') {
      order = [['start_date', 'DESC']]; // upcoming: latest start dates first
    } else if (finalCategory === 'history') {
      order = [['end_date', 'DESC'], ['start_date', 'DESC']]; // history: latest end dates first
    }

    const bookings = await Booking.findAll({
      where: whereClause,
      include: [{
        model: Pet,
        as: 'pet',
        attributes: ['pet_id', 'name', 'breed', 'photo']
      }],
      order
    });

    res.status(200).json({
      success: true,
      category: finalCategory,
      count: bookings.length,
      data: bookings
    });

  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get single booking by ID
 * GET /api/bookings/:bookingId
 */
const getBookingById = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = parseInt(req.params.bookingId);

    const booking = await Booking.findByPk(bookingId, {
      include: [{
        model: Pet,
        as: 'pet',
        attributes: ['pet_id', 'name', 'breed', 'photo']
      }]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking belongs to user 
    if (booking.user_id !== userId && req.user.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this booking'
      });
    }

    console.log('📌 getBookingById - Returning booking:', {
      booking_id: booking.booking_id,
      payment_status: booking.payment_status,
      booking_status: booking.booking_status,
      status: booking.status,
      pidx: booking.pidx
    });

    // Set cache control headers to prevent caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.status(200).json({
      success: true,
      data: booking
    });

  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update/Reschedule a booking
 * PUT /api/bookings/:bookingId
 */
const updateBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = parseInt(req.params.bookingId);
    const {
      start_date,
      end_date,
      requires_pickup,
      pickup_address,
      pickup_time,
      dropoff_address,
      dropoff_time
    } = req.body;

    // Find booking
    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check ownership
    if (booking.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this booking'
      });
    }

    // Cannot reschedule cancelled bookings
    if (booking.booking_status === BOOKING_STATUS.CANCELLED || booking.booking_status === BOOKING_STATUS.REJECTED) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule cancelled bookings'
      });
    }

    // Cannot reschedule completed bookings
    if (booking.booking_status === BOOKING_STATUS.COMPLETED) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule completed bookings'
      });
    }

    // Check availability for new dates if dates are being changed
    if (start_date && start_date !== booking.start_date) {
      const availabilityCheck = await checkAvailabilityInternal(
        booking.service_type,
        start_date,
        end_date || booking.end_date,
        bookingId // Exclude current booking from availability check
      );

      if (!availabilityCheck.available) {
        return res.status(400).json({
          success: false,
          message: availabilityCheck.message
        });
      }

      // Recalculate price if dates changed
      const { price, numberOfDays } = calculatePrice(
        booking.service_type,
        start_date,
        end_date || booking.end_date
      );

      booking.start_date = start_date;
      booking.end_date = end_date || booking.end_date;
      booking.price = price;
      booking.number_of_days = numberOfDays;
    }

    // Update pickup/dropoff details
    if (requires_pickup !== undefined) {
      booking.requires_pickup = requires_pickup;
      booking.pickup_address = requires_pickup ? pickup_address : null;
      booking.pickup_time = requires_pickup ? pickup_time : null;
      booking.dropoff_address = requires_pickup ? (dropoff_address || pickup_address) : null;
      booking.dropoff_time = requires_pickup ? dropoff_time : null;

      if (requires_pickup && (!pickup_address || !pickup_time || !dropoff_time)) {
        return res.status(400).json({
          success: false,
          message: 'Pickup details are incomplete'
        });
      }
    }

    booking.updated_at = new Date();
    await booking.save();

    // Fetch updated booking with pet details
    const updatedBooking = await Booking.findByPk(bookingId, {
      include: [{
        model: Pet,
        as: 'pet',
        attributes: ['pet_id', 'name', 'breed', 'photo']
      }]
    });

    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      data: updatedBooking
    });

  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Cancel a booking
 * DELETE /api/bookings/:bookingId
 */
const cancelBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = parseInt(req.params.bookingId);

    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check ownership
    if (booking.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to cancel this booking'
      });
    }

    // Cannot cancel already cancelled or completed bookings
    if (booking.booking_status === BOOKING_STATUS.CANCELLED || booking.booking_status === BOOKING_STATUS.REJECTED) {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    if (booking.booking_status === BOOKING_STATUS.COMPLETED) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed bookings'
      });
    }

    // Confirmed bookings can only be cancelled before start date
    if (booking.booking_status === BOOKING_STATUS.CONFIRMED) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(booking.start_date);
      startDate.setHours(0, 0, 0, 0);

      if (startDate <= today) {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel confirmed bookings on or after the start date'
        });
      }
    }

    // Update status to cancelled
    booking.status = toLegacyStatus(BOOKING_STATUS.CANCELLED);
    booking.booking_status = BOOKING_STATUS.CANCELLED;
    booking.updated_at = new Date();
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });

  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Admin: Get all pending bookings
 * GET /api/bookings/admin/pending
 */
const getPendingBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: {
        booking_status: BOOKING_STATUS.PENDING
      },
      include: [
        {
          model: Pet,
          as: 'pet',
          attributes: ['pet_id', 'name', 'breed', 'photo'],
          include: [{
            model: User,
            as: 'owner',
            attributes: ['id', 'first_name', 'last_name', 'email', 'phone_number']
          }]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });

  } catch (error) {
    console.error('Error fetching pending bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/*Admin: Approve a booking
 * PUT /api/bookings/admin/:bookingId/approve*/
const approveBooking = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.bookingId); 

    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.booking_status !== BOOKING_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        message: 'Only pending bookings can be approved'
      });
    }

    booking.booking_status = BOOKING_STATUS.APPROVED; //on admin approval, booking status is set to approved and payment status is pending and unlocks the pay now button on frontend
    booking.payment_status = PAYMENT_STATUS.PENDING_PAYMENT;
    booking.status = toLegacyStatus(BOOKING_STATUS.APPROVED);
    booking.updated_at = new Date();
    await booking.save();

    // Create notification for booking approval
    const serviceDate = booking.start_date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    await createNotification(
      booking.user_id,
      'booking_approved',
      'Booking Approved',
      `Your booking has been approved! Service scheduled for ${serviceDate}. Please complete payment to confirm.`,
      'booking',
      booking.booking_id
    );

    res.status(200).json({
      success: true,
      message: 'Booking approved successfully',
      data: booking
    });

  } catch (error) {
    console.error('Error approving booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Admin: Reject a booking
 * PUT /api/bookings/admin/:bookingId/reject
 */
const rejectBooking = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.bookingId);

    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.booking_status !== BOOKING_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        message: 'Only pending bookings can be rejected'
      });
    }

    booking.booking_status = BOOKING_STATUS.REJECTED;
    booking.payment_status = PAYMENT_STATUS.UNPAID;
    booking.status = toLegacyStatus(BOOKING_STATUS.REJECTED);
    booking.updated_at = new Date();
    await booking.save();

    // Create notification for booking rejection
    await createNotification(
      booking.user_id,
      'booking_rejected',
      'Booking Declined',
      'Your booking was declined. Please contact us for more details.',
      'booking',
      booking.booking_id
    );

    res.status(200).json({
      success: true,
      message: 'Booking rejected successfully',
      data: booking
    });

  } catch (error) {
    console.error('Error rejecting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Admin: Complete a booking
 * PUT /api/bookings/admin/:bookingId/complete
 */
const completeBooking = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.bookingId);
    
    // Check if the booking exists
    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Only confirmed bookings can be completed
    if (booking.booking_status !== BOOKING_STATUS.CONFIRMED || booking.payment_status !== PAYMENT_STATUS.PAID) {
      return res.status(400).json({
        success: false,
        message: 'Only paid and confirmed bookings can be marked as completed'
      });
    }

    // Check if the service date has passed
    const now = new Date();
    const endDate = booking.end_date ? new Date(booking.end_date) : new Date(booking.start_date);
    
    // Simple check: compare dates. 
    // If end_date is today, we might want to check time, but usually service ends at end of day.
    // Let's assume passed means strictly greater than end_date, 
    // or if only start_date exists (e.g. Daycation), verify against that.
    
    // Ensure accurate comparisons by setting time to midnight for next day comparison 
    // or just comparing timestamps if we care about specific time.
    // For simplicity and user friendliness, let's just check if end_date is in the past.
    
    if (now <= endDate) {
       return res.status(400).json({
         success: false,
         message: 'Booking cannot be completed before the service end date'
       });
    }

    booking.booking_status = BOOKING_STATUS.COMPLETED;
    booking.status = toLegacyStatus(BOOKING_STATUS.COMPLETED);
    booking.updated_at = new Date();
    await booking.save();

    // Create notification for booking completion
    await createNotification(
      booking.user_id,
      'booking_completed',
      'Booking Complete',
      'Your booking is complete! Please rate and review the service.',
      'booking',
      booking.booking_id
    );

    res.status(200).json({
      success: true,
      message: 'Booking marked as completed',
      data: booking
    });

  } catch (error) {
    console.error('Error completing booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Admin: Get all bookings with filters and smart sorting
 * GET /api/bookings/admin/all
 * Query params:
 *   - status: filter by booking_status
 *   - payment_status: filter by payment_status
 *   - service_type: filter by service type
 *   - date_from: filter from date
 *   - date_to: filter to date
 *   - sort_by: 'start_date' | 'end_date' | 'created_date' | 'smart' (default: 'start_date')
 *   - view: 'history' | 'pending' | 'all' (for smart sorting, default: 'all')
 */
const getAllBookings = async (req, res) => {
  try {
    const { status, payment_status, service_type, date_from, date_to, sort_by = 'smart', view = 'all' } = req.query;

    const whereClause = {};

    // Apply filters
    if (status) {
      whereClause.booking_status = status;
    }

    if (payment_status) {
      whereClause.payment_status = payment_status;
    }

    if (service_type) {
      whereClause.service_type = service_type;
    }

    if (date_from || date_to) {
      whereClause.start_date = {};
      if (date_from) {
        whereClause.start_date[Op.gte] = new Date(date_from);
      }
      if (date_to) {
        whereClause.start_date[Op.lte] = new Date(date_to);
      }
    }

    // Determine sort order
    let order;
    if (sort_by === 'start_date') {
      order = [['start_date', 'DESC']];
    } else if (sort_by === 'end_date') {
      order = [['end_date', 'DESC'], ['start_date', 'DESC']];
    } else if (sort_by === 'created_date') {
      order = [['created_at', 'DESC']];
    } else if (sort_by === 'smart') {
      // Smart sorting: for history/completed bookings, sort by end_date; otherwise by start_date
      if (view === 'history' || status === 'completed' || status === 'cancelled' || status === 'rejected') {
        order = [['end_date', 'DESC'], ['start_date', 'DESC']];
      } else {
        order = [['start_date', 'DESC']];
      }
    } else {
      order = [['start_date', 'DESC']];
    }

    const bookings = await Booking.findAll({
      where: whereClause,
      include: [
        {
          model: Pet,
          as: 'pet',
          attributes: ['pet_id', 'name', 'breed', 'photo'],
          include: [{
            model: User,
            as: 'owner',
            attributes: ['id', 'first_name', 'last_name', 'email', 'phone_number']
          }]
        }
      ],
      order
    });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });

  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Admin: Get booking history (completed/cancelled/rejected bookings sorted by latest)
 * GET /api/bookings/admin/history
 * Query params:
 *   - status: filter by booking_status
 *   - service_type: filter by service type
 *   - date_from: filter from date
 *   - date_to: filter to date
 */
const getAdminBookingHistory = async (req, res) => {
  try {
    const { status, service_type, date_from, date_to } = req.query;

    const whereClause = {
      booking_status: {
        [Op.in]: [
          BOOKING_STATUS.APPROVED,
          BOOKING_STATUS.CONFIRMED,
          BOOKING_STATUS.COMPLETED,
          BOOKING_STATUS.CANCELLED,
          BOOKING_STATUS.REJECTED
        ]
      }
    };

    // Apply status filter if provided (override with specific status)
    if (status) {
      whereClause.booking_status = status;
    }

    if (service_type) {
      whereClause.service_type = service_type;
    }

    // Filter by date range
    if (date_from || date_to) {
      whereClause.end_date = whereClause.end_date || {};
      if (date_from) {
        whereClause.end_date[Op.gte] = new Date(date_from);
      }
      if (date_to) {
        whereClause.end_date[Op.lte] = new Date(date_to);
      }
    }

    // Sort by booking_id DESC (latest bookings first)
    const bookings = await Booking.findAll({
      where: whereClause,
      include: [
        {
          model: Pet,
          as: 'pet',
          attributes: ['pet_id', 'name', 'breed', 'photo'],
          include: [{
            model: User,
            as: 'owner',
            attributes: ['id', 'first_name', 'last_name', 'email', 'phone_number']
          }]
        }
      ],
      order: [['booking_id', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });

  } catch (error) {
    console.error('Error fetching booking history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**User Initiate Khalti payment for approved booking
 * POST /api/bookings/payment/initiate
 */

// This endpoint is called when user clicks "Pay Now" button on frontend after booking is approved by admin. It initiates the Khalti payment process, checks the booking belongs to the user, ensures the booking is already approved, send request to khalti.
const initiateKhaltiPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = parseInt(req.body.booking_id, 10);

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'booking_id is required'
      });
    }

    if (!config.khalti.secretKey) {
      return res.status(500).json({
        success: false,
        message: 'Khalti secret key is not configured on the server'
      });
    }

    const booking = await Booking.findOne({
      where: {
        booking_id: bookingId,
        user_id: userId
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.booking_status !== BOOKING_STATUS.APPROVED) {
      return res.status(400).json({
        success: false,
        message: 'Only approved bookings can be paid'
      });
    }

    if (booking.payment_status === PAYMENT_STATUS.PAID) {
      return res.status(400).json({
        success: false,
        message: 'Booking is already paid'
      });
    }

    const amountInPaisa = Math.round(Number(booking.price) * 100);
    const returnUrl = req.body.return_url || `${config.frontendUrl}/payment-success`;
    const websiteUrl = req.body.website_url || config.frontendUrl;

    const khaltiPayload = {
      return_url: returnUrl,
      website_url: websiteUrl,
      amount: amountInPaisa,
      purchase_order_id: String(booking.booking_id),
      purchase_order_name: 'Pet Care Booking'
    };

    const khaltiResponse = await fetch(config.khalti.initiateUrl, {
      method: 'POST',
      headers: {
        Authorization: `Key ${config.khalti.secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(khaltiPayload)
    });

    if (!khaltiResponse.ok) {
      const khaltiError = await parseKhaltiError(khaltiResponse);
      return res.status(400).json({
        success: false,
        message: khaltiError
      });
    }

    const khaltiData = await khaltiResponse.json();

    booking.payment_status = PAYMENT_STATUS.PENDING_PAYMENT;
    booking.payment_method = 'khalti';
    booking.pidx = khaltiData.pidx || booking.pidx;
    booking.updated_at = new Date();
    await booking.save();

    const payment = await Payment.findOne({ where: { booking_id: booking.booking_id } });
    if (!payment) {
      await Payment.create({
        booking_id: booking.booking_id,
        amount: booking.price,
        payment_method: 'khalti',
        transaction_details: JSON.stringify({
          stage: 'initiated',
          response: khaltiData
        })
      });
    } else {
      payment.payment_method = 'khalti';
      payment.transaction_details = JSON.stringify({
        stage: 'initiated',
        response: khaltiData
      });
      await payment.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Khalti payment initiated successfully',
      data: {
        booking_id: booking.booking_id,
        pidx: khaltiData.pidx,
        payment_url: khaltiData.payment_url,
        expires_at: khaltiData.expires_at,
        expires_in: khaltiData.expires_in
      }
    });
  } catch (error) {
    console.error('Error initiating Khalti payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initiate Khalti payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * User: Verify Khalti payment after redirect
 * POST /api/bookings/payment/verify
 */
const verifyKhaltiPayment = async (req, res) => {
  try {
    // console.log('\n═══════════════════════════════════════════════════════');
    console.log('🔐 KHALTI PAYMENT VERIFICATION - STARTING');
    // console.log('═══════════════════════════════════════════════════════');
    
    const userId = req.user.id;
    const isAdmin = req.user.userType === 'admin';
    const { pidx, booking_id } = req.body;

    console.log('📥 Request Data:', { 
      pidx, 
      booking_id,
      user_id: userId, 
      is_admin: isAdmin
    });

    // Validate required parameters
    if (!pidx) {
      console.log('❌ VALIDATION ERROR: pidx is required but not provided');
      return res.status(400).json({
        success: false,
        message: 'pidx (payment reference) is required'
      });
    }

    // Validate Khalti configuration
    if (!config.khalti.secretKey) {
      console.log('❌ CONFIG ERROR: Khalti secret key not configured');
      return res.status(500).json({
        success: false,
        message: 'Khalti secret key is not configured on the server'
      });
    }

    // Step 1: Call Khalti Lookup API
    console.log('\n📡 STEP 1: Calling Khalti Lookup API');
    console.log('🔗 URL:', config.khalti.lookupUrl);
    console.log('📦 Payload: {"pidx":"' + pidx + '"}');
    
    const lookupResponse = await fetch(config.khalti.lookupUrl, {
      method: 'POST',
      headers: {
        Authorization: `Key ${config.khalti.secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pidx })
    });

    console.log('📊 Khalti Response Status:', lookupResponse.status);

    if (!lookupResponse.ok) {
      const khaltiError = await parseKhaltiError(lookupResponse);
      console.log('❌ KHALTI API ERROR:', khaltiError);
      return res.status(400).json({
        success: false,
        message: 'Failed to verify payment with Khalti: ' + khaltiError
      });
    }

    const lookupData = await lookupResponse.json();
    console.log('✅ Khalti Response Received:', {
      status: lookupData.status,
      transaction_id: lookupData.transaction_id,
      amount: lookupData.amount,
      identifier: lookupData.identifier
    });

    // Step 2: Find Booking
    console.log('\n🔍 STEP 2: Finding Booking in Database');
    
    // Build query - prioritize booking_id if provided
    let booking = null;
    let searchMethod = '';
    
    if (booking_id) {
      console.log('🎯 Searching by booking_id:', booking_id);
      booking = await Booking.findOne({ where: { booking_id: parseInt(booking_id, 10) } });
      searchMethod = 'booking_id';
    } else {
      console.log('🎯 Searching by pidx:', pidx);
      booking = await Booking.findOne({ where: { pidx } });
      searchMethod = 'pidx';
    }
    
    if (!booking) {
      console.log('❌ BOOKING NOT FOUND');
      console.log('   Search method:', searchMethod);
      console.log('   Search value:', searchMethod === 'booking_id' ? booking_id : pidx);
      console.log('   This could mean:');
      console.log('   1. Payment was never initiated for this booking');
      console.log('   2. pidx value changed or was corrupted');
      console.log('   3. Booking was deleted');
      
      return res.status(404).json({
        success: false,
        message: 'Booking not found for this payment reference'
      });
    }

    console.log('✅ Booking Found:', {
      booking_id: booking.booking_id,
      user_id: booking.user_id,
      current_payment_status: booking.payment_status,
      current_booking_status: booking.booking_status,
      stored_pidx: booking.pidx
    });

    // Step 3: Verify user permission
    console.log('\n🔐 STEP 3: Verifying User Permission');
    if (!isAdmin && booking.user_id !== userId) {
      console.log('❌ PERMISSION DENIED');
      console.log('   Booking user_id:', booking.user_id);
      console.log('   Request user_id:', userId);
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to verify this payment'
      });
    }
    console.log('✅ User authorized to verify this payment');

    // Step 4: Check Khalti Payment Status
    console.log('\n💰 STEP 4: Checking Khalti Payment Status');
    const khaltiStatus = String(lookupData.status || '').trim().toUpperCase();
    console.log('   Raw status from Khalti:', lookupData.status);
    console.log('   Normalized status:', khaltiStatus);
    console.log('   Is "COMPLETED"?:', khaltiStatus === 'COMPLETED');

    if (khaltiStatus !== 'COMPLETED') {
      console.log('⚠️ Payment not completed. Status:', khaltiStatus);
      
      // Update booking status to FAILED
      console.log('\n📝 Updating booking status to FAILED');
      booking.payment_status = PAYMENT_STATUS.FAILED;
      booking.booking_status = BOOKING_STATUS.APPROVED; // Return to approved state
      booking.payment_method = 'khalti';
      booking.pidx = pidx;
      
      try {
        await booking.save();
        console.log('✅ Booking updated to FAILED status');
      } catch (saveError) {
        console.error('❌ Error saving booking:', saveError.message);
      }

      return res.status(200).json({
        success: false,
        message: `Payment status is ${khaltiStatus}, not completed`,
        data: {
          booking: booking.toJSON ? booking.toJSON() : booking,
          khalti_status: khaltiStatus
        }
      });
    }

    // Step 5: Payment Verified - Update Booking
    console.log('\n✅ STEP 5: Payment Verified! Updating Booking Status');
    
    // Set all required fields
    booking.payment_status = PAYMENT_STATUS.PAID;
    booking.booking_status = BOOKING_STATUS.CONFIRMED;
    booking.status = toLegacyStatus(BOOKING_STATUS.CONFIRMED);
    booking.payment_method = 'khalti';
    booking.pidx = pidx;
    // Use transaction_id from Khalti response, fallback to pidx
    booking.transaction_id = lookupData.transaction_id || lookupData.transactionId || pidx;
    booking.updated_at = new Date();
    
    console.log('   Updates to apply:', {
      payment_status: booking.payment_status,
      booking_status: booking.booking_status,
      transaction_id: booking.transaction_id,
      pidx: booking.pidx,
      payment_method: booking.payment_method
    });

    try {
      // Save the booking
      console.log('\n💾 Attempting to save booking to database...');
      await booking.save();
      console.log('✅ Booking saved to database');
      
      // Verify save was successful by querying database directly
      const savedBooking = await Booking.findOne({ where: { booking_id: booking.booking_id } });
      if (!savedBooking) {
        throw new Error('Booking save verification failed - booking not found after save');
      }
      
      console.log('✅ Booking verified in database:', {
        payment_status: savedBooking.payment_status,
        booking_status: savedBooking.booking_status,
        transaction_id: savedBooking.transaction_id,
        pidx: savedBooking.pidx
      });
      
      // Reload booking object to ensure we have latest data
      await booking.reload();
      console.log('✅ Booking reloaded from database');
      console.log('   Confirmed values:', {
        payment_status: booking.payment_status,
        booking_status: booking.booking_status,
        transaction_id: booking.transaction_id
      });
    } catch (saveError) {
      console.error('❌ CRITICAL ERROR: Failed to save booking:', saveError.message);
      console.error('   Error details:', saveError);
      console.error('   Stack:', saveError.stack);
      
      // Don't just throw - return error response so frontend knows
      return res.status(500).json({
        success: false,
        message: 'Payment verified by Khalti but failed to save to database: ' + saveError.message,
        data: {
          khalti: {
            status: lookupData.status,
            transaction_id: lookupData.transaction_id,
            amount: lookupData.amount
          },
          error: process.env.NODE_ENV === 'development' ? saveError.message : undefined
        }
      });
    }

    // Step 6: Update/Create Payment Record (non-critical)
    console.log('\n💾 STEP 6: Updating Payment Record');
    try {
      let payment = await Payment.findOne({ where: { booking_id: booking.booking_id } });
      
      if (!payment) {
        console.log('   Creating new Payment record');
        payment = await Payment.create({
          booking_id: booking.booking_id,
          amount: booking.price,
          payment_method: 'khalti',
          transaction_details: JSON.stringify({
            stage: 'verified',
            khalti_response: lookupData
          }),
          payment_date: new Date()
        });
      } else {
        console.log('   Updating existing Payment record');
        payment.payment_method = 'khalti';
        payment.transaction_details = JSON.stringify({
          stage: 'verified',
          khalti_response: lookupData
        });
        payment.payment_date = new Date();
        await payment.save();
      }
      console.log('✅ Payment record updated successfully');
    } catch (paymentError) {
      console.error('⚠️ Non-critical: Payment record update failed:', paymentError.message);
      // Continue - payment to booking is verified, payment record is optional
    }

    // Step 7: Create Notification (non-critical)
    console.log('\n🔔 STEP 7: Creating Notification');
    try {
      await createNotification(
        booking.user_id,
        'payment_completed',
        'Payment Completed',
        'Payment received successfully. Your booking is now confirmed.',
        'booking',
        booking.booking_id
      );
      console.log('✅ Notification created');
    } catch (notifError) {
      console.error('⚠️ Non-critical: Notification creation failed:', notifError.message);
      // Continue - notification is optional
    }

    // Step 8: Send Success Response
    console.log('\n🎉 STEP 8: Sending Success Response');
    console.log('   Final booking state:', {
      payment_status: booking.payment_status,
      booking_status: booking.booking_status,
      transaction_id: booking.transaction_id
    });

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully. Booking is now confirmed.',
      data: {
        booking: booking.toJSON ? booking.toJSON() : booking,
        khalti: {
          status: lookupData.status,
          transaction_id: lookupData.transaction_id,
          amount: lookupData.amount
        }
      }
    });

  } catch (error) {
    console.error('❌ FATAL ERROR in verifyKhaltiPayment:', error.message);
    console.error('   Stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      message: 'Payment verification failed: ' + error.message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get booking summary by categories (upcoming, manage, history)
 * GET /api/bookings/summary
 * Returns all three categories in one response, sorted by latest
 */
const getBookingsSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch upcoming bookings
    const upcomingBookings = await Booking.findAll({
      where: {
        user_id: userId,
        start_date: { [Op.gte]: today },
        booking_status: {
          [Op.notIn]: [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.REJECTED]
        }
      },
      include: [{
        model: Pet,
        as: 'pet',
        attributes: ['pet_id', 'name', 'breed', 'photo']
      }],
      order: [['start_date', 'DESC']]
    });

    // Fetch bookings needing management (pending, approved, confirmed upcoming)
    const manageBookings = await Booking.findAll({
      where: {
        user_id: userId,
        start_date: { [Op.gte]: today },
        $and: [
          {
            [Op.or]: [
              { booking_status: BOOKING_STATUS.PENDING },
              { booking_status: BOOKING_STATUS.APPROVED }
            ]
          }
        ]
      },
      include: [{
        model: Pet,
        as: 'pet',
        attributes: ['pet_id', 'name', 'breed', 'photo']
      }],
      order: [['start_date', 'DESC']]
    });

    // Fetch booking history (past or completed/cancelled)
    const historyBookings = await Booking.findAll({
      where: {
        user_id: userId,
        [Op.or]: [
          { booking_status: BOOKING_STATUS.COMPLETED },
          { booking_status: BOOKING_STATUS.CANCELLED },
          { booking_status: BOOKING_STATUS.REJECTED },
          {
            [Op.and]: [
              { end_date: { [Op.lt]: today } }
            ]
          }
        ]
      },
      include: [{
        model: Pet,
        as: 'pet',
        attributes: ['pet_id', 'name', 'breed', 'photo']
      }],
      order: [['booking_id', 'DESC']]
    });

    res.status(200).json({
      success: true,
      summary: {
        upcoming: {
          count: upcomingBookings.length,
          data: upcomingBookings
        },
        manage: {
          count: manageBookings.length,
          data: manageBookings
        },
        history: {
          count: historyBookings.length,
          data: historyBookings
        }
      },
      total: upcomingBookings.length + manageBookings.length + historyBookings.length
    });

  } catch (error) {
    console.error('Error fetching bookings summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings summary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
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
  getBookingsSummary,
  SERVICE_CONFIG,
  BOOKING_STATUS,
  PAYMENT_STATUS
};
