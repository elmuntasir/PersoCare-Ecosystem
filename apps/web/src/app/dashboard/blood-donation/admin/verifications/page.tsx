import { getSessionUser } from '@/lib/auth'
import { getVerificationRequests } from '@/actions/blood/donor'
import { VerificationClient } from '@/components/blood/VerificationClient'
import { redirect } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'

export default async function VerificationPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  let requests: any[] = []
  try {
    requests = await getVerificationRequests()
  } catch {
    redirect('/dashboard/blood-donation')
  }

  return (
    <div className="py-8 px-4 md:px-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
          <ShieldCheck className="w-6 h-6" strokeWidth={1.8} />
        </div>
        <div>
          <h1 className="font-display text-3xl text-[var(--teal-900)]">Donor Verifications</h1>
          <p className="font-body text-xs md:text-sm text-[var(--ink-soft)]">
            Review and verify blood donor applications submitted to your healthcare organization.
          </p>
        </div>
      </div>

      <VerificationClient initialRequests={requests} />
    </div>
  )
}
