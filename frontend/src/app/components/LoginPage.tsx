import { useState } from 'react';
import loginImage from '../../assets/238b4d65b57ea1bd10f52ff67d4c5cdcdb0c6110.png';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';
import { Phone, Mail, MapPin } from "lucide-react"; //icon for these useing lucide-react library

interface LoginPageProps {
  onLogin: (email: string, password: string) => void;
  onNavigateToSignup: () => void;
  onNavigateToHome: (section?: string) => void;
  onNavigateToForgotPassword: () => void;
  error?: string | null;
  onClearError?: () => void;
}

export default function LoginPage({ onLogin, onNavigateToSignup, onNavigateToHome, onNavigateToForgotPassword, error, onClearError }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    // Validate all fields
    if (!email.trim()) {
      errors.email = 'Please fill this field';
    }
    
    if (!password.trim()) {
      errors.password = 'Please fill this field';
    }

    // If there are validation errors, show them and return
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error('Please fill in all fields', {
        description: 'Email and password are required to login.',
        duration: 3000,
      });
      return;
    }

    // Clear validation errors if all fields are filled
    setValidationErrors({});
    setTouched({});
    onLogin(email, password);
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
          <button onClick={() => onNavigateToHome("home")} className="hover:underline dark:text-gray-300 dark:hover:text-gray-100">Home</button>
          <Button variant="ghost" className="bg-[#EAB308] text-black hover:bg-[#D4A017] dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white">
            Login
          </Button>
          <Button onClick={onNavigateToSignup} variant="outline" className="border-2 border-black/20 hover:bg-black/5 dark:border-gray-400 dark:text-gray-300 dark:hover:bg-gray-700">
            Sign Up
          </Button>
        </div>
      </nav>

      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
        <div className="w-full max-w-6xl bg-white/95 dark:bg-gray-800 rounded-[42px] shadow-2xl overflow-hidden border border-black/5 dark:border-gray-700">
          <div className="px-8 md:px-10 pt-6">
            <div className="h-px bg-black/10 dark:bg-gray-600"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-8 items-center px-8 md:px-10 lg:px-12 py-10">
            {/* Left side - Form Card */}
            <div className="order-2 lg:order-1">
              <div className="bg-[#EAB308] dark:bg-gray-700 rounded-[34px] p-8 md:p-10 shadow-lg max-w-[460px]">
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-sm">
                      <span className="text-white text-lg">🐾</span>
                    </div>
                    <span className="text-2xl font-bold text-white">PawWell</span>
                  </div>

                  <h1 className="text-4xl md:text-5xl leading-tight font-bold text-white mb-4">
                    Welcome
                    <br />
                    Back!
                  </h1>

                  <p className="text-white/90 text-lg leading-8">
                    Login to manage your pets, bookings, and care services with ease.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div>
                    <Label htmlFor="email" className="text-white text-[15px] font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setTouched(prev => ({ ...prev, email: true }));
                        if (error && onClearError) {
                          onClearError();
                        }
                        if (validationErrors.email && e.target.value.trim()) {
                          setValidationErrors(prev => {
                            const updated = { ...prev };
                            delete updated.email;
                            return updated;
                          });
                        }
                      }}
                      placeholder="Enter your email"
                      className="mt-2 h-12 rounded-full border-0 bg-white text-black placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-white/50 dark:bg-gray-600 dark:text-gray-100 dark:placeholder:text-gray-300"
                      autoComplete="off"
                    />
                    {validationErrors.email && (
                      <p className="text-sm text-red-100 mt-2">{validationErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-white text-[15px] font-medium">
                      Password
                    </Label>
                    <div className="relative mt-2">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setTouched(prev => ({ ...prev, password: true }));
                          if (error && onClearError) {
                            onClearError();
                          }
                          if (validationErrors.password && e.target.value.trim()) {
                            setValidationErrors(prev => {
                              const updated = { ...prev };
                              delete updated.password;
                              return updated;
                            });
                          }
                        }}
                        placeholder="Enter your password"
                        autoComplete="new-password"
                        className="mt-2 h-12 rounded-full border-0 bg-white text-black placeholder:text-gray-400 pr-12 focus-visible:ring-2 focus-visible:ring-white/50 dark:bg-gray-600 dark:text-gray-100 dark:placeholder:text-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B45309] hover:text-[#92400E] dark:text-gray-300 dark:hover:text-gray-100"
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
                    {validationErrors.password && (
                      <p className="text-sm text-red-100 mt-2">{validationErrors.password}</p>
                    )}

                    <div className="text-right mt-3">
                      <button
                        type="button"
                        onClick={onNavigateToForgotPassword}
                        className="text-sm text-white hover:underline cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-full bg-white text-[#B45309] hover:bg-white dark:bg-gray-100 dark:text-gray-900"
                  >
                    Sign In
                  </Button>

                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-white/40"></div>
                    <div className="text-center text-white/90 text-sm">OR</div>
                    <div className="h-px flex-1 bg-white/40"></div>
                  </div>

                  {/* <Button 
                    type="button"
                    variant="outline"
                    className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                  >
                    Sign in with Google
                  </Button> */}

                  <p className="text-center text-sm text-white/95">
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={onNavigateToSignup}
                      className="text-white font-semibold hover:underline"
                    >
                      Sign Up
                    </button>
                  </p>
                </form>
              </div>
            </div>

            {/* Right side - Image / visual */}
            <div className="order-1 lg:order-2 relative flex justify-center items-center min-h-[520px]">
              <div className="absolute top-8 right-6 md:right-10">
                <div className="relative bg-white border-[6px] border-[#EAB308] rounded-[40px] px-8 py-6 shadow-md">
                  <p className="text-3xl md:text-4xl font-bold leading-tight text-[#D97706] text-center">
                    Say
                    <br />
                    Woof!
                  </p>
                  <div className="absolute -bottom-3 left-8 w-6 h-6 bg-white border-r-[6px] border-b-[6px] border-[#EAB308] rotate-45"></div>
                </div>
              </div>

              <div className="absolute top-16 left-2 w-20 h-20 rounded-full border-[6px] border-[#EAB308]/10 hidden md:block"></div>
              <div className="absolute bottom-8 left-10 w-32 h-32 rounded-full border-[8px] border-[#EAB308]/10 hidden md:block"></div>
              <div className="absolute bottom-20 right-2 w-24 h-24 rounded-full border-[6px] border-[#EAB308]/10 hidden md:block"></div>

              <img
                src={loginImage}
                alt="Cute dog"
                className="relative z-10 w-full max-w-[420px] object-contain"
              />
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


   

    </div>
  );
}