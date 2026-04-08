import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export default function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteAccountModalProps) {
  const [understood, setUnderstood] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (understood) {
      onConfirm();
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full max-h-screen overflow-y-auto">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-red-500/10 to-red-600/10 dark:from-red-900/20 dark:to-red-800/20 px-6 py-4 border-b border-red-200 dark:border-red-900/50">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-red-600 dark:text-red-400">
                  Delete Account
                </h2>
                <p className="text-sm text-red-600/70 dark:text-red-400/70">
                  This action cannot be undone
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Are you absolutely sure you want to delete your account? This will permanently erase:
            </p>

            {/* Data that will be deleted */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-red-500 dark:text-red-400 mt-1">•</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Your profile and personal information
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-500 dark:text-red-400 mt-1">•</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  All your pet profiles and records
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-500 dark:text-red-400 mt-1">•</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  All booking history and reservations
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-500 dark:text-red-400 mt-1">•</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Activity logs and transactions
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-500 dark:text-red-400 mt-1">•</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  All wellness timeline data
                </span>
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <div className="flex items-start gap-3 pt-2">
              <input
                type="checkbox"
                id="understand"
                checked={understood}
                onChange={(e) => setUnderstood(e.target.checked)}
                disabled={isDeleting}
                className="mt-1 w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500 cursor-pointer dark:bg-gray-700 dark:border-gray-600"
              />
              <label
                htmlFor="understand"
                className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none"
              >
                I understand that this action is <strong>permanent and irreversible</strong>. Delete my account.
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex gap-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg font-medium hover:bg-gray-400 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!understood || isDeleting}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                'Delete Account'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
