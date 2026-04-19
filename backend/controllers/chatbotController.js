/**
 * Chatbot Controller
 * 
 * Handles chat-related API endpoints and message processing
 */

const { chat } = require('../services/chatbot/agent');
const { testGroqConnection } = require('../services/chatbot/groqClient');

/**
 * Handle chat message from user
 * POST /api/chat/message
 */
exports.handleChatMessage = async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    const userId = req.user.id;
    const userName = `${req.user.first_name} ${req.user.last_name}`;
    const userEmail = req.user.email;
    
    console.log(`💬 Chat request from user ${userId} (${userName}):`, message?.substring(0, 50));
    
    // Validate input
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }
    
    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Message is too long. Please keep it under 1000 characters.'
      });
    }
    
    // Process message with agent
    const startTime = Date.now();
    
    // Use conversationId if provided, otherwise create one for this user
    const convId = conversationId || `user_${userId}`;
    
    const response = await chat(message, {
      userId,
      userName,
      userEmail,
      conversationId: convId
    });
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ Chat response generated in ${processingTime}ms`);
    
    return res.json({
      success: true,
      response,
      conversationId: convId,
      timestamp: new Date().toISOString(),
      processingTime
    });
    
  } catch (error) {
    console.error('❌ Chat error:', error);
    
    // Check if it's an Ollama connection error
    if (error.message?.includes('ECONNREFUSED') || error.message?.includes('fetch failed')) {
      return res.status(503).json({
        success: false,
        message: 'AI service is currently unavailable. Please ensure Ollama is running.',
        error: 'SERVICE_UNAVAILABLE'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred processing your request. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Health check endpoint
 * GET /api/chat/health
 */
exports.healthCheck = async (req, res) => {
  try {
    const groqStatus = await testGroqConnection();
    
    return res.json({
      success: true,
      status: 'ok',
      service: 'chatbot',
      groq: {
        connected: groqStatus,
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      status: 'error',
      service: 'chatbot',
      error: error.message
    });
  }
};

/**
 * Get chatbot capabilities/info
 * GET /api/chat/info
 */
exports.getInfo = async (req, res) => {
  const { toolCount } = require('../services/chatbot/tools');
  
  return res.json({
    success: true,
    chatbot: {
      name: 'PawBot',
      version: '1.0.0',
      description: 'AI assistant for PawWell Care Center',
      capabilities: [
        'Check booking availability',
        'View booking history',
        'Get pet information',
        'View activity logs',
        'Access wellness records',
        'Service pricing and reviews',
        'Profile and notifications'
      ],
      toolsAvailable: toolCount,
      model: process.env.OLLAMA_MODEL || 'gemma2:2b',
      maxMessageLength: 1000
    }
  });
};

/**
 * Reset/clear conversation history
 * POST /api/chat/reset
 */
exports.resetConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.body;
    
    // Import the agent to access conversation store
    const { clearConversation } = require('../services/chatbot/agent');
    
    // Clear the specific conversation or all for the user
    const convId = conversationId || `user_${userId}`;
    clearConversation(convId);
    
    console.log(`Conversation reset for user ${userId}`);
    
    return res.json({
      success: true,
      message: 'Conversation history cleared successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Reset error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset conversation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get user's conversation history
 * GET /api/chat/history
 */
exports.getConversationHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Import the agent to access conversation history
    const { getUserConversationHistory } = require('../services/chatbot/agent');
    
    const conversations = await getUserConversationHistory(userId);
    
    console.log(`📚 Retrieved ${conversations.length} conversations for user ${userId}`);
    
    return res.json({
      success: true,
      conversations,
      count: conversations.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ History retrieval error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve conversation history',
      conversations: [],
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Generate a unique conversation ID
 */
function generateConversationId(userId) {
  return `conv_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = exports;
