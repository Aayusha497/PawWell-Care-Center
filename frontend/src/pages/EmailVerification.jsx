/**
 * Email Verification Page
 * 
 * Handles email verification when user clicks the link from their email
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { verifyEmail } from '../services/api';
import { toast } from 'react-toastify';

const EmailVerification = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [verificationState, setVerificationState] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await verifyEmail(token);
        
        if (response.success) {
          setVerificationState('success');
          setMessage(response.message || 'Email verified successfully!');
          toast.success('Email verified! Redirecting to login...');
          
          // Countdown and redirect
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
        } else {
          setVerificationState('error');
          setMessage(response.message || 'Verification failed');
        }
      } catch (error) {
        setVerificationState('error');
        setMessage(error.message || 'Email verification failed');
        toast.error(error.message || 'Verification failed');
      }
    };

    if (token) {
      verify();
    }
  }, [token, navigate]);

  return (
    <div className="email-verification-page">
      <div className="verification-container">
        {verificationState === 'verifying' && (
          <div className="verification-card">
            <div className="spinner"></div>
            <h2>Verifying Your Email</h2>
            <p>Please wait while we verify your email address...</p>
          </div>
        )}

        {verificationState === 'success' && (
          <div className="verification-card success">
            <div className="icon-success">✓</div>
            <h2>Email Verified Successfully!</h2>
            <p>{message}</p>
            <p className="redirect-message">
              Redirecting to login in {countdown} second{countdown !== 1 ? 's' : ''}...
            </p>
            <Link to="/login" className="btn btn-primary">
              Go to Login Now
            </Link>
          </div>
        )}

        {verificationState === 'error' && (
          <div className="verification-card error">
            <div className="icon-error">✕</div>
            <h2>Verification Failed</h2>
            <p>{message}</p>
            <div className="action-buttons">
              <Link to="/signup" className="btn btn-secondary">
                Register Again
              </Link>
              <Link to="/login" className="btn btn-primary">
                Go to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;
