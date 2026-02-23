/**
 * Main App Component
 * 
 * Sets up routing and authentication context for the entire application
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './pages/theme.css';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import LandingPage from './pages/LandingPage';
import Signup from './pages/Signup';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOTP from './pages/VerifyOTP';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import About from './pages/About';
import Booking from './pages/Booking';
import PetList from './pages/PetList';
import AddPet from './pages/AddPet';
import EditPet from './pages/EditPet';
import ViewPet from './pages/ViewPet';
import ActivityLog from './pages/ActivityLog';
import ProfileSetup from './pages/ProfileSetup';

import { useLocation } from 'react-router-dom';

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

function AppContent() {
  const location = useLocation();
  const isDashboardRoute = location.pathname.startsWith('/dashboard') || 
                          location.pathname.startsWith('/pets') || 
                          location.pathname.startsWith('/booking') || 
                          location.pathname.startsWith('/activity-log');

  return (
        <div className="app">
          {!isDashboardRoute && <Navbar />}
          
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/verify-otp" element={<VerifyOTP />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              
              {/* Protected Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/booking" 
                element={
                  <ProtectedRoute requiredRole="pet_owner">
                    <Booking />
                  </ProtectedRoute>
                } 
              />
              
              {/* Pet Profile Routes */}
              <Route 
                path="/pets" 
                element={
                  <ProtectedRoute requiredRole="pet_owner">
                    <PetList />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/pets/add" 
                element={
                  <ProtectedRoute requiredRole="pet_owner">
                    <AddPet />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/pets/:petId" 
                element={
                  <ProtectedRoute requiredRole="pet_owner">
                    <ViewPet />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/pets/:petId/edit" 
                element={
                  <ProtectedRoute requiredRole="pet_owner">
                    <EditPet />
                  </ProtectedRoute>
                } 
              />
              
              {/* Activity Log Route */}
              <Route 
                path="/activity-log" 
                element={
                  <ProtectedRoute>
                    <ActivityLog />
                  </ProtectedRoute>
                } 
              />

              {/* Profile Setup Route */}
              <Route 
                path="/profile-setup" 
                element={
                  <ProtectedRoute>
                    <ProfileSetup />
                  </ProtectedRoute>
                } 
              />
              
              {/* Catch all - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          
          <Footer />
          
          {/* Toast notifications */}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            toastStyle={{
              backgroundColor: '#ffffff',
              color: '#1f2937',
              borderRadius: '0.75rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              padding: '1rem',
              fontSize: '0.95rem',
              border: '1px solid #e5e7eb'
            }}
            progressStyle={{
              background: '#EAB308'
            }}
          />
        </div>
  );
}

export default App;
