import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { getActivityLogById, updateActivityLog } from '../services/api';

interface ActivityLog {
  activity_id: number;
  pet_id: number;
  activity_type: string;
  detail: string;
  timestamp: string;
  photo?: string;
  pet?: { name: string };
}

const activityTypes = [
  { value: 'feeding', label: 'Feeding' },
  { value: 'walk', label: 'Walk' },
  { value: 'playtime', label: 'Playtime' },
  { value: 'medication', label: 'Medication' },
  { value: 'grooming', label: 'Grooming' },
  { value: 'training', label: 'Training' },
  { value: 'veterinary', label: 'Veterinary Visit' },
  { value: 'other', label: 'Other Activity' },
];

export default function EditActivityLog() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [log, setLog] = useState<ActivityLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    activity_type: '',
    detail: '',
    photo: null as File | null
  });

  useEffect(() => {
    fetchLog();
  }, [id]);

  const fetchLog = async () => {
    try {
      setLoading(true);
      const response = await getActivityLogById(Number(id));
      const fetchedLog = response.data || response;
      setLog(fetchedLog);
      setFormData({
        activity_type: fetchedLog.activity_type,
        detail: fetchedLog.detail || '',
        photo: null
      });
    } catch (error: any) {
      console.error('Error fetching activity log:', error);
      toast.error(error.message || 'Failed to load activity log');
      navigate('/activity-logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.activity_type || !formData.detail.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('activity_type', formData.activity_type);
      data.append('detail', formData.detail);
      if (formData.photo) {
        data.append('photo', formData.photo);
      }

      await updateActivityLog(Number(id), data);
      toast.success('Activity log updated successfully');
      navigate('/activity-logs');
    } catch (error: any) {
      console.error('Error updating activity log:', error);
      toast.error(error.message || 'Failed to update activity log');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">Activity log not found</p>
          <button
            onClick={() => navigate('/activity-logs')}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors"
          >
            Back to Logs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/activity-logs')}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Back"
          >
            <ArrowLeft size={24} className="text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Edit Activity Log</h1>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pet (disabled) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pet</label>
              <input
                type="text"
                value={log.pet?.name || 'Unknown'}
                disabled
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
              />
            </div>

            {/* Activity Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Activity Type</label>
              <select
                value={formData.activity_type}
                onChange={(e) => setFormData({ ...formData, activity_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                required
              >
                <option value="">Select activity type</option>
                {activityTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
              <textarea
                value={formData.detail}
                onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                required
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Update Photo (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const file = e.target.files?.[0] || null;
                  setFormData({ ...formData, photo: file });
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            {/* Current Photo */}
            {log.photo && !formData.photo && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Photo</label>
                <img
                  src={log.photo}
                  alt="Current"
                  className="h-32 w-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                />
              </div>
            )}

            {/* New Photo Preview */}
            {formData.photo && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Photo Preview</label>
                <img
                  src={URL.createObjectURL(formData.photo)}
                  alt="Preview"
                  className="h-32 w-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-6 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={() => navigate('/activity-logs')}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
