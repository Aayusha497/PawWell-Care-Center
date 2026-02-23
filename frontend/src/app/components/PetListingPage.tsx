import { useState, useEffect } from 'react';
import { getUserPets, deletePet } from '../../services/api';
import { toast } from 'sonner';
import PetProfileForm from './PetProfileForm';

interface PetListingPageProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

interface Pet {
  pet_id: number;
  name: string;
  breed: string;
  age: number;
  weight: string;
  height: string;
  sex: 'Male' | 'Female';
  photo?: string;
  allergies?: string;
  triggering_point?: string;
  medical_history?: string;
}

export default function PetListingPage({ onBack, onNavigate }: PetListingPageProps) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<number | undefined>(undefined);

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      setLoading(true);
      const response = await getUserPets();
      console.log('Pets response:', response);
      
      if (response.success && response.pets) {
        setPets(response.pets);
      } else if (response.data) {
        setPets(response.data);
      } else if (Array.isArray(response)) {
        setPets(response);
      } else {
        setPets([]);
      }
    } catch (error) {
      console.error('Error fetching pets:', error);
      toast.error('Failed to load pets');
      setPets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (petId: number) => {
    setSelectedPetId(petId);
    setShowEditForm(true);
  };

  const handleDelete = async (pet: Pet) => {
    if (!window.confirm(`Are you sure you want to delete ${pet.name}'s profile?`)) {
      return;
    }

    try {
      await deletePet(pet.pet_id);
      toast.success(`${pet.name}'s profile deleted successfully!`);
      fetchPets();
    } catch (error: any) {
      console.error('Error deleting pet:', error);
      toast.error(error.message || 'Failed to delete pet profile');
    }
  };

  const handleAddNew = () => {
    setSelectedPetId(undefined);
    setShowEditForm(true);
  };

  const handleBackToList = () => {
    setShowEditForm(false);
    setSelectedPetId(undefined);
    fetchPets();
  };

  if (showEditForm) {
    return (
      <PetProfileForm 
        onBack={handleBackToList}
        onSuccess={handleBackToList}
        petId={selectedPetId}
        onNavigate={onNavigate}
      />
    );
  }

  const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23FFE4A3' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='60' fill='%23FA9884'%3E🐾%3C/text%3E%3C/svg%3E";

  return (
    <div className="min-h-screen bg-[#FFF9F5]">
      {/* Navigation Header */}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Pets</h1>
          <button 
            onClick={handleAddNew}
            className="bg-[#FFE4A3] text-black px-6 py-2 rounded-lg font-medium hover:bg-[#FFD966] transition flex items-center gap-2"
          >
            + Add Pet
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FA9884]"></div>
          </div>
        ) : pets.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-md">
            <p className="text-gray-500 text-lg mb-6">You haven't added any pets yet.</p>
            <button 
              onClick={handleAddNew}
              className="bg-[#FA9884] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#E8876F] transition"
            >
              Add Your First Pet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pets.map((pet) => (
              <div 
                key={pet.pet_id} 
                className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition"
              >
                <div className="flex items-start gap-4">
                  {/* Pet Photo */}
                  <div 
                    className="w-24 h-24 rounded-full overflow-hidden bg-[#FFE4A3] flex-shrink-0 cursor-pointer"
                    onClick={() => handleEdit(pet.pet_id)}
                  >
                    {pet.photo ? (
                      <img 
                        src={pet.photo} 
                        alt={pet.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = placeholderImage;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        🐾
                      </div>
                    )}
                  </div>

                  {/* Pet Info */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{pet.name}</h3>
                        <p className="text-gray-600">{pet.breed}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(pet.pet_id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                          title="Edit"
                        >
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(pet)}
                          className="p-2 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Age:</span>
                        <span className="ml-2 font-medium">{pet.age} years</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Weight:</span>
                        <span className="ml-2 font-medium">{pet.weight} kg</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Height:</span>
                        <span className="ml-2 font-medium">{pet.height} cm</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Sex:</span>
                        <span className="ml-2 font-medium">{pet.sex}</span>
                      </div>
                    </div>

                    {pet.allergies && (
                      <div className="mt-3 text-sm">
                        <span className="text-gray-500">Allergies:</span>
                        <p className="text-gray-700 mt-1">{pet.allergies}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
