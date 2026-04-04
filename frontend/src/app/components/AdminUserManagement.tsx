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
  const [limit, setLimit] = useState(10);
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

      // Response structure: { success: true, data: [...], pagination: {...} }
      let userData = response.data || [];
      const paginationData = response.pagination || {};
      
      // Filter by status if selected
      if (filterStatus === 'active') {
        userData = userData.filter((u: User) => u.isActive);
      } else if (filterStatus === 'inactive') {
        userData = userData.filter((u: User) => !u.isActive);
      }
      
      setUsers(Array.isArray(userData) ? userData : []);
      // When filtering, use filtered count; otherwise use server total
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
      const response = await updateAdminUser(editModal.user.id, editModal.formData);
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'staff':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pet_owner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">User Management</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalUsers}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {users.filter(u => u.isActive).length}
            </p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Pet Owners</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {users.filter(u => u.userType === 'pet_owner').length}
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
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

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

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400">
            <AlertCircle size={32} className="mx-auto mb-4 opacity-50" />
            <p>No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{user.phoneNumber || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.userType)}`}>
                        {user.userType === 'pet_owner' ? 'Pet Owner' : user.userType.charAt(0).toUpperCase() + user.userType.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        {user.isActive ? (
                          <>
                            <CheckCircle size={16} className="text-green-500" />
                            <span className="text-green-600 dark:text-green-400">Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={16} className="text-red-500" />
                            <span className="text-red-600 dark:text-red-400">Inactive</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEditClick(user)}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                          title="Deactivate"
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
            Page {currentPage} of {totalPages} ({totalUsers} total users)
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

      {/* View Details Modal */}
      {detailsModal.isOpen && detailsModal.user && (
        <div className="fixed inset-0 z-50 overflow-auto bg-white">
          <div className="min-h-screen p-8">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {detailsModal.user.firstName} {detailsModal.user.lastName}
                  </h1>
                  <p className="text-gray-600 mt-1">{detailsModal.user.email}</p>
                </div>
                <button
                  onClick={() => setDetailsModal({ isOpen: false, user: null })}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                {/* Left Column - Personal Info */}
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600">Full Name</p>
                        <p className="text-gray-900 font-medium">{detailsModal.user.firstName} {detailsModal.user.lastName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="text-gray-900">{detailsModal.user.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="text-gray-900">{detailsModal.user.phoneNumber || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="text-gray-900">{detailsModal.user.address || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">City</p>
                        <p className="text-gray-900">{detailsModal.user.city || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Account Info */}
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600">Role</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(detailsModal.user.userType)}`}>
                          {detailsModal.user.userType === 'pet_owner' ? 'Pet Owner' : detailsModal.user.userType.charAt(0).toUpperCase() + detailsModal.user.userType.slice(1)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <div className="flex items-center gap-2 mt-1">
                          {detailsModal.user.isActive ? (
                            <>
                              <CheckCircle size={18} className="text-green-500" />
                              <span className="text-green-600 font-medium">Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={18} className="text-red-500" />
                              <span className="text-red-600 font-medium">Inactive</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Registered Date</p>
                        <p className="text-gray-900 font-medium">
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
                        <p className="text-sm text-gray-600">Email Verified</p>
                        <p className="text-gray-900 font-medium">{detailsModal.user.emailVerified ? '✓ Yes' : '✗ No'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pets Owned Section */}
              <div className="bg-gray-50 p-6 rounded-lg mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Pets Owned {detailsModal.user.pets && detailsModal.user.pets.length > 0 && `(${detailsModal.user.pets.length})`}
                </h2>
                {detailsModal.user.pets && detailsModal.user.pets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {detailsModal.user.pets.map((pet: any) => (
                      <div key={pet.pet_id} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-gray-900 text-lg">{pet.name}</p>
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
                              className="w-16 h-16 rounded-lg object-cover"
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
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setDetailsModal({ isOpen: false, user: null })}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Edit User</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">First Name</label>
                <input
                  type="text"
                  value={editModal.formData.firstName || ''}
                  onChange={(e) => setEditModal({ ...editModal, formData: { ...editModal.formData, firstName: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
                <input
                  type="text"
                  value={editModal.formData.lastName || ''}
                  onChange={(e) => setEditModal({ ...editModal, formData: { ...editModal.formData, lastName: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={editModal.formData.email || ''}
                  onChange={(e) => setEditModal({ ...editModal, formData: { ...editModal.formData, email: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                <input
                  type="tel"
                  value={editModal.formData.phoneNumber || ''}
                  onChange={(e) => setEditModal({ ...editModal, formData: { ...editModal.formData, phoneNumber: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                <select
                  value={editModal.formData.userType || ''}
                  onChange={(e) => setEditModal({ ...editModal, formData: { ...editModal.formData, userType: (e.target.value as any) } })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setEditModal({ isOpen: false, user: null, formData: {} })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                disabled={updatingId === editModal.user?.id}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {updatingId === editModal.user?.id ? 'Updating...' : 'Update'}
              </button>
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
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Deactivate User?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{deleteConfirm.userName}</p>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400">
                This will deactivate the user account. They won't be able to log in, but their data will be preserved.
              </p>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm({ isOpen: false, userId: null, userName: '' })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deletingId === deleteConfirm.userId}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
