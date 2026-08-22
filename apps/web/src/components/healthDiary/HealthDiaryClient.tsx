'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteHealthDiaryEntry } from '@/actions/healthDiary'
import { format } from 'date-fns'
import { Trash2, Calendar, Feather } from 'lucide-react'
import { QuickNoteModal } from '@/components/healthDiary/QuickNoteModal'

export interface HealthDiaryItem {
  id: string
  note: string
  mood: string | null
  symptoms: any
  tags: string[]
  recordedAt: string | Date
}

interface HealthDiaryClientProps {
  initialEntries: HealthDiaryItem[]
}

const moodEmoji: Record<string, string> = {
  '😊 Happy': '😊',
  '😐 Neutral': '😐',
  '😞 Sad': '😞',
  '😤 Anxious': '😤',
  '😴 Tired': '😴',
  '🤒 Sick': '🤒',
}

export function HealthDiaryClient({ initialEntries }: HealthDiaryClientProps) {
  const router = useRouter()
  const [entries, setEntries] = useState(initialEntries)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Keep state in sync if initialEntries changes via server revalidation
  const [prevInitialEntries, setPrevInitialEntries] = useState(initialEntries)
  if (initialEntries !== prevInitialEntries) {
    setPrevInitialEntries(initialEntries)
    setEntries(initialEntries)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this health note?')) return
    setDeleting(id)
    try {
      const fd = new FormData()
      fd.append('id', id)
      await deleteHealthDiaryEntry(fd)
      setEntries(prev => prev.filter(e => e.id !== id))
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Failed to delete note.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header Action Bar */}
        <div className="flex items-center justify-between bg-white rounded-2xl border border-[var(--sage-200)] p-4 sm:p-5 shadow-xs">
          <div>
            <h2 className="font-display font-bold text-xl text-[var(--teal-900)]">Health Diary Logs</h2>
            <p className="text-xs text-[var(--ink-soft)] font-body mt-0.5">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'} recorded
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--coral)] text-white hover:opacity-90 transition-opacity text-sm font-medium shadow-xs"
          >
            <Feather className="w-4 h-4" strokeWidth={2} />
            <span>+ New Note</span>
          </button>
        </div>

        {/* Entries List */}
        {entries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[var(--sage-200)] p-12 text-center shadow-xs">
            <div className="w-16 h-16 rounded-full bg-[var(--sage-200)]/40 flex items-center justify-center mx-auto mb-3 text-[var(--ink-soft)]/50">
              <Feather className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <h3 className="font-display font-semibold text-lg text-[var(--teal-900)]">No health notes yet</h3>
            <p className="font-body text-sm text-[var(--ink-soft)] mt-1 max-w-md mx-auto">
              Use the button above or the feather icon in the top header to quickly record symptoms, mood, and daily health notes.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--teal-900)] text-white text-sm font-medium hover:opacity-95 transition-opacity"
            >
              <Feather className="w-4 h-4" strokeWidth={2} />
              <span>Record First Note</span>
            </button>
          </div>
        ) : (
          entries.map((entry) => {
            const symptomsList: string[] = Array.isArray(entry.symptoms)
              ? entry.symptoms
              : []

            return (
              <div
                key={entry.id}
                className="bg-white rounded-2xl border border-[var(--sage-200)] p-5 shadow-xs hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-soft)] font-mono font-medium bg-[var(--paper)] px-2.5 py-1 rounded-full border border-[var(--sage-200)]/70">
                        <Calendar className="w-3.5 h-3.5 text-[var(--teal-900)]" strokeWidth={1.8} />
                        {format(new Date(entry.recordedAt), 'MMM dd, yyyy • hh:mm a')}
                      </div>

                      {entry.mood && (
                        <span
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-body font-medium"
                          title={entry.mood}
                        >
                          <span>{moodEmoji[entry.mood] || '😊'}</span>
                          <span>{entry.mood.replace(/^[^\w]+/, '').trim() || entry.mood}</span>
                        </span>
                      )}

                      {symptomsList.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {symptomsList.map((s: string) => (
                            <span
                              key={s}
                              className="text-xs bg-[var(--sage-200)]/70 text-[var(--ink)] px-2.5 py-0.5 rounded-full font-body font-medium"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      {entry.tags?.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {entry.tags.map((t) => (
                            <span
                              key={t}
                              className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full font-body font-medium"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <p className="mt-3 font-body text-sm text-[var(--ink)] leading-relaxed whitespace-pre-wrap">
                      {entry.note}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleDelete(entry.id)}
                      disabled={deleting === entry.id}
                      className="p-2 rounded-full hover:bg-rose-50 text-[var(--ink-soft)] hover:text-rose-600 transition-colors disabled:opacity-50"
                      title="Delete entry"
                      aria-label="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.8} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <QuickNoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
