/**
 * Forgot Password Page
 * 
 * Allows users to request a password reset OTP via email
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { requestPasswordResetOTP } from '../services/api';
import { toast } from 'react-toastify';
import { ForgotPasswordValidationSchema } from '../utils/formValidation';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialValues = {
    email: '',
  };

  const handleSubmit = async (values, { setSubmitting, setErrors, setTouched }) => {
    setTouched({ email: true });

    try {
      await ForgotPasswordValidationSchema.validate(values, { abortEarly: false });
    } catch (validationError) {
      const formErrors = {};
      validationError.inner.forEach(error => {
        formErrors[error.path] = error.message;
      });
      setErrors(formErrors);
      toast.error('Please fix all validation errors before submitting.');
      setSubmitting(false);
      return;
    }

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
              validationSchema={ForgotPasswordValidationSchema}
              onSubmit={handleSubmit}
              validateOnChange={true}
              validateOnBlur={true}
              validateOnMount={true}
            >
              {({ isSubmitting: formSubmitting, errors, touched, isValid, dirty }) => (
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
                      <strong style={{ display: 'block', marginBottom: '8px' }}>❌ Please fix these errors:</strong>
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
                    <label htmlFor="email">Email Address</label>
                    <Field name="email">
                      {({ field, meta }) => (
                        <input
                          {...field}
                          type="email"
                          id="email"
                          placeholder="Enter your email"
                          className={`form-control ${errors.email ? 'input-error' : ''}`}
                          autoComplete="email"
                        />
                      )}
                    </Field>
                    <ErrorMessage name="email" component="div" className="error-message" />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-block"
                    disabled={formSubmitting || isSubmitting || !isValid || !dirty}
                    title={!isValid ? 'Please fix all validation errors' : 'Send verification code'}
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
