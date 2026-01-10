import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getUserBookings, cancelBooking, updateBooking, checkAvailability } from '../../services/api';

interface Pet {
  pet_id: number;
  name: string;
  breed: string;
  photo: string;
}

interface Booking {
  booking_id: number;
  pet_id: number;
  service_type: string;
  start_date: string;
  end_date: string;
  number_of_days: number;
  price: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  requires_pickup: boolean;
  pickup_address?: string;
  pickup_time?: string;
  dropoff_address?: string;
  dropoff_time?: string;
  confirmation_code?: string;
  created_at: string;
  pet?: Pet;
}

const TIME_SLOTS = [
  'Morning 8-12',
  'Afternoon 12-4',
  'Evening 4-8'
];

interface ManageBookingsProps {
  onBack: () => void;
}

const ManageBookings: React.FC<ManageBookingsProps> = ({ onBack }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBooking, setEditingBooking] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [editFormData, setEditFormData] = useState({
    start_date: '',
    end_date: '',
    requires_pickup: false,
    pickup_address: '',
    pickup_time: '',
    dropoff_address: '',
    dropoff_time: '',
    same_address: true
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await getUserBookings({ upcoming: true });
      const bookingData = response.data || response.bookings || response || [];
      setBookings(Array.isArray(bookingData) ? bookingData : []);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (booking: Booking) => {
    setEditingBooking(booking.booking_id);
    setEditFormData({
      start_date: booking.start_date.split('T')[0],
      end_date: booking.end_date ? booking.end_date.split('T')[0] : booking.start_date.split('T')[0],
      requires_pickup: booking.requires_pickup,
      pickup_address: booking.pickup_address || '',
      pickup_time: booking.pickup_time || '',
      dropoff_address: booking.dropoff_address || booking.pickup_address || '',
      dropoff_time: booking.dropoff_time || '',
      same_address: booking.dropoff_address === booking.pickup_address
    });
  };

  const handleCancelEdit = () => {
    setEditingBooking(null);
    setEditFormData({
      start_date: '',
      end_date: '',
      requires_pickup: false,
      pickup_address: '',
      pickup_time: '',
      dropoff_address: '',
      dropoff_time: '',
      same_address: true
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'radio') {
      const radioValue = (e.target as HTMLInputElement).value === 'true';
      setEditFormData(prev => ({ ...prev, [name]: radioValue }));
      
      if (name === 'same_address' && radioValue) {
        setEditFormData(prev => ({ ...prev, dropoff_address: prev.pickup_address }));
      }
    } else {
      setEditFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveEdit = async (bookingId: number, serviceType: string) => {
    try {
      setSubmitting(true);

      // Validate dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(editFormData.start_date);
      if (startDate < today) {
        toast.error('Cannot select past dates');
        return;
      }

      if (serviceType === 'Pet Boarding') {
        const endDate = new Date(editFormData.end_date);
        if (endDate <= startDate) {
          toast.error('End date must be after start date');
          return;
        }
      }

      // Check availability for new dates
      const availabilityData: any = {
        service_type: serviceType,
        start_date: editFormData.start_date
      };

      if (serviceType === 'Pet Boarding') {
        availabilityData.end_date = editFormData.end_date;
      }

      const availabilityResponse = await checkAvailability(availabilityData);
      if (!availabilityResponse.available) {
        toast.error(availabilityResponse.message);
        return;
      }

      // Validate pickup details if required
      if (editFormData.requires_pickup) {
        if (!editFormData.pickup_address || !editFormData.pickup_time || !editFormData.dropoff_time) {
          toast.error('Please fill in all pickup/drop-off details');
          return;
        }
      }

      const updateData: any = {
        start_date: editFormData.start_date,
        requires_pickup: editFormData.requires_pickup
      };

      if (serviceType === 'Pet Boarding') {
        updateData.end_date = editFormData.end_date;
      }

      if (editFormData.requires_pickup) {
        updateData.pickup_address = editFormData.pickup_address;
        updateData.pickup_time = editFormData.pickup_time;
        updateData.dropoff_address = editFormData.same_address ? editFormData.pickup_address : editFormData.dropoff_address;
        updateData.dropoff_time = editFormData.dropoff_time;
      }

      await updateBooking(bookingId, updateData);
      toast.success('Booking updated successfully! Status reset to pending for admin approval.');
      
      setEditingBooking(null);
      fetchBookings();

    } catch (error: any) {
      console.error('Error updating booking:', error);
      toast.error(error.message || 'Failed to update booking');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelBooking = async (bookingId: number, status: string) => {
    // Confirm cancellation
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await cancelBooking(bookingId);
      toast.success('Booking cancelled successfully');
      fetchBookings();
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      toast.error(error.message || 'Failed to cancel booking');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateNights = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const canCancelBooking = (booking: Booking) => {
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return false;
    }
    
    if (booking.status === 'confirmed') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(booking.start_date);
      startDate.setHours(0, 0, 0, 0);
      return startDate > today;
    }

    return true; // Pending bookings can always be cancelled
  };

  const canRescheduleBooking = (booking: Booking) => {
    return booking.status !== 'completed' && booking.status !== 'cancelled';
  };

  return (
    <div className="min-h-screen bg-[#FFF9F5] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Manage Bookings</h1>
            <p className="text-gray-600">View, reschedule, or cancel your upcoming bookings</p>
          </div>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-white border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FA9884]"></div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-md">
            <p className="text-gray-500 text-lg mb-4">No upcoming bookings found</p>
            <button
              onClick={onBack}
              className="bg-[#FA9884] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#E8876F] transition"
            >
              Book a Service
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map(booking => (
              <div key={booking.booking_id} className="bg-white rounded-2xl p-6 shadow-md">
                {editingBooking === booking.booking_id ? (
                  /* Edit Mode */
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold">Reschedule Booking #{booking.confirmation_code}</h3>
                      <button
                        onClick={handleCancelEdit}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          {booking.service_type === 'Pet Boarding' ? 'Start Date' : 'Service Date'}
                        </label>
                        <input
                          type="date"
                          name="start_date"
                          value={editFormData.start_date}
                          onChange={handleInputChange}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FA9884]"
                        />
                      </div>

                      {booking.service_type === 'Pet Boarding' && (
                        <div>
                          <label className="block text-sm font-medium mb-1">End Date</label>
                          <input
                            type="date"
                            name="end_date"
                            value={editFormData.end_date}
                            onChange={handleInputChange}
                            min={editFormData.start_date || new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FA9884]"
                          />
                        </div>
                      )}
                    </div>

                    {/* Pickup/Dropoff */}
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Require pickup & drop-off?</p>
                      <div className="flex gap-6 mb-3">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="requires_pickup"
                            value="true"
                            checked={editFormData.requires_pickup === true}
                            onChange={handleInputChange}
                            className="mr-2 accent-[#FA9884]"
                          />
                          <span>Yes</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="requires_pickup"
                            value="false"
                            checked={editFormData.requires_pickup === false}
                            onChange={handleInputChange}
                            className="mr-2 accent-[#FA9884]"
                          />
                          <span>No</span>
                        </label>
                      </div>

                      {editFormData.requires_pickup && (
                        <>
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <label className="block text-sm font-medium mb-1">Pickup Time</label>
                              <select
                                name="pickup_time"
                                value={editFormData.pickup_time}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FA9884]"
                              >
                                <option value="">Select time</option>
                                {TIME_SLOTS.map(slot => (
                                  <option key={slot} value={slot}>{slot}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Drop-off Time</label>
                              <select
                                name="dropoff_time"
                                value={editFormData.dropoff_time}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FA9884]"
                              >
                                <option value="">Select time</option>
                                {TIME_SLOTS.map(slot => (
                                  <option key={slot} value={slot}>{slot}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="mb-3">
                            <label className="block text-sm font-medium mb-1">Pickup Address</label>
                            <input
                              type="text"
                              name="pickup_address"
                              value={editFormData.pickup_address}
                              onChange={handleInputChange}
                              placeholder="Enter pickup address"
                              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FA9884]"
                            />
                          </div>

                          <div className="flex gap-6 mb-2">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="same_address"
                                value="true"
                                checked={editFormData.same_address === true}
                                onChange={handleInputChange}
                                className="mr-2 accent-[#FA9884]"
                              />
                              <span className="text-sm">Same drop-off address</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="same_address"
                                value="false"
                                checked={editFormData.same_address === false}
                                onChange={handleInputChange}
                                className="mr-2 accent-[#FA9884]"
                              />
                              <span className="text-sm">Different address</span>
                            </label>
                          </div>

                          {!editFormData.same_address && (
                            <div>
                              <label className="block text-sm font-medium mb-1">Drop-off Address</label>
                              <input
                                type="text"
                                name="dropoff_address"
                                value={editFormData.dropoff_address}
                                onChange={handleInputChange}
                                placeholder="Enter drop-off address"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FA9884]"
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="flex gap-4 mt-6">
                      <button
                        onClick={() => handleSaveEdit(booking.booking_id, booking.service_type)}
                        disabled={submitting}
                        className="flex-1 bg-[#FA9884] text-white py-2 rounded-lg font-semibold hover:bg-[#E8876F] transition disabled:opacity-50"
                      >
                        {submitting ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={submitting}
                        className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex gap-4">
                        {booking.pet?.photo && (
                          <img
                            src={booking.pet.photo}
                            alt={booking.pet.name}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <h3 className="text-xl font-semibold">{booking.pet?.name}</h3>
                          <p className="text-gray-600">{booking.service_type}</p>
                          <p className="text-sm text-gray-500">Booking #{booking.confirmation_code}</p>
                        </div>
                      </div>
                      <span className={`px-4 py-1 rounded-full text-sm font-semibold ${getStatusColor(booking.status)}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-600">Date:</p>
                        <p className="font-medium">
                          {booking.service_type === 'Pet Boarding'
                            ? `${formatDate(booking.start_date)} - ${formatDate(booking.end_date)} (${calculateNights(booking.start_date, booking.end_date)} nights)`
                            : formatDate(booking.start_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Price:</p>
                        <p className="font-medium">NPR {Number(booking.price).toLocaleString()}</p>
                      </div>

                      {booking.requires_pickup && (
                        <>
                          <div>
                            <p className="text-gray-600">Pickup:</p>
                            <p className="font-medium">{booking.pickup_time} at {booking.pickup_address}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Drop-off:</p>
                            <p className="font-medium">{booking.dropoff_time} at {booking.dropoff_address}</p>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      {canRescheduleBooking(booking) && (
                        <button
                          onClick={() => handleEditClick(booking)}
                          className="flex-1 bg-[#FFE4A3] text-gray-800 py-2 rounded-lg font-semibold hover:bg-[#FFD97D] transition"
                        >
                          Reschedule
                        </button>
                      )}
                      {canCancelBooking(booking) && (
                        <button
                          onClick={() => handleCancelBooking(booking.booking_id, booking.status)}
                          className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg font-semibold hover:bg-red-200 transition"
                        >
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageBookings;
