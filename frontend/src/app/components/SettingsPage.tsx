import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'sonner';
import { Settings, User as UserIcon, Moon, Sun } from 'lucide-react';
import { getSettings, updateSettings } from '../../services/api';

interface SettingsPageProps {
  onBack: () => void;
  onLogout: () => void;
  userFullName: string;
  onNavigate?: (page: 'user-dashboard' | 'profile' | 'about' | 'contact' | 'emergency') => void;
  onDashboardTarget?: (target: 'booking' | 'add-pet' | 'activity-log' | 'wellness-timeline') => void;
}

export default function SettingsPage({ onBack, onLogout, userFullName, onNavigate, onDashboardTarget }: SettingsPageProps) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [ activityUpdates, setActivityUpdates] = useState(true);
  const [bookingReminders, setBookingReminders] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await getSettings();
        if (response.success && response.data) {
          setTheme(response.data.theme || 'light');
          setEmailNotifications(response.data.emailNotifications ?? true);
          setSmsNotifications(response.data.smsNotifications ?? false);
          setActivityUpdates(response.data.activityUpdates ?? true);
          setBookingReminders(response.data.bookingReminders ?? true);
        }
      } catch (error: any) {
        console.error('Error fetching settings:', error);
        // Don't show error toast, just use defaults
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [setTheme]);

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await updateSettings({
        theme,
        emailNotifications,
        smsNotifications,
        activityUpdates,
        bookingReminders
      });

      if (response.success) {
        toast.success('Settings saved successfully!');
      }
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleThemeToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF9F5] dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FA9884] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F5] dark:bg-gray-900 transition-colors">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8 transition-colors">
          <div className="flex justify-between items-center mb-8 pb-4 border-b dark:border-gray-700">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Settings</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account preferences</p>
            </div>
            {/* <button
              onClick={onBack}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ← Back
            </button> */}
          </div>

          {/* Appearance Settings */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
              Appearance
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                    Dark Mode
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={theme === 'dark'}
                    onChange={handleThemeToggle}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#FA9884]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FA9884]"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Account Settings */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Account Information</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-200">Email</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
                <button className="text-[#FA9884] hover:underline text-sm font-medium">
                  Change
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-200">Password</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">••••••••</p>
                </div>
                <button className="text-[#FA9884] hover:underline text-sm font-medium">
                  Change
                </button>
              </div>
            </div>
          </section>

          {/* Notification Settings */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Notifications</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-200">Email Notifications</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Receive updates via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#FA9884]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FA9884]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-200">SMS Notifications</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Receive text message alerts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smsNotifications}
                    onChange={(e) => setSmsNotifications(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#FA9884]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FA9884]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-200">Activity Updates</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Get notified about pet activities</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activityUpdates}
                    onChange={(e) => setActivityUpdates(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#FA9884]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FA9884]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-200">Booking Reminders</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Reminders for upcoming bookings</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bookingReminders}
                    onChange={(e) => setBookingReminders(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#FA9884]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FA9884]"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Privacy Settings */}
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Privacy & Security</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-200">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security</p>
                </div>
                <button className="text-[#FA9884] hover:underline text-sm font-medium">
                  Enable
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-200">Data Privacy</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Manage your data preferences</p>
                </div>
                <button className="text-[#FA9884] hover:underline text-sm font-medium">
                  View
                </button>
              </div>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex justify-end gap-4 pt-6 border-t dark:border-gray-700">
            <button
              onClick={onBack}
              className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={saveSettings}
              disabled={saving}
              className="px-6 py-3 bg-[#FA9884] text-white rounded-lg font-semibold hover:bg-[#E8876F] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
