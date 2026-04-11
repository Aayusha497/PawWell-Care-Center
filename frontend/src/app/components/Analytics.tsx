import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  getDashboardAnalytics,
  getBookingTrends,
  getRevenueTrends,
  getTopServices,
  getBookingStatusDistribution,
  getPetTypesDistribution,
  getPeakHours,
  getRecentBookingsAnalytics,
  getRecentPaymentsAnalytics,
  getAnalyticsAlerts,
  getAvailableServiceTypes
} from '../../services/api';
import { toast } from 'sonner';
import { AlertCircle, TrendingUp, PawPrint, Banknote, Clock, AlertTriangle } from 'lucide-react';

interface TopCards {
  totalBookings: number;
  activeBookings: number;
  totalPets: number;
  totalRevenue: number;
  revenueThisMonth: number;
  pendingApprovals: number;
  urgentItems: number;
}

interface RecentBooking {
  id: number;
  petName: string;
  petBreed: string;
  ownerName: string;
  service: string;
  startDate: string;
  status: string;
  paymentStatus: string;
  amount: number;
}

interface RecentPayment {
  id: number;
  bookingId: number;
  petName: string;
  ownerName: string;
  amount: number;
  method: string;
  date: string;
}

interface Alert {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const COLORS = ['#fbbf24', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b'];
const SEVERITY_COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#dc2626'
};

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [serviceType, setServiceType] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [availableServiceTypes, setAvailableServiceTypes] = useState<string[]>([]);
  const [topCards, setTopCards] = useState<TopCards | null>(null);
  const [bookingTrends, setBookingTrends] = useState<any[]>([]);
  const [revenueTrends, setRevenueTrends] = useState<any[]>([]);
  const [topServices, setTopServices] = useState<any[]>([]);
  const [bookingStatus, setBookingStatus] = useState<any[]>([]);
  const [petTypes, setPetTypes] = useState<any[]>([]);
  const [peakHours, setPeakHours] = useState<any[]>([]);
  const [peakDays, setPeakDays] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const [recentBookingsPage, setRecentBookingsPage] = useState(1);
  const [recentPaymentsPage, setRecentPaymentsPage] = useState(1);

  const recentBookingsPerPage = 5;
  const recentPaymentsPerPage = 5;

  // Fetch available service types on mount
  useEffect(() => {
    const fetchServiceTypes = async () => {
      try {
        const response = await getAvailableServiceTypes();
        setAvailableServiceTypes(response.data || []);
      } catch (error) {
        console.error('Failed to fetch service types:', error);
      }
    };
    fetchServiceTypes();
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, serviceType, statusFilter, customStartDate, customEndDate]);

  useEffect(() => {
    setRecentBookingsPage(1);
  }, [recentBookings]);

  useEffect(() => {
    setRecentPaymentsPage(1);
  }, [recentPayments]);

