import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { getUserPets, getUserBookings, getActivityLogs } from '../../services/api';
import { LogOut, MessageCircle, X, Settings, User as UserIcon } from 'lucide-react';
import ChatbotWidget from './ChatbotWidget';
import PetProfileForm from './PetProfileForm';
import PetListingPage from './PetListingPage';
import BookingPage from './BookingPage';
import ManageBookings from './ManageBookings';
import BookingHistory from './BookingHistory';
import ActivityLogViewer from './ActivityLogViewer';
import WellnessTimeline from './WellnessTimeline';
import AboutPage from './AboutPage';
import ContactPage from './ContactPage';
import NotificationBell from '../../components/NotificationBell';
import ReviewPage from './ReviewPage';
import SettingsPage from './SettingsPage';

interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  fullName: string;
  profilePicture?: string;
}

interface UserDashboardProps {
  user: User;
  onLogout: () => void;
  onNavigate?: (page: string) => void;
  dashboardTarget?: 'booking' | 'add-pet' | 'activity-log' | 'wellness-timeline' | 'settings' | null;
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
  booking_status?: 'pending' | 'approved' | 'confirmed' | 'completed' | 'rejected' | 'cancelled';
  payment_status?: 'unpaid' | 'pending_payment' | 'paid' | 'failed';
  price?: number;
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
  const [showWellnessTimeline, setShowWellnessTimeline] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showReviewPage, setShowReviewPage] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<number | undefined>(undefined);
  const [selectedBookingId, setSelectedBookingId] = useState<number | undefined>(undefined);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPets();
    fetchBookings();
    fetchActivities();
    
    // Check if we just completed a payment - if so, refetch more aggressively
    const justPaidBookingId = sessionStorage.getItem('just_paid_booking_id');
    if (justPaidBookingId) {
      console.log('💳 Payment just completed! Aggressively refetching bookings...');
      sessionStorage.removeItem('just_paid_booking_id');
      // Refetch immediately and multiple times to ensure we get latest data
      setTimeout(() => fetchBookings(), 300);
      setTimeout(() => fetchBookings(), 800);
      setTimeout(() => fetchBookings(), 1500);
    }
    
    // Only refresh when page comes into focus (to avoid flickering)
    const handleFocus = () => {
      console.log('👁️ Page focused - refetching bookings');
      fetchBookings();
    };
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

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
    setShowWellnessTimeline(false);
    setShowAbout(false);
    setShowContact(false);
    setShowReviewPage(false);
    setShowSettings(false);

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

    if (dashboardTarget === 'wellness-timeline') {
      setShowWellnessTimeline(true);
    }

    if (dashboardTarget === 'settings') {
      setShowSettings(true);
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
      console.log('🔄 Fetching bookings...');
      const response = await getUserBookings({ upcoming: true });
      const bookingData = response.data || response.bookings || response || [];
      
      console.log('📚 Bookings fetched:', {
        count: Array.isArray(bookingData) ? bookingData.length : 0,
        statuses: Array.isArray(bookingData) ? bookingData.map((b: any) => ({
          id: b.booking_id,
          booking_status: b.booking_status,
          payment_status: b.payment_status
        })) : []
      });
      
      setBookings(Array.isArray(bookingData) ? bookingData : []);
    } catch (error: any) {
      console.error('❌ Error fetching bookings:', error);
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
    setShowWellnessTimeline(false);
    setShowAbout(false);
    setShowContact(false);
    setShowReviewPage(false);
    setShowSettings(false);
    setSelectedPetId(undefined);
    setSelectedBookingId(undefined);
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
    setShowWellnessTimeline(false);
  };

  const handleViewWellnessTimeline = () => {
    setShowBookingPage(false);
    setShowManageBookings(false);
    setShowBookingHistory(false);
    setShowActivityLog(false);
    setShowWellnessTimeline(true);
    setShowAbout(false);
    setShowContact(false);
  };

  const handleShowAbout = () => {
    setShowBookingPage(false);
    setShowManageBookings(false);
    setShowBookingHistory(false);
    setShowActivityLog(false);
    setShowWellnessTimeline(false);
    setShowAbout(true);
    setShowContact(false);
  };

  const handleShowContact = () => {
    setShowBookingPage(false);
    setShowManageBookings(false);
    setShowBookingHistory(false);
    setShowActivityLog(false);
    setShowWellnessTimeline(false);
    setShowAbout(false);
    setShowContact(true);
  };

  const handleShowSettings = () => {
    setShowBookingPage(false);
    setShowManageBookings(false);
    setShowBookingHistory(false);
    setShowActivityLog(false);
    setShowWellnessTimeline(false);
    setShowAbout(false);
    setShowContact(false);
    setShowReviewPage(false);
    setShowPetForm(false);
    setShowPetListing(false);
    setShowSettings(true);
  };

  const handleLeaveReview = (bookingId: number) => {
    setSelectedBookingId(bookingId);
    setShowBookingPage(false);
    setShowManageBookings(false);
    setShowBookingHistory(false);
    setShowActivityLog(false);
    setShowWellnessTimeline(false);
    setShowAbout(false);
    setShowContact(false);
    setShowReviewPage(true);
  };

  const handleBackToBookingHistory = () => {
    setShowReviewPage(false);
    setShowBookingHistory(true);
    setSelectedBookingId(undefined);
  };

  const renderContent = () => {
    if (showBookingPage) {
      return (
        <BookingPage
          onBack={handleBackToDashboard}
          onLogout={onLogout}
          userFullName={user.fullName}
          onActivityLog={handleViewActivityLog}
          onNavigate={onNavigate}
          onSettings={handleShowSettings}
        />
      );
    }

    if (showManageBookings) {
      return <ManageBookings onBack={handleBackToDashboard} />;
    }

    if (showBookingHistory) {
      return <BookingHistory onBack={handleBackToDashboard} onLeaveReview={handleLeaveReview} />;
    }

    if (showReviewPage) {
      return <ReviewPage onBackToBookingHistory={handleBackToBookingHistory} onBackToDashboard={handleBackToDashboard} bookingId={selectedBookingId} />;
    }

    if (showActivityLog) {
      return (
        <ActivityLogViewer
          onBack={handleBackToDashboard}
          onLogout={onLogout}
          userFullName={user.fullName}
          onBook={handleBookService}
          onNavigate={onNavigate}
          onSettings={handleShowSettings}
        />
      );
    }

    if (showWellnessTimeline) {
      return (
        <WellnessTimeline 
          onBack={() => setShowWellnessTimeline(false)}
          onLogout={onLogout}
          onSettings={handleShowSettings}
        />
      );
    }

    if (showAbout) {
      return (
        <AboutPage 
          onBack={handleBackToDashboard}
          onBook={handleBookService}
          onActivityLog={handleViewActivityLog}
          onTimeline={handleViewWellnessTimeline}
          onContact={handleShowContact}
          onEmergency={() => onNavigate?.('emergency')}
          onSettings={handleShowSettings}
          onNavigate={onNavigate}
          onLogout={onLogout}
          user={user}
          userFullName={user.fullName}
          hideNavbar={true}
        />
      );
    }

    if (showContact) {
      return (
        <ContactPage 
          onBack={handleBackToDashboard}
          onBook={handleBookService}
          onActivityLog={handleViewActivityLog}
          onTimeline={handleViewWellnessTimeline}
          onAbout={handleShowAbout}
          onEmergency={() => onNavigate?.('emergency')}
          onSettings={handleShowSettings}
          onNavigate={onNavigate}
          onLogout={onLogout}
          user={user}
          userFullName={user.fullName}
          hideNavbar={true}
        />
      );
    }

    if (showSettings) {
      return (
        <SettingsPage
          onBack={handleBackToDashboard}
          onLogout={onLogout}
          userFullName={user.fullName}
          onNavigate={(page) => {
            if (page === 'user-dashboard') {
              handleBackToDashboard();
            } else if (page === 'profile') {
              onNavigate?.('profile');
            } else if (page === 'about') {
              setShowSettings(false);
              handleShowAbout();
            } else if (page === 'contact') {
              setShowSettings(false);
              handleShowContact();
            } else if (page === 'emergency') {
              onNavigate?.('emergency');
            }
          }}
          onDashboardTarget={(target) => {
            setShowSettings(false);
            if (target === 'booking') {
              handleBookService();
            } else if (target === 'activity-log') {
              handleViewActivityLog();
            } else if (target === 'wellness-timeline') {
              handleViewWellnessTimeline();
            }
          }}
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
      <>
        {/* Welcome Header */}
        <h1 className="text-4xl font-bold mb-8">Welcome {firstName}!</h1>

        {/* Top Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Welcome Card */}
          <div className="bg-gradient-to-br from-[#FFE4A3] via-[#FFF9F5] to-[#FFE4A3] dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded-2xl p-8 shadow-md">
            <h2 className="text-3xl font-bold text-[#FA9884] dark:text-yellow-400 mb-3">Welcome, {firstName}!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Manage your pets and book services with ease.</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleBookService}
                className="bg-[#FA9884] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#E8876F] transition"
              >
                Book a New Service
              </button>
              <button 
                onClick={handleAddPet}
                className="bg-white dark:bg-gray-700 text-[#FA9884] dark:text-yellow-400 border-2 border-[#FA9884] dark:border-yellow-400 px-6 py-3 rounded-lg font-semibold hover:bg-[#FFF9F5] dark:hover:bg-gray-600 transition"
              >
                + Add a New Pet
              </button>
            </div>
          </div>

          {/* My Pets Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold dark:text-gray-100">My Pets</h3>
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
                <p className="text-gray-500 dark:text-gray-400 mb-4">You haven't added any pets yet.</p>
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
                    className="bg-white dark:bg-gray-700 border-2 border-transparent hover:border-[#FA9884] dark:hover:border-yellow-400 rounded-xl overflow-hidden cursor-pointer transition"
                    onClick={() => handleEditPet(pet.pet_id)}
                  >
                    <div className="h-36 bg-gray-100 dark:bg-gray-600">
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
                      <h4 className="font-semibold dark:text-gray-100">{pet.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{pet.breed}</p>
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold dark:text-gray-100">Upcoming Bookings</h3>
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
                <p className="text-gray-500 dark:text-gray-400 mb-4">No upcoming bookings.</p>
                <button 
                  onClick={handleBookService}
                  className="text-[#FA9884] dark:text-yellow-400 font-medium hover:underline"
                >
                  Book now
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.slice(0, 3).map((booking) => {
                  const bookingStatus = booking.booking_status || booking.status;
                  const paymentStatus = booking.payment_status || 'unpaid';
                  const showPayNow = bookingStatus === 'approved' && ['pending_payment', 'failed'].includes(paymentStatus);
                  
                  return (
                    <div 
                      key={booking.booking_id} 
                      onClick={() => {
                        setSelectedBookingId(booking.booking_id);
                        setShowManageBookings(true);
                      }}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-[#FFE4A3] dark:bg-yellow-600 rounded-full flex items-center justify-center">
                          <span className="text-xl">📅</span>
                        </div>
                        <div>
                          <h4 className="font-medium dark:text-gray-100">{booking.service_type}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(booking.start_date)}</p>
                          {showPayNow && <p className="text-xs text-[#FA9884] font-semibold">Payment pending →</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {showPayNow && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-medium">
                            Pay Now
                          </span>
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          bookingStatus === 'confirmed' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                          bookingStatus === 'approved' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' :
                          bookingStatus === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>
                          {bookingStatus}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button 
                onClick={handleBookingHistory}
                className="w-full text-center text-gray-500 dark:text-gray-400 text-sm hover:text-[#FA9884] dark:hover:text-yellow-400"
              >
                View Booking History
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold dark:text-gray-100">Recent Activity</h3>
              <button 
                onClick={handleViewActivityLog}
                className="text-[#FA9884] text-sm font-semibold hover:underline"
              >
                View All
              </button>
            </div>
            
            {activitiesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FA9884]"></div>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No recent activity logged.
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.activity_id} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center shrink-0 mt-1">
                      {activity.activity_type === 'feeding' ? '🥣' : 
                       activity.activity_type === 'walk' ? '🐕' : 
                       activity.activity_type === 'medication' ? '💊' : '📝'}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm dark:text-gray-100">
                        {activity.pet?.name} - {activity.activity_type}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{getTimeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#FFF9F5] dark:bg-gray-900">
      {/* Navigation Header */}
      <nav className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button 
              onClick={handleBackToDashboard}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
              title="Go to Dashboard"
            >
              <span className="text-2xl">🐾</span>
            </button>
            <div className="flex items-center gap-6">
              <button 
                onClick={handleBackToDashboard}
                className={`px-4 py-2 rounded-full ${!showWellnessTimeline && !showBookingPage && !showManageBookings && !showBookingHistory && !showActivityLog && !showAbout && !showContact && !showReviewPage && !showSettings ? 'bg-[#FFE4A3] dark:bg-yellow-600 dark:text-white font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200'}`}
              >
                Home
              </button>
              <button 
                onClick={handleBookService}
                className={`px-4 py-2 rounded-full ${(showBookingPage || showManageBookings || showBookingHistory) ? 'bg-[#FFE4A3] dark:bg-yellow-600 dark:text-white font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200'}`}
              >
                Booking
              </button>
              <button
                onClick={handleViewActivityLog}
                className={`px-4 py-2 rounded-full ${showActivityLog ? 'bg-[#FFE4A3] dark:bg-yellow-600 dark:text-white font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200'}`}
              >
                Activity Log
              </button>
              <button
                onClick={handleViewWellnessTimeline}
                className={`px-4 py-2 rounded-full ${showWellnessTimeline ? 'bg-[#FFE4A3] dark:bg-yellow-600 dark:text-white font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200'}`}
              >
                Timeline
              </button>
              <button
                onClick={handleShowAbout}
                className={`px-4 py-2 rounded-full ${showAbout ? 'bg-[#FFE4A3] dark:bg-yellow-600 dark:text-white font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200'}`}
              >
                About
              </button>
              <button
                onClick={handleShowContact}
                className={`px-4 py-2 rounded-full ${showContact ? 'bg-[#FFE4A3] dark:bg-yellow-600 dark:text-white font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200'}`}
              >
                Contact
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell userId={parseInt(user.id)} />
            <button
              onClick={() => onNavigate?.('emergency')}
              className="px-4 py-2 bg-[#FF6B6B] dark:bg-red-700 text-white rounded-full text-sm flex items-center gap-2"
            >
              <span>📞</span> Emergency
            </button>
            {/* Profile Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="w-10 h-10 rounded-full hover:shadow-lg transition-all cursor-pointer border-2 border-gray-200 dark:border-gray-600 overflow-hidden"
                title="Profile Menu"
              >
                {user.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#FA9884] to-[#FFE4A3] flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                )}
              </button>

              {/* Dropdown Menu */}
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{user.fullName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      onNavigate?.('profile');
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <UserIcon size={18} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium">Edit Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      handleShowSettings();
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <Settings size={18} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium">Settings</span>
                  </button>
                  <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/50 flex items-center gap-3 text-red-600 dark:text-red-400 transition-colors"
                  >
                    <LogOut size={18} className="text-red-500 dark:text-red-400" />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-8">
        {renderContent()}
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
