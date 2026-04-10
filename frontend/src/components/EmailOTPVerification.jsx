import { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * Email OTP Verification Component
 * Used during signup after registration to verify email
 * 
 * Props:
 *  - email: user's email (from previous registration step)
 *  - onSuccess: callback when OTP is successfully verified (receives tokens and user data)
 *  - onCancel: callback to go back to registration
 */
export const EmailOTPVerification = ({ email, onSuccess, onCancel }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [attempts, setAttempts] = useState(5);
  const [canResend, setCanResend] = useState(false);

  // Timer for OTP validity
  useEffect(() => {
    if (timeLeft <= 0) {
      setError('OTP has expired. Please register again.');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle OTP input
  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only digits
    if (value.length <= 6) {
      setOtp(value);
      setError('');
    }
  };

  // Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post(
        '/accounts/verify-email-otp',
        {
          email: email,
          otp: otp
        }
      );

      if (response.data.success) {
        setSuccess('Email verified successfully!');
        
        // Call success callback with tokens and user data
        if (onSuccess) {
          setTimeout(() => {
            onSuccess(response.data.user, response.data.tokens);
          }, 500);
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to verify OTP';
      const remainingAttempts = err.response?.data?.remainingAttempts;
      const code = err.response?.data?.code;

      if (code === 'MAX_ATTEMPTS_EXCEEDED') {
        setError('Maximum attempts exceeded. Please register again.');
        setAttempts(0);
      } else if (remainingAttempts !== undefined) {
        setError(`${errorMessage} (${remainingAttempts} attempts left)`);
        setAttempts(remainingAttempts);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Request new OTP (can be implemented later)
  const handleResendOTP = async () => {
    setCanResend(false);
    setError('');
    setSuccess('New OTP sent to your email!');
    // Call resend endpoint when implemented
    // setTimeout(() => {
    //   setTimeLeft(600);
    // }, 2000);
  };

  return (
    <div className="otp-verification-container" style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Verify Your Email</h2>
        
        <div style={styles.message}>
          <p>We've sent a verification code to:</p>
          <p style={styles.email}>{email}</p>
        </div>

        <form onSubmit={handleVerifyOTP} style={styles.form}>
          {/* OTP Input */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Enter 6-Digit OTP</label>
            <input
              type="text"
              value={otp}
              onChange={handleOtpChange}
              placeholder="000000"
              maxLength="6"
              style={styles.otpInput}
              disabled={loading || attempts === 0}
              autoComplete="off"
            />
            <small style={styles.hint}>Only digits (0-9)</small>
          </div>

          {/* Timer */}
          <div style={styles.timerContainer}>
            <span style={styles.timerLabel}>Expires in:</span>
            <span style={{
              ...styles.timer,
              color: timeLeft < 120 ? '#ff6b6b' : '#4A90E2'
            }}>
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* Attempts */}
          <div style={styles.attemptsContainer}>
            <span style={styles.attemptsLabel}>Attempts remaining:</span>
            <span style={{
              ...styles.attempts,
              color: attempts <= 2 ? '#d93b3b' : '#2d5016'
            }}>
              {attempts}
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div style={styles.errorMessage}>
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div style={styles.successMessage}>
              <span>{success}</span>
            </div>
          )}

          {/* Buttons */}
          <div style={styles.buttonGroup}>
            <button
              type="submit"
              disabled={loading || attempts === 0 || otp.length !== 6}
              style={{
                ...styles.verifyButton,
                opacity: loading || attempts === 0 || otp.length !== 6 ? 0.6 : 1,
                cursor: loading || attempts === 0 || otp.length !== 6 ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            
            <button
              type="button"
              onClick={onCancel}
              style={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
          </div>

          {/* Resend OTP Link */}
          <div style={styles.resendContainer}>
            <span style={styles.resendText}>Didn't receive the code? </span>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={!canResend || loading}
              style={{
                ...styles.resendButton,
                opacity: canResend && !loading ? 1 : 0.6,
                cursor: canResend && !loading ? 'pointer' : 'not-allowed'
              }}
            >
              Resend OTP
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div style={styles.infoBox}>
          <p style={styles.infoText}>
            Check your spam/junk folder if you don't see the email within a few minutes.
          </p>
        </div>
      </div>
    </div>
  );
};

// Inline styles - PawWell Theme
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: 'transparent',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '24px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
    padding: '48px 40px',
    maxWidth: '420px',
    width: '100%',
    border: '1px solid rgba(234, 179, 8, 0.1)'
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '24px',
    color: '#1a1a1a',
    textAlign: 'center'
  },
  message: {
    backgroundColor: '#FFF8E8',
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '28px',
    textAlign: 'center',
    border: '1px solid #F0E5C3'
  },
  email: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#D4A017',
    margin: '8px 0 0 0'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    fontSize: '15px',
    fontWeight: '600',
    marginBottom: '10px',
    color: '#333333'
  },
  otpInput: {
    padding: '14px',
    fontSize: '28px',
    textAlign: 'center',
    letterSpacing: '6px',
    border: '2px solid #E8E8E8',
    borderRadius: '12px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    fontFamily: '"Courier New", monospace',
    color: '#333333',
    backgroundColor: '#FAFAFA'
  },
  hint: {
    fontSize: '13px',
    color: '#999999',
    marginTop: '6px'
  },
  timerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF8E8',
    padding: '14px 16px',
    borderRadius: '10px',
    fontSize: '15px',
    border: '1px solid #F0E5C3'
  },
  timerLabel: {
    color: '#666666',
    fontWeight: '500'
  },
  timer: {
    fontSize: '18px',
    fontWeight: '700',
    fontFamily: '"Courier New", monospace',
    color: '#EAB308'
  },
  attemptsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: '14px 16px',
    borderRadius: '10px',
    fontSize: '15px',
    border: '1px solid #E8E8E8'
  },
  attemptsLabel: {
    color: '#666666',
    fontWeight: '500'
  },
  attempts: {
    fontSize: '18px',
    fontWeight: '700'
  },
  errorMessage: {
    backgroundColor: '#FFE6E6',
    border: '1.5px solid #FF6B6B',
    color: '#C53030',
    padding: '13px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500'
  },
  successMessage: {
    backgroundColor: '#E6F9E6',
    border: '1.5px solid #52B788',
    color: '#2d5016',
    padding: '13px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500'
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '12px'
  },
  verifyButton: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#EAB308',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(234, 179, 8, 0.25)'
  },
  cancelButton: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#F0F0F0',
    color: '#666666',
    border: '1px solid #E0E0E0',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  resendContainer: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#666666'
  },
  resendText: {
    marginRight: '4px'
  },
  resendButton: {
    backgroundColor: 'transparent',
    color: '#D4A017',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    textDecoration: 'none',
    transition: 'color 0.2s ease'
  },
  infoBox: {
    backgroundColor: '#FFF8E8',
    border: '1px solid #F0E5C3',
    borderRadius: '10px',
    padding: '13px 16px',
    marginTop: '24px',
    fontSize: '13px',
    color: '#7D6A1A'
  },
  infoText: {
    margin: 0,
    lineHeight: '1.5'
  }
};

export default EmailOTPVerification;
