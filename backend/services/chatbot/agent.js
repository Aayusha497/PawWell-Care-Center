/**
 * LangGraph Agent - Main Orchestrator
 * 
 * This agent handles user messages, decides which tools to use,
 * executes them, and generates natural language responses.
 */

const { createOllamaClient } = require("./ollamaClient");
const { allTools } = require("./tools");
const { ChatConversation, ChatMessage } = require("../../models");
const { v4: uuidv4 } = require('uuid');

// In-memory conversation store (conversation history per user - for current session only)
const conversationStore = new Map();

// Map user session IDs to database conversation UUIDs
const conversationIdMap = new Map();

/**
 * Parse natural language dates to ISO format
 * @param {string} dateStr - Date string like "6th march", "March 12", etc.
 * @param {number} year - Year to use (default: 2026)
 * @returns {string} ISO date string (YYYY-MM-DD)
 */
function parseToISODate(dateStr, year = 2026) {
  const monthMap = {
    jan: '01', january: '01',
    feb: '02', february: '02',
    mar: '03', march: '03',
    apr: '04', april: '04',
    may: '05',
    jun: '06', june: '06',
    jul: '07', july: '07',
    aug: '08', august: '08',
    sep: '09', september: '09',
    oct: '10', october: '10',
    nov: '11', november: '11',
    dec: '12', december: '12'
  };
  
  // Clean the string
  const cleaned = dateStr.toLowerCase().replace(/[.,]/g, '').trim();
  
  // Try to extract day and month
  const match = cleaned.match(/(\d{1,2})(?:st|nd|rd|th)?\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)?/i);
  
  if (match) {
    const day = match[1].padStart(2, '0');
    const monthName = match[2] || 'march'; // Default to March if not specified
    const month = monthMap[monthName.toLowerCase()];
    return `${year}-${month}-${day}`;
  }
  
  return null;
}

/**
 * Get or create conversation history for a user
 */
function getConversationHistory(conversationId) {
  if (!conversationStore.has(conversationId)) {
    conversationStore.set(conversationId, []);
  }
  return conversationStore.get(conversationId);
}

/**
 * Add message to conversation history
 */
function addToHistory(conversationId, role, content) {
  const history = getConversationHistory(conversationId);
  history.push({ role, content, timestamp: new Date() });
  
  // Keep only last 6 messages to avoid token limits and improve speed
  if (history.length > 6) {
    history.shift();
  }
  
  // Save to database asynchronously (don't wait for it)
  saveConversationHistory(conversationId, role, content).catch(err => {
    console.error('Error saving to database:', err.message);
  });
}

/**
 * Save conversation to database
 */
async function saveConversationHistory(conversationId, role, content) {
  try {
    // Extract userId from conversationId (format: user_123)
    const userId = conversationId.includes('user_') 
      ? parseInt(conversationId.split('_')[1])
      : null;
    
    if (!userId) {
      console.warn('Could not extract userId from conversationId:', conversationId);
      return;
    }
    
    // Get or create UUID for this conversation
    let dbConversationId = conversationIdMap.get(conversationId);
    
    if (!dbConversationId) {
      // Generate new UUID for this conversation
      dbConversationId = uuidv4();
      conversationIdMap.set(conversationId, dbConversationId);
      console.log(`🆔 Created new conversation UUID: ${dbConversationId} for session: ${conversationId}`);
    }
    
    // Find or create conversation
    let conversation = await ChatConversation.findOne({
      where: { conversation_id: dbConversationId }
    });
    
    if (!conversation) {
      // Create new conversation
      // Get first user message for title
      const title = role === 'user' ? content.substring(0, 100) : 'New Conversation';
      
      conversation = await ChatConversation.create({
        conversation_id: dbConversationId,
        user_id: userId,
        title: title,
        last_message_at: new Date()
      });
      console.log(`💾 Created new conversation in DB: ${dbConversationId}`);
    } else {
      // Update last message time
      await conversation.update({
        last_message_at: new Date()
      });
    }
    
    // Save message
    await ChatMessage.create({
      conversation_id: dbConversationId,
      role: role,
      content: content
    });
    
  } catch (error) {
    console.error('Error saving conversation to database:', error);
    throw error;
  }
}

