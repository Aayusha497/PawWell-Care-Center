const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const twoFactorController = require('../controllers/twoFactorController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get user settings
router.get('/', settingsController.getSettings);

// Update user settings
router.put('/', settingsController.updateSettings);

// Reset settings to default
router.post('/reset', settingsController.resetSettings);

// Change password
router.put('/password', settingsController.changePassword);

// Change email
router.put('/email', settingsController.changeEmail);

// 2FA Routes
router.get('/2fa/status', twoFactorController.get2FAStatus);
router.post('/2fa/setup', twoFactorController.setup2FA);
router.post('/2fa/verify', twoFactorController.verify2FA);
router.post('/2fa/disable', twoFactorController.disable2FA);

module.exports = router;
