# 🐾 PawWell Care Center

A complete pet care management system with user authentication, built with Node.js, Express, PostgreSQL, and React.

## ✨ Features

- **User Authentication** - Register, login, logout with JWT tokens
- **PostgreSQL Database** - Secure data storage with Sequelize ORM
- **Password Recovery** - Forgot/reset password via email
- **Protected Routes** - Secure dashboard and user areas
- **Modern UI** - Clean, responsive React interface
- **RESTful API** - Well-documented API endpoints
- **No Email Verification** - Quick registration process

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- PostgreSQL (v12+)
- npm or yarn

### 1. Clone Repository
```bash
git clone <repository-url>
cd PawWell-Care-Center
```

### 2. Setup Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE pawwell_db;
CREATE USER pawwell_user WITH PASSWORD 'pawwell_user';
GRANT ALL PRIVILEGES ON DATABASE pawwell_db TO pawwell_user;
\q
```

### 3. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

### 4. Start Servers

**Option A - Use the batch script (Windows):**
```bash
# From root directory
start-servers.bat
```

**Option B - Manual start:**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm start
```

### 5. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api
- **Health Check**: http://localhost:8000/api/health

## 📁 Project Structure

```
PawWell-Care-Center/
├── backend/                 # Node.js/Express backend
│   ├── config/             # Configuration files
│   ├── controllers/        # API controllers
│   ├── middleware/         # Auth, validation, rate limiting
│   ├── models/             # Sequelize models (User, PasswordReset)
│   ├── routes/             # API routes
│   ├── utils/              # Email service, JWT helpers
│   ├── validators/         # Input validation
│   ├── .env                # Environment variables
│   ├── server.js           # Server entry point
│   └── package.json
│
├── frontend/               # React frontend
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── context/       # Auth context
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service
│   │   ├── utils/         # Helper functions
│   │   ├── App.jsx        # Main app component
│   │   └── index.js       # Entry point
│   ├── .env               # Environment variables
│   └── package.json
│
├── INTEGRATION_COMPLETE.md # Complete integration guide
└── start-servers.bat       # Quick start script (Windows)
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/accounts/register` | Register new user | No |
| POST | `/api/accounts/login` | Login user | No |
| POST | `/api/accounts/forgot-password` | Request password reset | No |
| POST | `/api/accounts/reset-password` | Reset password | No |
| POST | `/api/accounts/token/refresh` | Refresh access token | No |
| GET | `/api/accounts/profile` | Get user profile | Yes |
| POST | `/api/accounts/logout` | Logout user | Yes |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Check API status |

## 🔒 Security

- **JWT Authentication** - Secure token-based auth
- **bcrypt Password Hashing** - Strong password encryption
- **Rate Limiting** - Prevent brute force attacks
- **Helmet.js** - Security headers
- **CORS** - Configured for frontend
- **Input Validation** - All inputs validated
- **SQL Injection Protection** - Sequelize ORM

## 📝 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=8000
DB_NAME=pawwell_db
DB_USER=pawwell_user
DB_PASSWORD=pawwell_user
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET=your-secret-key
JWT_ACCESS_TOKEN_EXPIRE=60m
JWT_REFRESH_TOKEN_EXPIRE=1d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_NAME=PawWell Care Center
```

## 🧪 Testing

### Test Registration
```bash
curl -X POST http://localhost:8000/api/accounts/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "confirmPassword": "Test1234",
    "firstName": "John",
    "lastName": "Doe",
    "userType": "pet_owner"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:8000/api/accounts/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

## 🎯 User Flow

1. Visit http://localhost:3000
2. Click "Sign Up"
3. Fill registration form
4. Account created immediately (no email verification)
5. Redirect to login page
6. Login with credentials
7. Access protected dashboard

## 📚 Documentation

- **Backend README**: [backend/README.md](backend/README.md)
- **Integration Guide**: [INTEGRATION_COMPLETE.md](INTEGRATION_COMPLETE.md)
- **Quick Notes**: [backend/NOTES.md](backend/NOTES.md)

## 🛠️ Tech Stack

### Backend
- Node.js & Express.js
- PostgreSQL & Sequelize ORM
- JWT (jsonwebtoken)
- bcryptjs
- Nodemailer
- express-validator
- Helmet.js & CORS

### Frontend
- React 18
- React Router v6
- Axios
- Formik & Yup
- React Toastify
- Context API

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

PawWell Care Center Development Team

## 🙏 Acknowledgments

- Create React App for frontend setup
- Express.js community
- PostgreSQL team

---

**PawWell Care Center** - Taking care of your pets, one paw at a time 🐾
