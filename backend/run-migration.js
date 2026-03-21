#!/usr/bin/env node
/**
 * Manual Database Migration Runner
 * This script applies the SQL migration without requiring psql
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'pawwell_user',
  password: process.env.DB_PASSWORD || 'pawwell_user',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'pawwell_db',
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting database migration...\n');

    // Step 1: Create ENUM types
    console.log('📝 Step 1: Creating ENUM types...');
    
    try {
      await client.query(`
        CREATE TYPE enum_bookings_booking_status AS ENUM(
          'pending', 'approved', 'confirmed', 'completed', 'rejected', 'cancelled'
        );
      `);
      console.log('✅ Created enum_bookings_booking_status\n');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('⏭️  enum_bookings_booking_status already exists\n');
      } else {
        throw err;
      }
    }

    try {
      await client.query(`
        CREATE TYPE enum_bookings_payment_status AS ENUM(
          'unpaid', 'pending_payment', 'paid', 'failed'
        );
      `);
      console.log('✅ Created enum_bookings_payment_status\n');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('⏭️  enum_bookings_payment_status already exists\n');
      } else {
        throw err;
      }
    }

    // Step 2: Add columns
    console.log('📝 Step 2: Adding columns to bookings table...');
    
    await client.query(`
      ALTER TABLE bookings
      ADD COLUMN IF NOT EXISTS booking_status enum_bookings_booking_status DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS payment_status enum_bookings_payment_status DEFAULT 'unpaid',
      ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS pidx VARCHAR(255);
    `);
    console.log('✅ Columns added to bookings table\n');

    // Step 3: Verify columns
    console.log('📝 Step 3: Verifying columns were created...');
    
    const result = await client.query(`
      SELECT 
        column_name, 
        data_type,
        column_default,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'bookings' 
        AND column_name IN ('booking_status', 'payment_status', 'transaction_id', 'pidx')
      ORDER BY column_name;
    `);

    if (result.rows.length === 4) {
      console.log('✅ All 4 columns verified!\n');
      console.log('Column Details:');
      result.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (DEFAULT: ${row.column_default || 'NULL'})`);
      });
    } else {
      throw new Error(`Expected 4 columns but found ${result.rows.length}`);
    }

    console.log('\n✅ MIGRATION SUCCESSFUL!\n');
    console.log('═════════════════════════════════════════════════════');
    console.log('Next steps:');
    console.log('1. Restart the backend server: npm run dev');
    console.log('2. Test payment flow through Khalti');
    console.log('3. Verify database shows payment_status="paid"');
    console.log('═════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

// Run migration
runMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
