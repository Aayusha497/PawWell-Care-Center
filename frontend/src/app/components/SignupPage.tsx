import { useState } from 'react';
import signup from '../../assets/signup.jpg';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';
import RegistrationSuccessModal from './ui/RegistrationSuccessModal';
import { Phone, Mail, MapPin } from "lucide-react"; //icon for these useing lucide-react library

interface SignupPageProps {
  onSignup: (firstName: string, lastName: string, email: string, password: string, confirmPassword: string) => void;
  onNavigateToLogin: () => void;
  onNavigateToHome: (section?: string) => void;
  error?: string | null;
  fieldErrors?: Record<string, string[]>;
  showSignupSuccess?: boolean;
  onSignupSuccessClose?: () => void;
}

export default function SignupPage({ onSignup, onNavigateToLogin, onNavigateToHome, error, fieldErrors, showSignupSuccess, onSignupSuccessClose }: SignupPageProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const getPasswordStrength = (password: string) => {
    if (!password) return null;

    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) {
      return {
        label: 'Weak',
        textColor: 'text-[#B45309]'
      };
    }

    if (score === 3 || score === 4) {
      return {
        label: 'Medium',
        textColor: 'text-[#92400E]'
      };
    }

    return {
      label: 'Strong',
      textColor: 'text-[#854D0E]'
    };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!firstName.trim()) {
      errors.firstName = 'Please fill this field';
    } else if (!/^[A-Za-z\s]+$/.test(firstName.trim())) {
      errors.firstName = 'First name should contain only letters (A–Z).';
    }
    
    if (!lastName.trim()) {
      errors.lastName = 'Please fill this field';
    } else if (!/^[A-Za-z\s]+$/.test(lastName.trim())) {
      errors.lastName = 'Last name should contain only letters (A–Z).';
    }
    
    if (!email.trim()) {
      errors.email = 'Please fill this field';
    }
    
    if (!password.trim()) {
      errors.password = 'Please fill this field';
    }
    
    if (!confirmPassword.trim()) {
      errors.confirmPassword = 'Please fill this field';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error('Please fill in all fields', {
        description: 'All fields are required to create an account.',
        duration: 3000,
      });
      return;
    }

    setValidationErrors({});

    if (password !== confirmPassword) {
      toast.error('Passwords do not match', {
        description: 'Please make sure both password fields match.',
        duration: 3000,
      });
      return;
    }

    if (!agreeToTerms) {
      toast.error('Terms and Conditions Required', {
        description: 'Please agree to the terms and conditions to continue.',
        duration: 3000,
      });
      return;
    }

    onSignup(firstName, lastName, email, password, confirmPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8E8] to-[#EAB308] dark:from-gray-900 dark:to-gray-800">
      <style>{`
        input::-ms-reveal,
        input::-ms-clear {
          display: none;
        }
        input[type="password"]::-webkit-credentials-auto-fill-button,
        input[type="password"]::-webkit-textfield-decoration-container {
          display: none !important;
          visibility: hidden;
          pointer-events: none;
        }
      `}</style>

      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐾</span>
          <span className="text-xl dark:text-gray-100">PawWell</span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => onNavigateToHome('home')} className="hover:underline dark:text-gray-300 dark:hover:text-gray-100">Home</button>
          <Button onClick={onNavigateToLogin} variant="outline" className="border-2 border-black/20 hover:bg-black/5 dark:border-gray-400 dark:text-gray-300 dark:hover:bg-gray-700">
            Login
          </Button>
          <Button variant="ghost" className="bg-[#EAB308] text-black hover:bg-[#D4A017] dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white">
            Sign Up
          </Button>
        </div>
      </nav>

      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
        <div className="w-full max-w-6xl bg-white dark:bg-gray-800 rounded-[28px] shadow-2xl overflow-hidden border border-black/5 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-[1.05fr_1.55fr]">
            {/* Left side - Branding */}
            {/* Left side - Branding */}
            <div className="relative bg-[#F8E1A6] dark:bg-gray-700 p-8 md:p-10 flex flex-col items-center min-h-[760px] border-r border-black/5 dark:border-gray-600 overflow-hidden">

              {/* soft decorative circles */}
              <div className="absolute top-20 left-10 w-20 h-20 rounded-full border-[8px] border-[#EAB308]/40"></div>
              <div className="absolute bottom-36 right-8 w-14 h-14 rounded-full border-[6px] border-[#EAB308]/40"></div>
              <div className="absolute top-1/2 right-10 w-3 h-3 rounded-full bg-white/80"></div>
              <div className="absolute bottom-28 left-14 w-4 h-4 rounded-full bg-white/80"></div>

              {/* LOGO (stays at top) */}
              <div className="relative z-10 w-full flex items-center gap-3 mb-10">
                <div className="w-10 h-10 rounded-xl bg-[#EAB308] flex items-center justify-center shadow-sm">
                  <span className="text-white text-lg">🐾</span>
                </div>
                <span className="text-[28px] font-bold text-[#D4A017] dark:text-gray-100">PawWell</span>
              </div>

              {/* CENTER CONTENT */}
              <div className="relative z-10 mt-[420px] flex flex-col items-center text-center max-w-sm">
                <h2 className="text-[42px] leading-[1.05] font-bold text-black dark:text-gray-100 mb-5">
                  Join the PawWell Family!
                </h2>
                <p className="text-[22px] leading-9 text-gray-700 dark:text-gray-300">
                  Create an account to manage your pets, book services, and get expert advice.
                </p>
              </div>

              {/* Full background image */}
              <div className="absolute inset-0 z-0">
                <img
                  src={signup}
                  alt="Cute dog"
                  className="w-full h-full object-cover object-bottom"
                />
              </div>

            </div>

            {/* Right side - Form */}
            <div className="p-8 md:p-10 lg:p-12 relative bg-white dark:bg-gray-800">
              <form onSubmit={handleSubmit} className="space-y-5 max-w-[680px] mx-auto">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="firstName" className="text-[15px] font-medium text-black dark:text-gray-100">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First Name"
                      className="mt-2 h-12 rounded-xl border-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    />
                    {validationErrors.firstName && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.firstName}</p>
                    )}
                    {fieldErrors?.firstName && (
                      <p className="text-sm text-red-500 mt-1">{fieldErrors.firstName[0]}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="lastName" className="text-[15px] font-medium text-black dark:text-gray-100">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last Name"
                      className="mt-2 h-12 rounded-xl border-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    />
                    {validationErrors.lastName && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.lastName}</p>
                    )}
                    {fieldErrors?.lastName && (
                      <p className="text-sm text-red-500 mt-1">{fieldErrors.lastName[0]}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-[15px] font-medium text-black dark:text-gray-100">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="@example.com"
                    className="mt-2 h-12 rounded-xl border-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  />
                  {validationErrors.email && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
                  )}
                  {fieldErrors?.email && (
                    <p className="text-sm text-red-500 mt-1">
                      {fieldErrors.email[0]?.includes('already') ? 'Email already exists' : fieldErrors.email[0]}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password" className="text-[15px] font-medium text-black dark:text-gray-100">
                    Password
                  </Label>
                  <div className="relative mt-2">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                      className="h-12 rounded-xl pr-12 border-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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

                  {passwordStrength && (
                    <p className={`text-xs mt-2 ${passwordStrength.textColor} dark:text-gray-400`}>
                      {passwordStrength.label}
                    </p>
                  )}

                  {validationErrors.password && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.password}</p>
                  )}
                  {fieldErrors?.password && (
                    <p className="text-sm text-red-500 mt-1">{fieldErrors.password[0]}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-[15px] font-medium text-black dark:text-gray-100">
                    Confirm Password
                  </Label>
                  <div className="relative mt-2">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="h-12 rounded-xl pr-12 border-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
                  {validationErrors.confirmPassword && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.confirmPassword}</p>
                  )}
                  {fieldErrors?.confirmPassword && (
                    <p className="text-sm text-red-500 mt-1">{fieldErrors.confirmPassword[0]}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Checkbox
                    id="terms"
                    checked={agreeToTerms}
                    onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                  />
                  <Label htmlFor="terms" className="text-sm cursor-pointer text-gray-600 dark:text-gray-300">
                    I agree to the <span className="text-[#D4A017]">Terms & Conditions</span>
                  </Label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl bg-[#EAB308] hover:bg-[#D4A017] text-white shadow-sm dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  Register Account
                </Button>

                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-600"></div>
                  <div className="text-center text-gray-500 dark:text-gray-400 text-sm">OR</div>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-600"></div>
                </div>

                {/* <Button 
                  type="button"
                  variant="outline"
                  className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                >
                  Sign in with Google
                </Button> */}

                <p className="text-center text-sm text-gray-600 dark:text-gray-300 pt-1">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={onNavigateToLogin}
                    className="text-[#D4A017] hover:underline font-medium"
                  >
                    Log In
                  </button>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-8 py-16 mt-20 bg-[#F4D878] dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">

          {/* Top Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🐾</span>
                <span className="text-xl font-semibold text-black dark:text-gray-100">
                  PawWell
                </span>
              </div>
              <p className="text-gray-800 dark:text-gray-300 leading-7">
                Trusted pet care platform connecting pet owners with reliable and caring services for a stress-free experience.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold text-black dark:text-gray-100 mb-4">
                Quick Links
              </h3>

              <ul className="space-y-2 text-gray-800 dark:text-gray-300">
  
                <li>
                  <button 
                    onClick={() => onNavigateToHome("home")}
                    className="hover:text-[#D4A017] transition"
                  >
                    Home
                  </button>
                </li>

                <li>
                  <button 
                    onClick={() => onNavigateToHome("services")}
                    className="hover:text-[#D4A017] transition"
                  >
                    Services
                  </button>
                </li>

                <li>
                  <button 
                    onClick={() => onNavigateToHome("how-it-works")}
                    className="hover:text-[#D4A017] transition"
                  >
                    How It Works
                  </button>
                </li>

                <li>
                  <button 
                    onClick={() => onNavigateToHome("about")}
                    className="hover:text-[#D4A017] transition"
                  >
                    About
                  </button>
                </li>

              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-lg font-semibold text-black dark:text-gray-100 mb-4">
                Services
              </h3>
              <ul className="space-y-2 text-gray-800 dark:text-gray-300">
                <li>Pet Daycare</li>
                <li>Pet Boarding</li>
                <li>Pet Grooming</li>
                <li>Emergency Care</li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-semibold text-black dark:text-gray-100 mb-4">
                Contact
              </h3>
              <ul className="space-y-3 text-gray-800 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <Phone size={18} />
                  <span>+977-9703712593</span>
                </li>

                <li className="flex items-center gap-2">
                  <MapPin size={18} />
                  <span>Kathmandu, Nepal</span>
                </li>

                <li className="flex items-center gap-2">
                  <Mail size={18} />
                  <span>support@pawwell.com</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Divider */}
          <div className="border-t border-[#D4A017] dark:border-gray-700 my-6"></div>

          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-800 dark:text-gray-400">
            <p>© {new Date().getFullYear()} PawWell. All rights reserved.</p>

            <div className="flex gap-6">
              <a href="#" className="hover:underline">Privacy Policy</a>
              <a href="#" className="hover:underline">Terms of Service</a>
            </div>
          </div>

        </div>
      </footer>

      <RegistrationSuccessModal
        isOpen={showSignupSuccess || false}
        onClose={onSignupSuccessClose || (() => {})}
        userEmail={email}
        autoRedirectSeconds={5}
      />
    </div>
  );
}