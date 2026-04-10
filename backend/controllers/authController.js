const { User, PasswordReset, EmailVerification, PendingRegistration, Pet, Booking, EmergencyRequest, ActivityLog, WellnessTimeline, Notification } = require('../models');
const {
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendOTPEmail,
  sendEmailVerificationOTP
} = require('../utils/emailService');
const { generateTokens, verifyToken, getTokenExpiry } = require('../utils/jwtHelper');
const { generateOTP, hashOTP } = require('../utils/otpHelper');
const config = require('../config/config');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

/**
 * @route   POST /api/accounts/register
 * @desc    Register a new user Send OTP to email
 * @access  Public
 */
const register = async (req, res) => {
  try {
    console.log('📥 Registration request received:', {
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      userType: req.body.userType
    });

    const { email, password, firstName, lastName, phoneNumber, userType } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // ============================================
    // STRICT BACKEND VALIDATION FOR FIRSTNAME
    // ============================================
    console.log('🔒 BACKEND VALIDATION: Checking firstName...');
    
    if (!firstName || !firstName.trim()) {
      console.error('❌ BACKEND REJECTED: firstName is empty');
      return res.status(400).json({
        success: false,
        message: 'Full name is required',
        errors: { firstName: ['Full name is required'] }
      });
    }

    const trimmedFirstName = firstName.trim();
    
    if (trimmedFirstName.length < 2) {
      console.error('❌ BACKEND REJECTED: firstName too short:', trimmedFirstName);
      return res.status(400).json({
        success: false,
        message: 'Full name must be at least 2 characters long',
        errors: { firstName: ['Full name must be at least 2 characters long'] }
      });
    }

    // CHECK FOR NUMBERS - REJECT IMMEDIATELY
    if (/\d/.test(trimmedFirstName)) {
      console.error('❌ BACKEND REJECTED: Numbers found in firstName:', trimmedFirstName);
      return res.status(400).json({
        success: false,
        message: 'Full name cannot contain numbers',
        errors: { firstName: ['Full name should contain only letters (A–Z). Numbers are not allowed.'] }
      });
    }

    // CHECK FOR SPECIAL CHARACTERS - REJECT IMMEDIATELY
    if (!/^[A-Za-z\s]+$/.test(trimmedFirstName)) {
      console.error('❌ BACKEND REJECTED: Invalid characters in firstName:', trimmedFirstName);
      return res.status(400).json({
        success: false,
        message: 'Full name contains invalid characters',
        errors: { firstName: ['Full name should contain only letters (A–Z). Special characters are not allowed.'] }
      });
    }

    console.log('✅ BACKEND VALIDATION PASSED: firstName is valid');

    // ============================================
    // STRICT BACKEND VALIDATION FOR LASTNAME
    // ============================================
    console.log('🔒 BACKEND VALIDATION: Checking lastName...');
    
    if (!lastName || !lastName.trim()) {
      console.error('❌ BACKEND REJECTED: lastName is empty');
      return res.status(400).json({
        success: false,
        message: 'Last name is required',
        errors: { lastName: ['Last name is required'] }
      });
    }

    const trimmedLastName = lastName.trim();
    
    if (trimmedLastName.length < 2) {
      console.error('❌ BACKEND REJECTED: lastName too short:', trimmedLastName);
      return res.status(400).json({
        success: false,
        message: 'Last name must be at least 2 characters long',
        errors: { lastName: ['Last name must be at least 2 characters long'] }
      });
    }

    // CHECK FOR NUMBERS - REJECT IMMEDIATELY
    if (/\d/.test(trimmedLastName)) {
      console.error('❌ BACKEND REJECTED: Numbers found in lastName:', trimmedLastName);
      return res.status(400).json({
        success: false,
        message: 'Last name cannot contain numbers',
        errors: { lastName: ['Last name should contain only letters (A–Z). Numbers are not allowed.'] }
      });
    }

    // CHECK FOR SPECIAL CHARACTERS - REJECT IMMEDIATELY (allow spaces for multi-part names)
    if (!/^[A-Za-z\s]+$/.test(trimmedLastName)) {
      console.error('❌ BACKEND REJECTED: Invalid characters in lastName:', trimmedLastName);
      return res.status(400).json({
        success: false,
        message: 'Last name contains invalid characters',
        errors: { lastName: ['Last name should contain only letters (A–Z). Special characters are not allowed.'] }
      });
    }

    console.log('✅ BACKEND VALIDATION PASSED: lastName is valid');

    // ============================================
    // STRICT BACKEND VALIDATION FOR PHONENUMBER
    // ============================================
    if (phoneNumber) {
      console.log('🔒 BACKEND VALIDATION: Checking phoneNumber...');
      
      const cleanedPhoneNumber = phoneNumber.replace(/\s/g, '');
      
      if (!/^\d+$/.test(cleanedPhoneNumber)) {
        console.error('❌ BACKEND REJECTED: Non-digits found in phoneNumber:', phoneNumber);
        return res.status(400).json({
          success: false,
          message: 'Phone number must contain only digits',
          errors: { phoneNumber: ['Phone number must contain only digits.'] }
        });
      }
      
      if (cleanedPhoneNumber.length !== 10) {
        console.error('❌ BACKEND REJECTED: Phone number not 10 digits:', phoneNumber);
        return res.status(400).json({
          success: false,
          message: 'Phone number must be exactly 10 digits',
          errors: { phoneNumber: ['Phone number must be exactly 10 digits.'] }
        });
      }
      
      console.log('✅ BACKEND VALIDATION PASSED: phoneNumber is valid');
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email: normalizedEmail },
      paranoid: false
    });

    if (existingUser) {
      // If user exists but account is soft-deleted, still require OTP verification for reactivation
      if (existingUser.deletedAt) {
        console.log('🔄 Deleted account found - will require OTP verification for reactivation:', existingUser.email);
        
        // Check if there's already a pending reactivation
        const existingPending = await PendingRegistration.findOne({
          where: { email: normalizedEmail }
        });

        if (existingPending) {
          console.log('⏳ Pending reactivation already exists - resending OTP:', normalizedEmail);
          // Delete old pending reactivation
          await existingPending.destroy();
          console.log('🗑️ Old pending reactivation deleted');
          // Continue to generate new OTP
        }

        // Send OTP for reactivation (same flow as new registration)
        console.log('🔄 Generating OTP for account reactivation...');
        
        try {
          const otp = generateOTP();
          console.log(`✅ OTP generated: ${otp}`);
          
          const otpHash = await hashOTP(otp);
          console.log('✅ OTP hashed successfully');
          
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
          console.log(`✅ OTP expires at: ${expiresAt}`);

          // Create a temporary user object for email sending
          const tempUser = { email: normalizedEmail, firstName: trimmedFirstName };

          // Send OTP email
          console.log(`📧 Sending OTP email to: ${normalizedEmail}`);
          const emailSent = await sendEmailVerificationOTP(tempUser, otp);
          
          if (!emailSent) {
            console.error('❌ Failed to send OTP email');
            return res.status(500).json({
              success: false,
              message: 'Failed to send verification email. Please try again.',
              error: 'Email service unavailable'
            });
          }

          console.log(`✅ OTP email sent successfully to: ${normalizedEmail}`);

          // Create pending reactivation record
          const pendingRegistration = await PendingRegistration.create({
            email: normalizedEmail,
            password: password,
            firstName: trimmedFirstName,
            lastName: trimmedLastName,
            phoneNumber: phoneNumber || null,
            userType: userType || 'pet_owner',
            otpHash: otpHash,
            expiresAt: expiresAt,
            otpAttempts: 0,
            maxOtpAttempts: 5,
            isVerified: false
          });

          console.log(`✅ Pending reactivation created:`, {
            id: pendingRegistration.id,
            email: pendingRegistration.email,
            expiresAt: pendingRegistration.expiresAt
          });

          return res.status(200).json({
            success: true,
            message: 'OTP has been sent to your email. Please verify within 10 minutes to reactivate your account.',
            email: normalizedEmail,
            nextStep: 'verify-email-otp'
          });

        } catch (otpError) {
          console.error('❌ Error in OTP generation/sending:', otpError.message);
          return res.status(500).json({
            success: false,
            message: 'Error sending verification email. Please try again.',
            error: otpError.message
          });
        }
      } else {
        // User exists and is active - cannot register again
        console.log('❌ Active user already exists:', normalizedEmail);
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists',
          errors: {
            email: ['This email is already registered']
          }
        });
      }
    }

    // Check if there's already a pending registration
    const existingPending = await PendingRegistration.findOne({
      where: { email: normalizedEmail }
    });

    if (existingPending) {
      console.log('⏳ Pending registration already exists - resending OTP:', normalizedEmail);
      // Delete old pending registration
      await existingPending.destroy();
      console.log('🗑️ Old pending registration deleted');
      // Continue to generate new OTP
    }

    
    // GENERATE AND SEND OTP (NO USER CREATED YET)
    
    try {
      console.log('🔄 Generating OTP for email verification...');
      
      const otp = generateOTP();
      console.log(`✅ OTP generated: ${otp}`);
      
      const otpHash = await hashOTP(otp);
      console.log('✅ OTP hashed successfully');
      
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      console.log(`✅ OTP expires at: ${expiresAt}`);

      // Create a temporary user object for email sending
      const tempUser = { email: normalizedEmail, firstName: trimmedFirstName };

      // Send OTP email
      console.log(`📧 Sending OTP email to: ${normalizedEmail}`);
      const emailSent = await sendEmailVerificationOTP(tempUser, otp);
      
      if (!emailSent) {
        console.error('❌ Failed to send OTP email');
        return res.status(500).json({
          success: false,
          message: 'Failed to send verification email. Please try again.',
          error: 'Email service unavailable'
        });
      }

      console.log(`✅ OTP email sent successfully to: ${normalizedEmail}`);

      // Create pending registration record (NOT a user yet!)
      const pendingRegistration = await PendingRegistration.create({
        email: normalizedEmail,
        password: password,
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        phoneNumber: phoneNumber || null,
        userType: userType || 'pet_owner',
        otpHash: otpHash,
        expiresAt: expiresAt,
        otpAttempts: 0,
        maxOtpAttempts: 5,
        isVerified: false
      });

      console.log(`✅ Pending registration created:`, {
        id: pendingRegistration.id,
        email: pendingRegistration.email,
        expiresAt: pendingRegistration.expiresAt
      });

      return res.status(200).json({
        success: true,
        message: 'OTP has been sent to your email. Please verify within 10 minutes.',
        email: normalizedEmail,
        nextStep: 'verify-email-otp'
      });

    } catch (otpError) {
      console.error('❌ Error in OTP generation/sending:', otpError.message);
      console.error('Error stack:', otpError.stack);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.',
        error: otpError.message
      });
    }

  } catch (error) {
    console.error('❌ Registration error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      const errors = {};
      error.errors.forEach(err => {
        errors[err.path] = [err.message];
      });
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      const errors = {};
      error.errors.forEach(err => {
        errors[err.path] = ['This value already exists'];
      });
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
        errors
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred during registration.',
      error: error.message
    });
  }
};



