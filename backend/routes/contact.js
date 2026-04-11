const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { optionalAuthenticate } = require('../middleware/auth');

/**
 * @route   POST /api/contact
 * @desc    Submit a contact message
 * @access  Public (optional authentication)
 */
router.post('/', optionalAuthenticate, contactController.createContactMessage);

module.exports = router;
