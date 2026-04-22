const { Booking, Pet, User, Payment } = require('./models');
const { Op } = require('sequelize');

(async () => {
  try {
    // Get last 90 days date
    const now = new Date();
    const pastDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    console.log('Date range: ' + pastDate.toISOString() + ' to ' + now.toISOString());
    console.log('Now:', now.toISOString());
    
    // Query all unpaid bookings in last 90 days
    const unpaidBookings = await Booking.findAll({
      where: {
        payment_status: 'unpaid',
        start_date: { [Op.gte]: pastDate }
      },
      include: [
        {
          model: Pet,
          as: 'pet',
          attributes: ['pet_id', 'name']
        }
      ]
    });
    
    console.log('\nUNPAID BOOKINGS (Last 90 Days):');
    console.log('Total unpaid bookings:', unpaidBookings.length);
    
    unpaidBookings.forEach((b, i) => {
      console.log('\n  ' + (i+1) + '. Booking ID: ' + b.booking_id);
      console.log('     Pet: ' + (b.pet?.name || 'Unknown'));
      console.log('     Status: ' + b.booking_status);
      console.log('     Payment Status: ' + b.payment_status);
      console.log('     Amount: Rs. ' + b.price);
      console.log('     Start Date: ' + b.start_date);
    });
    
    // Count active (approved/confirmed) unpaid bookings
    const activeUnpaid = unpaidBookings.filter(b => ['approved', 'confirmed'].includes(b.booking_status));
    console.log('\nActive (approved/confirmed) unpaid bookings:', activeUnpaid.length);
    
    // Count unique pets
    const uniquePets = new Set(unpaidBookings.map(b => b.pet_id));
    console.log('🐾 Unique pets with unpaid bookings:', uniquePets.size);
    
    // Total revenue from PAID bookings (not unpaid)
    const { sequelize } = require('./config/database');
    const totalRevenueResult = await sequelize.query(
      'SELECT COALESCE(SUM(price), 0) as total FROM bookings WHERE payment_status = $1 AND start_date >= $2',
      {
        bind: ['paid', pastDate],
        type: require('sequelize').QueryTypes.SELECT
      }
    );
    
    console.log('Total Paid Revenue (last 90 days):', totalRevenueResult[0]?.total || 0);
    
    // This month revenue
    const thisMonthResult = await sequelize.query(
      'SELECT COALESCE(SUM(price), 0) as total FROM bookings WHERE payment_status = $1 AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW()) AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())',
      {
        bind: ['paid'],
        type: require('sequelize').QueryTypes.SELECT
      }
    );
    
    console.log('This Month Revenue (PAID):', thisMonthResult[0]?.total || 0);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message, error.stack);
    process.exit(1);
  }
})();
