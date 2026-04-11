import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import { Bell, Settings, User as UserIcon, LogOut, BarChart3, X, Edit2, Trash2 } from 'lucide-react';
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
  getDashboardAnalytics,
  markNotificationsByTypeAsRead,
  markPendingBookingsAsRead,
  markEmergencyRequestsAsRead,
  markPendingReviewsAsRead
} from '../../services/api';
import { toast } from 'sonner';
import ActivityLogsManagement from './ActivityLogsManagement';
import BookingManagement from './BookingManagement';
import ReviewManagement from './ReviewManagement';
import SettingsPage from './SettingsPage';
import Analytics from './Analytics';
import AdminUserManagement from './AdminUserManagement';
import AdminPetManagement from './AdminPetManagement';

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

interface Caretaker {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  serviceType?: string;
  specialization?: string;
  isActive: boolean;
  createdAt?: string;
}

interface CaretakerShift {
  id: string;
  caretakerId: string;
  caretakerName: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  notes?: string;
  serviceType?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt?: string;
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
  const [activityErrors, setActivityErrors] = useState<Record<string, string>>({
    pet: '',
    activityType: '',
    description: ''
  });
  const [viewingActivityLogs, setViewingActivityLogs] = useState(() => {
    return sessionStorage.getItem('adminViewingActivityLogs') === 'true';
  });
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationSummary, setNotificationSummary] = useState({
    contactMessages: 0,
    pendingBookings: 0,
    emergencyRequests: 0,
    pendingReviews: 0,
    newUsers: 0,
    newPets: 0
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
  const [selectedEmergencyRequest, setSelectedEmergencyRequest] = useState<EmergencyRequest | null>(null);
  const [updatingEmergencyId, setUpdatingEmergencyId] = useState<number | null>(null);

  // Caretaker Shift Management State
  const [caretakers, setCaretakers] = useState<Caretaker[]>([]);
  const [assignedShifts, setAssignedShifts] = useState<CaretakerShift[]>([]);
  const [showAddCaretakerModal, setShowAddCaretakerModal] = useState(false);
  const [showEditShiftModal, setShowEditShiftModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<string | null>(null);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

  // Form state for new caretaker
  const [caretakerForm, setCaretakerForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    serviceType: ''
  });
  const [caretakerFormErrors, setCaretakerFormErrors] = useState<Record<string, string>>({});
  const [caretakerFormTouched, setCaretakerFormTouched] = useState<Record<string, boolean>>({});
  const [submittingCaretaker, setSubmittingCaretaker] = useState(false);

  // Form state for shift assignment
  const [shiftForm, setShiftForm] = useState({
    caretakerId: '',
    shiftDate: '',
    startTime: '',
    endTime: '',
    notes: '',
    serviceType: ''
  });
  const [shiftFormErrors, setShiftFormErrors] = useState<Record<string, string>>({});
  const [shiftFormTouched, setShiftFormTouched] = useState<Record<string, boolean>>({});
  const [submittingShift, setSubmittingShift] = useState(false);

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
        pendingReviews: data.pendingReviews || 0,
        newUsers: data.newUsers || 0,
        newPets: data.newPets || 0
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

  const handleNotificationClick = async (tab: string, markAsRead?: () => Promise<void>) => {
    try {
      // Mark as read if applicable
      if (markAsRead) {
        await markAsRead();
      }
      // Navigate to tab
      setActiveTab(tab);
      setNotificationOpen(false);
      // Refresh notification summary with a small delay to ensure backend processes
      setTimeout(() => {
        fetchNotificationSummary();
      }, 300);
    } catch (error: any) {
      console.error('Error handling notification click:', error);
      toast.error(error.message || 'Failed to process notification');
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
      
      // Update the selected request
      if (selectedEmergencyRequest && selectedEmergencyRequest.emergency_id === requestId) {
        setSelectedEmergencyRequest({ ...selectedEmergencyRequest, status: status as 'pending' | 'in_progress' | 'resolved' | 'cancelled' });
      }
      
      fetchEmergencyRequests();
      fetchNotificationSummary();
      setUpdatingEmergencyId(null);
    } catch (error: any) {
      console.error('Error updating emergency request:', error);
      toast.error(error.message || 'Failed to update emergency request');
      setUpdatingEmergencyId(null);
    }
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setPhoto(file);
  };

  const handleCreateActivityLog = async (event: FormEvent) => {
    event.preventDefault();
    
    // Validate form
    const errors: Record<string, string> = {};
    
    if (!selectedPet) {
      errors.pet = 'Please select a pet';
    }
    
    if (!activityType) {
      errors.activityType = 'Please select an activity type';
    }
    
    if (!description.trim()) {
      errors.description = 'Description is required';
    } else if (description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }
    
    setActivityErrors(errors);
    
    if (Object.keys(errors).length > 0) {
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
      setActivityErrors({ pet: '', activityType: '', description: '' });
    } catch (error: any) {
      console.error('Error creating activity log:', error);
      toast.error(error.message || 'Failed to create activity log.');
    } finally {
      setSubmittingLog(false);
    }
  };

  //CARETAKER SHIFT MANAGEMENT FUNCTIONS 

  // Validation functions for caretaker form
  const validateCaretakerField = (fieldName: string, value: string): string => {
    const trimmed = value.trim();

    switch (fieldName) {
      case 'fullName':
        if (!trimmed) return 'Full name is required';
        if (trimmed.length < 2) return 'Full name must be at least 2 characters';
        if (!/^[A-Za-z\s]+$/.test(trimmed)) return 'Full name should contain only letters and spaces';
        return '';
      
      case 'email':
        if (!trimmed) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Please enter a valid email address';
        return '';
      
      case 'phoneNumber':
        if (!trimmed) return 'Phone number is required';
        const cleanPhone = trimmed.replace(/\s/g, '');
        if (!/^\d+$/.test(cleanPhone)) return 'Phone number must contain only digits';
        if (cleanPhone.length !== 10) return 'Phone number must be exactly 10 digits';
        return '';
      
      case 'address':
        if (!trimmed) return 'Address is required';
        if (trimmed.length < 5) return 'Address must be at least 5 characters';
        return '';
      
      case 'emergencyContactName':
        if (!trimmed) return 'Emergency contact name is required';
        if (trimmed.length < 2) return 'Emergency contact name must be at least 2 characters';
        if (!/^[A-Za-z\s]+$/.test(trimmed)) return 'Emergency contact name should contain only letters and spaces';
        return '';
      
      case 'emergencyContactNumber':
        if (!trimmed) return 'Emergency contact number is required';
        const cleanEmergency = trimmed.replace(/\s/g, '');
        if (!/^\d+$/.test(cleanEmergency)) return 'Emergency contact number must contain only digits';
        if (cleanEmergency.length !== 10) return 'Emergency contact number must be exactly 10 digits';
        return '';
      
      default:
        return '';
    }
  };

  // Validation functions for shift form
  const validateShiftField = (fieldName: string, value: string): string => {
    const trimmed = value.trim();

    switch (fieldName) {
      case 'caretakerId':
        if (!trimmed) return 'Please select a caretaker';
        return '';
      
      case 'shiftDate':
        if (!trimmed) return 'Shift date is required';
        return '';
      
      case 'startTime':
        if (!trimmed) return 'Start time is required';
        return '';
      
      case 'endTime':
        if (!trimmed) return 'End time is required';
        return '';
      
      case 'serviceType':
        if (!trimmed) return 'Service type is required';
        return '';
      
      default:
        return '';
    }
  };

  // Check for overlapping shifts
  const hasOverlappingShift = (caretakerId: string, shiftDate: string, startTime: string, endTime: string, excludeShiftId?: string): boolean => {
    return assignedShifts.some(shift => {
      if (excludeShiftId && shift.id === excludeShiftId) return false;
      if (shift.caretakerId !== caretakerId) return false;
      if (shift.shiftDate !== shiftDate) return false;

      const newStart = new Date(`${shiftDate}T${startTime}`).getTime();
      const newEnd = new Date(`${shiftDate}T${endTime}`).getTime();
      const existingStart = new Date(`${shift.shiftDate}T${shift.startTime}`).getTime();
      const existingEnd = new Date(`${shift.shiftDate}T${shift.endTime}`).getTime();

      return newStart < existingEnd && newEnd > existingStart;
    });
  };

  // Handle caretaker form input change
  const handleCaretakerFormChange = (field: string, value: string) => {
    setCaretakerForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (caretakerFormErrors[field]) {
      setCaretakerFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate caretaker form on blur
  const handleCaretakerFieldBlur = (field: string) => {
    const error = validateCaretakerField(field, caretakerForm[field as keyof typeof caretakerForm] || '');
    setCaretakerFormTouched(prev => ({ ...prev, [field]: true }));
    if (error) {
      setCaretakerFormErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  // Handle add caretaker submission
  const handleAddCaretaker = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all required fields
    const newErrors: Record<string, string> = {};
    const requiredFields = ['fullName', 'email', 'phoneNumber', 'address', 'emergencyContactName', 'emergencyContactNumber'];

    requiredFields.forEach(field => {
      const error = validateCaretakerField(field, caretakerForm[field as keyof typeof caretakerForm] || '');
      if (error) {
        newErrors[field] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setCaretakerFormErrors(newErrors);
      toast.error('Please fix all validation errors');
      return;
    }

    try {
      setSubmittingCaretaker(true);

      // Create new caretaker object
      const newCaretaker: Caretaker = {
        id: `caretaker_${Date.now()}`,
        fullName: caretakerForm.fullName.trim(),
        email: caretakerForm.email.trim(),
        phoneNumber: caretakerForm.phoneNumber.trim(),
        address: caretakerForm.address.trim(),
        emergencyContactName: caretakerForm.emergencyContactName.trim(),
        emergencyContactNumber: caretakerForm.emergencyContactNumber.trim(),
        serviceType: caretakerForm.serviceType.trim() || 'General',
        isActive: true,
        createdAt: new Date().toISOString()
      };

      // In a real app, this would be an API call
      setCaretakers(prev => [...prev, newCaretaker]);
      
      // Reset form
      setCaretakerForm({
        fullName: '',
        email: '',
        phoneNumber: '',
        address: '',
        emergencyContactName: '',
        emergencyContactNumber: '',
        serviceType: ''
      });
      setCaretakerFormErrors({});
      setCaretakerFormTouched({});

      toast.success(`Caretaker "${newCaretaker.fullName}" created successfully!`);
      setShowAddCaretakerModal(false);
      
      // Auto-select newly created caretaker
      setShiftForm(prev => ({ ...prev, caretakerId: newCaretaker.id }));
    } catch (error: any) {
      console.error('Error creating caretaker:', error);
      toast.error(error.message || 'Failed to create caretaker');
    } finally {
      setSubmittingCaretaker(false);
    }
  };

  // Handle shift form input change
  const handleShiftFormChange = (field: string, value: string) => {
    setShiftForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (shiftFormErrors[field]) {
      setShiftFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate shift form on blur
  const handleShiftFieldBlur = (field: string) => {
    const error = validateShiftField(field, shiftForm[field as keyof typeof shiftForm] || '');
    setShiftFormTouched(prev => ({ ...prev, [field]: true }));
    if (error) {
      setShiftFormErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  // Handle assign shift submission
  const handleAssignShift = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all required fields
    const newErrors: Record<string, string> = {};
    const requiredFields = ['caretakerId', 'shiftDate', 'startTime', 'endTime', 'serviceType'];

    requiredFields.forEach(field => {
      const error = validateShiftField(field, shiftForm[field as keyof typeof shiftForm] || '');
      if (error) {
        newErrors[field] = error;
      }
    });

    // Additional validation: end time must be after start time
    if (shiftForm.startTime && shiftForm.endTime) {
      if (shiftForm.startTime >= shiftForm.endTime) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    // Check for overlapping shifts
    if (shiftForm.caretakerId && shiftForm.shiftDate && shiftForm.startTime && shiftForm.endTime && !newErrors.endTime) {
      if (hasOverlappingShift(shiftForm.caretakerId, shiftForm.shiftDate, shiftForm.startTime, shiftForm.endTime, selectedShiftId || undefined)) {
        newErrors.shiftDate = 'This caretaker already has a shift during the selected time. Please choose a different time or date.';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setShiftFormErrors(newErrors);
      toast.error('Please fix all validation errors');
      return;
    }

    try {
      setSubmittingShift(true);

      const selectedCaretaker = caretakers.find(c => c.id === shiftForm.caretakerId);

      if (selectedShiftId) {
        // Edit existing shift
        setAssignedShifts(prev =>
          prev.map(shift =>
            shift.id === selectedShiftId
              ? {
                  ...shift,
                  caretakerId: shiftForm.caretakerId,
                  caretakerName: selectedCaretaker?.fullName || '',
                  shiftDate: shiftForm.shiftDate,
                  startTime: shiftForm.startTime,
                  endTime: shiftForm.endTime,
                  notes: shiftForm.notes.trim(),
                  serviceType: shiftForm.serviceType.trim() || 'General'
                }
              : shift
          )
        );
        toast.success('Shift updated successfully!');
      } else {
        // Create new shift
        const newShift: CaretakerShift = {
          id: `shift_${Date.now()}`,
          caretakerId: shiftForm.caretakerId,
          caretakerName: selectedCaretaker?.fullName || '',
          shiftDate: shiftForm.shiftDate,
          startTime: shiftForm.startTime,
          endTime: shiftForm.endTime,
          notes: shiftForm.notes.trim(),
          serviceType: shiftForm.serviceType.trim() || 'General',
          status: 'scheduled',
          createdAt: new Date().toISOString()
        };

        setAssignedShifts(prev => [...prev, newShift]);
        toast.success('Shift assigned successfully!');
      }

      // Reset form
      setShiftForm({
        caretakerId: '',
        shiftDate: '',
        startTime: '',
        endTime: '',
        notes: '',
        serviceType: ''
      });
      setShiftFormErrors({});
      setShiftFormTouched({});
      setSelectedShiftId(null);
      setShowEditShiftModal(false);
    } catch (error: any) {
      console.error('Error assigning shift:', error);
      toast.error(error.message || 'Failed to assign shift');
    } finally {
      setSubmittingShift(false);
    }
  };

  // Handle edit shift
  const handleEditShift = (shift: CaretakerShift) => {
    setSelectedShiftId(shift.id);
    setShiftForm({
      caretakerId: shift.caretakerId,
      shiftDate: shift.shiftDate,
      startTime: shift.startTime,
      endTime: shift.endTime,
      notes: shift.notes || '',
      serviceType: shift.serviceType || ''
    });
    setShowEditShiftModal(true);
  };

  // Handle delete shift
  const handleDeleteShift = (shiftId: string) => {
    setAssignedShifts(prev => prev.filter(shift => shift.id !== shiftId));
    setShowDeleteConfirmation(null);
    toast.success('Shift deleted successfully!');
  };

  // Format time for display
  const formatTime = (time: string): string => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Format date for display
  const formatShiftDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
    notificationSummary.pendingReviews +
    notificationSummary.newUsers +
    notificationSummary.newPets;

  const titleMap: Record<string, string> = {
    dashboard: 'Admin Dashboard',
    'booking-management': 'Booking Management',
    'activity-logs': 'Daily Activity Log',
    analytics: 'Analytics & Reports',
    'user-management': 'User Management',
    'pet-management': 'Pet Management',
    announcements: 'Announcements',
    'contact-messages': 'Contact Messages',
    'emergency-requests': 'Emergency Requests',
    'reviews': 'Review Management'
  };

  // Show settings page if showSettings is true
  if (showSettings) {
    return (
      <SettingsPage
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

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="px-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-2">Management</p>
              <button
                onClick={() => setActiveTab('user-management')}
                className={`w-full text-left px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'user-management'
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span>👥</span>
                User Management
              </button>
              <button
                onClick={() => setActiveTab('pet-management')}
                className={`w-full text-left px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'pet-management'
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span>🐾</span>
                Pet Management
              </button>
            </div>
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
              {/* <span>📢</span>
              Announcements */}
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
                          onClick={() => handleNotificationClick('contact-messages', async () => await markAdminContactMessagesRead())}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          {notificationSummary.contactMessages} New Contact Messages
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNotificationClick('booking-management', async () => await markPendingBookingsAsRead())}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          {notificationSummary.pendingBookings} Pending Booking Approvals
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNotificationClick('emergency-requests', async () => await markEmergencyRequestsAsRead())}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          {notificationSummary.emergencyRequests} Emergency Requests
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNotificationClick('reviews', async () => await markPendingReviewsAsRead())}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          {notificationSummary.pendingReviews} Pending Reviews
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNotificationClick('user-management', async () => await markNotificationsByTypeAsRead('user_registered'))}
                          className="w-full text-left px-4 py-2.5 text-sm text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-semibold"
                        >
                          {notificationSummary.newUsers} New User{notificationSummary.newUsers > 1 ? 's' : ''}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNotificationClick('pet-management', async () => await markNotificationsByTypeAsRead('pet_registered'))}
                          className="w-full text-left px-4 py-2.5 text-sm text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 font-semibold"
                        >
                          {notificationSummary.newPets} New Pet{notificationSummary.newPets > 1 ? 's' : ''}
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

              {/* Caretaker Shift Management */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Caretaker Shift Management</h2>
                  <button
                    onClick={() => {
                      setShowAddCaretakerModal(true);
                      setCaretakerForm({
                        fullName: '',
                        email: '',
                        phoneNumber: '',
                        address: '',
                        emergencyContactName: '',
                        emergencyContactNumber: '',
                        serviceType: ''
                      });
                      setCaretakerFormErrors({});
                      setCaretakerFormTouched({});
                    }}
                    className="px-4 py-2 bg-yellow-300 dark:bg-yellow-500 hover:bg-yellow-400 dark:hover:bg-yellow-600 text-gray-900 dark:text-gray-100 rounded-lg font-semibold transition-colors text-sm"
                  >
                    + Add New Caretaker
                  </button>
                </div>

                {/* Shift Assignment Form */}
                <form onSubmit={handleAssignShift} className="space-y-4 mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Caretaker</label>
                      <select
                        value={shiftForm.caretakerId}
                        onChange={(e) => {
                          handleShiftFormChange('caretakerId', e.target.value);
                        }}
                        onBlur={() => handleShiftFieldBlur('caretakerId')}
                        className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 ${
                          shiftFormErrors.caretakerId
                            ? 'border-red-500 focus:ring-red-400'
                            : 'border-gray-300 dark:border-gray-600 focus:ring-yellow-400'
                        }`}
                      >
                        <option value="">Select caretaker</option>
                        {caretakers.map(caretaker => (
                          <option key={caretaker.id} value={caretaker.id}>
                            {caretaker.fullName} {!caretaker.isActive && '(Inactive)'}
                          </option>
                        ))}
                      </select>
                      {shiftFormErrors.caretakerId && (
                        <p className="text-red-500 text-sm mt-1">{shiftFormErrors.caretakerId}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Shift Date</label>
                      <input
                        type="date"
                        value={shiftForm.shiftDate}
                        onChange={(e) => handleShiftFormChange('shiftDate', e.target.value)}
                        onBlur={() => handleShiftFieldBlur('shiftDate')}
                        min={new Date().toISOString().split('T')[0]}
                        className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 ${
                          shiftFormErrors.shiftDate
                            ? 'border-red-500 focus:ring-red-400'
                            : 'border-gray-300 dark:border-gray-600 focus:ring-yellow-400'
                        }`}
                      />
                      {shiftFormErrors.shiftDate && (
                        <p className="text-red-500 text-sm mt-1">{shiftFormErrors.shiftDate}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Time</label>
                      <input
                        type="time"
                        value={shiftForm.startTime}
                        onChange={(e) => handleShiftFormChange('startTime', e.target.value)}
                        onBlur={() => handleShiftFieldBlur('startTime')}
                        className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 ${
                          shiftFormErrors.startTime
                            ? 'border-red-500 focus:ring-red-400'
                            : 'border-gray-300 dark:border-gray-600 focus:ring-yellow-400'
                        }`}
                      />
                      {shiftFormErrors.startTime && (
                        <p className="text-red-500 text-sm mt-1">{shiftFormErrors.startTime}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Time</label>
                      <input
                        type="time"
                        value={shiftForm.endTime}
                        onChange={(e) => handleShiftFormChange('endTime', e.target.value)}
                        onBlur={() => handleShiftFieldBlur('endTime')}
                        className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 ${
                          shiftFormErrors.endTime
                            ? 'border-red-500 focus:ring-red-400'
                            : 'border-gray-300 dark:border-gray-600 focus:ring-yellow-400'
                        }`}
                      />
                      {shiftFormErrors.endTime && (
                        <p className="text-red-500 text-sm mt-1">{shiftFormErrors.endTime}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Service Type *</label>
                      <select
                        value={shiftForm.serviceType}
                        onChange={(e) => handleShiftFormChange('serviceType', e.target.value)}
                        onBlur={() => handleShiftFieldBlur('serviceType')}
                        className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 ${
                          shiftFormErrors.serviceType
                            ? 'border-red-500 focus:ring-red-400'
                            : 'border-gray-300 dark:border-gray-600 focus:ring-yellow-400'
                        }`}
                      >
                        <option value="">Select service type</option>
                        <option value="Daycation/Pet Sitting">Daycation/Pet Sitting</option>
                        <option value="Pet Boarding">Pet Boarding</option>
                        <option value="Grooming">Grooming</option>
                      </select>
                      {shiftFormErrors.serviceType && (
                        <p className="text-red-500 text-sm mt-1">{shiftFormErrors.serviceType}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes (Optional)</label>
                      <input
                        type="text"
                        value={shiftForm.notes}
                        onChange={(e) => handleShiftFormChange('notes', e.target.value)}
                        placeholder="Additional notes"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingShift}
                    className="px-6 py-2 bg-yellow-300 dark:bg-yellow-500 hover:bg-yellow-400 dark:hover:bg-yellow-600 disabled:opacity-50 text-gray-900 dark:text-gray-100 rounded-lg font-semibold transition-colors"
                  >
                    {submittingShift ? 'Assigning...' : selectedShiftId ? 'Update Shift' : 'Assign Shift'}
                  </button>
                </form>

                {/* Assigned Shifts Table */}
                {assignedShifts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-300 dark:border-gray-600">
                          <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Caretaker</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Date</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Time</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Service Type</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Status</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignedShifts.map((shift) => (
                          <tr
                            key={shift.id}
                            className="border-b border-gray-200 dark:border-gray-700 hover:bg-yellow-50 dark:hover:bg-gray-700/40 transition-colors"
                          >
                            <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{shift.caretakerName}</td>
                            <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{formatShiftDate(shift.shiftDate)}</td>
                            <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                              {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                            </td>
                            <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{shift.serviceType || '-'}</td>
                            <td className="px-4 py-3 text-gray-900 dark:text-gray-100 capitalize">{shift.status}</td>
                            <td className="px-4 py-3 flex gap-2">
                              <button
                                onClick={() => handleEditShift(shift)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                                title="Edit shift"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirmation(shift.id)}
                                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                                title="Delete shift"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    <p>No shifts assigned yet. Create caretakers and assign shifts above.</p>
                  </div>
                )}
              </div>

              {/* Add Caretaker Modal */}
              {showAddCaretakerModal && (
                <div className="fixed inset-0 bg-black/30 dark:bg-black/30 flex items-center justify-center z-50 p-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Add New Caretaker</h3>
                      <button
                        onClick={() => {
                          setShowAddCaretakerModal(false);
                          setCaretakerFormErrors({});
                          setCaretakerFormTouched({});
                        }}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    <form onSubmit={handleAddCaretaker} className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name *</label>
                        <input
                          type="text"
                          value={caretakerForm.fullName}
                          onChange={(e) => handleCaretakerFormChange('fullName', e.target.value)}
                          onBlur={() => handleCaretakerFieldBlur('fullName')}
                          placeholder="Full Name"
                          className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 ${
                            caretakerFormErrors.fullName
                              ? 'border-red-500 focus:ring-red-400'
                              : 'border-gray-300 dark:border-gray-600 focus:ring-yellow-400'
                          }`}
                        />
                        {caretakerFormErrors.fullName && (
                          <p className="text-red-500 text-sm mt-1">{caretakerFormErrors.fullName}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email *</label>
                        <input
                          type="email"
                          value={caretakerForm.email}
                          onChange={(e) => handleCaretakerFormChange('email', e.target.value)}
                          onBlur={() => handleCaretakerFieldBlur('email')}
                          placeholder="@example.com"
                          className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 ${
                            caretakerFormErrors.email
                              ? 'border-red-500 focus:ring-red-400'
                              : 'border-gray-300 dark:border-gray-600 focus:ring-yellow-400'
                          }`}
                        />
                        {caretakerFormErrors.email && (
                          <p className="text-red-500 text-sm mt-1">{caretakerFormErrors.email}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number *</label>
                        <input
                          type="tel"
                          value={caretakerForm.phoneNumber}
                          onChange={(e) => handleCaretakerFormChange('phoneNumber', e.target.value)}
                          onBlur={() => handleCaretakerFieldBlur('phoneNumber')}
                          placeholder="9800000000"
                          className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 ${
                            caretakerFormErrors.phoneNumber
                              ? 'border-red-500 focus:ring-red-400'
                              : 'border-gray-300 dark:border-gray-600 focus:ring-yellow-400'
                          }`}
                        />
                        {caretakerFormErrors.phoneNumber && (
                          <p className="text-red-500 text-sm mt-1">{caretakerFormErrors.phoneNumber}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address *</label>
                        <input
                          type="text"
                          value={caretakerForm.address}
                          onChange={(e) => handleCaretakerFormChange('address', e.target.value)}
                          onBlur={() => handleCaretakerFieldBlur('address')}
                          placeholder="Kamalpokhari, Kathmandu"
                          className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 ${
                            caretakerFormErrors.address
                              ? 'border-red-500 focus:ring-red-400'
                              : 'border-gray-300 dark:border-gray-600 focus:ring-yellow-400'
                          }`}
                        />
                        {caretakerFormErrors.address && (
                          <p className="text-red-500 text-sm mt-1">{caretakerFormErrors.address}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Emergency Contact Name *</label>
                        <input
                          type="text"
                          value={caretakerForm.emergencyContactName}
                          onChange={(e) => handleCaretakerFormChange('emergencyContactName', e.target.value)}
                          onBlur={() => handleCaretakerFieldBlur('emergencyContactName')}
                          placeholder="Enter your emergency contact's name"
                          className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 ${
                            caretakerFormErrors.emergencyContactName
                              ? 'border-red-500 focus:ring-red-400'
                              : 'border-gray-300 dark:border-gray-600 focus:ring-yellow-400'
                          }`}
                        />
                        {caretakerFormErrors.emergencyContactName && (
                          <p className="text-red-500 text-sm mt-1">{caretakerFormErrors.emergencyContactName}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Emergency Contact Number *</label>
                        <input
                          type="tel"
                          value={caretakerForm.emergencyContactNumber}
                          onChange={(e) => handleCaretakerFormChange('emergencyContactNumber', e.target.value)}
                          onBlur={() => handleCaretakerFieldBlur('emergencyContactNumber')}
                          placeholder="9800000000"
                          className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 ${
                            caretakerFormErrors.emergencyContactNumber
                              ? 'border-red-500 focus:ring-red-400'
                              : 'border-gray-300 dark:border-gray-600 focus:ring-yellow-400'
                          }`}
                        />
                        {caretakerFormErrors.emergencyContactNumber && (
                          <p className="text-red-500 text-sm mt-1">{caretakerFormErrors.emergencyContactNumber}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Service Type (Optional)</label>
                        <input
                          type="text"
                          value={caretakerForm.serviceType}
                          onChange={(e) => handleCaretakerFormChange('serviceType', e.target.value)}
                          placeholder="Grooming, Pet Sitting"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button
                          type="submit"
                          disabled={submittingCaretaker}
                          className="flex-1 px-4 py-2 bg-yellow-300 dark:bg-yellow-500 hover:bg-yellow-400 dark:hover:bg-yellow-600 disabled:opacity-50 text-gray-900 dark:text-gray-100 rounded-lg font-semibold transition-colors"
                        >
                          {submittingCaretaker ? 'Creating...' : 'Create Caretaker'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddCaretakerModal(false);
                            setCaretakerFormErrors({});
                            setCaretakerFormTouched({});
                          }}
                          className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg font-semibold transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Edit Shift Modal */}
              {showEditShiftModal && selectedShiftId && (
                <div className="fixed inset-0 bg-black/30 dark:bg-black/30 flex items-center justify-center z-50 p-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full">
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Edit Shift</h3>
                      <button
                        onClick={() => {
                          setShowEditShiftModal(false);
                          setSelectedShiftId(null);
                          setShiftFormErrors({});
                          setShiftFormTouched({});
                        }}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    <form onSubmit={handleAssignShift} className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Caretaker</label>
                        <select
                          value={shiftForm.caretakerId}
                          onChange={(e) => handleShiftFormChange('caretakerId', e.target.value)}
                          onBlur={() => handleShiftFieldBlur('caretakerId')}
                          className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 ${
                            shiftFormErrors.caretakerId
                              ? 'border-red-500 focus:ring-red-400'
                              : 'border-gray-300 dark:border-gray-600 focus:ring-yellow-400'
                          }`}
                        >
                          <option value="">Select caretaker</option>
                          {caretakers.map(caretaker => (
                            <option key={caretaker.id} value={caretaker.id}>
                              {caretaker.fullName}
                            </option>
                          ))}
                        </select>
                        {shiftFormErrors.caretakerId && (
                          <p className="text-red-500 text-sm mt-1">{shiftFormErrors.caretakerId}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Shift Date</label>
                        <input
                          type="date"
                          value={shiftForm.shiftDate}
                          onChange={(e) => handleShiftFormChange('shiftDate', e.target.value)}
                          onBlur={() => handleShiftFieldBlur('shiftDate')}
                          min={new Date().toISOString().split('T')[0]}
                          className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 ${
                            shiftFormErrors.shiftDate
                              ? 'border-red-500 focus:ring-red-400'
                              : 'border-gray-300 dark:border-gray-600 focus:ring-yellow-400'
                          }`}
                        />
                        {shiftFormErrors.shiftDate && (
                          <p className="text-red-500 text-sm mt-1">{shiftFormErrors.shiftDate}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Time</label>
                        <input
                          type="time"
                          value={shiftForm.startTime}
                          onChange={(e) => handleShiftFormChange('startTime', e.target.value)}
                          onBlur={() => handleShiftFieldBlur('startTime')}
                          className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 ${
                            shiftFormErrors.startTime
                              ? 'border-red-500 focus:ring-red-400'
                              : 'border-gray-300 dark:border-gray-600 focus:ring-yellow-400'
                          }`}
                        />
                        {shiftFormErrors.startTime && (
                          <p className="text-red-500 text-sm mt-1">{shiftFormErrors.startTime}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Time</label>
                        <input
                          type="time"
                          value={shiftForm.endTime}
                          onChange={(e) => handleShiftFormChange('endTime', e.target.value)}
                          onBlur={() => handleShiftFieldBlur('endTime')}
                          className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 ${
                            shiftFormErrors.endTime
                              ? 'border-red-500 focus:ring-red-400'
                              : 'border-gray-300 dark:border-gray-600 focus:ring-yellow-400'
                          }`}
                        />
                        {shiftFormErrors.endTime && (
                          <p className="text-red-500 text-sm mt-1">{shiftFormErrors.endTime}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Service Type *</label>
                        <select
                          value={shiftForm.serviceType}
                          onChange={(e) => handleShiftFormChange('serviceType', e.target.value)}
                          onBlur={() => handleShiftFieldBlur('serviceType')}
                          className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 ${
                            shiftFormErrors.serviceType
                              ? 'border-red-500 focus:ring-red-400'
                              : 'border-gray-300 dark:border-gray-600 focus:ring-yellow-400'
                          }`}
                        >
                          <option value="">Select service type</option>
                          <option value="Daycation/Pet Sitting">Daycation/Pet Sitting</option>
                          <option value="Pet Boarding">Pet Boarding</option>
                          <option value="Grooming">Grooming</option>
                        </select>
                        {shiftFormErrors.serviceType && (
                          <p className="text-red-500 text-sm mt-1">{shiftFormErrors.serviceType}</p>
                        )}
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button
                          type="submit"
                          disabled={submittingShift}
                          className="flex-1 px-4 py-2 bg-yellow-300 dark:bg-yellow-500 hover:bg-yellow-400 dark:hover:bg-yellow-600 disabled:opacity-50 text-gray-900 dark:text-gray-100 rounded-lg font-semibold transition-colors"
                        >
                          {submittingShift ? 'Updating...' : 'Update Shift'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowEditShiftModal(false);
                            setSelectedShiftId(null);
                            setShiftFormErrors({});
                            setShiftFormTouched({});
                          }}
                          className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg font-semibold transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Delete Confirmation Modal */}
              {showDeleteConfirmation && (
                <div className="fixed inset-0 bg-black/30 dark:bg-black/30 flex items-center justify-center z-50 p-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-sm w-full">
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Delete Shift</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">Are you sure you want to delete this shift? This action cannot be undone.</p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleDeleteShift(showDeleteConfirmation)}
                          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirmation(null)}
                          className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg font-semibold transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                      fetchPendingBookings();
                    }}
                  />
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Add New Activity</h2>

                  <form onSubmit={handleCreateActivityLog} noValidate className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pet</label>
                      <select
                        value={selectedPet}
                        onChange={(event) => {
                          setSelectedPet(event.target.value);
                          setActivityErrors({ ...activityErrors, pet: '' });
                        }}
                        className={`w-full px-4 py-2 border ${activityErrors.pet ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400`}
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
                      {activityErrors.pet && (
                        <p className="mt-1 text-sm text-red-500">{activityErrors.pet}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Activity Type</label>
                      <select
                        value={activityType}
                        onChange={(event) => {
                          setActivityType(event.target.value);
                          setActivityErrors({ ...activityErrors, activityType: '' });
                        }}
                        className={`w-full px-4 py-2 border ${activityErrors.activityType ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400`}
                        required
                      >
                        <option value="">Select activity type</option>
                        {activityTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      {activityErrors.activityType && (
                        <p className="mt-1 text-sm text-red-500">{activityErrors.activityType}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                      <textarea
                        value={description}
                        onChange={(event) => {
                          setDescription(event.target.value);
                          setActivityErrors({ ...activityErrors, description: '' });
                        }}
                        className={`w-full px-4 py-2 border ${activityErrors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400`}
                        rows={4}
                        minLength={10}
                        placeholder="Describe the activity and any observations..."
                        required
                      />
                      {activityErrors.description && (
                        <p className="mt-1 text-sm text-red-500">{activityErrors.description}</p>
                      )}
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
                <div className="absolute inset-0 z-50 bg-white dark:bg-gray-900 overflow-visible">
                  <div className="min-h-screen p-8 bg-white dark:bg-gray-900">
                    <div className="max-w-4xl mx-auto">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Contact Message</p>
                          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">{selectedMessage.subject}</h1>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedMessage(null)}
                          className="w-12 h-12 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-2xl font-bold flex items-center justify-center"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Main Content Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* Left Column - Sender Info */}
                        <div className="space-y-6">
                          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">From</h2>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                                <p className="text-gray-900 dark:text-gray-100 font-medium text-lg">{selectedMessage.full_name}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                                <p className="text-gray-900 dark:text-gray-100 break-all">{selectedMessage.email}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                                <p className="text-gray-900 dark:text-gray-100">{selectedMessage.phone_number || 'No phone provided'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                                <p className="text-gray-900 dark:text-gray-100">{selectedMessage.location || 'No location provided'}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Column - Message Info */}
                        <div className="space-y-6">
                          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Message Info</h2>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Received</p>
                                <p className="text-gray-900 dark:text-gray-100 font-medium">{formatDate(selectedMessage.created_at)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                                <div className="mt-2 flex items-center gap-2">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${selectedMessage.status === 'read' ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400'}`}>
                                    {selectedMessage.status === 'read' ? 'Read' : 'Unread'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Full Message Content */}
                      <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Message</h2>
                        <div className="prose dark:prose-invert max-w-none">
                          <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed text-base">{selectedMessage.message}</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <button
                          type="button"
                          onClick={() => setSelectedMessage(null)}
                          className="px-6 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition font-semibold"
                        >
                          Close
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMarkMessageRead(selectedMessage.contact_id)}
                          disabled={selectedMessage.status === 'read' || markingMessageId === selectedMessage.contact_id}
                          className="px-8 py-3 rounded-lg bg-yellow-300 dark:bg-yellow-500 text-gray-900 dark:text-gray-100 hover:bg-yellow-400 dark:hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
                        >
                          {markingMessageId === selectedMessage.contact_id ? 'Marking...' : 'Mark as Read'}
                        </button>
                      </div>
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
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                            {request.status.replace('_', ' ')}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedEmergencyRequest(request)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedEmergencyRequest && (
                <div className="absolute inset-0 z-50 bg-white dark:bg-gray-900 overflow-visible">
                  <div className="min-h-screen p-8 bg-white dark:bg-gray-900">
                    <div className="max-w-4xl mx-auto">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Emergency Request</p>
                          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">{selectedEmergencyRequest.emergency_type}</h1>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedEmergencyRequest(null)}
                          className="w-12 h-12 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-2xl font-bold flex items-center justify-center"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Main Content Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* Left Column - Pet & Contact Info */}
                        <div className="space-y-6">
                          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Pet Information</h2>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Pet Name</p>
                                <p className="text-gray-900 dark:text-gray-100 font-medium text-lg">{selectedEmergencyRequest.pets?.name || 'Unknown'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Owner</p>
                                <p className="text-gray-900 dark:text-gray-100">{selectedEmergencyRequest.users ? `${selectedEmergencyRequest.users.first_name} ${selectedEmergencyRequest.users.last_name}` : 'Unknown'}</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Contact Information</h2>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Contact Info</p>
                                <p className="text-gray-900 dark:text-gray-100 break-all">{selectedEmergencyRequest.contact_info || '-'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Submitted</p>
                                <p className="text-gray-900 dark:text-gray-100">{formatDate(selectedEmergencyRequest.created_at)}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Column - Request Info */}
                        <div className="space-y-6">
                          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Request Details</h2>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                                <p className="text-gray-900 dark:text-gray-100 font-medium text-lg">{selectedEmergencyRequest.emergency_type}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                                <div className="mt-2">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400">
                                    {selectedEmergencyRequest.status.replace('_', ' ')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Full Description */}
                      <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Description</h2>
                        <div className="prose dark:prose-invert max-w-none">
                          <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed text-base">{selectedEmergencyRequest.description || 'No description provided'}</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-between gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <button
                          type="button"
                          onClick={() => setSelectedEmergencyRequest(null)}
                          className="px-6 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition font-semibold"
                        >
                          Close
                        </button>
                        <div className="flex gap-3">
                          {selectedEmergencyRequest.status !== 'in_progress' && (
                            <button
                              type="button"
                              onClick={() => {
                                handleUpdateEmergencyStatus(selectedEmergencyRequest.emergency_id, 'in_progress');
                                setUpdatingEmergencyId(selectedEmergencyRequest.emergency_id);
                              }}
                              disabled={updatingEmergencyId === selectedEmergencyRequest.emergency_id}
                              className="px-6 py-3 rounded-lg bg-yellow-300 dark:bg-yellow-500 text-gray-900 dark:text-gray-100 hover:bg-yellow-400 dark:hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
                            >
                              {updatingEmergencyId === selectedEmergencyRequest.emergency_id ? 'Updating...' : 'In Progress'}
                            </button>
                          )}
                          {selectedEmergencyRequest.status !== 'resolved' && (
                            <button
                              type="button"
                              onClick={() => {
                                handleUpdateEmergencyStatus(selectedEmergencyRequest.emergency_id, 'resolved');
                                setUpdatingEmergencyId(selectedEmergencyRequest.emergency_id);
                              }}
                              disabled={updatingEmergencyId === selectedEmergencyRequest.emergency_id}
                              className="px-6 py-3 rounded-lg bg-green-500 dark:bg-green-600 text-white hover:bg-green-600 dark:hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
                            >
                              {updatingEmergencyId === selectedEmergencyRequest.emergency_id ? 'Updating...' : 'Resolve'}
                            </button>
                          )}
                          {selectedEmergencyRequest.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => {
                                handleUpdateEmergencyStatus(selectedEmergencyRequest.emergency_id, 'cancelled');
                                setUpdatingEmergencyId(selectedEmergencyRequest.emergency_id);
                              }}
                              disabled={updatingEmergencyId === selectedEmergencyRequest.emergency_id}
                              className="px-6 py-3 rounded-lg bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
                            >
                              {updatingEmergencyId === selectedEmergencyRequest.emergency_id ? 'Updating...' : 'Cancel'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <ReviewManagement />
          )}

          {activeTab === 'user-management' && (
            <AdminUserManagement />
          )}

          {activeTab === 'pet-management' && (
            <AdminPetManagement />
          )}
        </div>
      </main>
    </div>
  );
}
