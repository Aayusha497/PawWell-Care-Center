const { User } = require('../models');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');

/**
 * Setup 2FA - Generate secret and QR code
 * @route POST /api/settings/2fa/setup
 */
exports.setup2FA = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if 2FA is already enabled
    if (user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is already enabled. Disable it first to set up again.'
      });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `PawWell Care (${user.email})`,
      issuer: 'PawWell Care Center',
      length: 32
    });

    // Generate backup codes (10 codes)
    const backupCodes = Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    // Temporarily store the secret (not enabled yet until verified)
    user.twoFactorSecret = secret.base32;
    user.backupCodes = backupCodes;
    await user.save();

    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url);

    console.log(`🔐 2FA setup initiated for user ${user.email}`);

    return res.status(200).json({
      success: true,
      data: {
        secret: secret.base32,
        qrCode: qrCodeDataURL,
        backupCodes: backupCodes,
        manualEntry: secret.base32 // For manual entry if QR doesn't work
      }
    });
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to setup 2FA',
      error: error.message
    });
  }
};

/**
 * Verify and enable 2FA
 * @route POST /api/settings/2fa/verify
 */
exports.verify2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: 'Please setup 2FA first'
      });
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps before/after for clock drift
    });

    if (!verified) {
      return res.status(401).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Enable 2FA
    user.twoFactorEnabled = true;
    await user.save();

    console.log(`✅ 2FA enabled for user ${user.email}`);

    return res.status(200).json({
      success: true,
      message: '2FA has been enabled successfully',
      data: {
        backupCodes: user.backupCodes
      }
    });
  } catch (error) {
    console.error('Error verifying 2FA:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify 2FA',
      error: error.message
    });
  }
};

/**
 * Disable 2FA
 * @route POST /api/settings/2fa/disable
 */
exports.disable2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password, token } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to disable 2FA'
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isPasswordValid = await user.checkPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password'
      });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is not enabled'
      });
    }

    // Verify 2FA token if provided
    if (token) {
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: 2
      });

      if (!verified) {
        // Check if it's a backup code
        const backupCodes = user.backupCodes || [];
        const codeIndex = backupCodes.indexOf(token.toUpperCase());
        
        if (codeIndex === -1) {
          return res.status(401).json({
            success: false,
            message: 'Invalid 2FA code or backup code'
          });
        }
      }
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.backupCodes = null;
    await user.save();

    console.log(`🔓 2FA disabled for user ${user.email}`);

    return res.status(200).json({
      success: true,
      message: '2FA has been disabled successfully'
    });
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to disable 2FA',
      error: error.message
    });
  }
};

/**
 * Get 2FA status
 * @route GET /api/settings/2fa/status
 */
exports.get2FAStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        enabled: user.twoFactorEnabled || false,
        hasSecret: !!user.twoFactorSecret
      }
    });
  } catch (error) {
    console.error('Error getting 2FA status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get 2FA status',
      error: error.message
    });
  }
};

/**
 * Validate 2FA token (used during login)
 * @param {Object} user - User object
 * @param {string} token - TOTP token or backup code
 * @returns {Promise<boolean>} - Whether token is valid
 */
exports.validate2FAToken = async (user, token) => {
  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    return false;
  }

  // Try TOTP verification first
  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: token,
    window: 2
  });

  if (verified) {
    return true;
  }

  // Check backup codes
  const backupCodes = user.backupCodes || [];
  const codeIndex = backupCodes.indexOf(token.toUpperCase());

  if (codeIndex !== -1) {
    // Remove used backup code
    backupCodes.splice(codeIndex, 1);
    user.backupCodes = backupCodes;
    await user.save();
    console.log(`🔑 Backup code used for ${user.email}. Remaining: ${backupCodes.length}`);
    return true;
  }

  return false;
};
