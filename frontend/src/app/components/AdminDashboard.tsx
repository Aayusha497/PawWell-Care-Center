import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import { Bell, Settings, User as UserIcon, LogOut, BarChart3 } from 'lucide-react';
import {
  createActivityLog,
  getPendingBookings,
  approveBooking,
  rejectBooking,
  getUserPets,
  getAdminNotificationSummary,
  getAdminContactMessages,
  markAdminContactMessagesRead,
  markAdminContactMessageRead,
  getAdminEmergencyRequests,
  updateEmergencyStatus,
  getDashboardAnalytics
} from '../../services/api';
import { toast } from 'sonner';
import ActivityLogsManagement from './ActivityLogsManagement';
import BookingManagement from './BookingManagement';
import ReviewManagement from './ReviewManagement';
import SettingsPage from './SettingsPage';
import Analytics from './Analytics';

interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  fullName: string;
  profilePicture?: string;
}

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
  onNavigate?: (page: 'profile' | 'admin-dashboard') => void;
}

interface Booking {
  id: string;
  booking_id: number;
  petName: string;
  ownerName: string;
  service_type: string;
  start_date: string;
  status: string;
}

interface Pet {
  pet_id: number;
  name: string;
  owner?: {
    first_name?: string;
    last_name?: string;
  };
}

interface ContactMessage {
  contact_id: number;
  full_name: string;
  email: string;
  phone_number?: string;
  location?: string;
  subject: string;
  message: string;
  status: 'unread' | 'read';
  created_at: string;
}

interface EmergencyRequest {
  emergency_id: number;
  emergency_type: string;
  contact_info: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'cancelled';
  description?: string | null;
  created_at: string;
  pets?: { 
    name?: string;
    photo?: string;
  };
  users?: { first_name?: string; last_name?: string; email?: string };
}

