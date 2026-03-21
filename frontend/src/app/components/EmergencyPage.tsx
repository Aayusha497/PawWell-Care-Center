import { useEffect, useMemo, useState, useRef } from 'react';
import { toast } from 'sonner';
import { createEmergencyRequest, getMyEmergencyRequests, getUserPets, getProfile } from '../../services/api';
import { Settings, User as UserIcon, LogOut } from 'lucide-react';
import NotificationBell from '../../components/NotificationBell';
import '../../pages/About.css';

interface User {
  id: string;
  email: string;
  fullName: string;
  profilePicture?: string;
}

interface EmergencyPageProps {
  onBack?: () => void;
  onBook?: () => void;
  onActivityLog?: () => void;
  onTimeline?: () => void;
  onAbout?: () => void;
  onContact?: () => void;
  onLogout?: () => void;
  onEmergency?: () => void;
  onSettings?: () => void;
  onProfile?: () => void;
  user?: User | null;
}

interface Pet {
  pet_id: number;
  name: string;
}

interface EmergencyRequest {
  emergency_id: number;
  emergency_type: string;
  description?: string | null;
  contact_info: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'cancelled';
  created_at: string;
  pets?: Pet;
}

const EMERGENCY_TYPES = [
  'Injury',
  'Breathing Issue',
  'Poisoning',
  'Seizure',
  'Vomiting/Diarrhea',
  'Other'
];

