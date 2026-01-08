/**
 * Verify OTP Page
 * 
 * Allows users to enter the 6-digit OTP sent to their email
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { verifyOTP, requestPasswordResetOTP } from '../services/api';
import { toast } from 'react-toastify';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  
  const inputRefs = useRef([]);

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      toast.error('Please request a password reset first.');
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  // Handle countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Set initial countdown
  useEffect(() => {
    setCountdown(60); // 60 seconds cooldown for resend
  }, []);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    
    setOtp(newOtp);
    
    // Focus the next empty input or the last input
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      toast.error('Please enter a 6-digit OTP');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await verifyOTP(email, otpString);

      if (response.success) {
        toast.success(response.message);
        // Navigate to reset password page with token
        navigate(`/reset-password/${response.resetToken}`, { 
          state: { email, fromOTP: true } 
        });
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      
      if (error.code === 'INVALID_OTP' && error.remainingAttempts !== undefined) {
        setRemainingAttempts(error.remainingAttempts);
        toast.error(error.message);
        
        if (error.remainingAttempts === 0) {
          toast.error('Maximum attempts exceeded. Redirecting to forgot password...');
          setTimeout(() => navigate('/forgot-password'), 2000);
        }
      } else if (error.code === 'OTP_EXPIRED') {
        toast.error(error.message);
        setTimeout(() => navigate('/forgot-password'), 2000);
      } else if (error.code === 'MAX_ATTEMPTS_EXCEEDED') {
        toast.error(error.message);
        setTimeout(() => navigate('/forgot-password'), 2000);
      } else {
        toast.error(error.message || 'Failed to verify OTP. Please try again.');
      }
      
      // Clear OTP inputs
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0 || isResending) return;

    setIsResending(true);
    try {
      const response = await requestPasswordResetOTP(email);
      
      if (response.success) {
        toast.success('New OTP sent to your email!');
        setCountdown(60);
        setRemainingAttempts(5);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      toast.error(error.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
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
          <h1 className="auth-title">Enter Verification Code</h1>
          <p className="auth-subtitle">
            We've sent a 6-digit verification code to <strong>{email}</strong>
          </p>

          {/* OTP Form */}
          <div className="auth-form-section">
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="otp-input-container">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="otp-input"
                    autoComplete="one-time-code"
                    name={`otp-${index}`}
                  />
                ))}
              </div>

              {remainingAttempts < 5 && (
                <div className="info-message" style={{ marginTop: '1rem' }}>
                  <p>⚠️ {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining</p>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={isSubmitting || otp.join('').length !== 6}
                style={{ marginTop: '1.5rem' }}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner"></span>
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </button>
            </form>

            {/* Resend OTP */}
            <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
              <p>
                Didn't receive the code?{' '}
                {countdown > 0 ? (
                  <span className="text-muted">Resend in {countdown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={isResending}
                    className="auth-link-button"
                  >
                    {isResending ? 'Sending...' : 'Resend Code'}
                  </button>
                )}
              </p>
              <p style={{ marginTop: '0.5rem' }}>
                <Link to="/forgot-password" className="auth-link">
                  Try a different email
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
