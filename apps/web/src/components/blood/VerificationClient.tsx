'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { verifyDonor } from '@/actions/blood/donor'
import { User, CheckCircle2, XCircle, Clock, Building, Phone, Mail, ShieldAlert } from 'lucide-react'

interface VerificationClientProps {
  initialRequests: any[]
}

export function VerificationClient({ initialRequests }: VerificationClientProps) {
  const router = useRouter()
  const [requests, setRequests] = useState(initialRequests)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleVerify = async (id: string, approve: boolean) => {
    const notes = prompt(
      approve
        ? 'Add any clinical verification notes (optional):'
        : 'Enter reason for rejection (required):'
    )
    if (notes === null) return // cancelled
    if (!approve && !notes.trim()) {
      alert('A rejection reason is required.')
      return
    }

    setLoading(id)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('verificationId', id)
      fd.append('approve', String(approve))
      if (notes) fd.append('notes', notes)

      await verifyDonor(fd)
      setRequests((prev) => prev.filter((r) => r.id !== id))
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to update verification status')
    } finally {
      setLoading(null)
    }
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-[var(--sage-200)] p-12 text-center max-w-lg mx-auto shadow-xs">
        <CheckCircle2 className="w-14 h-14 mx-auto text-emerald-500 mb-3" strokeWidth={1.5} />
        <h3 className="font-display text-xl text-[var(--teal-900)] mb-1">All Caught Up!</h3>
        <p className="font-body text-xs text-[var(--ink-soft)] leading-relaxed">
          There are no pending blood donor verification requests for your organization at this time.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 font-body">
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {requests.map((req) => (
        <div
          key={req.id}
          className="bg-white rounded-2xl border border-[var(--sage-200)] p-5 md:p-6 shadow-xs hover:border-[var(--teal-700)]/40 transition-all"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[var(--sage-200)] flex items-center justify-center text-[var(--teal-900)] font-bold text-sm">
                  <User className="w-4 h-4" strokeWidth={2} />
                </div>
                <div>
                  <h4 className="font-semibold text-base text-[var(--ink)] leading-tight">
                    {req.donor?.name || 'Prospective Donor'}
                  </h4>
                  <span className="text-xs text-[var(--ink-soft)] font-mono">{req.donor?.email}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-[var(--ink-soft)] pt-2 border-t border-[var(--sage-200)]/60">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[var(--teal-700)]" />
                  <span>Phone: <strong className="text-[var(--ink)]">{req.donor?.phone || 'Not provided'}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-[var(--teal-700)]" />
                  <span>Org: <strong className="text-[var(--ink)]">{req.organization?.name}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5 text-[var(--teal-700)]" />
                  <span>Requested: {new Date(req.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-center">
              <button
                onClick={() => handleVerify(req.id, true)}
                disabled={loading === req.id}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                {loading === req.id ? 'Processing...' : 'Approve Donor'}
              </button>
              <button
                onClick={() => handleVerify(req.id, false)}
                disabled={loading === req.id}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
