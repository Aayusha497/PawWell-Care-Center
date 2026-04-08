import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface CancelConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function CancelConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
}: CancelConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-300 animate-in fade-in zoom-in-95">
          
          {/* Header */}
          <div className="relative bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-300 dark:from-yellow-700 dark:via-yellow-800 dark:to-amber-700 px-6 py-6 text-center">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex justify-center mb-3">
              <AlertCircle className="w-8 h-8 text-amber-700 dark:text-amber-300" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              Cancel Changes?
            </h2>
          </div>

          {/* Content */}
          <div className="px-6 py-6 text-center space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Are you sure you want to cancel? Any unsaved changes will be lost.
            </p>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex gap-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition duration-200"
            >
              Keep Editing
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-yellow-400 dark:bg-yellow-600 text-gray-900 dark:text-gray-100 rounded-lg font-medium hover:bg-yellow-500 dark:hover:bg-yellow-700 transition duration-200"
            >
              Discard
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
