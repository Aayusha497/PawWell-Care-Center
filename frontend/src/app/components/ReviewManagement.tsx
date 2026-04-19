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

interface Booking {
  booking_id: number;
  service_type: string;
  start_date: string;
  end_date: string;
}

interface Review {
  review_id: number;
  booking_id: number;
  user_id: number;
  pet_id: number;
  service_type: string;
  rating: number;
  comment?: string;
  is_approved: boolean;
  is_featured: boolean;
  rejection_reason?: string;
  created_at: string;
  user?: User;
  pet?: Pet;
  booking?: Booking;
}

const ReviewManagement: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');
  const [processing, setProcessing] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rejectionReasons, setRejectionReasons] = useState<{ [key: number]: string }>({});
  const reviewsPerPage = 2;

  useEffect(() => {
    fetchReviews();
    setCurrentPage(1);
  }, [filter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/reviews/admin/all?status=${filter}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const reviewData = Array.isArray(data.data) ? data.data : [];
      setReviews(reviewData);
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to load reviews';
      setError(errorMsg);
      toast.error(errorMsg);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId: number) => {
    try {
      setProcessing(reviewId);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/reviews/${reviewId}/approve`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            is_approved: true,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to approve review');
      }

      toast.success('Review approved!');
      await fetchReviews();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve review');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (reviewId: number) => {
    const reason = rejectionReasons[reviewId] || 'Review does not meet guidelines';

    try {
      setProcessing(reviewId);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/reviews/${reviewId}/approve`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            is_approved: false,
            rejection_reason: reason,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to reject review');
      }

      toast.success('Review rejected!');
      setRejectionReasons((prev) => ({ ...prev, [reviewId]: '' }));
      await fetchReviews();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject review');
    } finally {
      setProcessing(null);
    }
  };

  const handleFeature = async (reviewId: number, isFeatured: boolean) => {
    try {
      setProcessing(reviewId);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/reviews/${reviewId}/feature`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            is_featured: !isFeatured,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update review');
      }

      toast.success(`Review ${!isFeatured ? 'featured' : 'unfeatured'}!`);
      await fetchReviews();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update review');
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (reviewId: number) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    try {
      setProcessing(reviewId);

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/reviews/${reviewId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete review');
      }

      toast.success('Review deleted!');
      await fetchReviews();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete review');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getInitials = (first?: string, last?: string) => {
    return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase() || 'U';
  };

  const StarDisplay = ({ rating, size = 'text-base' }: { rating: number; size?: string }) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`${size} leading-none ${star <= rating ? 'text-[#E0A106]' : 'text-gray-300'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const InfoRating = ({ label, rating }: { label: string; rating: number }) => (
    <div>
      <p className="text-sm text-gray-600 mb-2">{label}</p>
      <StarDisplay rating={rating} />
    </div>
  );

  const startIndex = (currentPage - 1) * reviewsPerPage;
  const endIndex = startIndex + reviewsPerPage;
  const paginatedReviews = reviews.slice(startIndex, endIndex);
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);

  return (
    <div className="min-h-screen bg-[#f8f8f8] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Review Management</h1>
          <p className="text-gray-500">Manage and moderate customer reviews</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-2">All Reviews</p>
            <p className="text-4xl font-bold text-[#0f172a]">{reviews.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#E8D28E] p-6">
            <p className="text-sm text-gray-500 mb-2">Pending Approval</p>
            <p className="text-4xl font-bold text-[#0f172a]">
              {reviews.filter((r) => !r.is_approved).length}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-[#BCE8C8] p-6">
            <p className="text-sm text-gray-500 mb-2">Approved</p>
            <p className="text-4xl font-bold text-[#0f172a]">
              {reviews.filter((r) => r.is_approved).length}
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6 flex gap-3">
          {(['all', 'pending', 'approved'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-5 py-2.5 rounded-xl font-semibold transition ${
                filter === status
                  ? 'bg-[#0f172a] text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {status === 'all' && 'All Reviews'}
              {status === 'pending' && 'Pending Approval'}
              {status === 'approved' && 'Approved'}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E0A106]"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-500 text-lg">No reviews found</p>
          </div>
        ) : (
          <>
            <div className="space-y-5">
              {paginatedReviews.map((review) => (
                <div
                  key={review.review_id}
                  className={`bg-white rounded-2xl border p-6 shadow-sm ${
                    review.is_approved ? 'border-[#BCE8C8]' : 'border-[#E8D28E]'
                  }`}
                >
                  {/* Header */}
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-5">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0">
                        {review.pet?.photo ? (
                          <img
                            src={review.pet.photo}
                            alt={review.pet.name}
                            className="w-14 h-14 rounded-xl object-cover border border-gray-200"
                          />
                        ) : review.user?.profile_picture ? (
                          <img
                            src={review.user.profile_picture}
                            alt={`${review.user.first_name} ${review.user.last_name}`}
                            className="w-14 h-14 rounded-xl object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-[#F3E8C4] text-[#0f172a] font-bold flex items-center justify-center">
                            {getInitials(review.user?.first_name, review.user?.last_name)}
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="text-[30px] leading-none font-bold text-[#1f2937] mb-2">
                          {review.user?.first_name} {review.user?.last_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Pet: {review.pet?.name || '-'} • Service:{' '}
                          {review.booking?.service_type || review.service_type}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">{formatDate(review.created_at)}</p>
                      </div>
                    </div>

                    <div className="lg:text-right">
                      <div className="flex lg:justify-end items-center gap-2 mb-3">
                        <span className="text-[18px] font-bold text-[#E0A106]">
                          {review.rating.toFixed(1)}
                        </span>
                        <StarDisplay rating={review.rating} size="text-lg" />
                      </div>

                      <div className="flex lg:justify-end gap-2 flex-wrap">
                        {review.is_featured && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#EEE4FF] text-[#7C3AED]">
                            Featured
                          </span>
                        )}
                        {review.is_approved && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#DDF8E6] text-[#16A34A]">
                            Approved
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ratings grid */}
                  <div className="bg-[#f8f8f8] rounded-2xl p-5 grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-5 mb-5">
                    <div className="space-y-4">
                      <InfoRating label="Service Quality" rating={review.rating} />
                      <InfoRating label="Value" rating={review.rating} />
                    </div>
                    <div className="space-y-4">
                      <InfoRating label="Staff" rating={review.rating} />
                      <InfoRating label="Communication" rating={review.rating} />
                    </div>
                    <div className="space-y-4">
                      <InfoRating label="Cleanliness" rating={review.rating} />
                      <InfoRating label="Pet Condition" rating={review.rating} />
                    </div>
                  </div>

                  {/* Comment */}
                  {review.comment && (
                    <div className="mb-5">
                      <p className="text-[28px] italic text-[#475569] leading-relaxed">
                        "{review.comment}"
                      </p>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-4">
                    {review.is_approved ? (
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => handleFeature(review.review_id, review.is_featured)}
                          disabled={processing === review.review_id}
                          className="px-5 py-2.5 rounded-xl font-semibold transition disabled:opacity-50 bg-[#475569] hover:bg-[#334155] text-white"
                        >
                          {review.is_featured ? 'Remove from Featured' : 'Feature'}
                        </button>
                        <button
                          onClick={() => handleReject(review.review_id)}
                          disabled={processing === review.review_id}
                          className="px-5 py-2.5 rounded-xl font-semibold transition disabled:opacity-50 bg-red-600 hover:bg-red-700 text-white"
                        >
                          Unapprove
                        </button>
                      </div>
                    ) : (
                      <>
                        <textarea
                          value={rejectionReasons[review.review_id] || ''}
                          onChange={(e) =>
                            setRejectionReasons((prev) => ({
                              ...prev,
                              [review.review_id]: e.target.value,
                            }))
                          }
                          placeholder="Rejection reason (optional)..."
                          className="w-full mb-3 p-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#E0A106] focus:outline-none"
                          rows={2}
                        />
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => handleApprove(review.review_id)}
                            disabled={processing === review.review_id}
                            className="px-5 py-2.5 rounded-xl font-semibold transition disabled:opacity-50 bg-[#16A34A] hover:bg-[#15803d] text-white"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleReject(review.review_id)}
                            disabled={processing === review.review_id}
                            className="px-5 py-2.5 rounded-xl font-semibold transition disabled:opacity-50 bg-red-600 hover:bg-red-700 text-white"
                          >
                            ✕ Reject
                          </button>
                          <button
                            onClick={() => handleDelete(review.review_id)}
                            disabled={processing === review.review_id}
                            className="px-5 py-2.5 rounded-xl font-semibold transition disabled:opacity-50 bg-gray-200 hover:bg-gray-300 text-gray-800"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  Previous
                </button>
                <span className="text-gray-700 font-semibold">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewManagement;