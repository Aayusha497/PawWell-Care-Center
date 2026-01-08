# 🔍 Forgot Password OTP Flow - Complete Debug & Fix Report

## Issues Found and Fixed

### ✅ 1. **CRITICAL: Frontend ResetPassword.jsx had syntax errors**
**Issue:** Duplicate catch blocks and malformed code prevented compilation
**Fix:** Corrected the handleSubmit function with proper try-catch-finally

### ✅ 2. **Backend/Frontend Key Mismatch**
**Issue:** Backend expects `newPassword` and `confirmPassword`, frontend was sending inconsistent keys
**Fix:** Updated frontend to send correct keys matching backend validator

### ✅ 3. **Email Configuration**
**Status:** Configured correctly in .env with Gmail SMTP
- Host: smtp.gmail.com
- Port: 587
- Secure: false
- App Password configured

### ✅ 4. **Model Associations**
**Status:** PasswordReset ↔ User associations properly set up in models/index.js

### ✅ 5. **API Endpoint Paths**
**Status:** All endpoints correctly configured
- POST `/api/accounts/forgot-password` ✓
- POST `/api/accounts/verify-otp` ✓  
- POST `/api/accounts/reset-password` ✓

## Complete Working Flow

### Backend Endpoints

#### 1. POST /api/accounts/forgot-password
```javascript
Request Body:
{
  "email": "user@example.com"
}

Response (200):
{
  "success": true,
  "message": "If an account exists with this email, you will receive an OTP shortly.",
  "instructions": "Please check your email inbox and spam folder for the 6-digit verification code."
}
```

