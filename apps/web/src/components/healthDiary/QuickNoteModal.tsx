'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createHealthDiaryEntry } from '@/actions/healthDiary'
import { X, Feather, AlertCircle } from 'lucide-react'

interface QuickNoteModalProps {
  isOpen: boolean
  onClose: () => void
}

const moodOptions = ['😊 Happy', '😐 Neutral', '😞 Sad', '😤 Anxious', '😴 Tired', '🤒 Sick']
const commonSymptoms = ['Headache', 'Fever', 'Cough', 'Fatigue', 'Nausea', 'Dizziness', 'Pain', 'Shortness of breath']

export function QuickNoteModal({ isOpen, onClose }: QuickNoteModalProps) {
  const router = useRouter()
  const [note, setNote] = useState('')
  const [mood, setMood] = useState('')
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!note.trim()) {
      setError('Please write something about how you feel.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const fd = new FormData()
      fd.append('note', note.trim())
      if (mood) fd.append('mood', mood)
      fd.append('symptoms', JSON.stringify(symptoms))
      fd.append('tags', JSON.stringify([]))

      await createHealthDiaryEntry(fd)
      setNote('')
      setMood('')
      setSymptoms([])
      onClose()
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Failed to save entry.')
    } finally {
      setLoading(false)
    }
  }

  const toggleSymptom = (symptom: string) => {
    setSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-[var(--sage-200)] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--sage-200)]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-[var(--teal-900)]">
              <Feather className="w-4 h-4" strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-[var(--teal-900)]">Quick Health Note</h3>
              <p className="text-xs text-[var(--ink-soft)] font-body">Log symptoms, mood, and daily health updates</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[var(--sage-200)]/60 text-[var(--ink-soft)] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" strokeWidth={1.8} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mood */}
          <div>
            <label className="font-body text-xs font-semibold uppercase tracking-wider text-[var(--teal-900)] block mb-1.5">
              How are you feeling?
            </label>
            <div className="flex flex-wrap gap-2">
              {moodOptions.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(mood === m ? '' : m)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium font-body transition-all ${
                    mood === m
                      ? 'bg-[var(--teal-900)] text-white shadow-sm ring-2 ring-[var(--teal-900)]/30'
                      : 'bg-[var(--paper)] border border-[var(--sage-200)] text-[var(--ink)] hover:bg-[var(--sage-200)]/50'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Symptoms */}
          <div>
            <label className="font-body text-xs font-semibold uppercase tracking-wider text-[var(--teal-900)] block mb-1.5">
              Symptoms (tap to select)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {commonSymptoms.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSymptom(s)}
                  className={`px-3 py-1 rounded-full text-xs font-body transition-all ${
                    symptoms.includes(s)
                      ? 'bg-[var(--coral)] text-white font-medium shadow-xs'
                      : 'bg-[var(--sage-200)]/60 text-[var(--ink-soft)] hover:bg-[var(--sage-200)]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="font-body text-xs font-semibold uppercase tracking-wider text-[var(--teal-900)] block mb-1.5">
              Note <span className="text-[var(--coral)]">*</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Describe how you're feeling, any unusual symptoms, or anything you want to record..."
              rows={4}
              className="w-full rounded-xl border border-[var(--sage-200)] bg-[var(--paper)]/50 px-3.5 py-2.5 font-body text-sm text-[var(--ink)] placeholder:text-[var(--ink-soft)]/60 focus:bg-white focus-visible:outline-2 focus-visible:outline-[var(--coral)] transition-colors resize-none"
              required
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-700 font-body text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.8} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--sage-200)]/60">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full border border-[var(--sage-200)] text-[var(--teal-900)] hover:bg-[var(--sage-200)]/40 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-full bg-[var(--coral)] text-white hover:opacity-90 transition-opacity font-medium text-sm disabled:opacity-60 shadow-sm"
            >
              {loading ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
