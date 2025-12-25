# PawWell Care Center - Authentication System

A complete full-stack authentication system for PawWell Care Center, a pet care management platform.

## 🎯 Features Implemented

### Backend (Django + DRF)
- ✅ Custom User Model with email authentication
- ✅ Email verification system (24-hour token expiry)
- ✅ Password reset system (1-hour token expiry)
- ✅ JWT authentication with access and refresh tokens
- ✅ Token blacklisting for secure logout
- ✅ User registration, login, and profile endpoints
- ✅ Comprehensive email templates
- ✅ Password strength validation
- ✅ CORS configuration for frontend integration

### Frontend (React)
- ✅ Complete landing page with hero, services, and testimonials
- ✅ User registration form with validation
- ✅ Login page with email verification check
- ✅ Forgot password flow
- ✅ Reset password with token validation
- ✅ Email verification handler
- ✅ Protected routes with authentication
- ✅ Responsive navigation and footer
- ✅ Toast notifications
- ✅ Password strength indicator
- ✅ Token refresh interceptor

## 📋 Prerequisites

- Python 3.8+
- Node.js 14+
- PostgreSQL
- Git

## 🚀 Backend Setup

### 1. Navigate to backend directory
```bash
cd backend
```

### 2. Install Python dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure environment variables
The `.env` file is already created. Update these values:
```env
# Database (PostgreSQL)
DB_NAME=pawwell_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# Email (Gmail SMTP)
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
DEFAULT_FROM_EMAIL=PawWell Care Center <your_email@gmail.com>
```

### 4. Create PostgreSQL database
```bash
createdb pawwell_db
```

### 5. Run migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Create superuser (optional)
```bash
python manage.py createsuperuser
```

### 7. Run development server
```bash
python manage.py runserver
```

Backend will be available at: `http://localhost:8000`

## 🎨 Frontend Setup

### 1. Navigate to frontend directory
```bash
cd frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start development server
```bash
npm start
```

Frontend will be available at: `http://localhost:3000`

## 📁 Project Structure

### Backend
```
backend/
├── accounts/
│   ├── models.py          # User, EmailVerification, PasswordReset models
│   ├── serializers.py     # Request/Response serializers
│   ├── views.py           # API endpoints
│   ├── urls.py            # URL routing
│   └── utils.py           # Email utilities
├── pawwell_backend/
│   ├── settings.py        # Django configuration
│   └── urls.py            # Main URL configuration
└── requirements.txt       # Python dependencies
```

### Frontend
```
frontend/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx     # Navigation component
│   │   ├── Footer.jsx     # Footer component
│   │   └── ProtectedRoute.jsx
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── Signup.jsx
│   │   ├── Login.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── ResetPassword.jsx
│   │   ├── EmailVerification.jsx
│   │   └── Dashboard.jsx
│   ├── context/
│   │   └── AuthContext.js  # Authentication state management
│   ├── services/
│   │   └── api.js          # API calls and axios configuration
│   ├── utils/
│   │   └── auth.js         # Authentication utilities
│   ├── App.jsx             # Main app with routing
│   └── index.css           # Global styles
└── package.json
```

## 🔑 API Endpoints

### Authentication
- `POST /api/accounts/register/` - User registration
- `POST /api/accounts/login/` - User login
- `GET /api/accounts/verify-email/<token>/` - Email verification
- `POST /api/accounts/resend-verification/` - Resend verification email
- `POST /api/accounts/forgot-password/` - Request password reset
- `POST /api/accounts/reset-password/` - Reset password with token
- `POST /api/accounts/token/refresh/` - Refresh access token
- `GET /api/accounts/profile/` - Get user profile (protected)
- `POST /api/accounts/logout/` - Logout and blacklist token

## 🧪 Testing the System

### 1. Register a new user
- Go to `http://localhost:3000/signup`
- Fill in the registration form
- Check your email for verification link

### 2. Verify email
- Click the verification link in your email
- You'll be redirected to login

### 3. Login
- Use your email and password
- Access token and refresh token will be stored

### 4. Test protected routes
- Navigate to `/dashboard`
- You should see your profile information

### 5. Test password reset
- Go to `/forgot-password`
- Enter your email
- Check email for reset link
- Click link and set new password

## 🔒 Security Features

- Passwords are hashed using Django's default PBKDF2 algorithm
- Email verification required before login
- JWT tokens with expiry (Access: 60 min, Refresh: 1 day)
- Token blacklisting on logout
- CORS configured for specific origins
- SQL injection prevention through Django ORM
- XSS prevention through proper serialization
- CSRF protection enabled

## 🎨 UI Features

- Responsive design (mobile-first)
- Password strength indicator
- Form validation with Formik + Yup
- Toast notifications for user feedback
- Loading states and error handling
- Smooth animations and transitions
- Professional color scheme

## 📧 Email Configuration

### Gmail Setup
1. Enable 2-factor authentication
2. Generate app password
3. Use app password in `.env` file

### Email Templates
All emails include:
- Professional HTML templates
- PawWell branding
- Clickable links
- Expiry information

## 🛠️ Troubleshooting

### Backend Issues
- **Database connection error**: Check PostgreSQL is running and credentials are correct
- **Migration errors**: Delete migration files and run `makemigrations` again
- **Email not sending**: Verify SMTP settings and app password

### Frontend Issues
- **API connection error**: Ensure backend is running on port 8000
- **Token refresh fails**: Clear localStorage and login again
- **CORS errors**: Check `CORS_ALLOWED_ORIGINS` in Django settings

## 📝 Next Steps

### Recommended Enhancements
1. Add social authentication (Google, Facebook)
2. Implement 2-factor authentication
3. Add profile picture upload
4. Create pet management features
5. Add booking system for services
6. Implement admin dashboard
7. Add payment integration
8. Create appointment scheduling
9. Add real-time notifications
10. Implement chat support

## 📄 License

This project is part of PawWell Care Center platform.

## 👥 Support

For issues or questions, please contact the development team.

---

Built with ❤️ for pet lovers everywhere 🐾
