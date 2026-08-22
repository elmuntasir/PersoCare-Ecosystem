'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { logExercise } from '@/actions/exercise/log'
import { ExerciseSearchInput } from './ExerciseSearchInput'
import { Clock, Zap, Activity, CheckCircle2, AlertCircle } from 'lucide-react'

export function ExerciseLogForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter()
  const [exercise, setExercise] = useState<any>(null)
  const [duration, setDuration] = useState<number>(15)
  const [intensity, setIntensity] = useState<'low' | 'medium' | 'high'>('medium')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [calories, setCalories] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSelect = (ex: any) => {
    setExercise(ex)
    setError(null)
    setSuccess(false)
    setCalories(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!exercise || duration <= 0) {
      setError('Please select an exercise and enter a valid duration.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    const fd = new FormData()
    fd.append('exerciseName', exercise.name)
    if (exercise.id) fd.append('exerciseId', exercise.id)
    fd.append('duration', String(duration))
    fd.append('intensity', intensity)
    if (notes.trim()) {
      fd.append('notes', notes.trim())
    }

    try {
      const result = await logExercise(fd)
      setCalories(result.caloriesBurned)
      setSuccess(true)
      setExercise(null)
      setNotes('')
      router.refresh()
      if (onSuccess) onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to log exercise')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white/90 p-5 rounded-2xl border border-stone-200 shadow-sm">
      <div className="flex items-center gap-2 text-stone-800 font-semibold text-base border-b border-stone-100 pb-3">
        <Activity className="w-5 h-5 text-amber-600" />
        <span>Quick Exercise Entry</span>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-1.5">
          Search Exercise
        </label>
        <ExerciseSearchInput onSelect={handleSelect} placeholder="Search running, pushups, yoga..." />
      </div>

      {exercise && (
        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs space-y-1">
          <div className="font-semibold text-amber-900 capitalize flex justify-between">
            <span>{exercise.name}</span>
            <span className="text-amber-700">Type: {exercise.type}</span>
          </div>
          {exercise.instructions && (
            <p className="text-amber-800 line-clamp-2 pt-1">{exercise.instructions}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-1.5">
            Duration (min)
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" strokeWidth={1.6} />
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min={1}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-stone-200 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-1.5">
            Intensity
          </label>
          <div className="flex gap-1.5">
            {(['low', 'medium', 'high'] as const).map((int) => (
              <button
                key={int}
                type="button"
                onClick={() => setIntensity(int)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                  intensity === int
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200'
                }`}
              >
                {int}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-1.5">
          Notes (Optional)
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. 3 sets of 12 reps, felt energized"
          className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-xs bg-rose-50 text-rose-700 rounded-xl border border-rose-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && calories !== null && (
        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 flex items-center gap-3">
          <Zap className="w-5 h-5 text-emerald-600 shrink-0" strokeWidth={1.6} />
          <div>
            <p className="text-sm font-semibold text-emerald-900">
              Logged! Estimated burn: <span className="text-emerald-700 font-bold">{calories}</span> kcal
            </p>
            <p className="text-xs text-emerald-700">Calculated with your patient weight profile & MET factor.</p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !exercise}
        className="w-full py-2.5 px-4 rounded-xl bg-amber-600 text-white font-medium text-sm hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2"
      >
        {loading ? 'Saving...' : 'Log Exercise'}
      </button>
    </form>
  )
}
