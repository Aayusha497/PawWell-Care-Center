/**
 * Booking Controller
 * 
 * Handles all booking operations including CRUD, availability checks, and admin actions
 */

const { Booking, Pet } = require('../models');
const { Op } = require('sequelize');

// Service pricing and capacity configuration
const SERVICE_CONFIG = {
  'Daycation/Pet Sitting': {
    pricePerDay: 2000,
    maxCapacityPerDay: 10,
    requiresDateRange: false
  },
  'Pet Boarding': {
    pricePerNight: 2000,
    maxCapacityPerDay: 5,
    requiresDateRange: true
  },
  'Grooming': {
    flatRate: 3500,
    maxCapacityPerDay: 8,
    requiresDateRange: false
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

    // Generate confirmation code
    const confirmationCode = `BK${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Create booking
    const booking = await Booking.create({
      user_id: userId,
      pet_id,
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
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, upcoming, past } = req.query;

    const whereClause = {
      user_id: userId
    };

    // Filter by status if provided
    if (status) {
      whereClause.status = status;
    }

    // Filter upcoming bookings (start_date >= today)
    if (upcoming === 'true') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      whereClause.start_date = {
        [Op.gte]: today
      };
    }

    // Filter past bookings (end_date < today OR status = completed/cancelled)
    if (past === 'true') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      whereClause[Op.or] = [
        {
          end_date: {
            [Op.lt]: today
          }
        },
        {
          status: {
            [Op.in]: ['completed', 'cancelled']
          }
        }
      ];
    }

    const bookings = await Booking.findAll({
      where: whereClause,
      include: [{
        model: Pet,
        as: 'pet',
        attributes: ['pet_id', 'name', 'breed', 'photo']
      }],
      order: [['start_date', 'DESC']]
    });

    res.status(200).json({
      success: true,
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

    // Check if booking belongs to user (or user is admin)
    if (booking.user_id !== userId && req.user.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this booking'
      });
    }

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
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule cancelled bookings'
      });
    }

    // Cannot reschedule completed bookings
    if (booking.status === 'completed') {
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
      
      // Reset status to pending when rescheduling
      booking.status = 'pending';
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
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed bookings'
      });
    }

    // Confirmed bookings can only be cancelled before start date
    if (booking.status === 'confirmed') {
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
    booking.status = 'cancelled';
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
        status: 'pending'
      },
      include: [
        {
          model: Pet,
          as: 'pet',
          attributes: ['pet_id', 'name', 'breed', 'photo'],
          include: [{
            model: require('../models').User,
            as: 'owner',
            attributes: ['id', 'first_name', 'last_name', 'email', 'phone_number']
          }]
        }
      ],
      order: [['created_at', 'ASC']]
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

/**
 * Admin: Approve a booking
 * PUT /api/bookings/admin/:bookingId/approve
 */
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

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending bookings can be approved'
      });
    }

    booking.status = 'confirmed';
    booking.updated_at = new Date();
    await booking.save();

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

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending bookings can be rejected'
      });
    }

    booking.status = 'cancelled';
    booking.updated_at = new Date();
    await booking.save();

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
 * Admin: Get all bookings with filters
 * GET /api/bookings/admin/all
 */
const getAllBookings = async (req, res) => {
  try {
    const { status, service_type, date_from, date_to } = req.query;

    const whereClause = {};

    if (status) {
      whereClause.status = status;
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

    const bookings = await Booking.findAll({
      where: whereClause,
      include: [
        {
          model: Pet,
          as: 'pet',
          attributes: ['pet_id', 'name', 'breed', 'photo'],
          include: [{
            model: require('../models').User,
            as: 'user',
            attributes: ['id', 'first_name', 'last_name', 'email', 'phone_number']
          }]
        }
      ],
      order: [['start_date', 'DESC']]
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
  getAllBookings,
  SERVICE_CONFIG
};
