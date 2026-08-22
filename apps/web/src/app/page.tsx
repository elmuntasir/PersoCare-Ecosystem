import Image from "next/image";
import Link from "next/link";
import { PulseLine } from "@/components/PulseLine";

const features = [
  {
    label: "Health Tracking",
    desc: "Vitals, medications, and progress in one running history — not scattered across notebooks and old prescriptions.",
    icon: IconHeartPulse,
  },
  {
    label: "Appointment Management",
    desc: "Book a serial, see your estimated time adjust live as the day runs — no standing in line to find out you're behind.",
    icon: IconCalendar,
  },
  {
    label: "Nutrition Tracking",
    desc: "Log meals, calories, and macros in seconds, and see the pattern over weeks, not just one day.",
    icon: IconUtensils,
  },
  {
    label: "Exercise Logging",
    desc: "Record workouts, sets, and reps — track effort over time instead of guessing whether you're improving.",
    icon: IconActivity,
  },
  {
    label: "Medication Reminders",
    desc: "Never miss a dose. Adherence is tracked automatically and shown to your provider at your next visit.",
    icon: IconPill,
  },
  {
    label: "Doctor Connect",
    desc: "Message your care team directly through the platform — no separate portal, no phone tag.",
    icon: IconStethoscope,
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--paper)]">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 md:px-12 py-6 max-w-6xl mx-auto">
        <span className="font-display text-xl text-[var(--teal-900)]">PersoCare</span>
        <nav className="flex items-center gap-6">
          <a
            href="#features"
            className="hidden sm:inline text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--teal-900)] transition-colors"
          >
            Features
          </a>
          <Link
            href="/login"
            className="text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--teal-900)] transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium bg-[var(--teal-900)] text-white px-4 py-2 rounded-full hover:bg-[var(--teal-700)] transition-colors"
          >
            Create account
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 pt-12 md:pt-20 pb-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="font-display text-4xl md:text-6xl leading-[1.05] text-[var(--teal-900)]">
            One record. Every visit,
            <br />
            every provider, connected.
          </h1>
          <p className="mt-6 text-lg text-[var(--ink-soft)] max-w-xl">
            Hospitals, clinics, and pharmacies on one platform — your history follows you,
            not the other way around.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/register"
              className="bg-[var(--coral)] text-white px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
            >
              Get started
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 rounded-full font-medium border border-[var(--sage-200)] text-[var(--teal-900)] hover:bg-[var(--sage-200)] transition-colors"
            >
              I already have an account
            </Link>
          </div>

          <div className="mt-12 h-16">
            <PulseLine className="w-full h-full" />
          </div>
        </div>

        {/* Real product screenshots, lightly staggered */}
        <div className="relative h-80 md:h-[420px]">
          <div className="absolute top-0 right-4 w-48 md:w-56 rounded-2xl overflow-hidden shadow-xl border border-[var(--sage-200)] rotate-3 bg-white">
            <Image
              src="/images/food-entry1.png"
              alt="Meal logging screen in PersoCare"
              width={500}
              height={500}
              className="w-full h-auto"
            />
          </div>
          <div className="absolute bottom-0 left-0 w-48 md:w-56 rounded-2xl overflow-hidden shadow-xl border border-[var(--sage-200)] -rotate-6 bg-white">
            <Image
              src="/images/steps1.png"
              alt="Daily step tracking screen in PersoCare"
              width={500}
              height={500}
              className="w-full h-auto"
            />
          </div>
          <div className="absolute top-16 left-8 w-40 md:w-48 rounded-2xl overflow-hidden shadow-xl border border-[var(--sage-200)] rotate-[-2deg] bg-white hidden sm:block">
            <Image
              src="/images/medicine-entry1.png"
              alt="Medication tracking screen in PersoCare"
              width={500}
              height={500}
              className="w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-16 border-t border-[var(--sage-200)]" id="features">
        <div className="mb-12 max-w-xl">
          <p className="font-mono text-sm text-[var(--coral)] mb-2">Features</p>
          <h2 className="font-display text-3xl text-[var(--teal-900)]">
            Everything you need to manage your health, in one place
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {features.map(({ label, desc, icon: Icon }) => (
            <div key={label}>
              <div className="w-10 h-10 mb-4 text-[var(--coral)]">
                <Icon />
              </div>
              <h3 className="font-display text-lg mb-2 text-[var(--teal-900)]">{label}</h3>
              <p className="text-[var(--ink-soft)] text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Grounded platform capabilities */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-16 border-t border-[var(--sage-200)]">
        <div className="grid md:grid-cols-3 gap-10">
          <div>
            <p className="font-mono text-sm text-[var(--coral)] mb-2">Booking</p>
            <h3 className="font-display text-xl mb-2">A real queue, not a guess</h3>
            <p className="text-[var(--ink-soft)] text-sm leading-relaxed">
              Book a serial, see your estimated time adjust live as the day runs — no
              standing in line to find out you&apos;re behind.
            </p>
          </div>
          <div>
            <p className="font-mono text-sm text-[var(--coral)] mb-2">Records</p>
            <h3 className="font-display text-xl mb-2">History that travels with you</h3>
            <p className="text-[var(--ink-soft)] text-sm leading-relaxed">
              See a specialist at one clinic, fill a prescription at another — your record
              moves with you, not locked to one building.
            </p>
          </div>
          <div>
            <p className="font-mono text-sm text-[var(--coral)] mb-2">Insight</p>
            <h3 className="font-display text-xl mb-2">Risk screening, explained</h3>
            <p className="text-[var(--ink-soft)] text-sm leading-relaxed">
              A routine panel of measurements — no imaging required — flags metabolic risk
              early, with the reasoning shown, not hidden.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-20 border-t border-[var(--sage-200)] text-center">
        <h2 className="font-display text-3xl md:text-4xl text-[var(--teal-900)] max-w-xl mx-auto">
          Ready to take control of your health?
        </h2>
        <p className="mt-4 text-[var(--ink-soft)]">
          Create your account in under a minute — no paperwork.
        </p>
        <Link
          href="/register"
          className="inline-block mt-8 bg-[var(--coral)] text-white px-8 py-3.5 rounded-full font-medium hover:opacity-90 transition-opacity"
        >
          Create your free account
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--sage-200)]">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-12 grid sm:grid-cols-2 md:grid-cols-4 gap-10">
          <div>
            <span className="font-display text-lg text-[var(--teal-900)]">PersoCare</span>
            <p className="mt-3 text-sm text-[var(--ink-soft)] max-w-xs">
              Your personal health companion for tracking and managing every part of your
              care.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[var(--teal-900)] mb-3">Quick links</h4>
            <ul className="space-y-2 text-sm text-[var(--ink-soft)]">
              <li>
                <a href="#features" className="hover:text-[var(--teal-900)]">Features</a>
              </li>
              <li>
                <Link href="/login" className="hover:text-[var(--teal-900)]">Login</Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-[var(--teal-900)]">Register</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[var(--teal-900)] mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-[var(--ink-soft)]">
              <li><a href="#" className="hover:text-[var(--teal-900)]">Help center</a></li>
              <li><a href="#" className="hover:text-[var(--teal-900)]">Privacy policy</a></li>
              <li><a href="#" className="hover:text-[var(--teal-900)]">Terms of service</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[var(--teal-900)] mb-3">Contact</h4>
            <ul className="space-y-2 text-sm text-[var(--ink-soft)]">
              <li>info@persocare.com</li>
            </ul>
          </div>
        </div>
        <div className="text-center text-xs text-[var(--ink-soft)] pb-8">
          © {new Date().getFullYear()} PersoCare. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

/* Inline icon set — kept minimal and single-weight to match the rest of the
   design system rather than pulling in an icon library dependency. */

function IconHeartPulse() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
      <path d="M3.5 12h4l1.5-3 2 5 1.5-3h8" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="M8 15h2M12 15h2M16 15h0" />
    </svg>
  );
}
function IconUtensils() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3v7a2 2 0 0 0 2 2v9M5 3v6M9 3v6M17 3c-1.5 1.5-2 3-2 5s.5 3.5 2 5v8" />
    </svg>
  );
}
function IconActivity() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 8-4-16-3 8H2" />
    </svg>
  );
}
function IconPill() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="8" width="17" height="8" rx="4" transform="rotate(-45 12 12)" />
      <path d="M8.5 8.5 15.5 15.5" />
    </svg>
  );
}
function IconStethoscope() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3v6a4 4 0 0 0 8 0V3M9 13v2a5 5 0 0 0 10 0v-2" />
      <circle cx="19" cy="10" r="2" />
    </svg>
  );
}
