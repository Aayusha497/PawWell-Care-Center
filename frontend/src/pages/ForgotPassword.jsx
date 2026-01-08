/**
 * Forgot Password Page
 * 
 * Allows users to request a password reset OTP via email
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { requestPasswordResetOTP } from '../services/api';
import { toast } from 'react-toastify';

// Validation schema
const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
});

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialValues = {
    email: '',
  };

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    setIsSubmitting(true);
    try {
      const response = await requestPasswordResetOTP(values.email);

      if (response.success) {
        toast.success(response.message);
        // Navigate to OTP verification page with email
        navigate('/verify-otp', { state: { email: values.email } });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error(error.message || 'Failed to send OTP. Please try again.');
      
      if (error.errors) {
        setErrors(error.errors);
      }
    } finally {
      setIsSubmitting(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="forgot-password-card">
          {/* Logo */}
          <div className="auth-logo">
            <span className="paw-icon">🐾</span>
            <span className="logo-text">PawWell</span>
          </div>

          {/* Title */}
          <h1 className="auth-title">Forgot Password?</h1>
          <p className="auth-subtitle">
            No worries! Enter your registered email address and we'll send you a verification code to reset your password.
          </p>

          {/* Forgot Password Form */}
          <div className="auth-form-section">
            <Formik
              initialValues={initialValues}
              validationSchema={ForgotPasswordSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting: formSubmitting }) => (
                <Form className="auth-form">
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <Field
                      type="email"
                      id="email"
                      name="email"
                      className="form-control"
                      placeholder="Enter your email"
                      autoComplete="email"
                    />
                    <ErrorMessage name="email" component="div" className="error-message" />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-block"
                    disabled={formSubmitting || isSubmitting}
                  >
                    {formSubmitting || isSubmitting ? (
                      <>
                        <span className="spinner"></span>
                        Sending OTP...
                      </>
                    ) : (
                      'Send Verification Code'
                    )}
                  </button>
                </Form>
              )}
            </Formik>

            {/* Back to Login Link */}
            <div className="auth-footer">
              <p>
                Remember your password?{' '}
                <Link to="/login" className="auth-link">
                  Back to Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
