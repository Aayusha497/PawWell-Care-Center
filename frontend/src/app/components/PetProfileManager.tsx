import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { getUserPets, createPet, updatePet, deletePet } from '../../services/api';
import { toast } from 'sonner';

interface Pet {
  pet_id: number;
  name: string;
  breed: string;
  age: number;
  weight: string;
  height: string;
  sex: 'Male' | 'Female';
  photo: string;
  allergies?: string;
  triggering_point?: string;
  medical_history?: string;
}

export default function PetProfileManager() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    age: '',
    weight: '',
    height: '',
    sex: 'Male' as 'Male' | 'Female',
    allergies: '',
    triggering_point: '',
    medical_history: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch pets on mount
  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      setLoading(true);
      const response = await getUserPets();
      setPets(response.data || []);
    } catch (error: any) {
      console.error('Error fetching pets:', error);
      toast.error(error.message || 'Failed to load pets');
    } finally {
      setLoading(false);
    }
  };

  const validateField = (name: string, value: any) => {
    let error = '';
    
    switch (name) {
      case 'name':
        if (!value || !value.trim()) error = 'Pet name is required';
        else if (!/^[a-zA-Z\s]+$/.test(value)) error = 'Name can only contain letters and spaces';
        break;
      case 'breed':
        if (!value || !value.trim()) error = 'Breed is required';
        else if (!/^[a-zA-Z\s]+$/.test(value)) error = 'Breed can only contain letters and spaces';
        break;
      case 'age':
        if (!value) error = 'Age is required';
        else if (Number(value) < 0 || Number(value) > 50) error = 'Age must be between 0 and 50';
        break;
      case 'weight':
        if (!value) error = 'Weight is required';
        else if (Number(value) < 0.1 || Number(value) > 999.99) error = 'Weight must be between 0.1 and 999.99 kg';
        break;
      case 'height':
        if (!value) error = 'Height is required';
        else if (Number(value) < 0.1 || Number(value) > 999.99) error = 'Height must be between 0.1 and 999.99 cm';
        break;
      case 'sex':
        if (!value) error = 'Sex is required';
        break;
    }
    
    return error;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, photo: 'Only image files are allowed' }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, photo: 'Image size must be less than 5MB' }));
        return;
      }
      
      setPhotoFile(file);
      setErrors(prev => ({ ...prev, photo: '' }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) newErrors[key] = error;
    });
    
    if (!editingPet && !photoFile) {
      newErrors.photo = 'Pet photo is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix all errors before submitting');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('breed', formData.breed.trim());
      data.append('age', formData.age);
      data.append('weight', formData.weight);
      data.append('height', formData.height);
      data.append('sex', formData.sex);
      if (formData.allergies) data.append('allergies', formData.allergies.trim());
      if (formData.triggering_point) data.append('triggering_point', formData.triggering_point.trim());
      if (formData.medical_history) data.append('medical_history', formData.medical_history.trim());
      if (photoFile) data.append('photo', photoFile);
      
      if (editingPet) {
        await updatePet(editingPet.pet_id, data);
        toast.success('Pet profile updated successfully!');
      } else {
        await createPet(data);
        toast.success('Pet profile created successfully!');
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchPets();
    } catch (error: any) {
      console.error('Error saving pet:', error);
      toast.error(error.message || 'Failed to save pet profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (pet: Pet) => {
    setEditingPet(pet);
    setFormData({
      name: pet.name,
      breed: pet.breed,
      age: pet.age.toString(),
      weight: pet.weight.toString(),
      height: pet.height.toString(),
      sex: pet.sex,
      allergies: pet.allergies || '',
      triggering_point: pet.triggering_point || '',
      medical_history: pet.medical_history || ''
    });
    setPhotoPreview(pet.photo);
    setPhotoFile(null);
    setErrors({});
    setIsDialogOpen(true);
  };

  const handleDelete = async (pet: Pet) => {
    if (!confirm(`Are you sure you want to delete ${pet.name}'s profile?`)) {
      return;
    }
    
    try {
      await deletePet(pet.pet_id);
      toast.success('Pet profile deleted successfully!');
      fetchPets();
    } catch (error: any) {
      console.error('Error deleting pet:', error);
      toast.error(error.message || 'Failed to delete pet profile');
    }
  };

  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingPet(null);
    setFormData({
      name: '',
      breed: '',
      age: '',
      weight: '',
      height: '',
      sex: 'Male',
      allergies: '',
      triggering_point: '',
      medical_history: ''
    });
    setPhotoFile(null);
    setPhotoPreview('');
    setErrors({});
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">My Pets</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} className="bg-[#EAB308] hover:bg-[#D4A017]">
              <Plus className="mr-2" size={18} />
              Add Pet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPet ? 'Edit Pet Profile' : 'Add New Pet'}</DialogTitle>
              <DialogDescription>
                {editingPet ? 'Update your pet information below' : 'Fill in the details to add a new pet'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo Upload */}
              <div>
                <Label htmlFor="photo">Pet Photo *</Label>
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className={errors.photo ? 'border-red-500' : ''}
                />
                {errors.photo && <p className="text-red-500 text-sm mt-1">{errors.photo}</p>}
                {photoPreview && (
                  <div className="mt-2">
                    <img src={photoPreview} alt="Preview" className="w-32 h-32 object-cover rounded" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Pet Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    onBlur={handleBlur}
                    className={errors.name ? 'border-red-500' : ''}
                    required
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>
                <div>
                  <Label htmlFor="breed">Breed *</Label>
                  <Input
                    id="breed"
                    name="breed"
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    onBlur={handleBlur}
                    className={errors.breed ? 'border-red-500' : ''}
                    required
                  />
                  {errors.breed && <p className="text-red-500 text-sm mt-1">{errors.breed}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="age">Age (years) *</Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    min="0"
                    max="50"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    onBlur={handleBlur}
                    className={errors.age ? 'border-red-500' : ''}
                    required
                  />
                  {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
                </div>
                <div>
                  <Label htmlFor="weight">Weight (kg) *</Label>
                  <Input
                    id="weight"
                    name="weight"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    onBlur={handleBlur}
                    className={errors.weight ? 'border-red-500' : ''}
                    required
                  />
                  {errors.weight && <p className="text-red-500 text-sm mt-1">{errors.weight}</p>}
                </div>
                <div>
                  <Label htmlFor="height">Height (cm) *</Label>
                  <Input
                    id="height"
                    name="height"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    onBlur={handleBlur}
                    className={errors.height ? 'border-red-500' : ''}
                    required
                  />
                  {errors.height && <p className="text-red-500 text-sm mt-1">{errors.height}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="sex">Sex *</Label>
                <Select 
                  value={formData.sex} 
                  onValueChange={(value) => setFormData({ ...formData, sex: value as 'Male' | 'Female' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sex" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
                {errors.sex && <p className="text-red-500 text-sm mt-1">{errors.sex}</p>}
              </div>

              <div>
                <Label htmlFor="allergies">Allergies (Optional)</Label>
                <Textarea
                  id="allergies"
                  name="allergies"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  className={errors.allergies ? 'border-red-500' : ''}
                  rows={2}
                  maxLength={500}
                />
                {errors.allergies && <p className="text-red-500 text-sm mt-1">{errors.allergies}</p>}
              </div>

              <div>
                <Label htmlFor="triggering_point">Triggering Points (Optional)</Label>
                <Textarea
                  id="triggering_point"
                  name="triggering_point"
                  value={formData.triggering_point}
                  onChange={(e) => setFormData({ ...formData, triggering_point: e.target.value })}
                  className={errors.triggering_point ? 'border-red-500' : ''}
                  rows={2}
                  maxLength={500}
                />
                {errors.triggering_point && <p className="text-red-500 text-sm mt-1">{errors.triggering_point}</p>}
              </div>

              <div>
                <Label htmlFor="medical_history">Medical History (Optional)</Label>
                <Textarea
                  id="medical_history"
                  name="medical_history"
                  value={formData.medical_history}
                  onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                  className={errors.medical_history ? 'border-red-500' : ''}
                  rows={3}
                  maxLength={1000}
                />
                {errors.medical_history && <p className="text-red-500 text-sm mt-1">{errors.medical_history}</p>}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="bg-[#EAB308] hover:bg-[#D4A017]">
                  {submitting ? 'Saving...' : (editingPet ? 'Update' : 'Add')} Pet
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EAB308]"></div>
        </div>
      ) : pets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No pets added yet</p>
          <Button onClick={handleAddNew} className="bg-[#EAB308] hover:bg-[#D4A017]">
            <Plus className="mr-2" size={18} />
            Add Your First Pet
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.map((pet) => (
            <Card key={pet.pet_id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48 bg-gray-200">
                <img 
                  src={pet.photo} 
                  alt={pet.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span>{pet.name}</span>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(pet)}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(pet)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Breed:</span>
                    <span>{pet.breed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Age:</span>
                    <span>{pet.age} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Weight:</span>
                    <span>{pet.weight} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Height:</span>
                    <span>{pet.height} cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sex:</span>
                    <span>{pet.sex}</span>
                  </div>
                  {pet.allergies && (
                    <div className="pt-2 border-t">
                      <p className="text-gray-600 mb-1">Allergies:</p>
                      <p className="text-sm">{pet.allergies}</p>
                    </div>
                  )}
                  {pet.triggering_point && (
                    <div className="pt-2 border-t">
                      <p className="text-gray-600 mb-1">Triggering Points:</p>
                      <p className="text-sm">{pet.triggering_point}</p>
                    </div>
                  )}
                  {pet.medical_history && (
                    <div className="pt-2 border-t">
                      <p className="text-gray-600 mb-1">Medical History:</p>
                      <p className="text-sm">{pet.medical_history}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
