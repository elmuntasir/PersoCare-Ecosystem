'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { searchBloodRequests, searchDonors, applyToDonate } from '@/actions/blood/request'
import { BloodRequestCard } from './BloodRequestCard'
import { DonorCard } from './DonorCard'
import { CreateRequestModal } from './CreateRequestModal'
import { DonorRegistrationModal } from './DonorRegistrationModal'
import { Search, Filter, Plus, Heart, UserPlus, ShieldAlert, Sparkles } from 'lucide-react'

interface BloodDonationClientProps {
  initialRequests: any[]
  initialDonors: any[]
  currentUserId: string
  donorProfile: any
}

export function BloodDonationClient({
  initialRequests,
  initialDonors,
  currentUserId,
  donorProfile,
}: BloodDonationClientProps) {
  const router = useRouter()
  const [requests, setRequests] = useState(initialRequests)
  const [donors, setDonors] = useState(initialDonors)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDonorModal, setShowDonorModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'requests' | 'donors'>('requests')

  const [filters, setFilters] = useState({
    bloodType: '',
    district: '',
    urgency: '',
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const fd = new FormData()
      if (filters.bloodType) fd.append('bloodType', filters.bloodType)
      if (filters.district) fd.append('district', filters.district)
      if (filters.urgency) fd.append('urgency', filters.urgency)

      if (activeTab === 'requests') {
        const data = await searchBloodRequests(fd)
        setRequests(data)
      } else {
        const data = await searchDonors(fd)
        setDonors(data)
      }
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filters, activeTab])

  const handleApply = async (requestId: string) => {
    const msg = prompt('Enter a message or contact note for the requester (optional):')
    if (msg === null) return // cancelled

    try {
      const fd = new FormData()
      fd.append('requestId', requestId)
      if (msg) fd.append('message', msg)
      await applyToDonate(fd)
      alert('Application submitted! The requester will review your contact.')
      router.refresh()
      fetchData()
    } catch (err: any) {
      alert(err.message || 'Failed to apply')
    }
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex bg-[var(--paper)] p-1 rounded-2xl border border-[var(--sage-200)] shadow-xs">
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'requests'
                ? 'bg-white text-[var(--teal-900)] shadow-xs font-semibold'
                : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
            }`}
          >
            <Heart className={`w-4 h-4 ${activeTab === 'requests' ? 'text-rose-500 fill-rose-500' : ''}`} />
            Open Blood Requests
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-mono">
              {requests.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('donors')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'donors'
                ? 'bg-white text-[var(--teal-900)] shadow-xs font-semibold'
                : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
            }`}
          >
            <UserPlus className="w-4 h-4 text-[var(--teal-900)]" />
            Registered Donors
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-mono">
              {donors.length}
            </span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--coral)] text-white hover:opacity-90 transition-opacity text-sm font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            Post Blood Request
          </button>
          <button
            onClick={() => setShowDonorModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-[var(--paper)] text-[var(--teal-900)] border border-[var(--sage-200)] transition-all text-sm font-medium shadow-xs"
          >
            <UserPlus className="w-4 h-4" strokeWidth={1.8} />
            {donorProfile ? 'Manage Donor Profile' : 'Register as Donor'}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-4 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--ink-soft)] mr-1">
          <Filter className="w-4 h-4 text-[var(--teal-700)]" strokeWidth={1.8} />
          <span>FILTERS:</span>
        </div>

        <select
          value={filters.bloodType}
          onChange={(e) => setFilters((prev) => ({ ...prev, bloodType: e.target.value }))}
          className="rounded-xl border border-[var(--sage-200)] px-3.5 py-2 text-sm font-body bg-white text-[var(--ink)] focus:border-[var(--coral)] focus:ring-1 focus:ring-[var(--coral)] outline-hidden"
        >
          <option value="">All Blood Types</option>
          {['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG'].map((t) => (
            <option key={t} value={t}>
              {t.replace('_', '')}
            </option>
          ))}
        </select>

        <div className="relative flex-1 min-w-[160px]">
          <input
            type="text"
            placeholder="Search by District / City..."
            value={filters.district}
            onChange={(e) => setFilters((prev) => ({ ...prev, district: e.target.value }))}
            className="w-full rounded-xl border border-[var(--sage-200)] px-3.5 py-2 text-sm font-body bg-white text-[var(--ink)] focus:border-[var(--coral)] focus:ring-1 focus:ring-[var(--coral)] outline-hidden"
          />
        </div>

        {activeTab === 'requests' && (
          <select
            value={filters.urgency}
            onChange={(e) => setFilters((prev) => ({ ...prev, urgency: e.target.value }))}
            className="rounded-xl border border-[var(--sage-200)] px-3.5 py-2 text-sm font-body bg-white text-[var(--ink)] focus:border-[var(--coral)] focus:ring-1 focus:ring-[var(--coral)] outline-hidden"
          >
            <option value="">All Urgencies</option>
            <option value="CRITICAL">Critical (Immediate)</option>
            <option value="URGENT">Urgent (24-48h)</option>
            <option value="ROUTINE">Routine</option>
          </select>
        )}

        {(filters.bloodType || filters.district || filters.urgency) && (
          <button
            onClick={() => setFilters({ bloodType: '', district: '', urgency: '' })}
            className="text-xs text-[var(--coral)] font-semibold hover:underline px-2 py-1"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Grid Results */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-[var(--teal-700)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="font-body text-sm text-[var(--ink-soft)]">Searching blood registry...</p>
        </div>
      ) : activeTab === 'requests' ? (
        requests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.map((req) => (
              <BloodRequestCard
                key={req.id}
                request={req}
                onApply={() => handleApply(req.id)}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[var(--sage-200)] p-12 text-center max-w-md mx-auto">
            <Heart className="w-12 h-12 text-rose-300 mx-auto mb-3" strokeWidth={1.5} />
            <h4 className="font-display text-lg text-[var(--teal-900)] mb-1">No Open Blood Requests</h4>
            <p className="text-xs text-[var(--ink-soft)] mb-5">
              No current requests match your filter criteria. Be the first to create one if you or someone you know needs blood.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2 rounded-full bg-[var(--coral)] text-white hover:opacity-90 text-xs font-semibold shadow-xs"
            >
              Post a Request
            </button>
          </div>
        )
      ) : donors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {donors.map((donor) => (
            <DonorCard key={donor.id} donor={donor} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[var(--sage-200)] p-12 text-center max-w-md mx-auto">
          <UserPlus className="w-12 h-12 text-teal-300 mx-auto mb-3" strokeWidth={1.5} />
          <h4 className="font-display text-lg text-[var(--teal-900)] mb-1">No Verified Donors Found</h4>
          <p className="text-xs text-[var(--ink-soft)] mb-5">
            No donors match the current filters. Become a verified donor in your district today!
          </p>
          <button
            onClick={() => setShowDonorModal(true)}
            className="px-5 py-2 rounded-full bg-[var(--teal-900)] text-white hover:bg-[var(--teal-700)] text-xs font-semibold shadow-xs"
          >
            Register as Donor
          </button>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateRequestModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            router.refresh()
            fetchData()
          }}
        />
      )}

      {showDonorModal && (
        <DonorRegistrationModal
          currentProfile={donorProfile}
          onClose={() => setShowDonorModal(false)}
          onSuccess={() => {
            setShowDonorModal(false)
            router.refresh()
            fetchData()
          }}
        />
      )}
    </div>
  )
}