/**
 * @route   POST /api/accounts/login
 * @desc    Login user
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email (including soft-deleted accounts)
    const user = await User.findOne({
      where: { email: email.toLowerCase().trim() },
      paranoid: false  // Include soft-deleted records to check if account was deleted
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Check if account is soft-deleted
    if (user.deletedAt) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been permanently deleted. Please register again if you wish to use PawWell.'
      });
    }

    // Check if account is active (deactivated by admin)
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in. Check your email for the verification OTP.',
        code: 'EMAIL_NOT_VERIFIED',
        nextStep: 'verify-email-otp'
      });
    }

    // Verify password
    const isPasswordValid = await user.checkPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Calculate token expiry times in milliseconds
    const accessExpiry = getTokenExpiry(config.jwt.accessTokenExpire);
    const refreshExpiry = getTokenExpiry(config.jwt.refreshTokenExpire);

    // Set httpOnly cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict',
      maxAge: accessExpiry
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: refreshExpiry
    });

    // Prepare user data
    const userData = user.toJSON();

    // Ensure isProfileComplete is explicitly boolean
    userData.isProfileComplete = !!userData.isProfileComplete;

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during login.',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/accounts/forgot-password
 * @desc    Request password reset with OTP
 * @access  Public
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user (but don't reveal if user exists)
    const user = await User.findOne({
      where: { email: email.toLowerCase().trim() }
    });

    if (user) {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Hash the OTP before storing
      const otpHash = await bcrypt.hash(otp, 10);

      // Delete any existing password reset requests for this user
      await PasswordReset.destroy({
        where: { userId: user.id }
      });

      // Create password reset record with OTP
      const reset = await PasswordReset.create({
        userId: user.id,
        otpHash: otpHash,
        otpAttempts: 0,
        maxOtpAttempts: 5,
        isVerified: false,
        isUsed: false,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      });

      // Send OTP email
      await sendOTPEmail(user, otp);

      console.log(`✉️ OTP sent to ${user.email} (Reset ID: ${reset.id})`);
    }

    // Always return success message (security best practice)
    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, you will receive an OTP shortly.',
      instructions: 'Please check your email inbox and spam folder for the 6-digit verification code.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request.',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/accounts/verify-otp
 * @desc    Verify OTP and get reset token
 * @access  Public
 */
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find user
    const user = await User.findOne({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid verification request.'
      });
    }

    // Find password reset record
    const reset = await PasswordReset.findOne({
      where: { 
        userId: user.id,
        isUsed: false
      },
      order: [['createdAt', 'DESC']]
    });

    if (!reset) {
      return res.status(404).json({
        success: false,
        message: 'No password reset request found. Please request a new OTP.'
      });
    }

    // Check if expired
    if (reset.isExpired()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
        code: 'OTP_EXPIRED'
      });
    }

    // Check if already verified
    if (reset.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'OTP has already been verified. Please proceed to reset your password.',
        resetToken: reset.token
      });
    }

    // Check if max attempts reached
    if (reset.otpAttempts >= reset.maxOtpAttempts) {
      return res.status(400).json({
        success: false,
        message: 'Maximum OTP verification attempts exceeded. Please request a new OTP.',
        code: 'MAX_ATTEMPTS_EXCEEDED'
      });
    }

    // Verify OTP
    const isOTPValid = await bcrypt.compare(otp, reset.otpHash);

    if (!isOTPValid) {
      // Increment attempts
      await reset.incrementAttempts();
      const remainingAttempts = reset.maxOtpAttempts - reset.otpAttempts - 1;

      return res.status(400).json({
        success: false,
        message: `Invalid OTP. You have ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`,
        remainingAttempts: remainingAttempts,
        code: 'INVALID_OTP'
      });
    }

    // OTP is valid - mark as verified and generate token for password reset
    reset.isVerified = true;
    await reset.save();

    console.log(`✅ OTP verified for user ${user.email} (Reset ID: ${reset.id})`);

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully! You can now reset your password.',
      resetToken: reset.token
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while verifying OTP.',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/accounts/reset-password
 * @desc    Reset user password with verified token
 * @access  Public
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Find password reset record
    const reset = await PasswordReset.findOne({
      where: { token },
      include: [{
        model: User,
        as: 'user'
      }]
    });

    if (!reset) {
      return res.status(404).json({
        success: false,
        message: 'Invalid password reset token.'
      });
    }

    // Check if already used
    if (reset.isUsed) {
      return res.status(400).json({
        success: false,
        message: 'This password reset link has already been used.'
      });
    }

    // Check if expired
    if (reset.isExpired()) {
      return res.status(400).json({
        success: false,
        message: 'This password reset link has expired. Please request a new one.'
      });
    }

    // Check if OTP was verified (for OTP flow)
    if (reset.otpHash && !reset.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your OTP before resetting password.',
        code: 'OTP_NOT_VERIFIED'
      });
    }

    // Update password
    reset.user.password = newPassword;
    await reset.user.save();

    // Mark token as used
    reset.isUsed = true;
    await reset.save();

    // Send confirmation email
    await sendPasswordChangedEmail(reset.user);

    console.log(`🔒 Password reset successful for user ${reset.user.email}`);

    return res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while resetting your password.',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/accounts/profile
 * @desc    Get current user profile
 * @access  Private
 */
