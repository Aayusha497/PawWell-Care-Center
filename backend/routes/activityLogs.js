/**
 * Activity Log Routes
 * 
 * Defines all routes for pet activity log management
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const {
  createActivityLog,
  getActivityLogs,
  getActivityLogById,
  updateActivityLog,
  deleteActivityLog,
} = require('../controllers/activityLogController');

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/activity-logs
 * @desc    Create a new activity log entry
 * @access  Private (admin, staff)
 */
router.post(
  '/',
  upload.single('photo'),
  createActivityLog
);

/**
 * @route   GET /api/activity-logs
 * @desc    Get activity logs with optional filters
 * @access  Private (all authenticated users)
 */
router.get('/', getActivityLogs);

/**
 * @route   GET /api/activity-logs/:id
 * @desc    Get a specific activity log by ID
 * @access  Private (all authenticated users)
 */
router.get('/:id', getActivityLogById);

/**
 * @route   PUT /api/activity-logs/:id
 * @desc    Update an activity log
 * @access  Private (admin, staff - creator only)
 */
router.put(
  '/:id',
  upload.single('photo'),
  updateActivityLog
);

/**
 * @route   DELETE /api/activity-logs/:id
 * @desc    Delete an activity log
 * @access  Private (admin, staff - creator only)
 */
router.delete('/:id', deleteActivityLog);

module.exports = router;
