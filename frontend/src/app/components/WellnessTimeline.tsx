import { useState, useEffect } from 'react';
import { Syringe, Calendar, Stethoscope, Plus, Activity, Scissors, Utensils, AlertCircle, Clock, Trash2, Edit, X, LayoutDashboard, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { getUserPets, getTimelineEntries, createTimelineEntry, updateTimelineEntry, deleteTimelineEntry } from '../../services/api';

interface Pet {
  pet_id: number;
  name: string;
}

interface TimelineEntry {
  timeline_id: number;
  pet_id: number;
  date: string;
  type: string;
  title: string;
  description?: string;
  next_due_date?: string | null;
  created_at: string;
}

interface WellnessTimelineProps {
  onBack?: () => void;
  onLogout?: () => void;
}

export default function WellnessTimeline({ onBack, onLogout }: WellnessTimelineProps) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<string>('');
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEntryId, setCurrentEntryId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Medical Visit',
    title: '',
    description: '',
    next_due_date: ''
  });

  const fetchPets = async () => {
    try {
      const response = await getUserPets();
      console.log('Fetched pets response:', response);
      
      let petsArray: Pet[] = [];
      
      // Handle different response structures like in UserDashboard
      if (response.success && response.pets) {
        petsArray = response.pets;
      } else if (response.data) {
        petsArray = response.data;
      } else if (Array.isArray(response)) {
        petsArray = response;
      }
      
      setPets(petsArray);
      if (petsArray.length > 0) {
        setSelectedPet(petsArray[0].pet_id.toString());
      }
    } catch (error) {
      console.error('Error fetching pets:', error);
      toast.error('Failed to load pets');
    }
  };

  const fetchEntries = async () => {
    if (!selectedPet) return;
    
    try {
      setLoading(true);
      const response = await getTimelineEntries(selectedPet);
      const data = response.data || [];
      setEntries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching timeline:', error);
      toast.error('Failed to load timeline entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  useEffect(() => {
    if (selectedPet) {
      fetchEntries();
    }
  }, [selectedPet]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: 'Medical Visit',
      title: '',
      description: '',
      next_due_date: ''
    });
    setIsEditing(false);
    setCurrentEntryId(null);
  };

  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (entry: TimelineEntry) => {
    setFormData({
      date: new Date(entry.date).toISOString().split('T')[0],
      type: entry.type,
      title: entry.title,
      description: entry.description || '',
      next_due_date: entry.next_due_date ? new Date(entry.next_due_date).toISOString().split('T')[0] : ''
    });
    setIsEditing(true);
    setCurrentEntryId(entry.timeline_id);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setEntryToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!entryToDelete) return;
    
    try {
      await deleteTimelineEntry(entryToDelete);
      toast.success('Entry deleted');
      fetchEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
    } finally {
      setIsDeleteModalOpen(false);
      setEntryToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPet) {
      toast.error('Please select a pet first');
      return;
    }

    try {
      const payload = {
        ...formData,
        pet_id: parseInt(selectedPet),
        next_due_date: formData.next_due_date ? formData.next_due_date : undefined
      };

      if (isEditing && currentEntryId) {
        await updateTimelineEntry(currentEntryId, payload);
        toast.success('Entry updated successfully');
      } else {
        await createTimelineEntry(payload);
        toast.success('Entry added successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchEntries();
    } catch (error: any) {
      console.error('Error saving entry:', error);
      toast.error(error.message || 'Failed to save entry');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Medical Visit': return <Stethoscope className="h-5 w-5 text-blue-500" />;
      case 'Vaccination': return <Syringe className="h-5 w-5 text-green-500" />;
      case 'Grooming': return <Scissors className="h-5 w-5 text-purple-500" />;
      case 'Diet': return <Utensils className="h-5 w-5 text-orange-500" />;
      case 'Activity': return <Activity className="h-5 w-5 text-yellow-500" />;
      case 'Symptoms': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <Calendar className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Medical Visit': return 'bg-blue-100 text-blue-800';
      case 'Vaccination': return 'bg-green-100 text-green-800';
      case 'Grooming': return 'bg-purple-100 text-purple-800';
      case 'Diet': return 'bg-orange-100 text-orange-800';
      case 'Activity': return 'bg-yellow-100 text-yellow-800';
      case 'Symptoms': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F5]">

    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Wellness Timeline</h1>
          <p className="text-gray-500 mt-1">Track your pet's health journey</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          {pets.length > 0 ? (
            <select 
              value={selectedPet} 
              onChange={(e) => setSelectedPet(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-[180px] border-gray-300"
            >
              <option value="" disabled>Select Pet</option>
              {pets.map(pet => (
                <option key={pet.pet_id} value={pet.pet_id.toString()}>
                  {pet.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-sm text-gray-500">No pets found</span>
          )}

          <button 
            className="inline-flex items-center justify-center rounded-md text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-8 py-2 bg-[#EAB308] hover:bg-[#CA8A04] text-white shadow-md hover:shadow-lg transform active:scale-95 whitespace-nowrap" 
            onClick={handleAddNew}
          >
            <Plus className="mr-2 h-5 w-5" />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* Modal Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-[500px] p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold leading-none tracking-tight">
                {isEditing ? 'Edit Entry' : 'Add New Entry'}
              </h2>
              <button 
                onClick={() => setIsDialogOpen(false)}
                className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="date" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Date</label>
                  <input 
                    id="date" 
                    type="date" 
                    required 
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="type" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Type</label>
                  <select 
                    value={formData.type} 
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-gray-300"
                  >
                    <option value="Medical Visit">Medical Visit</option>
                    <option value="Vaccination">Vaccination</option>
                    <option value="Activity">Activity</option>
                    <option value="Grooming">Grooming</option>
                    <option value="Diet">Diet</option>
                    <option value="Symptoms">Symptoms</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Title</label>
                <input 
                  id="title" 
                  placeholder="e.g. Annual Checkup" 
                  required 
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Description (Optional)</label>
                <textarea 
                  id="description" 
                  placeholder="Enter details..." 
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="next_due_date" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Next Due Date (Optional)</label>
                <input 
                  id="next_due_date" 
                  type="date" 
                  value={formData.next_due_date}
                  onChange={(e) => handleInputChange('next_due_date', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-gray-300"
                />
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsDialogOpen(false)}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 border-gray-300"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-[#EAB308] hover:bg-[#CA8A04] text-white h-10 px-4 py-2"
                >
                  {isEditing ? 'Save Changes' : 'Create Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-[400px] p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Confirm Deletion
              </h2>
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this wellness timeline entry? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete Entry
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6 relative ml-0 md:ml-0">
        {/* Vertical Line */}
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 -translate-x-1/2"></div>

        {loading ? (
           <div className="text-center py-10 pl-8 md:pl-0">Loading timeline...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-gray-100 z-10 relative ml-8 md:ml-0">
            <p className="text-gray-500">No timeline entries found for this pet.</p>
            <button className="text-[#EAB308] hover:text-[#CA8A04] underline mt-2" onClick={handleAddNew}>Add your first entry</button>
          </div>
        ) : (
          entries.map((entry, index) => (
            <div key={entry.timeline_id} className={`relative flex items-center justify-between md:justify-center group ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
              
              {/* Icon */}
              <div className="absolute left-4 md:left-1/2 transform -translate-x-1/2 flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-gray-50 shadow-sm z-10 shrink-0">
                {getTypeIcon(entry.type)}
              </div>
              
              {/* Card */}
              <div className={`w-[calc(100%-3.5rem)] md:w-[calc(50%-2rem)] ml-14 md:ml-0 bg-white p-5 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md text-left ${index % 2 === 0 ? 'md:mr-auto' : 'md:ml-auto'}`}>
                <div className={`flex items-center gap-2 mb-2`}>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${getTypeColor(entry.type)}`}>
                    {entry.type}
                  </span>
                  <span className="text-xs font-medium text-gray-500">
                    {format(new Date(entry.date), 'MMM d, yyyy')}
                  </span>
                </div>
                
                <h3 className="font-bold text-gray-900 mb-2 text-lg">{entry.title}</h3>
                
                {entry.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {entry.description}
                  </p>
                )}
                
                {entry.next_due_date && (
                   <div className={`flex items-center gap-1 text-xs text-amber-600 font-medium mb-3 bg-amber-50 p-2 rounded inline-block`}>
                      <Clock className="h-3 w-3 inline mr-1" />
                      Next due: {format(new Date(entry.next_due_date), 'MMM d, yyyy')}
                   </div>
                )}

                <div className={`flex items-center gap-2 mt-2 pt-2 border-t border-gray-50 justify-start`}>
                  <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2" onClick={() => handleEdit(entry)}>
                     <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                  </button>
                  <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 text-red-600 hover:text-red-700 hover:bg-red-50 px-2" onClick={() => handleDelete(entry.timeline_id)}>
                     <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
    </div>
  );
}

 