# Quick Start Guide - Forgot Password Feature

## 🚀 Getting Started

### Prerequisites
Ensure your development environment is set up:
- PostgreSQL database running
- Node.js and npm installed
- Email service configured in `backend/config/config.js`

### Step 1: Install Dependencies (if needed)

```bash
# Backend
cd backend
npm install bcrypt  # Should already be installed

# Frontend (no new dependencies needed)
cd frontend
# All dependencies already installed
```

### Step 2: Database Setup

The `password_resets` table should already exist with the necessary OTP fields:
- `otp_hash`
- `otp_attempts`
- `max_otp_attempts`
- `is_verified`

If not, the migration should run automatically on server start.

### Step 3: Configure Email Service

Verify email configuration in `backend/config/config.js`:

```javascript
email: {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  from: process.env.EMAIL_FROM || 'noreply@pawwell.com'
}
```

**Environment Variables:**
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=PawWell Care <noreply@pawwell.com>
```

### Step 4: Start the Application

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm start
```

## 🧪 Testing the Feature

### Test Scenario 1: Successful Password Reset

1. **Open the application**: `http://localhost:3000/login`

2. **Click "Forgot Password?"** link

3. **Enter email**: Type a registered user's email
   - Example: `admin@pawwell.com`

4. **Check email inbox**: Find the OTP email
   - Subject: "Password Reset OTP - PawWell Care Center"
   - Look for the 6-digit code (e.g., `123456`)

5. **Enter OTP**: Input the 6 digits in the verification page
   - The form will auto-advance between inputs

6. **Set new password**:
   - Enter new password
   - Confirm new password
   - Click "Reset Password"

7. **Verify success**: 
   - Success message appears
   - Auto-redirect to login in 3 seconds
   - Receive "Password Changed" confirmation email

8. **Login**: Use new password to login

### Test Scenario 2: Invalid OTP

1. Request OTP as above
2. Enter wrong 6-digit code
3. **Expected**: Error message with remaining attempts
4. Try again (max 5 attempts total)

### Test Scenario 3: Expired OTP

1. Request OTP
2. Wait 11+ minutes
3. Try to verify OTP
4. **Expected**: "OTP has expired" error
5. Redirect to forgot password page

### Test Scenario 4: Resend OTP

1. Request OTP
2. On verify page, wait for 60-second cooldown
3. Click "Resend Code"
4. **Expected**: New OTP sent, counter resets

### Test Scenario 5: Max Attempts

1. Request OTP
2. Enter wrong OTP 5 times
3. **Expected**: "Maximum attempts exceeded" error
4. Must request new OTP

## 🔍 Monitoring & Debugging

### Backend Logs

Watch console for these messages:

```
✉️ OTP sent to user@example.com (Reset ID: 123)
✅ OTP verified for user user@example.com (Reset ID: 123)
🔒 Password reset successful for user user@example.com
```

### Database Verification

Check password reset records:

```sql
-- View active password resets
SELECT 
  id, 
  user_id, 
  otp_attempts, 
  is_verified, 
  is_used, 
  expires_at 
FROM password_resets 
WHERE is_used = false 
ORDER BY created_at DESC;

-- Check specific user's reset attempts
SELECT * FROM password_resets 
WHERE user_id = 1 
ORDER BY created_at DESC;
```

### Common Issues & Solutions

#### Issue: OTP Email Not Received

**Solutions:**
1. Check email configuration in config.js
2. Verify environment variables
3. Check spam folder
4. For Gmail: Use App Password, not regular password
5. Check backend logs for email errors

#### Issue: "Invalid Reset Token"

**Solutions:**
1. Token may have expired (10 minutes limit)
2. Token may have already been used
3. Request new OTP

#### Issue: Cannot Verify OTP

**Solutions:**
1. Check if OTP is exactly 6 digits
2. Ensure OTP hasn't expired
3. Verify database has correct OTP hash
4. Check attempt counter hasn't exceeded limit

#### Issue: CSS Not Loading

**Solutions:**
1. Clear browser cache
2. Restart frontend dev server
3. Check index.css imported in App.jsx

## 📧 Email Testing

### For Development (without real SMTP)

Use a service like:
- **Mailtrap.io**: Fake SMTP for testing
- **Ethereal Email**: Temporary test emails

Configuration for Ethereal:
```javascript
email: {
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: 'your-ethereal-user',
    pass: 'your-ethereal-password'
  }
}
```

## 🎯 API Endpoints Reference

### 1. Request OTP
```http
POST /api/accounts/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "message": "If an account exists with this email, you will receive an OTP shortly.",
  "instructions": "Please check your email inbox and spam folder for the 6-digit verification code."
}
```

### 2. Verify OTP
```http
POST /api/accounts/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}

Success Response:
{
  "success": true,
  "message": "OTP verified successfully! You can now reset your password.",
  "resetToken": "uuid-token-here"
}

Error Response (Invalid OTP):
{
  "success": false,
  "message": "Invalid OTP. You have 3 attempts remaining.",
  "remainingAttempts": 3,
  "code": "INVALID_OTP"
}
```

### 3. Reset Password
```http
POST /api/accounts/reset-password
Content-Type: application/json

{
  "token": "uuid-token-from-verify-otp",
  "newPassword": "NewSecurePass123",
  "confirmPassword": "NewSecurePass123"
}

Response:
{
  "success": true,
  "message": "Password reset successful! You can now login with your new password."
}
```

## 📱 Frontend Routes

- `/login` - Login page with "Forgot Password?" link
- `/forgot-password` - Enter email to request OTP
- `/verify-otp` - Enter 6-digit OTP (state: email)
- `/reset-password/:token` - Set new password (state: email, fromOTP)

## ✅ Verification Checklist

Before considering the feature complete, verify:

- [ ] Backend server starts without errors
- [ ] Frontend compiles without errors
- [ ] Email service is configured and working
- [ ] Can request OTP successfully
- [ ] OTP email is received
- [ ] Can verify OTP successfully
- [ ] Can reset password successfully
- [ ] Password changed email is received
- [ ] Can login with new password
- [ ] All error scenarios work correctly
- [ ] Rate limiting is working
- [ ] UI is responsive on mobile
- [ ] Navigation between pages works smoothly
- [ ] Toast notifications appear correctly

## 🎉 Success Indicators

When everything is working:

1. ✅ No console errors in browser or backend
2. ✅ Emails are sent successfully
3. ✅ OTP verification completes
4. ✅ Password is updated in database (hashed)
5. ✅ Reset records are marked as used
6. ✅ User can login with new password
7. ✅ UI is clean and responsive

## 📞 Support

If you encounter issues:

1. Check backend console logs
2. Check browser console (F12)
3. Verify database records
4. Review email service logs
5. Check network tab for API responses
6. Refer to FORGOT_PASSWORD_IMPLEMENTATION.md for detailed documentation

Happy testing! 🐾
