import { useState, useEffect } from 'react';
import { createPet, updatePet, getPetById } from '../../services/api';
import { toast } from 'sonner';

interface PetProfileFormProps {
  onBack: () => void;
  onSuccess?: () => void;
  petId?: number;
  onNavigate?: (page: string) => void;
}

export default function PetProfileForm({ onBack, onSuccess, petId, onNavigate }: PetProfileFormProps) {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    age: '',
    weight: '',
    height: '',
    sex: 'Male' as 'Male' | 'Female',
    allergies: '',
    triggering_point: '',
    medical_history: '',
    last_vet_visit: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load pet data if editing
  useEffect(() => {
    if (petId) {
      loadPetData();
    }
  }, [petId]);

  const loadPetData = async () => {
    try {
      setLoading(true);
      console.log('Loading pet data for petId:', petId);
      const response = await getPetById(petId!);
      console.log('Pet data response:', response);
      
      if (response.success && response.data) {
        const pet = response.data;
        console.log('Pet data received:', pet);
        // Format date to YYYY-MM-DD for the date input field
        const formatDateForInput = (dateString: string | Date | null) => {
          if (!dateString) return '';
          const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        
        setFormData({
          name: pet.name || '',
          breed: pet.breed || '',
          age: pet.age?.toString() || '',
          weight: pet.weight?.toString() || '',
          height: pet.height?.toString() || '',
          sex: pet.sex || 'Male',
          allergies: pet.allergies || '',
          triggering_point: pet.triggering_point || '',
          medical_history: pet.medical_history || '',
          last_vet_visit: formatDateForInput(pet.last_vet_visit)
        });
        if (pet.photo) {
          setPhotoPreview(pet.photo);
        }
        toast.success('Pet data loaded successfully');
      } else {
        console.error('Invalid response structure:', response);
        toast.error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Error loading pet - Full error:', error);
      const errorMessage = error?.message || error?.error || 'Failed to load pet data';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, photo: 'Photo must be less than 5MB' });
        return;
      }
      if (!file.type.startsWith('image/')) {
        setErrors({ ...errors, photo: 'File must be an image' });
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setErrors({ ...errors, photo: '' });
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Pet Name validation, letters and spaces only
    if (!formData.name.trim()) {
      newErrors.name = 'Pet name is required';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.name)) {
      newErrors.name = 'Pet Name can only contain letters (A–Z), no numbers or symbols allowed';
    }

    // Breed validation, letters and spaces only
    if (!formData.breed.trim()) {
      newErrors.breed ='Breed is required';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.breed)) {
      newErrors.breed = 'Breed can only contain letters (A–Z), no numbers or symbols allowed';
    }

    // Age validation, positive numbers only, range 0-50
    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else if (Number(formData.age) < 0 || Number(formData.age) > 50) {
      newErrors.age = 'Age must be between 0 and 50 years';
    } else if (!/^\d+(\.\d+)?$/.test(formData.age)) {
      newErrors.age = 'Age must be a valid number';
    }

    // Weight validation, positive numbers only, range 0.1-999
    if (!formData.weight) {
      newErrors.weight = 'Weight is required';
    } else if (Number(formData.weight) < 0.1 || Number(formData.weight) > 999) {
      newErrors.weight = 'Weight must be between 0.1 and 999 kg';
    } else if (!/^\d+(\.\d+)?$/.test(formData.weight)) {
      newErrors.weight = 'Weight must be a valid number';
    }

    // Height validation - positive numbers only, range 0.1-999
    if (!formData.height) {
      newErrors.height = 'Height is required';
    } else if (Number(formData.height) < 0.1 || Number(formData.height) > 999) {
      newErrors.height = 'Height must be between 0.1 and 999 cm';
    } else if (!/^\d+(\.\d+)?$/.test(formData.height)) {
      newErrors.height = 'Height must be a valid number';
    }

    // Sex validation - must select Male or Female
    if (!formData.sex) {
      newErrors.sex = 'Please select a sex';
    }

    // Allergies validation - required field and must contain at least one letter
    if (!formData.allergies.trim()) {
      newErrors.allergies = 'Allergies field is required';
    } else if (!/[a-zA-Z]/.test(formData.allergies)) {
      newErrors.allergies = 'Allergies must contain text with letters, not just numbers';
    }

    // Triggering Points validation - required field and must contain at least one letter
    if (!formData.triggering_point.trim()) {
      newErrors.triggering_point = 'Triggering Points field is required';
    } else if (!/[a-zA-Z]/.test(formData.triggering_point)) {
      newErrors.triggering_point = 'Triggering Points must contain text with letters, not just numbers';
    }

    // Last Vet Visit Date validation - required field and not in future
    if (!formData.last_vet_visit.trim()) {
      newErrors.last_vet_visit = 'Last Vet Visit Date is required';
    } else {
      try {
        const visitDate = new Date(formData.last_vet_visit);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Check if date is valid
        if (isNaN(visitDate.getTime())) {
          newErrors.last_vet_visit = 'Please enter a valid date (YYYY-MM-DD format)';
        } else if (visitDate > today) {
          newErrors.last_vet_visit = 'Last Vet Visit Date cannot be in the future';
        }
      } catch (error) {
        newErrors.last_vet_visit = 'Please enter a valid date (YYYY-MM-DD format)';
      }
    }

    // Medical History validation - must contain at least one letter if provided
    if (formData.medical_history.trim() && !/[a-zA-Z]/.test(formData.medical_history)) {
      newErrors.medical_history = 'Special Care Needs must contain text with letters, not just numbers';
    }

    // Photo validation
    if (!photoFile && !photoPreview && !petId) {
      newErrors.photo = 'Pet photo is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the mistakes in the form');
      return;
    }

    try {
      setLoading(true);
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('breed', formData.breed);
      formDataToSend.append('age', formData.age);
      formDataToSend.append('weight', formData.weight);
      formDataToSend.append('height', formData.height);
      formDataToSend.append('sex', formData.sex);
      formDataToSend.append('allergies', formData.allergies);
      formDataToSend.append('triggering_point', formData.triggering_point);
      formDataToSend.append('medical_history', formData.medical_history);
      formDataToSend.append('last_vet_visit', formData.last_vet_visit);
      
      if (photoFile) {
        formDataToSend.append('photo', photoFile);
      }

      let response;
      if (petId) {
        response = await updatePet(petId, formDataToSend);
        toast.success('Pet profile updated successfully!');
      } else {
        response = await createPet(formDataToSend);
        toast.success('Pet profile created successfully!');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        onBack();
      }
    } catch (error: any) {
      console.error('Error saving pet:', error);
      toast.error(error.message || 'Failed to save pet profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading && petId) {
    return (
      <div className="min-h-screen bg-[#FFF9F5] dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FA9884]"></div>
      </div>
    );
  }


  return (
    <div className="bg-[#FFF9F5] dark:bg-gray-900 transition-colors">
      {/* Main Content */}
      <div className="max-w-5xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8 dark:text-gray-100">{petId ? formData.name + "'s Profile" : "Add New Pet"}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Photo */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md transition-colors">
              <div className="w-48 h-48 mx-auto mb-4 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                {photoPreview ? (
                  <img 
                    src={photoPreview} 
                    alt="Pet preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span className="text-6xl">🐾</span>
                  </div>
                )}
              </div>
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  id="photo-upload"
                />
                <div className="bg-[#FFE4A3] text-center py-3 px-6 rounded-lg cursor-pointer hover:bg-[#FFD966] transition font-medium">
                  📤 Upload Photo
                </div>
              </label>
              {errors.photo && (
                <p className="text-red-500 text-sm mt-2 text-center">{errors.photo}</p>
              )}
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md mb-6 transition-colors">
                <h3 className="text-xl font-semibold mb-4 dark:text-gray-100">Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-300">Pet Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Kikyo"
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-300">Breed</label>
                    <input
                      type="text"
                      value={formData.breed}
                      onChange={(e) => handleInputChange('breed', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 ${errors.breed ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Golden Retriever"
                    />
                    {errors.breed && <p className="text-red-500 text-sm mt-1">{errors.breed}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-300">Age</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 ${errors.age ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="3"
                    />
                    {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-300">Weight</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 ${errors.weight ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="20"
                    />
                    {errors.weight && <p className="text-red-500 text-sm mt-1">{errors.weight}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-300">Height(cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.height}
                      onChange={(e) => handleInputChange('height', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 ${errors.height ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="60"
                    />
                    {errors.height && <p className="text-red-500 text-sm mt-1">{errors.height}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-300">Sex</label>
                    <select
                      value={formData.sex}
                      onChange={(e) => handleInputChange('sex', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 ${errors.sex ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    {errors.sex && <p className="text-red-500 text-sm mt-1">{errors.sex}</p>}
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md mb-6 transition-colors">
                <h3 className="text-xl font-semibold mb-4 dark:text-gray-100">Medical Information</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">Allergies <span className="text-red-500">*</span></label>
                  <textarea
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 ${errors.allergies ? 'border-red-500' : 'border-gray-300'}`}
                    rows={2}
                    placeholder="Dust mites, certain grass pollens. Develops itchy skin."
                  />
                  {errors.allergies && <p className="text-red-500 text-sm mt-1"> {errors.allergies}</p>}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">Triggering Points <span className="text-red-500">*</span></label>
                  <textarea
                    value={formData.triggering_point}
                    onChange={(e) => setFormData({ ...formData, triggering_point: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 ${errors.triggering_point ? 'border-red-500' : 'border-gray-300'}`}
                    rows={2}
                    placeholder="Dust mites, certain grass pollens."
                  />
                  {errors.triggering_point && <p className="text-red-500 text-sm mt-1"> {errors.triggering_point}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">Last Vet Visit Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={formData.last_vet_visit}
                    onChange={(e) => handleInputChange('last_vet_visit', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 ${errors.last_vet_visit ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.last_vet_visit && (
                    <p className="text-red-500 text-sm mt-1"> {errors.last_vet_visit}</p>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md mb-6 transition-colors">
                <h3 className="text-xl font-semibold mb-4 dark:text-gray-100">Special Care Needs</h3>
                <textarea
                  value={formData.medical_history}
                  onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 ${errors.medical_history ? 'border-red-500' : 'border-gray-300'}`}
                  rows={3}
                  placeholder="Administer allergy medication daily morning."
                />
                {errors.medical_history && <p className="text-red-500 text-sm mt-1">⚠️ {errors.medical_history}</p>}
              </div>
              

              <div className="flex justify-center gap-4">
                <button
                  type="button"
                  onClick={onBack}
                  className="px-8 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 transition flex items-center gap-2"
                  disabled={loading}
                >
                  ❌ Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-[#FFE4A3] rounded-lg font-medium hover:bg-[#FFD966] transition"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
