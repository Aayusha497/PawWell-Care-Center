/**
 * Reset Password Page
 * 
 * Allows users to reset their password using a token from email
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { resetPassword } from '../services/api';
import { toast } from 'react-toastify';
import { getPasswordStrength } from '../utils/auth';

// Validation schema
const ResetPasswordSchema = Yup.object().shape({
  new_password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Za-z]/, 'Password must contain at least one letter')
    .matches(/\d/, 'Password must contain at least one number')
    .required('Password is required'),
  confirm_password: Yup.string()
    .oneOf([Yup.ref('new_password'), null], 'Passwords must match')
    .required('Confirm password is required'),
});

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'None', color: '#ccc' });
  const [resetSuccess, setResetSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [tokenValid, setTokenValid] = useState(true);

  useEffect(() => {
    // Validate token format
    if (!token || token.length < 30) {
      setTokenValid(false);
      toast.error('Invalid reset token');
    }
  }, [token]);

  useEffect(() => {
    if (resetSuccess) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/login');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [resetSuccess, navigate]);

  const initialValues = {
    new_password: '',
    confirm_password: '',
  };

  const handlePasswordChange = (value) => {
    const strength = getPasswordStrength(value);
    setPasswordStrength(strength);
  };

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      const response = await resetPassword({
        token: token,
        new_password: values.new_password,
        confirm_password: values.confirm_password,
      });

      if (response.success) {
        setResetSuccess(true);
        toast.success('Password reset successful!');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      
      if (error.message && (error.message.includes('expired') || error.message.includes('used'))) {
        setTokenValid(false);
      }
      
      toast.error(error.message || 'Failed to reset password');
      
      if (error.errors) {
        setErrors(error.errors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="reset-password-card error">
            <div className="icon-error">✕</div>
            <h2>Invalid or Expired Link</h2>
            <p>
              This password reset link is invalid or has expired. Password reset links are only valid for 1 hour.
            </p>
            <div className="action-buttons">
              <Link to="/forgot-password" className="btn btn-primary">
                Request New Link
              </Link>
              <Link to="/login" className="btn btn-secondary">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="reset-password-card success">
            <div className="icon-success">✓</div>
            <h2>Password Reset Successful!</h2>
            <p>Your password has been successfully reset.</p>
            <p className="redirect-message">
              Redirecting to login in {countdown} second{countdown !== 1 ? 's' : ''}...
            </p>
            <Link to="/login" className="btn btn-primary">
              Go to Login Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <div className="reset-password-card">
          <h1>Reset Password</h1>
          <p className="subtitle">Enter your new password below</p>

          <Formik
            initialValues={initialValues}
            validationSchema={ResetPasswordSchema}
            onSubmit={handleSubmit}
          >
            {({ values, isSubmitting, setFieldValue }) => (
              <Form className="reset-password-form">
                <div className="form-group password-group">
                  <label htmlFor="new_password">New Password</label>
                  <div className="password-input-wrapper">
                    <Field
                      type={showPassword ? 'text' : 'password'}
                      name="new_password"
                      id="new_password"
                      placeholder="Enter your new password"
                      onChange={(e) => {
                        setFieldValue('new_password', e.target.value);
                        handlePasswordChange(e.target.value);
                      }}
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {values.new_password && (
                    <div className="password-strength">
                      <div className="strength-bar">
                        <div
                          className="strength-fill"
                          style={{
                            width: `${(passwordStrength.score / 6) * 100}%`,
                            backgroundColor: passwordStrength.color
                          }}
                        ></div>
                      </div>
                      <span style={{ color: passwordStrength.color }}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  )}
                  <ErrorMessage name="new_password" component="div" className="error-message" />
                </div>

                <div className="form-group password-group">
                  <label htmlFor="confirm_password">Confirm New Password</label>
                  <div className="password-input-wrapper">
                    <Field
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirm_password"
                      id="confirm_password"
                      placeholder="Confirm your new password"
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  <ErrorMessage name="confirm_password" component="div" className="error-message" />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
                </button>

                <p className="form-footer">
                  <Link to="/login">Back to Login</Link>
                </p>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
