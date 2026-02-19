import { useState, useEffect } from 'react';
import { 
  getPendingBookings, 
  getAllBookingsAdmin, 
  approveBooking, 
  rejectBooking, 
  completeBooking 
} from '../../services/api';
import { toast } from 'sonner';
import { 
  Check, 
  X, 
  Eye, 
  Filter, 
  Search, 
  Calendar, 
  Clock, 
  User, 
  Dog, 
  MapPin, 
  CreditCard,
  FileText,
  AlertCircle
} from 'lucide-react';

interface Booking {
  booking_id: number;
  user_id: number;
  pet_id: number;
  service_type: string;
  start_date: string;
  end_date?: string | null;
  pickup_time?: string | null;
  dropoff_time?: string | null;
  pickup_address?: string | null;
  dropoff_address?: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  price?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  pet: {
    pet_id: number;
    name: string;
    breed: string;
    photo?: string;
    owner: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      phone_number: string;
    }
  };
}

export default function BookingManagement() {
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [historyBookings, setHistoryBookings] = useState<Booking[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    service_type: '',
    date_from: '',
    date_to: ''
  });

  // Action states
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetchPendingBookings();
    fetchHistoryBookings();
  }, []);

  useEffect(() => {
    // Debounce history fetch when filters change
    const timer = setTimeout(() => {
      fetchHistoryBookings();
    }, 500);
    return () => clearTimeout(timer);
  }, [filters]);

  const fetchPendingBookings = async () => {
    try {
      setLoadingPending(true);
      const response = await getPendingBookings();
      setPendingBookings(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching pending bookings:', error);
      toast.error('Failed to load pending bookings');
    } finally {
      setLoadingPending(false);
    }
  };

  const fetchHistoryBookings = async () => {
    try {
      setLoadingHistory(true);
      const response = await getAllBookingsAdmin(filters);
      // Filter out pending bookings from history if no specific status selected
      // or if status filter is set to something else.
      const data = Array.isArray(response.data) ? response.data : [];
      
      // If no status filter is active, exclude 'pending' to avoid duplication 
      // with the top section, unless user explicitly filters for 'pending' in history?
      // The requirement says "Booking History... showing all non-pending bookings".
      // So we should filter out pending ones if no status filter is applied, 
      // or if the user selects 'pending' in filters we show them?
      // Let's strictly follow "non-pending" for the default view.
      
      let filteredData = data;
      if (!filters.status) {
        filteredData = data.filter((b: Booking) => b.status !== 'pending');
      }
      
      setHistoryBookings(filteredData);
    } catch (error) {
      console.error('Error fetching booking history:', error);
      toast.error('Failed to load booking history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      setProcessingId(id);
      await approveBooking(id);
      toast.success('Booking approved successfully');
      refreshLists();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve booking');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('Are you sure you want to reject this booking?')) return;
    
    try {
      setProcessingId(id);
      await rejectBooking(id);
      toast.success('Booking rejected successfully');
      refreshLists();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject booking');
    } finally {
      setProcessingId(null);
    }
  };

  const handleComplete = async (id: number) => {
    if (!confirm('Mark this booking as completed?')) return;

    try {
      setProcessingId(id);
      await completeBooking(id);
      toast.success('Booking marked as completed');
      refreshLists();
      if (selectedBooking && selectedBooking.booking_id === id) {
        setSelectedBooking(null); // Close modal or update it
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete booking');
    } finally {
      setProcessingId(null);
    }
  };

  const refreshLists = () => {
    fetchPendingBookings();
    fetchHistoryBookings();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canComplete = (booking: Booking) => {
    if (booking.status !== 'confirmed') return false;
    const endDate = booking.end_date ? new Date(booking.end_date) : new Date(booking.start_date);
    const now = new Date();
    return now > endDate;
  };

  return (
    <div className="space-y-8 p-6">
      
      {/* Section 1: Pending Bookings */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Booking Requests</h2>
            <p className="text-sm text-gray-500">Pending approvals requiring action</p>
          </div>
          <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {pendingBookings.length} Pending
          </span>
        </div>

        {loadingPending ? (
          <div className="p-8 text-center text-gray-500">Loading requests...</div>
        ) : pendingBookings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No pending booking requests.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Booking ID</th>
                  <th className="px-6 py-3">Owner / Pet</th>
                  <th className="px-6 py-3">Service</th>
                  <th className="px-6 py-3">Dates</th>
                  <th className="px-6 py-3">Pickup/Dropoff</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingBookings.map((booking) => (
                  <tr key={booking.booking_id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      #{booking.booking_id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{booking.pet.owner.first_name} {booking.pet.owner.last_name}</div>
                      <div className="text-xs text-gray-500">{booking.pet.owner.email}</div>
                      <div className="text-xs text-blue-600 mt-1">Pet: {booking.pet.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium">{booking.service_type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>{formatDate(booking.start_date)}</div>
                      {booking.end_date && (
                        <div className="text-gray-500 text-xs">to {formatDate(booking.end_date)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                       {booking.pickup_time ? (
                          <div className="text-xs">
                             <span className="font-semibold">Pick:</span> {booking.pickup_time}
                             {booking.pickup_address && <div className="text-gray-500 truncate max-w-[150px]" title={booking.pickup_address}>{booking.pickup_address}</div>}
                          </div>
                       ) : <span className="text-gray-400 text-xs">-</span>}
                       {booking.dropoff_time ? (
                          <div className="text-xs mt-1">
                             <span className="font-semibold">Drop:</span> {booking.dropoff_time}
                          </div>
                       ) : null}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleApprove(booking.booking_id)}
                          disabled={processingId === booking.booking_id}
                          className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        >
                          <Check className="h-3 w-3 mr-1" /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(booking.booking_id)}
                          disabled={processingId === booking.booking_id}
                          className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          <X className="h-3 w-3 mr-1" /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Section 2: Booking History */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Booking History</h2>
              <p className="text-sm text-gray-500">Manage all booking records</p>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="relative">
                <select
                  value={filters.service_type}
                  onChange={(e) => handleFilterChange('service_type', e.target.value)}
                  className="pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">All Services</option>
                  <option value="Pet Boarding">Pet Boarding</option>
                  <option value="Daycation/Pet Sitting">Daycation</option>
                  <option value="Grooming">Grooming</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  className="py-2 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  className="py-2 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {loadingHistory ? (
          <div className="p-8 text-center text-gray-500">Loading history...</div>
        ) : historyBookings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No bookings found matching filters.</div>
        ) : (
          <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                   <th className="px-6 py-3">ID</th>
                   <th className="px-6 py-3">Status</th>
                   <th className="px-6 py-3">Owner / Pet</th>
                   <th className="px-6 py-3">Service</th>
                   <th className="px-6 py-3">Dates</th>
                   <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                 {historyBookings.map((booking) => (
                    <tr key={booking.booking_id} className="bg-white border-b hover:bg-gray-50">
                       <td className="px-6 py-4 text-gray-500">#{booking.booking_id}</td>
                       <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                             {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                       </td>
                       <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{booking.pet.owner.first_name} {booking.pet.owner.last_name}</div>
                          <div className="text-xs text-gray-500">Pet: {booking.pet.name}</div>
                       </td>
                       <td className="px-6 py-4">{booking.service_type}</td>
                       <td className="px-6 py-4">
                          {formatDate(booking.start_date)}
                          {booking.end_date && ` - ${formatDate(booking.end_date)}`}
                       </td>
                       <td className="px-6 py-4 text-right">
                          <button
                             onClick={() => setSelectedBooking(booking)}
                             className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                             <Eye className="h-3 w-3 mr-1" /> View
                          </button>
                       </td>
                    </tr>
                 ))}
              </tbody>
             </table>
          </div>
        )}
      </section>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                 <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                       Booking Details #{selectedBooking.booking_id}
                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedBooking.status)}`}>
                          {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                       </span>
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                       Created on {formatDateTime(selectedBooking.created_at)}
                    </p>
                 </div>
                 <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-gray-500">
                    <X className="h-6 w-6" />
                 </button>
              </div>

              <div className="p-6 space-y-6">
                 {/* Owner & Pet Info */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                       <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                          <User className="h-4 w-4 mr-2" /> Owner Information
                       </h4>
                       <div className="space-y-1 text-sm text-gray-600">
                          <p><span className="font-medium">Name:</span> {selectedBooking.pet.owner.first_name} {selectedBooking.pet.owner.last_name}</p>
                          <p><span className="font-medium">Email:</span> {selectedBooking.pet.owner.email}</p>
                          <p><span className="font-medium">Phone:</span> {selectedBooking.pet.owner.phone_number}</p>
                       </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                       <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                          <Dog className="h-4 w-4 mr-2" /> Pet Information
                       </h4>
                       <div className="flex items-start gap-4">
                          {selectedBooking.pet.photo ? (
                             <img src={selectedBooking.pet.photo} alt={selectedBooking.pet.name} className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                             <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                <Dog className="h-6 w-6 text-gray-400" />
                             </div>
                          )}
                          <div className="space-y-1 text-sm text-gray-600">
                             <p><span className="font-medium">Name:</span> {selectedBooking.pet.name}</p>
                             <p><span className="font-medium">Breed:</span> {selectedBooking.pet.breed}</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Service Details */}
                 <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                       <FileText className="h-4 w-4 mr-2" /> Service Details
                    </h4>
                    <div className="bg-white border rounded-lg p-4 space-y-4">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                             <p className="text-xs text-gray-500">Service Type</p>
                             <p className="font-medium">{selectedBooking.service_type}</p>
                          </div>
                          <div>
                             <p className="text-xs text-gray-500">Total Price</p>
                             <p className="font-medium text-green-600">Rs. {selectedBooking.price}</p>
                          </div>
                          <div>
                             <p className="text-xs text-gray-500">Start Date</p>
                             <p className="font-medium">{formatDate(selectedBooking.start_date)}</p>
                          </div>
                          <div>
                             <p className="text-xs text-gray-500">End Date</p>
                             <p className="font-medium">{selectedBooking.end_date ? formatDate(selectedBooking.end_date) : '-'}</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Pickup / Dropoff */}
                 {(selectedBooking.pickup_time || selectedBooking.dropoff_time) && (
                    <div>
                       <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                          <MapPin className="h-4 w-4 mr-2" /> Transport Details
                       </h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedBooking.pickup_time && (
                             <div className="p-3 border rounded border-l-4 border-l-blue-500">
                                <p className="text-xs font-semibold text-gray-500 uppercase">Pickup</p>
                                <p className="font-medium">{selectedBooking.pickup_time}</p>
                                <p className="text-sm text-gray-600 mt-1">{selectedBooking.pickup_address}</p>
                             </div>
                          )}
                          {selectedBooking.dropoff_time && (
                             <div className="p-3 border rounded border-l-4 border-l-green-500">
                                <p className="text-xs font-semibold text-gray-500 uppercase">Dropoff</p>
                                <p className="font-medium">{selectedBooking.dropoff_time}</p>
                                <p className="text-sm text-gray-600 mt-1">{selectedBooking.dropoff_address}</p>
                             </div>
                          )}
                       </div>
                    </div>
                 )}
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                 <button
                    onClick={() => setSelectedBooking(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-white"
                 >
                    Close
                 </button>
                 
                 {/* Action buttons inside modal */}
                 {selectedBooking.status === 'pending' && (
                    <>
                       <button
                          onClick={() => handleReject(selectedBooking.booking_id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                       >
                          Reject
                       </button>
                       <button
                          onClick={() => handleApprove(selectedBooking.booking_id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                       >
                          Approve
                       </button>
                    </>
                 )}

                 {selectedBooking.status === 'confirmed' && (
                    <button
                       onClick={() => handleComplete(selectedBooking.booking_id)}
                       disabled={!canComplete(selectedBooking)}
                       className={`px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed`}
                       title={!canComplete(selectedBooking) ? "Service date has not passed yet" : ""}
                    >
                       Mark as Completed
                    </button>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}