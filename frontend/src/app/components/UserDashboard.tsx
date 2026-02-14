import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { getUserPets, getUserBookings, getActivityLogs } from '../../services/api';
import { LogOut, MessageCircle, X } from 'lucide-react';
import ChatbotWidget from './ChatbotWidget';
import PetProfileForm from './PetProfileForm';
import PetListingPage from './PetListingPage';
import BookingPage from './BookingPage';
import ManageBookings from './ManageBookings';
import BookingHistory from './BookingHistory';
import ActivityLogViewer from './ActivityLogViewer';

interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  fullName: string;
}

interface UserDashboardProps {
  user: User;
  onLogout: () => void;
  onNavigate?: (page: string) => void;
  dashboardTarget?: 'booking' | 'add-pet' | 'activity-log' | null;
  onClearDashboardTarget?: () => void;
}

interface Pet {
  pet_id: number;
  name: string;
  breed: string;
  photo?: string;
  age?: number;
  weight?: number;
}

interface Booking {
  booking_id: number;
  service_type: string;
  start_date: string;
  end_date: string;
  status: string;
  pet?: { name: string };
}

interface Activity {
  activity_id: number;
  pet_id?: number;
  activity_type?: string;
  detail?: string;
  description?: string;
  timestamp: string;
  pet?: { name: string };
}

