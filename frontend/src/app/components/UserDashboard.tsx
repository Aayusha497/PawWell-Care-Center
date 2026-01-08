import { useState } from 'react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import PetProfileManager from './PetProfileManager';
import BookingSystem from './BookingSystem';
import ActivityLogViewer from './ActivityLogViewer';
import WellnessTimeline from './WellnessTimeline';
import { LogOut, MessageCircle, X } from 'lucide-react';
import ChatbotWidget from './ChatbotWidget';

interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  fullName: string;
}

interface UserDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function UserDashboard({ user, onLogout }: UserDashboardProps) {
  const [chatbotOpen, setChatbotOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FFF8E8]">
      {/* Header */}
      <header className="bg-[#EAB308] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐾</span>
          <span className="text-xl">PawWell</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-medium">Welcome, {user.fullName}!</span>
          <Button onClick={onLogout} variant="ghost" className="flex items-center gap-2">
            <LogOut size={18} />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-8">
        <h1 className="text-3xl mb-6">My Dashboard</h1>

        <Tabs defaultValue="pets" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="pets">My Pets</TabsTrigger>
            <TabsTrigger value="booking">Book Service</TabsTrigger>
            <TabsTrigger value="activity">Activity Logs</TabsTrigger>
            <TabsTrigger value="wellness">Wellness Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="pets">
            <PetProfileManager />
          </TabsContent>

          <TabsContent value="booking">
            <BookingSystem />
          </TabsContent>

          <TabsContent value="activity">
            <ActivityLogViewer />
          </TabsContent>

          <TabsContent value="wellness">
            <WellnessTimeline />
          </TabsContent>
        </Tabs>
      </main>

      {/* Chatbot Widget */}
      {chatbotOpen && (
        <div className="fixed bottom-24 right-8 z-50">
          <ChatbotWidget onClose={() => setChatbotOpen(false)} />
        </div>
      )}
      
      {/* Chatbot Toggle Button */}
      <button
        onClick={() => setChatbotOpen(!chatbotOpen)}
        className="fixed bottom-8 right-8 bg-[#EAB308] text-white p-4 rounded-full shadow-lg hover:bg-[#D4A017] transition-colors z-50"
      >
        {chatbotOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
