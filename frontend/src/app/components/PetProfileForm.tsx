import { useState, useEffect } from 'react';
import { createPet, updatePet, getPetById } from '../../services/api';
import { toast } from 'sonner';

interface PetProfileFormProps {
  onBack: () => void;
  onSuccess?: () => void;
  petId?: number;
}

export default function PetProfileForm({ onBack, onSuccess, petId }: PetProfileFormProps) {
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
      const response = await getPetById(petId!);
      console.log('Pet data response:', response); // Debug log
      if (response.success && response.data) {
        const pet = response.data;
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
          last_vet_visit: ''
        });
        if (pet.photo) {
          setPhotoPreview(pet.photo);
        }
      }
    } catch (error: any) {
      console.error('Error loading pet:', error);
      toast.error('Failed to load pet data');
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Pet name is required';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.name)) {
      newErrors.name = 'Name can only contain letters and spaces';
    }

    if (!formData.breed.trim()) {
      newErrors.breed = 'Breed is required';
    }

    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else if (Number(formData.age) < 0 || Number(formData.age) > 50) {
      newErrors.age = 'Age must be between 0 and 50';
    }

    if (!formData.weight) {
      newErrors.weight = 'Weight is required';
    } else if (Number(formData.weight) < 0.1 || Number(formData.weight) > 999) {
      newErrors.weight = 'Weight must be between 0.1 and 999 kg';
    }

    if (!formData.height) {
      newErrors.height = 'Height is required';
    } else if (Number(formData.height) < 0.1 || Number(formData.height) > 999) {
      newErrors.height = 'Height must be between 0.1 and 999 cm';
    }

    if (!photoFile && !photoPreview && !petId) {
      newErrors.photo = 'Pet photo is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
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
      <div className="min-h-screen bg-[#FFF9F5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FA9884]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F5]">
      {/* Navigation Header */}
      <nav className="bg-white border-b px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐾</span>
            </div>
            <div className="flex items-center gap-6">
              <button className="px-4 py-2 rounded-full bg-[#FFE4A3] font-medium">Home</button>
              <button className="px-4 py-2 hover:bg-gray-100 rounded-full">Booking</button>
              <button className="px-4 py-2 hover:bg-gray-100 rounded-full">Activity Log</button>
              <button className="px-4 py-2 hover:bg-gray-100 rounded-full">About</button>
              <button className="px-4 py-2 hover:bg-gray-100 rounded-full">Contact</button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 bg-[#FF6B6B] text-white rounded-full text-sm flex items-center gap-2">
              <span>📞</span> Emergency
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">{petId ? formData.name + "'s Profile" : "Add New Pet"}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Photo */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <div className="w-48 h-48 mx-auto mb-4 rounded-full overflow-hidden bg-gray-100">
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
              <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
                <h3 className="text-xl font-semibold mb-4">Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Pet Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Kikyo"
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Breed</label>
                    <input
                      type="text"
                      value={formData.breed}
                      onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg ${errors.breed ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Golden Retriever"
                    />
                    {errors.breed && <p className="text-red-500 text-sm mt-1">{errors.breed}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Age</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg ${errors.age ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="3"
                    />
                    {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Weight</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg ${errors.weight ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="20"
                    />
                    {errors.weight && <p className="text-red-500 text-sm mt-1">{errors.weight}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Height(cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg ${errors.height ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="60"
                    />
                    {errors.height && <p className="text-red-500 text-sm mt-1">{errors.height}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Sex</label>
                    <select
                      value={formData.sex}
                      onChange={(e) => setFormData({ ...formData, sex: e.target.value as 'Male' | 'Female' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
                <h3 className="text-xl font-semibold mb-4">Medical Information</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Allergies</label>
                  <textarea
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={2}
                    placeholder="Dust mites, certain grass pollens. Develops itchy skin."
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Triggering Points</label>
                  <textarea
                    value={formData.triggering_point}
                    onChange={(e) => setFormData({ ...formData, triggering_point: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={2}
                    placeholder="Dust mites, certain grass pollens."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Last Bet Visit Date</label>
                  <input
                    type="text"
                    value={formData.last_vet_visit}
                    onChange={(e) => setFormData({ ...formData, last_vet_visit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Dec 28 2025 - Jan 01 2026"
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
                <h3 className="text-xl font-semibold mb-4">Special Care Needs</h3>
                <textarea
                  value={formData.medical_history}
                  onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Administer allergy medication daily morning."
                />
              </div>

              <div className="flex justify-center gap-4">
                <button
                  type="button"
                  onClick={onBack}
                  className="px-8 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition flex items-center gap-2"
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
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12 py-6">
        <div className="max-w-7xl mx-auto px-8 text-center text-gray-600">
          <p>2025 PawWell. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
