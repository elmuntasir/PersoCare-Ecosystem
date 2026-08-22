"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { resolveIdentifierToEmail } from "./actions";

const CAROUSEL_IMAGES = [
  "/images/login-img1.jpg",
  "/images/login-img2.jpg",
  "/images/login-img3.jpg",
  "/images/login-img4.jpg",
];

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveSlide((i) => (i + 1) % CAROUSEL_IMAGES.length);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const resolvedEmail = await resolveIdentifierToEmail(email);
      if (!resolvedEmail) {
        setError(
          "We couldn’t find an account for that username. Please use the exact email you registered with or complete email verification first."
        );
        return;
      }

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password,
      });
      if (signInError) {
        const normalized = signInError.message.toLowerCase();
        if (normalized.includes("invalid login credentials") || normalized.includes("user not found")) {
          setError(
            "Invalid login credentials. If you just registered, check your email and confirm the verification link before signing in."
          );
          return;
        }
        setError(signInError.message || "Couldn't sign you in. Check your details and try again.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Couldn't sign you in. Check your details and try again.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex bg-[#f5f8f9]">
      {/* Visual side — image carousel */}
      <div className="hidden md:block flex-1 relative overflow-hidden bg-[var(--teal-900)]">
        {CAROUSEL_IMAGES.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt=""
            fill
            priority={i === 0}
            className="object-cover transition-opacity duration-1000"
            style={{ opacity: i === activeSlide ? 1 : 0 }}
          />
        ))}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Form side */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[420px]">
          <div className="text-center mb-8">
            <h1 className="text-[38px] font-bold text-[#334756] tracking-tight mb-2">
              PersoCare
            </h1>
            <p className="text-[#64748b] text-[15px] font-medium">
              Welcome back to Modern Healthcare
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-[13px] font-semibold text-[#475569] mb-1.5"
              >
                Username or Email
              </label>
              <input
                id="email"
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#cbd5e1] bg-white text-[#1e293b] placeholder-[#94a3b8] focus:border-[#334756] outline-none transition-all text-sm shadow-sm"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-[13px] font-semibold text-[#475569] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-[#cbd5e1] bg-white text-[#1e293b] focus:border-[#334756] outline-none transition-all text-sm shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#334756] transition-colors p-1"
                >
                  {showPassword ? (
                    <EyeOffIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <Link
                  href="/forgot-password"
                  className="text-[13px] font-medium text-[#475569] hover:text-[#1e293b] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-sm text-[var(--coral)]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#3d5265] text-white py-3 rounded-xl font-medium hover:bg-[#2c3d4c] transition-colors disabled:opacity-60 text-sm shadow-sm mt-4"
            >
              {isSubmitting ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#475569]">
            New to PersoCare?{" "}
            <Link
              href="/register"
              className="text-[#334756] font-semibold hover:underline"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}


