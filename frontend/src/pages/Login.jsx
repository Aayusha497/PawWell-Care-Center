/**
 * Login Page
 * 
 * User login form with email and password
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { loginUser, resendVerificationEmail } from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

// Validation schema
const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required'),
});

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const [resendEmail, setResendEmail] = useState('');

  const initialValues = {
    email: location.state?.email || '',
    password: '',
  };

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      const response = await loginUser({
        email: values.email,
        password: values.password,
      });

      if (response.success) {
        // Store tokens and user data
        login(response.access, response.refresh, response.user);
        
        toast.success('Login successful!');
        
        // Redirect to where they were trying to go, or dashboard
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Check if email not verified
      if (error.message && error.message.includes('verify')) {
        setShowResendButton(true);
        setResendEmail(values.email);
        toast.error('Please verify your email before logging in');
      } else {
        toast.error(error.message || 'Invalid email or password');
      }
      
      if (error.errors) {
        setErrors(error.errors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      await resendVerificationEmail(resendEmail);
      toast.success('Verification email sent! Please check your inbox');
      setShowResendButton(false);
    } catch (error) {
      toast.error('Failed to resend verification email');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card-login">
          {/* Logo */}
          <div className="auth-logo">
            <span className="paw-icon">🐾</span>
            <span className="logo-text">PawWell</span>
          </div>

          {/* Welcome Text */}
          <h1 className="auth-title">Welcome back to<br />PawWell!</h1>
          <p className="auth-subtitle">Sign in to your account to manage your pets and services.</p>

          {/* Login Form */}
          <div className="auth-form-section">
            <h2 className="form-section-title">Login to Your Account</h2>
            <p className="form-section-subtitle">Enter your credentials to continue.</p>

            {location.state?.registered && (
              <div className="info-message">
                <p>✓ Registration successful! Please check your email to verify your account before logging in.</p>
              </div>
            )}

            <Formik
              initialValues={initialValues}
              validationSchema={LoginSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting }) => (
                <Form className="auth-form">
                  <div className="form-group">
                    <label htmlFor="email">Email / Username</label>
                    <div className="input-with-icon">
                      <span className="input-icon">✉️</span>
                      <Field
                        type="email"
                        name="email"
                        id="email"
                        placeholder="Enter your email or username"
                        className="auth-input"
                      />
                    </div>
                    <ErrorMessage name="email" component="div" className="error-message" />
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <div className="input-with-icon">
                      <span className="input-icon">🔒</span>
                      <Field
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        id="password"
                        placeholder="Enter your password"
                        className="auth-input"
                      />
                      <button
                        type="button"
                        className="toggle-password-icon"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? '👁️' : '👁️'}
                      </button>
                    </div>
                    <ErrorMessage name="password" component="div" className="error-message" />
                  </div>

                  <div className="form-footer-link">
                    <Link to="/forgot-password" className="forgot-link">
                      Forgot Password?
                    </Link>
                  </div>

                  {showResendButton && (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      className="btn btn-secondary btn-block"
                      style={{ marginBottom: '10px' }}
                    >
                      Resend Verification Email
                    </button>
                  )}

                  <button
                    type="submit"
                    className="btn-auth-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Logging in...' : 'Login'}
                  </button>

                  <div className="divider">
                    <span>OR</span>
                    <p className="continue-text">CONTINUE WITH</p>
                  </div>

                  <button type="button" className="btn-google">
                    <span className="google-icon">🌐</span>
                    Sign in with Google
                  </button>

                  <p className="auth-switch">
                    Don't have an account? <Link to="/signup" className="link-highlight">Sign up</Link>
                  </p>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
