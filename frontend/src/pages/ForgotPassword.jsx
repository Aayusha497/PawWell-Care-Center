/**
 * Forgot Password Page
 * 
 * Allows users to request a password reset link
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { forgotPassword } from '../services/api';
import { toast } from 'react-toastify';

// Validation schema
const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
});

const ForgotPassword = () => {
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const initialValues = {
    email: '',
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const response = await forgotPassword(values.email);

      if (response.success) {
        setEmailSent(true);
        setSubmittedEmail(values.email);
        toast.success('Password reset instructions sent to your email');
        resetForm();

        // Start countdown for resend
        setCanResend(false);
        let count = 60;
        const timer = setInterval(() => {
          count -= 1;
          setCountdown(count);
          if (count <= 0) {
            clearInterval(timer);
            setCanResend(true);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    try {
      await forgotPassword(submittedEmail);
      toast.success('Email resent!');
      
      // Reset countdown
      setCanResend(false);
      let count = 60;
      const timer = setInterval(() => {
        count -= 1;
        setCountdown(count);
        if (count <= 0) {
          clearInterval(timer);
          setCanResend(true);
        }
      }, 1000);
    } catch (error) {
      toast.error('Failed to resend email');
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="forgot-password-card">
          {!emailSent ? (
            <>
              <h1>Forgot Password?</h1>
              <p className="subtitle">
                Enter your email address and we'll send you instructions to reset your password.
              </p>

              <Formik
                initialValues={initialValues}
                validationSchema={ForgotPasswordSchema}
                onSubmit={handleSubmit}
              >
                {({ isSubmitting }) => (
                  <Form className="forgot-password-form">
                    <div className="form-group">
                      <label htmlFor="email">Email Address</label>
                      <Field
                        type="email"
                        name="email"
                        id="email"
                        placeholder="your.email@example.com"
                      />
                      <ErrorMessage name="email" component="div" className="error-message" />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary btn-block"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                    </button>

                    <p className="form-footer">
                      <Link to="/login">Back to Login</Link>
                    </p>
                  </Form>
                )}
              </Formik>
            </>
          ) : (
            <div className="success-message">
              <div className="icon-success">✓</div>
              <h2>Check Your Email</h2>
              <p>
                If an account exists with <strong>{submittedEmail}</strong>, you will receive
                password reset instructions shortly.
              </p>
              <p className="info-text">
                Please check your inbox and spam folder. The link will expire in 1 hour.
              </p>
              
              {!canResend ? (
                <p className="resend-info">
                  Didn't receive the email? You can resend in {countdown} seconds
                </p>
              ) : (
                <button onClick={handleResend} className="btn btn-secondary">
                  Resend Email
                </button>
              )}

              <Link to="/login" className="btn btn-primary" style={{ marginTop: '20px' }}>
                Return to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