export default function UserDashboard({
  user,
  onLogout,
  onNavigate,
  dashboardTarget,
  onClearDashboardTarget,
}: UserDashboardProps) {
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [showPetForm, setShowPetForm] = useState(false);
  const [showPetListing, setShowPetListing] = useState(false);
  const [showBookingPage, setShowBookingPage] = useState(false);
  const [showManageBookings, setShowManageBookings] = useState(false);
  const [showBookingHistory, setShowBookingHistory] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<number | undefined>(undefined);

  useEffect(() => {
    fetchPets();
    fetchBookings();
    fetchActivities();
  }, []);

  useEffect(() => {
    if (!dashboardTarget) {
      return;
    }

    setShowPetForm(false);
    setShowPetListing(false);
    setShowBookingPage(false);
    setShowManageBookings(false);
    setShowBookingHistory(false);
    setShowActivityLog(false);

    if (dashboardTarget === 'booking') {
      setShowBookingPage(true);
    }

    if (dashboardTarget === 'add-pet') {
      setSelectedPetId(undefined);
      setShowPetForm(true);
    }

    if (dashboardTarget === 'activity-log') {
      setShowActivityLog(true);
    }

    if (onClearDashboardTarget) {
      onClearDashboardTarget();
    }
  }, [dashboardTarget, onClearDashboardTarget]);

  const fetchPets = async () => {
    try {
      setLoading(true);
      const response = await getUserPets();
      console.log('Fetched pets response:', response);
      
      // Handle different response structures
      if (response.success && response.pets) {
        setPets(response.pets);
      } else if (response.data) {
        setPets(response.data);
      } else if (Array.isArray(response)) {
        setPets(response);
      } else {
        setPets([]);
      }
    } catch (error) {
      console.error('Error fetching pets:', error);
      setPets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setBookingsLoading(true);
      const response = await getUserBookings({ upcoming: true });
      const bookingData = response.data || response.bookings || response || [];
      setBookings(Array.isArray(bookingData) ? bookingData : []);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
    } finally {
      setBookingsLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      setActivitiesLoading(true);
      const response = await getActivityLogs();
      const activitiesData = response.data || response.activities || response || [];
      
      if (Array.isArray(activitiesData)) {
        // Sort activities by timestamp (newest first) and take top 5
        const sortedActivities = activitiesData
          .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 5);
        setActivities(sortedActivities);
      }
    } catch (error: any) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityDate = new Date(timestamp);
    const diffInMs = now.getTime() - activityDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    if (diffInHours < 24) return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    
    return activityDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const firstName = user.fullName.split(' ')[0];
  const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23FFE4A3' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='60' fill='%23FA9884'%3E🐾%3C/text%3E%3C/svg%3E";
const handleAddPet = () => {
    setSelectedPetId(undefined);
    setShowPetForm(true);
  };

  const handleEditPet = (petId: number) => {
    setSelectedPetId(petId);
    setShowPetForm(true);
  };

  const handleViewAllPets = () => {
    setShowPetListing(true);
  };

  const handleBackToDashboard = () => {
    setShowPetForm(false);
    setShowPetListing(false);
    setShowBookingPage(false);
    setShowManageBookings(false);
    setShowBookingHistory(false);
    setShowActivityLog(false);
    setSelectedPetId(undefined);
    fetchPets(); // Refresh pets list
    fetchBookings(); // Refresh bookings list
    fetchActivities(); // Refresh activity logs
  };

  const handleBookService = () => {
    setShowActivityLog(false);
    setShowBookingPage(true);
  };

  const handleManageBookings = () => {
    setShowManageBookings(true);
  };

  const handleBookingHistory = () => {
    setShowBookingHistory(true);
  };

  const handleViewActivityLog = () => {
    setShowBookingPage(false);
    setShowManageBookings(false);
    setShowBookingHistory(false);
    setShowActivityLog(true);
  };

  if (showBookingPage) {
    return (
      <BookingPage
        onBack={handleBackToDashboard}
        onLogout={onLogout}
        userFullName={user.fullName}
        onActivityLog={handleViewActivityLog}
        onNavigate={onNavigate}
      />
    );
  }

  if (showManageBookings) {
    return <ManageBookings onBack={handleBackToDashboard} />;
  }

  if (showBookingHistory) {
    return <BookingHistory onBack={handleBackToDashboard} />;
  }

  if (showActivityLog) {
    return (
      <ActivityLogViewer
        onBack={handleBackToDashboard}
        onLogout={onLogout}
        userFullName={user.fullName}
        onBook={handleBookService}
        onNavigate={onNavigate}
      />
    );
  }

  if (showPetListing) {
    return <PetListingPage onBack={handleBackToDashboard} onNavigate={onNavigate} />;
  }

  if (showPetForm) {
    return (
      <PetProfileForm 
        onBack={handleBackToDashboard}
        onSuccess={handleBackToDashboard}
        petId={selectedPetId}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F5]">
      {/* Navigation Header */}
      <nav className="bg-white border-b px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐾</span>
            </div>
            <div className="flex items-center gap-6">
              <button className="px-4 py-2 rounded-full bg-[#FFE4A3] font-medium">Home</button>
              <button 
                onClick={handleBookService}
                className="px-4 py-2 hover:bg-gray-100 rounded-full"
              >
                Booking
              </button>
              <button
                onClick={handleViewActivityLog}
                className="px-4 py-2 hover:bg-gray-100 rounded-full"
              >
                Activity Log
              </button>
              <button
                onClick={() => onNavigate?.('about')}
                className="px-4 py-2 hover:bg-gray-100 rounded-full"
              >
                About
              </button>
              <button
                onClick={() => onNavigate?.('contact')}
                className="px-4 py-2 hover:bg-gray-100 rounded-full"
              >
                Contact
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-sm font-medium">
                {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            </div>
            <button className="px-4 py-2 bg-[#FF6B6B] text-white rounded-full text-sm flex items-center gap-2">
              <span>📞</span> Emergency
            </button>
          </div>

          <div className="p-4 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="w-full px-4 py-2.5 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
          >
            Logout
          </button>
        </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Welcome Header */}
        <h1 className="text-4xl font-bold mb-8">Welcome {firstName}!</h1>

        {/* Top Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Welcome Card */}
          <div className="bg-gradient-to-br from-[#FFE4A3] via-[#FFF9F5] to-[#FFE4A3] rounded-2xl p-8 shadow-md">
            <h2 className="text-3xl font-bold text-[#FA9884] mb-3">Welcome, {firstName}!</h2>
            <p className="text-gray-600 mb-6">Manage your pets and book services with ease.</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleBookService}
                className="bg-[#FA9884] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#E8876F] transition"
              >
                Book a New Service
              </button>
              <button 
                onClick={handleAddPet}
                className="bg-white text-[#FA9884] border-2 border-[#FA9884] px-6 py-3 rounded-lg font-semibold hover:bg-[#FFF9F5] transition"
              >
                + Add a New Pet
              </button>
            </div>
          </div>

          {/* My Pets Card */}
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">My Pets</h3>
              {pets.length > 0 && (
                <button 
                  onClick={handleViewAllPets}
                  className="text-[#FA9884] text-sm font-semibold hover:underline"
                >
                  View
                </button>
              )}
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FA9884]"></div>
              </div>
            ) : pets.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">You haven't added any pets yet.</p>
                <button 
                  onClick={handleAddPet}
                  className="bg-[#FA9884] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-[#E8876F] transition"
                >
                  Add Your First Pet
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {pets.slice(0, 4).map((pet) => (
                  <div 
                    key={pet.pet_id} 
                    className="bg-white border-2 border-transparent hover:border-[#FA9884] rounded-xl overflow-hidden cursor-pointer transition"
                    onClick={() => handleEditPet(pet.pet_id)}
                  >
                    <div className="h-36 bg-gray-100">
                      <img 
                        src={pet.photo || placeholderImage} 
                        alt={pet.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = placeholderImage;
                        }}
                      />
                    </div>
                    <div className="p-3 text-center">
                      <h4 className="font-semibold">{pet.name}</h4>
                      <p className="text-sm text-gray-600">{pet.breed}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Bookings */}
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Upcoming Bookings</h3>
              {bookings.length > 0 && (
                <button 
                  onClick={handleManageBookings}
                  className="text-[#FA9884] text-sm font-semibold hover:underline"
                >
                  Manage
                </button>
              )}
            </div>
            {bookingsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FA9884]"></div>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No upcoming bookings.</p>
                <button 
                  onClick={handleBookService}
                  className="bg-[#FA9884] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-[#E8876F] transition"
                >
                  Book a Service
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  {bookings.slice(0, 3).map((booking) => (
                    <div key={booking.booking_id} className="bg-[#FFF9F5] rounded-xl p-4 flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold">{booking.service_type}</h4>
                        <p className="text-sm text-gray-600">{booking.pet?.name}</p>
                        <p className="text-sm text-gray-600">{formatDate(booking.start_date)}</p>
                      </div>
                      <div className={`px-4 py-1 rounded-full text-sm font-semibold ${
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleBookService}
                    className="flex-1 bg-[#FFE4A3] text-gray-800 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#FFD97D] transition"
                  >
                    Book New
                  </button>
                  <button
                    onClick={handleBookingHistory}
                    className="flex-1 bg-white border-2 border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
                  >
                    History
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Recent Activity</h3>
              <button 
                onClick={handleViewActivityLog}
                className="text-[#FA9884] text-sm font-semibold hover:underline"
              >
                View Daily log
              </button>
            </div>
            {activitiesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FA9884]"></div>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No recent activity.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => {
                  const petName = activity.pet?.name || 'Pet';
                  const activityType = activity.activity_type 
                    ? activity.activity_type.charAt(0).toUpperCase() + activity.activity_type.slice(1)
                    : 'Activity';
                  const description = activity.description || activity.detail || '';
                  
                  return (
                    <div key={activity.activity_id} className="border-b pb-3 last:border-b-0">
                      <p className="text-gray-800 font-medium">
                        {petName} · <span className="text-[#FA9884]">{activityType}</span>
                      </p>
                      {description && <p className="text-sm text-gray-700 mt-1">{description}</p>}
                      <p className="text-sm text-gray-500 mt-1">{getTimeAgo(activity.timestamp)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12 py-6">
        <div className="max-w-7xl mx-auto px-8 text-center text-gray-600">
          <p>2025 PawWell. All rights reserved.</p>
        </div>
      </footer>

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
