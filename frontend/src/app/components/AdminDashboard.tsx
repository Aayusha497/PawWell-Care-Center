import { useState, useEffect } from 'react';
import { getPendingBookings, approveBooking, rejectBooking } from '../../services/api';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  fullName: string;
}

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
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

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<number | null>(null);

  useEffect(() => {
    fetchPendingBookings();
  }, []);

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

  const handleApproveBooking = async (booking_id: number) => {
    try {
      setApproving(booking_id);
      await approveBooking(booking_id);
      toast.success('Booking approved successfully');
      fetchPendingBookings();
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
    } catch (error: any) {
      console.error('Error rejecting booking:', error);
      toast.error(error.message || 'Failed to reject booking');
    } finally {
      setRejecting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐾</span>
            <span className="font-semibold text-gray-800">PawWell Admin</span>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left px-4 py-2.5 rounded-lg font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('booking-management')}
              className={`w-full text-left px-4 py-2.5 rounded-lg font-medium transition-colors ${
                activeTab === 'booking-management'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Booking management
            </button>
            <button
              onClick={() => setActiveTab('caretakers')}
              className={`w-full text-left px-4 py-2.5 rounded-lg font-medium transition-colors ${
                activeTab === 'caretakers'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Caretakers
            </button>
            <button
              onClick={() => setActiveTab('capacity')}
              className={`w-full text-left px-4 py-2.5 rounded-lg font-medium transition-colors ${
                activeTab === 'capacity'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Capacity management
            </button>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-200">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase mb-2">System</p>
            <button
              onClick={() => setActiveTab('announcements')}
              className={`w-full text-left px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'announcements'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>📢</span>
              Announcements
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="w-full px-4 py-2.5 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-yellow-200">
              <h3 className="text-gray-600 text-sm font-medium mb-2">Active Bookings</h3>
              <p className="text-4xl font-bold text-gray-900">120</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-yellow-200">
              <h3 className="text-gray-600 text-sm font-medium mb-2">Total registered Pets</h3>
              <p className="text-4xl font-bold text-gray-900">542</p>
            </div>
          </div>

          {/* Pending Booking Approvals */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Booking Approvals</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No pending bookings</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Pet Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Owner</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Service & Date</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 font-medium text-gray-900">{booking.petName}</td>
                        <td className="py-4 px-4 text-gray-600">{booking.ownerName}</td>
                        <td className="py-4 px-4 text-gray-600">
                          {booking.service_type} on {formatDate(booking.start_date)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApproveBooking(booking.booking_id)}
                              disabled={approving === booking.booking_id}
                              className="px-4 py-1.5 bg-yellow-300 hover:bg-yellow-400 text-gray-900 rounded font-medium transition-colors disabled:opacity-50"
                            >
                              {approving === booking.booking_id ? 'Approving...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleRejectBooking(booking.booking_id)}
                              disabled={rejecting === booking.booking_id}
                              className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Caretaker Shift</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Caretaker</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400">
                  <option>Select caretaker</option>
                  <option>John Doe</option>
                  <option>Jane Smith</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shift Details</label>
                <input
                  type="text"
                  placeholder="8:00 am - 7:00 pm"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              <button className="px-6 py-2 bg-yellow-300 hover:bg-yellow-400 text-gray-900 rounded-lg font-semibold transition-colors">
                Assign Shifts
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
