import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getUserBookings } from '../../services/api';

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

interface BookingHistoryProps {
  onBack: () => void;
}

const BookingHistory: React.FC<BookingHistoryProps> = ({ onBack }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchPastBookings();
  }, []);

  const fetchPastBookings = async () => {
    try {
      setLoading(true);
      const response = await getUserBookings({ past: true });
      const bookingData = response.data || response.bookings || response || [];
      setBookings(Array.isArray(bookingData) ? bookingData : []);
    } catch (error: any) {
      console.error('Error fetching past bookings:', error);
      toast.error('Failed to load booking history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  return (
    <div className="min-h-screen bg-[#FFF9F5] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Booking History</h1>
            <p className="text-gray-600">View your past and completed bookings</p>
          </div>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-white border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filter === 'all'
                ? 'bg-[#FA9884] text-white'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
            }`}
          >
            All ({bookings.length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filter === 'completed'
                ? 'bg-[#FA9884] text-white'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Completed ({bookings.filter(b => b.status === 'completed').length})
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filter === 'cancelled'
                ? 'bg-[#FA9884] text-white'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Cancelled ({bookings.filter(b => b.status === 'cancelled').length})
          </button>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FA9884]"></div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-md">
            <p className="text-gray-500 text-lg mb-4">
              {filter === 'all'
                ? 'No booking history found'
                : `No ${filter} bookings found`}
            </p>
            <button
              onClick={onBack}
              className="bg-[#FA9884] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#E8876F] transition"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map(booking => (
              <div key={booking.booking_id} className="bg-white rounded-2xl p-6 shadow-md">
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

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Service Date:</p>
                    <p className="font-medium">
                      {booking.service_type === 'Pet Boarding'
                        ? `${formatDate(booking.start_date)} - ${formatDate(booking.end_date)}`
                        : formatDate(booking.start_date)}
                    </p>
                    {booking.service_type === 'Pet Boarding' && (
                      <p className="text-xs text-gray-500">
                        ({calculateNights(booking.start_date, booking.end_date)} nights)
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-gray-600 mb-1">Price Paid:</p>
                    <p className="font-medium text-[#FA9884]">NPR {Number(booking.price).toLocaleString()}</p>
                  </div>

                  <div>
                    <p className="text-gray-600 mb-1">Booked On:</p>
                    <p className="font-medium">{formatDate(booking.created_at)}</p>
                  </div>

                  {booking.requires_pickup && (
                    <>
                      <div>
                        <p className="text-gray-600 mb-1">Pickup:</p>
                        <p className="font-medium text-sm">{booking.pickup_time}</p>
                        <p className="text-xs text-gray-500">{booking.pickup_address}</p>
                      </div>

                      <div>
                        <p className="text-gray-600 mb-1">Drop-off:</p>
                        <p className="font-medium text-sm">{booking.dropoff_time}</p>
                        <p className="text-xs text-gray-500">{booking.dropoff_address}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Additional Info for Completed Bookings */}
                {booking.status === 'completed' && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-green-600 font-medium">✓ Service completed successfully</p>
                  </div>
                )}

                {booking.status === 'cancelled' && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-red-600 font-medium">✗ Booking was cancelled</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {!loading && bookings.length > 0 && (
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 text-center shadow-md">
              <p className="text-2xl font-bold text-[#FA9884]">{bookings.length}</p>
              <p className="text-sm text-gray-600">Total Bookings</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-md">
              <p className="text-2xl font-bold text-blue-600">
                {bookings.filter(b => b.status === 'completed').length}
              </p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-md">
              <p className="text-2xl font-bold text-green-600">
                NPR {bookings
                  .filter(b => b.status === 'completed')
                  .reduce((sum, b) => sum + Number(b.price), 0)
                  .toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Total Spent</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingHistory;