export default function EmergencyPage({
  onBack,
  onBook,
  onActivityLog,
  onTimeline,
  onAbout,
  onContact,
  onLogout,
  onEmergency,
  onSettings,
  onProfile,
  user
}: EmergencyPageProps) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const [formValues, setFormValues] = useState({
    pet_id: '',
    emergency_type: '',
    description: '',
    phone_number: '',
    location: ''
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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
    const fetchData = async () => {
      try {
        const [petResponse, requestResponse, profileResponse] = await Promise.all([
          getUserPets(),
          getMyEmergencyRequests(),
          getProfile()
        ]);

        const petList = petResponse.pets || petResponse.data || [];
        setPets(Array.isArray(petList) ? petList : []);

        const requestList = requestResponse.data || [];
        setRequests(Array.isArray(requestList) ? requestList : []);

        if (profileResponse?.user) {
          setUserProfile(profileResponse.user);
          if (profileResponse.user.phoneNumber) {
            setFormValues((prev) => ({
              ...prev,
              phone_number: profileResponse.user.phoneNumber ?? ''
            }));
          }
        }
      } catch (error: any) {
        console.error('Error loading emergency data:', error);
        toast.error('Failed to load emergency information.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const errors = useMemo(() => {
    const nextErrors: Record<string, string> = {};

    if (!formValues.pet_id) {
      nextErrors.pet_id = 'Please select a pet.';
    }

    if (!formValues.emergency_type) {
      nextErrors.emergency_type = 'Please choose an emergency type.';
    }

    if (!formValues.description.trim() || formValues.description.trim().length < 10) {
      nextErrors.description = 'Please enter at least 10 characters.';
    }

    return nextErrors;
  }, [formValues]);

  const handleBlur = (field: string) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleChange = (field: keyof typeof formValues) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({ pet_id: true, emergency_type: true, description: true });

    if (Object.keys(errors).length > 0) {
      toast.error('Please fix the errors before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await createEmergencyRequest({
        pet_id: Number(formValues.pet_id),
        emergency_type: formValues.emergency_type,
        description: formValues.description.trim(),
        phone_number: formValues.phone_number.trim() || undefined,
        location: formValues.location.trim() || undefined
      });

      toast.success('Emergency request submitted.');
      setFormValues({
        pet_id: '',
        emergency_type: '',
        description: '',
        phone_number: formValues.phone_number,
        location: ''
      });

      if (response?.data) {
        setRequests((prev) => [response.data, ...prev]);
      } else {
        const refreshed = await getMyEmergencyRequests();
        setRequests(refreshed.data || []);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit emergency request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCallClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    // Open WhatsApp chat in a new tab
    event.preventDefault();
    window.open('https://wa.me/9779703712593', '_blank');
  };

  const statusSteps = ['pending', 'in_progress', 'resolved'];

  return (
    <div className="min-h-screen bg-[#E85B5B] dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button 
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
              title="Go to Dashboard"
            >
              <span className="text-2xl">🐾</span>
            </button>
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 rounded-full"
              >
                Home
              </button>
              <button type="button" onClick={onBook} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 rounded-full">
                Booking
              </button>
              <button type="button" onClick={onActivityLog} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 rounded-full">
                Activity Log
              </button>
              <button type="button" onClick={onTimeline} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 rounded-full">
                Timeline
              </button>
              <button type="button" onClick={onAbout} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 rounded-full">
                About
              </button>
              <button type="button" onClick={onContact} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 rounded-full">
                Contact
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user && <NotificationBell userId={parseInt(user.id)} />}
            <button className="px-4 py-2 bg-[#FF6B6B] dark:bg-red-700 text-white rounded-full text-sm flex items-center gap-2">
              <span>📞</span> Emergency
            </button>
            {/* Profile Dropdown */}
            {user && (
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
                        onProfile?.();
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
                    {onLogout && (
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
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12 text-white dark:text-gray-200">
        <div className="flex flex-col items-center text-center">
          <div className="text-6xl mb-4">🚨</div>
          <h1 className="text-4xl font-bold mb-2">Emergency</h1>
          <p className="text-lg text-white/90 dark:text-gray-300 mb-6">
            If your pet needs immediate medical attention, call us now.
          </p>
          <a
            href="https://wa.me/9779703812594"
            onClick={handleCallClick}
            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-10 py-3 rounded-xl font-semibold flex items-center gap-3 shadow-lg"
          >
            <span>📞</span> Call Now
          </a>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 mt-12">
          <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-3xl p-8 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Emergency Guidance</h2>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li>Stay calm and assess your pet's condition.</li>
              <li>If bleeding, apply direct pressure with clean cloths.</li>
              <li>Do not attempt to move an injured animal unnecessarily.</li>
              <li>Keep your pet warm with a blanket.</li>
            </ul>
            <div className="mt-6 text-2xl font-bold text-red-600 dark:text-red-400">Emergency line: +977-9703712593</div>
          </div>

          <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-3xl p-8 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Submit Emergency Request</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Pet *</label>
                <select
                  value={formValues.pet_id}
                  onChange={handleChange('pet_id')}
                  onBlur={handleBlur('pet_id')}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg"
                >
                  <option value="">Select your pet</option>
                  {pets.map((pet) => (
                    <option key={pet.pet_id} value={pet.pet_id}>
                      {pet.name}
                    </option>
                  ))}
                </select>
                {touched.pet_id && errors.pet_id && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.pet_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Emergency Type *</label>
                <select
                  value={formValues.emergency_type}
                  onChange={handleChange('emergency_type')}
                  onBlur={handleBlur('emergency_type')}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg"
                >
                  <option value="">Select type</option>
                  {EMERGENCY_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {touched.emergency_type && errors.emergency_type && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.emergency_type}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <textarea
                  rows={4}
                  value={formValues.description}
                  onChange={handleChange('description')}
                  onBlur={handleBlur('description')}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg"
                  placeholder="Describe what happened"
                />
                {touched.description && errors.description && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.description}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Number</label>
                  <input
                    type="tel"
                    value={formValues.phone_number}
                    onChange={handleChange('phone_number')}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    type="text"
                    value={formValues.location}
                    onChange={handleChange('location')}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#111827] dark:bg-gray-700 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Emergency Request'}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-3xl p-8 shadow-xl">
          <h2 className="text-xl font-bold mb-4">Your Emergency Requests</h2>
          {loading ? (
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          ) : requests.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No emergency requests yet.</p>
          ) : (
            <div className="space-y-6">
              {requests.map((request) => (
                <div key={request.emergency_id} className="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold">{request.pets?.name || 'Pet'}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{request.emergency_type}</p>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700">
                      {request.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {new Date(request.created_at).toLocaleString()}
                  </p>
                  <div className="flex items-center gap-3">
                    {statusSteps.map((step) => {
                      const isActive = request.status === step || (request.status === 'resolved' && step !== 'pending');
                      return (
                        <div key={step} className={`flex-1 h-2 rounded-full ${isActive ? 'bg-green-500 dark:bg-green-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
