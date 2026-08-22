'use client'

import { useState } from 'react'
import { createBloodRequest } from '@/actions/blood/request'
import { X, Heart, AlertCircle } from 'lucide-react'

interface CreateRequestModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function CreateRequestModal({ onClose, onSuccess }: CreateRequestModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [bloodType, setBloodType] = useState('')
  const [units, setUnits] = useState(1)
  const [urgency, setUrgency] = useState('ROUTINE')
  const [district, setDistrict] = useState('')
  const [hospital, setHospital] = useState('')
  const [notes, setNotes] = useState('')
  const [patientName, setPatientName] = useState('')
  const [patientAge, setPatientAge] = useState('')
  const [patientGender, setPatientGender] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!bloodType) {
        throw new Error('Please select the required blood type.')
      }

      const fd = new FormData()
      fd.append('bloodTypeNeeded', bloodType)
      fd.append('unitsNeeded', String(units))
      fd.append('urgency', urgency)
      if (district) fd.append('district', district)
      if (hospital) fd.append('hospitalContext', hospital)
      if (notes) fd.append('notes', notes)
      if (patientName) fd.append('patientName', patientName)
      if (patientAge) fd.append('patientAge', patientAge)
      if (patientGender) fd.append('patientGender', patientGender)
      if (contactPhone) fd.append('contactPhone', contactPhone)
      if (expiresAt) {
        // Convert date-only to end-of-day ISO string so the time component is always valid
        const expDate = new Date(expiresAt)
        expDate.setHours(23, 59, 59, 0)
        fd.append('expiresAt', expDate.toISOString())
      }

      await createBloodRequest(fd)
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to create blood request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl border border-[var(--sage-200)] max-h-[92vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-display text-2xl text-[var(--teal-900)]">Create Blood Request</h3>
              <p className="text-xs text-[var(--ink-soft)] font-body">Reach verified donors in your area</p>
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
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[var(--ink)] block mb-1">
                Blood Type Needed <span className="text-rose-500">*</span>
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
              <label className="text-xs font-semibold text-[var(--ink)] block mb-1">
                Urgency Level <span className="text-rose-500">*</span>
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full rounded-xl border border-[var(--sage-200)] px-3.5 py-2.5 text-sm bg-white focus:border-[var(--coral)] focus:ring-1 focus:ring-[var(--coral)] outline-hidden transition-all"
                required
              >
                <option value="ROUTINE">Routine (Planned)</option>
                <option value="URGENT">Urgent (Within 24-48h)</option>
                <option value="CRITICAL">Critical (Immediate/Emergency)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[var(--ink)] block mb-1">
                Units (Bags) Needed <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={units}
                onChange={(e) => setUnits(Number(e.target.value))}
                className="w-full rounded-xl border border-[var(--sage-200)] px-3.5 py-2.5 text-sm bg-white focus:border-[var(--coral)] focus:ring-1 focus:ring-[var(--coral)] outline-hidden transition-all"
                required
              />
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
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--ink)] block mb-1">Hospital / Clinic Context</label>
            <input
              type="text"
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
              placeholder="e.g. Square Hospital, Ward 4, Bed 12"
              className="w-full rounded-xl border border-[var(--sage-200)] px-3.5 py-2.5 text-sm bg-white focus:border-[var(--coral)] focus:ring-1 focus:ring-[var(--coral)] outline-hidden transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-[var(--ink)] block mb-1">Patient Name</label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Optional"
                className="w-full rounded-xl border border-[var(--sage-200)] px-3.5 py-2.5 text-sm bg-white focus:border-[var(--coral)] focus:ring-1 focus:ring-[var(--coral)] outline-hidden transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--ink)] block mb-1">Patient Age</label>
              <input
                type="number"
                min="0"
                max="120"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                placeholder="Years"
                className="w-full rounded-xl border border-[var(--sage-200)] px-3.5 py-2.5 text-sm bg-white focus:border-[var(--coral)] focus:ring-1 focus:ring-[var(--coral)] outline-hidden transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--ink)] block mb-1">Patient Gender</label>
              <select
                value={patientGender}
                onChange={(e) => setPatientGender(e.target.value)}
                className="w-full rounded-xl border border-[var(--sage-200)] px-3.5 py-2.5 text-sm bg-white focus:border-[var(--coral)] focus:ring-1 focus:ring-[var(--coral)] outline-hidden transition-all"
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[var(--ink)] block mb-1">
                Emergency Contact Phone
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+880 17XXXXXXXX"
                className="w-full rounded-xl border border-[var(--sage-200)] px-3.5 py-2.5 text-sm bg-white focus:border-[var(--coral)] focus:ring-1 focus:ring-[var(--coral)] outline-hidden transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--ink)] block mb-1">
                Request Expiry Date <span className="text-[var(--ink-soft)] font-normal">(Optional)</span>
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full rounded-xl border border-[var(--sage-200)] px-3.5 py-2.5 text-sm bg-white focus:border-[var(--coral)] focus:ring-1 focus:ring-[var(--coral)] outline-hidden transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--ink)] block mb-1">
              Medical Notes / Specific Instructions
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g., Cross-matching sample is available at blood bank, patient is undergoing bypass surgery tomorrow morning."
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
              {loading ? 'Publishing...' : 'Publish Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