const getProfile = async (req, res) => {
  try {
    const userData = req.user.toJSON();
    userData.isProfileComplete = !!userData.isProfileComplete;

    return res.status(200).json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching your profile.',
      error: error.message
    });
  }
};


/**
 * @route   PUT /api/accounts/profile
 * @desc    Update user profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    console.log('📝 Update profile request received');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('Request user:', req.user);
    
    const { 
      firstName, 
      lastName, 
      phoneNumber, 
      address, 
      city, 
      emergencyContactName, 
      emergencyContactNumber 
    } = req.body;
    
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      console.error('❌ No authenticated user found in request');
      return res.status(401).json({
        success: false,
        message: 'You must be logged in to update your profile.'
      });
    }
    
    const userId = req.user.id;
    console.log('👤 Updating profile for user ID:', userId);

    const user = await User.findByPk(userId);

    if (!user) {
      console.error('❌ User not found in database:', userId);
      return res.status(404).json({
        success: false,
        message: 'Your account could not be found. Please try logging in again.'
      });
    }


    // BACKEND VALIDATION FOR PROFILE FIELDS
    
    const errors = {};

    // Phone Number validation - must be exactly 10 digits
    if (phoneNumber) {
      console.log('🔒 BACKEND VALIDATION: Checking phoneNumber...');
      const phoneValue = phoneNumber.trim();
      if (!/^\d{10}$/.test(phoneValue)) {
        console.error('❌ BACKEND REJECTED: Invalid phone number:', phoneValue);
        errors.phoneNumber = 'Phone Number must be exactly 10 digits with no letters or symbols';
      }
    }

    // City validation - only letters, no numbers or symbols
    if (city) {
      console.log('🔒 BACKEND VALIDATION: Checking city...');
      const cityValue = city.trim();
      if (!/^[A-Za-z\s]+$/.test(cityValue)) {
        console.error('❌ BACKEND REJECTED: Invalid city:', cityValue);
        errors.city = 'City can only contain letters (A–Z), no numbers or symbols allowed';
      }
    }

    // Emergency Contact Name validation - only letters
    if (emergencyContactName) {
      console.log('🔒 BACKEND VALIDATION: Checking emergencyContactName...');
      const nameValue = emergencyContactName.trim();
      if (!/^[A-Za-z\s]+$/.test(nameValue)) {
        console.error('❌ BACKEND REJECTED: Invalid emergency contact name:', nameValue);
        errors.emergencyContactName = 'Emergency Contact Name can only contain letters (A–Z), no numbers or symbols allowed';
      }
    }

    // Emergency Contact Number validation - must be exactly 10 digits
    if (emergencyContactNumber) {
      console.log('🔒 BACKEND VALIDATION: Checking emergencyContactNumber...');
      const numberValue = emergencyContactNumber.trim();
      if (!/^\d{10}$/.test(numberValue)) {
        console.error('❌ BACKEND REJECTED: Invalid emergency contact number:', numberValue);
        errors.emergencyContactNumber = 'Emergency Contact Number must be exactly 10 digits with no letters or symbols';
      }
    }

    // If validation errors exist, return them
    if (Object.keys(errors).length > 0) {
      console.error('❌ BACKEND VALIDATION FAILED:', errors);
      return res.status(400).json({
        success: false,
        message: 'Please check your information and try again.',
        errors
      });
    }

    console.log('✅ BACKEND VALIDATION PASSED: All fields are valid');

    // Handle profile picture upload
    if (req.file) {
      console.log('📷 Profile picture uploaded:', req.file.path);
      user.profilePicture = req.file.path;
    } else {
      console.log('⚠️ No file received in request');
    }

    // Update fields if provided
    if (firstName) {
      user.firstName = firstName;
      console.log('✅ Updated firstName:', firstName);
    }
    if (lastName) {
      user.lastName = lastName;
      console.log('✅ Updated lastName:', lastName);
    }
    if (phoneNumber) {
      user.phoneNumber = phoneNumber;
      console.log('✅ Updated phoneNumber:', phoneNumber);
    }
    if (address) {
      user.address = address;
      console.log('✅ Updated address:', address);
    }
    if (city) {
      user.city = city;
      console.log('✅ Updated city:', city);
    }
    if (emergencyContactName) {
      user.emergencyContactName = emergencyContactName;
      console.log('✅ Updated emergencyContactName:', emergencyContactName);
    }
    if (emergencyContactNumber) {
      user.emergencyContactNumber = emergencyContactNumber;
      console.log('✅ Updated emergencyContactNumber:', emergencyContactNumber);
    }

    // Check if profile is complete
    // Required: firstName, lastName, phoneNumber, address, city, emergencyContactName, emergencyContactNumber
    // Note: profilePicture is optional
    const isComplete = !!(
      user.firstName && 
      user.lastName && 
      user.phoneNumber && 
      user.address && 
      user.city && 
      user.emergencyContactName && 
      user.emergencyContactNumber
    );
    
    user.isProfileComplete = isComplete;
    console.log('📊 Profile completion status:', isComplete);

    await user.save();
    console.log('💾 Profile saved successfully');

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    console.error('Error stack:', error.stack);
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      const errors = {};
      error.errors.forEach(err => {
        errors[err.path] = err.message;
      });
      console.error('❌ Sequelize validation errors:', errors);
      return res.status(400).json({
        success: false,
        message: 'Please check your information and try again.',
        errors
      });
    }
    
    // Provide more specific error messages
    let errorMessage = 'Unable to update your profile. Please try again.';
    
    if (error.name === 'SequelizeDatabaseError') {
      errorMessage = 'A database error occurred. Please contact support if this continues.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
};

/**
 * Delete user account
 * @route   DELETE /api/accounts/profile
 * @desc    Soft delete user account (all related data persists for restoration)
 * @access  Private
 */
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Soft delete user account (paranoid mode will set deleted_at timestamp)
    // ⚠️ All related data (pets, bookings, reviews, payments) remains intact
    await user.destroy();
    console.log(`✅ Soft deleted user account ${userId}`);
    console.log(`💾 All related data (pets, bookings, reviews, payments) retained for potential restoration`);

    // Clear authentication cookies
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    return res.status(200).json({
      success: true,
      message: 'Account deleted successfully. Your account can be reactivated by registering with the same email.'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while deleting account.',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/accounts/token/refresh
 * @desc    Refresh access token
 * @access  Public
 */
const refreshToken = async (req, res) => {
  try {
    // Get refresh token from cookie
    const refresh = req.cookies.refreshToken;

    if (!refresh) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required.'
      });
    }

    // Verify refresh token
    const decoded = verifyToken(refresh);

    if (!decoded || decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token.'
      });
    }

    // Get user
    const user = await User.findByPk(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive.'
      });
    }

    // Generate new access token
    const { accessToken } = generateTokens(user.id);
    const accessExpiry = getTokenExpiry(config.jwt.accessTokenExpire);

    // Set new access token cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: accessExpiry
    });

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while refreshing token.',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/accounts/logout
 * @desc    Logout user and clear cookies
 * @access  Private
 */
