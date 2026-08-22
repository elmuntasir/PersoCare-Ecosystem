'use client'

import { useState } from 'react'
import { registerAsDonor, updateDonorAvailability } from '@/actions/blood/donor'
import { X, Heart, Shield, CheckCircle, AlertCircle } from 'lucide-react'

interface DonorRegistrationModalProps {
  currentProfile: any
  onClose: () => void
  onSuccess: () => void
}

export function DonorRegistrationModal({ currentProfile, onClose, onSuccess }: DonorRegistrationModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [bloodType, setBloodType] = useState(currentProfile?.bloodType || '')
  const [district, setDistrict] = useState(currentProfile?.district || '')
  const [lastDonationDate, setLastDonationDate] = useState(
    currentProfile?.lastDonationDate
      ? new Date(currentProfile.lastDonationDate).toISOString().split('T')[0]
      : ''
  )
  const [medicalConditions, setMedicalConditions] = useState(currentProfile?.medicalConditions || '')
  const [isAvailable, setIsAvailable] = useState<boolean>(currentProfile?.isAvailable ?? true)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!bloodType) {
        throw new Error('Please select your blood type.')
      }

      const fd = new FormData()
      fd.append('bloodType', bloodType)
      if (district) fd.append('district', district)
      if (lastDonationDate) fd.append('lastDonationDate', lastDonationDate)
      if (medicalConditions) fd.append('medicalConditions', medicalConditions)

      await registerAsDonor(fd)
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to register as donor')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAvailability = async (newVal: boolean) => {
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('isAvailable', String(newVal))
      await updateDonorAvailability(fd)
      setIsAvailable(newVal)
      onSuccess()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (currentProfile) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
        <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-[var(--sage-200)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                {currentProfile.bloodType.replace('_', '')}
              </div>
              <div>
                <h3 className="font-display text-xl text-[var(--teal-900)]">Your Donor Profile</h3>
                <p className="text-xs text-[var(--ink-soft)] font-body">Manage your donor availability</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--ink-soft)] hover:bg-[var(--sage-200)] transition-colors"
            >
              <X className="w-5 h-5" strokeWidth={1.8} />
            </button>
          </div>

          <div className="space-y-3.5 my-5 text-xs text-[var(--ink-soft)] font-body bg-[var(--paper)] p-4 rounded-2xl border border-[var(--sage-200)]">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--sage-200)]/60">
              <span>Verification Status:</span>
              {currentProfile.isVerified ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Verified Donor
                </span>
              ) : (
                <span className="text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Verification Pending
                </span>
              )}
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[var(--sage-200)]/60">
              <span>District:</span>
              <strong className="text-[var(--ink)]">{currentProfile.district || 'Not specified'}</strong>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[var(--sage-200)]/60">
              <span>Last Donated:</span>
              <strong className="text-[var(--ink)]">
                {currentProfile.lastDonationDate
                  ? new Date(currentProfile.lastDonationDate).toLocaleDateString()
                  : 'Never logged'}
              </strong>
            </div>
            <div className="flex justify-between items-center">
              <span>Availability:</span>
              <button
                onClick={() => handleToggleAvailability(!isAvailable)}
                disabled={loading}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  isAvailable
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-stone-300 text-stone-700 hover:bg-stone-400'
                }`}
              >
                {isAvailable ? '✓ Available to Donate' : 'Paused / Unavailable'}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-[var(--teal-900)] text-white hover:bg-[var(--teal-700)] text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-[var(--sage-200)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-display text-2xl text-[var(--teal-900)]">Register as a Blood Donor</h3>
              <p className="text-xs text-[var(--ink-soft)] font-body">Save lives in emergency situations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--ink-soft)] hover:bg-[var(--sage-200)] transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={1.8} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4 font-body">
          <div>
            <label className="text-xs font-semibold text-[var(--ink)] block mb-1">
              Your Blood Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={bloodType}
              onChange={(e) => setBloodType(e.target.value)}
              className="w-full rounded-xl border border-[var(--sage-200)] px-3.5 py-2.5 text-sm bg-white focus:border-[var(--coral)] focus:ring-1 focus:ring-[var(--coral)] outline-hidden transition-all"
              required
            >
              <option value="">Select Blood Type</option>
              {['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG'].map((t) => (
                <option key={t} value={t}>
                  {t.replace('_', '')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--ink)] block mb-1">District / City</label>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="e.g. Dhaka, Chittagong, Sylhet"
              className="w-full rounded-xl border border-[var(--sage-200)] px-3.5 py-2.5 text-sm bg-white focus:border-[var(--coral)] focus:ring-1 focus:ring-[var(--coral)] outline-hidden transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--ink)] block mb-1">
              Last Donation Date (Optional)
            </label>
            <input
              type="date"
              value={lastDonationDate}
              onChange={(e) => setLastDonationDate(e.target.value)}
              className="w-full rounded-xl border border-[var(--sage-200)] px-3.5 py-2.5 text-sm bg-white focus:border-[var(--coral)] focus:ring-1 focus:ring-[var(--coral)] outline-hidden transition-all"
            />
            <p className="text-[11px] text-[var(--ink-soft)] mt-1">
              Donors must wait at least 90 days (3 months) between whole blood donations.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--ink)] block mb-1">
              Medical Conditions / Allergies (Optional)
            </label>
            <textarea
              value={medicalConditions}
              onChange={(e) => setMedicalConditions(e.target.value)}
              rows={2}
              placeholder="e.g., Mild asthma, taking seasonal antihistamines."
              className="w-full rounded-xl border border-[var(--sage-200)] px-3.5 py-2.5 text-sm bg-white focus:border-[var(--coral)] focus:ring-1 focus:ring-[var(--coral)] outline-hidden transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--sage-200)]/60">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-[var(--sage-200)] text-[var(--teal-900)] hover:bg-[var(--sage-200)] text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-full bg-[var(--coral)] text-white hover:opacity-90 text-sm font-semibold shadow-xs disabled:opacity-60 transition-opacity"
            >
              {loading ? 'Registering...' : 'Register as Donor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
