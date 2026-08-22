"use client";

import { useState } from "react";
import {
  Star,
  StarHalf,
  MessageSquare,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { SubmitReview } from "./SubmitReview";

export type DisplayReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  verified?: boolean;
  authorName?: string;
  secondaryName?: string;
  author?: {
    name: string;
  };
  subject?: {
    name: string;
  };
};

interface ReviewSectionProps {
  organizationId?: string;
  title?: string;
  avgRating: number;
  ratingDistribution?: number[];
  reviewCount?: number;
  reviews: any[];
  canReview?: boolean;
  onReviewSubmitted?: () => void;
  onOpenReviewModal?: () => void;
  reviewPrompt?: string;
}

export function ReviewSection({
  organizationId,
  title,
  avgRating,
  ratingDistribution,
  reviewCount,
  reviews,
  canReview = false,
  onReviewSubmitted,
  onOpenReviewModal,
  reviewPrompt = "Completed a prescription visit? Share your feedback with other patients.",
}: ReviewSectionProps) {
  const [showSubmit, setShowSubmit] = useState(false);

  const effectiveCount = reviewCount !== undefined ? reviewCount : reviews.length;

  // Compute distribution if not provided directly
  const distribution =
    ratingDistribution && ratingDistribution.length === 5
      ? [5, 4, 3, 2, 1].map((star) => {
          const count = ratingDistribution[star - 1] || 0;
          const percentage = effectiveCount > 0 ? (count / effectiveCount) * 100 : 0;
          return { star, count, percentage };
        })
      : [5, 4, 3, 2, 1].map((star) => {
          const count = reviews.filter((r) => r.rating === star).length;
          const percentage = effectiveCount > 0 ? (count / effectiveCount) * 100 : 0;
          return { star, count, percentage };
        });

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: full }).map((_, i) => (
          <Star
            key={`full-${i}`}
            className="w-4 h-4 fill-[var(--coral)] text-[var(--coral)]"
            strokeWidth={1.6}
          />
        ))}
        {half && (
          <StarHalf
            className="w-4 h-4 fill-[var(--coral)] text-[var(--coral)]"
            strokeWidth={1.6}
          />
        )}
        {Array.from({ length: empty }).map((_, i) => (
          <Star
            key={`empty-${i}`}
            className="w-4 h-4 text-[var(--sage-200)]"
            strokeWidth={1.6}
          />
        ))}
      </div>
    );
  };

  const handleWriteReviewClick = () => {
    if (organizationId) {
      setShowSubmit(true);
    } else if (onOpenReviewModal) {
      onOpenReviewModal();
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-[var(--teal-900)]" strokeWidth={1.6} />
          <h2 className="font-display text-xl text-[var(--teal-900)]">
            {title || (organizationId ? "Patient Reviews" : "Patient Reviews & Ratings")}
          </h2>
          <span className="text-sm text-[var(--ink-soft)] font-body">
            ({effectiveCount} reviews)
          </span>
        </div>
        {canReview && !showSubmit && (
          <button
            type="button"
            onClick={handleWriteReviewClick}
            className="px-4 py-2 rounded-full bg-[var(--coral)] text-white hover:opacity-90 transition-opacity text-sm font-body font-medium"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Overall Rating & Distribution */}
      <div className="flex flex-wrap gap-6 mb-6 p-4 bg-[var(--paper)] rounded-xl border border-[var(--sage-200)] items-center">
        <div className="text-center min-w-[140px]">
          <div className="font-display text-3xl font-bold text-[var(--teal-900)]">
            {avgRating.toFixed(1)}
          </div>
          <div className="flex justify-center mt-1">{renderStars(avgRating)}</div>
          <div className="text-xs text-[var(--ink-soft)] mt-1 font-body">
            Based on {effectiveCount} verified review{effectiveCount !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="flex-1 min-w-[200px] space-y-1.5">
          {distribution.map(({ star, count, percentage }) => (
            <div key={star} className="flex items-center gap-2 text-xs font-body">
              <span className="w-8 text-right font-body text-[var(--ink-soft)]">{star} ★</span>
              <div className="flex-1 h-2 bg-[var(--sage-200)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--coral)] rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-8 text-left font-body text-[var(--ink-soft)]">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notice if cannot review */}
      {!canReview && !showSubmit && (
        <div className="mb-4 p-3 rounded-xl bg-[var(--paper)] border border-[var(--sage-200)] text-xs text-[var(--ink-soft)] font-body">
          {reviewPrompt}
        </div>
      )}

      {/* Submit Review Inline Form */}
      {showSubmit && organizationId && (
        <SubmitReview
          organizationId={organizationId}
          onSuccess={() => {
            setShowSubmit(false);
            if (onReviewSubmitted) onReviewSubmitted();
          }}
          onCancel={() => setShowSubmit(false)}
        />
      )}

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-4 mt-4 divide-y divide-[var(--sage-200)]">
          {reviews.map((review) => {
            const authorName = review.authorName || review.author?.name || "Patient";
            const secondaryName = review.secondaryName || review.subject?.name || review.organizationName;
            const createdAtDate = review.createdAt ? new Date(review.createdAt) : new Date();

            return (
              <div key={review.id} className="pt-4 first:pt-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-full bg-[var(--sage-200)]">
                        <User className="w-3.5 h-3.5 text-[var(--ink-soft)]" strokeWidth={1.6} />
                      </div>
                      <span className="font-body font-medium text-[var(--ink)] text-sm">
                        {authorName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {renderStars(review.rating)}
                      <span className="text-xs text-[var(--ink-soft)] font-body">
                        {format(createdAtDate, "MMM dd, yyyy")}
                      </span>
                    </div>
                  </div>
                  {secondaryName && (
                    <span className="text-xs text-[var(--ink-soft)] font-body">
                      Dr. {secondaryName.replace(/^Dr\.\s*/i, "")}
                    </span>
                  )}
                </div>
                {review.comment && (
                  <p className="mt-2 text-sm text-[var(--ink)] font-body border-l-2 border-[var(--sage-200)] pl-3">
                    {review.comment}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="font-body text-[var(--ink-soft)] text-center py-4">
          No patient reviews published yet. Be the first to share your experience after your consultation!
        </p>
      )}
    </div>
  );
}
