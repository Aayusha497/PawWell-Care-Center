import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Send, X, Loader2, RotateCcw, History } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import chatApi from '../../services/chatApi';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatbotWidgetProps {
  onClose: () => void;
}

export default function ChatbotWidget({ onClose }: ChatbotWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m PawBot 🐾, your AI assistant for PawWell Care Center. I can help you with bookings, pet information, wellness records, and more! How can I help you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      // Send message to chatbot API
      const response = await chatApi.sendMessage(inputValue, conversationId);
      
      // Update conversation ID if this is a new conversation
      if (!conversationId && response.conversationId) {
        setConversationId(response.conversationId);
      }
      
      // Add bot response to messages
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.response,
        sender: 'bot',
        timestamp: new Date(response.timestamp)
      };
      
      setMessages(prev => [...prev, botMessage]);
      
    } catch (error: any) {
      console.error('Chat error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: error.message || 'Sorry, I encountered an error. Please try again or contact support if the issue persists.',
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      // Call API to clear backend conversation history
      if (conversationId) {
        await chatApi.resetConversation(conversationId);
      }
      
      // Reset conversation to initial state
      setMessages([
        {
          id: '1',
          text: 'Hello! I\'m PawBot 🐾, your AI assistant for PawWell Care Center. I can help you with bookings, pet information, wellness records, and more! How can I help you today?',
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
      setConversationId(undefined);
      setInputValue('');
      setError(null);
      
      console.log('✅ Conversation reset successfully');
    } catch (error) {
      console.error('Failed to reset conversation:', error);
      // Still reset the UI even if backend call fails
      setMessages([
        {
          id: '1',
          text: 'Hello! I\'m PawBot 🐾, your AI assistant for PawWell Care Center. I can help you with bookings, pet information, wellness records, and more! How can I help you today?',
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
      setConversationId(undefined);
      setInputValue('');
      setError(null);
    }
  };

  const handleShowHistory = async () => {
    setShowHistory(true);
    setHistoryLoading(true);
    
    try {
      const history = await chatApi.getConversationHistory();
      setConversationHistory(history || []);
    } catch (error) {
      console.error('Failed to load history:', error);
      setConversationHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleLoadConversation = (conv: any) => {
    // Load selected conversation
    const loadedMessages: Message[] = conv.messages.map((msg: any, idx: number) => ({
      id: `${conv.conversationId}_${idx}`,
      text: msg.content,
      sender: msg.role === 'user' ? 'user' : 'bot',
      timestamp: new Date(msg.timestamp)
    }));
    
    setMessages(loadedMessages);
    setConversationId(conv.conversationId);
    setShowHistory(false);
  };

  return (
    <Card className="w-96 h-[500px] shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-[#EAB308] text-white p-4 flex items-center justify-between rounded-t-lg shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐾</span>
          <div>
            <h3 className="font-semibold">PawBot AI Assistant</h3>
            <p className="text-xs opacity-90">
              {isLoading ? 'Thinking...' : 'Always here to help'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={handleShowHistory} 
            className="hover:bg-white/20 p-1 rounded transition-colors"
            aria-label="View chat history"
            title="View past conversations"
            disabled={isLoading}
          >
            <History size={18} />
          </button>
          <button 
            onClick={handleReset} 
            className="hover:bg-white/20 p-1 rounded transition-colors"
            aria-label="Reset conversation"
            title="Start new conversation"
            disabled={isLoading}
          >
            <RotateCcw size={18} />
          </button>
          <button 
            onClick={onClose} 
            className="hover:bg-white/20 p-1 rounded transition-colors"
            aria-label="Close chat"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg break-words ${
                  message.sender === 'user'
                    ? 'bg-[#EAB308] text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.sender === 'bot' ? (
                  <div className="text-sm prose prose-sm max-w-none
                    [&_table]:border-collapse [&_table]:border [&_table]:border-gray-300
                    [&_th]:border [&_th]:border-gray-300 [&_th]:bg-gray-100 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold
                    [&_td]:border [&_td]:border-gray-300 [&_td]:px-3 [&_td]:py-2
                    [&_table]:w-full [&_table]:my-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                )}
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 p-3 rounded-lg flex items-center gap-2">
                <Loader2 className="animate-spin" size={16} />
                <span className="text-sm">PawBot is typing...</span>
              </div>
            </div>
          )}
          
          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input */}
      <div className="p-4 border-t shrink-0">
        {error && (
          <div className="mb-2 text-xs text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask me anything..."
            className="flex-1"
            disabled={isLoading}
            maxLength={1000}
          />
          <Button
            onClick={handleSend}
            className="bg-[#EAB308] hover:bg-[#D4A017] transition-colors"
            disabled={isLoading || !inputValue.trim()}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Send size={18} />
            )}
          </Button>
        </div>
      </div>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl max-h-[600px]">
          <DialogHeader>
            <DialogTitle>Chat History</DialogTitle>
            <DialogDescription>
              View and load your previous conversations with PawBot
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[400px] pr-4">
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin mr-2" size={20} />
                <span className="text-sm text-gray-500">Loading history...</span>
              </div>
            ) : conversationHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <History size={48} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversation history yet</p>
                <p className="text-xs mt-1">Start chatting to build your history!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {conversationHistory.map((conv, index) => (
                  <Card
                    key={conv.conversationId || index}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleLoadConversation(conv)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-sm text-gray-900">
                        {conv.title || `Conversation ${index + 1}`}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {new Date(conv.lastMessage).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {conv.preview || 'No preview available'}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <span>{conv.messageCount || 0} messages</span>
                      <span>•</span>
                      <span>{new Date(conv.lastMessage).toLocaleTimeString()}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
