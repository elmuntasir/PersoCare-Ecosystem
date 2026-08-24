'use client'

import { useState } from 'react'
import { useAvatar } from '@/contexts/AvatarContext'
import { addProvider, removeProvider, toggleProvider, resetAllRateLimits } from '@/lib/ai/providers'
import { PROVIDER_ICONS } from '@/lib/avatar/registry'
import { discoverModels } from '@/actions/ai/discoverModels'
import type { ModelInfo } from '@/types/ai-provider'
import { Plus, Trash2, Power, RefreshCw, Globe, Sparkles, Loader2, AlertCircle, Layers } from 'lucide-react'

const PROVIDER_OPTIONS = [
  { value: 'groq', label: 'Groq (High Speed)' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'google', label: 'Google (Gemini)' },
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'ollama', label: 'Ollama (Local)' },
  { value: 'custom', label: 'Custom (OpenAI-compatible)' },
]

export function AIConfigSection() {
  const { providers, setProviders, roundRobinEnabled, setRoundRobinEnabled } = useAvatar()
  const [form, setForm] = useState({
    providerKey: 'groq',
    model: '',
    apiKey: '',
    baseUrl: '',
    contextWindow: undefined as number | undefined,
  })
  const [showForm, setShowForm] = useState(false)
  const [discovered, setDiscovered] = useState<ModelInfo[]>([])
  const [discoverState, setDiscoverState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [discoverError, setDiscoverError] = useState('')
  const [isManualEntry, setIsManualEntry] = useState(false)

  const needsApiKey = form.providerKey !== 'ollama'
  const needsBaseUrl = form.providerKey === 'ollama' || form.providerKey === 'custom'

  const handleDiscover = async () => {
    setDiscoverState('loading')
    setDiscoverError('')
    try {
      let models: ModelInfo[] = []
      // If Ollama on localhost, try direct client fetch if server fetch fails
      if (form.providerKey === 'ollama') {
        try {
          models = await discoverModels(form.providerKey, form.apiKey, form.baseUrl)
        } catch {
          const clientUrl = (form.baseUrl || 'http://localhost:11434').replace(/\/$/, '')
          const res = await fetch(`${clientUrl}/api/tags`)
          if (!res.ok) throw new Error(`Ollama connection failed: ${res.statusText}`)
          const data = await res.json()
          models = (data.models || []).map((m: any) => ({
            id: m.model || m.name,
            displayName: m.name || m.model,
            capabilities: m.details?.family ? [m.details.family, m.details.parameter_size].filter(Boolean) : undefined,
          }))
        }
      } else {
        models = await discoverModels(form.providerKey, form.apiKey, form.baseUrl)
      }

      setDiscovered(models)
      if (models.length > 0) {
        setForm((prev) => ({
          ...prev,
          model: models[0].id,
          contextWindow: models[0].contextWindow,
        }))
      }
      setDiscoverState('idle')
    } catch (err: any) {
      setDiscoverState('error')
      setDiscoverError(err.message || 'Failed to fetch models from provider')
    }
  }

  const handleAdd = () => {
    if (!form.model.trim()) return
    if (needsApiKey && !form.apiKey.trim()) return

    const updated = addProvider({
      name: `${PROVIDER_OPTIONS.find((p) => p.value === form.providerKey)?.label.split(' ')[0] || form.providerKey}/${form.model}`,
      model: form.model.trim(),
      apiKey: form.apiKey.trim(),
      providerKey: form.providerKey,
      baseUrl: form.baseUrl.trim() || undefined,
      contextWindow: form.contextWindow,
      icon: PROVIDER_ICONS[form.providerKey] ?? PROVIDER_ICONS.default,
      enabled: true,
    })

    setProviders(updated)
    setForm({ providerKey: 'groq', model: '', apiKey: '', baseUrl: '', contextWindow: undefined })
    setDiscovered([])
    setShowForm(false)
    setIsManualEntry(false)
  }

  return (
    <section className="bg-white rounded-3xl border border-[var(--sage-200)] p-6 md:p-8 shadow-xs space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-[var(--coral)] mb-0.5">
            Configuration
          </p>
          <h2 className="font-display text-2xl text-[var(--teal-900)]">AI Config</h2>
          <p className="text-sm text-[var(--ink-soft)] mt-1">
            Add providers, discover active models, and manage intelligent fallback routing.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowForm((v) => !v)
            setDiscoverState('idle')
            setDiscoverError('')
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--teal-900)] text-white text-sm font-medium hover:bg-[var(--teal-700)] transition-colors shadow-sm cursor-pointer"
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
              Auto-switch to the next enabled provider/model when rate-limited
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
        <div className="bg-[var(--paper)] rounded-2xl border border-[var(--sage-200)] p-5 shadow-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-[var(--ink)] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--coral)]" />
              Configure AI Provider & Model
            </h3>
            <button
              type="button"
              onClick={() => setIsManualEntry((v) => !v)}
              className="text-xs text-[var(--ink-soft)] hover:text-[var(--teal-900)] underline"
            >
              {isManualEntry ? 'Use Auto-Discovery' : 'Enter Model Manually'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-mono text-[var(--ink-soft)] mb-1 uppercase tracking-wider">
                Provider
              </label>
              <select
                id="provider-select"
                value={form.providerKey}
                onChange={(e) => {
                  setForm({
                    ...form,
                    providerKey: e.target.value,
                    model: '',
                    baseUrl: e.target.value === 'ollama' ? 'http://localhost:11434' : '',
                    contextWindow: undefined,
                  })
                  setDiscovered([])
                  setDiscoverState('idle')
                  setDiscoverError('')
                }}
                className="w-full rounded-xl border border-[var(--sage-200)] px-3.5 py-2.5 text-sm bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--coral)]"
              >
                {PROVIDER_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {needsBaseUrl && (
              <div>
                <label className="block text-xs font-mono text-[var(--ink-soft)] mb-1 uppercase tracking-wider">
                  Base URL
                </label>
                <input
                  type="text"
                  placeholder={form.providerKey === 'ollama' ? 'http://localhost:11434' : 'https://api.openai.com/v1'}
                  value={form.baseUrl}
                  onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                  className="w-full rounded-xl border border-[var(--sage-200)] px-3.5 py-2.5 text-sm bg-white text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--coral)]"
                />
              </div>
            )}

            {needsApiKey && (
              <div className={needsBaseUrl ? 'md:col-span-1' : 'md:col-span-2'}>
                <label className="block text-xs font-mono text-[var(--ink-soft)] mb-1 uppercase tracking-wider">
                  API Key
                </label>
                <input
                  id="api-key-input"
                  type="password"
                  placeholder={`Enter ${PROVIDER_OPTIONS.find((p) => p.value === form.providerKey)?.label.split(' ')[0]} API Key`}
                  value={form.apiKey}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                  className="w-full rounded-xl border border-[var(--sage-200)] px-3.5 py-2.5 text-sm bg-white text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--coral)]"
                />
              </div>
            )}
          </div>

          {!isManualEntry ? (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDiscover}
                  disabled={(needsApiKey && !form.apiKey.trim()) || discoverState === 'loading'}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--teal-900)] text-white text-sm font-medium hover:bg-[var(--teal-700)] transition-colors disabled:opacity-40 shadow-xs cursor-pointer"
                >
                  {discoverState === 'loading' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Discovering Models...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Discover Models
                    </>
                  )}
                </button>
                <span className="text-xs text-[var(--ink-soft)]">
                  Fetches live available models directly from provider API.
                </span>
              </div>

              {discoverState === 'error' && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Discovery failed</p>
                    <p className="mt-0.5">{discoverError}</p>
                  </div>
                </div>
              )}

              {discovered.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-mono text-[var(--ink-soft)] uppercase tracking-wider">
                    Select Model ({discovered.length} Available)
                  </p>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1 rounded-xl">
                    {discovered.map((m) => (
                      <label
                        key={m.id}
                        className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-sm cursor-pointer transition-all ${
                          form.model === m.id
                            ? 'border-[var(--coral)] bg-[var(--coral)]/5 shadow-xs'
                            : 'border-[var(--sage-200)] bg-white hover:border-[var(--sage-400)]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="radio"
                            name="discovered-model"
                            checked={form.model === m.id}
                            onChange={() =>
                              setForm((prev) => ({
                                ...prev,
                                model: m.id,
                                contextWindow: m.contextWindow,
                              }))
                            }
                            className="text-[var(--coral)] focus:ring-[var(--coral)]"
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-[var(--ink)] truncate">{m.displayName}</p>
                            <p className="text-xs font-mono text-[var(--ink-soft)] truncate">{m.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                          {m.contextWindow && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--sage-200)] text-[var(--teal-900)]">
                              {(m.contextWindow / 1000).toFixed(0)}k ctx
                            </span>
                          )}
                          {m.capabilities?.map((c) => (
                            <span
                              key={c}
                              className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--teal-900)]/10 text-[var(--teal-900)]"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="pt-2">
              <label className="block text-xs font-mono text-[var(--ink-soft)] mb-1 uppercase tracking-wider">
                Model Name / Identifier
              </label>
              <input
                type="text"
                placeholder="e.g., llama-3.3-70b-versatile, gpt-4o, claude-3-5-sonnet-20241022"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="w-full rounded-xl border border-[var(--sage-200)] px-3.5 py-2.5 text-sm bg-white text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--coral)]"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--sage-200)]">
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setDiscovered([])
              }}
              className="px-4 py-2 rounded-full border border-[var(--sage-200)] text-[var(--ink-soft)] text-sm hover:bg-[var(--sage-100)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="confirm-add-model-btn"
              type="button"
              onClick={handleAdd}
              disabled={!form.model.trim() || (needsApiKey && !form.apiKey.trim())}
              className="px-5 py-2 rounded-full bg-[var(--coral)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 cursor-pointer shadow-sm"
            >
              Add Model
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {providers.length === 0 ? (
          <div className="bg-[var(--paper)] rounded-2xl border border-[var(--sage-200)] p-10 text-center shadow-xs">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[var(--teal-900)]/10 flex items-center justify-center text-2xl">
              🤖
            </div>
            <p className="font-medium text-[var(--ink)] mb-1">No AI models added yet</p>
            <p className="text-sm text-[var(--ink-soft)]">
              Click <strong>Add Model</strong> above to configure your Groq, OpenAI, Gemini, or local models.
            </p>
          </div>
        ) : (
          providers.map((p) => (
            <div
              key={p.id}
              className="bg-[var(--paper)] rounded-2xl border border-[var(--sage-200)] p-4 shadow-xs flex items-center justify-between gap-4 hover:border-[var(--sage-300)] transition-all"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-white flex items-center justify-center border border-[var(--sage-200)] shadow-2xs">
                  <img
                    src={p.icon}
                    alt={p.name}
                    className="w-full h-full object-contain p-1"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[var(--ink)] text-sm truncate">{p.name}</p>
                    {p.contextWindow && (
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-[var(--sage-200)] text-[var(--teal-900)]">
                        {(p.contextWindow / 1000).toFixed(0)}k ctx
                      </span>
                    )}
                  </div>
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
                  className={`p-2 rounded-full transition-colors cursor-pointer ${
                    p.enabled
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                  }`}
                >
                  <Power className="w-4 h-4" strokeWidth={1.8} />
                </button>
                <button
                  type="button"
                  title="Remove"
                  onClick={() => setProviders(removeProvider(p.id))}
                  className="p-2 rounded-full text-[var(--ink-soft)] hover:bg-rose-100 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={1.8} />
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
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--sage-200)] text-[var(--teal-900)] text-sm hover:bg-[var(--sage-200)] transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" strokeWidth={1.6} />
          Reset All Rate Limits
        </button>
      )}
    </section>
  )
}
