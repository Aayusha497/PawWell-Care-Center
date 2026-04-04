import { useState, useEffect } from 'react';
import { Search, Eye, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { getAdminPets, getAdminPetById, deleteAdminPet } from '../../services/api';
import { toast } from 'sonner';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
}

interface Pet {
  pet_id: number;
  name: string;
  breed: string;
  age?: number;
  weight?: number;
  height?: number;
  sex?: string;
  allergies?: string;
  triggering_point?: string;
  medical_history?: string;
  photo?: string;
  owner: User;
  created_at?: string;
  updated_at?: string;
}

interface PetDetailsModal {
  isOpen: boolean;
  pet: Pet | null;
}

interface DeleteConfirmation {
  isOpen: boolean;
  petId: number | null;
  petName: string;
}

export default function AdminPetManagement() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPets, setTotalPets] = useState(0);

  // Modals
  const [detailsModal, setDetailsModal] = useState<PetDetailsModal>({ isOpen: false, pet: null });
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmation>({ isOpen: false, petId: null, petName: '' });
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchPets();
  }, [currentPage, searchQuery]);

  const fetchPets = async () => {
    try {
      setLoading(true);
      const response = await getAdminPets({
        page: currentPage,
        limit,
        search: searchQuery || undefined
      });

      // Response structure: { success: true, data: [...], pagination: {...} }
      const petData = response.data || [];
      const paginationData = response.pagination || {};
      
      setPets(Array.isArray(petData) ? petData : []);
      setTotalPets(paginationData.total || 0);
      setTotalPages(paginationData.pages || 1);
    } catch (error: any) {
      console.error('Error fetching pets:', error);
      toast.error(error.message || 'Failed to load pets');
      setPets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPet = async (pet: Pet) => {
    try {
      const response = await getAdminPetById(pet.pet_id);
      setDetailsModal({ isOpen: true, pet: response.data || pet });
    } catch (error: any) {
      console.error('Error fetching pet details:', error);
      toast.error('Failed to load pet details');
    }
  };

  const handleDeleteClick = (pet: Pet) => {
    setDeleteConfirm({
      isOpen: true,
      petId: pet.pet_id,
      petName: pet.name
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.petId) return;

    try {
      setDeletingId(deleteConfirm.petId);
      await deleteAdminPet(deleteConfirm.petId, false);
      toast.success('Pet deleted successfully!');
      setDeleteConfirm({ isOpen: false, petId: null, petName: '' });
      fetchPets();
    } catch (error: any) {
      console.error('Error deleting pet:', error);
      toast.error(error.message || 'Failed to delete pet');
    } finally {
      setDeletingId(null);
    }
  };

  const getBreedType = (breed: string) => {
    const breedLower = breed?.toLowerCase() || '';
    if (breedLower.includes('dog')) return '🐕';
    if (breedLower.includes('cat')) return '🐱';
    if (breedLower.includes('bird')) return '🦜';
    if (breedLower.includes('rabbit')) return '🐰';
    if (breedLower.includes('hamster')) return '🐹';
    if (breedLower.includes('fish')) return '🐠';
    return '🐾';
  };

  const getBreedColor = (breed: string) => {
    const breedLower = breed?.toLowerCase() || '';
    if (breedLower.includes('dog')) return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    if (breedLower.includes('cat')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    if (breedLower.includes('bird')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (breedLower.includes('rabbit')) return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Pet Management</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Pets</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalPets}</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Owners</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {new Set(pets.map(p => p.owner.id)).size}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by pet name or owner..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <select
            value={limit}
            onChange={(e) => {
              setLimit(parseInt(e.target.value));
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
      </div>

      {/* Pets Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading pets...</p>
          </div>
        ) : pets.length === 0 ? (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400">
            <AlertCircle size={32} className="mx-auto mb-4 opacity-50" />
            <p>No pets found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Pet Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Breed</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Owner</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pets.map((pet) => (
                  <tr key={pet.pet_id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-medium">
                      <div className="flex items-center gap-2">
                        <span>{getBreedType(pet.breed)}</span>
                        {pet.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getBreedColor(pet.breed)}`}>
                        {pet.breed || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{pet.breed || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {pet.owner.firstName} {pet.owner.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{pet.owner.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewPet(pet)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(pet)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages} ({totalPets} total pets)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* View Details Modal - Full Page */}
      {detailsModal.isOpen && detailsModal.pet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 w-full min-h-screen">
            <div className="min-h-screen p-8">
              <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    {detailsModal.pet.photo && (
                      <img
                        src={detailsModal.pet.photo}
                        alt={detailsModal.pet.name}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {detailsModal.pet.name}
                      </h1>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{detailsModal.pet.breed}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDetailsModal({ isOpen: false, pet: null })}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                  {/* Left Column - Pet Info */}
                  <div className="space-y-6">
                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Pet Information</h2>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                          <p className="text-gray-900 dark:text-gray-100 font-medium">{detailsModal.pet.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Breed</p>
                          <p className="text-gray-900 dark:text-gray-100">{detailsModal.pet.breed || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Age</p>
                          <p className="text-gray-900 dark:text-gray-100">{detailsModal.pet.age ? `${detailsModal.pet.age} years` : '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Sex</p>
                          <p className="text-gray-900 dark:text-gray-100">{detailsModal.pet.sex || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Physical Details */}
                  <div className="space-y-6">
                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Physical Details</h2>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Weight</p>
                          <p className="text-gray-900 dark:text-gray-100">{detailsModal.pet.weight ? `${detailsModal.pet.weight} kg` : '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Height</p>
                          <p className="text-gray-900 dark:text-gray-100">{detailsModal.pet.height ? `${detailsModal.pet.height} cm` : '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Registered Date</p>
                          <p className="text-gray-900 dark:text-gray-100 font-medium">
                            {detailsModal.pet.created_at 
                              ? new Date(detailsModal.pet.created_at).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric'
                                })
                              : 'N/A'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Owner Information */}
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Owner Information</h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Owner Name</p>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">
                        {detailsModal.pet.owner.firstName} {detailsModal.pet.owner.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Owner Email</p>
                      <p className="text-gray-900 dark:text-gray-100">{detailsModal.pet.owner.email}</p>
                    </div>
                    {detailsModal.pet.owner.phoneNumber && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Owner Phone</p>
                        <p className="text-gray-900 dark:text-gray-100">{detailsModal.pet.owner.phoneNumber}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Health Information */}
                {(detailsModal.pet.allergies || detailsModal.pet.triggering_point || detailsModal.pet.medical_history) && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Health Information</h2>
                    <div className="space-y-4">
                      {detailsModal.pet.allergies && (
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Allergies</p>
                          <p className="text-gray-900 dark:text-gray-100">{detailsModal.pet.allergies}</p>
                        </div>
                      )}
                      {detailsModal.pet.triggering_point && (
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Triggering Points</p>
                          <p className="text-gray-900 dark:text-gray-100">{detailsModal.pet.triggering_point}</p>
                        </div>
                      )}
                      {detailsModal.pet.medical_history && (
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Medical History</p>
                          <p className="text-gray-900 dark:text-gray-100">{detailsModal.pet.medical_history}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setDetailsModal({ isOpen: false, pet: null })}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium text-gray-900 dark:text-gray-100"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4">
              <AlertCircle size={32} className="text-red-500" />
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Delete Pet?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{deleteConfirm.petName}</p>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to delete this pet? This action can be undone from the database.
              </p>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm({ isOpen: false, petId: null, petName: '' })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deletingId === deleteConfirm.petId}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {deletingId === deleteConfirm.petId ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
