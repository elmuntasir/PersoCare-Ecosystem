"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Star, X } from "lucide-react";
import { submitReview, getReviewableDoctors } from "@/actions/appointments/submitReview";

interface SubmitReviewProps {
  organizationId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SubmitReview({ organizationId, onSuccess, onCancel }: SubmitReviewProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Array<{ id: string; name: string; appointmentId: string }>>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");

  useEffect(() => {
    async function fetchDoctors() {
      try {
        const result = await getReviewableDoctors(organizationId);
        setDoctors(result);
        if (result.length > 0) {
          setSelectedDoctorId(result[0].id);
        }
      } catch (err) {
        setError("Failed to load reviewable doctors");
      }
    }
    fetchDoctors();
  }, [organizationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }
    if (!selectedDoctorId) {
      setError("Please select a doctor");
      return;
    }

    const selected = doctors.find((d) => d.id === selectedDoctorId);
    if (!selected) {
      setError("Invalid doctor selection");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("organizationId", organizationId);
      formData.append("subjectId", selectedDoctorId);
      formData.append("appointmentId", selected.appointmentId);
      formData.append("rating", String(rating));
      formData.append("comment", comment);

      await submitReview(formData);
      onSuccess();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (currentRating: number, hover: number) => {
    const value = hover || currentRating;
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i)}
            onMouseEnter={() => setHoverRating(i)}
            onMouseLeave={() => setHoverRating(0)}
            className="focus-visible:outline-2 focus-visible:outline-[var(--coral)] p-0.5"
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                i <= value
                  ? "fill-[var(--coral)] text-[var(--coral)]"
                  : "text-[var(--sage-200)] hover:text-[var(--ink-soft)]"
              }`}
              strokeWidth={1.6}
            />
          </button>
        ))}
      </div>
    );
  };

  if (doctors.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-700 text-sm font-body">
        You have no completed appointments to review at this time.
      </div>
    );
  }

  return (
    <div className="bg-[var(--paper)] rounded-xl border border-[var(--sage-200)] p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-body font-medium text-[var(--ink)]">Share Your Experience</h4>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 rounded-full hover:bg-[var(--sage-200)] transition-colors"
        >
          <X className="w-4 h-4 text-[var(--ink-soft)]" strokeWidth={1.6} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="font-body text-sm font-medium text-[var(--ink)] block mb-2">
            Your Rating *
          </label>
          {renderStars(rating, hoverRating)}
          <p className="text-xs text-[var(--ink-soft)] mt-1">
            {rating === 1 && "Poor"}
            {rating === 2 && "Fair"}
            {rating === 3 && "Good"}
            {rating === 4 && "Very Good"}
            {rating === 5 && "Excellent"}
          </p>
        </div>

        <div>
          <label className="font-body text-sm font-medium text-[var(--ink)] block mb-1">
            Which doctor did you see?
          </label>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="w-full rounded-xl border border-[var(--sage-200)] bg-white px-4 py-2.5 font-body text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)]"
            required
          >
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                Dr. {doc.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-body text-sm font-medium text-[var(--ink)] block mb-1">
            Your Comment
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What was your experience like? (optional)"
            rows={3}
            className="w-full rounded-xl border border-[var(--sage-200)] bg-white px-4 py-2.5 font-body text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--coral)] resize-none"
          />
        </div>

        {error && <p className="text-sm text-rose-600 font-body">{error}</p>}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-full border border-[var(--sage-200)] text-[var(--teal-900)] hover:bg-[var(--sage-200)] transition-colors font-medium text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-full bg-[var(--coral)] text-white hover:opacity-90 transition-opacity font-medium text-sm disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </form>
    </div>
  );
}
