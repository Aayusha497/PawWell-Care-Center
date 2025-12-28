import { useState } from 'react';
import signupImage from '../../assets/480469277294a1ed72cb448fa199935e74347935.png';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Alert, AlertDescription } from './ui/alert';

interface SignupPageProps {
  onSignup: (fullName: string, email: string, password: string, confirmPassword: string) => void;
  onNavigateToLogin: () => void;
  error?: string | null;
  fieldErrors?: Record<string, string[]>;
}

export default function SignupPage({ onSignup, onNavigateToLogin, error, fieldErrors }: SignupPageProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (!agreeToTerms) {
      alert('Please agree to terms and conditions');
      return;
    }
    onSignup(fullName, email, password, confirmPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8E8] to-[#EAB308] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left side - Branding */}
          <div className="bg-[#FFF8E8] p-8 flex flex-col justify-center items-center border-r">
            <div className="mb-4">
              <span className="text-2xl">🐾</span>
              <span className="text-xl ml-2">PawWell</span>
            </div>
            <div className="text-center mb-4">
              <h2 className="text-2xl mb-2">Join the PawWell Family</h2>
              <p className="text-sm text-gray-600">
                Create an account to provide the best care for your pet
              </p>
            </div>
          </div>

          {/* Right side - Form */}
          <div className="p-8 relative">
            {/* Header with dog image */}
            <div className="flex justify-center mb-8">
              <img 
                src={signupImage} 
                alt="Cute dog" 
                className="w-20 h-20 object-cover rounded-full"
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="mt-1"
                  required
                />
                {fieldErrors?.email && (
                  <p className="text-sm text-red-500 mt-1">{fieldErrors.email[0]}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="mt-1"
                  required
                />
                {fieldErrors?.password && (
                  <p className="text-sm text-red-500 mt-1">{fieldErrors.password[0]}</p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="mt-1"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="terms"
                  checked={agreeToTerms}
                  onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm cursor-pointer">
                  I agree to Terms & Conditions
                </Label>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-[#EAB308] hover:bg-[#D4A017] text-white"
              >
                Register Account
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
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="text-[#EAB308] hover:underline"
                >
                  Log In
                </button>
              </p>
            </form>
          </div>
        </div>

        {/* Decorative bottom section */}
        <div className="h-12 bg-[#EAB308]"></div>
      </div>
    </div>
  );
}
