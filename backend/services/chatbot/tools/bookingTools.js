const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const { Booking, Service, Pet } = require("../../../models");
const { Op } = require("sequelize");

// Service capacity configuration
const SERVICE_CONFIG = {
  'Daycation/Pet Sitting': {
    maxCapacityPerDay: 10
  },
  'Pet Boarding': {
    maxCapacityPerDay: 10
  },
  'Grooming': {
    maxCapacityPerDay: 10
  }
};

/**
 * Tool: Check availability calendar showing slots for each date
 */
const checkAvailability = tool(
  async ({ userId, month, year, serviceType }) => {
    try {
      // Default to current month/year if not provided
      const targetYear = year || new Date().getFullYear();
      const targetMonth = month || (new Date().getMonth() + 1);
      
      // Calculate date range for the entire month
      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 0); // Last day of month
      
      // Get all bookings for this service type in the month
      const bookings = await Booking.findAll({
        where: {
          service_type: serviceType,
          status: { [Op.in]: ['confirmed', 'pending'] },
          [Op.or]: [
            {
              start_date: {
                [Op.between]: [startDate, endDate]
              }
            },
            {
              end_date: {
                [Op.between]: [startDate, endDate]
              }
            },
            {
              [Op.and]: [
                { start_date: { [Op.lte]: startDate } },
                { end_date: { [Op.gte]: endDate } }
              ]
            }
          ]
        },
        attributes: ['booking_id', 'start_date', 'end_date', 'service_type']
      });
      
      // Log raw booking data
      console.log(`📋 Raw bookings from database:`, bookings.map(b => ({
        id: b.booking_id,
        start_date: b.start_date,
        end_date: b.end_date,
        start_iso: new Date(b.start_date).toISOString(),
        end_iso: new Date(b.end_date || b.start_date).toISOString()
      })));
      
      // Get maximum capacity for this service type
      const config = SERVICE_CONFIG[serviceType];
      if (!config) {
        return JSON.stringify({
          error: true,
          message: `Invalid service type: ${serviceType}`
        });
      }
      const maxCapacity = config.maxCapacityPerDay;
      
      // Calculate tomorrow's date (exclude today and past dates)
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      console.log('🗓️ Date filtering:', {
        now: now.toISOString(),
        today: today.toISOString(),
        tomorrow: tomorrow.toISOString(),
        todayTime: today.getTime(),
        tomorrowTime: tomorrow.getTime()
      });
      
      // Create availability calendar
      const calendar = [];
      const totalDays = endDate.getDate();
      
      for (let day = 1; day <= totalDays; day++) {
        const currentDate = new Date(targetYear, targetMonth - 1, day);
        
        // Debug first iteration
        if (day === 1) {
          console.log('📅 First day check:', {
            day,
            currentDate: currentDate.toISOString(),
            currentDateTime: currentDate.getTime(),
            tomorrowTime: tomorrow.getTime(),
            willInclude: currentDate.getTime() >= tomorrow.getTime()
          });
        }
        
        // Only include dates from tomorrow onwards
        if (currentDate.getTime() < tomorrow.getTime()) {
          continue;
        }
        
        // Normalize current date to midnight for accurate comparison
        const normalizedCurrentDate = new Date(currentDate);
        normalizedCurrentDate.setHours(0, 0, 0, 0);
        
        // Get current date as simple string for comparison (YYYY-MM-DD)
        const currentDateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Count bookings that overlap with this specific date
        const overlappingBookings = bookings.filter(booking => {
          // Get date strings for comparison (strips time and timezone)
          const bookingStartDate = new Date(booking.start_date);
          const bookingEndDate = new Date(booking.end_date || booking.start_date);
          
          const startStr = `${bookingStartDate.getFullYear()}-${String(bookingStartDate.getMonth() + 1).padStart(2, '0')}-${String(bookingStartDate.getDate()).padStart(2, '0')}`;
          const endStr = `${bookingEndDate.getFullYear()}-${String(bookingEndDate.getMonth() + 1).padStart(2, '0')}-${String(bookingEndDate.getDate()).padStart(2, '0')}`;
          
          // Debug for March 5
          if (day === 5) {
            console.log(`🔍 Checking March 5 against booking ${booking.booking_id}:`, {
              currentDateStr,
              startStr,
              endStr,
              isAfterOrEqualStart: currentDateStr >= startStr,
              isBeforeOrEqualEnd: currentDateStr <= endStr,
              overlaps: currentDateStr >= startStr && currentDateStr <= endStr
            });
          }
          
          // Check if current date falls within the booking range (inclusive) using string comparison
          return currentDateStr >= startStr && currentDateStr <= endStr;
        });
        
        const slotsUsed = overlappingBookings.length;
        const slotsAvailable = maxCapacity - slotsUsed;
        const isAvailable = slotsAvailable > 0;
        
        // Format date as "Mar 5, 2026" for better readability
        const formattedDate = currentDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
        
        // Debug logging for dates with bookings
        if (slotsUsed > 0) {
          console.log(`📅 ${formattedDate}: ${slotsUsed} slot(s) occupied`, {
            bookings: overlappingBookings.map(b => ({
              id: b.booking_id,
              start: new Date(b.start_date).toISOString().split('T')[0],
              end: new Date(b.end_date || b.start_date).toISOString().split('T')[0]
            }))
          });
        }
        
        calendar.push({
          date: currentDate.toISOString().split('T')[0], // ISO format for sorting
          formattedDate, // Human-readable format
          dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
          slotsAvailable,
          slotsUsed,
          maxCapacity,
          isAvailable,
          status: isAvailable ? 'Available' : 'Fully Booked'
        });
      }
      
      console.log(`✅ Calendar generated: ${calendar.length} days (excluding today and past)`);
      
      // Log booking details for debugging
      console.log(`📋 Found ${bookings.length} bookings for ${serviceType}:`, 
        bookings.map(b => ({
          id: b.booking_id,
          start: new Date(b.start_date).toISOString().split('T')[0],
          end: new Date(b.end_date || b.start_date).toISOString().split('T')[0],
          daysOccupied: Math.ceil((new Date(b.end_date || b.start_date) - new Date(b.start_date)) / (1000 * 60 * 60 * 24)) + 1
        }))
      );
      
      const availableDates = calendar.filter(d => d.isAvailable);
      const fullyBookedDates = calendar.filter(d => !d.isAvailable);
      
      return JSON.stringify({
        serviceType,
        month: targetMonth,
        year: targetYear,
        monthName: new Date(targetYear, targetMonth - 1).toLocaleDateString('en-US', { month: 'long' }),
        totalDays: calendar.length,
        availableDays: availableDates.length,
        fullyBookedDays: fullyBookedDates.length,
        maxCapacityPerDay: maxCapacity,
        calendar,
        summary: `For ${serviceType} in ${new Date(targetYear, targetMonth - 1).toLocaleDateString('en-US', { month: 'long' })} ${targetYear}: ${availableDates.length} days have availability, ${fullyBookedDates.length} days are fully booked.`
      });
    } catch (error) {
      return JSON.stringify({
        error: true,
        message: `Error checking availability: ${error.message}`
      });
    }
  },
  {
    name: "check_availability",
    description: "Check availability calendar for Pet Boarding showing slots available for each date in a month. Use this when user asks about available dates for boarding. Returns detailed daily availability with slot counts.",
    schema: z.object({
      userId: z.number().describe("The authenticated user's ID"),
      month: z.number().optional().describe("Month number (1-12). Default: current month"),
      year: z.number().optional().describe("Year (e.g., 2026). Default: current year"),
      serviceType: z.string().describe("Service type: 'Daycation/Pet Sitting', 'Pet Boarding', or 'Grooming'")
    })
  }
);

