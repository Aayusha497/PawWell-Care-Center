/**
 * Login Page
 * 
 * User login form with email and password
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { LoginValidationSchema } from '../utils/formValidation';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);

  const initialValues = {
    email: location.state?.email || '',
    password: '',
  };

  const handleSubmit = async (values, { setSubmitting, setErrors, setTouched }) => {
    // Mark all fields as touched to show validation errors
    setTouched({ email: true, password: true });

    // Validate the form data
    try {
      await LoginValidationSchema.validate(values, { abortEarly: false });
    } catch (validationError) {
      const formErrors = {};
      validationError.inner.forEach(error => {
        formErrors[error.path] = error.message;
      });
      setErrors(formErrors);
      toast.error('Please fix all validation errors before submitting.');
      setSubmitting(false);
      return; // Stop submission if validation fails
    }

    try {
      // Use the login function from AuthContext which handles API call and state updates
      const response = await login({
        email: values.email,
        password: values.password,
      });

      if (response.success) {
        // Check if profile is complete 
        if (response.user && response.user.isProfileComplete !== true) {
          toast.info('Please complete your profile setup to continue.');
          setTimeout(() => {
            navigate('/profile');
          }, 1000);
          return;
        }

        const fromState = location.state?.from;
        const redirectTo = typeof fromState === 'string'
          ? fromState
          : fromState?.pathname || '/dashboard';
        
        // Show success toast and navigate to dashboard
        toast.success('Login successful! Welcome back.');
        setTimeout(() => {
          navigate(redirectTo);
        }, 1000);
      }
    } catch (error) {
      console.error('Login error:', error);
      
      toast.error(error.message || 'Invalid email or password');
      
      if (error.errors) {
        setErrors(error.errors);
      }
    } finally {
      setSubmitting(false);
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
                <p>Registration successful! You can now log in.</p>
              </div>
            )}

            <Formik
              initialValues={initialValues}
              validationSchema={LoginValidationSchema}
              onSubmit={handleSubmit}
              validateOnChange={true}
              validateOnBlur={true}
              validateOnMount={true}
            >
              {({ isSubmitting, errors, touched, isValid, dirty }) => (
                <Form className="auth-form">
                
                  {/* Validation Error Summary */}
                  {Object.keys(errors).length > 0 && Object.keys(touched).length > 0 && (
                    <div className="validation-error-summary" style={{
                      backgroundColor: '#fee',
                      border: '1px solid #fcc',
                      borderRadius: '4px',
                      padding: '12px 16px',
                      marginBottom: '16px',
                      color: '#c33'
                    }}>
                      <strong style={{ display: 'block', marginBottom: '8px' }}>Please fix these errors:</strong>
                      <ul style={{ margin: '0', paddingLeft: '20px' }}>
                        {Object.entries(errors).map(([field, error]) => 
                          touched[field] && (
                            <li key={field} style={{ marginBottom: '4px', fontSize: '13px' }}>
                              {error}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="email">Email / Username</label>
                    <div className="input-with-icon">
                      {/* <span className="input-icon"></span> */}
                      <Field name="email">
                        {({ field, meta }) => (
                          <input
                            {...field}
                            type="email"
                            id="email"
                            placeholder="Enter your email or username"
                            className={`auth-input ${errors.email ? 'input-error' : ''}`}
                            autoComplete="email"
                          />
                        )}
                      </Field>
                    </div>
                    <ErrorMessage name="email" component="div" className="error-message" />
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <div className="input-with-icon">
                      {/* <span className="input-icon"></span> */}
                      <Field name="password">
                        {({ field, meta }) => (
                          <input
                            {...field}
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            placeholder="Enter your password"
                            className={`auth-input ${errors.password ? 'input-error' : ''}`}
                            autoComplete="current-password"
                          />
                        )}
                      </Field>
                      <button
                        type="button"
                        className="toggle-password-icon"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
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

                  <button
                    type="submit"
                    className="btn-auth-primary"
                    disabled={isSubmitting || !isValid || !dirty}
                    title={!isValid ? 'Please fix all validation errors' : 'Login to your account'}
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
