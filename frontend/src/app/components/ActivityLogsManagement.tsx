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
  
  // View modal
  const [viewingLog, setViewingLog] = useState<ActivityLog | null>(null);
  
  // Edit modal
  const [editingLog, setEditingLog] = useState<ActivityLog | null>(null);
  const [editFormData, setEditFormData] = useState({
    activity_type: '',
    detail: '',
    photo: null as File | null
  });

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
      console.log('Activity logs response:', response);
      
      // Response structure from backend: { success, count, data: [...] }
      const logsArray = response.data || response.logs || [];
      
      if (Array.isArray(logsArray)) {
        // Sort by timestamp (newest first)
        const sorted = logsArray.sort(
          (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setLogs(sorted);
      } else {
        console.warn('logs array is not an array:', logsArray);
        setLogs([]);
      }
    } catch (error: any) {
      console.error('Error fetching activity logs:', error);
      console.error('Error details:', error.response || error.message);
      toast.error(`Failed to load activity logs: ${error.message || 'Unknown error'}`);
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

  const handleDeleteLog = async (activityId: number) => {
    if (!window.confirm('Are you sure you want to delete this activity log?')) {
      return;
    }

    try {
      await deleteActivityLog(activityId);
      toast.success('Activity log deleted successfully');
      fetchLogs();
      if (onRefreshLogs) onRefreshLogs();
    } catch (error: any) {
      console.error('Error deleting activity log:', error);
      toast.error(error.message || 'Failed to delete activity log');
    }
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
      const formData = new FormData();
      formData.append('activity_type', editFormData.activity_type);
      formData.append('description', editFormData.detail);
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
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">View Activity Logs</h2>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Pet:</label>
          <select
            value={selectedPetFilter}
            onChange={(e) => setSelectedPetFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500 text-lg">No activity logs found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredLogs.map(log => (
            <div key={log.activity_id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {log.pet?.name || 'Unknown Pet'}
                    </h3>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      {getActivityLabel(log.activity_type)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{formatDate(log.timestamp)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewingLog(log)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View details"
                  >
                    <Eye size={20} />
                  </button>
                  <button
                    onClick={() => handleEditClick(log)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Edit log"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button
                    onClick={() => handleDeleteLog(log.activity_id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete log"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
              
              <p className="text-gray-700">{log.detail}</p>
              
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

      {/* View Modal */}
      {viewingLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Activity Details</h3>
              <button
                onClick={() => setViewingLog(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pet</label>
                <p className="text-gray-900 font-semibold">{viewingLog.pet?.name || 'Unknown'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
                <p className="text-gray-900">{getActivityLabel(viewingLog.activity_type)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                <p className="text-gray-900">{formatDate(viewingLog.timestamp)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-gray-900 whitespace-pre-wrap">{viewingLog.detail}</p>
              </div>
              
              {viewingLog.photo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>
                  <img
                    src={viewingLog.photo}
                    alt="Activity"
                    className="max-w-full h-auto rounded-lg"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => setViewingLog(null)}
                className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Edit Activity Log</h3>
              <button
                onClick={() => setEditingLog(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pet</label>
                <input
                  type="text"
                  value={editingLog.pet?.name || 'Unknown'}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Activity Type</label>
                <select
                  value={editFormData.activity_type}
                  onChange={(e) => setEditFormData({ ...editFormData, activity_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={editFormData.detail}
                  onChange={(e) => setEditFormData({ ...editFormData, detail: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Update Photo (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0] || null;
                    setEditFormData({ ...editFormData, photo: file });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              {editingLog.photo && !editFormData.photo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Photo</label>
                  <img
                    src={editingLog.photo}
                    alt="Current"
                    className="h-32 w-32 object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setEditingLog(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-yellow-300 hover:bg-yellow-400 text-gray-900 rounded-lg font-semibold transition-colors"
                >
                  Update Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
