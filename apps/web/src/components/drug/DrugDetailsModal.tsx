'use client'

import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { AlertTriangle, BadgeInfo, ExternalLink, FileText, ShieldCheck, Sparkles, X } from 'lucide-react'

type DrugDetailsResponse = {
  prescriptionMedicineId?: string
  medicineName?: string
  dosage?: string
  frequency?: string
  duration?: string
  metadata?: unknown
  details: {
    query: string
    medex?: {
      brandId?: string
      slug?: string
      url?: string
      name?: string
      company?: string
      genericName?: string
      unitPrice?: string | number | null
      sections?: Record<string, unknown>
    }
    rxnorm?: {
      rxcui?: string
      name?: string
      synonym?: string
    }
    openfda?: {
      indications: string[]
      warnings: string[]
      adverseReactions: string[]
      dosageAndAdministration: string[]
      purpose: string[]
    }
    highlights: string[]
  }
}

type Props = {
  open: boolean
  prescriptionMedicineId: string | null
  medicineName?: string
  onClose: () => void
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-[var(--teal-900)]" strokeWidth={1.8} />
        <h4 className="font-semibold text-[var(--teal-900)]">{title}</h4>
      </div>
      {children}
    </section>
  )
}

export function DrugDetailsModal({
  open,
  prescriptionMedicineId,
  medicineName,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [payload, setPayload] = useState<DrugDetailsResponse | null>(null)

  useEffect(() => {
    if (!open || !prescriptionMedicineId) {
      if (!open) {
        return
      }
    }

    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const url = prescriptionMedicineId
          ? `/api/drugs/details?prescriptionMedicineId=${encodeURIComponent(prescriptionMedicineId)}`
          : `/api/drugs/details?medicineName=${encodeURIComponent(medicineName || '')}`

        const response = await fetch(url, { signal: controller.signal })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data?.error || 'Failed to load medicine details')
        }
        setPayload(data)
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load medicine details')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    load()
    return () => controller.abort()
  }, [open, prescriptionMedicineId, medicineName])

  if (!open) return null

  const details = payload?.details
  const medex = details?.medex
  const openfda = details?.openfda
  const rxnorm = details?.rxnorm

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl">
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-[var(--sage-200)] bg-white px-6 py-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-[11px] font-mono uppercase tracking-[0.16em] text-[var(--teal-900)]">
              <BadgeInfo className="h-3.5 w-3.5" strokeWidth={2} />
              Medicine Details
            </div>
            <h3 className="mt-3 font-display text-2xl text-[var(--teal-900)]">
              {medicineName || payload?.medicineName || 'Medicine'}
            </h3>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              MedEx, RxNorm, and OpenFDA data combined in one view.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--sage-200)] p-2 text-[var(--ink-soft)] transition-colors hover:bg-[var(--paper)]"
            title="Close"
          >
            <X className="h-5 w-5" strokeWidth={1.8} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {loading ? (
            <div className="rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)] p-8 text-center text-sm text-[var(--ink-soft)]">
              Loading medicine information...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
              {error}
            </div>
          ) : (
            <>
              {details?.highlights?.length ? (
                <Section title="Quick Highlights" icon={Sparkles}>
                  <div className="flex flex-wrap gap-2">
                    {details.highlights.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-[var(--sage-200)] bg-white px-3 py-1 text-xs text-[var(--ink-soft)]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </Section>
              ) : null}

              {medex ? (
                <Section title="MedEx Listing" icon={FileText}>
                  <div className="space-y-2 text-sm text-[var(--ink)]">
                    <p className="font-semibold text-[var(--teal-900)]">{medex.name || medicineName}</p>
                    <p className="text-[var(--ink-soft)]">
                      {medex.company || 'Unknown company'}
                      {medex.genericName ? ` · ${medex.genericName}` : ''}
                    </p>
                    {medex.unitPrice ? (
                      <p className="text-[var(--ink-soft)]">Unit price: {String(medex.unitPrice)}</p>
                    ) : null}
                    {medex.url ? (
                      <a
                        href={medex.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--coral)] hover:underline"
                      >
                        Open MedEx listing
                        <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.8} />
                      </a>
                    ) : null}
                  </div>
                </Section>
              ) : null}

              {rxnorm ? (
                <Section title="RxNorm Standardization" icon={ShieldCheck}>
                  <div className="space-y-2 text-sm text-[var(--ink)]">
                    <p className="font-semibold text-[var(--teal-900)]">{rxnorm.name || 'Standardized drug name unavailable'}</p>
                    {rxnorm.rxcui ? <p className="text-[var(--ink-soft)]">RxCUI: {rxnorm.rxcui}</p> : null}
                    {rxnorm.synonym ? <p className="text-[var(--ink-soft)]">Synonym: {rxnorm.synonym}</p> : null}
                  </div>
                </Section>
              ) : null}

              {openfda ? (
                <Section title="OpenFDA Clinical Summary" icon={AlertTriangle}>
                  <div className="space-y-4 text-sm">
                    {openfda.indications.length > 0 && (
                      <div>
                        <p className="mb-1 font-semibold text-[var(--teal-900)]">Indications</p>
                        <ul className="list-disc space-y-1 pl-5 text-[var(--ink-soft)]">
                          {openfda.indications.slice(0, 3).map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {openfda.purpose.length > 0 && (
                      <div>
                        <p className="mb-1 font-semibold text-[var(--teal-900)]">Purpose</p>
                        <ul className="list-disc space-y-1 pl-5 text-[var(--ink-soft)]">
                          {openfda.purpose.slice(0, 3).map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {openfda.dosageAndAdministration.length > 0 && (
                      <div>
                        <p className="mb-1 font-semibold text-[var(--teal-900)]">Dosage & Administration</p>
                        <ul className="list-disc space-y-1 pl-5 text-[var(--ink-soft)]">
                          {openfda.dosageAndAdministration.slice(0, 3).map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {openfda.warnings.length > 0 && (
                      <div>
                        <p className="mb-1 font-semibold text-[var(--teal-900)]">Warnings</p>
                        <ul className="list-disc space-y-1 pl-5 text-[var(--ink-soft)]">
                          {openfda.warnings.slice(0, 3).map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {openfda.adverseReactions.length > 0 && (
                      <div>
                        <p className="mb-1 font-semibold text-[var(--teal-900)]">Adverse Reactions</p>
                        <ul className="list-disc space-y-1 pl-5 text-[var(--ink-soft)]">
                          {openfda.adverseReactions.slice(0, 3).map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Section>
              ) : null}

              {!medex && !rxnorm && !openfda && !loading ? (
                <div className="rounded-2xl border border-dashed border-[var(--sage-200)] bg-[var(--paper)] p-6 text-sm text-[var(--ink-soft)]">
                  No external medicine details were available for this prescription entry.
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
