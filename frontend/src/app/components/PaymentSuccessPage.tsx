import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { verifyKhaltiPayment, getUserBookings } from '../../services/api';

interface PaymentSuccessPageProps {
  onContinue: () => void;
}

export default function PaymentSuccessPage({ onContinue }: PaymentSuccessPageProps) {
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('Verifying your payment...');
  const [message, setMessage] = useState('Please wait while we confirm your Khalti transaction.');
  const [verified, setVerified] = useState(false);
  const [popupShown, setPopupShown] = useState(false); // Prevent duplicate popups

  // DEBUG: Log immediately on component mount
  console.log('[PaymentSuccessPage] COMPONENT MOUNTED! ');
  console.log('Current URL:', window.location.href);
  console.log('Current pathname:', window.location.pathname);
  console.log('Current search:', window.location.search);
  console.log('localStorage:', {
    khalti_pidx: localStorage.getItem('khalti_pidx'),
    khalti_booking_id: localStorage.getItem('khalti_booking_id')
  });
  console.log('sessionStorage:', {
    khalti_pidx: sessionStorage.getItem('khalti_pidx'),
    khalti_booking_id: sessionStorage.getItem('khalti_booking_id')
  });

  useEffect(() => {
    let verificationAttempted = false;

    const verifyPayment = async () => {
      // Prevent double-verification
      if (verificationAttempted) {
        console.log('[PaymentSuccessPage] Verification already in progress, skipping duplicate');
        return;
      }
      verificationAttempted = true;

      try {
        const params = new URLSearchParams(window.location.search);
        let pidx = params.get('pidx') || params.get('idx');
        const khaltiStatus = params.get('status');

        console.log('[PaymentSuccessPage] Verification starting');
        console.log('URL params:', window.location.search);
        console.log('pidx from URL:', pidx);
        console.log('Khalti status:', khaltiStatus);

        // Get booking_id from storage
        let bookingIdStr = sessionStorage.getItem('khalti_booking_id') || localStorage.getItem('khalti_booking_id');
        let bookingId = bookingIdStr ? parseInt(bookingIdStr, 10) : null;

        // If pidx not in URL, try storage
        if (!pidx) {
          pidx = sessionStorage.getItem('khalti_pidx') || localStorage.getItem('khalti_pidx') || null;
          if (pidx) {
            console.log('Retrieved pidx from storage:', pidx);
          }
        }

        // STRATEGY 1: If we have pidx, verify the payment directly with backend
        if (pidx && bookingId) {
          console.log('STRATEGY 1: Verifying with pidx and booking_id');
          try {
            const response = await verifyKhaltiPayment({ pidx, booking_id: bookingId });
            
            if (response?.success === true) {
              console.log('PAYMENT VERIFIED via pidx!');
              handlePaymentSuccess(response);
              return;
            }
          } catch (pidxError) {
            console.log('Pidx verification failed, trying alternative strategy');
          }
        }

        // If pidx is missing or verification failed, check recent bookings for paid status
        console.log('STRATEGY 2: Checking recent bookings for paid status');
        try {
          const bookingsResponse = await getUserBookings({ upcoming: true });
          const allBookings = bookingsResponse.data || bookingsResponse.bookings || [];
          
          console.log(`Found ${allBookings.length} recent bookings, checking for recently paid...`);
          
          // Look for a booking that was recently paid (within last 5 minutes)
          const now = new Date();
          const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);
          
          const paidBooking = allBookings.find((b: any) => {
            const bookingTime = new Date(b.updated_at || b.created_at);
            const isPaid = b.payment_status === 'paid' || b.payment_status === 'PAID';
            const isRecent = bookingTime > fiveMinutesAgo;
            
            console.log(`  Booking #${b.booking_id}: payment_status=${b.payment_status}, updated=${b.updated_at}, recent=${isRecent}`);
            
            return isPaid && isRecent;
          });
          
          if (paidBooking) {
            console.log('FOUND RECENTLY PAID BOOKING! #' + paidBooking.booking_id);
            const syntheticResponse = {
              success: true,
              data: {
                booking: paidBooking,
                message: 'Payment verified successfully'
              }
            };
            handlePaymentSuccess(syntheticResponse);
            return;
          }
        } catch (strategicError) {
          console.log('Strategic booking check failed:', strategicError);
        }

        // FALLBACK: If all else fails
        console.log('Could not verify payment using any strategy');
        
        // Prevent duplicate fallback popups
        if (popupShown) {
          console.log('Fallback popup already shown, skipping duplicate');
          return;
        }
        
        setPopupShown(true);
        
        if (bookingId) {
          console.log('Have booking_id but payment not confirmed - showing recovery option');
          setTitle('Payment processing');
          setMessage('We found your booking but payment verification is still processing. Please return to Manage Bookings to check the status.');
          setLoading(false);
          
          Swal.fire({
            icon: 'info',
            title: 'Payment Verifying',
            html: '<p>Your payment is still being verified.</p><p>Please return to <strong>Manage Bookings</strong> to see the updated status.</p>',
            confirmButtonColor: '#FA9884',
            confirmButtonText: 'Go to Manage Bookings',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: (modal) => {
              console.log('Payment Verifying popup opened');
              const btn = modal.querySelector('.swal2-confirm') as HTMLElement;
              if (btn) {
                btn.addEventListener('click', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Go to Manage Bookings button clicked');
                  // Clear storage and redirect
                  sessionStorage.removeItem('khalti_pidx');
                  sessionStorage.removeItem('khalti_booking_id');
                  localStorage.removeItem('khalti_pidx');
                  localStorage.removeItem('khalti_booking_id');
                  Swal.close();
                  performRedirect();
                }, { once: true }); // Use 'once' to ensure handler runs only once
              }
            }
          });
        } else {
          console.log(' No pidx and no booking_id - cannot proceed');
          setTitle('Payment reference missing');
          setMessage('Could not find payment reference. Please try initiating payment again from Manage Bookings.');
          setLoading(false);
          
          Swal.fire({
            icon: 'warning',
            title: 'Payment Reference Missing',
            html: '<p>Could not find payment details to verify.</p><p>Please return to <strong>Manage Bookings</strong> and try the payment again.</p>',
            confirmButtonColor: '#FA9884',
            confirmButtonText: 'Go Back',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: (modal) => {
              console.log(' Payment Reference Missing popup opened');
              const btn = modal.querySelector('.swal2-confirm') as HTMLElement;
              if (btn) {
                btn.addEventListener('click', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log(' Go Back button clicked');
                  // Close popup first, then redirect
                  Swal.close();
                  performRedirect();
                }, { once: true }); // Use 'once' to ensure handler runs only once
              }
            }
          });
        }

      } catch (error: any) {
        console.error('Unexpected error during verification:', error);
        
        // Prevent duplicate error popups
        if (popupShown) {
          console.log('Error popup already shown, skipping duplicate');
          return;
        }
        
        setPopupShown(true);
        setTitle('Payment verification failed');
        setMessage('An unexpected error occurred. Please try again or contact support.');
        setLoading(false);
        
        Swal.fire({
          icon: 'error',
          title: 'Verification Failed',
          text: 'An error occurred during payment verification. Please try again.',
          confirmButtonColor: '#FA9884',
          confirmButtonText: 'Go Back',
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: (modal) => {
            console.log('Error popup opened');
            const btn = modal.querySelector('.swal2-confirm') as HTMLElement;
            if (btn) {
              btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Error popup - Go Back clicked');
                Swal.close();
                performRedirect();
              }, { once: true });
            }
            // Auto-close after 4 seconds if user doesn't click
            setTimeout(() => {
              if (Swal.isVisible()) {
                console.log('⏱️ Auto-closing error popup');
                Swal.close();
                performRedirect();
              }
            }, 4000);
          }
        });
      }
    };
    
    // Helper function to handle successful payment
    const handlePaymentSuccess = (response: any) => {
      console.log('PAYMENT SUCCESS HANDLER CALLED');
      
      // Prevent duplicate success popups
      if (popupShown) {
        console.log('Success popup already shown, skipping duplicate');
        return;
      }
      
      setPopupShown(true);
      setVerified(true);
      setTitle('Payment successful');
      setMessage('Your payment has been verified and your booking is now confirmed.');
      
      // Clear storage
      sessionStorage.removeItem('khalti_pidx');
      sessionStorage.removeItem('khalti_booking_id');
      localStorage.removeItem('khalti_pidx');
      localStorage.removeItem('khalti_booking_id');
      localStorage.removeItem('khalti_storage_timestamp');
      
      // Store booking data
      if (response?.data?.booking) {
        sessionStorage.setItem('just_paid_booking_id', response.data.booking.booking_id);
        sessionStorage.setItem('payment_verified_booking', JSON.stringify(response.data.booking));
      }
      
      // Close any existing modals
      if (Swal.isVisible()) {
        Swal.close();
      }
      
      setLoading(false);
      
      // Show success popup and redirect
      Swal.fire({
        icon: 'success',
        title: 'Payment Successful! 🎉',
        html: '<p>Your booking is confirmed and ready!</p><p style="font-size: 0.9em; margin-top: 1em; color: #666;">Redirecting to dashboard...</p>',
        confirmButtonColor: '#FA9884',
        confirmButtonText: 'Go to Dashboard',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          console.log('Success popup shown - will redirect in 2 seconds or on button click');
          // Auto redirect after 2 seconds
          const autoRedirectTimer = setTimeout(() => {
            console.log('Auto-redirect triggered after 2 seconds');
            performRedirect();
          }, 2000);
          
          // Handle manual button click
          const btn = document.querySelector('.swal2-confirm') as HTMLElement;
          if (btn) {
            btn.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              clearTimeout(autoRedirectTimer);
              console.log('User clicked button - redirecting immediately');
              performRedirect();
            }, { once: true });
          }
        },
        willClose: () => {
          console.log('Popup closing');
        }
      });
    };
    
    // Helper function to perform the actual redirect
    const performRedirect = () => {
      console.log('PERFORMING REDIRECT - Calling onContinue callback');
      // Clear ALL payment-related storage before redirecting
      sessionStorage.removeItem('khalti_pidx');
      sessionStorage.removeItem('khalti_booking_id');
      localStorage.removeItem('khalti_pidx');
      localStorage.removeItem('khalti_booking_id');
      localStorage.removeItem('khalti_storage_timestamp');
      
      // Use the onContinue callback which will properly update App.tsx state
      onContinue();
    };

    verifyPayment();
  }, []); // Empty dependency - run only once on mount

  return (
    <div className="min-h-screen bg-[#FFF9F5] dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8 text-center">
        <div className="text-5xl mb-4">{loading ? '⏳' : verified ? '✅' : '⚠️'}</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">{message}</p>

        {!verified && (
          <button
            disabled={loading}
            className="w-full bg-[#FA9884] text-white py-3 rounded-lg font-semibold hover:bg-[#E8876F] transition disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Redirecting to Dashboard'}
          </button>
        )}
      </div>
    </div>
  );
}
