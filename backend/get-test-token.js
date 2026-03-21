#!/usr/bin/env node
/**
 * Simple test - Get booking data and output curl command
 */
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const config = require('./config/config');

async function test() {
  const pool = new Pool({
    user: process.env.DB_USER || 'pawwell_user',
    password: process.env.DB_PASSWORD || 'pawwell_user',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'pawwell_db',
  });

  const client = await pool.connect();
  try {
    console.log('📋 Fetching test booking...\n');
    
    const result = await client.query(`
      SELECT booking_id, pidx, user_id, payment_status, booking_status
      FROM bookings 
      WHERE pidx IS NOT NULL 
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No bookings with pidx found');
      process.exit(1);
    }

    const booking = result.rows[0];
    console.log('✅ Found booking from database:');
    console.log('   - booking_id:', booking.booking_id);
    console.log('   - user_id:', booking.user_id);
    console.log('   - pidx:', booking.pidx);
    console.log('   - payment_status:', booking.payment_status);
    console.log('   - booking_status:', booking.booking_status);
    console.log('');

    // Generate test JWT
    const testToken = jwt.sign(
      { userId: booking.user_id, userType: 'customer' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    console.log('📝 Generated JWT token (valid for 1 hour)');
    console.log('');
    
    console.log('🧪 Run this curl command to test verification:\n');
    console.log(`curl -X POST http://localhost:8000/api/bookings/payment/verify \\`);
    console.log(`  -H "Authorization: Bearer ${testToken.substring(0, 50)}..." \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"pidx":"${booking.pidx}","booking_id":${booking.booking_id}}'`);
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('Full token for testing:');
    console.log(testToken);
    console.log('═══════════════════════════════════════════════════════════════════');

    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

test();