const logout = async (req, res) => {
  try {
    // Clear httpOnly cookies
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    return res.status(200).json({
      success: true,
      message: 'Logout successful.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during logout.',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/accounts/verify-email-otp
 * @desc    Verify email OTP and CREATE account during signup
 * @access  Public
 */
const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    console.log(`🔄 Verifying OTP for email: ${normalizedEmail}`);

    // Find pending registration by email
    const pendingRegistration = await PendingRegistration.findOne({
      where: { email: normalizedEmail }
    });

    if (!pendingRegistration) {
      console.error('❌ No pending registration found:', normalizedEmail);
      return res.status(404).json({
        success: false,
        message: 'No registration found. Please register first.',
        code: 'NO_REGISTRATION'
      });
    }

    console.log('✅ Pending registration found');

    // Check if expired
    if (pendingRegistration.isExpired()) {
      console.error('❌ OTP expired for:', normalizedEmail);
      // Delete expired pending registration
      await pendingRegistration.destroy();
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please register again to get a new OTP.',
        code: 'OTP_EXPIRED'
      });
    }

    console.log('✅ OTP not expired');

    // Check if max attempts reached
    if (pendingRegistration.otpAttempts >= pendingRegistration.maxOtpAttempts) {
      console.error('❌ Max attempts exceeded for:', normalizedEmail);
      // Delete pending registration if max attempts exceeded
      await pendingRegistration.destroy();
      return res.status(400).json({
        success: false,
        message: 'Maximum OTP verification attempts exceeded. Please register again.',
        code: 'MAX_ATTEMPTS_EXCEEDED'
      });
    }

    console.log('✅ Attempts remaining:', pendingRegistration.maxOtpAttempts - pendingRegistration.otpAttempts);

    // Verify OTP
    const isOTPValid = await pendingRegistration.verifyOTP(otp);

    if (!isOTPValid) {
      console.warn('❌ Invalid OTP entered');
      // Increment attempts
      await pendingRegistration.incrementAttempts();
      const remainingAttempts = pendingRegistration.maxOtpAttempts - pendingRegistration.otpAttempts;

      return res.status(400).json({
        success: false,
        message: `Invalid OTP. You have ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`,
        remainingAttempts: remainingAttempts,
        code: 'INVALID_OTP'
      });
    }

    console.log('✅ OTP is valid!');
    console.log('🔄 Processing account creation/reactivation...');

    // ✅ Check if this is a reactivation of a deleted account
    const deletedUser = await User.findOne({
      where: { email: normalizedEmail },
      paranoid: false
    });

    let newUser;
    try {
      if (deletedUser && deletedUser.deletedAt) {
        // REACTIVATE deleted account
        console.log('🔄 Reactivating deleted account:', normalizedEmail);
        
        deletedUser.password = pendingRegistration.password;
        deletedUser.firstName = pendingRegistration.firstName;
        deletedUser.lastName = pendingRegistration.lastName;
        deletedUser.phoneNumber = pendingRegistration.phoneNumber;
        deletedUser.userType = pendingRegistration.userType;
        deletedUser.emailVerified = true;
        deletedUser.isActive = true;
        deletedUser.isProfileComplete = false;
        
        await deletedUser.save();
        await deletedUser.restore();
        
        newUser = deletedUser;
        console.log('✅ Account reactivated successfully:', newUser.email);
        console.log('✅ All related data (pets, bookings, reviews) automatically restored');
      } else {
        // CREATE new user account
        console.log('🔄 Creating new user account from pending registration...');
        
        newUser = await User.create({
          email: pendingRegistration.email,
          password: pendingRegistration.password,
          firstName: pendingRegistration.firstName,
          lastName: pendingRegistration.lastName,
          phoneNumber: pendingRegistration.phoneNumber,
          userType: pendingRegistration.userType,
          emailVerified: true,  // ✅ Email is now verified!
          isActive: true,
          isProfileComplete: false
        });

        console.log('✅ New user account created successfully:', newUser.email);
      }
    } catch (userError) {
      console.error('❌ Error creating/reactivating user:', userError.message);
      console.error('❌ Full error details:', userError);
      
      // Extract validation errors if available
      let errorMessage = 'Failed to create user account. Please try again.';
      if (userError.errors && Array.isArray(userError.errors)) {
        errorMessage = userError.errors.map(e => e.message).join(', ');
      } else if (userError.message) {
        errorMessage = userError.message;
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to create user account. Please try again.',
        error: userError.message
      });
    }

    // Delete pending registration (no longer needed)
    await pendingRegistration.destroy();
    console.log('✅ Pending registration deleted');

    // Send admin notification about new verified registration
    try {
      const admins = await User.findAll({
        where: { userType: 'admin' },
        attributes: ['id']
      });

      if (admins.length > 0) {
        for (const admin of admins) {
          await Notification.create({
            user_id: admin.id,
            type: 'user_registered',
            title: '👤 New User Verified',
            message: `${newUser.firstName} ${newUser.lastName} (${newUser.email}) has completed email verification and can now login.`,
            reference_type: 'user',
            reference_id: newUser.id,
            is_read: false
          });
        }
        console.log('✅ Admin notifications sent');
      }
    } catch (notificationError) {
      console.warn('⚠️ Failed to send admin notifications:', notificationError.message);
    }

    console.log(`✅ Email verified successfully for: ${newUser.email}`);

    // ✅ Return success - tell frontend to redirect to LOGIN (NOT auto-login)
    return res.status(200).json({
      success: true,
      message: 'Email verified successfully! Your account has been created. Please login to continue.',
      email: newUser.email,
      nextStep: 'login'  // ✅ Redirect to login page
    });

  } catch (error) {
    console.error('❌ Verify email OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while verifying email OTP.',
      error: error.message
    });
  }
};




module.exports = {
  register,
  login,
  forgotPassword,
  verifyOTP,
  verifyEmailOTP,
  resetPassword,
  getProfile,
  updateProfile,
  deleteAccount,
  refreshToken,
  logout
};
