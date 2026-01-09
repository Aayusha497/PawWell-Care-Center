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
import PetList from './pages/PetList';
import AddPet from './pages/AddPet';
import EditPet from './pages/EditPet';
import ViewPet from './pages/ViewPet';

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="app">
          <Navbar />
          
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
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
              
              {/* Catch all - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          
          <Footer />
          
          {/* Toast notifications */}
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
