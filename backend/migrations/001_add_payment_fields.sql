-- Manual SQL Migration for Payment Fields
-- Run this directly in your PostgreSQL database

-- Step 1: Create ENUMs if they don't exist
DO $$ BEGIN
    CREATE TYPE enum_bookings_booking_status AS ENUM('pending', 'approved', 'confirmed', 'completed', 'rejected', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE enum_bookings_payment_status AS ENUM('unpaid', 'pending_payment', 'paid', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Step 2: Add missing columns to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS booking_status enum_bookings_booking_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_status enum_bookings_payment_status DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS pidx VARCHAR(255);

-- Step 3: Verify columns were added
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings' 
  AND column_name IN ('booking_status', 'payment_status', 'transaction_id', 'pidx')
ORDER BY ordinal_position;

-- You should see 4 rows with the new columns

-- Step 4 (Optional): Check existing data
SELECT 
    booking_id, 
    booking_status, 
    payment_status, 
    transaction_id, 
    pidx,
    created_at
FROM bookings 
LIMIT 5;
