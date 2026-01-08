import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { verifyOTP, requestPasswordResetOTP } from '../../services/api';

interface VerifyOTPPageProps {
  email: string;
  onNavigateToLogin: () => void;
  onNavigateToResetPassword: (token: string) => void;
}

export default function VerifyOTPPage({ email, onNavigateToLogin, onNavigateToResetPassword }: VerifyOTPPageProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    
    setOtp(newOtp);
    
    // Focus the next empty input or the last one
    const nextEmptyIndex = newOtp.findIndex((digit, idx) => !digit && idx < 6);
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter a complete 6-digit OTP');
      return;
    }

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const response = await verifyOTP(email, otpString);
      
      if (response.success && response.resetToken) {
        setSuccess('OTP verified successfully!');
        // Navigate to reset password page
        setTimeout(() => {
          onNavigateToResetPassword(response.resetToken!);
        }, 500);
      }
    } catch (err: any) {
      console.error('OTP verification error:', err);
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;

    setError(null);
    setSuccess(null);
    
    try {
      const response = await requestPasswordResetOTP(email);
      if (response.success) {
        setSuccess('New OTP sent to your email!');
        setResendCooldown(60);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8E8] to-[#EAB308] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative h-32 bg-[#FFF8E8]">
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-[#EAB308] rounded-full flex items-center justify-center text-4xl">
            ✉️
          </div>
        </div>

        {/* Form Content */}
        <div className="px-8 pt-12 pb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xl">🐾</span>
            <span className="text-xl">PawWell</span>
          </div>
          <h1 className="text-center text-2xl mb-2">Verify OTP</h1>
          <p className="text-center text-gray-600 text-sm mb-2">
            We've sent a 6-digit code to
          </p>
          <p className="text-center text-[#EAB308] font-medium mb-8">
            {email}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-500 bg-green-50">
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}

            <div>
              <div className="flex gap-2 justify-center">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-[#EAB308] focus:outline-none"
                    disabled={isSubmitting}
                  />
                ))}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#EAB308] hover:bg-[#D4A017] text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Verifying...' : 'Verify OTP'}
            </Button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendCooldown > 0}
                className={`${resendCooldown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-[#EAB308] hover:underline'}`}
              >
                {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
              </button>
            </div>

            <p className="text-center text-sm">
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="text-[#EAB308] hover:underline"
              >
                Back to Login
              </button>
            </p>
          </form>
        </div>

        {/* Decorative bottom section */}
        <div className="h-16 bg-[#EAB308]"></div>
      </div>
    </div>
  );
}
