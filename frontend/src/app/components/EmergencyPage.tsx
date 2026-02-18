import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { createEmergencyRequest, getMyEmergencyRequests, getUserPets, getProfile } from '../../services/api';
import '../../pages/About.css';

interface EmergencyPageProps {
  onBack?: () => void;
  onBook?: () => void;
  onActivityLog?: () => void;
  onTimeline?: () => void;
  onAbout?: () => void;
  onContact?: () => void;
  onLogout?: () => void;
  onEmergency?: () => void;
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

const isDesktop = () => typeof window !== 'undefined' && window.innerWidth >= 768;

export default function EmergencyPage({
  onBack,
  onBook,
  onActivityLog,
  onTimeline,
  onAbout,
  onContact,
  onLogout,
  onEmergency
}: EmergencyPageProps) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [formValues, setFormValues] = useState({
    pet_id: '',
    emergency_type: '',
    description: '',
    phone_number: '',
    location: ''
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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

        if (profileResponse?.user?.phoneNumber) {
          setFormValues((prev) => ({
            ...prev,
            phone_number: profileResponse.user.phoneNumber ?? ''
          }));
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
    if (isDesktop()) {
      event.preventDefault();
      setShowCallModal(true);
    }
  };

  const statusSteps = ['pending', 'in_progress', 'resolved'];

  return (
    <div className="min-h-screen bg-[#E85B5B]">
      <nav className="bg-white/90 border-b px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐾</span>
            </div>
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 rounded-full bg-[#FFE4A3] font-medium"
              >
                Home
              </button>
              <button type="button" onClick={onBook} className="px-4 py-2 hover:bg-gray-100 rounded-full">
                Booking
              </button>
              <button type="button" onClick={onActivityLog} className="px-4 py-2 hover:bg-gray-100 rounded-full">
                Activity Log
              </button>
              <button type="button" onClick={onTimeline} className="px-4 py-2 hover:bg-gray-100 rounded-full">
                Timeline
              </button>
              <button type="button" onClick={onAbout} className="px-4 py-2 hover:bg-gray-100 rounded-full">
                About
              </button>
              <button type="button" onClick={onContact} className="px-4 py-2 hover:bg-gray-100 rounded-full">
                Contact
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 bg-[#FF6B6B] text-white rounded-full text-sm flex items-center gap-2">
              <span>📞</span> Emergency
            </button>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-4 py-2.5 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12 text-white">
        <div className="flex flex-col items-center text-center">
          <div className="text-6xl mb-4">🚨</div>
          <h1 className="text-4xl font-bold mb-2">Emergency</h1>
          <p className="text-lg text-white/90 mb-6">
            If your pet needs immediate medical attention, call us now.
          </p>
          <a
            href="tel:+9779703812594"
            onClick={handleCallClick}
            className="bg-white text-gray-900 px-10 py-3 rounded-xl font-semibold flex items-center gap-3 shadow-lg"
          >
            <span>📞</span> Call Now
          </a>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 mt-12">
          <div className="bg-white text-gray-900 rounded-3xl p-8 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Emergency Guidance</h2>
            <ul className="space-y-3 text-gray-700">
              <li>Stay calm and assess your pet's condition.</li>
              <li>If bleeding, apply direct pressure with clean cloths.</li>
              <li>Do not attempt to move an injured animal unnecessarily.</li>
              <li>Keep your pet warm with a blanket.</li>
            </ul>
            <div className="mt-6 text-2xl font-bold text-red-600">Emergency line: +977-9703712593</div>
          </div>

          <div className="bg-white text-gray-900 rounded-3xl p-8 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Submit Emergency Request</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Pet *</label>
                <select
                  value={formValues.pet_id}
                  onChange={handleChange('pet_id')}
                  onBlur={handleBlur('pet_id')}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                >
                  <option value="">Select your pet</option>
                  {pets.map((pet) => (
                    <option key={pet.pet_id} value={pet.pet_id}>
                      {pet.name}
                    </option>
                  ))}
                </select>
                {touched.pet_id && errors.pet_id && (
                  <p className="text-sm text-red-600 mt-1">{errors.pet_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Emergency Type *</label>
                <select
                  value={formValues.emergency_type}
                  onChange={handleChange('emergency_type')}
                  onBlur={handleBlur('emergency_type')}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                >
                  <option value="">Select type</option>
                  {EMERGENCY_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {touched.emergency_type && errors.emergency_type && (
                  <p className="text-sm text-red-600 mt-1">{errors.emergency_type}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <textarea
                  rows={4}
                  value={formValues.description}
                  onChange={handleChange('description')}
                  onBlur={handleBlur('description')}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  placeholder="Describe what happened"
                />
                {touched.description && errors.description && (
                  <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Number</label>
                  <input
                    type="tel"
                    value={formValues.phone_number}
                    onChange={handleChange('phone_number')}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    type="text"
                    value={formValues.location}
                    onChange={handleChange('location')}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#111827] text-white py-3 rounded-xl font-semibold"
              >
                {submitting ? 'Submitting...' : 'Submit Emergency Request'}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 bg-white text-gray-900 rounded-3xl p-8 shadow-xl">
          <h2 className="text-xl font-bold mb-4">Your Emergency Requests</h2>
          {loading ? (
            <p className="text-gray-600">Loading...</p>
          ) : requests.length === 0 ? (
            <p className="text-gray-600">No emergency requests yet.</p>
          ) : (
            <div className="space-y-6">
              {requests.map((request) => (
                <div key={request.emergency_id} className="border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold">{request.pets?.name || 'Pet'}</p>
                      <p className="text-sm text-gray-600">{request.emergency_type}</p>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-gray-100">
                      {request.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {new Date(request.created_at).toLocaleString()}
                  </p>
                  <div className="flex items-center gap-3">
                    {statusSteps.map((step) => {
                      const isActive = request.status === step || (request.status === 'resolved' && step !== 'pending');
                      return (
                        <div key={step} className={`flex-1 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-200'}`} />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showCallModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-gray-900">
            <h3 className="text-lg font-semibold mb-2">Call Emergency Line</h3>
            <p className="text-sm text-gray-600 mb-4">Ready to place the call?</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCallModal(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-700"
              >
                Cancel
              </button>
              <a
                href="tel:+9779703812594"
                className="flex-1 px-4 py-2 rounded-lg bg-[#E85B5B] text-white text-center"
                onClick={() => setShowCallModal(false)}
              >
                Call Now
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
