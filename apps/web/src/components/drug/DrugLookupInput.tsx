'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Sparkles, ShieldCheck, X } from 'lucide-react'
import type { DrugSearchResult } from '@/lib/drug-apis'

type Props = {
  value: string
  onChange: (value: string) => void
  onSelect: (drug: DrugSearchResult | null) => void
  selectedDrug: DrugSearchResult | null
  placeholder?: string
}

export function DrugLookupInput({
  value,
  onChange,
  onSelect,
  selectedDrug,
  placeholder = 'Medicine name',
}: Props) {
  const [results, setResults] = useState<DrugSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const query = value

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/drugs/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data?.error || 'Failed to search medicines')
        }
        setResults(Array.isArray(data?.results) ? data.results : [])
        setOpen(true)
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to search medicines')
          setResults([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }, 300)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [query])

  const displayHint = useMemo(() => {
    if (selectedDrug) {
      return [
        selectedDrug.company,
        selectedDrug.genericName,
        selectedDrug.rxnorm?.name ? `RxNorm: ${selectedDrug.rxnorm.name}` : null,
      ]
        .filter(Boolean)
        .join(' · ')
    }
    return ''
  }, [selectedDrug])

  const handlePick = (drug: DrugSearchResult) => {
    onChange(drug.label)
    onSelect(drug)
    setOpen(false)
    setResults([])
  }

  const handleManualChange = (nextValue: string) => {
    onChange(nextValue)
    onSelect(null)

    if (nextValue.trim().length < 2) {
      setOpen(false)
      setResults([])
      setError(null)
      setLoading(false)
      return
    }

    setOpen(true)
    setError(null)
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-soft)]"
          strokeWidth={1.7}
        />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleManualChange(e.target.value)}
          onFocus={() => setOpen(true)}
          className="w-full rounded-xl border border-[var(--sage-200)] bg-white px-10 py-2 text-sm font-body text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--coral)]/30"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[var(--ink-soft)]">
            Searching
          </span>
        )}
      </div>

      {selectedDrug && (
        <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-800">
          <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
          <span>Matched via MedEx and RxNorm</span>
          {displayHint ? <span className="text-emerald-700/80">· {displayHint}</span> : null}
          <button
            type="button"
            onClick={() => {
              onChange('')
              onSelect(null)
              setOpen(false)
              setResults([])
              setError(null)
              setLoading(false)
            }}
            className="ml-1 rounded-full p-0.5 hover:bg-emerald-100"
            title="Clear selected drug"
          >
            <X className="h-3 w-3" strokeWidth={2} />
          </button>
        </div>
      )}

      {open && query.trim().length >= 2 && (results.length > 0 || error) && (
        <div className="absolute z-20 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-[var(--sage-200)] bg-white shadow-xl">
          {error ? (
            <div className="px-4 py-3 text-sm text-rose-600">{error}</div>
          ) : (
            <div className="divide-y divide-[var(--sage-200)]">
              {results.map((drug, index) => (
                <button
                  key={`${drug.brandId || 'no-brand'}-${drug.slug || 'no-slug'}-${drug.label}-${index}`}
                  type="button"
                  onClick={() => handlePick(drug)}
                  className="block w-full px-4 py-3 text-left transition-colors hover:bg-[var(--paper)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[var(--teal-900)]">{drug.label}</p>
                      <p className="mt-0.5 text-xs text-[var(--ink-soft)]">
                        {drug.company || 'Unknown company'}
                        {drug.genericName ? ` · ${drug.genericName}` : ''}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.12em] text-[var(--teal-900)]">
                      <Sparkles className="h-3 w-3" strokeWidth={2} />
                      MedEx
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-mono text-[var(--ink-soft)]">
                    {drug.rxnorm?.name ? <span>RxNorm: {drug.rxnorm.name}</span> : null}
                    {drug.medexUrl ? <span>Local listing available</span> : null}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
