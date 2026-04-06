const { Booking, Pet, User, Payment, Service } = require('../models');
const { Op, QueryTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Build safe WHERE conditions for Sequelize queries
 */
const buildSequelizeWhere = (req) => {
  const { serviceType, status, startDate, endDate } = req.query;
  const where = {};
  
  if (serviceType) {
    where.service_type = serviceType;
  }
  
  if (status) {
    where.booking_status = status;
  }
  
  if (startDate || endDate) {
    where.start_date = {};
    if (startDate) {
      where.start_date[Op.gte] = new Date(startDate);
    }
    if (endDate) {
      where.start_date[Op.lte] = new Date(endDate);
    }
  }
  
  return where;
};

/**
 * @desc    Get comprehensive analytics dashboard data
 * @route   GET /api/analytics/dashboard
 * @access  Admin only
 */
const getDashboardAnalytics = async (req, res) => {
  try {
    const { serviceType, status, startDate, endDate } = req.query;
    
    // Build filter conditions - separate payment filters from other filters
    let filterConditions = '';
    let paymentFilterCondition = '';
    let bookingStatusFilterCondition = '';
    
    if (serviceType || startDate || endDate) {
      let conditions = [];
      if (serviceType) conditions.push(`b.service_type = '${serviceType}'`);
      if (startDate) conditions.push(`b.start_date >= '${startDate}'`);
      if (endDate) conditions.push(`b.start_date <= '${endDate}'`);
      filterConditions = conditions.length > 0 ? ' AND ' + conditions.join(' AND ') : '';
    }

    // Separate payment and booking status filters
    if (status) {
      if (status === 'paid' || status === 'unpaid') {
        paymentFilterCondition = ` AND b.payment_status = '${status}'`;
      } else {
        bookingStatusFilterCondition = ` AND b.booking_status = '${status}'`;
      }
    }

    // Fetch top cards data (quick stats)
    const [
      totalBookings,
      activeBookings,
      totalPets,
      totalRevenue,
      revenueThisMonth,
      pendingApprovals,
      urgentItems
    ] = await Promise.all([
      // Total bookings (with filters - all statuses)
      sequelize.query(
        `SELECT COUNT(*) as count FROM bookings b WHERE b.booking_status IS NOT NULL${filterConditions}${bookingStatusFilterCondition}${paymentFilterCondition}`,
        { type: QueryTypes.SELECT }
      ),
      
      // Active bookings (approved or confirmed and ongoing)
      sequelize.query(
        `SELECT COUNT(*) as count FROM bookings b 
         WHERE b.booking_status IN ('approved', 'confirmed')${filterConditions}${bookingStatusFilterCondition}${paymentFilterCondition}`,
        { type: QueryTypes.SELECT }
      ),
      
      // Total pets registered (only from selected bookings if filters exist)
      (filterConditions || bookingStatusFilterCondition || paymentFilterCondition)
        ? sequelize.query(
            `SELECT COUNT(DISTINCT b.pet_id) as count FROM bookings b 
             WHERE b.pet_id IS NOT NULL${filterConditions}${bookingStatusFilterCondition}${paymentFilterCondition}`,
            { type: QueryTypes.SELECT }
          )
        : sequelize.query(
            `SELECT COUNT(*) as count FROM pets WHERE deleted_at IS NULL`,
            { type: QueryTypes.SELECT }
          ),
      
      // Total revenue from paid bookings (only apply date/service filters, not payment/booking status filters)
      sequelize.query(
        `SELECT COALESCE(SUM(b.price), 0) as total FROM bookings b 
         WHERE b.payment_status = 'paid'${filterConditions}`,
        { type: QueryTypes.SELECT }
      ),
      
      // Revenue this month (only apply date/service filters, not payment/booking status filters)
      sequelize.query(
        `SELECT COALESCE(SUM(b.price), 0) as total FROM bookings b 
         WHERE b.payment_status = 'paid' 
         AND EXTRACT(MONTH FROM b.created_at) = EXTRACT(MONTH FROM NOW())
         AND EXTRACT(YEAR FROM b.created_at) = EXTRACT(YEAR FROM NOW())${filterConditions}`,
        { type: QueryTypes.SELECT }
      ),
      
      // Pending approvals (only filter by date/service, ignore booking/payment status)
      sequelize.query(
        `SELECT COUNT(*) as count FROM bookings b 
         WHERE b.booking_status = 'pending'${filterConditions}`,
        { type: QueryTypes.SELECT }
      ),
      
      // Urgent items (only filter by date/service, ignore booking/payment status)
      sequelize.query(
        `SELECT COUNT(*) as count FROM bookings b 
         WHERE b.booking_status = 'approved' 
         AND b.start_date >= NOW() 
         AND b.start_date <= NOW() + INTERVAL '3 days'${filterConditions}`,
        { type: QueryTypes.SELECT }
      )
    ]);

    const topCardsData = {
      totalBookings: totalBookings && totalBookings.length > 0 ? parseInt(totalBookings[0].count) || 0 : 0,
      activeBookings: activeBookings && activeBookings.length > 0 ? parseInt(activeBookings[0].count) || 0 : 0,
      totalPets: totalPets && totalPets.length > 0 ? parseInt(totalPets[0].count) || 0 : 0,
      totalRevenue: totalRevenue && totalRevenue.length > 0 ? parseFloat(totalRevenue[0].total) || 0 : 0,
      revenueThisMonth: revenueThisMonth && revenueThisMonth.length > 0 ? parseFloat(revenueThisMonth[0].total) || 0 : 0,
      pendingApprovals: pendingApprovals && pendingApprovals.length > 0 ? parseInt(pendingApprovals[0].count) || 0 : 0,
      urgentItems: urgentItems && urgentItems.length > 0 ? parseInt(urgentItems[0].count) || 0 : 0
    };

    return res.status(200).json({
      success: true,
      data: {
        topCards: topCardsData
      }
    });
  } catch (error) {
    console.error('❌ Get dashboard analytics error:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @desc    Get booking trends over time (for line chart)
 * @route   GET /api/analytics/booking-trends
 * @access  Admin only
 */
const getBookingTrends = async (req, res) => {
  try {
    const { days = 30, serviceType, status, startDate, endDate } = req.query;
    let whereConditions = ['b.start_date >= NOW() - INTERVAL \'' + parseInt(days) + ' days\''];
    
    if (serviceType) {
      whereConditions.push('b.service_type = \'' + serviceType + '\'');
    }
    if (status) {
      if (status === 'paid' || status === 'unpaid') {
        whereConditions.push('b.payment_status = \'' + status + '\'');
      } else {
        whereConditions.push('b.booking_status = \'' + status + '\'');
      }
    }
    if (startDate) {
      whereConditions.push('b.start_date >= \'' + startDate + '\'');
    }
    if (endDate) {
      whereConditions.push('b.start_date <= \'' + endDate + '\'');
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    const trends = await sequelize.query(
      `SELECT 
        DATE(b.start_date) as date,
        COUNT(*) as bookings
      FROM bookings b
      WHERE ${whereClause}
      GROUP BY DATE(b.start_date)
      ORDER BY date ASC`,
      { type: QueryTypes.SELECT }
    );

    return res.status(200).json({
      success: true,
      data: trends.map(t => ({
        date: new Date(t.date).toISOString().split('T')[0],
        bookings: parseInt(t.bookings)
      }))
    });
  } catch (error) {
    console.error('❌ Get booking trends error:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch booking trends',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @desc    Get revenue trends over time (for line chart)
 * @route   GET /api/analytics/revenue-trends
 * @access  Admin only
 */
const getRevenueTrends = async (req, res) => {
  try {
    const { days = 30, serviceType, status, startDate, endDate } = req.query;
    let whereConditions = ['b.payment_status = \'paid\' AND b.created_at >= NOW() - INTERVAL \'' + parseInt(days) + ' days\''];
    
    if (serviceType) {
      whereConditions.push('b.service_type = \'' + serviceType + '\'');
    }
    // NOTE: Don't apply payment status filters to revenue - only apply booking status if it's not a payment status
    if (status && status !== 'paid' && status !== 'unpaid') {
      whereConditions.push('b.booking_status = \'' + status + '\'');
    }
    if (startDate) {
      whereConditions.push('b.start_date >= \'' + startDate + '\'');
    }
    if (endDate) {
      whereConditions.push('b.start_date <= \'' + endDate + '\'');
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    const trends = await sequelize.query(
      `SELECT 
        DATE(b.created_at) as date,
        COALESCE(SUM(b.price), 0) as revenue
      FROM bookings b
      WHERE ${whereClause}
      GROUP BY DATE(b.created_at)
      ORDER BY date ASC`,
      { type: QueryTypes.SELECT }
    );

    return res.status(200).json({
      success: true,
      data: trends.map(t => ({
        date: new Date(t.date).toISOString().split('T')[0],
        revenue: parseFloat(t.revenue)
      }))
    });
  } catch (error) {
    console.error('❌ Get revenue trends error:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue trends',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @desc    Get top services by booking count
 * @route   GET /api/analytics/top-services
 * @access  Admin only
 */
const getTopServices = async (req, res) => {
  try {
    const { limit = 5, serviceType, status, startDate, endDate } = req.query;
    let whereConditions = ['b.service_type IS NOT NULL'];
    
    if (serviceType) {
      whereConditions.push('b.service_type = \'' + serviceType + '\'');
    }
    if (status) {
      if (status === 'paid' || status === 'unpaid') {
        whereConditions.push('b.payment_status = \'' + status + '\'');
      } else {
        whereConditions.push('b.booking_status = \'' + status + '\'');
      }
    }
    if (startDate) {
      whereConditions.push('b.start_date >= \'' + startDate + '\'');
    }
    if (endDate) {
      whereConditions.push('b.start_date <= \'' + endDate + '\'');
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    const services = await sequelize.query(
      `SELECT 
        b.service_type,
        COUNT(*) as count
      FROM bookings b
      WHERE ${whereClause}
      GROUP BY b.service_type
      ORDER BY count DESC
      LIMIT ${parseInt(limit)}`,
      { type: QueryTypes.SELECT }
    );

    return res.status(200).json({
      success: true,
      data: services.map(s => ({
        name: s.service_type || 'Unknown',
        value: parseInt(s.count)
      }))
    });
  } catch (error) {
    console.error('❌ Get top services error:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch top services',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @desc    Get booking status distribution (pie chart)
 * @route   GET /api/analytics/booking-status
 * @access  Admin only
 */
const getBookingStatusDistribution = async (req, res) => {
  try {
    const { serviceType, status, startDate, endDate } = req.query;
    let whereConditions = ['b.booking_status IS NOT NULL'];
    
    if (serviceType) {
      whereConditions.push('b.service_type = \'' + serviceType + '\'');
    }
    if (status) {
      if (status === 'paid' || status === 'unpaid') {
        whereConditions.push('b.payment_status = \'' + status + '\'');
      } else {
        whereConditions.push('b.booking_status = \'' + status + '\'');
      }
    }
    if (startDate) {
      whereConditions.push('b.start_date >= \'' + startDate + '\'');
    }
    if (endDate) {
      whereConditions.push('b.start_date <= \'' + endDate + '\'');
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    const statuses = await sequelize.query(
      `SELECT 
        b.booking_status as status,
        COUNT(*) as count
      FROM bookings b
      WHERE ${whereClause}
      GROUP BY b.booking_status`,
      { type: QueryTypes.SELECT }
    );

    return res.status(200).json({
      success: true,
      data: statuses.map(s => ({
        name: s.status?.charAt(0).toUpperCase() + s.status?.slice(1) || 'Unknown',
        value: parseInt(s.count)
      }))
    });
  } catch (error) {
    console.error('❌ Get booking status distribution error:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch booking status distribution',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @desc    Get pet types distribution (pie chart)
 * @route   GET /api/analytics/pet-types
 * @access  Admin only
 */
const getPetTypesDistribution = async (req, res) => {
  try {
    const { serviceType, status, startDate, endDate } = req.query;
    let whereConditions = ['p.deleted_at IS NULL AND p.breed IS NOT NULL'];
    
    if (serviceType) {
      whereConditions.push('b.service_type = \'' + serviceType + '\'');
    }
    if (status) {
      if (status === 'paid' || status === 'unpaid') {
        whereConditions.push('b.payment_status = \'' + status + '\'');
      } else {
        whereConditions.push('b.booking_status = \'' + status + '\'');
      }
    }
    if (startDate) {
      whereConditions.push('b.start_date >= \'' + startDate + '\'');
    }
    if (endDate) {
      whereConditions.push('b.start_date <= \'' + endDate + '\'');
    }

    const whereClause = whereConditions.join(' AND ');

    const petTypes = await sequelize.query(
      `SELECT 
        p.breed as type,
        COUNT(*) as count
      FROM pets p
      LEFT JOIN bookings b ON p.pet_id = b.pet_id
      WHERE ${whereClause}
      GROUP BY p.breed
      ORDER BY count DESC
      LIMIT 10`,
      { type: QueryTypes.SELECT }
    );

    return res.status(200).json({
      success: true,
      data: petTypes.map(p => ({
        name: p.type || 'Unknown',
        value: parseInt(p.count)
      }))
    });
  } catch (error) {
    console.error('❌ Get pet types distribution error:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pet types distribution',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @desc    Get peak hours/days for bookings
 * @route   GET /api/analytics/peak-hours
 * @access  Admin only
 */
const getPeakHours = async (req, res) => {
  try {
    const { serviceType, status, startDate, endDate } = req.query;
    let whereConditions = ['b.start_date >= NOW() - INTERVAL \'30 days\''];
    
    if (serviceType) {
      whereConditions.push('b.service_type = \'' + serviceType + '\'');
    }
    if (status) {
      if (status === 'paid' || status === 'unpaid') {
        whereConditions.push('b.payment_status = \'' + status + '\'');
      } else {
        whereConditions.push('b.booking_status = \'' + status + '\'');
      }
    }
    if (startDate) {
      whereConditions.push('b.start_date >= \'' + startDate + '\'');
    }
    if (endDate) {
      whereConditions.push('b.start_date <= \'' + endDate + '\'');
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    const hours = await sequelize.query(
      `SELECT 
        EXTRACT(HOUR FROM b.start_date) as hour,
        COUNT(*) as count
      FROM bookings b
      WHERE ${whereClause}
      GROUP BY EXTRACT(HOUR FROM b.start_date)
      ORDER BY hour ASC`,
      { type: QueryTypes.SELECT }
    );

    const days = await sequelize.query(
      `SELECT 
        TO_CHAR(b.start_date, 'Day') as day,
        EXTRACT(DOW FROM b.start_date) as dow,
        COUNT(*) as count
      FROM bookings b
      WHERE ${whereClause}
      GROUP BY EXTRACT(DOW FROM b.start_date), TO_CHAR(b.start_date, 'Day')
      ORDER BY dow ASC`,
      { type: QueryTypes.SELECT }
    );

    return res.status(200).json({
      success: true,
      data: {
        hours: hours.map(h => ({
          hour: parseInt(h.hour),
          count: parseInt(h.count)
        })),
        days: days.map(d => ({
          day: d.day.trim(),
          count: parseInt(d.count)
        }))
      }
    });
  } catch (error) {
    console.error('❌ Get peak hours error:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch peak hours',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @desc    Get recent bookings (for table)
 * @route   GET /api/analytics/recent-bookings
 * @access  Admin only
 */
const getRecentBookings = async (req, res) => {
  try {
    const { limit = 10, days, serviceType, status, startDate, endDate } = req.query;
    
    const where = {};
    
    // Handle date range: either use explicit startDate/endDate or calculate from days
    if (startDate && endDate) {
      where.start_date = { [Op.gte]: new Date(startDate), [Op.lte]: new Date(endDate) };
    } else if (days) {
      const now = new Date();
      const pastDate = new Date(now.getTime() - parseInt(days) * 24 * 60 * 60 * 1000);
      where.start_date = { [Op.gte]: pastDate };
    }
    
    if (serviceType) {
      where.service_type = serviceType;
    }
    if (status) {
      if (status === 'paid' || status === 'unpaid') {
        where.payment_status = status;
      } else {
        where.booking_status = status;
      }
    }
    
    const bookings = await Booking.findAll({
      limit: parseInt(limit),
      where,
      order: [['created_at', 'DESC']],
      raw: false,
      subQuery: false,
      include: [
        {
          model: Pet,
          as: 'pet',
          required: false,
          attributes: ['pet_id', 'name', 'breed', 'photo', 'user_id'],
          include: [{
            model: User,
            as: 'owner',
            required: false,
            attributes: ['id', 'firstName', 'lastName', 'email']
          }]
        },
        {
          model: Service,
          as: 'service',
          required: false,
          attributes: ['service_id', 'name']
        }
      ]
    });

    return res.status(200).json({
      success: true,
      data: bookings.map(b => {
        const firstName = b.pet?.owner?.firstName || 'Unknown';
        const lastName = b.pet?.owner?.lastName || 'Unknown';
        
        return {
          id: b.booking_id,
          petName: b.pet?.name || 'Unknown',
          petBreed: b.pet?.breed || 'Unknown',
          ownerName: `${firstName} ${lastName}`.trim(),
          service: b.service_type || 'Unknown',
          startDate: b.start_date,
          status: b.booking_status,
          paymentStatus: b.payment_status,
          amount: b.price
        };
      })
    });
  } catch (error) {
    console.error('❌ Get recent bookings error:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch recent bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @desc    Get recent payments (for table)
 * @route   GET /api/analytics/recent-payments
 * @access  Admin only
 */
const getRecentPayments = async (req, res) => {
  try {
    const { limit = 10, days, serviceType, status, startDate, endDate } = req.query;
    
    const bookingWhere = {};
    
    // Handle date range: either use explicit startDate/endDate or calculate from days
    if (startDate && endDate) {
      bookingWhere.start_date = { [Op.gte]: new Date(startDate), [Op.lte]: new Date(endDate) };
    } else if (days) {
      const now = new Date();
      const pastDate = new Date(now.getTime() - parseInt(days) * 24 * 60 * 60 * 1000);
      bookingWhere.start_date = { [Op.gte]: pastDate };
    }
    
    if (serviceType) {
      bookingWhere.service_type = serviceType;
    }
    if (status) {
      if (status === 'paid' || status === 'unpaid') {
        bookingWhere.payment_status = status;
      } else {
        bookingWhere.booking_status = status;
      }
    }
    
    const payments = await Payment.findAll({
      limit: parseInt(limit),
      order: [['payment_date', 'DESC']],
      raw: false,
      subQuery: false,
      include: [
        {
          model: Booking,
          as: 'booking',
          required: Object.keys(bookingWhere).length > 0 ? true : false,
          where: Object.keys(bookingWhere).length > 0 ? bookingWhere : undefined,
          attributes: ['booking_id', 'user_id', 'pet_id'],
          include: [{
            model: Pet,
            as: 'pet',
            required: false,
            attributes: ['pet_id', 'name', 'user_id'],
            include: [{
              model: User,
              as: 'owner',
              required: false,
              attributes: ['id', 'firstName', 'lastName']
            }]
          }]
        }
      ]
    });

    return res.status(200).json({
      success: true,
      data: payments.map(p => {
        const firstName = p.booking?.pet?.owner?.firstName || 'Unknown';
        const lastName = p.booking?.pet?.owner?.lastName || 'Unknown';
        
        return {
          id: p.payment_id,
          bookingId: p.booking?.booking_id,
          petName: p.booking?.pet?.name || 'Unknown',
          ownerName: `${firstName} ${lastName}`.trim(),
          amount: p.amount,
          method: p.payment_method,
          date: p.payment_date
        };
      })
    });
  } catch (error) {
    console.error('❌ Get recent payments error:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch recent payments',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @desc    Get system alerts (low capacity, pending approvals, etc.)
 * @route   GET /api/analytics/alerts
 * @access  Admin only
 */
const getAlerts = async (req, res) => {
  try {
    const { serviceType, status, startDate, endDate } = req.query;
    const alerts = [];

    const baseWhere = {};
    if (serviceType) {
      baseWhere.service_type = serviceType;
    }
    if (status && status !== 'paid' && status !== 'unpaid') {
      baseWhere.booking_status = status;
    }
    if (status && (status === 'paid' || status === 'unpaid')) {
      baseWhere.payment_status = status;
    }
    if (startDate) {
      baseWhere.start_date = { [Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      if (baseWhere.start_date) {
        baseWhere.start_date[Op.lte] = new Date(endDate);
      } else {
        baseWhere.start_date = { [Op.lte]: new Date(endDate) };
      }
    }

    // Check for pending approvals
    const pendingCount = await Booking.count({
      where: { booking_status: 'pending', ...baseWhere }
    });
    if (pendingCount > 0) {
      alerts.push({
        id: 'pending-approvals',
        type: 'warning',
        title: 'Pending Approvals',
        message: `${pendingCount} booking(s) waiting for approval`,
        severity: 'high'
      });
    }

    // Check for unpaid bookings
    const unpaidCount = await Booking.count({
      where: { payment_status: 'unpaid', booking_status: { [Op.in]: ['confirmed'] }, ...baseWhere }
    });
    if (unpaidCount > 0) {
      alerts.push({
        id: 'unpaid-bookings',
        type: 'info',
        title: 'Unpaid Bookings',
        message: `${unpaidCount} confirmed booking(s) awaiting payment`,
        severity: 'medium'
      });
    }

    // Check for bookings starting soon (no caretaker)
    const soonBookings = await Booking.count({
      where: {
        booking_status: { [Op.in]: ['confirmed'] },
        start_date: {
          [Op.gte]: new Date(),
          [Op.lte]: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000)
        },
        ...baseWhere
      }
    });
    if (soonBookings > 0) {
      alerts.push({
        id: 'urgent-bookings',
        type: 'error',
        title: 'Urgent: Bookings Starting Soon',
        message: `${soonBookings} booking(s) starting within 3 days - assign caretakers!`,
        severity: 'critical'
      });
    }

    return res.status(200).json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('❌ Get alerts error:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @desc    Get all available service types
 * @route   GET /api/analytics/service-types
 * @access  Admin only
 */
const getAvailableServiceTypes = async (req, res) => {
  try {
    const serviceTypes = await sequelize.query(
      `SELECT DISTINCT b.service_type
       FROM bookings b
       WHERE b.service_type IS NOT NULL
       ORDER BY b.service_type ASC`,
      { type: QueryTypes.SELECT }
    );

    return res.status(200).json({
      success: true,
      data: serviceTypes.map(s => s.service_type).filter(Boolean)
    });
  } catch (error) {
    console.error('❌ Get available service types error:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch service types',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getDashboardAnalytics,
  getBookingTrends,
  getRevenueTrends,
  getTopServices,
  getBookingStatusDistribution,
  getPetTypesDistribution,
  getPeakHours,
  getRecentBookings,
  getRecentPayments,
  getAlerts,
  getAvailableServiceTypes
};
