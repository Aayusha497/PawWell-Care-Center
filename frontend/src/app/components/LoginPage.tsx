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
  error?: string | null;
}

export default function LoginPage({ onLogin, onNavigateToSignup, onNavigateToHome, error }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Enter your Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="mt-2"
                required
              />
              <div className="text-right mt-2">
                <button type="button" className="text-sm text-[#EAB308] hover:underline">
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
