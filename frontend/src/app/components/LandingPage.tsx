import heroImage from '../../assets/hero-dogs.png';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { MessageCircle, X } from 'lucide-react';
import { useState } from 'react';
import ChatbotWidget from './ChatbotWidget';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToSignup: () => void;
}

export default function LandingPage({ onNavigateToLogin, onNavigateToSignup }: LandingPageProps) {
  const [chatbotOpen, setChatbotOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FFF8E8]">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-4 bg-[#EAB308]">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐾</span>
          <span className="text-xl">PawWell</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#home" className="hover:underline">Home</a>
          <a href="#booking" className="hover:underline">Booking</a>
          <a href="#activity" className="hover:underline">Activity Log</a>
          <a href="#about" className="hover:underline">About</a>
          <a href="#contact" className="hover:underline">Contact</a>
          <Button onClick={onNavigateToLogin} variant="ghost" className="bg-white hover:bg-gray-50">
            Login
          </Button>
          <Button onClick={onNavigateToSignup} className="bg-[#D4A017] hover:bg-[#C49016]">
            Sign Up
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-8 py-16 bg-[#EAB308] overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="text-center lg:text-left z-10">
            <h1 className="text-5xl mb-4">Care they Deserve</h1>
            <p className="text-xl mb-6">
              Because every pet deserves thoughtful care, timely attention, and a happier routine.
            </p>
            <Button 
              onClick={onNavigateToSignup}
              className="bg-white text-black hover:bg-gray-100 px-8 py-6 text-lg"
            >
              Booking
            </Button>
          </div>
          <div className="flex justify-center">
            <img 
              src={heroImage} 
              alt="Happy dogs" 
              className="max-w-md w-full object-contain"
            />
          </div>
        </div>
        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="#FFF8E8"/>
          </svg>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl text-center mb-12">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-[#F4D878] p-8 border-0 h-64 flex flex-col items-center justify-center">
              <h3 className="text-2xl mb-2">Day Care</h3>
              <p className="text-center text-gray-700">Daily supervision and activities for your pets</p>
            </Card>
            <Card className="bg-[#F4D878] p-8 border-0 h-64 flex flex-col items-center justify-center">
              <h3 className="text-2xl mb-2">Cat Care</h3>
              <p className="text-center text-gray-700">Specialized care for your feline friends</p>
            </Card>
            <Card className="bg-[#F4D878] p-8 border-0 h-64 flex flex-col items-center justify-center">
              <h3 className="text-2xl mb-2">Pet Grooming</h3>
              <p className="text-center text-gray-700">Professional grooming services</p>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="px-8 py-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl text-center mb-8">About Us</h2>
          <Card className="bg-[#F4D878] p-12 border-0 min-h-[300px] flex items-center justify-center">
            <div className="text-center max-w-3xl">
              <p className="text-lg mb-4">
                PawWell Care Center is a comprehensive digital management system for professional pet boarding. 
                We serve as a bridge between pet owners and care providers, ensuring your pets receive the best care while you're away.
              </p>
              <p className="text-lg">
                Our facility offers safe, loving environments that eliminate the need to rely on others, giving you peace of mind during travel or work.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-8 py-16 bg-[#FFF8E8]">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl mb-4">Ready to Give Your Pet the Best care?</h2>
          <p className="text-xl mb-2">Trust Transparency and Comfort</p>
          <p className="text-gray-600 mb-6">From planning to daily care, everything is handled with reliability and love.</p>
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={onNavigateToLogin}
              className="bg-[#EAB308] hover:bg-[#D4A017] px-8"
            >
              Login
            </Button>
            <Button 
              onClick={onNavigateToSignup}
              className="bg-[#EAB308] hover:bg-[#D4A017] px-8"
            >
              Sign Up Now
            </Button>
          </div>
        </div>
      </section>

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
