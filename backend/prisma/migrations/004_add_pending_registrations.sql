-- Create pending_registrations table
CREATE TABLE IF NOT EXISTS public.pending_registrations (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    user_type VARCHAR(50) DEFAULT 'pet_owner',
    otp_hash VARCHAR(255) NOT NULL,
    otp_attempts INTEGER DEFAULT 0,
    max_otp_attempts INTEGER DEFAULT 5,
    is_verified BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_pending_registrations_email ON public.pending_registrations(email);
CREATE INDEX IF NOT EXISTS idx_pending_registrations_expires_at ON public.pending_registrations(expires_at);

-- Add comment to table
COMMENT ON TABLE public.pending_registrations IS 'Stores temporary registration data while waiting for email OTP verification. Records are deleted after verification or expiration.';
