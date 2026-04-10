-- Create email_verifications table
CREATE TABLE IF NOT EXISTS public.email_verifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    otp_hash VARCHAR(255) NOT NULL,
    otp_attempts INTEGER DEFAULT 0,
    max_otp_attempts INTEGER DEFAULT 5,
    is_verified BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_email_verifications_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON public.email_verifications(user_id);

-- Create index on is_verified for querying unverified records
CREATE INDEX IF NOT EXISTS idx_email_verifications_is_verified ON public.email_verifications(is_verified);

-- Add comment to table
COMMENT ON TABLE public.email_verifications IS 'Stores email verification OTP records for new user registrations';
