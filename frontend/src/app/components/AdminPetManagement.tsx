import { useState, useEffect } from 'react';
import { Search, Eye, Trash2, AlertCircle } from 'lucide-react';
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
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPets, setTotalPets] = useState(0);

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

  const getPetTypeLabel = (breed: string) => {
    const breedLower = breed?.toLowerCase() || '';
    if (breedLower.includes('dog')) return 'Dog';
    if (breedLower.includes('cat')) return 'Cat';
    if (breedLower.includes('bird')) return 'Bird';
    if (breedLower.includes('rabbit')) return 'Rabbit';
    if (breedLower.includes('hamster')) return 'Hamster';
    if (breedLower.includes('fish')) return 'Fish';
    return 'Pet';
  };

  const totalOwners = new Set(pets.map((p) => p.owner.id)).size;

  return (
    <div className="space-y-6 bg-white">
      {/* Header with Stats */}
      <div className="bg-white p-6">
        {/* <h2 className="text-2xl font-bold text-black dark:text-gray-100 mb-6">Pet Management</h2> */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-[#FACC15]/50 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Pets</p>
            <p className="text-3xl font-bold text-black dark:text-white">{totalPets}</p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-[#FACC15]/50 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Owners</p>
            <p className="text-3xl font-bold text-black dark:text-white">{totalOwners}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-6">
        <div className="grid grid-cols-1 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by pet name or owner..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 border border-[#FACC15]/50 rounded-2xl bg-white text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
            />
          </div>
        </div>
      </div>

      {/* Pets Table */}
      <div className="bg-white dark:bg-gray-800 rounded-[28px] border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[#FACC15] border-t-transparent"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading pets...</p>
          </div>
        ) : pets.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <AlertCircle size={32} className="mx-auto mb-4 opacity-50" />
            <p>No pets found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-black dark:text-gray-100">Pet Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-black dark:text-gray-100">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-black dark:text-gray-100">Breed</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-black dark:text-gray-100">Owner</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-black dark:text-gray-100">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-black dark:text-gray-100">Actions</th>
                </tr>
              </thead>

              <tbody>
                {pets.map((pet) => (
                  <tr
                    key={pet.pet_id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-[#FACC15]/10 dark:hover:bg-gray-700 transition"
                  >
                    <td className="px-6 py-4 text-sm text-black dark:text-gray-100 font-medium">
                      <div className="flex items-center gap-3">
                        {pet.photo ? (
                          <img
                            src={pet.photo}
                            alt={pet.name}
                            className="w-10 h-10 rounded-full object-cover border border-[#FACC15]/50"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#FACC15]/15 border border-[#FACC15]/50 flex items-center justify-center text-base">
                            🐾
                          </div>
                        )}
                        <span>{pet.name}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm font-semibold text-black dark:text-gray-100">
                      {getPetTypeLabel(pet.breed)}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{pet.breed || '-'}</td>

                    <td className="px-6 py-4 text-sm text-black dark:text-gray-100">
                      {pet.owner.firstName} {pet.owner.lastName}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{pet.owner.email}</td>

                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewPet(pet)}
                          className="text-[#F59E0B] hover:text-[#D97706] transition"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>

                        <button
                          onClick={() => handleDeleteClick(pet)}
                          className="p-2 rounded-xl border border-[#FACC15]/50 text-black hover:bg-[#FACC15]/10 transition"
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
        <div className="bg-white dark:bg-gray-800 rounded-[28px] border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages} ({totalPets} total pets)
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-xl border border-[#FACC15]/50 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#FACC15]/10 transition"
            >
              Previous
            </button>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-xl bg-[#FACC15] text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#EAB308] transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* View Details Modal - Full Page */}
      {detailsModal.isOpen && detailsModal.pet && (
        <div className="fixed inset-0 z-50 overflow-auto bg-white dark:bg-gray-900">
          <div className="min-h-screen p-8 bg-white dark:bg-gray-900">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#FACC15]/40 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  {detailsModal.pet.photo && (
                    <img
                      src={detailsModal.pet.photo}
                      alt={detailsModal.pet.name}
                      className="w-20 h-20 rounded-xl object-cover border-2 border-[#FACC15]/50"
                    />
                  )}
                  <div>
                    <h1 className="text-3xl font-bold text-black dark:text-gray-100">
                      {detailsModal.pet.name}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{detailsModal.pet.breed}</p>
                  </div>
                </div>

                <button
                  onClick={() => setDetailsModal({ isOpen: false, pet: null })}
                  className="w-11 h-11 rounded-xl border border-[#FACC15]/50 text-black dark:text-gray-100 hover:bg-[#FACC15]/10 transition text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Left Column - Pet Info */}
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-[#FACC15]/50 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-black dark:text-gray-100 mb-4">Pet Information</h2>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                        <p className="text-black dark:text-gray-100 font-medium">{detailsModal.pet.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Breed</p>
                        <p className="text-black dark:text-gray-100">{detailsModal.pet.breed || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Age</p>
                        <p className="text-black dark:text-gray-100">
                          {detailsModal.pet.age ? `${detailsModal.pet.age} years` : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Sex</p>
                        <p className="text-black dark:text-gray-100">{detailsModal.pet.sex || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Physical Details */}
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-[#FACC15]/50 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-black dark:text-gray-100 mb-4">Physical Details</h2>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Weight</p>
                        <p className="text-black dark:text-gray-100">
                          {detailsModal.pet.weight ? `${detailsModal.pet.weight} kg` : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Height</p>
                        <p className="text-black dark:text-gray-100">
                          {detailsModal.pet.height ? `${detailsModal.pet.height} cm` : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Registered Date</p>
                        <p className="text-black dark:text-gray-100 font-medium">
                          {detailsModal.pet.created_at
                            ? new Date(detailsModal.pet.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Owner Information */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-[#FACC15]/50 dark:border-gray-700 mb-8">
                <h2 className="text-lg font-semibold text-black dark:text-gray-100 mb-4">Owner Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Owner Name</p>
                    <p className="text-black dark:text-gray-100 font-medium">
                      {detailsModal.pet.owner.firstName} {detailsModal.pet.owner.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Owner Email</p>
                    <p className="text-black dark:text-gray-100">{detailsModal.pet.owner.email}</p>
                  </div>
                  {detailsModal.pet.owner.phoneNumber && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Owner Phone</p>
                      <p className="text-black dark:text-gray-100">{detailsModal.pet.owner.phoneNumber}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Health Information */}
              {(detailsModal.pet.allergies || detailsModal.pet.triggering_point || detailsModal.pet.medical_history) && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-[#FACC15]/50 dark:border-gray-700 mb-8">
                  <h2 className="text-lg font-semibold text-black dark:text-gray-100 mb-4">Health Information</h2>
                  <div className="space-y-4">
                    {detailsModal.pet.allergies && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Allergies</p>
                        <p className="text-black dark:text-gray-100">{detailsModal.pet.allergies}</p>
                      </div>
                    )}
                    {detailsModal.pet.triggering_point && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Triggering Points</p>
                        <p className="text-black dark:text-gray-100">{detailsModal.pet.triggering_point}</p>
                      </div>
                    )}
                    {detailsModal.pet.medical_history && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Medical History</p>
                        <p className="text-black dark:text-gray-100">{detailsModal.pet.medical_history}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-6 border-t border-[#FACC15]/40 dark:border-gray-700">
                <button
                  onClick={() => setDetailsModal({ isOpen: false, pet: null })}
                  className="px-6 py-2 rounded-xl bg-[#FACC15] text-black font-semibold hover:bg-[#EAB308] transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full border border-[#FACC15]/40 dark:border-gray-700">
            <div className="p-6 border-b border-[#FACC15]/30 dark:border-gray-700 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#FACC15] flex items-center justify-center">
                <AlertCircle size={24} className="text-black" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-black dark:text-gray-100">Delete Pet?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{deleteConfirm.petName}</p>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to delete this pet? This action can be undone from the database.
              </p>
            </div>

            <div className="p-6 border-t border-[#FACC15]/30 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm({ isOpen: false, petId: null, petName: '' })}
                className="p-2 rounded-xl border border-[#FACC15]/50 hover:bg-[#FACC15]/10 transition"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmDelete}
                disabled={deletingId === deleteConfirm.petId}
                className="px-4 py-2 bg-[#FACC15] text-black rounded-xl hover:bg-[#EAB308] disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
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