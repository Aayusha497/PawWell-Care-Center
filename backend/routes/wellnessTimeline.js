const express = require('express');
const router = express.Router();
const { getTimelineEntries, getTimelineEntry, createTimelineEntry, updateTimelineEntry, deleteTimelineEntry } = require('../controllers/wellnessTimelineController');
const { authenticate } = require('../middleware/auth');

// Protect all routes
router.use(authenticate);

router.post('/', createTimelineEntry);
router.get('/', getTimelineEntries);
router.get('/:id', getTimelineEntry);
router.put('/:id', updateTimelineEntry);
router.delete('/:id', deleteTimelineEntry);

module.exports = router;
