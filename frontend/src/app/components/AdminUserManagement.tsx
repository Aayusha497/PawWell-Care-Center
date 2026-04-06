import { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Eye, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { getAdminUsers, getAdminUserById, updateAdminUser, deleteAdminUser } from '../../services/api';
import { toast } from 'sonner';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  userType: 'pet_owner' | 'admin' | 'staff';
  isActive: boolean;
  dateJoined: string;
  emailVerified?: boolean;
  pets?: any[];
  profilePicture?: string;
  lastLogin?: string;
  twoFactorEnabled?: boolean;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  isStaff?: boolean;
  isSuperuser?: boolean;
  isProfileComplete?: boolean;
}

interface UserDetailsModal {
  isOpen: boolean;
  user: User | null;
}

interface EditModal {
  isOpen: boolean;
  user: User | null;
  formData: Partial<User>;
}

interface DeleteConfirmation {
  isOpen: boolean;
  userId: number | null;
  userName: string;
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Modals
  const [detailsModal, setDetailsModal] = useState<UserDetailsModal>({ isOpen: false, user: null });
  const [editModal, setEditModal] = useState<EditModal>({ isOpen: false, user: null, formData: {} });
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmation>({ isOpen: false, userId: null, userName: '' });
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchQuery, filterStatus]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getAdminUsers({
        page: currentPage,
        limit,
        search: searchQuery || undefined
      });

      let userData = response.data || [];
      const paginationData = response.pagination || {};
      
      if (filterStatus === 'active') {
        userData = userData.filter((u: User) => u.isActive);
      } else if (filterStatus === 'inactive') {
        userData = userData.filter((u: User) => !u.isActive);
      }
      
      setUsers(Array.isArray(userData) ? userData : []);
      const totalCount = filterStatus ? userData.length : paginationData.total || 0;
      setTotalUsers(totalCount);
      setTotalPages(filterStatus ? 1 : paginationData.pages || 1);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error(error.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = async (user: User) => {
    try {
      const response = await getAdminUserById(user.id);
      setDetailsModal({ isOpen: true, user: response.data || user });
    } catch (error: any) {
      console.error('Error fetching user details:', error);
      toast.error('Failed to load user details');
    }
  };

  const handleEditClick = (user: User) => {
    setEditModal({
      isOpen: true,
      user,
      formData: { ...user }
    });
  };

  const handleDeleteClick = (user: User) => {
    setDeleteConfirm({
      isOpen: true,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`
    });
  };

  const handleUpdateUser = async () => {
    if (!editModal.user) return;

    try {
      setUpdatingId(editModal.user.id);
      await updateAdminUser(editModal.user.id, editModal.formData);
      toast.success('User updated successfully!');
      setEditModal({ isOpen: false, user: null, formData: {} });
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.message || 'Failed to update user');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.userId) return;

    try {
      setDeletingId(deleteConfirm.userId);
      await deleteAdminUser(deleteConfirm.userId, false);
      toast.success('User deactivated successfully!');
      setDeleteConfirm({ isOpen: false, userId: null, userName: '' });
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  const getRoleTextColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-black dark:text-gray-100';
      case 'staff':
        return 'text-black dark:text-gray-100';
      case 'pet_owner':
        return 'text-black dark:text-gray-100';
      default:
        return 'text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6 bg-white">
      {/* Header with Stats */}
      <div className="bg-white p-6">
        <h2 className="text-2xl font-bold text-black mb-6">User Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#FACC15]/50">
            <p className="text-sm text-gray-500 mb-2">Total Users</p>
            <p className="text-3xl font-bold text-black">{totalUsers}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-[#FACC15]/50">
            <p className="text-sm text-gray-500 mb-2">Active</p>
            <p className="text-3xl font-bold text-black">
              {users.filter(u => u.isActive).length}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-[#FACC15]/50">
            <p className="text-sm text-gray-500 mb-2">Pet Owners</p>
            <p className="text-3xl font-bold text-black">
              {users.filter(u => u.userType === 'pet_owner').length}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 border border-[#FACC15]/50 rounded-2xl bg-white text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-3 border border-[#FACC15]/50 rounded-2xl bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-[28px] border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[#FACC15] border-t-transparent"></div>
            <p className="mt-4 text-gray-500">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <AlertCircle size={32} className="mx-auto mb-4 opacity-50" />
            <p>No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-black">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-black">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-black">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-black">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-black">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-200 hover:bg-[#FACC15]/10 transition">
                    <td className="px-6 py-4 text-sm text-black">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.phoneNumber || '-'}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <span className={getRoleTextColor(user.userType)}>
                        {user.userType === 'pet_owner' ? 'Pet Owner' : user.userType.charAt(0).toUpperCase() + user.userType.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        {user.isActive ? (
                          <>
                            <CheckCircle size={16} className="text-[#F59E0B]" />
                            <span className="text-black">Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={16} className="text-[#D97706]" />
                            <span className="text-black">Inactive</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="text-[#F59E0B] hover:text-[#D97706] transition"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEditClick(user)}
                          className="text-[#F59E0B] hover:text-[#D97706] transition"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user)}
                          className="p-2 rounded-xl border border-[#FACC15]/50 hover:bg-[#FACC15]/10 transition"
                          title="Deactivate"
                        >
                          <Trash2 size={18} className="text-black" />
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
        <div className="bg-white rounded-[28px] border border-gray-200 p-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {currentPage} of {totalPages} ({totalUsers} total users)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-[#FACC15]/50 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#FACC15]/10 transition text-black"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-[#FACC15] text-black rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#EAB308] transition font-semibold"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {detailsModal.isOpen && detailsModal.user && (
        <div className="fixed inset-0 z-50 overflow-auto bg-white">
          <div className="min-h-screen p-8 bg-white">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#FACC15]/40">
                <div className="flex items-center gap-4">
                  {detailsModal.user.profilePicture && (
                    <img
                      src={detailsModal.user.profilePicture}
                      alt={`${detailsModal.user.firstName} ${detailsModal.user.lastName}`}
                      className="w-20 h-20 rounded-full object-cover border-2 border-[#FACC15]/50"
                    />
                  )}
                  <div>
                    <h1 className="text-3xl font-bold text-black">
                      {detailsModal.user.firstName} {detailsModal.user.lastName}
                    </h1>
                    <p className="text-gray-600 mt-1">{detailsModal.user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setDetailsModal({ isOpen: false, user: null })}
                  className="w-11 h-11 rounded-xl border border-[#FACC15]/50 text-black hover:bg-[#FACC15]/10 transition text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Left Column - Personal Info */}
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-[#FACC15]/50">
                    <h2 className="text-lg font-semibold text-black mb-4">Personal Information</h2>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Full Name</p>
                        <p className="text-black font-medium">{detailsModal.user.firstName} {detailsModal.user.lastName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-black">{detailsModal.user.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="text-black">{detailsModal.user.phoneNumber || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="text-black">{detailsModal.user.address || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">City</p>
                        <p className="text-black">{detailsModal.user.city || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Account Info */}
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-[#FACC15]/50">
                    <h2 className="text-lg font-semibold text-black mb-4">Account Information</h2>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Role</p>
                        <p className={`font-medium mt-1 ${getRoleTextColor(detailsModal.user.userType)}`}>
                          {detailsModal.user.userType === 'pet_owner' ? 'Pet Owner' : detailsModal.user.userType.charAt(0).toUpperCase() + detailsModal.user.userType.slice(1)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <div className="flex items-center gap-2 mt-1">
                          {detailsModal.user.isActive ? (
                            <>
                              <CheckCircle size={18} className="text-[#F59E0B]" />
                              <span className="text-black font-medium">Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={18} className="text-[#D97706]" />
                              <span className="text-black font-medium">Inactive</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Registered Date</p>
                        <p className="text-black font-medium">
                          {detailsModal.user.dateJoined 
                            ? new Date(detailsModal.user.dateJoined).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'N/A'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email Verified</p>
                        <p className="text-black font-medium">{detailsModal.user.emailVerified ? '✓ Yes' : '✗ No'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Extended Profile Information */}
              <div className="bg-white p-6 rounded-2xl border border-[#FACC15]/50 mb-8">
                <h2 className="text-lg font-semibold text-black mb-4">Extended Profile</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {detailsModal.user.lastLogin && (
                    <div>
                      <p className="text-sm text-gray-500">Last Login</p>
                      <p className="text-black">
                        {new Date(detailsModal.user.lastLogin).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                  {detailsModal.user.emergencyContactName && (
                    <div>
                      <p className="text-sm text-gray-500">Emergency Contact Name</p>
                      <p className="text-black">{detailsModal.user.emergencyContactName}</p>
                    </div>
                  )}
                  {detailsModal.user.emergencyContactNumber && (
                    <div>
                      <p className="text-sm text-gray-500">Emergency Contact Number</p>
                      <p className="text-black">{detailsModal.user.emergencyContactNumber}</p>
                    </div>
                  )}
                  {detailsModal.user.isProfileComplete !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500">Profile Complete</p>
                      <p className="text-black font-medium">{detailsModal.user.isProfileComplete ? '✓ Yes' : '✗ No'}</p>
                    </div>
                  )}
                  {detailsModal.user.twoFactorEnabled !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500">Two Factor Enabled</p>
                      <p className="text-black font-medium">{detailsModal.user.twoFactorEnabled ? '✓ Yes' : '✗ No'}</p>
                    </div>
                  )}
                  {detailsModal.user.isStaff !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500">Is Staff</p>
                      <p className="text-black font-medium">{detailsModal.user.isStaff ? '✓ Yes' : '✗ No'}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pets Owned Section */}
              <div className="bg-white p-6 rounded-2xl border border-[#FACC15]/50 mb-8">
                <h2 className="text-lg font-semibold text-black mb-4">
                  Pets Owned {detailsModal.user.pets && detailsModal.user.pets.length > 0 && `(${detailsModal.user.pets.length})`}
                </h2>
                {detailsModal.user.pets && detailsModal.user.pets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {detailsModal.user.pets.map((pet: any) => (
                      <div key={pet.pet_id} className="bg-white p-4 rounded-xl border border-[#FACC15]/50 hover:bg-[#FACC15]/10 transition">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-black text-lg">{pet.name}</p>
                            <p className="text-sm text-gray-600 mt-1">{pet.breed || 'Unknown Breed'}</p>
                            <div className="mt-3 space-y-1">
                              <p className="text-sm text-gray-700"><span className="font-medium">Age:</span> {pet.age || '-'} years</p>
                              <p className="text-sm text-gray-700"><span className="font-medium">Weight:</span> {pet.weight ? `${pet.weight} kg` : '-'}</p>
                              {pet.sex && <p className="text-sm text-gray-700"><span className="font-medium">Sex:</span> {pet.sex}</p>}
                            </div>
                          </div>
                          {pet.photo && (
                            <img 
                              src={pet.photo} 
                              alt={pet.name} 
                              className="w-16 h-16 rounded-lg object-cover border border-[#FACC15]/50"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-4">No pets registered yet</p>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-6 border-t border-[#FACC15]/40">
                <button
                  onClick={() => setDetailsModal({ isOpen: false, user: null })}
                  className="px-6 py-2 bg-[#FACC15] text-black rounded-xl hover:bg-[#EAB308] transition font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.isOpen && editModal.user && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#FACC15]/40">
            <div className="p-6 border-b border-[#FACC15]/30">
              <h3 className="text-lg font-bold text-black">Edit User</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">First Name</label>
                <input
                  type="text"
                  value={editModal.formData.firstName || ''}
                  onChange={(e) => setEditModal({ ...editModal, formData: { ...editModal.formData, firstName: e.target.value } })}
                  className="w-full px-3 py-2 border border-[#FACC15]/50 rounded-xl bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">Last Name</label>
                <input
                  type="text"
                  value={editModal.formData.lastName || ''}
                  onChange={(e) => setEditModal({ ...editModal, formData: { ...editModal.formData, lastName: e.target.value } })}
                  className="w-full px-3 py-2 border border-[#FACC15]/50 rounded-xl bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">Email</label>
                <input
                  type="email"
                  value={editModal.formData.email || ''}
                  onChange={(e) => setEditModal({ ...editModal, formData: { ...editModal.formData, email: e.target.value } })}
                  className="w-full px-3 py-2 border border-[#FACC15]/50 rounded-xl bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">Phone</label>
                <input
                  type="tel"
                  value={editModal.formData.phoneNumber || ''}
                  onChange={(e) => setEditModal({ ...editModal, formData: { ...editModal.formData, phoneNumber: e.target.value } })}
                  className="w-full px-3 py-2 border border-[#FACC15]/50 rounded-xl bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">Role</label>
                <select
                  value={editModal.formData.userType || ''}
                  onChange={(e) => setEditModal({ ...editModal, formData: { ...editModal.formData, userType: (e.target.value as any) } })}
                  className="w-full px-3 py-2 border border-[#FACC15]/50 rounded-xl bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
                >
                  <option value="pet_owner">Pet Owner</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editModal.formData.isActive || false}
                    onChange={(e) => setEditModal({ ...editModal, formData: { ...editModal.formData, isActive: e.target.checked } })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-black">Active</span>
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-[#FACC15]/30 flex justify-end gap-3">
              <button
                onClick={() => setEditModal({ isOpen: false, user: null, formData: {} })}
                className="px-4 py-2 border border-[#FACC15]/50 rounded-xl hover:bg-[#FACC15]/10 transition text-black"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                disabled={updatingId === editModal.user?.id}
                className="px-4 py-2 bg-[#FACC15] text-black rounded-xl hover:bg-[#EAB308] disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
              >
                {updatingId === editModal.user?.id ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-[#FACC15]/40">
            <div className="p-6 border-b border-[#FACC15]/30 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#FACC15] flex items-center justify-center">
                <AlertCircle size={24} className="text-black" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-black">Deactivate User?</h3>
                <p className="text-sm text-gray-600">{deleteConfirm.userName}</p>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600">
                This will deactivate the user account. They won't be able to log in, but their data will be preserved.
              </p>
            </div>
            <div className="p-6 border-t border-[#FACC15]/30 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm({ isOpen: false, userId: null, userName: '' })}
                className="px-4 py-2 border border-[#FACC15]/50 rounded-xl hover:bg-[#FACC15]/10 transition text-black"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deletingId === deleteConfirm.userId}
                className="px-4 py-2 bg-[#FACC15] text-black rounded-xl hover:bg-[#EAB308] disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
              >
                {deletingId === deleteConfirm.userId ? 'Deactivating...' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}