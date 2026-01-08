import { useState } from 'react';
import loginImage from '../../assets/238b4d65b57ea1bd10f52ff67d4c5cdcdb0c6110.png';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';

interface LoginPageProps {
  onLogin: (email: string, password: string) => void;
  onNavigateToSignup: () => void;
  onNavigateToHome: () => void;
  onNavigateToForgotPassword: () => void;
  error?: string | null;
}

export default function LoginPage({ onLogin, onNavigateToSignup, onNavigateToHome, onNavigateToForgotPassword, error }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8E8] to-[#EAB308] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header with dog image */}
        <div className="relative h-32 bg-[#FFF8E8]">
          <img 
            src={loginImage} 
            alt="Cute dog" 
            className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-24 object-cover rounded-full"
          />
        </div>

        {/* Form Content */}
        <div className="px-8 pt-12 pb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xl">🐾</span>
            <span className="text-xl">PawWell</span>
          </div>
          <h1 className="text-center text-2xl mb-2">Welcome back to PawWell!</h1>
          <p className="text-center text-gray-600 text-sm mb-8">
            Login to your account to manage your pets services.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="email">Email/Username</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="mt-2"
                autoComplete="off"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Enter your Password</Label>
              <div className="relative mt-2">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="new-password"
                  required
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
              <div className="text-right mt-2">
                <button 
                  type="button" 
                  onClick={onNavigateToForgotPassword}
                  className="text-sm text-[#EAB308] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#EAB308] hover:bg-[#D4A017] text-white"
            >
              Sign In
            </Button>

            <div className="text-center text-gray-500 text-sm">OR</div>

            <Button 
              type="button"
              variant="outline"
              className="w-full border-gray-300"
            >
              Sign in with Google
            </Button>

            <p className="text-center text-sm">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onNavigateToSignup}
                className="text-[#EAB308] hover:underline"
              >
                Sign Up
              </button>
            </p>
          </form>
        </div>

        {/* Decorative bottom section */}
        <div className="h-16 bg-[#EAB308]"></div>
      </div>

      {/* Back to home button */}
      <button
        onClick={onNavigateToHome}
        className="absolute top-8 left-8 text-gray-700 hover:text-gray-900 flex items-center gap-2"
      >
        ← Back to Home
      </button>
    </div>
  );
}
