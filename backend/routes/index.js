const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');

// Mount auth routes
router.use('/accounts', authRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PawWell Care Center API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
