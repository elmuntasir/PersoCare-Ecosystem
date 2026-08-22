'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createHealthDiaryEntry, deleteHealthDiaryEntry } from '@/actions/healthDiary'
import { Calendar, Feather, History, Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

export interface HealthDiaryItem {
  id: string
  note: string
  mood: string | null
  symptoms: unknown
  tags: string[]
  recordedAt: string
}

interface HealthDiarySectionProps {
  initialEntries: HealthDiaryItem[]
}

const moodOptions = ['😊 Happy', '😐 Neutral', '😞 Sad', '😤 Anxious', '😴 Tired', '🤒 Sick']
const commonSymptoms = ['Headache', 'Fever', 'Cough', 'Fatigue', 'Nausea', 'Dizziness', 'Pain', 'Shortness of breath']

export function HealthDiarySection({ initialEntries }: HealthDiarySectionProps) {
  const router = useRouter()
  const [view, setView] = useState<'record' | 'history'>('record')
  const [entries, setEntries] = useState(initialEntries)
  const [note, setNote] = useState('')
  const [mood, setMood] = useState('')
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const countLabel = useMemo(() => `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`, [entries.length])

  const toggleSymptom = (symptom: string) => {
    setSymptoms((prev) => (prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!note.trim()) {
      setError('Please write something before saving.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const fd = new FormData()
      fd.append('note', note.trim())
      if (mood) fd.append('mood', mood)
      fd.append('symptoms', JSON.stringify(symptoms))
      fd.append(
        'tags',
        JSON.stringify(
          tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
        )
      )

      await createHealthDiaryEntry(fd)
      setNote('')
      setMood('')
      setSymptoms([])
      setTags('')
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Failed to save entry.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setSavingId(id)
    try {
      const fd = new FormData()
      fd.append('id', id)
      await deleteHealthDiaryEntry(fd)
      setEntries((prev) => prev.filter((entry) => entry.id !== id))
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Failed to delete entry.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <section className="bg-white rounded-3xl border border-[var(--sage-200)] p-6 md:p-8 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-[var(--coral)] mb-0.5">
            Personal Journal
          </p>
          <h2 className="font-display text-2xl text-[var(--teal-900)]">Health Diary</h2>
          <p className="text-sm text-[var(--ink-soft)] mt-1">
            Record a new note or switch to history to review previous logs on the same page.
          </p>
        </div>
        <div className="inline-flex rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)] p-1">
          <button
            type="button"
            onClick={() => setView('record')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              view === 'record'
                ? 'bg-[var(--teal-900)] text-white shadow-xs'
                : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
            }`}
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            Record
          </button>
          <button
            type="button"
            onClick={() => setView('history')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              view === 'history'
                ? 'bg-[var(--teal-900)] text-white shadow-xs'
                : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
            }`}
          >
            <History className="w-4 h-4" strokeWidth={2} />
            History
          </button>
        </div>
      </div>

      {view === 'record' ? (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--teal-900)] mb-1.5">
                  Mood
                </label>
                <div className="flex flex-wrap gap-2">
                  {moodOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setMood(mood === option ? '' : option)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        mood === option
                          ? 'bg-[var(--teal-900)] text-white shadow-sm'
                          : 'bg-[var(--paper)] border border-[var(--sage-200)] text-[var(--ink)] hover:bg-[var(--sage-200)]/50'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--teal-900)] mb-1.5">
                  Symptoms
                </label>
                <div className="flex flex-wrap gap-2">
                  {commonSymptoms.map((symptom) => (
                    <button
                      key={symptom}
                      type="button"
                      onClick={() => toggleSymptom(symptom)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        symptoms.includes(symptom)
                          ? 'bg-[var(--coral)] text-white shadow-sm'
                          : 'bg-[var(--sage-200)]/60 text-[var(--ink-soft)] hover:bg-[var(--sage-200)]'
                      }`}
                    >
                      {symptom}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--teal-900)] mb-1.5">
                  Note <span className="text-[var(--coral)]">*</span>
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Describe how you're feeling, any symptoms, or anything important to remember."
                  rows={8}
                  className="w-full rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)]/50 px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-soft)]/60 focus:bg-white focus-visible:outline-2 focus-visible:outline-[var(--coral)] transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--teal-900)] mb-1.5">
                  Tags
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. sleep, stress, recovery"
                  className="w-full rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)]/50 px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-soft)]/60 focus:bg-white focus-visible:outline-2 focus-visible:outline-[var(--coral)] transition-colors"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-2xl p-3 text-rose-700 text-xs">
              <Feather className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-[var(--ink-soft)]">
              Your diary saves to the same log history page automatically.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--coral)] text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-60 shadow-sm"
            >
              <Feather className="w-4 h-4" strokeWidth={2} />
              {loading ? 'Saving...' : 'Save Record'}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-[var(--paper)] rounded-2xl border border-[var(--sage-200)] p-4">
            <div>
              <h3 className="font-display font-semibold text-lg text-[var(--teal-900)]">History</h3>
              <p className="text-xs text-[var(--ink-soft)]">{countLabel}</p>
            </div>
            <button
              type="button"
              onClick={() => setView('record')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--sage-200)] text-[var(--teal-900)] text-sm hover:bg-[var(--sage-200)]/40 transition-colors"
            >
              <Plus className="w-4 h-4" strokeWidth={2} />
              Back to Record
            </button>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {entries.length === 0 ? (
              <div className="bg-[var(--paper)] rounded-2xl border border-[var(--sage-200)] p-10 text-center">
                <p className="text-sm text-[var(--ink-soft)]">No health diary entries yet.</p>
              </div>
            ) : (
              entries.map((entry) => (
                <article
                  key={entry.id}
                  className="bg-[var(--paper)] rounded-2xl border border-[var(--sage-200)] p-4 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-soft)] font-mono bg-white px-2.5 py-1 rounded-full border border-[var(--sage-200)]/70">
                          <Calendar className="w-3.5 h-3.5 text-[var(--teal-900)]" strokeWidth={1.8} />
                          {format(new Date(entry.recordedAt), 'MMM dd, yyyy • hh:mm a')}
                        </span>
                        {entry.mood ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                            {entry.mood}
                          </span>
                        ) : null}
                        {entry.tags?.length ? (
                          <span className="text-xs text-[var(--ink-soft)]">
                            {entry.tags.map((tag) => `#${tag}`).join(' ')}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-[var(--ink)] whitespace-pre-wrap leading-relaxed">{entry.note}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(entry.id)}
                      disabled={savingId === entry.id}
                      className="p-2 rounded-full hover:bg-rose-50 text-[var(--ink-soft)] hover:text-rose-600 transition-colors disabled:opacity-50"
                      aria-label="Delete entry"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.8} />
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  )
}
