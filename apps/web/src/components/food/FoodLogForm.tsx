'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { logFood } from '@/actions/food/log'
import { FoodSearchInput } from './FoodSearchInput'
import { Utensils, CheckCircle2, AlertCircle } from 'lucide-react'

export function FoodLogForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter()
  const [food, setFood] = useState<any>(null)
  const [amount, setAmount] = useState<number>(100)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelect = (item: any) => {
    setFood(item)
    setError(null)
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!food || amount <= 0) {
      setError('Please select a food and enter a valid amount (grams).')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    const fd = new FormData()
    if (food.id && !food.id.startsWith('user_food_')) {
      fd.append('foodId', food.id)
    }
    if (food.userFoodId || (food.id && food.id.startsWith('user_food_'))) {
      fd.append('userFoodId', food.userFoodId || food.id)
    }
    fd.append('amountGrams', String(amount))
    if (notes.trim()) {
      fd.append('notes', notes.trim())
    }

    try {
      await logFood(fd)
      setSuccess(true)
      setFood(null)
      setNotes('')
      router.refresh()
      if (onSuccess) onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to log food')
    } finally {
      setLoading(false)
    }
  }

  const caloriesCalculated = food?.nutrients?.calories
    ? Math.round(((food.nutrients.calories * amount) / 100) * 10) / 10
    : null

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white/90 p-5 rounded-2xl border border-stone-200 shadow-sm">
      <div className="flex items-center gap-2 text-stone-800 font-semibold text-base border-b border-stone-100 pb-3">
        <Utensils className="w-5 h-5 text-emerald-600" />
        <span>Quick Food Entry</span>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-1.5">
          Search Food Item
        </label>
        <FoodSearchInput onSelect={handleSelect} placeholder="Search banana, oatmeal, milk, etc..." />
      </div>

      {food && (
        <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs space-y-1">
          <div className="font-semibold text-emerald-900 flex justify-between">
            <span>{food.name} {food.brand ? `(${food.brand})` : ''}</span>
            {caloriesCalculated !== null && (
              <span className="text-emerald-700 font-bold">{caloriesCalculated} kcal total</span>
            )}
          </div>
          {food.nutrients && (
            <div className="text-emerald-800 flex gap-3 pt-1">
              <span>Per 100g:</span>
              <span>{food.nutrients.calories} kcal</span>
              <span>P: {food.nutrients.protein}g</span>
              <span>C: {food.nutrients.carbs}g</span>
              <span>F: {food.nutrients.fat}g</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-1.5">
            Amount (grams)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min={1}
            step="any"
            className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-1.5">
            Notes (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Breakfast side"
            className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-xs bg-rose-50 text-rose-700 rounded-xl border border-rose-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 text-xs bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Food logged successfully!</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !food}
        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2"
      >
        {loading ? 'Saving...' : 'Log Food'}
      </button>
    </form>
  )
}
