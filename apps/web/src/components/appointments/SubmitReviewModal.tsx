"use client";

import { useState } from "react";
import { X, Star, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { submitReview } from "@/actions/appointments/submitReview";

interface SubmitReviewModalProps {
  organizationId: string;
  organizationName: string;
  doctorId: string;
  doctorName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function SubmitReviewModal({
  organizationId,
  organizationName,
  doctorId,
  doctorName,
  onClose,
  onSuccess,
}: SubmitReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const ratingDescriptions = [
    "",
    "Poor - Needs major improvement",
    "Fair - Below expectations",
    "Good - Satisfactory care",
    "Very Good - Recommended",
    "Excellent - Outstanding healthcare experience",
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError("Please select a valid rating between 1 and 5 stars");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("organizationId", organizationId);
      formData.append("subjectId", doctorId);
      formData.append("rating", String(rating));
      formData.append("comment", comment);

      const res = await submitReview(formData);
      if (res.success) {
        setIsSuccess(true);
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit review. You must have a completed visit to review.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-[var(--sage-200)] relative animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-[var(--sage-200)]/60 text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" strokeWidth={1.8} />
        </button>

        {isSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="font-display text-2xl font-bold text-[var(--teal-900)]">
              Thank You for Your Feedback!
            </h3>

            <p className="text-sm font-body text-[var(--ink-soft)] max-w-sm mx-auto">
              Your verified review for <strong className="text-[var(--ink)]">Dr. {doctorName}</strong> at{" "}
              <strong className="text-[var(--ink)]">{organizationName}</strong> has been recorded and will help other patients.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-full bg-[var(--teal-900)] text-white hover:bg-[var(--teal-700)] font-body font-semibold text-sm transition-colors shadow-xs"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-[var(--coral)] font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Patient Review</span>
              </p>
              <h3 className="font-display text-2xl font-bold text-[var(--teal-900)] mt-0.5">
                Share Your Experience
              </h3>
              <p className="text-xs font-body text-[var(--ink-soft)] mt-1">
                Reviewing Dr. <strong className="text-[var(--ink)]">{doctorName}</strong> at{" "}
                <strong className="text-[var(--ink)]">{organizationName}</strong>
              </p>
            </div>

            {/* Interactive Stars Picker */}
            <div className="text-center py-3 bg-[var(--paper)] rounded-2xl border border-[var(--sage-200)] space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)]">
                Overall Rating
              </label>

              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((starValue) => {
                  const isFilled = (hoverRating || rating) >= starValue;
                  return (
                    <button
                      key={starValue}
                      type="button"
                      onClick={() => setRating(starValue)}
                      onMouseEnter={() => setHoverRating(starValue)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 text-2xl focus:outline-hidden transition-transform hover:scale-110"
                      aria-label={`${starValue} stars`}
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          isFilled ? "fill-amber-400 text-amber-400" : "text-gray-300 stroke-1"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <p className="text-xs font-body font-medium text-[var(--teal-900)]">
                {ratingDescriptions[hoverRating || rating]}
              </p>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)] font-medium mb-1.5">
                Written Review (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe the doctor's care, waiting time, diagnosis clarity, or facility cleanliness..."
                rows={3}
                className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)] px-4 py-2.5 font-body text-sm text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)] resize-none"
              />
            </div>

            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-body">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-full border border-[var(--sage-200)] text-[var(--ink-soft)] hover:bg-[var(--sage-200)]/60 text-sm font-body font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-full bg-[var(--coral)] text-white hover:bg-[var(--coral)]/90 font-body font-semibold text-sm transition-colors shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? "Submitting Review..." : "Post Verified Review"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
