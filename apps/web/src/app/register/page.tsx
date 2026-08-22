"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { createPatientAccount, type SignupRole } from "./actions";
import { SIGNUP_ROLES } from "./constants";

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

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    address: "",
    role: "" as SignupRole | "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeCanContinue, setNoticeCanContinue] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveSlide((i) => (i + 1) % CAROUSEL_IMAGES.length);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!form.role) {
      setError("Please select the role that describes you.");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            name: form.name.trim(),
            phone: form.phone.trim(),
            username: form.username.trim(),
            role: form.role,
            address: form.address,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (!data.user) {
        setError("Couldn't create your account. Please try again.");
        return;
      }

      const profileResult = await createPatientAccount({
        authId: data.user.id,
        name: form.name,
        email: form.email,
        username: form.username,
        phone: form.phone,
        dob: form.dob,
        gender: form.gender,
        role: form.role,
      });

      if (!profileResult.ok) {
        setError(profileResult.error);
        return;
      }

      if (!data.session) {
        setNoticeCanContinue(false);
        setNotice(
          profileResult.pendingVerification
            ? "Account created — check your email to confirm your address. Your professional role is now pending review; you can sign in as a patient in the meantime."
            : "Account created — check your email to confirm your address before signing in."
        );
        return;
      }

      if (profileResult.pendingVerification) {
        setNoticeCanContinue(true);
        setNotice(
          "Account created. Your professional role is pending review — you're signed in as a patient for now and we'll notify you once it's verified."
        );
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Couldn't create your account. Please try again.");
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
      <div className="flex-1 flex items-center justify-center px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-[480px] my-auto">
          <div className="mb-6">
            <h1 className="text-[32px] font-bold text-[#334756] tracking-tight mb-2">
              Register to PersoCare
            </h1>
            <p className="text-[#64748b] text-[14px] leading-relaxed font-medium">
              Create your account to begin managing your personal health journey.
            </p>
          </div>

          {notice ? (
            <div className="rounded-xl border border-[#cbd5e1] bg-white p-5 text-sm text-[#334756] shadow-sm">
              <p>{notice}</p>
              {noticeCanContinue && (
                <Link
                  href="/dashboard"
                  className="mt-3 inline-block font-semibold text-[#334756] hover:underline"
                >
                  Continue to dashboard →
                </Link>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Full Name" id="name">
                <input
                  id="name"
                  required
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  className={inputClass}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Field label="Email" id="email">
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Phone" id="phone">
                  <input
                    id="phone"
                    required
                    placeholder="Enter your phone number"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Field label="Date of Birth" id="dob">
                  <div className="relative">
                    <input
                      id="dob"
                      type="date"
                      required
                      value={form.dob}
                      onChange={(e) => update("dob", e.target.value)}
                      className={`${inputClass} pr-10 text-[#64748b] focus:text-[#1e293b] [&::-webkit-calendar-picker-indicator]:opacity-0`}
                    />
                    <CalendarIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b] pointer-events-none" />
                  </div>
                </Field>
                <Field label="Gender" id="gender">
                  <div className="relative">
                    <select
                      id="gender"
                      required
                      value={form.gender}
                      onChange={(e) => update("gender", e.target.value)}
                      className={`${inputClass} appearance-none pr-10 ${
                        !form.gender ? "text-[#94a3b8]" : "text-[#1e293b]"
                      }`}
                    >
                      <option value="" disabled hidden>
                        Select
                      </option>
                      <option value="Female" className="text-[#1e293b]">
                        Female
                      </option>
                      <option value="Male" className="text-[#1e293b]">
                        Male
                      </option>
                      <option value="Other" className="text-[#1e293b]">
                        Other
                      </option>
                    </select>
                    <ChevronDownIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b] pointer-events-none" />
                  </div>
                </Field>
              </div>

              <Field label="Address" id="address">
                <input
                  id="address"
                  placeholder="Enter your address"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  className={inputClass}
                />
              </Field>

              <hr className="border-t border-[#e2e8f0] my-2" />

              <Field label="What role describes you the best?" id="role">
                <div className="relative">
                  <select
                    id="role"
                    required
                    value={form.role}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        role: e.target.value as SignupRole,
                      }))
                    }
                    className={`${inputClass} appearance-none pr-10 ${
                      !form.role ? "text-[#94a3b8]" : "text-[#1e293b]"
                    }`}
                  >
                    <option value="" disabled hidden>
                      Select
                    </option>
                    {SIGNUP_ROLES.map((r) => (
                      <option
                        key={r.value}
                        value={r.value}
                        className="text-[#1e293b]"
                      >
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b] pointer-events-none" />
                </div>
                {(form.role === "doctor" ||
                  form.role === "nutritionist" ||
                  form.role === "trainer") && (
                  <p className="mt-1.5 text-[11px] sm:text-xs text-[#64748b]">
                    Professional roles are reviewed before they're activated
                    — you can use your account right away as a patient while
                    that's verified.
                  </p>
                )}
                {(form.role === "family_member" ||
                  form.role === "caregiver") && (
                  <p className="mt-1.5 text-[11px] sm:text-xs text-[#64748b]">
                    You'll be able to link to the person you're caring for
                    from your dashboard once your account is set up.
                  </p>
                )}
              </Field>

              <Field label="Username" id="username">
                <input
                  id="username"
                  placeholder="Choose a username"
                  value={form.username}
                  onChange={(e) => update("username", e.target.value)}
                  className={inputClass}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Field label="Password" id="password">
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Create a password"
                      value={form.password}
                      onChange={(e) => update("password", e.target.value)}
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#334756] transition-colors p-1"
                    >
                      {showPassword ? (
                        <EyeOffIcon className="w-4 h-4" />
                      ) : (
                        <EyeIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </Field>

                <Field label="Confirm Password" id="confirmPassword">
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="Confirm your password"
                      value={form.confirmPassword}
                      onChange={(e) => update("confirmPassword", e.target.value)}
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#334756] transition-colors p-1"
                    >
                      {showConfirmPassword ? (
                        <EyeOffIcon className="w-4 h-4" />
                      ) : (
                        <EyeIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </Field>
              </div>

              {error && (
                <p role="alert" className="text-sm text-[var(--coral)]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#3d5265] text-white py-3 rounded-xl font-medium hover:bg-[#2c3d4c] transition-colors disabled:opacity-60 text-sm shadow-sm mt-5"
              >
                {isSubmitting ? "Signing Up…" : "Sign Up"}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-xs sm:text-sm text-[#475569]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#334756] font-semibold hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

const inputClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-[#cbd5e1] bg-white text-[#1e293b] placeholder-[#94a3b8] focus:border-[#334756] outline-none transition-all text-xs sm:text-sm shadow-sm";

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[12px] sm:text-[13px] font-semibold text-[#475569] mb-1.5"
      >
        {label}
      </label>
      {children}
    </div>
  );
}


