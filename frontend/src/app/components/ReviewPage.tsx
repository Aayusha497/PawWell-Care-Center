import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getReviewableBookings, createReview } from '../../services/api';

interface Pet {
  pet_id: number;
  name: string;
  breed: string;
  photo?: string;
}

interface Booking {
  booking_id: number;
  pet_id: number;
  service_type: string;
  start_date: string;
  end_date: string;
  price: number;
  confirmation_code?: string;
  pet?: Pet;
}

interface ReviewPageProps {
  onBackToBookingHistory?: () => void;
  onBackToDashboard: () => void;
  bookingId?: number;
}

const ReviewPage: React.FC<ReviewPageProps> = ({
  onBackToBookingHistory,
  onBackToDashboard,
  bookingId
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<number | null>(bookingId || null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchReviewableBookings();
  }, []);

  const fetchReviewableBookings = async () => {
    try {
      setLoading(true);
      // console.log('Fetching reviewable bookings...');

      const response = await getReviewableBookings();
      // console.log('Response:', response);

      const bookingData = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.bookings)
        ? response.bookings
        : [];

      console.log('Found', bookingData.length, 'reviewable bookings');
      setBookings(bookingData);
    } catch (error: any) {
      console.error('Error fetching reviewable bookings:', error);
      toast.error(error.message || 'Failed to load bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBooking) {
      toast.error('Please select a booking');
      return;
    }

    if (rating === 0) {
      toast.error('Please provide a rating (1-5 stars)');
      return;
    }

    if (!comment.trim()) {
      toast.error('Please write a comment');
      return;
    }

    if (comment.length < 10) {
      toast.error('Comment must be at least 10 characters');
      return;
    }

    try {
      setSubmitting(true);

      const reviewData = {
        booking_id: selectedBooking,
        rating: rating,
        comment: comment.trim(),
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/reviews`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to submit review');
      }

      const result = await response.json();
      console.log('✅ Review submitted:', result);
      toast.success('Review submitted successfully! Awaiting admin approval...');

      // Reset form
      setRating(0);
      setComment('');
      setSelectedBooking(null);

      // Refresh bookings
      await fetchReviewableBookings();

      // Redirect after 2 seconds
      setTimeout(() => {
        onBackToDashboard();
      }, 2000);
    } catch (error: any) {
      console.error('❌ Error submitting review:', error);
      const message = error.response?.data?.message || error.message || 'Failed to submit review';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({
    rating,
    onChange,
  }: {
    rating: number;
    onChange: (value: number) => void;
  }) => {
    const [hover, setHover] = useState(0);

    return (
      <div className="flex gap-2 items-center">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className={`text-4xl transition-all duration-200 ${
                star <= (hover || rating)
                  ? 'text-yellow-400 scale-110'
                  : 'text-gray-300 scale-100'
              }`}
              aria-label={`Rate ${star} stars`}
            >
              ★
            </button>
          ))}
        </div>
        {rating > 0 && (
          <span className="ml-2 text-lg font-semibold text-gray-700">
            {rating}/5
          </span>
        )}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const selectedBookingData = bookings.find((b) => b.booking_id === selectedBooking);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F5] to-[#FFEBE5] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 dark:text-gray-100">Leave a Review</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Share your experience with PawWell Care
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FA9884]"></div>
          </div>
        ) : bookings.length === 0 ? (
          // No bookings
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-md">
            <div className="mb-6">
              {/* <div className="text-6xl mb-4">✅</div> */}
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                All Caught Up!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
                You've already submitted reviews for all your completed services.
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">
                Thank you for sharing your feedback with us! 
              </p>
            </div>
            <button
              onClick={onBackToDashboard}
              className="mt-6 px-6 py-3 bg-[#FA9884] text-white rounded-lg hover:bg-[#f07d6a] transition"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          // Review form
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            {/* Booking Selection */}
            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
                Select Booking to Review <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedBooking || ''}
                onChange={(e) => setSelectedBooking(Number(e.target.value) || null)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-[#FA9884] focus:border-transparent"
                required
              >
                <option value="">-- Select a booking --</option>
                {bookings.map((booking) => (
                  <option key={booking.booking_id} value={booking.booking_id}>
                    {booking.pet?.name} - {booking.service_type} (
                    {formatDate(booking.end_date)})
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Booking Details */}
            {selectedBookingData && (
              <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  Booking Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Pet</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      🐾 {selectedBookingData.pet?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Service</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      {selectedBookingData.service_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Date</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      {formatDate(selectedBookingData.start_date)} →{' '}
                      {formatDate(selectedBookingData.end_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Price</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      ${selectedBookingData.price}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Rating */}
            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Your Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex justify-center p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <StarRating rating={rating} onChange={setRating} />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 text-center">
                Please rate your overall experience (1 = Poor, 5 = Excellent)
              </p>
            </div>

            {/* Comment */}
            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
                Your Comment <span className="text-red-500">*</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience (minimum 10 characters)..."
                rows={6}
                minLength={10}
                maxLength={500}
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-[#FA9884] focus:border-transparent resize-none"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {comment.length}/500 characters
              </p>
            </div>

            {/* Approval Notice */}
            <div className="mb-8 p-4 bg-amber-50 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-800 flex items-start gap-3">
              {/* <span className="text-2xl mt-1">ℹ️</span> */}
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-100">
                  Review Pending Approval
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Your review will be submitted and awaiting admin approval. Once approved, it will be
                  visible to other customers.
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onBackToDashboard}
                disabled={submitting}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || rating === 0 || !comment.trim()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#FA9884] to-[#f07d6a] text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReviewPage;
