import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { resetPassword } from '../../services/api';

interface ResetPasswordPageProps {
  resetToken: string;
  onNavigateToLogin: () => void;
  onPasswordResetSuccess: () => void;
}

export default function ResetPasswordPage({ resetToken, onNavigateToLogin, onPasswordResetSuccess }: ResetPasswordPageProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔍 ResetPasswordPage mounted - resetToken:', resetToken);
    console.log('🔍 ResetPasswordPage mounted - resetToken type:', typeof resetToken);
  }, [resetToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Debug logging
    console.log('🔍 ResetPasswordPage - resetToken prop:', resetToken);
    console.log('🔍 ResetPasswordPage - resetToken type:', typeof resetToken);
    console.log('🔍 ResetPasswordPage - resetToken length:', resetToken?.length);

    // Validation
    if (!resetToken) {
      setError('Reset token is missing. Please start the password reset process again.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🔍 About to call resetPassword with data:', {
        resetToken,
        newPassword: '***',
        confirmPassword: '***'
      });
      
      const response = await resetPassword({
        resetToken,
        newPassword,
        confirmPassword,
      });

      console.log('✅ Reset password response:', response);

      if (response.success) {
        onPasswordResetSuccess();
      }
    } catch (err: any) {
      console.error('Password reset error:', err);
      
      // Display detailed validation errors
      if (err.errors) {
        console.error('Validation errors:', err.errors);
        const errorMessages = Object.entries(err.errors)
          .map(([field, messages]: [string, any]) => {
            if (Array.isArray(messages)) {
              return `${field}: ${messages.join(', ')}`;
            }
            return `${field}: ${messages}`;
          })
          .join('\n');
        setError(errorMessages || err.message || 'Failed to reset password. Please try again.');
      } else {
        setError(err.message || 'Failed to reset password. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrength = () => {
    if (newPassword.length === 0) return { strength: '', color: '' };
    if (newPassword.length < 6) return { strength: 'Weak', color: 'text-red-500' };
    if (newPassword.length < 10) return { strength: 'Medium', color: 'text-yellow-500' };
    return { strength: 'Strong', color: 'text-green-500' };
  };

  const { strength, color } = getPasswordStrength();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8E8] to-[#EAB308] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative h-32 bg-[#FFF8E8]">
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-[#EAB308] rounded-full flex items-center justify-center text-4xl">
            🔑
          </div>
        </div>

        {/* Form Content */}
        <div className="px-8 pt-12 pb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xl">🐾</span>
            <span className="text-xl">PawWell</span>
          </div>
          <h1 className="text-center text-2xl mb-2">Reset Password</h1>
          <p className="text-center text-gray-600 text-sm mb-8">
            Enter your new password below
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative mt-2">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {newPassword && (
                <p className={`text-sm mt-1 ${color}`}>
                  Password strength: {strength}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative mt-2">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#EAB308] hover:bg-[#D4A017] text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </Button>

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
