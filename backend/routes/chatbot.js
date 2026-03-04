/**
 * Chatbot Routes
 * 
 * API endpoints for the AI chatbot assistant
 */

const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { authenticate } = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');

/**
 * @route   POST /api/chat/message
 * @desc    Send a message to the chatbot
 * @access  Private (requires authentication)
 */
router.post('/message', 
  authenticate, 
  rateLimiter.chatLimiter || rateLimiter.apiLimiter, // Use chatLimiter if available, fallback to apiLimiter
  chatbotController.handleChatMessage
);

/**
 * @route   POST /api/chat/reset
 * @desc    Reset/clear conversation history
 * @access  Private (requires authentication)
 */
router.post('/reset', 
  authenticate, 
  chatbotController.resetConversation
);

/**
 * @route   GET /api/chat/history
 * @desc    Get user's conversation history
 * @access  Private (requires authentication)
 */
router.get('/history', 
  authenticate, 
  chatbotController.getConversationHistory
);

/**
 * @route   GET /api/chat/health
 * @desc    Check chatbot service health
 * @access  Public
 */
router.get('/health', chatbotController.healthCheck);

/**
 * @route   GET /api/chat/info
 * @desc    Get chatbot information and capabilities
 * @access  Public
 */
router.get('/info', chatbotController.getInfo);

module.exports = router;
