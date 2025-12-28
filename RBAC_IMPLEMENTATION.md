# Role-Based Access Control (RBAC) Implementation Guide

## ✅ Implementation Complete

This document describes the complete RBAC system implemented for PawWell Care Center.

---

## 🎯 Overview

The system implements industry-standard Role-Based Access Control with:
- **Two primary roles**: `admin` and `pet_owner` (user)
- **Backend enforcement**: Middleware-based authorization
- **Frontend protection**: Component-level role checking
- **Proper error handling**: 401 (Unauthorized) vs 403 (Forbidden)

---

## 🔧 Backend Implementation

### 1. RBAC Utilities (`backend/utils/rbac.js`)

**Constants:**
```javascript
const ROLES = {
  ADMIN: 'admin',
  PET_OWNER: 'pet_owner',
  USER: 'pet_owner'
};
```

**Helper Functions:**
- `hasRole(userRole, requiredRoles)` - Check if user has required role
- `isAdmin(user)` - Check if user is admin
- `isPetOwner(user)` - Check if user is pet owner
- `formatRole(role)` - Format role for display

### 2. Enhanced Auth Middleware (`backend/middleware/auth.js`)

#### Core Middleware Functions:

**`requireRole(allowedRoles)`**
- Enforces role-based authorization
- Usage: `requireRole([ROLES.ADMIN])` or `requireRole(ROLES.PET_OWNER)`
- Returns 403 with clear error message if unauthorized

**`requireAdmin()`**
- Shorthand for requiring admin role
- Returns structured error response

**`checkOwnership(resourceIdParam, ownerIdField, getResource)`**
- Validates resource ownership
- Admins bypass ownership checks
- Usage: `checkOwnership('petId', 'userId', getPetById)`

**`checkUserIdOwnership()`**
- Simple ownership validation for userId params
- Admins can access any user's data

### 3. Admin Routes (`backend/routes/admin.js`)

All routes require authentication + admin role:

```javascript
// User Management
GET    /api/admin/users              // Get all users (paginated, searchable)
GET    /api/admin/users/:userId      // Get user by ID
PUT    /api/admin/users/:userId      // Update user
DELETE /api/admin/users/:userId      // Delete/deactivate user

// System Management
GET    /api/admin/bookings           // Get all bookings
GET    /api/admin/stats              // Get system statistics
PUT    /api/admin/config             // Update system config
```

### 4. Admin Controller (`backend/controllers/adminController.js`)

Implements:
- User management (CRUD operations)
- System statistics
- Booking overview
- Prevents self-deletion for admins

### 5. Error Response Standards

**401 Unauthorized** (Authentication failure):
```json
{
  "success": false,
  "message": "Authentication required.",
  "code": "AUTH_REQUIRED"
}
```

**403 Forbidden** (Authorization failure):
```json
{
  "success": false,
  "message": "Access denied. Required role(s): admin",
  "code": "INSUFFICIENT_PERMISSIONS",
  "requiredRoles": ["admin"],
  "userRole": "pet_owner"
}
```

**403 Ownership** (Resource ownership failure):
```json
{
  "success": false,
  "message": "Access denied. You can only access your own resources.",
  "code": "OWNERSHIP_REQUIRED"
}
```

---

## 🎨 Frontend Implementation

### 1. RBAC Utilities (`frontend/src/utils/rbac.js`)

**Constants:**
```javascript
export const ROLES = {
  ADMIN: 'admin',
  PET_OWNER: 'pet_owner',
  USER: 'pet_owner'
};
```

**Helper Functions:**
- `hasRole(userRole, requiredRoles)` - Check role
- `isAdmin(user)` - Check if admin
- `isPetOwner(user)` - Check if pet owner
- `getUserDashboardRoute(user)` - Get appropriate dashboard route

### 2. Enhanced ProtectedRoute (`frontend/src/components/ProtectedRoute.jsx`)

