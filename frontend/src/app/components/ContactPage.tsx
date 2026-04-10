import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { createContactMessage } from '../../services/api';
import { Settings, User as UserIcon, LogOut } from 'lucide-react';
import NotificationBell from '../../components/NotificationBell';
import Map from '../../components/Map';
import '../../pages/About.css';

interface User {
  id: string;
  email: string;
  fullName: string;
  profilePicture?: string;
}

interface ContactPageProps {
  onBack?: () => void;
  onBook?: () => void;
  onActivityLog?: () => void;
  onTimeline?: () => void;
  onAbout?: () => void;
  onEmergency?: () => void;
  onLogout?: () => void;
  onSettings?: () => void;
  onNavigate?: (page: any) => void;
  user?: User | null;
  userFullName?: string;
  hideNavbar?: boolean;
}

export default function ContactPage({
  onBack,
  onBook,
  onActivityLog,
  onTimeline,
  onAbout,
  onEmergency,
  onLogout,
  onSettings,
  onNavigate,
  user,
  userFullName,
  hideNavbar,
}: ContactPageProps) {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileDropdown]);

  const [formValues, setFormValues] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    location: '',
    subject: '',
    message: '',
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({
    fullName: false,
    email: false,
    phoneNumber: false,
    location: false,
    subject: false,
    message: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof typeof formValues) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleBlur = (field: keyof typeof formValues) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const getFieldError = (field: keyof typeof formValues): string => {
    const value = formValues[field];
    
    if (!value.trim()) {
      const fieldLabels: Record<string, string> = {
        fullName: 'Full Name',
        email: 'Email',
        phoneNumber: 'Phone Number',
        location: 'Location',
        subject: 'Subject',
        message: 'Message',
      };
      return `${fieldLabels[field]} is required`;
    }

    if (field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
    }

    if (field === 'phoneNumber') {
      const phoneRegex = /^[\d\s\-+()]{10,}$/;
      if (!phoneRegex.test(value.replace(/\s/g, ''))) {
        return 'Please enter a valid phone number (at least 10 digits)';
      }
    }

    if (field === 'fullName') {
      if (value.trim().length < 3) {
        return 'Full Name must be at least 3 characters';
      }
      // Check for numbers
      const hasNumbers = /\d/.test(value);
      if (hasNumbers) {
        return 'Full Name cannot contain numbers';
      }
      // Check for special characters (allow only letters, spaces, hyphens, and apostrophes)
      const validNameRegex = /^[a-zA-Z\s\-']+$/;
      if (!validNameRegex.test(value)) {
        return 'Full Name can only contain letters, spaces, hyphens, and apostrophes';
      }
    }

    if (field === 'subject' && value.trim().length < 5) {
      return 'Subject must be at least 5 characters';
    }

    if (field === 'subject') {
      const onlyNumbers = /^\d+$/.test(value.trim());
      if (onlyNumbers) {
        return 'Subject cannot contain only numbers';
      }
    }

    if (field === 'message' && value.trim().length < 10) {
      return 'Message must be at least 10 characters';
    }

    if (field === 'message') {
      const onlyNumbers = /^\d+$/.test(value.trim());
      if (onlyNumbers) {
        return 'Message cannot contain only numbers';
      }
    }

    return '';
  };

  const isFieldValid = (field: keyof typeof formValues): boolean => {
    return !getFieldError(field);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      fullName: true,
      email: true,
      phoneNumber: true,
      location: true,
      subject: true,
      message: true,
    });

    // Check if all fields are valid
    const allFieldsValid = (Object.keys(formValues) as Array<keyof typeof formValues>).every(field => isFieldValid(field));

    if (!allFieldsValid) {
      toast.error('Please fix the errors in the form before sending.');
      return;
    }

    try {
      setIsSubmitting(true);
      await createContactMessage({
        fullName: formValues.fullName.trim(),
        email: formValues.email.trim(),
        phoneNumber: formValues.phoneNumber.trim(),
        location: formValues.location.trim(),
        subject: formValues.subject.trim(),
        message: formValues.message.trim(),
      });
      toast.success('Message sent! We will get back to you soon.');
      setFormValues({
        fullName: '',
        email: '',
        phoneNumber: '',
        location: '',
        subject: '',
        message: '',
      });
      setTouched({
        fullName: false,
        email: false,
        phoneNumber: false,
        location: false,
        subject: false,
        message: false,
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="about-page">
      {!hideNavbar && user && (
        <nav className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-8 py-3 font-sans">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-8">
              <button 
                onClick={onBack}
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
                title="Go to Dashboard"
              >
                <span className="text-2xl">🐾</span>
              </button>
              <div className="flex items-center gap-6">
                <button 
                  onClick={onBack}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 rounded-full"
                >
                  Home
                </button>
                <button 
                  onClick={onBook}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 rounded-full"
                >
                  Booking
                </button>
                <button
                  onClick={onActivityLog}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 rounded-full"
                >
                  Activity Log
                </button>
                <button
                  onClick={onTimeline}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 rounded-full"
                >
                  Timeline
                </button>
                <button
                  onClick={onAbout}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 rounded-full"
                >
                  About
                </button>
                <button
                  className="px-4 py-2 rounded-full bg-[#FFE4A3] dark:bg-yellow-600 dark:text-white font-medium"
                >
                  Contact
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell userId={parseInt(user.id)} />
              <button
                onClick={onEmergency}
                className="px-4 py-2 bg-[#FF6B6B] dark:bg-red-700 text-white rounded-full text-sm flex items-center gap-2"
              >
                <span>📞</span> Emergency
              </button>
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
                        onSettings?.();
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
                        onLogout?.();
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
      )}
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We're here to help! Reach out to us with any questions or concerns.
          </p>
        </div>
      </div>

      <section className="about-contact">
        <div className="contact-info">
          <h2>Contact PawWell</h2>
          <p>Have a question about care, bookings, or availability? Reach out anytime.</p>
          <div className="contact-details">
            <p>📍 Kamalpokhari, City Center, Kathmandu, Nepal</p>
            <p>📞 +977-9703712593</p>
            <p>✉️ support@pawwell.com</p>
            <p>⏱️ Emergency support available 24/7</p>
          </div>
        </div>
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Your full name"
              value={formValues.fullName}
              onChange={handleChange('fullName')}
              onBlur={handleBlur('fullName')}
              className={touched.fullName && !isFieldValid('fullName') ? 'border-red-500' : ''}
            />
            {touched.fullName && !isFieldValid('fullName') && (
              <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '4px' }}>
                {getFieldError('fullName')}
              </p>
            )}
          </div>
          <div className="form-row">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={formValues.email}
              onChange={handleChange('email')}
              onBlur={handleBlur('email')}
              className={touched.email && !isFieldValid('email') ? 'border-red-500' : ''}
            />
            {touched.email && !isFieldValid('email') && (
              <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '4px' }}>
                {getFieldError('email')}
              </p>
            )}
          </div>
          <div className="form-row">
            <label>Phone Number</label>
            <input
              type="tel"
              placeholder="Your phone number"
              value={formValues.phoneNumber}
              onChange={handleChange('phoneNumber')}
              onBlur={handleBlur('phoneNumber')}
              className={touched.phoneNumber && !isFieldValid('phoneNumber') ? 'border-red-500' : ''}
            />
            {touched.phoneNumber && !isFieldValid('phoneNumber') && (
              <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '4px' }}>
                {getFieldError('phoneNumber')}
              </p>
            )}
          </div>
          <div className="form-row">
            <label>Location</label>
            <input
              type="text"
              placeholder="Your city or location"
              value={formValues.location}
              onChange={handleChange('location')}
              onBlur={handleBlur('location')}
              className={touched.location && !isFieldValid('location') ? 'border-red-500' : ''}
            />
            {touched.location && !isFieldValid('location') && (
              <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '4px' }}>
                {getFieldError('location')}
              </p>
            )}
          </div>
          <div className="form-row">
            <label>Subject</label>
            <input
              type="text"
              placeholder="How can we help?"
              value={formValues.subject}
              onChange={handleChange('subject')}
              onBlur={handleBlur('subject')}
              className={touched.subject && !isFieldValid('subject') ? 'border-red-500' : ''}
            />
            {touched.subject && !isFieldValid('subject') && (
              <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '4px' }}>
                {getFieldError('subject')}
              </p>
            )}
          </div>
          <div className="form-row">
            <label>Message</label>
            <textarea
              rows={5}
              placeholder="Tell us about your pet and your needs."
              value={formValues.message}
              onChange={handleChange('message')}
              onBlur={handleBlur('message')}
              className={touched.message && !isFieldValid('message') ? 'border-red-500' : ''}
            />
            {touched.message && !isFieldValid('message') && (
              <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '4px' }}>
                {getFieldError('message')}
              </p>
            )}
          </div>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </section>

      {/* Map Section */}
      <section className="map-section" style={{ padding: '60px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '16px', color: '#333' }}>
            Find Us Here
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
            Visit our care center at Kamalpokhari, City Center. We're open 24/7 for emergencies and happy to welcome you during regular hours.
          </p>
        </div>
        <Map height="500px" zoom={15} />
      </section>

      {/* Footer */}
      {/* <footer className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-8 text-center text-gray-600 dark:text-gray-400">
          <p>2025 PawWell. All rights reserved.</p>
        </div>
      </footer> */}
    </div>
  );
}
