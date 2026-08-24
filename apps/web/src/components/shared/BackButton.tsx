'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
  /** If provided, navigates to this href instead of router.back() */
  fallbackHref?: string
  /** Button label text — pass an empty string to show icon only */
  label?: string
  className?: string
}

export function BackButton({
  fallbackHref,
  label = 'Back',
  className = '',
}: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (fallbackHref) {
      router.push(fallbackHref)
    } else {
      router.back()
    }
  }

  return (
    <button
      onClick={handleClick}
      type="button"
      className={`inline-flex items-center gap-1.5 text-sm font-body text-[var(--teal-900)] hover:text-[var(--teal-700)] transition-colors duration-150 ${className}`}
      aria-label="Go back"
    >
      <ArrowLeft className="w-4 h-4 shrink-0" strokeWidth={2} />
      {label && <span>{label}</span>}
    </button>
  )
}