**Features:**
- Authentication checking
- Role-based authorization
- Automatic redirects based on user role
- Permission denied page for unauthorized access

**Usage:**
```jsx
// Require authentication only
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

// Require specific role
<ProtectedRoute requiredRoles={ROLES.ADMIN}>
  <AdminPanel />
</ProtectedRoute>

// Require one of multiple roles
<ProtectedRoute requiredRoles={[ROLES.ADMIN, ROLES.PET_OWNER]}>
  <SharedFeature />
</ProtectedRoute>

// Redirect unauthorized users
<ProtectedRoute requiredRoles={ROLES.ADMIN} redirectTo="/dashboard">
  <AdminPanel />
</ProtectedRoute>
```

### 3. Permission Denied Page (`frontend/src/components/PermissionDenied.tsx`)

- Beautiful, user-friendly error page
- Explains access restriction
- Provides navigation options
- Customizable message and redirect

### 4. Role-Based Navigation (`frontend/src/components/Navbar.jsx`)

**Admin sees:**
- Dashboard (links to admin dashboard)
- Manage Users
- All Bookings
- Admin badge in greeting

**Pet Owner sees:**
- Dashboard (links to user dashboard)
- My Pets
- My Bookings

Navigation items are conditionally rendered based on `isAdmin(user)`.

### 5. 403 Error Handling (`frontend/src/services/api.js`)

**Axios Interceptor:**
- Detects 403 responses
- Identifies RBAC-specific errors by code
- Dispatches custom events for UI handling
- Prevents retry attempts on permission errors

**Error Codes:**
- `INSUFFICIENT_PERMISSIONS` - Wrong role
- `ADMIN_REQUIRED` - Admin access needed
- `OWNERSHIP_REQUIRED` - Resource ownership needed

### 6. App.tsx Role Protection

Dashboards now have inline RBAC checks:
- Admin dashboard only accessible by admins
- User dashboard only accessible by pet owners
- Shows PermissionDenied component for violations

---

## 📋 Usage Examples

### Backend: Protecting Routes

```javascript
// Admin-only endpoint
router.get('/admin/users', 
  authenticate,           // Must be logged in
  requireAdmin,          // Must be admin
  controller.getUsers
);

// Resource with ownership
router.get('/pets/:petId',
  authenticate,          // Must be logged in
  checkOwnership('petId', 'userId', getPetById),  // Must own pet
  controller.getPet
);

// Multiple roles allowed
router.post('/bookings',
  authenticate,
  requireRole([ROLES.ADMIN, ROLES.PET_OWNER]),
  controller.createBooking
);
```

### Frontend: Protecting Components

```jsx
import { ROLES } from '../utils/rbac';
import ProtectedRoute from '../components/ProtectedRoute';

// Admin-only route
<Route path="/admin/*" element={
  <ProtectedRoute requiredRoles={ROLES.ADMIN}>
    <AdminLayout />
  </ProtectedRoute>
} />

// User route
<Route path="/dashboard" element={
  <ProtectedRoute requiredRoles={ROLES.PET_OWNER}>
    <UserDashboard />
  </ProtectedRoute>
} />

// Conditional rendering
import { isAdmin } from '../utils/rbac';

{isAdmin(user) && (
  <AdminFeature />
)}

{!isAdmin(user) && (
  <UserFeature />
)}
```

### API Calls with Error Handling

```javascript
import { getAllUsers } from '../services/api';

try {
  const response = await getAllUsers({ page: 1, limit: 20 });
  // Handle success
} catch (error) {
  if (error.code === 'INSUFFICIENT_PERMISSIONS') {
    // Show permission denied message
    alert('You do not have permission to access this resource');
  } else if (error.code === 'AUTH_REQUIRED') {
    // Redirect to login
    navigate('/login');
  }
}
```

---

## 🔒 Security Best Practices Implemented