/**
 * Get user's conversation history from database
 */
async function getUserConversationHistory(userId) {
  try {
    const conversations = await ChatConversation.findAll({
      where: { user_id: userId },
      include: [{
        model: ChatMessage,
        as: 'messages',
        attributes: ['message_id', 'role', 'content', 'created_at'],
        order: [['created_at', 'ASC']]
      }],
      order: [['last_message_at', 'DESC']],
      limit: 20
    });
    
    // Format conversations for frontend
    return conversations.map(conv => {
      const messages = conv.messages || [];
      const firstUserMessage = messages.find(m => m.role === 'user');
      const lastMessage = messages[messages.length - 1];
      
      return {
        conversationId: conv.conversation_id,
        title: conv.title || firstUserMessage?.content?.substring(0, 50) || 'New Conversation',
        preview: lastMessage?.content?.substring(0, 100) || '',
        messageCount: messages.length,
        createdAt: conv.created_at,
        lastMessage: conv.last_message_at,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.created_at
        }))
      };
    });
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    return [];
  }
}

/**
 * Clear old conversations (cleanup)
 */
setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  for (const [id, history] of conversationStore.entries()) {
    if (history.length > 0 && history[history.length - 1].timestamp < oneHourAgo) {
      conversationStore.delete(id);
      // Also remove from ID mapping
      conversationIdMap.delete(id);
    }
  }
}, 30 * 60 * 1000); // Clean up every 30 minutes

/**
 * System prompt for the chatbot
 */
const SYSTEM_PROMPT = `You are PawBot, a helpful and friendly AI assistant for PawWell Care Center, a pet care facility.

Your role is to help pet owners by:
- Answering questions about booking availability and their reservations
- Providing information about their pets and pet activities
- Sharing service details, pricing, and reviews
- Accessing wellness records and health information
- Retrieving notifications and profile information

IMPORTANT CONTEXT:
- TODAY'S DATE: {todayDate}
- When showing availability, the tool automatically excludes today and past dates - only future dates from tomorrow onwards are returned
- Use this date for context when user asks about "this month", "next week", etc.

IMPORTANT GUIDELINES:
1. Always be warm, friendly, and professional
2. Use the provided tools to fetch accurate, real-time data from the database
3. Only access data for the authenticated user (userId: {userId})
4. If the user's question is vague or missing required information, ask clarifying questions BEFORE using tools
5. For availability questions about "available dates", use check_availability with month and year (defaults to current month if not specified)
6. Format responses in a clear, easy-to-read manner using markdown
7. When showing availability in tables, use EXACTLY these 3 columns - DO NOT add any other columns:
   | Date (Formatted) | Day of Week | Available Slots |
   |-----------------|-------------|----------------|
   | Mar 5, 2026 | Thu | 10 |
   STRICT RULES:
   - ONLY show these 3 columns: "Date (Formatted)", "Day of Week", "Available Slots"
   - DO NOT add Max Capacity, Status, or any other columns
   - Use abbreviated month names (Mar, Apr, etc.) and full day names (Monday, Tuesday, Wed, Thu, Fri, Sat, Sun)
   - Date format: "Mar 5, 2026" (Month Day, Year)
8. Keep tables concise - if showing many dates, group by week or show summary
9. If you can't find information, say so politely and suggest alternatives
10. Never make up information - always use tools to get real data or ask for clarification

TOOL USAGE RULES:
- Only call a tool when you have ALL required parameters
- If missing information, ask the user for it conversationally
- For date-related queries, ask for specific dates if not provided
- For pet-related queries, you may need to first get the user's pets, then ask which one they mean

AVAILABLE TOOLS:
{tools}

USER CONTEXT:
- User ID: {userId}
- Name: {userName}
- Email: {userEmail}

Remember: Ask clarifying questions when needed. Don't guess parameters for tools!`;

