import { useMemo, useState, useEffect, useRef } from 'react';
import { Settings, User as UserIcon, LogOut } from 'lucide-react';
import NotificationBell from '../../components/NotificationBell';
import '../../pages/About.css';

interface User {
  id: string;
  email: string;
  fullName: string;
  profilePicture?: string;
}

interface AboutPageProps {
  onBack?: () => void;
  onBook?: () => void;
  onAddPet?: () => void;
  onLogout?: () => void;
  onActivityLog?: () => void;
  onTimeline?: () => void;
  onContact?: () => void;
  onEmergency?: () => void;
  onSettings?: () => void;
  onNavigate?: (page: any) => void;
  user?: User | null;
  userFullName?: string;
  hideNavbar?: boolean;
}

export default function AboutPage({
  onBack,
  onBook,
  onAddPet,
  onLogout,
  onActivityLog,
  onTimeline,
  onContact,
  onEmergency,
  onSettings,
  onNavigate,
  user,
  userFullName,
  hideNavbar,
}: AboutPageProps) {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileDropdown]);
  const whyItems = useMemo(
    () => ([
      'Pet profiles store allergies and medical needs for safer care.',
      'Admin approval ensures safety and controlled capacity.',
      'Booking calendar prevents overbooking and conflicts.',
      'Care updates with photos and an activity timeline.',
      'Secure login with role-based access.'
    ]),
    []
  );

  const handleContact = () => {
    if (onContact) {
      onContact();
    }
  };

  return (
    <div className="about-page">
      {!hideNavbar && user && (
        <nav className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-8 py-3 font-sans">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🐾</span>
              </div>
              <div className="flex items-center gap-6">
                <button 
                  onClick={onBack}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 rounded-full"
                >
                  Home
                </button>
                <button 
                  onClick={onBook}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 rounded-full"
                >
                  Booking
                </button>
                <button
                  onClick={onActivityLog}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 rounded-full"
                >
                  Activity Log
                </button>
                <button
                  onClick={onTimeline}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 rounded-full"
                >
                  Timeline
                </button>
                <button
                  className="px-4 py-2 rounded-full bg-[#FFE4A3] dark:bg-yellow-600 dark:text-white font-medium"
                >
                  About
                </button>
                <button
                  onClick={onContact}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 rounded-full"
                >
                  Contact
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell userId={parseInt(user.id)} />
              <button
                onClick={onEmergency}
                className="px-4 py-2 bg-[#FF6B6B] dark:bg-red-700 text-white rounded-full text-sm flex items-center gap-2"
              >
                <span>📞</span> Emergency
              </button>
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="w-10 h-10 rounded-full hover:shadow-lg transition-all cursor-pointer border-2 border-gray-200 dark:border-gray-600 overflow-hidden"
                  title="Profile Menu"
                >
                  {user.profilePicture ? (
                    <img 
                      src={user.profilePicture} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#FA9884] to-[#FFE4A3] flex items-center justify-center">
                      <span className="text-sm font-bold text-white">
                        {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                  )}
                </button>

                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{user.fullName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        onNavigate?.('profile');
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      <UserIcon size={18} className="text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-medium">Edit Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        onSettings?.();
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      <Settings size={18} className="text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-medium">Settings</span>
                    </button>
                    <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        onLogout?.();
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/50 flex items-center gap-3 text-red-600 dark:text-red-400 transition-colors"
                    >
                      <LogOut size={18} className="text-red-500 dark:text-red-400" />
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
      )}
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">About PawWell</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Providing exceptional care for your beloved pets since 2025.
          </p>
        </div>
      </div>

      <section className="about-hero">
        <div className="about-hero-content">
          <p className="about-pill">About PawWell Pet Care</p>
          <h1>Safe care when you are busy or traveling.</h1>
          <p className="about-hero-subtitle">
            PawWell keeps pet owners connected with verified caretakers, structured care, and daily activity updates.
          </p>
          <div className="about-hero-actions">
            <button className="btn-primary" onClick={onBook}>Book a Service</button>
            <button className="btn-outline" onClick={handleContact}>Contact Us</button>
          </div>
        </div>
        <div className="about-hero-card">
          <div className="about-hero-highlight">
            <span>Verified Care</span>
            <h3>Transparency you can trust</h3>
            <p>Every log, photo, and update is tracked in one secure place.</p>
          </div>
          <div className="about-hero-badge">
            <span>24/7</span>
            <small>Emergency support</small>
          </div>
        </div>
      </section>

      <section className="about-cards">
        <div className="section-title">
          <h2>Trusted care, built for real life</h2>
          <p>Everything you need to book with confidence.</p>
        </div>
        <div className="card-grid">
          <article className="trust-card">
            <h3>Verified Care & Secure Facility</h3>
            <p>Approved caretakers, secure check-ins, and monitored spaces for peace of mind.</p>
          </article>
          <article className="trust-card">
            <h3>Daily Activity Updates</h3>
            <p>Meals, walks, playtime, and wellness updates delivered with photos.</p>
          </article>
          <article className="trust-card">
            <h3>Emergency Support</h3>
            <p>Clear escalation paths, emergency protocols, and caretaker readiness.</p>
          </article>
        </div>
      </section>

      <section className="about-why">
        <div className="section-title">
          <h2>Why PawWell?</h2>
          <p>Human-friendly explanations of the platform features.</p>
        </div>
        <div className="why-grid">
          <ul>
            {whyItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="why-panel">
            <h3>Always in the loop</h3>
            <p>View activity timelines and photos the moment a caretaker posts them.</p>
            <button className="btn-outline" onClick={onAddPet}>Add Pet Profile</button>
          </div>
        </div>
      </section>

      <section className="about-steps">
        <div className="section-title">
          <h2>How it works</h2>
          <p>From sign-up to daily updates in three simple steps.</p>
        </div>
        <div className="steps-grid">
          <div className="step-card">
            <span>01</span>
            <h3>Create account + add pet</h3>
            <p>Save medical notes, allergies, and care preferences.</p>
          </div>
          <div className="step-card">
            <span>02</span>
            <h3>Book service + choose dates</h3>
            <p>Availability checks keep scheduling seamless.</p>
          </div>
          <div className="step-card">
            <span>03</span>
            <h3>Drop off pet + receive updates</h3>
            <p>Follow activity logs and photos throughout their stay.</p>
          </div>
        </div>
      </section>

      <section className="about-mv">
        <div className="mv-card">
          <h3>Mission</h3>
          <p>Deliver safe, transparent pet care with technology that builds trust.</p>
        </div>
        <div className="mv-card">
          <h3>Vision</h3>
          <p>Become the most reliable pet care partner for families and caretakers.</p>
        </div>
      </section>

      <section className="about-team">
        <div className="section-title">
          <h2>Project</h2>
          <p>Final year project details.</p>
        </div>
        <div className="team-grid">
          <article>
            <h3>Developed by</h3>
            <p>Aayusha Kandel</p>
            <span>Full-Stack Developer</span>
          </article>
          {/* <article>
            <h3>Supervised by</h3>
            <p>Supervisor Name</p>
            <span>Project Supervisor</span>
          </article> */}
        </div>
      </section>
    </div>
  );
}
