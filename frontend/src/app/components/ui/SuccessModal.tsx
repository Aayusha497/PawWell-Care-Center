import React, { useEffect } from 'react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  actionText?: string;
  autoRedirectSeconds?: number;
}

export default function SuccessModal({ 
  isOpen, 
  onClose, 
  title = 'Success',
  message = 'Your registration was successful. Please login to continue.',
  actionText = 'OK',
  autoRedirectSeconds = 3
}: SuccessModalProps) {
  const [countdown, setCountdown] = React.useState(autoRedirectSeconds);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCountdown(autoRedirectSeconds);
      
      // Start countdown
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

  // Handle keyboard events
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.key === 'Escape' || e.key === 'Enter') && isOpen) {
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
    <div 
      className="clean-success-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-title"
      aria-describedby="success-message"
    >
      <div className="clean-success-card" onClick={(e) => e.stopPropagation()}>
        {/* Success Icon Circle */}
        <div className="clean-success-icon">
          <svg className="clean-checkmark" viewBox="0 0 52 52">
            <circle className="clean-checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
            <path className="clean-checkmark-path" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
        </div>
        
        {/* Title */}
        <h2 id="success-title" className="clean-success-title">
          {title}
        </h2>
        
        {/* Message */}
        <p id="success-message" className="clean-success-message">
          {message}
        </p>
        
        {/* OK Button */}
        <button 
          className="clean-success-button"
          onClick={onClose}
          autoFocus
          aria-label={actionText}
        >
          {actionText}
        </button>
      </div>
    </div>
  );
}
