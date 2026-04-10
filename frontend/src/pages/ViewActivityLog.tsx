import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { getActivityLogById } from '../services/api';

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

export default function ViewActivityLog() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [log, setLog] = useState<ActivityLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLog();
  }, [id]);

  const fetchLog = async () => {
    try {
      setLoading(true);
      const response = await getActivityLogById(Number(id));
      setLog(response.data || response);
    } catch (error: any) {
      console.error('Error fetching activity log:', error);
      toast.error(error.message || 'Failed to load activity log');
      navigate('/activity-logs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityLabel = (value: string) => {
    return activityTypes.find(t => t.value === value)?.label || value;
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Activity Details</h1>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 p-8">
          <div className="space-y-6">
            {/* Pet */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pet</label>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{log.pet?.name || 'Unknown'}</p>
            </div>

            {/* Activity Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Activity Type</label>
              <div className="inline-block">
                <span className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400 rounded-full text-sm font-medium">
                  {getActivityLabel(log.activity_type)}
                </span>
              </div>
            </div>

            {/* Date & Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date & Time</label>
              <p className="text-gray-900 dark:text-gray-100">{formatDate(log.timestamp)}</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
              <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{log.detail}</p>
            </div>

            {/* Photo */}
            {log.photo && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Photo</label>
                <img
                  src={log.photo}
                  alt="Activity"
                  className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-600"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 flex gap-3 justify-end pt-6 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={() => navigate('/activity-logs')}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => navigate(`/activity-logs/edit/${log.activity_id}`)}
              className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
