/**
 * Chat API Service
 * 
 * Handles communication with the chatbot backend API
 */

import api from './api';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'bot';
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  conversationId: string;
  timestamp: string;
  processingTime?: number;
}

export interface ChatHealthResponse {
  success: boolean;
  status: string;
  service: string;
  ollama?: {
    connected: boolean;
    baseUrl: string;
    model: string;
  };
  timestamp: string;
}

export interface ChatInfo {
  success: boolean;
  chatbot: {
    name: string;
    version: string;
    description: string;
    capabilities: string[];
    toolsAvailable: number;
    model: string;
    maxMessageLength: number;
  };
}

/**
 * Chat API methods
 */
export const chatApi = {
  /**
   * Send a message to the chatbot
   * @param message - User message text
   * @param conversationId - Optional conversation ID to maintain context
   * @returns Chat response with bot message
   */
  sendMessage: async (
    message: string,
    conversationId?: string
  ): Promise<ChatResponse> => {
    try {
      // No timeout for AI operations - let them complete
      const response = await api.post('/chat/message', {
        message,
        conversationId
      }, {
        timeout: 0 // No timeout - wait for AI response
      });
      
      return response.data;
    } catch (error: any) {
      // Handle specific error cases
      if (error.response?.status === 503) {
        throw new Error(
          'AI service is temporarily unavailable. Please try again later.'
        );
      }
      
      if (error.response?.status === 429) {
        throw new Error(
          'Too many messages. Please wait a moment before sending another message.'
        );
      }
      
      if (error.response?.status === 401) {
        throw new Error(
          'You must be logged in to use the chatbot.'
        );
      }
      
      throw new Error(
        error.response?.data?.message || 'Failed to send message. Please try again.'
      );
    }
  },

  /**
   * Check chatbot service health
   * @returns Health status of the chatbot service
   */
  checkHealth: async (): Promise<boolean> => {
    try {
      const response = await api.get<ChatHealthResponse>('/chat/health');
      return response.data.success && response.data.status === 'ok';
    } catch (error) {
      console.error('Chatbot health check failed:', error);
      return false;
    }
  },

  /**
   * Reset/clear conversation history
   * @param conversationId - Optional conversation ID to reset
   * @returns Success status
   */
  resetConversation: async (conversationId?: string): Promise<boolean> => {
    try {
      const response = await api.post('/chat/reset', {
        conversationId
      });
      return response.data.success;
    } catch (error) {
      console.error('Failed to reset conversation:', error);
      return false;
    }
  },

  /**
   * Get conversation history for the current user
   * @returns Array of past conversations
   */
  getConversationHistory: async (): Promise<any[]> => {
    try {
      const response = await api.get('/chat/history');
      return response.data.conversations || [];
    } catch (error) {
      console.error('Failed to get conversation history:', error);
      return [];
    }
  },

  /**
   * Get detailed health information
   * @returns Detailed health status
   */
  getHealthDetails: async (): Promise<ChatHealthResponse | null> => {
    try {
      const response = await api.get<ChatHealthResponse>('/chat/health');
      return response.data;
    } catch (error) {
      console.error('Failed to get health details:', error);
      return null;
    }
  },

  /**
   * Get chatbot information and capabilities
   * @returns Chatbot info including available features
   */
  getInfo: async (): Promise<ChatInfo | null> => {
    try {
      const response = await api.get<ChatInfo>('/chat/info');
      return response.data;
    } catch (error) {
      console.error('Failed to get chatbot info:', error);
      return null;
    }
  }
};

export default chatApi;
