import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getReviewableBookings, createReview } from '../../services/api';

interface Pet {
  pet_id: number;
  name: string;
  breed: string;
  photo: string;
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
  onBackToBookingHistory: () => void;
  onBackToDashboard: () => void;
  bookingId?: number;
}

const ReviewPage: React.FC<ReviewPageProps> = ({ onBackToBookingHistory, onBackToDashboard, bookingId }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<number | null>(bookingId || null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Rating states
  const [ratings, setRatings] = useState({
    service: 0,
    staff: 0,
    cleanliness: 0,
    value: 0,
    communication: 0,
    pet_condition: 0
  });
  const [comment, setComment] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchReviewableBookings();
  }, []);

  const fetchReviewableBookings = async () => {
    try {
      setLoading(true);
      console.log('📋 Fetching reviewable bookings...');
      
      const response = await getReviewableBookings();
      console.log('📋 Raw response:', response);
      
      const bookingData = response.data || response.bookings || response || [];
      console.log('📋 Booking data extracted:', bookingData);
      console.log('📋 Is array?', Array.isArray(bookingData));
      console.log('📋 Count:', bookingData.length);
      
      setBookings(Array.isArray(bookingData) ? bookingData : []);
    } catch (error: any) {
      console.error('❌ Error fetching reviewable bookings:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error data:', error.response?.data);
      toast.error(error.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (category: string, value: number) => {
    setRatings(prev => ({ ...prev, [category]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateOverallRating = () => {
    const total = Object.values(ratings).reduce((sum, rating) => sum + rating, 0);
    return (total / Object.keys(ratings).length).toFixed(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBooking) {
      toast.error('Please select a booking');
      return;
    }

    // Validate all ratings are provided
    const allRatingsProvided = Object.values(ratings).every(r => r > 0);
    if (!allRatingsProvided) {
      toast.error('Please provide all ratings (all categories must be rated)');
      return;
    }

    try {
      setSubmitting(true);
      
      const formData = new FormData();
      formData.append('booking_id', selectedBooking.toString());
      formData.append('review_text', comment);
      
      // Add ratings with correct field names (rating_ prefix)
      Object.entries(ratings).forEach(([key, value]) => {
        formData.append(`rating_${key}`, value.toString());
      });
      
      // Add photo if selected
      if (photo) {
        formData.append('photo', photo);
      }

      await createReview(formData);
      toast.success('Review submitted successfully!');
      
      // Redirect to dashboard after successful submission
      setTimeout(() => {
        onBackToDashboard();
      }, 1000);
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ rating, onChange }: { rating: number; onChange: (value: number) => void }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`text-2xl transition ${
              star <= rating ? 'text-yellow-500' : 'text-gray-300'
            } hover:text-yellow-400`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const selectedBookingData = bookings.find(b => b.booking_id === selectedBooking);

  return (
    <div className="min-h-screen bg-[#FFF9F5] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Leave a Review</h1>
          <p className="text-gray-600">Share your experience with PawWell Care</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FA9884]"></div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-md">
            <div className="mb-6">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                All Caught Up!
              </h2>
              <p className="text-gray-600 text-lg mb-2">
                You've already submitted reviews for this services.
              </p>
              <p className="text-gray-500 text-sm">
                Thank you for sharing your feedback with us! 🙏
              </p>
            </div>
            <button
              onClick={onBackToBookingHistory}
              className="bg-[#FA9884] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#E8876F] transition shadow-md"
            >
              Back to Booking History
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-md">
            {/* Select Booking */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Booking to Review *
              </label>
              <select
                value={selectedBooking || ''}
                onChange={(e) => setSelectedBooking(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#FA9884] focus:outline-none"
                required
              >
                <option value="">Choose a booking...</option>
                {bookings.map((booking) => (
                  <option key={booking.booking_id} value={booking.booking_id}>
                    {booking.pet?.name} - {booking.service_type} ({formatDate(booking.start_date)})
                  </option>
                ))}
              </select>
            </div>

            {/* Show booking details when selected */}
            {selectedBookingData && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  {selectedBookingData.pet?.photo && (
                    <img
                      src={selectedBookingData.pet.photo}
                      alt={selectedBookingData.pet.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">{selectedBookingData.pet?.name}</h3>
                    <p className="text-gray-600">{selectedBookingData.service_type}</p>
                    <p className="text-sm text-gray-500">Booking #{selectedBookingData.confirmation_code}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Rating Categories */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">Rate Your Experience *</h3>
              <p className="text-sm text-gray-600 mb-4">All categories are required</p>
              <div className="space-y-4">
                {[
                  { key: 'service', label: 'Overall Service Quality' },
                  { key: 'staff', label: 'Staff Friendliness & Professionalism' },
                  { key: 'cleanliness', label: 'Facility Cleanliness' },
                  { key: 'value', label: 'Value for Money' },
                  { key: 'communication', label: 'Communication & Updates' },
                  { key: 'pet_condition', label: 'Pet Condition After Service' }
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      {label} <span className="text-red-500">*</span>
                    </label>
                    <StarRating
                      rating={ratings[key as keyof typeof ratings]}
                      onChange={(value) => handleRatingChange(key, value)}
                    />
                  </div>
                ))}
              </div>

              {/* Overall Rating Display */}
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-1">Overall Rating</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {calculateOverallRating()} ★
                </p>
              </div>
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Review (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#FA9884] focus:outline-none resize-none"
                placeholder="Share your experience with our service..."
              />
            </div>

            {/* Photo Upload */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Add Photo (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#FA9884] focus:outline-none"
              />
              {photoPreview && (
                <div className="mt-4">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full max-w-xs rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhoto(null);
                      setPhotoPreview(null);
                    }}
                    className="mt-2 text-sm text-red-600 hover:text-red-700"
                  >
                    Remove Photo
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting || !selectedBooking}
                className="flex-1 bg-[#FA9884] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#E8876F] transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
              <button
                type="button"
                onClick={onBackToBookingHistory}
                className="px-6 py-3 bg-white border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReviewPage;
