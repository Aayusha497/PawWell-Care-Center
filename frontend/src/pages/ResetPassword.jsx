/**
 * Reset Password Page
 * 
 * Allows users to reset their password using a verified token from OTP flow
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { resetPassword } from '../services/api';
import { toast } from 'react-toastify';
import { getPasswordStrength } from '../utils/auth';
import { ResetPasswordValidationSchema } from '../utils/formValidation';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromOTP = location.state?.fromOTP || false;
  
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

  const handleSubmit = async (values, { setSubmitting, setErrors, setTouched }) => {
    setTouched({ new_password: true, confirm_password: true });

    try {
      await ResetPasswordValidationSchema.validate(values, { abortEarly: false });
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

    try {
      const response = await resetPassword({
        token: token,
        newPassword: values.new_password,
        confirmPassword: values.confirm_password,
      });

      if (response.success) {
        setResetSuccess(true);
        toast.success('Password reset successful!');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      
      if (error.code === 'OTP_NOT_VERIFIED') {
        toast.error('OTP verification required. Redirecting...');
        setTimeout(() => navigate('/forgot-password'), 2000);
        return;
      }
      
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
            <h2>Invalid or Expired Token</h2>
            <p>
              This password reset token is invalid or has expired. {fromOTP ? 'OTP verification tokens' : 'Password reset links'} are only valid for {fromOTP ? '10 minutes' : '1 hour'}.
            </p>
            <div className="action-buttons">
              <Link to="/forgot-password" className="btn btn-primary">
                Request New {fromOTP ? 'OTP' : 'Link'}
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
            validationSchema={ResetPasswordValidationSchema}
            onSubmit={handleSubmit}
            validateOnChange={true}
            validateOnBlur={true}
            validateOnMount={true}
          >
            {({ values, isSubmitting, setFieldValue, errors, touched, isValid, dirty }) => (
              <Form className="reset-password-form">
              
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
                <div className="form-group password-group">
                  <label htmlFor="new_password">New Password</label>
                  <div className="password-input-wrapper">
                    <Field name="new_password">
                      {({ field, meta }) => (
                        <input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          id="new_password"
                          placeholder="Enter your new password"
                          autoComplete="new-password"
                          className={errors.new_password ? 'input-error' : ''}
                          onChange={(e) => {
                            setFieldValue('new_password', e.target.value);
                            handlePasswordChange(e.target.value);
                          }}
                        />
                      )}
                    </Field>
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
                    <Field name="confirm_password">
                      {({ field, meta }) => (
                        <input
                          {...field}
                          type={showConfirmPassword ? 'text' : 'password'}
                          id="confirm_password"
                          placeholder="Confirm your new password"
                          autoComplete="new-password"
                          className={errors.confirm_password ? 'input-error' : ''}
                        />
                      )}
                    </Field>
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
                  disabled={isSubmitting || !isValid || !dirty}
                  title={!isValid ? 'Please fix all validation errors' : 'Reset your password'}
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
