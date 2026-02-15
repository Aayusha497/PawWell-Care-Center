const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const emergencyController = require('../controllers/emergencyController');

/**
 * @route   POST /api/emergency
 * @desc    Create emergency request
 * @access  Authenticated users
 */
router.post('/', authenticate, emergencyController.createEmergencyRequest);

/**
 * @route   GET /api/emergency/my
 * @desc    Get current user's emergency requests
 * @access  Authenticated users
 */
router.get('/my', authenticate, emergencyController.getMyEmergencyRequests);

/**
 * @route   GET /api/emergency
 * @desc    Admin get all emergency requests
 * @access  Admin only
 */
router.get('/', authenticate, requireAdmin, emergencyController.getAllEmergencyRequests);

/**
 * @route   PATCH /api/emergency/:id/status
 * @desc    Update emergency request status
 * @access  Admin only
 */
router.patch('/:id/status', authenticate, requireAdmin, emergencyController.updateEmergencyStatus);

module.exports = router;
