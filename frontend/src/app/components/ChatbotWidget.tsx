import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Send, X } from 'lucide-react';

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
      text: 'Hello! I\'m PawBot 🐾. How can I help you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');

  const getBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Booking queries
    if (lowerMessage.includes('book') || lowerMessage.includes('available') || lowerMessage.includes('date')) {
      return 'We have availability for the rest of this month! You can book slots for days, weeks, or months. Would you like to check specific dates? Please log in or sign up to view our calendar and make a booking.';
    }

    // Pricing queries
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('fee')) {
      return 'Our pricing varies based on the service:\n• Day Care: $25/day\n• Overnight Boarding: $45/night\n• Grooming: $30-$60\nWe accept payments via Khalti and eSewa.';
    }

    // Emergency queries
    if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent') || lowerMessage.includes('sick')) {
      return 'In case of emergency:\n1. Call our 24/7 hotline: +977-1-XXXXXXX\n2. Contact our emergency vet service\n3. If your pet shows severe symptoms, seek immediate veterinary care\nOur staff is trained in pet first aid.';
    }

    // Service queries
    if (lowerMessage.includes('service') || lowerMessage.includes('offer') || lowerMessage.includes('provide')) {
      return 'We offer:\n• Day Care\n• Overnight Boarding\n• Pet Grooming\n• Health Monitoring\n• Activity Logs\n• Special Diet Planning\n• Emergency Vet Support';
    }

    // Hours queries
    if (lowerMessage.includes('hour') || lowerMessage.includes('open') || lowerMessage.includes('time')) {
      return 'We\'re open:\nMonday - Friday: 7:00 AM - 8:00 PM\nSaturday - Sunday: 8:00 AM - 6:00 PM\nPickup/Drop-off available during operating hours.';
    }

    // Location queries
    if (lowerMessage.includes('location') || lowerMessage.includes('address') || lowerMessage.includes('where')) {
      return 'We\'re located in Kathmandu, Nepal. For exact location and directions, please contact us at info@pawwell.com or check our Contact page.';
    }

    // Default response
    return 'I can help you with:\n• Booking and availability\n• Pricing information\n• Emergency procedures\n• Our services\n• Operating hours\n\nWhat would you like to know?';
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simulate bot response delay
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(inputValue),
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    }, 500);
  };

  return (
    <Card className="w-96 h-[500px] shadow-2xl flex flex-col">
      {/* Header */}
      <div className="bg-[#EAB308] text-white p-4 flex items-center justify-between rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐾</span>
          <div>
            <h3>PawBot Assistant</h3>
            <p className="text-xs opacity-90">Always here to help</p>
          </div>
        </div>
        <button onClick={onClose} className="hover:bg-white/20 p-1 rounded">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-[#EAB308] text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-line">{message.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..."
          className="flex-1"
        />
        <Button
          onClick={handleSend}
          className="bg-[#EAB308] hover:bg-[#D4A017]"
        >
          <Send size={18} />
        </Button>
      </div>
    </Card>
  );
}
