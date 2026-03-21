#!/usr/bin/env node
/**
 * Test Payment Verification Endpoint
 * This script will:
 * 1. Get a valid JWT token
 * 2. Call the verify endpoint with pidx from database
 * 3. Show what happens
 */

const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

const API_URL = 'http://localhost:8000/api';

async function getTestBookingPidx() {
  const pool = new Pool({
    user: process.env.DB_USER || 'pawwell_user',
    password: process.env.DB_PASSWORD || 'pawwell_user',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'pawwell_db',
  });

  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT booking_id, pidx, user_id, payment_status 
      FROM bookings 
      WHERE pidx IS NOT NULL AND payment_status = 'pending_payment'
      LIMIT 1
    `);
    
    await pool.end();
    return result.rows[0];
  } finally {
    await client.release();
  }
}

async function testPaymentVerification() {
  try {
    console.log('🧪 Testing Payment Verification Flow\n');
    console.log('═════════════════════════════════════════════════════\n');

    // Get test booking
    console.log('1️⃣  Getting test booking from database...');
    const booking = await getTestBookingPidx();
    
    if (!booking) {
      console.log('❌ No pending payment bookings found');
      console.log('   Create a booking with payment initiated first');
      process.exit(1);
    }

    console.log(`✅ Found booking:
      - booking_id: ${booking.booking_id}
      - user_id: ${booking.user_id}  
      - pidx: ${booking.pidx}
      - current_payment_status: ${booking.payment_status}\n`);

    // For testing, we'll use a simple JWT that contains the user_id
    // In real scenario, you'd login to get a real token
    const jwt = require('jsonwebtoken');
    const config = require('./config/config');
    
    const testToken = jwt.sign(
      { userId: booking.user_id, userType: 'customer' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    console.log('2️⃣  Generated test JWT token for user:', booking.user_id);
    console.log('   Token:', testToken.substring(0, 50) + '...\n');

    // Call verify endpoint
    console.log('3️⃣  Calling payment verification endpoint...');
    console.log(`   POST ${API_URL}/bookings/payment/verify`);
    console.log(`   With pidx: ${booking.pidx}\n`);

    const response = await axios.post(
      `${API_URL}/bookings/payment/verify`,
      {
        pidx: booking.pidx,
        booking_id: booking.booking_id
      },
      {
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Response received:\n');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('Message:', response.data.message);
    
    if (response.data.data?.booking) {
      const booking = response.data.data.booking;
      console.log('\n📊 Updated Booking:');
      console.log('  - payment_status:', booking.payment_status);
      console.log('  - booking_status:', booking.booking_status);
      console.log('  - transaction_id:', booking.transaction_id);
      console.log('  - pidx:', booking.pidx);
    }

    console.log('\n═════════════════════════════════════════════════════');
    console.log('\n✅ TEST COMPLETED SUCCESSFULLY!');

  } catch (error) {
    console.error('\n❌ Error occurred:\n');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Message:', error.response.data.message);
      console.error('Full response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Backend not running on port 8000');
      console.error('   Start backend with: npm run dev');
    } else {
      console.error(error.message);
    }
    
    process.exit(1);
  }
}

testPaymentVerification();
