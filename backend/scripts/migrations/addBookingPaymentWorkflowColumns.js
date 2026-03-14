/**
 * Add Booking and Payment Workflow Columns
 *
 * Adds booking_status/payment_status and Khalti transaction tracking fields.
 */

const { sequelize } = require('../../config/database');
const { DataTypes } = require('sequelize');

async function addEnumValueIfMissing(queryInterface, enumName, value) {
  await queryInterface.sequelize.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = '${enumName}' AND e.enumlabel = '${value}'
      ) THEN
        ALTER TYPE "${enumName}" ADD VALUE '${value}';
      END IF;
    END
    $$;
  `);
}

async function up() {
  const queryInterface = sequelize.getQueryInterface();

  console.log('Adding booking/payment workflow columns to bookings table...');

  await addEnumValueIfMissing(queryInterface, 'enum_bookings_status', 'cancelled');

  await queryInterface.addColumn('bookings', 'booking_status', {
    type: DataTypes.ENUM('pending', 'approved', 'confirmed', 'completed', 'rejected', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending'
  });

  await queryInterface.addColumn('bookings', 'payment_status', {
    type: DataTypes.ENUM('unpaid', 'pending_payment', 'paid', 'failed'),
    allowNull: false,
    defaultValue: 'unpaid'
  });

  await queryInterface.addColumn('bookings', 'transaction_id', {
    type: DataTypes.STRING(255),
    allowNull: true
  });

  await queryInterface.addColumn('bookings', 'pidx', {
    type: DataTypes.STRING(255),
    allowNull: true
  });

  await queryInterface.addIndex('bookings', ['pidx'], {
    name: 'idx_bookings_pidx'
  });

  await queryInterface.sequelize.query(`
    UPDATE bookings
    SET
      booking_status = CASE status
        WHEN 'pending' THEN 'pending'::"enum_bookings_booking_status"
        WHEN 'confirmed' THEN 'confirmed'::"enum_bookings_booking_status"
        WHEN 'completed' THEN 'completed'::"enum_bookings_booking_status"
        WHEN 'cancelled' THEN 'cancelled'::"enum_bookings_booking_status"
        ELSE 'pending'::"enum_bookings_booking_status"
      END,
      payment_status = CASE
        WHEN status IN ('confirmed', 'completed') THEN 'paid'::"enum_bookings_payment_status"
        ELSE 'unpaid'::"enum_bookings_payment_status"
      END
    WHERE booking_status IS NOT NULL AND payment_status IS NOT NULL;
  `);

  console.log('Booking/payment workflow columns added successfully.');
}

async function down() {
  const queryInterface = sequelize.getQueryInterface();

  console.log('Removing booking/payment workflow columns from bookings table...');

  await queryInterface.removeIndex('bookings', 'idx_bookings_pidx');
  await queryInterface.removeColumn('bookings', 'pidx');
  await queryInterface.removeColumn('bookings', 'transaction_id');
  await queryInterface.removeColumn('bookings', 'payment_status');
  await queryInterface.removeColumn('bookings', 'booking_status');

  console.log('Booking/payment workflow columns removed successfully.');
}

module.exports = { up, down };

if (require.main === module) {
  up()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}
