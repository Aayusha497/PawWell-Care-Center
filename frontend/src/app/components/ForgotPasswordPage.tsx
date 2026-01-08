import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { requestPasswordResetOTP } from '../../services/api';

interface ForgotPasswordPageProps {
  onNavigateToLogin: () => void;
  onNavigateToVerifyOTP: (email: string) => void;
}

export default function ForgotPasswordPage({ onNavigateToLogin, onNavigateToVerifyOTP }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const response = await requestPasswordResetOTP(email);
      
      if (response.success) {
        setSuccess(response.message || 'OTP sent to your email!');
        // Navigate to OTP verification page after 1 second
        setTimeout(() => {
          onNavigateToVerifyOTP(email);
        }, 1000);
      }
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8E8] to-[#EAB308] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative h-32 bg-[#FFF8E8]">
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-[#EAB308] rounded-full flex items-center justify-center text-4xl">
            🔐
          </div>
        </div>

        {/* Form Content */}
        <div className="px-8 pt-12 pb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xl">🐾</span>
            <span className="text-xl">PawWell</span>
          </div>
          <h1 className="text-center text-2xl mb-2">Forgot Password?</h1>
          <p className="text-center text-gray-600 text-sm mb-8">
            Enter your email address and we'll send you an OTP to reset your password.
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
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="mt-2"
                required
                disabled={isSubmitting}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#EAB308] hover:bg-[#D4A017] text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send OTP'}
            </Button>

            <p className="text-center text-sm">
              Remember your password?{' '}
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