  const getDaysFromRange = () => {
    if (dateRange === 'custom') {
      return undefined;
    }
    return parseInt(dateRange);
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const days = getDaysFromRange();
      
      const filterParams = {
        ...(serviceType && { serviceType }),
        ...(statusFilter && { status: statusFilter }),
        ...(dateRange === 'custom' && customStartDate && customEndDate && { 
          startDate: customStartDate,
          endDate: customEndDate
        })
      };

      const daysParam = dateRange === 'custom' ? {} : { days: days || 30 };

      const [
        dashboardRes,
        bookingTrendsRes,
        revenueTrendsRes,
        topServicesRes,
        bookingStatusRes,
        petTypesRes,
        peakHoursRes,
        recentBookingsRes,
        recentPaymentsRes,
        alertsRes
      ] = await Promise.all([
        getDashboardAnalytics(filterParams),
        getBookingTrends({ ...daysParam, ...filterParams }),
        getRevenueTrends({ ...daysParam, ...filterParams }),
        getTopServices({ limit: 5, ...filterParams }),
        getBookingStatusDistribution(filterParams),
        getPetTypesDistribution(filterParams),
        getPeakHours(filterParams),
        getRecentBookingsAnalytics({ limit: 8, ...filterParams }),
        getRecentPaymentsAnalytics({ limit: 8, ...filterParams }),
        getAnalyticsAlerts(filterParams)
      ]);

      setTopCards(dashboardRes.data?.topCards);
      setBookingTrends(bookingTrendsRes.data || []);
      setRevenueTrends(revenueTrendsRes.data || []);
      setTopServices(topServicesRes.data || []);
      setBookingStatus(bookingStatusRes.data || []);
      setPetTypes(petTypesRes.data || []);
      
      if (peakHoursRes.data?.data) {
        setPeakHours(peakHoursRes.data.data.hours || []);
        setPeakDays(peakHoursRes.data.data.days || []);
      }
      
      setRecentBookings(recentBookingsRes.data || []);
      setRecentPayments(recentPaymentsRes.data || []);
      setAlerts(alertsRes.data || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `Rs. ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const totalRecentBookingsPages = Math.max(1, Math.ceil(recentBookings.length / recentBookingsPerPage));
  const totalRecentPaymentsPages = Math.max(1, Math.ceil(recentPayments.length / recentPaymentsPerPage));

  const paginatedRecentBookings = recentBookings.slice(
    (recentBookingsPage - 1) * recentBookingsPerPage,
    recentBookingsPage * recentBookingsPerPage
  );

  const paginatedRecentPayments = recentPayments.slice(
    (recentPaymentsPage - 1) * recentPaymentsPerPage,
    recentPaymentsPage * recentPaymentsPerPage
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin">
          <div className="w-12 h-12 border-4 border-yellow-300 border-t-yellow-600 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        {/* <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Filters</h3> */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                if (e.target.value !== 'custom') {
                  setCustomStartDate('');
                  setCustomEndDate('');
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Inputs */}
          {dateRange === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          {/* Service Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Service Type</label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="">All Services</option>
              {availableServiceTypes.map((service) => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Top Cards - Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-yellow-200 dark:border-yellow-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Bookings</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{topCards?.totalBookings || 0}</p>
            </div>
            {/* <TrendingUp className="w-10 h-10 text-yellow-500" /> */}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-green-200 dark:border-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Active Bookings</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{topCards?.activeBookings || 0}</p>
            </div>
            {/* <Clock className="w-10 h-10 text-green-500" /> */}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-blue-200 dark:border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Pets</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{topCards?.totalPets || 0}</p>
            </div>
            {/* <PawPrint className="w-10 h-10 text-blue-500" /> */}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-purple-200 dark:border-purple-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(topCards?.totalRevenue || 0)}</p>
            </div>
            {/* <Banknote className="w-10 h-10 text-purple-500" /> */}
          </div>
        </div>
      </div>

      {/* Additional Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">This Month Revenue</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(topCards?.revenueThisMonth || 0)}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Pending Approvals</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{topCards?.pendingApprovals || 0}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Urgent Items</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{topCards?.urgentItems || 0}</p>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className="p-4 rounded-lg border-l-4 flex items-start gap-3"
              style={{
                backgroundColor: `${SEVERITY_COLORS[alert.severity]}20`,
                borderColor: SEVERITY_COLORS[alert.severity]
              }}
            >
              <AlertTriangle
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                style={{ color: SEVERITY_COLORS[alert.severity] }}
              />
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">{alert.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Middle Section - Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Booking Trends</h3>
          {bookingTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={bookingTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Legend />
                <Line type="monotone" dataKey="bookings" stroke="#fbbf24" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-8">No data available</p>
          )}
        </div>

        {/* Revenue Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Revenue Trends</h3>
          {revenueTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-8">No data available</p>
          )}
        </div>
      </div>

      {/* Side Section - Distributions & Peak Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Booking Status Distribution</h3>
          {bookingStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={bookingStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {bookingStatus.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-8">No data available</p>
          )}
        </div>

        {/* Pet Types Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Pet Types Distribution</h3>
          {petTypes.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={petTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {petTypes.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-8">No data available</p>
          )}
        </div>
      </div>

      {/* Peak Hours & Days */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"> */}
        {/* Peak Hours */}
        {/* <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Peak Booking Hours</h3>
          {peakHours.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="hour" label={{ value: 'Hour of Day', position: 'insideBottomRight', offset: -5 }} stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="count" fill="#fbbf24" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-8">No data available</p>
          )}
        </div> */}

        {/* Peak Days */}
        {/* <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Peak Booking Days</h3>
          {peakDays.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={peakDays}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-8">No data available</p>
          )}
        </div>
      </div> */}

      {/* Top Services */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Top Services</h3>
        {topServices.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={topServices}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis dataKey="name" type="category" width={90} stroke="#6b7280" />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Bar dataKey="value" fill="#10b981" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-500 py-8">No data available</p>
        )}
      </div>

      {/* Bottom Section - Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-white dark:bg-gray-800 rounded-[28px] p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Bookings</h3>
          {recentBookings.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="text-left py-3 px-3 text-gray-700 dark:text-gray-300 font-medium">Pet</th>
                      <th className="text-left py-3 px-3 text-gray-700 dark:text-gray-300 font-medium">Owner</th>
                      <th className="text-left py-3 px-3 text-gray-700 dark:text-gray-300 font-medium">Service</th>
                      <th className="text-left py-3 px-3 text-gray-700 dark:text-gray-300 font-medium">Amount</th>
                      <th className="text-left py-3 px-3 text-gray-700 dark:text-gray-300 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRecentBookings.map(booking => (
                      <tr
                        key={booking.id}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-[#FACC15]/10 dark:hover:bg-gray-700 transition"
                      >
                        <td className="py-3 px-3 text-gray-900 dark:text-gray-100">{booking.petName}</td>
                        <td className="py-3 px-3 text-gray-600 dark:text-gray-400">{booking.ownerName}</td>
                        <td className="py-3 px-3 text-gray-600 dark:text-gray-400">{booking.service}</td>
                        <td className="py-3 px-3 text-gray-900 dark:text-gray-100 font-medium">{formatCurrency(booking.amount)}</td>
                        <td className="py-3 px-3 text-gray-900 dark:text-gray-100 font-medium">
                          {booking.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalRecentBookingsPages > 1 && (
                <div className="pt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Page {recentBookingsPage} of {totalRecentBookingsPages} ({recentBookings.length} total bookings)
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRecentBookingsPage(prev => Math.max(1, prev - 1))}
                      disabled={recentBookingsPage === 1}
                      className="px-4 py-2 border border-[#FACC15]/50 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#FACC15]/10 transition text-black dark:text-gray-100"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setRecentBookingsPage(prev => Math.min(totalRecentBookingsPages, prev + 1))}
                      disabled={recentBookingsPage === totalRecentBookingsPages}
                      className="px-4 py-2 bg-[#FACC15] text-black rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#EAB308] transition font-semibold"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-gray-500 py-8">No recent bookings</p>
          )}
        </div>

        {/* Recent Payments */}
        <div className="bg-white dark:bg-gray-800 rounded-[28px] p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Payments</h3>
          {recentPayments.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="text-left py-3 px-3 text-gray-700 dark:text-gray-300 font-medium">Pet</th>
                      <th className="text-left py-3 px-3 text-gray-700 dark:text-gray-300 font-medium">Owner</th>
                      <th className="text-left py-3 px-3 text-gray-700 dark:text-gray-300 font-medium">Amount</th>
                      <th className="text-left py-3 px-3 text-gray-700 dark:text-gray-300 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRecentPayments.map(payment => (
                      <tr
                        key={payment.id}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-[#FACC15]/10 dark:hover:bg-gray-700 transition"
                      >
                        <td className="py-3 px-3 text-gray-900 dark:text-gray-100">{payment.petName}</td>
                        <td className="py-3 px-3 text-gray-600 dark:text-gray-400">{payment.ownerName}</td>
                        <td className="py-3 px-3 text-gray-900 dark:text-gray-100 font-medium">{formatCurrency(payment.amount)}</td>
                        <td className="py-3 px-3 text-gray-600 dark:text-gray-400">{formatDate(payment.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalRecentPaymentsPages > 1 && (
                <div className="pt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Page {recentPaymentsPage} of {totalRecentPaymentsPages} ({recentPayments.length} total payments)
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRecentPaymentsPage(prev => Math.max(1, prev - 1))}
                      disabled={recentPaymentsPage === 1}
                      className="px-4 py-2 border border-[#FACC15]/50 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#FACC15]/10 transition text-black dark:text-gray-100"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setRecentPaymentsPage(prev => Math.min(totalRecentPaymentsPages, prev + 1))}
                      disabled={recentPaymentsPage === totalRecentPaymentsPages}
                      className="px-4 py-2 bg-[#FACC15] text-black rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#EAB308] transition font-semibold"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-gray-500 py-8">No recent payments</p>
          )}
        </div>
      </div>
    </div>
  );
}