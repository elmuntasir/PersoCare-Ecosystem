import type { ReactNode } from 'react'
import { PageAnimationShell } from '@/components/layout/PageAnimationShell'

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return (
    <PageAnimationShell className="min-h-screen w-full">{children}</PageAnimationShell>
  )
}
