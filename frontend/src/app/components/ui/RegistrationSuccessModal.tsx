import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface RegistrationSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  autoRedirectSeconds?: number;
  userEmail?: string;
}

export default function RegistrationSuccessModal({
  isOpen,
  onClose,
  autoRedirectSeconds = 5,
  userEmail
}: RegistrationSuccessModalProps) {
  const [countdown, setCountdown] = React.useState(autoRedirectSeconds);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCountdown(autoRedirectSeconds);

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(timer);
        document.body.style.overflow = 'unset';
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, autoRedirectSeconds, onClose]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-300 animate-in fade-in zoom-in-95">
          
          {/* Header with gradient background */}
          <div className="relative bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-300 dark:from-yellow-700 dark:via-yellow-800 dark:to-amber-700 px-6 py-10 text-center overflow-hidden">
            {/* Animated background circles */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full -mr-20 -mt-20 animate-pulse"></div>

            {/* Success Icon */}
            <div className="relative z-10 flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-amber-700 dark:text-amber-300 drop-shadow-lg" />
            </div>

            <h1 className="relative z-10 text-2xl font-bold text-gray-900 dark:text-gray-100">
              Account Created!
            </h1>
            <p className="relative z-10 text-amber-800 dark:text-amber-200 text-sm font-medium">
              Welcome to the PawWell family 🐾
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-4">
            {/* Success message */}
            <div className="text-center">
              <p className="text-gray-800 dark:text-gray-200 font-semibold">
                Your account has been registered successfully!
              </p>
            </div>

            {/* Email confirmation */}
            {userEmail && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
                <p className="text-xs text-gray-600 dark:text-gray-400">Registered with:</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">
                  {userEmail}
                </p>
              </div>
            )}

            {/* Countdown */}
            <div className="text-center py-2">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Redirecting in <span className="font-bold text-yellow-600 dark:text-yellow-400">{countdown}</span>s...
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-yellow-50 dark:bg-yellow-900/10 px-6 py-4 border-t border-yellow-200 dark:border-yellow-800">
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-yellow-400 dark:bg-yellow-600 text-gray-900 dark:text-gray-100 rounded-lg font-semibold hover:bg-yellow-500 dark:hover:bg-yellow-700 transition-all duration-200 hover:shadow-lg"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