**What happens:**
- Validates email format
- Finds user (doesn't reveal if exists - security)
- Generates 6-digit OTP (100000-999999)
- Hashes OTP with bcrypt (salt rounds: 10)
- Deletes any existing reset requests for user
- Creates PasswordReset record:
  - userId
  - otpHash (hashed OTP)
  - otpAttempts: 0
  - maxOtpAttempts: 5
  - isVerified: false
  - isUsed: false
  - expiresAt: now + 10 minutes
- Sends OTP email via SMTP
- Returns success (regardless of user existence)

#### 2. POST /api/accounts/verify-otp
```javascript
Request Body:
{
  "email": "user@example.com",
  "otp": "123456"
}

Success Response (200):
{
  "success": true,
  "message": "OTP verified successfully! You can now reset your password.",
  "resetToken": "uuid-v4-token-here"
}

Error Response - Invalid OTP (400):
{
  "success": false,
  "message": "Invalid OTP. You have 3 attempts remaining.",
  "remainingAttempts": 3,
  "code": "INVALID_OTP"
}

Error Response - Expired (400):
{
  "success": false,
  "message": "OTP has expired. Please request a new one.",
  "code": "OTP_EXPIRED"
}

Error Response - Max Attempts (400):
{
  "success": false,
  "message": "Maximum OTP verification attempts exceeded. Please request a new OTP.",
  "code": "MAX_ATTEMPTS_EXCEEDED"
}
```

**What happens:**
- Validates email and OTP format (6 digits, numeric)
- Finds user by email
- Finds latest unused reset record for user
- Checks expiration (10 minutes from creation)
- Checks if already verified
- Checks attempt limit (max 5)
- Compares OTP with hashed value using bcrypt
- If invalid: increments attempts, returns remaining
- If valid: marks isVerified=true, returns token (UUID)

#### 3. POST /api/accounts/reset-password
```javascript
Request Body:
{
  "token": "uuid-token-from-verify-otp",
  "newPassword": "NewSecurePass123",
  "confirmPassword": "NewSecurePass123"
}

Response (200):
{
  "success": true,
  "message": "Password reset successful! You can now login with your new password."
}

Error Response - Not Verified (400):
{
  "success": false,
  "message": "Please verify your OTP before resetting password.",
  "code": "OTP_NOT_VERIFIED"
}
```

**What happens:**
- Validates token (UUID format)
- Validates password (min 8 chars, 1 letter, 1 number)
- Validates passwords match
- Finds reset record by token (includes user)
- Checks isUsed flag
- Checks expiration
- Checks isVerified (for OTP flow)
- Hashes new password with bcrypt
- Updates user.password
- Marks reset.isUsed = true
- Sends password changed confirmation email
- Returns success

### Frontend Pages

#### 1. ForgotPassword.jsx (/forgot-password)
```javascript
// User enters email
const response = await requestPasswordResetOTP(email);

// Navigates to /verify-otp with email in state
navigate('/verify-otp', { state: { email } });
```

#### 2. VerifyOTP.jsx (/verify-otp)
```javascript
// Gets email from location.state
const email = location.state?.email;

// User enters 6-digit OTP
const response = await verifyOTP(email, otp);

// On success, navigates to reset password with token
navigate(`/reset-password/${response.resetToken}`, { 
  state: { email, fromOTP: true } 
});
```

**Features:**
- 6 separate input boxes (auto-focus next/previous)
- Paste support for OTP codes
- Remaining attempts counter
- 60-second resend cooldown
- Error handling for expired/invalid OTP

#### 3. ResetPassword.jsx (/reset-password/:token)
```javascript
// Gets token from URL params
const { token } = useParams();

// User enters new password + confirm
const response = await resetPassword({
  token,
  newPassword: values.new_password,
  confirmPassword: values.confirm_password
});

// On success, redirects to login after 3 seconds
navigate('/login');
```

**Features:**
- Password strength indicator
- Show/hide password toggles
- Validation (min 8 chars, 1 letter, 1 number)
- Success state with countdown
- Auto-redirect to login

### Frontend API Calls (services/api.js)

```javascript
// 1. Request OTP
export const requestPasswordResetOTP = async (email) => {
  const response = await api.post('/accounts/forgot-password', { email });
  return response.data;
};

// 2. Verify OTP  
export const verifyOTP = async (email, otp) => {
  const response = await api.post('/accounts/verify-otp', { email, otp });
  return response.data;
};

// 3. Reset Password
export const resetPassword = async (data) => {
  const response = await api.post('/accounts/reset-password', data);
  return response.data;
};
```

## Security Features Implemented

### 1. OTP Security
- ✅ Stored as bcrypt hash (not plain text)
- ✅ 10-minute expiration window
- ✅ Maximum 5 verification attempts
- ✅ Auto-invalidated after use
- ✅ One-time use per request

### 2. Rate Limiting
- ✅ Applied to all password reset endpoints via `passwordResetLimiter`
- ✅ Prevents brute force attacks
- ✅ 60-second resend cooldown on frontend

### 3. User Enumeration Prevention
- ✅ Same response for existing/non-existing emails
- ✅ Prevents account discovery attacks

### 4. Token Security
- ✅ UUID v4 tokens (unpredictable)
- ✅ Single-use tokens
- ✅ Tied to specific user account
- ✅ Verified before password reset

### 5. Password Security
- ✅ Hashed with bcrypt before storage
- ✅ Password strength validation
- ✅ Confirmation required
- ✅ Min 8 chars, must include letter and number

## Database Schema

```sql
CREATE TABLE password_resets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token UUID UNIQUE,
  otp_hash VARCHAR(255),
  otp_attempts INTEGER DEFAULT 0,
  max_otp_attempts INTEGER DEFAULT 5,
  is_verified BOOLEAN DEFAULT false,
  is_used BOOLEAN DEFAULT false,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Testing Checklist

### Backend Tests
- [ ] POST /api/accounts/forgot-password with valid email
- [ ] POST /api/accounts/forgot-password with invalid email (should still return success)
- [ ] Check email inbox for OTP
- [ ] POST /api/accounts/verify-otp with correct OTP
- [ ] POST /api/accounts/verify-otp with wrong OTP (5 times)
- [ ] POST /api/accounts/verify-otp after 10 minutes (expired)
- [ ] POST /api/accounts/reset-password with valid token
- [ ] POST /api/accounts/reset-password without OTP verification
- [ ] POST /api/accounts/reset-password with expired token
- [ ] POST /api/accounts/reset-password with already used token
- [ ] Login with new password

### Frontend Tests
- [ ] Navigate to /forgot-password
- [ ] Submit email form
- [ ] Navigate to /verify-otp (auto)
- [ ] Enter OTP with auto-focus
- [ ] Test paste OTP functionality
- [ ] Test resend OTP (wait 60s)
- [ ] Navigate to /reset-password/:token (auto)
- [ ] Enter new password with strength indicator
- [ ] Submit and see success message
- [ ] Auto-redirect to login (3s)
- [ ] Login with new credentials

### Edge Cases
- [ ] Browser refresh during OTP verification
- [ ] Back button navigation
- [ ] Multiple OTP requests
- [ ] Concurrent sessions
- [ ] Invalid token format
- [ ] Direct URL access without state

## Environment Variables Required

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-here
EMAIL_FROM=PawWell Care Center <your-email@gmail.com>

# Frontend URL
FRONTEND_URL=http://localhost:3000

# JWT (already configured)
JWT_SECRET=your-secret-key
```

## Common Issues & Solutions

### Issue: "Cannot send email"
**Solution:** 
1. Use Gmail App Password (not regular password)
2. Enable 2-Step Verification in Google Account
3. Generate App Password at: https://myaccount.google.com/apppasswords
4. Use that password in EMAIL_PASSWORD

### Issue: "OTP not received"
**Solution:**
1. Check spam folder
2. Verify EMAIL_USER in .env is correct
3. Run `node scripts/testEmail.js` to test SMTP
4. Check backend console for email sending errors

### Issue: "Invalid token" on reset password
**Solution:**
1. Ensure OTP was verified first
2. Check token hasn't expired (10 min limit)
3. Token is only valid once
4. Request new OTP if expired

### Issue: "Maximum attempts exceeded"
**Solution:**
1. User entered wrong OTP 5 times
2. Must request new OTP
3. Previous reset request is invalidated

## Files Modified

### Backend
- ✅ controllers/authController.js (forgot, verify, reset functions)
- ✅ routes/auth.js (added verify-otp route)
- ✅ validators/authValidators.js (added verifyOTPValidation)
- ✅ utils/emailService.js (added sendOTPEmail)
- ✅ models/PasswordReset.js (OTP fields)
- ✅ models/index.js (associations)

### Frontend
- ✅ pages/ForgotPassword.jsx (created)
- ✅ pages/VerifyOTP.jsx (created)
- ✅ pages/ResetPassword.jsx (fixed syntax error)
- ✅ App.jsx (added routes)
- ✅ services/api.js (added API calls)
- ✅ index.css (added OTP input styles)

## Next Steps

1. **Test email sending:**
   ```bash
   cd backend
   node scripts/testEmail.js
   ```

2. **Start backend:**
   ```bash
   cd backend
   npm run dev
   ```

3. **Start frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

4. **Test complete flow:**
   - Go to http://localhost:5173/login
   - Click "Forgot Password?"
   - Enter email and request OTP
   - Check email for 6-digit code
   - Enter OTP on verification page
   - Enter new password
   - Login with new password

## Success Indicators

✅ No console errors in backend
✅ No console errors in frontend  
✅ OTP email received within 30 seconds
✅ OTP verification successful
✅ Password reset successful
✅ Can login with new password
✅ Confirmation email received
✅ Reset record marked as used in database

