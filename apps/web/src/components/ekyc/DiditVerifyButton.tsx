"use client";

import { useState } from "react";
import { DiditSdk } from "@didit-protocol/sdk-web";
import { useRouter } from "next/navigation";

export function DiditVerifyButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startVerification = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/verify", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start verification");

      DiditSdk.shared.onComplete = (result) => {
        console.log("Verification flow completed:", result);
        setLoading(false);
        router.refresh();
      };

      DiditSdk.shared.startVerification({ url: data.url });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-rose-700 text-sm mb-3">
          {error}
        </div>
      )}
      <button
        type="button"
        onClick={startVerification}
        disabled={loading}
        className="px-6 py-3 rounded-full bg-[var(--coral)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer"
      >
        {loading ? "Starting..." : "Verify Identity with NID"}
      </button>
      <p className="text-xs text-[var(--ink-soft)] mt-2">
        You will be redirected to Didit to take a selfie and capture your NID card.
      </p>
    </div>
  );
}
