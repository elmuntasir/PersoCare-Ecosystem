'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { MapPin, Building, Clock, Heart, Phone, UserCheck, AlertTriangle } from 'lucide-react'
import { respondToApplication } from '@/actions/blood/request'

interface BloodRequestCardProps {
  request: any
  onApply: () => void
  currentUserId: string
}

export function BloodRequestCard({ request, onApply, currentUserId }: BloodRequestCardProps) {
  const router = useRouter()
  const [respondingId, setRespondingId] = useState<string | null>(null)

  const isRequester = request.requester?.id === currentUserId
  const hasApplied = request.applications?.some((a: any) => a.donorUserId === currentUserId)

  const urgencyConfig = {
    CRITICAL: {
      badge: 'bg-rose-500/10 text-rose-600 border border-rose-500/30',
      border: 'border-rose-200 hover:border-rose-300',
    },
    URGENT: {
      badge: 'bg-amber-500/10 text-amber-600 border border-amber-500/30',
      border: 'border-amber-200 hover:border-amber-300',
    },
    ROUTINE: {
      badge: 'bg-teal-500/10 text-teal-700 border border-teal-500/30',
      border: 'border-[var(--sage-200)] hover:border-teal-300',
    },
  }

  const urgency = (request.urgency as 'CRITICAL' | 'URGENT' | 'ROUTINE') || 'ROUTINE'
  const config = urgencyConfig[urgency] || urgencyConfig.ROUTINE

  const handleRespond = async (applicationId: string, accept: boolean) => {
    setRespondingId(applicationId)
    try {
      const fd = new FormData()
      fd.append('applicationId', applicationId)
      fd.append('accept', String(accept))
      await respondToApplication(fd)
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setRespondingId(null)
    }
  }

  return (
    <div className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between ${config.border}`}>
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold ${config.badge}`}>
              {request.urgency}
            </span>
            <span className="text-xs text-[var(--ink-soft)] font-mono">
              {format(new Date(request.createdAt), 'MMM dd, yyyy')}
            </span>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-mono font-bold border border-rose-200">
            {request.bloodTypeNeeded?.replace('_', '')}
          </span>
        </div>

        <h3 className="font-display text-xl text-[var(--teal-900)] mb-1">
          Need {request.bloodTypeNeeded?.replace('_', '')} • {request.unitsNeeded} unit{request.unitsNeeded > 1 ? 's' : ''}
        </h3>

        {request.patientName && (
          <p className="text-sm font-medium text-[var(--ink)] mb-1.5 font-body">
            Patient: {request.patientName} {request.patientAge ? `(${request.patientAge} yrs)` : ''}
            {request.patientGender ? `, ${request.patientGender}` : ''}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--ink-soft)] font-body mb-3">
          {request.district && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[var(--teal-700)]" strokeWidth={1.8} />
              {request.district}
            </span>
          )}
          {request.hospitalContext && (
            <span className="flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-[var(--teal-700)]" strokeWidth={1.8} />
              {request.hospitalContext}
            </span>
          )}
          {request.contactPhone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-[var(--coral)]" strokeWidth={1.8} />
              {request.contactPhone}
            </span>
          )}
        </div>

        {request.notes && (
          <p className="text-xs text-[var(--ink-soft)] font-body bg-[var(--paper)] p-3 rounded-xl border border-[var(--sage-200)]/60 mb-3">
            {request.notes}
          </p>
        )}
      </div>

      <div className="pt-3 border-t border-[var(--sage-200)]/60">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--ink-soft)]">
            Requested by: <strong className="text-[var(--ink)]">{request.requester?.name || 'Community Member'}</strong>
          </span>

          {!isRequester && !hasApplied && request.status === 'OPEN' && (
            <button
              onClick={onApply}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[var(--coral)] text-white hover:opacity-90 transition-opacity text-xs font-semibold shadow-xs"
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              Apply to Donate
            </button>
          )}

          {hasApplied && (
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" />
              Applied
            </span>
          )}

          {isRequester && request.status === 'OPEN' && (
            <span className="text-xs font-mono text-[var(--ink-soft)]">
              {request.applications?.filter((a: any) => a.status === 'PENDING').length || 0} pending application(s)
            </span>
          )}
        </div>

        {/* Show applications for requester */}
        {isRequester && request.applications && request.applications.length > 0 && (
          <div className="mt-3 pt-2 border-t border-dashed border-[var(--sage-200)]">
            <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-soft)] mb-2">
              Donor Applications ({request.applications.length})
            </p>
            <div className="space-y-2">
              {request.applications.map((app: any) => (
                <div
                  key={app.id}
                  className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[var(--paper)] rounded-xl border border-[var(--sage-200)] text-xs"
                >
                  <div>
                    <span className="font-semibold text-[var(--ink)]">{app.donor?.name || 'Volunteer Donor'}</span>
                    {app.donor?.phone && (
                      <span className="text-[var(--ink-soft)] ml-2 font-mono text-[11px]">📞 {app.donor.phone}</span>
                    )}
                    {app.message && <p className="text-[11px] text-[var(--ink-soft)] italic mt-0.5">"{app.message}"</p>}
                  </div>

                  {app.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRespond(app.id, true)}
                        disabled={respondingId === app.id}
                        className="px-3 py-1 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 font-medium text-xs disabled:opacity-50"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRespond(app.id, false)}
                        disabled={respondingId === app.id}
                        className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 hover:bg-rose-200 font-medium text-xs disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  )}

                  {app.status === 'ACCEPTED_BY_REQUESTER' && (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ✓ Accepted
                    </span>
                  )}
                  {app.status === 'DECLINED' && (
                    <span className="text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      Declined
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
