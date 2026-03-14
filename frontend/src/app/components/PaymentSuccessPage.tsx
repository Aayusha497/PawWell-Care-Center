import { useEffect, useState } from 'react';
import { verifyKhaltiPayment } from '../../services/api';

interface PaymentSuccessPageProps {
  onContinue: () => void;
}

export default function PaymentSuccessPage({ onContinue }: PaymentSuccessPageProps) {
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('Verifying your payment...');
  const [message, setMessage] = useState('Please wait while we confirm your Khalti transaction.');
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      const params = new URLSearchParams(window.location.search);
      const pidx = params.get('pidx');

      if (!pidx) {
        setTitle('Payment reference missing');
        setMessage('No pidx was found in the URL. Please try the payment again from your booking.');
        setLoading(false);
        return;
      }

      try {
        const response = await verifyKhaltiPayment({ pidx });
        const isVerified = response?.success === true;

        if (isVerified) {
          setVerified(true);
          setTitle('Payment successful');
          setMessage('Your payment has been verified and your booking is now confirmed.');
        } else {
          setTitle('Payment not completed');
          setMessage(response?.message || 'Payment was not completed. You can retry from Manage Bookings.');
        }
      } catch (error: any) {
        setTitle('Payment verification failed');
        setMessage(error?.message || 'Could not verify the Khalti transaction. Please contact support if money was deducted.');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, []);

  return (
    <div className="min-h-screen bg-[#FFF9F5] dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8 text-center">
        <div className="text-5xl mb-4">{loading ? '⏳' : verified ? '✅' : '⚠️'}</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">{message}</p>

        <button
          onClick={onContinue}
          className="w-full bg-[#FA9884] text-white py-3 rounded-lg font-semibold hover:bg-[#E8876F] transition"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
