import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Pet {
  id: string;
  name: string;
  breed: string;
  age: number;
  weight: number;
  height: number;
  sex: 'Male' | 'Female';
  photo?: string;
  allergies: string;
  triggeringPoints: string;
  medicalHistory: string;
}

export default function PetProfileManager() {
  const [pets, setPets] = useState<Pet[]>([
    {
      id: '1',
      name: 'Max',
      breed: 'Golden Retriever',
      age: 3,
      weight: 30,
      height: 60,
      sex: 'Male',
      allergies: 'None',
      triggeringPoints: 'Loud noises',
      medicalHistory: 'Vaccinated, healthy'
    }
  ]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [formData, setFormData] = useState<Partial<Pet>>({
    name: '',
    breed: '',
    age: 0,
    weight: 0,
    height: 0,
    sex: 'Male',
    allergies: '',
    triggeringPoints: '',
    medicalHistory: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingPet) {
      setPets(pets.map(pet => 
        pet.id === editingPet.id ? { ...pet, ...formData } as Pet : pet
      ));
    } else {
      const newPet: Pet = {
        id: Date.now().toString(),
        ...formData as Omit<Pet, 'id'>
      };
      setPets([...pets, newPet]);
    }

    setIsDialogOpen(false);
    setEditingPet(null);
    setFormData({
      name: '',
      breed: '',
      age: 0,
      weight: 0,
      height: 0,
      sex: 'Male',
      allergies: '',
      triggeringPoints: '',
      medicalHistory: ''
    });
  };

  const handleEdit = (pet: Pet) => {
    setEditingPet(pet);
    setFormData(pet);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this pet profile?')) {
      setPets(pets.filter(pet => pet.id !== id));
    }
  };

  const handleAddNew = () => {
    setEditingPet(null);
    setFormData({
      name: '',
      breed: '',
      age: 0,
      weight: 0,
      height: 0,
      sex: 'Male',
      allergies: '',
      triggeringPoints: '',
      medicalHistory: ''
    });
    setIsDialogOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl">My Pets</h2>
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
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Pet Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="breed">Breed *</Label>
                  <Input
                    id="breed"
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="age">Age (years) *</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Weight (kg) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height (cm) *</Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="sex">Sex *</Label>
                <Select 
                  value={formData.sex} 
                  onValueChange={(value) => setFormData({ ...formData, sex: value as 'Male' | 'Female' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="allergies">Allergies</Label>
                <Textarea
                  id="allergies"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="List any allergies..."
                />
              </div>

              <div>
                <Label htmlFor="triggeringPoints">Triggering Points</Label>
                <Textarea
                  id="triggeringPoints"
                  value={formData.triggeringPoints}
                  onChange={(e) => setFormData({ ...formData, triggeringPoints: e.target.value })}
                  placeholder="What triggers stress or anxiety in your pet?"
                />
              </div>

              <div>
                <Label htmlFor="medicalHistory">Medical History</Label>
                <Textarea
                  id="medicalHistory"
                  value={formData.medicalHistory}
                  onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                  placeholder="Any medical conditions, medications, or treatments..."
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#EAB308] hover:bg-[#D4A017]">
                  {editingPet ? 'Update' : 'Add'} Pet
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pets.map((pet) => (
          <Card key={pet.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-[#F4D878] rounded-full flex items-center justify-center text-2xl">
                    🐕
                  </div>
                  <div>
                    <CardTitle>{pet.name}</CardTitle>
                    <p className="text-sm text-gray-600">{pet.breed}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(pet)}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(pet.id)}
                    className="p-2 hover:bg-red-50 text-red-600 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
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
                <div className="pt-2 border-t">
                  <p className="text-gray-600 mb-1">Allergies:</p>
                  <p className="text-sm">{pet.allergies || 'None'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pets.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-xl mb-2">No pets added yet</p>
          <p>Click "Add Pet" to create your first pet profile</p>
        </div>
      )}
    </div>
  );
}