/**
 * Tool: Get user's bookings
 */
const getUserBookings = tool(
  async ({ userId, status, limit = 10 }) => {
    try {
      const whereClause = {
        user_id: userId,
      };
      
      if (status) {
        whereClause.status = status;
      }
      
      const bookings = await Booking.findAll({
        where: whereClause,
        include: [
          {
            model: Pet,
            as: 'pet',
            attributes: ['name', 'breed']
          },
          {
            model: Service,
            as: 'service',
            attributes: ['name', 'description']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: limit
      });
      
      if (bookings.length === 0) {
        return JSON.stringify({
          bookings: [],
          count: 0,
          message: status 
            ? `You have no ${status} bookings.`
            : "You haven't made any bookings yet."
        });
      }
      
      const formattedBookings = bookings.map(b => ({
        id: b.booking_id,
        confirmationCode: b.confirmation_code,
        petName: b.pet?.name,
        petBreed: b.pet?.breed,
        serviceType: b.service_type,
        serviceName: b.service?.name,
        startDate: b.start_date,
        endDate: b.end_date,
        numberOfDays: b.number_of_days,
        price: parseFloat(b.price),
        status: b.status,
        paymentMethod: b.payment_method,
        requiresPickup: b.requires_pickup,
        pickupAddress: b.pickup_address,
        createdAt: b.created_at
      }));
      
      return JSON.stringify({
        bookings: formattedBookings,
        count: bookings.length,
        message: `Found ${bookings.length} booking(s).`
      });
    } catch (error) {
      return JSON.stringify({
        error: true,
        message: `Error fetching bookings: ${error.message}`
      });
    }
  },
  {
    name: "get_user_bookings",
    description: "Get the user's booking history. Can filter by status (pending, confirmed, completed, cancelled). Use this when user asks about their bookings, reservations, or appointments.",
    schema: z.object({
      userId: z.number().describe("The authenticated user's ID"),
      status: z.string().optional().describe("Filter by booking status: pending, confirmed, completed, or cancelled"),
      limit: z.number().optional().default(10).describe("Maximum number of bookings to return")
    })
  }
);

/**
 * Tool: Get specific booking details
 */
const getBookingDetails = tool(
  async ({ userId, bookingId }) => {
    try {
      const { Payment, Review } = require("../../../models");
      
      const booking = await Booking.findOne({
        where: {
          booking_id: bookingId,
          user_id: userId // Ensure user can only access their own bookings
        },
        include: [
          {
            model: Pet,
            as: 'pet'
          },
          {
            model: Service,
            as: 'service'
          },
          {
            model: Payment,
            as: 'payment'
          },
          {
            model: Review,
            as: 'review'
          }
        ]
      });
      
      if (!booking) {
        return JSON.stringify({
          found: false,
          message: "Booking not found or you don't have access to it."
        });
      }
      
      const details = {
        id: booking.booking_id,
        confirmationCode: booking.confirmation_code,
        status: booking.status,
        pet: booking.pet ? {
          name: booking.pet.name,
          breed: booking.pet.breed,
          age: booking.pet.age
        } : null,
        service: {
          type: booking.service_type,
          name: booking.service?.name,
          description: booking.service?.description
        },
        dates: {
          start: booking.start_date,
          end: booking.end_date,
          numberOfDays: booking.number_of_days
        },
        pricing: {
          price: parseFloat(booking.price),
          paymentMethod: booking.payment_method,
          paid: booking.payment ? true : false,
          paymentDate: booking.payment?.payment_date
        },
        pickup: {
          required: booking.requires_pickup,
          address: booking.pickup_address,
          time: booking.pickup_time
        },
        dropoff: {
          address: booking.dropoff_address,
          time: booking.dropoff_time
        },
        review: booking.review ? {
          rating: parseFloat(booking.review.overall_rating),
          text: booking.review.review_text
        } : null,
        createdAt: booking.created_at,
        updatedAt: booking.updated_at
      };
      
      return JSON.stringify({
        found: true,
        booking: details
      });
    } catch (error) {
      return JSON.stringify({
        error: true,
        message: `Error fetching booking details: ${error.message}`
      });
    }
  },
  {
    name: "get_booking_details",
    description: "Get detailed information about a specific booking including payment, pet details, and review. Use this when user asks about a specific booking or confirmation code.",
    schema: z.object({
      userId: z.number().describe("The authenticated user's ID"),
      bookingId: z.number().describe("The booking ID to retrieve details for")
    })
  }
);

module.exports = {
  checkAvailability,
  getUserBookings,
  getBookingDetails
};