export default function AdminDashboard({ user, onLogout, onNavigate }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState(() => {
    const saved = sessionStorage.getItem('adminActiveTab');
    return saved || 'dashboard';
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    activeBookings: 0,
    totalPets: 0,
    totalBookings: 0,
    totalRevenue: 0,
    revenueThisMonth: 0,
    pendingApprovals: 0,
    urgentItems: 0
  });
  const [selectedPet, setSelectedPet] = useState('');
  const [activityType, setActivityType] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [notifyOwner, setNotifyOwner] = useState(false);
  const [submittingLog, setSubmittingLog] = useState(false);
  const [viewingActivityLogs, setViewingActivityLogs] = useState(() => {
    return sessionStorage.getItem('adminViewingActivityLogs') === 'true';
  });
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationSummary, setNotificationSummary] = useState({
    contactMessages: 0,
    pendingBookings: 0,
    emergencyRequests: 0,
    pendingReviews: 0
  });
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(() => {
    return sessionStorage.getItem('adminShowSettings') === 'true';
  });
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [emergencyRequests, setEmergencyRequests] = useState<EmergencyRequest[]>([]);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [markingMessageId, setMarkingMessageId] = useState<number | null>(null);

  const activityTypes = [
    { value: 'feeding', label: 'Feeding' },
    { value: 'walk', label: 'Walk' },
    { value: 'playtime', label: 'Playtime' },
    { value: 'medication', label: 'Medication' },
    { value: 'grooming', label: 'Grooming' },
    { value: 'training', label: 'Training' },
    { value: 'veterinary', label: 'Veterinary Visit' },
    { value: 'other', label: 'Other Activity' },
  ];

  useEffect(() => {
    fetchPendingBookings();
    fetchPets();
    fetchDashboardStats();
    fetchNotificationSummary();
    const intervalId = window.setInterval(() => {
      fetchNotificationSummary();
    }, 45000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'contact-messages') {
      fetchContactMessages();
    }

    if (activeTab === 'emergency-requests') {
      fetchEmergencyRequests();
    }
  }, [activeTab]);

  // Close profile dropdown when clicking outside
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

  // Persist admin dashboard state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('adminActiveTab', activeTab);
    sessionStorage.setItem('adminViewingActivityLogs', viewingActivityLogs.toString());
    sessionStorage.setItem('adminShowSettings', showSettings.toString());
  }, [activeTab, viewingActivityLogs, showSettings]);

  const fetchPendingBookings = async () => {
    try {
      setLoading(true);
      const response = await getPendingBookings();
      const bookingData = response.data || [];
      
      const transformed = bookingData.map((b: any) => ({
        id: b.booking_id.toString(),
        booking_id: b.booking_id,
        petName: b.pet?.name || 'Unknown',
        ownerName: b.pet?.owner ? `${b.pet.owner.first_name} ${b.pet.owner.last_name}` : 'Unknown',
        service_type: b.service_type,
        start_date: b.start_date,
        status: b.status
      }));
      
      setBookings(transformed);
    } catch (error: any) {
      console.error('Error fetching pending bookings:', error);
      toast.error('Failed to load pending bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchPets = async () => {
    try {
      const response = await getUserPets();
      const petData = response.pets || response.data || [];
      setPets(Array.isArray(petData) ? petData : []);
    } catch (error: any) {
      console.error('Error fetching pets:', error);
      setPets([]);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await getDashboardAnalytics();
      const topCards = response.data?.topCards || {};
      setDashboardStats({
        activeBookings: topCards.activeBookings || 0,
        totalPets: topCards.totalPets || 0,
        totalBookings: topCards.totalBookings || 0,
        totalRevenue: topCards.totalRevenue || 0,
        revenueThisMonth: topCards.revenueThisMonth || 0,
        pendingApprovals: topCards.pendingApprovals || 0,
        urgentItems: topCards.urgentItems || 0
      });
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const fetchNotificationSummary = async () => {
    try {
      setNotificationLoading(true);
      const response = await getAdminNotificationSummary();
      const data = response.data || {};
      setNotificationSummary({
        contactMessages: data.contactMessages || 0,
        pendingBookings: data.pendingBookings || 0,
        emergencyRequests: data.emergencyRequests || 0,
        pendingReviews: data.pendingReviews || 0
      });
    } catch (error: any) {
      console.error('Error fetching notification summary:', error);
    } finally {
      setNotificationLoading(false);
    }
  };

  const fetchContactMessages = async () => {
    try {
      setContactLoading(true);
      const response = await getAdminContactMessages();
      setContactMessages(response.data || []);
    } catch (error: any) {
      console.error('Error fetching contact messages:', error);
      toast.error('Failed to load contact messages');
    } finally {
      setContactLoading(false);
    }
  };

  const fetchEmergencyRequests = async () => {
    try {
      setEmergencyLoading(true);
      const response = await getAdminEmergencyRequests();
      setEmergencyRequests(response.data || []);
    } catch (error: any) {
      console.error('Error fetching emergency requests:', error);
      toast.error('Failed to load emergency requests');
    } finally {
      setEmergencyLoading(false);
    }
  };

  const handleMarkAllContactRead = async () => {
    try {
      await markAdminContactMessagesRead();
      toast.success('Marked all contact messages as read.');
      fetchContactMessages();
      fetchNotificationSummary();
    } catch (error: any) {
      console.error('Error marking contact messages read:', error);
      toast.error(error.message || 'Failed to update contact messages');
    }
  };

  const handleMarkMessageRead = async (messageId: number) => {
    try {
      setMarkingMessageId(messageId);
      await markAdminContactMessageRead(messageId);
      setContactMessages((prev) =>
        prev.map((message) =>
          message.contact_id === messageId
            ? { ...message, status: 'read' }
            : message
        )
      );
      setSelectedMessage((prev) =>
        prev && prev.contact_id === messageId
          ? { ...prev, status: 'read' }
          : prev
      );
      fetchNotificationSummary();
    } catch (error: any) {
      console.error('Error marking contact message read:', error);
      toast.error(error.message || 'Failed to update contact message');
    } finally {
      setMarkingMessageId(null);
    }
  };

  const handleOpenMessage = (message: ContactMessage) => {
    setSelectedMessage(message);
    if (message.status === 'unread') {
      handleMarkMessageRead(message.contact_id);
    }
  };

  const handleApproveBooking = async (booking_id: number) => {
    try {
      setApproving(booking_id);
      await approveBooking(booking_id);
      toast.success('Booking approved successfully');
      fetchPendingBookings();
      fetchNotificationSummary();
    } catch (error: any) {
      console.error('Error approving booking:', error);
      toast.error(error.message || 'Failed to approve booking');
    } finally {
      setApproving(null);
    }
  };

  const handleRejectBooking = async (booking_id: number) => {
    if (!window.confirm('Are you sure you want to reject this booking?')) {
      return;
    }
    
    try {
      setRejecting(booking_id);
      await rejectBooking(booking_id);
      toast.success('Booking rejected successfully');
      fetchPendingBookings();
      fetchNotificationSummary();
    } catch (error: any) {
      console.error('Error rejecting booking:', error);
      toast.error(error.message || 'Failed to reject booking');
    } finally {
      setRejecting(null);
    }
  };

  const handleUpdateEmergencyStatus = async (requestId: number, status: string) => {
    try {
      await updateEmergencyStatus(requestId, status);
      toast.success('Emergency request updated.');
      fetchEmergencyRequests();
      fetchNotificationSummary();
    } catch (error: any) {
      console.error('Error updating emergency request:', error);
      toast.error(error.message || 'Failed to update emergency request');
    }
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setPhoto(file);
  };

  const handleCreateActivityLog = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedPet || !activityType || !description.trim()) {
      toast.error('Please select a pet, activity type, and add a description.');
      return;
    }

    if (description.trim().length < 5) {
      toast.error('Description must be at least 5 characters.');
      return;
    }

    try {
      setSubmittingLog(true);

      const formData = new FormData();
      formData.append('pet_id', selectedPet);
      formData.append('activity_type', activityType);
      formData.append('description', description);
      formData.append('notify_owner', String(notifyOwner));

      if (photo) {
        formData.append('photo', photo);
      }

      await createActivityLog(formData);
      toast.success('Activity log created successfully.');

      setSelectedPet('');
      setActivityType('');
      setDescription('');
      setPhoto(null);
      setNotifyOwner(false);
    } catch (error: any) {
      console.error('Error creating activity log:', error);
      toast.error(error.message || 'Failed to create activity log.');
    } finally {
      setSubmittingLog(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const notificationTotal =
    notificationSummary.contactMessages +
    notificationSummary.pendingBookings +
    notificationSummary.emergencyRequests +
    notificationSummary.pendingReviews;

  const titleMap: Record<string, string> = {
    dashboard: 'Admin Dashboard',
    'booking-management': 'Booking Management',
    'activity-logs': 'Daily Activity Log',
    analytics: 'Analytics & Reports',
    announcements: 'Announcements',
    'contact-messages': 'Contact Messages',
    'emergency-requests': 'Emergency Requests',
    'reviews': 'Review Management'
  };

  // Show settings page if showSettings is true
  if (showSettings) {
    return (
      <SettingsPage
        hideNavbar={true}
        onBack={() => setShowSettings(false)}
        onLogout={onLogout}
        userFullName={user.fullName}
        onNavigate={(page) => {
          if (page === 'admin-dashboard') {
            setShowSettings(false);
            onNavigate?.('admin-dashboard');
          } else if (page === 'profile') {
            setShowSettings(false);
            onNavigate?.('profile');
          }
        }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition w-full"
            title="Go to Dashboard"
          >
            <span className="text-2xl">🐾</span>
            <span className="font-semibold text-gray-800 dark:text-gray-100">PawWell Admin</span>
          </button>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left px-4 py-2.5 rounded-lg font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('booking-management')}
              className={`w-full text-left px-4 py-2.5 rounded-lg font-medium transition-colors ${
                activeTab === 'booking-management'
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Booking management
            </button>
            <button
              onClick={() => setActiveTab('activity-logs')}
              className={`w-full text-left px-4 py-2.5 rounded-lg font-medium transition-colors ${
                activeTab === 'activity-logs'
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Activity logs
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full text-left px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'analytics'
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <BarChart3 size={18} />
              Analytics
            </button>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="px-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-2">System</p>
            <button
              onClick={() => setActiveTab('contact-messages')}
              className={`w-full text-left px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'contact-messages'
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span>✉️</span>
              Contact messages
            </button>
            <button
              onClick={() => setActiveTab('emergency-requests')}
              className={`w-full text-left px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'emergency-requests'
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span>🚨</span>
              Emergency requests
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`w-full text-left px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'reviews'
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span>⭐</span>
              Reviews
            </button>
            <button
              onClick={() => setActiveTab('announcements')}
              className={`w-full text-left px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'announcements'
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span>📢</span>
              Announcements
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {titleMap[activeTab] || 'Admin Dashboard'}
            </h1>
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setNotificationOpen((prev) => {
                      if (!prev) {
                        fetchNotificationSummary();
                      }
                      return !prev;
                    });
                  }}
                  className="relative flex items-center justify-center w-11 h-11 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
                  aria-label="Notifications"
                >
                  <Bell size={20} className="text-gray-700 dark:text-gray-200" />
                  {notificationTotal > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] px-1 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                      {notificationTotal}
                    </span>
                  )}
                </button>

                {notificationOpen && (
                  <div className="absolute right-0 mt-3 w-72 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg z-20">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Unread summary</p>
                    </div>
                    <div className="py-2">
                    {notificationLoading ? (
                      <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">Loading...</div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('contact-messages');
                            setNotificationOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          {notificationSummary.contactMessages} New Contact Messages
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('booking-management');
                            setNotificationOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          {notificationSummary.pendingBookings} Pending Booking Approvals
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('emergency-requests');
                            setNotificationOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          {notificationSummary.emergencyRequests} Emergency Requests
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('reviews');
                            setNotificationOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          {notificationSummary.pendingReviews} Pending Reviews
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="w-11 h-11 rounded-full hover:shadow-lg transition-all cursor-pointer border-2 border-gray-200 dark:border-gray-600 overflow-hidden"
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
                      setShowSettings(true);
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

          {activeTab === 'booking-management' && (
            <div className="mb-6">
              <BookingManagement />
            </div>
          )}

          {activeTab === 'dashboard' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-yellow-200 dark:border-yellow-600">
                  <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Active Bookings</h3>
                  <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">{dashboardStats.activeBookings}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-yellow-200 dark:border-yellow-600">
                  <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Total registered Pets</h3>
                  <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">{pets.length}</p>
                </div>
              </div>

              {/* Pending Booking Approvals */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Pending Booking Approvals</h2>

                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">Loading bookings...</p>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No pending bookings</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Pet Name</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Owner</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Service & Date</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((booking) => (
                          <tr key={booking.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="py-4 px-4 font-medium text-gray-900 dark:text-gray-100">{booking.petName}</td>
                            <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{booking.ownerName}</td>
                            <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                              {booking.service_type} on {formatDate(booking.start_date)}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleApproveBooking(booking.booking_id)}
                                  disabled={approving === booking.booking_id}
                                  className="px-4 py-1.5 bg-yellow-300 dark:bg-yellow-500 hover:bg-yellow-400 dark:hover:bg-yellow-600 text-gray-900 dark:text-gray-100 rounded font-medium transition-colors disabled:opacity-50"
                                >
                                  {approving === booking.booking_id ? 'Approving...' : 'Approve'}
                                </button>
                                <button
                                  onClick={() => handleRejectBooking(booking.booking_id)}
                                  disabled={rejecting === booking.booking_id}
                                  className="px-4 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                                >
                                  <span>✕</span>
                                  {rejecting === booking.booking_id ? 'Rejecting...' : 'Retry'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Caretaker Shift */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Caretaker Shift</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Caretaker</label>
                    <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400">
                      <option>Select caretaker</option>
                      <option>John Doe</option>
                      <option>Jane Smith</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Shift Details</label>
                    <input
                      type="text"
                      placeholder="8:00 am - 7:00 pm"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>

                  <button className="px-6 py-2 bg-yellow-300 dark:bg-yellow-500 hover:bg-yellow-400 dark:hover:bg-yellow-600 text-gray-900 dark:text-gray-100 rounded-lg font-semibold transition-colors">
                    Assign Shifts
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'activity-logs' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewingActivityLogs(false)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      !viewingActivityLogs
                        ? 'bg-yellow-300 dark:bg-yellow-500 text-gray-900 dark:text-gray-100 hover:bg-yellow-400 dark:hover:bg-yellow-600'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    + Create New
                  </button>
                  <button
                    onClick={() => setViewingActivityLogs(true)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      viewingActivityLogs
                        ? 'bg-yellow-300 dark:bg-yellow-500 text-gray-900 dark:text-gray-100 hover:bg-yellow-400 dark:hover:bg-yellow-600'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    View Logs
                  </button>
                </div>
              </div>

              {viewingActivityLogs ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <ActivityLogsManagement 
                    onRefreshLogs={() => {
                      // Refresh bookings if needed
                      fetchPendingBookings();
                    }}
                  />
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Add New Activity</h2>

                  <form onSubmit={handleCreateActivityLog} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pet</label>
                      <select
                        value={selectedPet}
                        onChange={(event) => setSelectedPet(event.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        required
                      >
                        <option value="">Select pet</option>
                        {pets.map((pet) => (
                          <option key={pet.pet_id} value={pet.pet_id}>
                            {pet.name}
                            {pet.owner?.first_name ? ` (${pet.owner.first_name} ${pet.owner.last_name || ''})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Activity Type</label>
                      <select
                        value={activityType}
                        onChange={(event) => setActivityType(event.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        required
                      >
                        <option value="">Select activity type</option>
                        {activityTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                      <textarea
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        rows={4}
                        minLength={5}
                        placeholder="Describe the activity and any observations..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Photo (optional)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                    </div>

                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={notifyOwner}
                        onChange={(event) => setNotifyOwner(event.target.checked)}
                        className="h-4 w-4"
                      />
                      Notify owner
                    </label>

                    <button
                      type="submit"
                      disabled={submittingLog}
                      className="px-6 py-2 bg-yellow-300 hover:bg-yellow-400 text-gray-900 rounded-lg font-semibold transition-colors disabled:opacity-60"
                    >
                      {submittingLog ? 'Logging activity...' : 'Log Activity'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <Analytics />
          )}

          {activeTab === 'contact-messages' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Recent Contact Messages</h2>
                <button
                  type="button"
                  onClick={handleMarkAllContactRead}
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                >
                  Mark all as read
                </button>
              </div>

              {contactLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">Loading contact messages...</p>
                </div>
              ) : contactMessages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No contact messages yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Name</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Email</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Subject</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Phone</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Location</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Received</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contactMessages.map((message) => (
                        <tr key={message.contact_id} className="border-b border-gray-100 dark:border-gray-700">
                          <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{message.full_name}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{message.email}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{message.subject}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{message.phone_number || '-'}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{message.location || '-'}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{formatDate(message.created_at)}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              message.status === 'unread'
                                ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}>
                              {message.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenMessage(message)}
                                className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                              >
                                View
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMarkMessageRead(message.contact_id)}
                                disabled={message.status === 'read' || markingMessageId === message.contact_id}
                                className="px-3 py-1.5 text-sm rounded-lg bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/60 disabled:opacity-50"
                              >
                                {markingMessageId === message.contact_id ? 'Marking...' : 'Mark read'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedMessage && (
                <div className="fixed inset-0 bg-black/30 dark:bg-black/50 flex items-end justify-end z-30">
                  <div className="bg-white dark:bg-gray-800 w-full max-w-md h-full sm:h-auto sm:rounded-l-2xl p-6 shadow-xl overflow-y-auto">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Message Details</p>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{selectedMessage.subject}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedMessage(null)}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">From</p>
                        <p className="text-gray-900 dark:text-gray-100 font-medium">{selectedMessage.full_name}</p>
                        <p className="text-gray-600 dark:text-gray-400">{selectedMessage.email}</p>
                        <p className="text-gray-600 dark:text-gray-400">{selectedMessage.phone_number || 'No phone provided'}</p>
                        <p className="text-gray-600 dark:text-gray-400">{selectedMessage.location || 'No location provided'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Received</p>
                        <p className="text-gray-900 dark:text-gray-100">{formatDate(selectedMessage.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Message</p>
                        <p className="text-gray-900 dark:text-gray-100 whitespace-pre-line">{selectedMessage.message}</p>
                      </div>
                    </div>
                    <div className="mt-6 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedMessage(null)}
                        className="flex-1 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMarkMessageRead(selectedMessage.contact_id)}
                        disabled={selectedMessage.status === 'read' || markingMessageId === selectedMessage.contact_id}
                        className="flex-1 px-4 py-2 rounded-lg bg-yellow-300 dark:bg-yellow-500 text-gray-900 dark:text-gray-100 hover:bg-yellow-400 dark:hover:bg-yellow-600 disabled:opacity-50"
                      >
                        {markingMessageId === selectedMessage.contact_id ? 'Marking...' : 'Mark read'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'emergency-requests' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Emergency Requests</h2>

              {emergencyLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">Loading emergency requests...</p>
                </div>
              ) : emergencyRequests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No active emergency requests</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Pet</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Type</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Description</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Contact</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Submitted</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emergencyRequests.map((request) => (
                        <tr key={request.emergency_id} className="border-b border-gray-100 dark:border-gray-700">
                          <td className="py-3 px-4 flex items-center gap-3">
                            {request.pets?.photo ? (
                              <img src={request.pets.photo} alt={request.pets.name} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                                <span className="text-xs">🐾</span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{request.pets?.name || 'Unknown'}</p>
                              {request.users && <p className="text-xs text-gray-500 dark:text-gray-400">{request.users.first_name} {request.users.last_name}</p>}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">{request.emergency_type}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400 max-w-xs truncate" title={request.description || ''}>{request.description || '-'}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">{request.contact_info}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{formatDate(request.created_at)}</td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400">
                              {request.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleUpdateEmergencyStatus(request.emergency_id, 'in_progress')}
                                className="px-3 py-1.5 text-sm rounded-lg bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/60"
                              >
                                In Progress
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateEmergencyStatus(request.emergency_id, 'resolved')}
                                className="px-3 py-1.5 text-sm rounded-lg bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/60"
                              >
                                Resolve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateEmergencyStatus(request.emergency_id, 'cancelled')}
                                className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <ReviewManagement />
          )}
        </div>
      </main>
    </div>
  );
}
