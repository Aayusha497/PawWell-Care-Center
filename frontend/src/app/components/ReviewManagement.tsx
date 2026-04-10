import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Pet {
  pet_id: number;
  name: string;
  breed: string;
  photo?: string;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  profile_picture?: string;
}

interface Review {
  review_id: number;
  booking_id: number;
  user_id: number;
  pet_id: number;
  service_type: string;
  rating_service: number;
  rating_staff: number;
  rating_cleanliness: number;
  rating_value: number;
  rating_communication: number;
  rating_pet_condition: number;
  overall_rating: number;
  review_text?: string;
  photos?: string;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
  user?: User;
  pet?: Pet;
}

const ReviewManagement: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');
  const [processing, setProcessing] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching reviews from:', 'http://localhost:8000/api/reviews/admin/all');
      
      const response = await fetch('http://localhost:8000/api/reviews/admin/all', {
        credentials: 'include', // Important: sends cookies with the request
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        const errorMsg = errorData.message || 'Failed to fetch reviews';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      
      const data = await response.json();
      console.log('Reviews data:', data);
      
      let reviewData = data.data || data.reviews || data || [];
      
      // Filter based on status
      if (filter === 'pending') {
        reviewData = reviewData.filter((r: Review) => !r.is_approved);
      } else if (filter === 'approved') {
        reviewData = reviewData.filter((r: Review) => r.is_approved);
      }
      
      setReviews(Array.isArray(reviewData) ? reviewData : []);
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      const errorMsg = error.message || 'Failed to load reviews';
      setError(errorMsg);
      toast.error(errorMsg);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId: number, featured: boolean = false) => {
    try {
      setProcessing(reviewId);
      
      const response = await fetch(`http://localhost:8000/api/reviews/${reviewId}/approve`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_approved: true,
          is_featured: featured
        })
      });

      if (!response.ok) throw new Error('Failed to approve review');
      
      // Update state directly instead of fetching all reviews
      setReviews(prevReviews =>
        prevReviews.map(review =>
          review.review_id === reviewId
            ? { ...review, is_approved: true, is_featured: featured }
            : review
        )
      );
      
      toast.success(featured ? 'Review approved and featured!' : 'Review approved!');
    } catch (error: any) {
      console.error('Error approving review:', error);
      toast.error('Failed to approve review');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (reviewId: number) => {
    try {
      setProcessing(reviewId);
      
      const response = await fetch(`http://localhost:8000/api/reviews/${reviewId}/approve`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_approved: false,
          is_featured: false
        })
      });

      if (!response.ok) throw new Error('Failed to reject review');
      
      // Update state directly instead of fetching all reviews
      setReviews(prevReviews =>
        prevReviews.map(review =>
          review.review_id === reviewId
            ? { ...review, is_approved: false, is_featured: false }
            : review
        )
      );
      
      toast.success('Review rejected');
    } catch (error: any) {
      console.error('Error rejecting review:', error);
      toast.error('Failed to reject review');
    } finally {
      setProcessing(null);
    }
  };

  const handleUnfeature = async (reviewId: number) => {
    try {
      setProcessing(reviewId);
      
      const response = await fetch(`http://localhost:8000/api/reviews/${reviewId}/approve`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_approved: true,
          is_featured: false
        })
      });

      if (!response.ok) throw new Error('Failed to unfeature review');
      
      // Update state directly instead of fetching all reviews
      setReviews(prevReviews =>
        prevReviews.map(review =>
          review.review_id === reviewId
            ? { ...review, is_approved: true, is_featured: false }
            : review
        )
      );
      
      toast.success('Review removed from featured');
    } catch (error: any) {
      console.error('Error unfeaturning review:', error);
      toast.error('Failed to unfeature review');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const StarDisplay = ({ rating }: { rating: number }) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${star <= rating ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Reviews</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{reviews.length}</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-xl p-4 shadow-sm border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-400 mb-1">Pending Approval</p>
          <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">
            {reviews.filter(r => !r.is_approved).length}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-4 shadow-sm border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-800 dark:text-green-400 mb-1">Approved</p>
          <p className="text-2xl font-bold text-green-900 dark:text-green-300">
            {reviews.filter(r => r.is_approved).length}
          </p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'all'
              ? 'bg-gray-900 dark:bg-gray-700 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          All Reviews
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'pending'
              ? 'bg-yellow-500 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          Pending Approval
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'approved'
              ? 'bg-green-500 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          Approved
        </button>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/30 rounded-xl p-8 text-center shadow-sm border-2 border-red-200 dark:border-red-800">
          <div className="text-red-600 dark:text-red-400 text-4xl mb-3">⚠️</div>
          <h3 className="text-red-800 dark:text-red-300 font-semibold text-lg mb-2">Error Loading Reviews</h3>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchReviews}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm">
          <p className="text-gray-500 dark:text-gray-400">
            {filter === 'pending' ? 'No pending reviews' : 
             filter === 'approved' ? 'No approved reviews yet' : 
             'No reviews yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.review_id}
              className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-2 transition ${
                review.is_approved
                  ? 'border-green-200 dark:border-green-800'
                  : 'border-yellow-200 dark:border-yellow-800'
              }`}
            >
              {/* Review Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  {review.pet?.photo && (
                    <img
                      src={review.pet.photo}
                      alt={review.pet.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                      {review.user?.first_name} {review.user?.last_name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Pet: {review.pet?.name} • Service: {review.service_type}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {formatDate(review.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-yellow-600">
                      {review.overall_rating}
                    </span>
                    <StarDisplay rating={Math.round(review.overall_rating)} />
                  </div>
                  {review.is_featured && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                      ⭐ Featured
                    </span>
                  )}
                  {review.is_approved ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      ✓ Approved
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                      ⏳ Pending
                    </span>
                  )}
                </div>
              </div>

              {/* Detailed Ratings */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Service Quality</p>
                  <StarDisplay rating={review.rating_service} />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Staff</p>
                  <StarDisplay rating={review.rating_staff} />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Cleanliness</p>
                  <StarDisplay rating={review.rating_cleanliness} />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Value</p>
                  <StarDisplay rating={review.rating_value} />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Communication</p>
                  <StarDisplay rating={review.rating_communication} />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Pet Condition</p>
                  <StarDisplay rating={review.rating_pet_condition} />
                </div>
              </div>

              {/* Review Text */}
              {review.review_text && (
                <div className="mb-4">
                  <p className="text-gray-700 dark:text-gray-300 italic">"{review.review_text}"</p>
                </div>
              )}

              {/* Review Photo */}
              {review.photos && (
                <div className="mb-4">
                  <img
                    src={review.photos}
                    alt="Review"
                    className="rounded-lg max-w-md max-h-64 object-cover"
                  />
                </div>
              )}

              {/* Action Buttons */}
              {!review.is_approved && (
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleApprove(review.review_id, false)}
                    disabled={processing === review.review_id}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:bg-gray-300 dark:disabled:bg-gray-600"
                  >
                    {processing === review.review_id ? 'Processing...' : '✓ Approve'}
                  </button>
                  <button
                    onClick={() => handleApprove(review.review_id, true)}
                    disabled={processing === review.review_id}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:bg-gray-300 dark:disabled:bg-gray-600"
                  >
                    {processing === review.review_id ? 'Processing...' : '⭐ Approve & Feature'}
                  </button>
                  <button
                    onClick={() => handleReject(review.review_id)}
                    disabled={processing === review.review_id}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:bg-gray-300 dark:disabled:bg-gray-600"
                  >
                    ✗ Reject
                  </button>
                </div>
              )}

              {review.is_approved && !review.is_featured && (
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleApprove(review.review_id, true)}
                    disabled={processing === review.review_id}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:bg-gray-300 dark:disabled:bg-gray-600"
                  >
                    ⭐ Feature this Review
                  </button>
                  <button
                    onClick={() => handleReject(review.review_id)}
                    disabled={processing === review.review_id}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:bg-gray-300 dark:disabled:bg-gray-600"
                  >
                    Unapprove
                  </button>
                </div>
              )}

              {review.is_approved && review.is_featured && (
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleUnfeature(review.review_id)}
                    disabled={processing === review.review_id}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition disabled:bg-gray-300 dark:disabled:bg-gray-600"
                  >
                    ✓ Remove from Featured
                  </button>
                  <button
                    onClick={() => handleReject(review.review_id)}
                    disabled={processing === review.review_id}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:bg-gray-300 dark:disabled:bg-gray-600"
                  >
                    Unapprove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewManagement;
