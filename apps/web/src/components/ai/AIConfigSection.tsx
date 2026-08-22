'use client'

import { useState } from 'react'
import { useAvatar } from '@/contexts/AvatarContext'
import { addProvider, removeProvider, toggleProvider, resetAllRateLimits } from '@/lib/ai/providers'
import { PROVIDER_ICONS } from '@/lib/avatar/registry'
import { Plus, Trash2, Power, RefreshCw, Globe } from 'lucide-react'

const PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'google', label: 'Google (Gemini)' },
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'groq', label: 'Groq' },
  { value: 'custom', label: 'Custom (OpenAI-compatible)' },
]

export function AIConfigSection() {
  const { providers, setProviders, roundRobinEnabled, setRoundRobinEnabled } = useAvatar()
  const [form, setForm] = useState({ providerKey: 'openai', model: '', apiKey: '' })
  const [showForm, setShowForm] = useState(false)

  const handleAdd = () => {
    if (!form.model.trim() || !form.apiKey.trim()) return
    const updated = addProvider({
      name: form.model,
      model: form.model,
      apiKey: form.apiKey,
      icon: PROVIDER_ICONS[form.providerKey] ?? PROVIDER_ICONS.default,
      enabled: true,
    })
    setProviders(updated)
    setForm({ providerKey: 'openai', model: '', apiKey: '' })
    setShowForm(false)
  }

  return (
    <section className="bg-white rounded-3xl border border-[var(--sage-200)] p-6 md:p-8 shadow-xs space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-[var(--coral)] mb-0.5">
            Configuration
          </p>
          <h2 className="font-display text-2xl text-[var(--teal-900)]">AI Config</h2>
          <p className="text-sm text-[var(--ink-soft)] mt-1">
            Add providers, toggle them on or off, and manage model routing from one place.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--teal-900)] text-white text-sm font-medium hover:bg-[var(--teal-700)] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          Add Model
        </button>
      </div>

      <div className="bg-[var(--paper)] rounded-2xl border border-[var(--sage-200)] p-4 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--teal-900)]/10 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5 text-[var(--teal-900)]" strokeWidth={1.6} />
          </div>
          <div>
            <p className="font-medium text-[var(--ink)] text-sm leading-tight">Round Robin Mode</p>
            <p className="text-xs text-[var(--ink-soft)] mt-0.5">
              Auto-switch to the next enabled model when rate-limited
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            id="round-robin-toggle"
            type="checkbox"
            checked={roundRobinEnabled}
            onChange={(e) => setRoundRobinEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-[var(--sage-200)] rounded-full peer peer-checked:bg-[var(--teal-900)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-[var(--sage-200)] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white" />
        </label>
      </div>

      {showForm && (
        <div className="bg-[var(--paper)] rounded-2xl border border-[var(--sage-200)] p-5 shadow-xs">
          <h3 className="font-medium text-[var(--ink)] mb-4">Add AI Model</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              id="provider-select"
              value={form.providerKey}
              onChange={(e) => setForm({ ...form, providerKey: e.target.value })}
              className="rounded-xl border border-[var(--sage-200)] px-4 py-2.5 text-sm bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--coral)]"
            >
              {PROVIDER_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <input
              id="model-name-input"
              type="text"
              placeholder="Model name (e.g., gpt-4o)"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              className="rounded-xl border border-[var(--sage-200)] px-4 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--coral)]"
            />
            <input
              id="api-key-input"
              type="password"
              placeholder="API Key"
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              className="rounded-xl border border-[var(--sage-200)] px-4 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--coral)]"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-full border border-[var(--sage-200)] text-[var(--ink-soft)] text-sm hover:bg-[var(--paper)] transition-colors"
            >
              Cancel
            </button>
            <button
              id="confirm-add-model-btn"
              type="button"
              onClick={handleAdd}
              disabled={!form.model.trim() || !form.apiKey.trim()}
              className="px-4 py-2 rounded-full bg-[var(--coral)] text-white text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              Add Model
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {providers.length === 0 ? (
          <div className="bg-[var(--paper)] rounded-2xl border border-[var(--sage-200)] p-10 text-center shadow-xs">
            <div className="text-4xl mb-3">🤖</div>
            <p className="font-medium text-[var(--ink)] mb-1">No AI models added yet</p>
            <p className="text-sm text-[var(--ink-soft)]">
              Click <strong>Add Model</strong> above to configure your first provider.
            </p>
          </div>
        ) : (
          providers.map((p) => (
            <div
              key={p.id}
              className="bg-[var(--paper)] rounded-2xl border border-[var(--sage-200)] p-4 shadow-xs flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-white flex items-center justify-center border border-[var(--sage-200)]">
                  <img
                    src={p.icon}
                    alt={p.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-[var(--ink)] text-sm truncate">{p.name}</p>
                  <p className="text-xs font-mono text-[var(--ink-soft)] truncate">{p.model}</p>
                </div>
                {p.rateLimited && (
                  <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-mono">
                    Rate Limited
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  title={p.enabled ? 'Disable' : 'Enable'}
                  onClick={() => setProviders(toggleProvider(p.id))}
                  className={`p-2 rounded-full transition-colors ${
                    p.enabled
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                  }`}
                >
                  <Power className="w-4 h-4" strokeWidth={1.6} />
                </button>
                <button
                  type="button"
                  title="Remove"
                  onClick={() => setProviders(removeProvider(p.id))}
                  className="p-2 rounded-full text-[var(--ink-soft)] hover:bg-rose-100 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={1.6} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {providers.length > 0 && (
        <button
          type="button"
          id="reset-rate-limits-btn"
          onClick={() => setProviders(resetAllRateLimits())}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--sage-200)] text-[var(--teal-900)] text-sm hover:bg-[var(--sage-200)] transition-colors"
        >
          <RefreshCw className="w-4 h-4" strokeWidth={1.6} />
          Reset All Rate Limits
        </button>
      )}
    </section>
  )
}
