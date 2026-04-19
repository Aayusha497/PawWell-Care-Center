import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getUserPets, checkAvailability, createBooking, getUserBookings } from '../../services/api';
import booking from "../../assets/booking.png";

interface Pet {
  pet_id: number;
  name: string;
  breed: string;
  photo: string;
}

interface BookingData {
  pet_id: number | string;
  service_type: string;
  start_date: string;
  end_date: string;
  requires_pickup: boolean;
  pickup_address: string;
  pickup_time: string;
  dropoff_address: string;
  dropoff_time: string;
  same_address: boolean;
}

const SERVICE_TYPES = [
  'Pet Sitting',
  'Pet Boarding',
  'Grooming'
];

const TIME_SLOTS = [
  'Morning 8-12',
  'Afternoon 12-4',
  'Evening 4-8'
];

const SERVICE_PRICING = {
  'Pet Sitting': { price: 3250, unit: 'per day' },
  'Pet Boarding': { price: 2600, unit: 'per night' },
  'Grooming': { price: 3900, unit: 'flat rate' }
};

interface BookingPageProps {
  onBack: () => void;
  onLogout?: () => void;
  userFullName?: string;
  onActivityLog?: () => void;
  onNavigate?: (page: string) => void;
  onSettings?: () => void;
}

const BookingPage: React.FC<BookingPageProps> = ({ onBack, onLogout, userFullName, onActivityLog, onNavigate, onSettings }) => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const [formData, setFormData] = useState<BookingData>({
    pet_id: '',
    service_type: '',
    start_date: '',
    end_date: '',
    requires_pickup: false,
    pickup_address: '',
    pickup_time: '',
    dropoff_address: '',
    dropoff_time: '',
    same_address: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availabilityMessage, setAvailabilityMessage] = useState('');

  useEffect(() => {
    fetchPets();
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, start_date: today, end_date: today }));
  }, []);

  const fetchPets = async () => {
    try {
      setLoading(true);
      const response = await getUserPets();
      const petData = response.data || response.pets || response || [];
      setPets(Array.isArray(petData) ? petData : []);
    } catch (error: any) {
      console.error('Error fetching pets:', error);
      toast.error('Failed to load pets');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'radio') {
      const radioValue = (e.target as HTMLInputElement).value === 'true';
      setFormData(prev => ({ ...prev, [name]: radioValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error for this field
    setErrors(prev => ({ ...prev, [name]: '' }));
    setAvailabilityMessage('');

    // Handle service type change
    if (name === 'service_type') {
      if (value === 'Pet Boarding') {
        // Keep separate dates for boarding
      } else {
        // For single-day services, end_date = start_date
        setFormData(prev => ({ ...prev, end_date: prev.start_date }));
      }
    }

    // Handle start date change
    if (name === 'start_date') {
      if (formData.service_type !== 'Pet Boarding') {
        setFormData(prev => ({ ...prev, end_date: value }));
      }
    }

    // Handle same address toggle
    if (name === 'same_address' && value === 'true') {
      setFormData(prev => ({ ...prev, dropoff_address: prev.pickup_address }));
    }
  };

  const handleCheckAvailability = async () => {
    if (!formData.service_type || !formData.start_date) {
      toast.error('Please select service type and date');
      return;
    }

    try {
      setCheckingAvailability(true);
      const data: any = {
        service_type: formData.service_type,
        start_date: formData.start_date
      };

      if (formData.service_type === 'Pet Boarding') {
        if (!formData.end_date) {
          toast.error('Please select end date for boarding');
          return;
        }
        data.end_date = formData.end_date;
      }

      const response = await checkAvailability(data);
      
      if (response.available) {
        setAvailabilityMessage(`✓ Available! ${response.remaining ? `${response.remaining} spots remaining` : ''}`);
        toast.success(response.message);
      } else {
        setAvailabilityMessage(`✗ ${response.message}`);
        toast.error(response.message);
      }
    } catch (error: any) {
      console.error('Error checking availability:', error);
      toast.error(error.message || 'Failed to check availability');
      setAvailabilityMessage('✗ Error checking availability');
    } finally {
      setCheckingAvailability(false);
    }
  };

  const calculateEstimatedCost = () => {
    if (!formData.service_type || !formData.start_date) return 0;

    if (formData.service_type === 'Grooming') {
      return 3500;
    } else if (formData.service_type === 'Daycation/Pet Sitting') {
      return 2000;
    } else if (formData.service_type === 'Pet Boarding') {
      if (!formData.end_date) return 0;
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return nights * 2000;
    }
    return 0;
  };

  const checkBookingConflict = async (): Promise<string> => {
    try {
      const userBookings = await getUserBookings();
      const bookings = Array.isArray(userBookings) ? userBookings : userBookings?.data || [];

      // Helper function to extract date as YYYY-MM-DD string without timezone conversion
      const extractDateString = (dateInput: string | Date): string => {
        if (typeof dateInput === 'string') {
          // If already a date string like "2026-04-10", return as-is
          if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return dateInput;
          }
          // If it's a full ISO string or other format, parse it
          const date = new Date(dateInput);
          const year = date.getUTCFullYear();
          const month = String(date.getUTCMonth() + 1).padStart(2, '0');
          const day = String(date.getUTCDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
        // Handle Date object
        const year = dateInput.getUTCFullYear();
        const month = String(dateInput.getUTCMonth() + 1).padStart(2, '0');
        const day = String(dateInput.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // Check if there's a booking for the same pet on the same date with the same service type
      const conflict = bookings.some((existingBooking: any) => {
        // Only check non-cancelled bookings - check both status fields
        const isCancelled = existingBooking.status === 'cancelled' || existingBooking.booking_status === 'cancelled';
        if (isCancelled) {
          return false;
        }

        // Normalize values for comparison
        const existingPetId = Number(existingBooking.pet_id);
        const newPetId = Number(formData.pet_id);
        const existingServiceType = (existingBooking.service_type || '').trim();
        const newServiceType = (formData.service_type || '').trim();

        // Check if same pet and same service type
        if (existingPetId !== newPetId || existingServiceType !== newServiceType) {
          return false;
        }

        const existingStart = extractDateString(existingBooking.start_date);
        const newStart = formData.start_date;

        // For Pet Boarding, check date ranges for overlap
        if (newServiceType === 'Pet Boarding' && existingBooking.end_date) {
          const existingEnd = extractDateString(existingBooking.end_date);
          const newEnd = formData.end_date;
          
          // Check if date ranges overlap
          return !(newEnd < existingStart || newStart > existingEnd);
        }

        // For Daycation/Pet Sitting and Grooming, check if same date
        return existingStart === newStart;
      });

      if (conflict) {
        return `This pet already has a booking for ${formData.service_type} on the selected date.`;
      }

      return '';
    } catch (error) {
      console.error('Error checking booking conflict:', error);
      // Don't block booking on error, just log it
      return '';
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.pet_id) {
      newErrors.pet_id = 'Please select a pet';
    }

    if (!formData.service_type) {
      newErrors.service_type = 'Please select a service type';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Please select a date';
    }

    // Check past date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(formData.start_date);
    if (selectedDate < today) {
      newErrors.start_date = 'Cannot select past dates';
    }

    if (formData.service_type === 'Pet Boarding') {
      if (!formData.end_date) {
        newErrors.end_date = 'Please select end date for boarding';
      } else {
        const endDate = new Date(formData.end_date);
        if (endDate <= selectedDate) {
          newErrors.end_date = 'End date must be after start date';
        }
      }
    }

    if (formData.requires_pickup) {
      if (!formData.pickup_address.trim()) {
        newErrors.pickup_address = 'Pickup address is required';
      }
      if (!formData.pickup_time) {
        newErrors.pickup_time = 'Pickup time is required';
      }
      if (!formData.dropoff_time) {
        newErrors.dropoff_time = 'Drop-off time is required';
      }
      if (!formData.same_address && !formData.dropoff_address.trim()) {
        newErrors.dropoff_address = 'Drop-off address is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);

      // Check for booking conflicts
      const conflictMessage = await checkBookingConflict();
      if (conflictMessage) {
        toast.error(conflictMessage);
        setSubmitting(false);
        return;
      }

      const bookingData: any = {
        pet_id: formData.pet_id,
        service_type: formData.service_type,
        start_date: formData.start_date,
        requires_pickup: formData.requires_pickup
      };

      if (formData.service_type === 'Pet Boarding') {
        bookingData.end_date = formData.end_date;
      }

      if (formData.requires_pickup) {
        bookingData.pickup_address = formData.pickup_address;
        bookingData.pickup_time = formData.pickup_time;
        bookingData.dropoff_address = formData.same_address ? formData.pickup_address : formData.dropoff_address;
        bookingData.dropoff_time = formData.dropoff_time;
      }

      const response = await createBooking(bookingData);

      toast.success(response.message || 'Booking created successfully! Awaiting admin approval.');
      
      // Reset form
      setFormData({
        pet_id: '',
        service_type: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        requires_pickup: false,
        pickup_address: '',
        pickup_time: '',
        dropoff_address: '',
        dropoff_time: '',
        same_address: true
      });
      setAvailabilityMessage('');
      
      // Go back to dashboard after short delay
      setTimeout(() => {
        onBack();
      }, 1500);

    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast.error(error.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    onBack();
  };

  const handleGoToActivityLog = () => {
    if (onActivityLog) {
      onActivityLog();
    }
  };

  const estimatedCost = calculateEstimatedCost();
  const numberOfNights = formData.service_type === 'Pet Boarding' && formData.start_date && formData.end_date
    ? Math.ceil((new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const currentStep = formData.requires_pickup
    ? 2
    : formData.pet_id && formData.service_type && formData.start_date
    ? 3
    : formData.pet_id || formData.service_type || formData.start_date
    ? 1
    : 1;

  const selectedPetName = formData.pet_id
    ? pets.find(p => p.pet_id === Number(formData.pet_id))?.name || '-'
    : '-';

  const selectedDateText =
    formData.start_date && formData.service_type === 'Pet Boarding' && formData.end_date
      ? `${formData.start_date} to ${formData.end_date}`
      : formData.start_date || '-';

  const userInitials = userFullName
    ? userFullName.split(' ').map((name) => name[0]).join('').toUpperCase()
    : 'U';

  return (
    <div className="max-w-4xl mx-auto relative">
      {/* subtle background decoration */}
      <div className="absolute -top-4 -left-10 w-36 h-36 bg-[#FFEFC8] rounded-full blur-3xl opacity-70 pointer-events-none"></div>
      <div className="absolute top-64 -right-12 w-40 h-40 bg-[#FFF4DA] rounded-full blur-3xl opacity-80 pointer-events-none"></div>
      <div className="absolute bottom-40 -left-16 w-44 h-44 bg-[#FFF0CF] rounded-full blur-3xl opacity-60 pointer-events-none"></div>

      {/* subtle paw prints */}
      <div className="absolute top-12 left-0 text-2xl opacity-10 rotate-[-18deg] pointer-events-none hidden md:block">🐾</div>
      <div className="absolute top-20 left-10 text-xl opacity-10 rotate-[10deg] pointer-events-none hidden md:block">🐾</div>
      <div className="absolute bottom-16 right-4 text-2xl opacity-10 rotate-[18deg] pointer-events-none hidden md:block">🐾</div>

      {/* subtle spark lines */}
      <div className="absolute top-28 right-10 w-8 h-[3px] bg-[#EAB308] rounded-full rotate-[20deg] opacity-25 pointer-events-none hidden md:block"></div>
      <div className="absolute top-32 right-16 w-5 h-[3px] bg-[#EAB308] rounded-full rotate-[70deg] opacity-25 pointer-events-none hidden md:block"></div>
      <div className="absolute bottom-24 left-8 w-10 h-[3px] bg-[#EAB308] rounded-full rotate-[-18deg] opacity-20 pointer-events-none hidden md:block"></div>

      <div className="absolute top-0 right-0 translate-x-[110%] -translate-y-1/4 pointer-events-none hidden md:block">
        <img
          src={booking}
          alt="dog"
          className="w-56 lg:w-72 object-contain"
        />
      </div>

      {/* Header */}
      <div className="text-center mb-8 relative z-10">
        <h1 className="text-4xl font-bold mb-2 dark:text-gray-100">Book Care for Your Pet</h1>
        <p className="text-gray-600 dark:text-gray-400">Schedule trusted, comfortable, and reliable care in just a few simple steps.</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-3 md:gap-5 mb-8 relative z-10">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
            currentStep >= 1
              ? 'bg-[#EAB308] text-black'
              : 'bg-white border-2 border-[#EAB308] text-black dark:bg-gray-800 dark:text-gray-100'
          }`}>
            1
          </div>
          <span className="text-sm md:text-base font-medium text-gray-700 dark:text-gray-300">Pet & Service</span>
        </div>

        <div className="w-10 md:w-14 h-[2px] bg-[#EAB308] opacity-70 rounded-full"></div>

        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
            currentStep >= 2
              ? 'bg-[#EAB308] text-black'
              : 'bg-white border-2 border-[#EAB308] text-black dark:bg-gray-800 dark:text-gray-100'
          }`}>
            2
          </div>
          <span className="text-sm md:text-base font-medium text-gray-700 dark:text-gray-300">Pickup Details</span>
        </div>

        <div className="w-10 md:w-14 h-[2px] bg-[#EAB308] opacity-70 rounded-full"></div>

        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
            currentStep >= 3
              ? 'bg-[#EAB308] text-black'
              : 'bg-white border-2 border-[#EAB308] text-black dark:bg-gray-800 dark:text-gray-100'
          }`}>
            3
          </div>
          <span className="text-sm md:text-base font-medium text-gray-700 dark:text-gray-300">Review</span>
        </div>
      </div>

      {/* Live Summary Mini Card */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-[#F4D878] shadow-sm px-5 py-4 mb-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            {/* <p className="text-xs uppercase tracking-[0.2em] text-[#D4A017] font-semibold mb-1">
              Live Booking Summary
            </p> */}
            <h3 className="text-lg font-semibold text-black dark:text-gray-100">
              Your selection updates as you book
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="bg-[#FFF9F0] dark:bg-gray-700 rounded-xl px-4 py-3">
              <p className="text-gray-500 dark:text-gray-300 text-xs mb-1">Pet</p>
              <p className="font-semibold text-black dark:text-gray-100 truncate">{selectedPetName}</p>
            </div>

            <div className="bg-[#FFF9F0] dark:bg-gray-700 rounded-xl px-4 py-3">
              <p className="text-gray-500 dark:text-gray-300 text-xs mb-1">Service</p>
              <p className="font-semibold text-black dark:text-gray-100 truncate">{formData.service_type || '-'}</p>
            </div>

            <div className="bg-[#FFF9F0] dark:bg-gray-700 rounded-xl px-4 py-3">
              <p className="text-gray-500 dark:text-gray-300 text-xs mb-1">Date</p>
              <p className="font-semibold text-black dark:text-gray-100 truncate">{selectedDateText}</p>
            </div>

            <div className="bg-[#FFF9F0] dark:bg-gray-700 rounded-xl px-4 py-3">
              <p className="text-gray-500 dark:text-gray-300 text-xs mb-1">Estimated Cost</p>
              <p className="font-semibold text-[#D4A017]">NPR {estimatedCost.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Service Type and Date Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md mb-6">
          {/* Select Pet */}
          <div className="mb-6">
            <label className="block text-lg font-semibold mb-2 dark:text-gray-100">Select Pet *</label>
            {loading ? (
              <div className="text-gray-500 dark:text-gray-400">Loading pets...</div>
            ) : pets.length === 0 ? (
              <div className="text-red-500 dark:text-red-400">No pets found. Please add a pet first.</div>
            ) : (
              <select
                name="pet_id"
                value={formData.pet_id}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-lg border ${errors.pet_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:outline-none focus:ring-2 focus:ring-[#FA9884] dark:bg-gray-700 dark:text-gray-100`}
              >
                <option value="" disabled>Select your pet</option>
                {pets.map(pet => (
                  <option key={pet.pet_id} value={pet.pet_id}>
                    {pet.name} - {pet.breed}
                  </option>
                ))}
              </select>
            )}
            {errors.pet_id && <p className="text-red-500 text-sm mt-1">{errors.pet_id}</p>}
          </div>

          {/* Select Service Type */}
          <div className="mb-6">
            <label className="block text-lg font-semibold mb-2 dark:text-gray-100">Select Service Type *</label>
            <select
              name="service_type"
              value={formData.service_type}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 rounded-lg border ${errors.service_type ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:outline-none focus:ring-2 focus:ring-[#FA9884] dark:bg-gray-700 dark:text-gray-100`}
            >
              <option value="" disabled>Select Service Type</option>
              {SERVICE_TYPES.map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
            {errors.service_type && <p className="text-red-500 text-sm mt-1">{errors.service_type}</p>}
            {formData.service_type && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Pricing: NPR {SERVICE_PRICING[formData.service_type as keyof typeof SERVICE_PRICING].price} {SERVICE_PRICING[formData.service_type as keyof typeof SERVICE_PRICING].unit}
              </p>
            )}
          </div>

          {/* Select Date */}
          <label className="block text-lg font-semibold mb-2 dark:text-gray-100">Select Date *</label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {formData.service_type === 'Pet Boarding'
                ? 'Choose your preferred drop-off and pick-up date.'
                : 'Choose your preferred service date.'}
            </p>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                  {formData.service_type === 'Pet Boarding' ? 'Start Date ' : 'Service Date'}
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-3 rounded-lg border ${errors.start_date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:outline-none focus:ring-2 focus:ring-[#FA9884] dark:bg-gray-700 dark:text-gray-100`}
                />
                {errors.start_date && <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>}
              </div>

              {formData.service_type === 'Pet Boarding' && (
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1 dark:text-gray-200">End Date </label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    min={formData.start_date || new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-3 rounded-lg border ${errors.end_date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:outline-none focus:ring-2 focus:ring-[#FA9884] dark:bg-gray-700 dark:text-gray-100`}
                  />
                  {errors.end_date && <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>}
                </div>
              )}
            </div>

            {/* Check Availability Button */}
            <button
              type="button"
              onClick={handleCheckAvailability}
              disabled={checkingAvailability || !formData.service_type || !formData.start_date}
              className="mt-4 px-6 py-2 bg-[#FFE4A3] text-gray-800 rounded-lg font-semibold hover:bg-[#FFD97D] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkingAvailability ? 'Checking...' : 'Check Availability'}
            </button>
            
            {availabilityMessage && (
              <p className={`mt-2 text-sm font-medium ${availabilityMessage.includes('✓') ? 'text-green-600' : 'text-red-600'}`}>
                {availabilityMessage}
              </p>
            )}
          </div>

        {/* Pickup & Drop-off Details */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md mb-6">
          <h3 className="text-xl font-semibold mb-4 dark:text-gray-100">Pickup & Drop-off Service</h3>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Do you require pickup and drop-off service?</p>
            <div className="flex gap-6">
              <label className="flex items-center dark:text-gray-200">
                <input
                  type="radio"
                  name="requires_pickup"
                  value="true"
                  checked={formData.requires_pickup === true}
                  onChange={handleInputChange}
                  className="mr-2 accent-[#FA9884]"
                />
                <span>Yes</span>
              </label>
              <label className="flex items-center dark:text-gray-200">
                <input
                  type="radio"
                  name="requires_pickup"
                  value="false"
                  checked={formData.requires_pickup === false}
                  onChange={handleInputChange}
                  className="mr-2 accent-[#FA9884]"
                />
                <span>No</span>
              </label>
            </div>
          </div>

          {formData.requires_pickup && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-200">Pickup Time *</label>
                  <select
                    name="pickup_time"
                    value={formData.pickup_time}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-lg border ${errors.pickup_time ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:outline-none focus:ring-2 focus:ring-[#FA9884] dark:bg-gray-700 dark:text-gray-100`}
                  >
                    <option value="" disabled style={{ color: '#999' }}>Select time</option>
                    {TIME_SLOTS.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                  {errors.pickup_time && <p className="text-red-500 text-sm mt-1">{errors.pickup_time}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-200">Drop-off Time *</label>
                  <select
                    name="dropoff_time"
                    value={formData.dropoff_time}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-lg border ${errors.dropoff_time ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:outline-none focus:ring-2 focus:ring-[#FA9884] dark:bg-gray-700 dark:text-gray-100`}
                  >
                    <option value="" disabled style={{ color: '#999' }}>Select time</option>
                    {TIME_SLOTS.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                  {errors.dropoff_time && <p className="text-red-500 text-sm mt-1">{errors.dropoff_time}</p>}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 dark:text-gray-200">Pickup Address *</label>
                <input
                  type="text"
                  name="pickup_address"
                  value={formData.pickup_address}
                  onChange={handleInputChange}
                  placeholder="eg: Kamalpokkari"
                  className={`w-full px-4 py-3 rounded-lg border ${errors.pickup_address ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:outline-none focus:ring-2 focus:ring-[#FA9884] dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400`}
                />
                {errors.pickup_address && <p className="text-red-500 text-sm mt-1">{errors.pickup_address}</p>}
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium mb-2 dark:text-gray-200">Drop-off Address</p>
                <div className="flex gap-6 mb-3">
                  <label className="flex items-center dark:text-gray-200">
                    <input
                      type="radio"
                      name="same_address"
                      value="true"
                      checked={formData.same_address === true}
                      onChange={handleInputChange}
                      className="mr-2 accent-[#FA9884]"
                    />
                    <span>Same as pickup</span>
                  </label>
                  <label className="flex items-center dark:text-gray-200">
                    <input
                      type="radio"
                      name="same_address"
                      value="false"
                      checked={formData.same_address === false}
                      onChange={handleInputChange}
                      className="mr-2 accent-[#FA9884]"
                    />
                    <span>Different address</span>
                  </label>
                </div>

                {!formData.same_address && (
                  <>
                    <input
                      type="text"
                      name="dropoff_address"
                      value={formData.dropoff_address}
                      onChange={handleInputChange}
                      placeholder="Enter drop-off address"
                      className={`w-full px-4 py-3 rounded-lg border ${errors.dropoff_address ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:outline-none focus:ring-2 focus:ring-[#FA9884] dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400`}
                    />
                    {errors.dropoff_address && <p className="text-red-500 text-sm mt-1">{errors.dropoff_address}</p>}
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Booking Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md mb-6">
          <h3 className="text-xl font-semibold mb-3 dark:text-gray-100">Booking Summary</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Review your booking details before confirming.</p>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between py-2 border-b dark:border-gray-700">
              <span className="font-medium dark:text-gray-200">Pet:</span>
              <span className="text-gray-700 dark:text-gray-300">
                {formData.pet_id ? pets.find(p => p.pet_id === Number(formData.pet_id))?.name || '-' : '-'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b dark:border-gray-700">
              <span className="font-medium dark:text-gray-200">Service:</span>
              <span className="text-gray-700 dark:text-gray-300">{formData.service_type || '-'}</span>
            </div>
            <div className="flex justify-between py-2 border-b dark:border-gray-700">
              <span className="font-medium dark:text-gray-200">Date:</span>
              <span className="text-gray-700 dark:text-gray-300">
                {formData.start_date && formData.service_type === 'Pet Boarding' && formData.end_date
                  ? `${formData.start_date} to ${formData.end_date} (${numberOfNights} night${numberOfNights !== 1 ? 's' : ''})`
                  : formData.start_date || '-'}
              </span>
            </div>
            {formData.requires_pickup && formData.pickup_time && formData.dropoff_time && (
              <div className="flex justify-between py-2 border-b dark:border-gray-700">
                <span className="font-medium dark:text-gray-200">Pickup/Drop-off:</span>
                <span className="text-gray-700 dark:text-gray-300">
                  {formData.pickup_time} / {formData.dropoff_time}
                </span>
              </div>
            )}
            {formData.requires_pickup && formData.pickup_address && (
              <div className="flex justify-between py-2 border-b dark:border-gray-700">
                <span className="font-medium dark:text-gray-200">Address:</span>
                <span className="text-gray-700 dark:text-gray-300">{formData.pickup_address}</span>
              </div>
            )}
            <div className="flex justify-between py-3 bg-[#FFF9F5] dark:bg-gray-700 -mx-6 px-6 rounded-lg mt-4">
              <span className="font-semibold text-lg dark:text-gray-100">Total Estimated Cost:</span>
              <span className="font-bold text-lg text-[#FA9884]">NPR {estimatedCost.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting || pets.length === 0}
              className="flex-1 bg-[#FFE4A3] text-gray-800 py-3 rounded-lg text-lg font-semibold hover:bg-[#FFD97D] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Confirming...' : 'Confirm Booking'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={submitting}
              className="flex-1 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-3 rounded-lg text-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BookingPage;