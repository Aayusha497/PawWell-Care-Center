import { useState, useEffect, useMemo } from 'react';
import { 
  getPendingBookings, 
  getAllBookingsAdmin,
  getAdminBookingHistory,
  approveBooking, 
  rejectBooking, 
  completeBooking 
} from '../../services/api';
import { toast } from 'sonner';
import { 
  X, 
  Eye, 
  Calendar, 
  User, 
  Dog, 
  MapPin, 
  FileText
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
  booking_status?: 'pending' | 'approved' | 'confirmed' | 'completed' | 'rejected' | 'cancelled';
  payment_status?: 'unpaid' | 'pending_payment' | 'paid' | 'failed';
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
  const [allHistoryBookings, setAllHistoryBookings] = useState<Booking[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [bookingToComplete, setBookingToComplete] = useState<number | null>(null);

  const [filters, setFilters] = useState({
    status: '',
    service_type: '',
    date_from: '',
    date_to: ''
  });

  const [processingId, setProcessingId] = useState<number | null>(null);

  const [pendingPage, setPendingPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);

  const pendingPerPage = 6;
  const historyPerPage = 8;

  useEffect(() => {
    fetchPendingBookings();
    fetchHistoryBookings();
  }, []);

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
      const response = await getAdminBookingHistory({});
      const data = Array.isArray(response.data) ? response.data : [];
      setAllHistoryBookings(data);
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
    setBookingToComplete(id);
    setCompleteDialogOpen(true);
  };

  const confirmCompleteBooking = async () => {
    if (!bookingToComplete) return;

    try {
      setProcessingId(bookingToComplete);
      await completeBooking(bookingToComplete);
      toast.success('Booking marked as completed');
      refreshLists();

      if (selectedBooking && selectedBooking.booking_id === bookingToComplete) {
        setSelectedBooking(null);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete booking');
    } finally {
      setProcessingId(null);
      setBookingToComplete(null);
      setCompleteDialogOpen(false);
    }
  };

  const refreshLists = () => {
    fetchPendingBookings();
    fetchHistoryBookings();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setHistoryPage(1);
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

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-black';
      case 'approved': return 'text-black';
      case 'confirmed': return 'text-black';
      case 'completed': return 'text-black';
      case 'rejected': return 'text-black';
      case 'cancelled': return 'text-black';
      default: return 'text-gray-700';
    }
  };

  const getPaymentTextColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-black';
      case 'pending_payment': return 'text-black';
      case 'failed': return 'text-black';
      default: return 'text-gray-700';
    }
  };

  const getBookingStatus = (booking: Booking) => booking.booking_status || booking.status;
  const getPaymentStatus = (booking: Booking) => booking.payment_status || 'unpaid';

  const canComplete = (booking: Booking) => {
    if (getBookingStatus(booking) !== 'confirmed') return false;
    if (getPaymentStatus(booking) !== 'paid') return false;
    const endDate = booking.end_date ? new Date(booking.end_date) : new Date(booking.start_date);
    const now = new Date();
    return now > endDate;
  };

  const historyBookings = useMemo(() => {
    return allHistoryBookings.filter((booking) => {
      const bookingStatus = getBookingStatus(booking);
      const serviceType = booking.service_type;

      if (filters.status && bookingStatus !== filters.status) {
        return false;
      }

      if (filters.service_type && serviceType !== filters.service_type) {
        return false;
      }

      if (filters.date_from) {
        const bookingStart = new Date(booking.start_date);
        const fromDate = new Date(filters.date_from);
        fromDate.setHours(0, 0, 0, 0);
        if (bookingStart < fromDate) {
          return false;
        }
      }

      if (filters.date_to) {
        const bookingStart = new Date(booking.start_date);
        const toDate = new Date(filters.date_to);
        toDate.setHours(23, 59, 59, 999);
        if (bookingStart > toDate) {
          return false;
        }
      }

      return true;
    });
  }, [allHistoryBookings, filters]);

  const paginatedPendingBookings = useMemo(() => {
    const startIndex = (pendingPage - 1) * pendingPerPage;
    return pendingBookings.slice(startIndex, startIndex + pendingPerPage);
  }, [pendingBookings, pendingPage]);

  const paginatedHistoryBookings = useMemo(() => {
    const startIndex = (historyPage - 1) * historyPerPage;
    return historyBookings.slice(startIndex, startIndex + historyPerPage);
  }, [historyBookings, historyPage]);

  const pendingTotalPages = Math.max(1, Math.ceil(pendingBookings.length / pendingPerPage));
  const historyTotalPages = Math.max(1, Math.ceil(historyBookings.length / historyPerPage));

  useEffect(() => {
    if (pendingPage > pendingTotalPages) {
      setPendingPage(pendingTotalPages);
    }
  }, [pendingPage, pendingTotalPages]);

  useEffect(() => {
    if (historyPage > historyTotalPages) {
      setHistoryPage(historyTotalPages);
    }
  }, [historyPage, historyTotalPages]);

  const totalBookings = pendingBookings.length + allHistoryBookings.length;
  const confirmedCount = allHistoryBookings.filter((b) => getBookingStatus(b) === 'confirmed').length;
  const completedCount = allHistoryBookings.filter((b) => getBookingStatus(b) === 'completed').length;
  const paidCount = allHistoryBookings.filter((b) => getPaymentStatus(b) === 'paid').length;

  return (
    <div className="space-y-8 p-6 bg-white min-h-screen">
      {/* Header / Summary */}
      <section className="bg-white">
        <div className="px-0 py-0">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-sm tracking-[0.25em] uppercase text-[#F59E0B] font-semibold mb-2">
                Booking Management
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-black">
                Appointments & Bookings
              </h1>
              <p className="text-gray-500 mt-2">
                Manage pending requests, confirmed services, and completed bookings from one dashboard.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-[#FACC15]/50 px-4 py-2 text-sm font-medium text-black self-start">
              <Calendar className="w-4 h-4 text-[#F59E0B]" />
              Booking Overview
            </div>
          </div>
        </div>

        <div className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            <div className="rounded-2xl bg-white border border-[#FACC15]/50 p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">Total Bookings</span>
              </div>
              <p className="text-3xl font-bold text-black">{totalBookings}</p>
            </div>

            <div className="rounded-2xl bg-white border border-[#FACC15]/50 p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">Pending Approval</span>
              </div>
              <p className="text-3xl font-bold text-black">{pendingBookings.length}</p>
            </div>

            <div className="rounded-2xl bg-white border border-[#FACC15]/50 p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">Confirmed</span>
              </div>
              <p className="text-3xl font-bold text-black">{confirmedCount}</p>
            </div>

            <div className="rounded-2xl bg-white border border-[#FACC15]/50 p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">Paid / Completed</span>
              </div>
              <p className="text-3xl font-bold text-black">
                {paidCount} / {completedCount}
              </p>
            </div>
          </div>
        </div>
      </section>

        {/* Pending Requests */}
        <section className="rounded-[28px] bg-white border border-gray-200 overflow-hidden">
          <div className="px-6 md:px-8 py-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-black">Upcoming Requests</h2>
              <p className="text-sm text-gray-500 mt-1">
                Approve or reject new booking requests from pet owners.
              </p>
            </div>

            <span className="inline-flex items-center self-start md:self-auto text-sm font-semibold text-black">
              {pendingBookings.length} Pending
            </span>
          </div>

        {loadingPending ? (
          <div className="p-8 text-center text-gray-500">Loading requests...</div>
        ) : pendingBookings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No pending booking requests.</div>
        ) : (
          <>
            <div className="p-6 md:p-8 grid grid-cols-1 xl:grid-cols-2 gap-5">
              {paginatedPendingBookings.map((booking) => (
                <div
                  key={booking.booking_id}
                  className="rounded-2xl border border-[#FACC15]/40 bg-white p-5 hover:bg-[#FACC15]/10 transition-all"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      {booking.pet?.photo ? (
                        <img
                          src={booking.pet.photo}
                          alt={booking.pet.name}
                          className="w-14 h-14 rounded-full object-cover border border-[#FACC15]/40"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-[#FACC15]/10 flex items-center justify-center border border-[#FACC15]/40">
                          <Dog className="w-6 h-6 text-[#F59E0B]" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-black">{booking.pet?.name || 'N/A'}</p>
                        <p className="text-sm text-gray-500">{booking.service_type}</p>
                      </div>
                    </div>

                    <span className="text-xs font-semibold text-black">
                      #{booking.booking_id}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-5">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Owner</p>
                      <p className="font-medium text-black">
                        {booking.pet?.owner?.first_name || 'N/A'} {booking.pet?.owner?.last_name || ''}
                      </p>
                      <p className="text-gray-500 truncate">{booking.pet?.owner?.email || 'N/A'}</p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Dates</p>
                      <p className="font-medium text-black">{formatDate(booking.start_date)}</p>
                      {booking.end_date && (
                        <p className="text-gray-500">to {formatDate(booking.end_date)}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Pickup</p>
                      <p className="text-gray-700">{booking.pickup_time || '-'}</p>
                      {booking.pickup_address && (
                        <p className="text-gray-500 truncate" title={booking.pickup_address}>
                          {booking.pickup_address}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Drop-off</p>
                      <p className="text-gray-700">{booking.dropoff_time || '-'}</p>
                      {booking.dropoff_address && (
                        <p className="text-gray-500 truncate" title={booking.dropoff_address}>
                          {booking.dropoff_address}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-4">
                    <button
                      onClick={() => handleReject(booking.booking_id)}
                      disabled={processingId === booking.booking_id}
                      className="text-sm font-semibold text-black hover:text-[#D97706] disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(booking.booking_id)}
                      disabled={processingId === booking.booking_id}
                      className="px-4 py-2 rounded-xl bg-[#FACC15] text-black text-sm font-semibold hover:bg-[#EAB308] disabled:opacity-50"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {pendingTotalPages > 1 && (
              <div className="px-6 md:px-8 pb-6 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page {pendingPage} of {pendingTotalPages} ({pendingBookings.length} pending requests)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPendingPage((prev) => Math.max(1, prev - 1))}
                    disabled={pendingPage === 1}
                    className="px-4 py-2 border border-[#FACC15]/50 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#FACC15]/10 transition text-black"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPendingPage((prev) => Math.min(pendingTotalPages, prev + 1))}
                    disabled={pendingPage === pendingTotalPages}
                    className="px-4 py-2 bg-[#FACC15] text-black rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#EAB308] transition font-semibold"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      
        {/* Booking History */}
        <section className="rounded-[28px] bg-white border border-gray-200 overflow-hidden">
          <div className="px-6 md:px-8 py-6 border-b border-gray-200">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
              <div>
                <h2 className="text-2xl font-bold text-black">Booking History</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Review all booking records, service history, and payment status.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full xl:w-auto">
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
                >
                  <option value="">All Statuses</option>
                  <option value="approved">Approved</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rejected">Rejected</option>
                  <option value="pending">Pending</option>
                </select>

                <select
                  value={filters.service_type}
                  onChange={(e) => handleFilterChange('service_type', e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
                >
                  <option value="">All Services</option>
                  <option value="Pet Boarding">Pet Boarding</option>
                  <option value="Daycation/Pet Sitting">Daycation</option>
                  <option value="Grooming">Grooming</option>
                </select>

                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
                />

                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-gray-300 bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
                />
              </div>
            </div>
          </div>

          {loadingHistory ? (
            <div className="p-8 text-center text-gray-500">Loading history...</div>
          ) : historyBookings.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No bookings found matching filters.</div>
          ) : (
            <>
              <div className="p-6 md:p-8 overflow-x-auto">
                <table className="w-full min-w-[980px] text-sm">
                  <thead>
                    <tr className="bg-white border-b border-gray-200 text-left text-gray-500 uppercase text-xs">
                      <th className="px-5 py-4 rounded-l-2xl">Booking</th>
                      <th className="px-5 py-4">Owner / Pet</th>
                      <th className="px-5 py-4">Service</th>
                      <th className="px-5 py-4">Dates</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Payment</th>
                      <th className="px-5 py-4 rounded-r-2xl text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {paginatedHistoryBookings.map((booking) => (
                      <tr
                        key={booking.booking_id}
                        className="hover:bg-[#FACC15]/10 transition-colors"
                      >
                      <td className="px-5 py-5">
                        <div className="font-semibold text-black">#{booking.booking_id}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Created {formatDate(booking.created_at)}
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex items-center gap-3">
                          {booking.pet?.photo ? (
                            <img
                              src={booking.pet.photo}
                              alt={booking.pet.name}
                              className="w-11 h-11 rounded-full object-cover border border-[#FACC15]/40"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-[#FACC15]/10 flex items-center justify-center border border-[#FACC15]/40">
                              <Dog className="w-5 h-5 text-[#F59E0B]" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-black">
                              {booking.pet?.owner?.first_name || 'N/A'} {booking.pet?.owner?.last_name || ''}
                            </p>
                            <p className="text-xs text-gray-500">
                              Pet: {booking.pet?.name || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-5 text-gray-700">
                        {booking.service_type}
                      </td>

                      <td className="px-5 py-5 text-gray-700">
                        <div>{formatDate(booking.start_date)}</div>
                        {booking.end_date && (
                          <div className="text-xs text-gray-500 mt-1">
                            to {formatDate(booking.end_date)}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-5">
                        <span className={`font-semibold ${getStatusTextColor(getBookingStatus(booking))}`}>
                          {getBookingStatus(booking).charAt(0).toUpperCase() + getBookingStatus(booking).slice(1)}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <span className={`font-semibold ${getPaymentTextColor(getPaymentStatus(booking))}`}>
                          {getPaymentStatus(booking).replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex justify-end gap-4 items-center">
                          <button
                            onClick={() => setSelectedBooking(booking)}
                            className="text-[#F59E0B] hover:text-[#D97706] transition"
                            title="View details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>

                          {getBookingStatus(booking) === 'confirmed' && (
                            <button
                              onClick={() => handleComplete(booking.booking_id)}
                              disabled={!canComplete(booking) || processingId === booking.booking_id}
                              className="text-black hover:text-[#D97706] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                              title={!canComplete(booking) ? 'Service date has not passed yet or payment is pending' : 'Mark as completed'}
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {historyTotalPages > 1 && (
              <div className="px-6 md:px-8 pb-6 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page {historyPage} of {historyTotalPages} ({historyBookings.length} history bookings)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
                    disabled={historyPage === 1}
                    className="px-4 py-2 border border-[#FACC15]/50 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#FACC15]/10 transition text-black"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setHistoryPage((prev) => Math.min(historyTotalPages, prev + 1))}
                    disabled={historyPage === historyTotalPages}
                    className="px-4 py-2 bg-[#FACC15] text-black rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#EAB308] transition font-semibold"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[28px] bg-white shadow-2xl border border-[#FACC15]/40">
            <div className="px-6 md:px-8 py-6 border-b border-[#FACC15]/30 flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold text-black">
                    Booking #{selectedBooking.booking_id}
                  </h3>
                  <span className={`font-semibold ${getStatusTextColor(getBookingStatus(selectedBooking))}`}>
                    {getBookingStatus(selectedBooking).charAt(0).toUpperCase() + getBookingStatus(selectedBooking).slice(1)}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Created on {formatDateTime(selectedBooking.created_at)}
                </p>
              </div>

              <button
                onClick={() => setSelectedBooking(null)}
                className="w-10 h-10 rounded-xl border border-[#FACC15]/50 hover:bg-[#FACC15]/10 flex items-center justify-center text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="rounded-2xl border border-[#FACC15]/50 bg-white p-5">
                  <h4 className="text-sm font-semibold text-black mb-4 flex items-center">
                    <User className="w-4 h-4 mr-2 text-[#F59E0B]" />
                    Owner Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-700">
                      <span className="font-medium">Name:</span> {selectedBooking.pet?.owner?.first_name || 'N/A'} {selectedBooking.pet?.owner?.last_name || ''}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Email:</span> {selectedBooking.pet?.owner?.email || 'N/A'}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Phone:</span> {selectedBooking.pet?.owner?.phone_number || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#FACC15]/50 bg-white p-5">
                  <h4 className="text-sm font-semibold text-black mb-4 flex items-center">
                    <Dog className="w-4 h-4 mr-2 text-[#F59E0B]" />
                    Pet Information
                  </h4>
                  <div className="flex items-center gap-4">
                    {selectedBooking.pet?.photo ? (
                      <img
                        src={selectedBooking.pet.photo}
                        alt={selectedBooking.pet.name}
                        className="w-14 h-14 rounded-full object-cover border border-[#FACC15]/40"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-[#FACC15]/10 flex items-center justify-center border border-[#FACC15]/40">
                        <Dog className="w-6 h-6 text-[#F59E0B]" />
                      </div>
                    )}

                    <div className="space-y-2 text-sm">
                      <p className="text-gray-700">
                        <span className="font-medium">Name:</span> {selectedBooking.pet?.name || 'N/A'}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-medium">Breed:</span> {selectedBooking.pet?.breed || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#FACC15]/50 bg-white p-5">
                <h4 className="text-sm font-semibold text-black mb-4 flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-[#F59E0B]" />
                  Service Details
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Service Type</p>
                    <p className="font-medium text-black">{selectedBooking.service_type}</p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Price</p>
                    <p className="font-medium text-black">Rs. {selectedBooking.price}</p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Payment</p>
                    <span className={`font-semibold ${getPaymentTextColor(getPaymentStatus(selectedBooking))}`}>
                      {getPaymentStatus(selectedBooking).replace('_', ' ')}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Start Date</p>
                    <p className="font-medium text-black">{formatDate(selectedBooking.start_date)}</p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">End Date</p>
                    <p className="font-medium text-black">
                      {selectedBooking.end_date ? formatDate(selectedBooking.end_date) : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {(selectedBooking.pickup_time || selectedBooking.dropoff_time) && (
                <div className="rounded-2xl border border-[#FACC15]/50 bg-white p-5">
                  <h4 className="text-sm font-semibold text-black mb-4 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-[#F59E0B]" />
                    Transport Details
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedBooking.pickup_time && (
                      <div className="rounded-xl border border-[#FACC15]/50 bg-white p-4">
                        <p className="text-xs uppercase tracking-wide text-[#F59E0B] mb-1">Pickup</p>
                        <p className="font-medium text-black">{selectedBooking.pickup_time}</p>
                        <p className="text-sm text-gray-600 mt-1">{selectedBooking.pickup_address}</p>
                      </div>
                    )}

                    {selectedBooking.dropoff_time && (
                      <div className="rounded-xl border border-[#FACC15]/50 bg-white p-4">
                        <p className="text-xs uppercase tracking-wide text-[#F59E0B] mb-1">Drop-off</p>
                        <p className="font-medium text-black">{selectedBooking.dropoff_time}</p>
                        <p className="text-sm text-gray-600 mt-1">{selectedBooking.dropoff_address}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 md:px-8 py-5 border-t border-[#FACC15]/30 bg-white flex flex-wrap justify-end gap-4">
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-black hover:text-[#D97706] font-semibold"
              >
                Close
              </button>

              {getBookingStatus(selectedBooking) === 'pending' && (
                <>
                  <button
                    onClick={() => handleReject(selectedBooking.booking_id)}
                    className="text-black hover:text-[#D97706] font-semibold"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedBooking.booking_id)}
                    className="px-4 py-2 rounded-xl bg-[#FACC15] text-black hover:bg-[#EAB308] font-semibold"
                  >
                    Approve
                  </button>
                </>
              )}

              {getBookingStatus(selectedBooking) === 'confirmed' && (
                <button
                  onClick={() => handleComplete(selectedBooking.booking_id)}
                  disabled={!canComplete(selectedBooking)}
                  className="px-4 py-2 rounded-xl bg-[#FACC15] text-black hover:bg-[#EAB308] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!canComplete(selectedBooking) ? 'Service date has not passed yet' : ''}
                >
                  Mark as Completed
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Complete Confirmation Dialog */}
      {completeDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-[#FACC15]/40 overflow-hidden">
            <div className="px-6 py-5 border-b border-[#FACC15]/30">
              <h3 className="text-xl font-semibold text-black">
                Confirm Completion
              </h3>
            </div>

            <div className="px-6 py-6">
              <p className="text-gray-700">
                Mark this booking as completed?
              </p>
            </div>

            <div className="px-6 py-4 bg-white flex justify-end gap-4 border-t border-[#FACC15]/30">
              <button
                onClick={() => {
                  setCompleteDialogOpen(false);
                  setBookingToComplete(null);
                }}
                className="text-black hover:text-[#D97706] font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={confirmCompleteBooking}
                className="px-4 py-2 rounded-xl bg-[#FACC15] text-black hover:bg-[#EAB308] font-semibold"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}