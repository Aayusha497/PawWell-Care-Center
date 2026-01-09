const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const petRoutes = require('./pets');

// Mount auth routes
router.use('/accounts', authRoutes);

// Mount admin routes
router.use('/admin', adminRoutes);

// Mount pet routes
router.use('/pets', petRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PawWell Care Center API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
