'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Loader2, Dumbbell } from 'lucide-react'

interface ExerciseSearchInputProps {
  onSelect: (ex: any) => void
  placeholder?: string
  className?: string
}

export function ExerciseSearchInput({
  onSelect,
  placeholder = 'Search exercise...',
  className = '',
}: ExerciseSearchInputProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 1) {
        setLoading(true)
        try {
          const res = await fetch(`/api/exercises/search?q=${encodeURIComponent(query.trim())}`)
          const data = res.ok ? await res.json() : []
          setResults(Array.isArray(data) ? data : [])
          setShowDropdown(true)
        } catch (e) {
          console.error(e)
          setResults([])
        } finally {
          setLoading(false)
        }
      } else {
        setResults([])
        setShowDropdown(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (item: any) => {
    setQuery(item.name)
    setShowDropdown(false)
    onSelect(item)
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" strokeWidth={1.6} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all placeholder:text-stone-400"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 animate-spin" strokeWidth={1.6} />}
      </div>
      {showDropdown && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-30 mt-1 w-full bg-white rounded-xl border border-stone-200 shadow-xl max-h-60 overflow-y-auto divide-y divide-stone-100"
        >
          {results.map((item, idx) => (
            <button
              key={item.id || `${item.name}-${idx}`}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full text-left px-4 py-2.5 hover:bg-stone-50 transition-colors flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5">
                <Dumbbell className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-stone-900 capitalize">{item.name}</p>
                  <p className="text-xs text-stone-500">
                    {item.type} {item.muscle ? `• ${item.muscle}` : ''} {item.equipment ? `• ${item.equipment}` : ''}
                  </p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                MET ~{item.metBase || 5}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
