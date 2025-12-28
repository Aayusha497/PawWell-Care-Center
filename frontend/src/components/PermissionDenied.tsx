import { useNavigate } from 'react-router-dom';
import { Button } from '../app/components/ui/button';
import { Alert, AlertDescription } from '../app/components/ui/alert';

interface PermissionDeniedProps {
  message?: string;
  redirectTo?: string;
  redirectLabel?: string;
}

export default function PermissionDenied({ 
  message = "You don't have permission to access this page.",
  redirectTo = '/',
  redirectLabel = 'Go to Home'
}: PermissionDeniedProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8E8] to-[#EAB308] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8">
        <div className="text-center">
          {/* Icon */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100">
              <svg
                className="w-10 h-10 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>

          {/* Message */}
          <Alert variant="destructive" className="mb-6">
            <AlertDescription className="text-left">
              {message}
            </AlertDescription>
          </Alert>

          <p className="text-gray-600 mb-8">
            This page is restricted. Please contact an administrator if you believe you should have access.
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => navigate(redirectTo)}
              className="w-full bg-[#EAB308] hover:bg-[#D4A017] text-white"
            >
              {redirectLabel}
            </Button>
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="w-full"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
