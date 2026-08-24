'use client'

import { usePathname } from 'next/navigation'
import { BackButton } from '@/components/shared/BackButton'

/** Routes where the back button should NOT appear */
const EXCLUDED_ROUTES = new Set(['/dashboard', '/login', '/register', '/forgot-password'])

export function HeaderBackButton() {
  const pathname = usePathname()

  if (EXCLUDED_ROUTES.has(pathname)) return null

  return (
    <BackButton
      label=""
      className="h-9 w-9 justify-center rounded-full border border-[var(--sage-200)] bg-white hover:bg-[var(--paper)] hover:text-[var(--teal-700)] transition-all duration-150"
    />
  )
}
