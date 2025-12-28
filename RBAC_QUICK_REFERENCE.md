# RBAC Quick Reference

## Backend Middleware Usage

```javascript
const { authenticate, requireRole, requireAdmin, checkOwnership } = require('../middleware/auth');
const { ROLES } = require('../utils/rbac');

// Admin only
router.get('/admin/endpoint', authenticate, requireAdmin, controller);

// Specific role
router.post('/resource', authenticate, requireRole(ROLES.PET_OWNER), controller);

// Multiple roles
router.get('/shared', authenticate, requireRole([ROLES.ADMIN, ROLES.PET_OWNER]), controller);

// With ownership
router.get('/pets/:petId', 
  authenticate,
  checkOwnership('petId', 'userId', getPetById),
  controller
);
```

## Frontend Component Protection

```jsx
import { ROLES } from '../utils/rbac';
import ProtectedRoute from '../components/ProtectedRoute';

// Admin only
<ProtectedRoute requiredRoles={ROLES.ADMIN}>
  <AdminPanel />
</ProtectedRoute>

// Conditional rendering
import { isAdmin } from '../utils/rbac';

{isAdmin(user) && <AdminFeature />}
{!isAdmin(user) && <UserFeature />}
```

## Error Codes

- `AUTH_REQUIRED` - 401: Not authenticated
- `INSUFFICIENT_PERMISSIONS` - 403: Wrong role
- `ADMIN_REQUIRED` - 403: Admin access needed
- `OWNERSHIP_REQUIRED` - 403: Not resource owner

## API Functions

```javascript
// Admin API
import { getAllUsers, getUserById, updateUserById, deleteUserById } from '../services/api';

// Regular API
import { getUserProfile, loginUser, registerUser } from '../services/api';
```
