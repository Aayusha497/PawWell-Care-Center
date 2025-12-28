# PawWell Care Center - Frontend (New)

Modern, responsive frontend for PawWell Care Center built with React, TypeScript, and Vite.

This is a code bundle for Pet Care Management System. The original project is available at https://www.figma.com/design/ceqLitmbyxGWBxwOXSVcwh/Pet-Care-Management-System.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or pnpm
- Backend server running (see `../backend/README.md`)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory (or use the existing one):

```env
VITE_API_URL=http://localhost:8000/api
```

Make sure the backend server is running on port 8000.

## 🏗️ Project Structure

```
src/
├── app/
│   ├── App.tsx              # Main application component
│   └── components/          # React components
│       ├── LandingPage.tsx  # Landing page
│       ├── LoginPage.tsx    # Login page
│       ├── SignupPage.tsx   # Registration page
│       ├── UserDashboard.tsx    # User dashboard
│       ├── AdminDashboard.tsx   # Admin dashboard
│       └── ui/              # Reusable UI components
├── context/
│   └── AuthContext.tsx      # Authentication context & state management
├── services/
│   └── api.ts              # API service with Axios
├── utils/
│   └── auth.ts             # Authentication utilities
├── styles/
│   ├── index.css           # Global styles
│   └── tailwind.css        # Tailwind configuration
└── main.tsx                # Application entry point
```

## 🔐 Authentication

The app uses JWT-based authentication with the backend API:

### Features
- User registration and login
- Automatic token refresh
- Protected routes
- Persistent sessions (localStorage)
- Role-based access (pet_owner, veterinarian, admin)

### Usage in Components

```typescript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, isLoggedIn, login, logout } = useAuth();
  
  // Access user data
  console.log(user?.email);
  
  // Check if logged in
  if (!isLoggedIn) {
    return <LoginPrompt />;
  }
  
  return <div>Welcome {user?.fullName}</div>;
}
```

## 🎨 UI Components

This project uses:
- **Radix UI** - Accessible component primitives
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Pre-built component library
- **Lucide React** - Icon library

## 📦 Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔌 API Integration

All API calls are handled through the centralized API service (`src/services/api.ts`):

```typescript
import { loginUser, registerUser, getProfile } from '../services/api';

// Login
const response = await loginUser({ email, password });

// Register
const response = await registerUser({ 
  email, 
  password, 
  firstName, 
  lastName 
});

// Get profile (authenticated)
const profile = await getProfile();
```

### Automatic Features
- JWT token attachment to requests
- Automatic token refresh on expiry
- Request/response logging
- Error handling

## 🎯 Key Features

### Implemented
- ✅ User authentication (login/register)
- ✅ JWT token management
- ✅ Protected routes
- ✅ Role-based dashboards
- ✅ Responsive design
- ✅ Modern UI components

### Pages
1. **Landing Page** - Welcome page with navigation to login/signup
2. **Login Page** - User authentication
3. **Signup Page** - New user registration
4. **User Dashboard** - Pet owner dashboard with booking, pet profiles, etc.
5. **Admin Dashboard** - Admin panel with analytics and management tools

## 🛠️ Development

### Adding New API Endpoints

1. Add the endpoint function in `src/services/api.ts`:
```typescript
export const getMyData = async (): Promise<any> => {
  const response = await api.get('/my-endpoint');
  return response.data;
};
```

2. Use it in components:
```typescript
import { getMyData } from '../services/api';

const data = await getMyData();
```

### Adding New Pages

1. Create component in `src/app/components/`
2. Add navigation logic in `App.tsx`
3. Update page type in App.tsx

## 🔍 Troubleshooting

### API Connection Issues
- Ensure backend is running on `http://localhost:8000`
- Check `.env` file has correct `VITE_API_URL`
- Verify CORS is configured in backend

### Authentication Issues
- Clear localStorage and try logging in again
- Check browser console for errors
- Verify JWT tokens in localStorage

### Build Issues
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Clear Vite cache: `rm -rf node_modules/.vite`

## 📚 Documentation

- [Integration Guide](../INTEGRATION.md) - Complete integration documentation
- [Backend API](../backend/README.md) - Backend API documentation
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📝 License

This project is part of PawWell Care Center.

---

For detailed integration information, see [INTEGRATION.md](../INTEGRATION.md)