1. **Separation of Concerns**
   - Authentication (who you are) separate from Authorization (what you can do)
   - Clear middleware chain: authenticate → authorize → handle

2. **Proper HTTP Status Codes**
   - 401: Authentication required/failed
   - 403: Authenticated but insufficient permissions
   - 404: Resource not found (after auth/authz)

3. **Structured Error Responses**
   - Consistent error format
   - Error codes for programmatic handling
   - Helpful messages for users

4. **Defense in Depth**
   - Backend enforcement (primary)
   - Frontend checks (UX enhancement)
   - Both layers must agree on roles

5. **Ownership Validation**
   - Users can only access their own resources
   - Admins have override capability
   - Prevents horizontal privilege escalation

6. **Role Hierarchy Ready**
   - `ROLE_HIERARCHY` defined for future expansion
   - Easy to add new roles (staff, veterinarian, etc.)

---

## 🚀 Testing the Implementation

### Test Admin Access

1. **Login as Admin:**
   - Use admin credentials
   - Should see admin dashboard
   - Should see "Manage Users", "All Bookings" in navbar

2. **Test Admin Endpoints:**
   ```bash
   # Get all users (with admin token)
   curl -H "Authorization: Bearer <admin_token>" \
        http://localhost:8000/api/admin/users
   
   # Should return user list
   ```

3. **Test Permission Denial:**
   - Login as pet_owner
   - Try to access admin endpoints
   - Should receive 403 Forbidden

### Test Pet Owner Access

1. **Login as Pet Owner:**
   - Should see user dashboard
   - Should see "My Pets", "My Bookings" in navbar

2. **Test Ownership:**
   - Try to access another user's pets/bookings
   - Should receive 403 Forbidden

3. **Test Admin Dashboard Access:**
   - Navigate to admin dashboard route
   - Should see PermissionDenied page

---

## 📊 Role Matrix

| Feature | Admin | Pet Owner |
|---------|-------|-----------|
| View All Users | ✅ | ❌ |
| Manage Users | ✅ | ❌ |
| View All Bookings | ✅ | ❌ |
| System Stats | ✅ | ❌ |
| View Own Profile | ✅ | ✅ |
| Edit Own Profile | ✅ | ✅ |
| Manage Own Pets | ✅ | ✅ |
| Manage Own Bookings | ✅ | ✅ |
| View Other Users' Data | ✅ | ❌ |
| Delete Users | ✅ | ❌ |

---

## 🔄 Future Enhancements

### Optional Improvements:

1. **Rename `userType` to `role`** (across codebase)
   ```javascript
   // Current
   user.userType === 'admin'
   
   // Better
   user.role === ROLES.ADMIN
   ```

2. **Add More Roles:**
   - Veterinarian
   - Staff
   - Manager
   
3. **Permission-Based Access Control (PBAC):**
   ```javascript
   const PERMISSIONS = {
     USER_READ: 'user:read',
     USER_WRITE: 'user:write',
     BOOKING_CREATE: 'booking:create'
   };
   ```

4. **Audit Logging:**
   - Log all admin actions
   - Track permission denials

5. **Rate Limiting by Role:**
   - Different limits for admin vs users
   
---

## 📝 Summary

✅ **Backend:**
- Role-based middleware implemented
- Admin routes protected
- Ownership validation in place
- Proper 401/403 error responses

✅ **Frontend:**
- ProtectedRoute enhanced with role checking
- Role-based navigation
- Permission denied UI
- 403 error handling in API interceptor

✅ **Security:**
- Industry-standard RBAC
- Clean separation of auth vs authz
- Defense in depth (backend + frontend)
- Scalable and maintainable

✅ **Production Ready:**
- Clear error messages
- Proper HTTP semantics
- Reusable middleware
- Well-documented code

The implementation follows academic RBAC principles and industry best practices. Both backend and frontend enforce authorization, providing secure, scalable, and maintainable access control.
