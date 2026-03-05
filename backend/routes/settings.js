const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get user settings
router.get('/', settingsController.getSettings);

// Update user settings
router.put('/', settingsController.updateSettings);

// Reset settings to default
router.post('/reset', settingsController.resetSettings);

module.exports = router;
