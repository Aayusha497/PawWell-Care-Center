/**
 * Conversation State Management
 * 
 * Defines the state structure for the LangGraph agent to maintain
 * conversation context and user information across interactions.
 */

const { Annotation } = require("@langchain/langgraph");

/**
 * Agent State Definition
 * 
 * Manages:
 * - messages: Conversation history
 * - userId: Authenticated user ID
 * - userName: User's full name
 * - userEmail: User's email address
 * - context: Additional contextual data (pets, bookings, etc.)
 */
const AgentState = Annotation.Root({
  // Array of messages in the conversation
  messages: Annotation({
    reducer: (current, update) => {
      if (!current) return update;
      if (!update) return current;
      return [...current, ...update];
    },
    default: () => []
  }),
  
  // User identification
  userId: Annotation({
    reducer: (current, update) => update ?? current,
    default: () => null
  }),
  
  // User's display name
  userName: Annotation({
    reducer: (current, update) => update ?? current,
    default: () => ""
  }),
  
  // User's email
  userEmail: Annotation({
    reducer: (current, update) => update ?? current,
    default: () => ""
  }),
  
  // Additional context data (can accumulate)
  context: Annotation({
    reducer: (current, update) => {
      if (!current) return update;
      if (!update) return current;
      return { ...current, ...update };
    },
    default: () => ({})
  }),
});

/**
 * Create initial state for a new conversation
 * @param {Object} params - User information
 * @param {number} params.userId - User ID
 * @param {string} params.userName - User's name
 * @param {string} params.userEmail - User's email
 * @param {string} params.initialMessage - First user message
 * @returns {Object} Initial state object
 */
function createInitialState({ userId, userName, userEmail, initialMessage }) {
  return {
    messages: [
      {
        role: "user",
        content: initialMessage
      }
    ],
    userId,
    userName,
    userEmail,
    context: {
      timestamp: new Date().toISOString(),
      sessionId: `session_${Date.now()}_${userId}`
    }
  };
}

module.exports = {
  AgentState,
  createInitialState
};
