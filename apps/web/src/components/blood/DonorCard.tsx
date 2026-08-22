'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { requestContactShare } from '@/actions/blood/contact'
import { MapPin, User, Calendar, ShieldCheck, Mail, Phone, HeartHandshake } from 'lucide-react'

interface DonorCardProps {
  donor: any
}

export function DonorCard({ donor }: DonorCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [requested, setRequested] = useState(false)

  const handleRequestContact = async () => {
    if (!confirm('Request contact info from this donor? The donor will be notified to review and share details.')) return
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('donorProfileId', donor.id)
      fd.append('fieldsRequested', JSON.stringify(['phone', 'email', 'district']))
      await requestContactShare(fd)
      setRequested(true)
      alert('Contact request sent! The donor will be notified.')
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
      <div className="flex items-start gap-3.5 mb-4">
        <div className="w-11 h-11 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 text-rose-600 font-bold text-base">
          {donor.bloodType?.replace('_', '')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base text-[var(--ink)] truncate">
              {donor.user?.name || 'Verified Donor'}
            </h3>
            {donor.isVerified && (
              <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-mono border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Verified
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[var(--ink-soft)] font-body">
            {donor.district && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[var(--teal-700)]" strokeWidth={1.8} />
                {donor.district}
              </span>
            )}
            {donor.lastDonationDate && (
              <span className="flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5 text-[var(--teal-700)]" strokeWidth={1.8} />
                Last: {new Date(donor.lastDonationDate).toLocaleDateString()}
              </span>
            )}
          </div>

          {donor.medicalConditions && (
            <p className="text-xs text-[var(--ink-soft)] mt-2 italic bg-[var(--paper)] p-2 rounded-lg border border-[var(--sage-200)]/60">
              Note: {donor.medicalConditions}
            </p>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-[var(--sage-200)]/60 flex items-center justify-between">
        <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
          Available to donate
        </span>

        {requested ? (
          <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            Request Sent
          </span>
        ) : (
          <button
            onClick={handleRequestContact}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--teal-900)] text-white hover:bg-[var(--teal-700)] text-xs font-semibold shadow-xs disabled:opacity-60 transition-all"
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            {loading ? 'Requesting...' : 'Request Contact'}
          </button>
        )}
      </div>
    </div>
  )
}