/**
 * Format availability calendar data into a markdown table
 */
function formatAvailabilityTable(data) {
  try {
    const parsed = JSON.parse(data);
    
    // Check if this is availability data
    if (!parsed.calendar || !Array.isArray(parsed.calendar)) {
      return null; // Not availability data, let AI format it
    }
    
    const { serviceType, monthName, year, calendar, availableDays, fullyBookedDays } = parsed;
    
    // Build the table
    let response = `Here's the availability for **${serviceType}** in **${monthName} ${year}**!\n\n`;
    response += `📊 **Summary:** ${availableDays} days available, ${fullyBookedDays} fully booked.\n\n`;
    response += `| Date (Formatted) | Day of Week | Available Slots |\n`;
    response += `|------------------|-------------|----------------|\n`;
    
    // Add all calendar rows
    calendar.forEach(day => {
      response += `| ${day.formattedDate} | ${day.dayOfWeek} | ${day.slotsAvailable} |\n`;
    });
    
    return response;
  } catch (e) {
    return null; // Not JSON or parsing failed, let AI handle it
  }
}

/**
 * Create chat agent with tool calling capability
 */
async function createChatAgent() {
  const { client, model, temperature } = createOllamaClient();
  
  /**
   * Process user message with tool calling
   * @param {Object} input - Input containing user message and context
   * @returns {Promise<string>} Agent response
   */
  async function processMessage(input) {
    const { message, userId, userName, userEmail, conversationId } = input;
    
    try {
      // Get conversation history
      const convId = conversationId || `user_${userId}`;
      const history = getConversationHistory(convId);
      
      // Add current user message to history
      addToHistory(convId, 'user', message);
      
      // Create tool descriptions for the prompt (filter out undefined tools)
      const toolDescriptions = allTools
        .filter(tool => tool && tool.name && tool.description)
        .map(tool => 
          `- ${tool.name}: ${tool.description}`
        ).join('\n');
      
      // Get today's date for context
      const today = new Date();
      const todayFormatted = today.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      // Create the system message with context
      const systemMessage = SYSTEM_PROMPT
        .replace('{userId}', userId)
        .replace('{userName}', userName)
        .replace('{userEmail}', userEmail)
        .replace('{todayDate}', todayFormatted)
        .replace('{tools}', toolDescriptions);
      
      // Build conversation context from history
      let conversationContext = '';
      let extractedInfo = { dates: null, service: null };
      
      if (history.length > 1) {
        conversationContext = '\n\nPREVIOUS CONVERSATION:\n';
        // Get last few messages (excluding the current one we just added)
        const previousMessages = history.slice(0, -1).slice(-4); // Reduced from 6 for faster processing
        conversationContext += previousMessages.map(msg => 
          `${msg.role === 'user' ? 'User' : 'PawBot'}: ${msg.content}`
        ).join('\n');
        
        // Extract dates from conversation history
        const allUserMessages = previousMessages
          .filter(m => m.role === 'user')
          .map(m => m.content)
          .join(' ') + ' ' + message;
        
        // Try to extract month and year information
        const monthNames = {
          january: 1, jan: 1,
          february: 2, feb: 2,
          march: 3, mar: 3,
          april: 4, apr: 4,
          may: 5,
          june: 6, jun: 6,
          july: 7, jul: 7,
          august: 8, aug: 8,
          september: 9, sep: 9, sept: 9,
          october: 10, oct: 10,
          november: 11, nov: 11,
          december: 12, dec: 12
        };
        
        // Extract month
        for (const [name, num] of Object.entries(monthNames)) {
          if (new RegExp(`\\b${name}\\b`, 'i').test(allUserMessages)) {
            extractedInfo.month = num;
            extractedInfo.monthName = name;
            break;
          }
        }
        
        // Extract year (look for 4-digit year like 2026)
        const yearMatch = allUserMessages.match(/\b(20\d{2})\b/);
        if (yearMatch) {
          extractedInfo.year = parseInt(yearMatch[1]);
        }
        
        // Default to current month/year if asking about "available dates"
        if (/available dates|availability|when.*available|which.*available/i.test(allUserMessages)) {
          if (!extractedInfo.month) {
            const now = new Date();
            extractedInfo.month = now.getMonth() + 1;
            extractedInfo.monthName = 'current month';
          }
          if (!extractedInfo.year) {
            extractedInfo.year = new Date().getFullYear();
          }
        }
        
        // Extract service type
        if (/boarding|overnight/i.test(allUserMessages)) {
          extractedInfo.service = 'Pet Boarding';
        } else if (/grooming/i.test(allUserMessages)) {
          extractedInfo.service = 'Grooming';
        } else if (/daycation|daycare|sitting/i.test(allUserMessages)) {
          extractedInfo.service = 'Daycation/Pet Sitting';
        }
        
        conversationContext += '\n\nEXTRACTED INFORMATION FROM CONVERSATION:';
        if (extractedInfo.month) {
          conversationContext += `\n- Month: ${extractedInfo.month} (${extractedInfo.monthName})`;
        }
        if (extractedInfo.year) {
          conversationContext += `\n- Year: ${extractedInfo.year}`;
        }
        if (extractedInfo.service) {
          conversationContext += `\n- Service mentioned: serviceType="${extractedInfo.service}"`;
        }
        if (extractedInfo.month || extractedInfo.year || extractedInfo.service) {
          conversationContext += '\n\nUSE THESE EXACT VALUES when calling tools!\n';
        }
      }
      
      // Use a ReAct-style approach with text-based tool calls
      const prompt = `${systemMessage}${conversationContext}

Current User Message: ${message}

Decision Process:
1. Review the EXTRACTED INFORMATION section - it shows month, year, and service names ready to use!
2. If you see month, year, and serviceType in the extracted info, YOU HAVE EVERYTHING for check_availability
3. Use the exact values as shown (e.g., month=3 for March, serviceType="Pet Boarding")
4. If month/year not specified, the tool will default to current month
5. If any required information is missing from extracted info, ask the user

TOOL CALL EXAMPLE:
If extracted info shows:
- Month: 3 (march)
- Year: 2026  
- serviceType="Pet Boarding"

Then call:
TOOL: check_availability
INPUT: {"month": 3, "year": 2026, "serviceType": "Pet Boarding"}

For general availability questions without specific month, current month is used:
TOOL: check_availability
INPUT: {"serviceType": "Pet Boarding"}

If you have all parameters from EXTRACTED INFORMATION, use them:
TOOL: tool_name
INPUT: {"param1": "value1", "param2": "value2"}

Otherwise, ask for ONLY the missing specific information.

Your response:`;

      const response = await client.generate({
        model: model,
        prompt: prompt,
        options: {
          temperature: temperature,
          num_predict: 256, // Reduced from 512 for faster response
        }
      });
      
      const responseText = response.response;
      
      // Check if the response contains a tool call
      if (responseText.includes('TOOL:')) {
        const botResponse = await handleToolCall(responseText, userId, userName, client, model, temperature, convId);
        addToHistory(convId, 'assistant', botResponse);
        return botResponse;
      }
      
      // Add bot response to history
      addToHistory(convId, 'assistant', responseText);
      return responseText;
      
    } catch (error) {
      console.error('❌ Error in chat agent:', error);
      return "I apologize, but I encountered an error processing your request. Please try again or contact support if the issue persists.";
    }
  }
  
  /**
   * Handle tool calls extracted from LLM response
   */
  async function handleToolCall(response, userId, userName, client, model, temperature, conversationId) {
    try {
      // Extract tool name and input
      const toolMatch = response.match(/TOOL:\s*(\w+)/);
      const inputMatch = response.match(/INPUT:\s*({[^}]+})/);
      
      if (!toolMatch) {
        return response; // No tool call found, return as-is
      }
      
      const toolName = toolMatch[1];
      let toolInput = {};
      
      if (inputMatch) {
        try {
          toolInput = JSON.parse(inputMatch[1]);
        } catch (e) {
          console.error('Failed to parse tool input:', e);
        }
      }
      
      // Add userId to tool input
      toolInput.userId = userId;
      
      // Find and execute the tool (filter out undefined tools)
      const tool = allTools.find(t => t && t.name === toolName);
      
      if (!tool) {
        return `I tried to use a tool called "${toolName}" but it's not available. Let me try to answer your question directly.`;
      }
      
      console.log(`🔧 Executing tool: ${toolName} with input:`, toolInput);
      
      try {
        const toolResult = await tool.invoke(toolInput);
        
        // Try to format availability data directly
        const formattedTable = formatAvailabilityTable(toolResult);
        
        if (formattedTable) {
          // We successfully formatted availability data, return it directly
          console.log('✅ Formatted availability table directly');
          return formattedTable;
        }
        
        // Generate response based on tool result
        const finalPrompt = `Based on this data from the database:

${toolResult}

Please provide a helpful, natural language response to the user's original question. 

IMPORTANT FORMATTING RULES:
- If this is availability data with a calendar, present it as a table with EXACTLY 3 columns:
  1. Date (Formatted) - format as "Mar 5, 2026"
  2. Day of Week - format as "Thu", "Fri", "Sat", etc.
  3. Available Slots - just the number
- DO NOT include Max Capacity, Status, or any other columns in the table
- Show dates in readable format (e.g., "Mar 6, 2026" not just "2026-03-06")
- Keep the table clean and easy to scan
- Add helpful summary context above the table
- CRITICAL: Complete ALL rows in the table - never leave rows incomplete or cut off mid-table
- Every row MUST have all 3 columns filled in

Format the information clearly and conversationally. Keep it friendly and concise.

Your response to ${userName}:`;

        const finalResponse = await client.generate({
          model: model,
          prompt: finalPrompt,
          options: {
            temperature: temperature,
            num_predict: 1200, // Increased to handle full month tables (27+ rows)
          }
        });
        
        return finalResponse.response;
      } catch (toolError) {
        console.error('❌ Tool execution error:', toolError.message);
        
        // Parse the error to understand what's missing
        const errorMsg = toolError.message || '';
        
        if (errorMsg.includes('month') || errorMsg.includes('serviceType')) {
          return "I need to know which service you're interested in to check availability. We offer:\n\n1. **Pet Boarding** - Overnight stays for your pet\n2. **Grooming** - Bathing, haircuts, and styling  \n3. **Daycation/Pet Sitting** - Daytime care\n\nWhich service would you like to check availability for? I can show you the available dates for this month or any specific month you're interested in.";
        } else if (errorMsg.includes('expected') || errorMsg.includes('Invalid')) {
          return "I'm having trouble understanding the details. To check availability, I just need to know which service you're interested in (Pet Boarding, Grooming, or Daycation/Pet Sitting). I can show you all available dates for the current month or any month you specify!";
        }
        
        // For other errors, return a helpful message
        return "I encountered an issue while processing that. Could you please rephrase your request or provide the information in a different way?";
      }
      
    } catch (error) {
      console.error('❌ Error handling tool call:', error);
      return "I encountered an issue while fetching that information. Could you please try rephrasing your question?";
    }
  }
  
  return {
    processMessage
  };
}

/**
 * Simple wrapper for single message processing
 * @param {string} message - User message
 * @param {Object} userContext - User information
 * @returns {Promise<string>} Bot response
 */
async function chat(message, userContext) {
  const agent = await createChatAgent();
  return await agent.processMessage({
    message,
    ...userContext
  });
}

/**
 * Clear conversation history for a user
 * @param {string} conversationId - Conversation ID to clear
 */
function clearConversation(conversationId) {
  if (conversationStore.has(conversationId)) {
    conversationStore.delete(conversationId);
    conversationIdMap.delete(conversationId);
    console.log(`🗑️ Cleared conversation: ${conversationId}`);
    return true;
  }
  return false;
}

module.exports = {
  createChatAgent,
  chat,
  clearConversation,
  getUserConversationHistory
};
