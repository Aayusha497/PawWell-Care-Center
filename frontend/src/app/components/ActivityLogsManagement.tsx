import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Eye, Edit2, Trash2 } from 'lucide-react';
import {
  getAllActivityLogs,
  getUserPets,
  deleteActivityLog,
  updateActivityLog,
} from '../../services/api';

interface ActivityLog {
  activity_id: number;
  pet_id: number;
  activity_type: string;
  detail: string;
  timestamp: string;
  photo?: string;
  pet?: { name: string };
}

interface Pet {
  pet_id: number;
  name: string;
}

interface ActivityLogsManagementProps {
  onRefreshLogs?: () => void;
}

export default function ActivityLogsManagement({ onRefreshLogs }: ActivityLogsManagementProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPetFilter, setSelectedPetFilter] = useState<string>('all');

  // View page
  const [viewingLog, setViewingLog] = useState<ActivityLog | null>(null);

  // Edit page
  const [editingLog, setEditingLog] = useState<ActivityLog | null>(null);
  const [editFormData, setEditFormData] = useState({
    activity_type: '',
    detail: '',
    photo: null as File | null
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete confirmation modal
  const [deletingLogId, setDeletingLogId] = useState<number | null>(null);

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

  useEffect(() => {
    fetchLogs();
    fetchPets();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, selectedPetFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await getAllActivityLogs();
      const logsArray = response.data || response.logs || [];

      if (Array.isArray(logsArray)) {
        const sorted = logsArray.sort(
          (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setLogs(sorted);
      } else {
        setLogs([]);
      }
    } catch (error: any) {
      console.error('Error fetching activity logs:', error);
      toast.error('Failed to load activity logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPets = async () => {
    try {
      const response = await getUserPets();
      const petData = response.pets || response.data || [];
      setPets(Array.isArray(petData) ? petData : []);
    } catch (error) {
      console.error('Error fetching pets:', error);
      setPets([]);
    }
  };

  const filterLogs = () => {
    if (selectedPetFilter === 'all') {
      setFilteredLogs(logs);
    } else {
      setFilteredLogs(logs.filter(log => String(log.pet_id) === selectedPetFilter));
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

  const handleDeleteLog = (activityId: number) => {
    setDeletingLogId(activityId);
  };

  const confirmDelete = async () => {
    if (deletingLogId === null) return;

    try {
      await deleteActivityLog(deletingLogId);
      toast.success('Activity log deleted successfully');
      setDeletingLogId(null);
      fetchLogs();
      if (onRefreshLogs) onRefreshLogs();
    } catch (error: any) {
      console.error('Error deleting activity log:', error);
      toast.error(error.message || 'Failed to delete activity log');
    }
  };

  const handleViewClick = (log: ActivityLog) => {
    setViewingLog(log);
  };

  const handleEditClick = (log: ActivityLog) => {
    setEditingLog(log);
    setEditFormData({
      activity_type: log.activity_type,
      detail: log.detail || '',
      photo: null
    });
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!editingLog) return;

    if (!editFormData.activity_type || !editFormData.detail.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setEditSubmitting(true);
      const formData = new FormData();
      formData.append('activity_type', editFormData.activity_type);
      formData.append('detail', editFormData.detail);
      if (editFormData.photo) {
        formData.append('photo', editFormData.photo);
      }

      await updateActivityLog(editingLog.activity_id, formData);
      toast.success('Activity log updated successfully');
      setEditingLog(null);
      fetchLogs();
      if (onRefreshLogs) onRefreshLogs();
    } catch (error: any) {
      console.error('Error updating activity log:', error);
      toast.error(error.message || 'Failed to update activity log');
    } finally {
      setEditSubmitting(false);
    }
  };

  if (viewingLog) {
    return (
      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 p-8">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-gray-600">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Activity Details</h1>
              <button
                onClick={() => setViewingLog(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-3xl leading-none"
                title="Close"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pet</label>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {viewingLog.pet?.name || 'Unknown'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Activity Type</label>
                <div className="inline-block">
                  <span className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400 rounded-full text-sm font-medium">
                    {getActivityLabel(viewingLog.activity_type)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date & Time</label>
                <p className="text-gray-900 dark:text-gray-100">{formatDate(viewingLog.timestamp)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{viewingLog.detail}</p>
              </div>

              {viewingLog.photo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Photo</label>
                  <img
                    src={viewingLog.photo}
                    alt="Activity"
                    className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-600"
                  />
                </div>
              )}
            </div>

            <div className="mt-8 flex gap-3 justify-end pt-6 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={() => setViewingLog(null)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (editingLog) {
    return (
      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 p-8">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-gray-600">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Edit Activity Log</h1>
              <button
                onClick={() => setEditingLog(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-3xl leading-none"
                title="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pet</label>
                <input
                  type="text"
                  value={editingLog.pet?.name || 'Unknown'}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Activity Type</label>
                <select
                  value={editFormData.activity_type}
                  onChange={(e) => setEditFormData({ ...editFormData, activity_type: e.target.value })}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  value={editFormData.detail}
                  onChange={(e) => setEditFormData({ ...editFormData, detail: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Update Photo (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0] || null;
                    setEditFormData({ ...editFormData, photo: file });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              {editingLog.photo && !editFormData.photo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Photo</label>
                  <img
                    src={editingLog.photo}
                    alt="Current"
                    className="h-32 w-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                  />
                </div>
              )}

              {editFormData.photo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Photo Preview</label>
                  <img
                    src={URL.createObjectURL(editFormData.photo)}
                    alt="Preview"
                    className="h-32 w-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                  />
                </div>
              )}

              <div className="flex gap-3 justify-end pt-6 border-t border-gray-200 dark:border-gray-600">
                <button
                  type="button"
                  onClick={() => setEditingLog(null)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={editSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={editSubmitting}
                >
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">View Activity Logs</h2>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Pet:</label>
          <select
            value={selectedPetFilter}
            onChange={(e) => setSelectedPetFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <option value="all">All Pets</option>
            {pets.map(pet => (
              <option key={pet.pet_id} value={String(pet.pet_id)}>
                {pet.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg">No activity logs found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredLogs.map(log => (
            <div
              key={log.activity_id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {log.pet?.name || 'Unknown Pet'}
                    </h3>
                    <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400 rounded-full text-sm font-medium">
                      {getActivityLabel(log.activity_type)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(log.timestamp)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewClick(log)}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="View details"
                  >
                    <Eye size={20} />
                  </button>
                  <button
                    onClick={() => handleEditClick(log)}
                    className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                    title="Edit log"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button
                    onClick={() => handleDeleteLog(log.activity_id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete log"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              <p className="text-gray-700 dark:text-gray-300">{log.detail}</p>

              {log.photo && (
                <div className="mt-4">
                  <img
                    src={log.photo}
                    alt="Activity photo"
                    className="h-32 w-32 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {deletingLogId !== null && (
        <div className="fixed inset-0 bg-black/40  flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 p-8 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-600">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Delete Activity Log
              </h2>
              <button
                onClick={() => setDeletingLogId(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
              >
                ×
              </button>
            </div>

            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete this activity log? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={() => setDeletingLogId(null)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}