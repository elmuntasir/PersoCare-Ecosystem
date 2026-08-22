import { prisma } from '@/lib/prisma'

const MEDEX_BASE_URL =
  process.env.MEDEX_API_BASE_URL ||
  'https://api.parse.bot/scraper/af459ee7-7e72-4a74-93d3-09da010d2026'
const OPENFDA_BASE_URL = process.env.OPENFDA_API_BASE_URL || 'https://api.fda.gov'
const RXNORM_BASE_URL = process.env.RXNORM_API_BASE_URL || 'https://rxnav.nlm.nih.gov/REST'
const MEDEX_API_KEY = process.env.MEDEX_API_KEY
const OPENFDA_API_KEY = process.env.OPENFDA_API_KEY

type FetchJsonOptions = {
  timeoutMs?: number
}

type JsonObject = Record<string, unknown>

async function fetchJson<T>(url: string, options: RequestInit & FetchJsonOptions = {}): Promise<T> {
  const { timeoutMs = 12_000, ...requestInit } = options
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      ...requestInit,
      signal: controller.signal,
      cache: 'no-store',
    })
    if (!response.ok) {
      throw new Error(`Request failed (${response.status}) for ${url}`)
    }
    return (await response.json()) as T
  } finally {
    clearTimeout(timeout)
  }
}

function cleanText(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim()
}

function uniqStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => cleanText(value))
        .filter((value) => Boolean(value))
    )
  )
}

function asRecord(value: unknown): JsonObject | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as JsonObject
}

function getNestedRecord(value: unknown, ...path: string[]): JsonObject | null {
  let current: unknown = value

  for (const key of path) {
    const record = asRecord(current)
    if (!record) return null
    current = record[key]
  }

  return asRecord(current)
}

function collectTexts(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value]
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }

  return []
}

export type DrugSearchResult = {
  source: 'MEDEX'
  label: string
  brandId: string
  slug: string
  medexUrl?: string
  company?: string
  genericName?: string
  rxnorm?: {
    rxcui?: string
    name?: string
  }
}

export type DrugDetails = {
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
    raw?: unknown
  }
  rxnorm?: {
    rxcui?: string
    name?: string
    synonym?: string
    raw?: unknown
  }
  openfda?: {
    genericName?: string | null
    brandName?: string | null
    substanceName?: string | null
    indications: string[]
    warnings: string[]
    adverseReactions: string[]
    dosageAndAdministration: string[]
    purpose: string[]
    raw?: unknown
  }
  highlights: string[]
}

async function searchMedex(query: string): Promise<DrugSearchResult[]> {
  if (!MEDEX_API_KEY) return []

  const url = new URL(`${MEDEX_BASE_URL}/search_medicines`)
  url.searchParams.set('query', query)

  const payload = await fetchJson<unknown>(url.toString(), {
    headers: {
      'X-API-Key': MEDEX_API_KEY,
    },
  })

  const payloadRecord = asRecord(payload)
  const brandsCandidate = getNestedRecord(payloadRecord, 'data')?.brands
    ?? payloadRecord?.brands
    ?? []
  const brands = Array.isArray(brandsCandidate) ? brandsCandidate : []

  return brands.slice(0, 10).map((brand) => {
    const brandRecord = asRecord(brand)

    return {
    source: 'MEDEX',
      label: cleanText(
        brandRecord?.name || brandRecord?.brand_name || brandRecord?.generic || query
      ),
      brandId: String(brandRecord?.id || ''),
      slug: String(brandRecord?.slug || ''),
      medexUrl: typeof brandRecord?.url === 'string' ? brandRecord.url : undefined,
      company: cleanText(brandRecord?.company) || undefined,
      genericName: cleanText(brandRecord?.generic) || undefined,
    }
  })
}

async function getMedexBrandDetail(brandId: string, slug: string) {
  if (!MEDEX_API_KEY) return null

  const url = new URL(`${MEDEX_BASE_URL}/get_brand_detail`)
  url.searchParams.set('brand_id', brandId)
  url.searchParams.set('slug', slug)

  return fetchJson<unknown>(url.toString(), {
    headers: {
      'X-API-Key': MEDEX_API_KEY,
    },
  })
}

async function searchRxNorm(query: string) {
  const url = new URL(`${RXNORM_BASE_URL}/approximateTerm.json`)
  url.searchParams.set('term', query)
  url.searchParams.set('maxEntries', '5')
  url.searchParams.set('option', '1')

  const payload = await fetchJson<unknown>(url.toString())
  const approximateGroup = getNestedRecord(payload, 'approximateGroup')
  const candidateList = approximateGroup?.candidate
    ? Array.isArray(approximateGroup.candidate)
      ? approximateGroup.candidate
      : [approximateGroup.candidate]
    : []
  const candidates = candidateList.map((candidate) => asRecord(candidate)).filter(Boolean) as JsonObject[]

  const top = candidates[0]
  const topRxcui = top ? cleanText(top.rxcui) : ''
  if (!topRxcui) {
    return null
  }

  const properties = await fetchJson<unknown>(`${RXNORM_BASE_URL}/rxcui/${topRxcui}/properties.json`)
  const prop =
    getNestedRecord(properties, 'properties') ??
    getNestedRecord(properties, 'propConceptGroup', 'propConcept') ??
    asRecord(properties)

  return {
    rxcui: String(topRxcui),
    name: cleanText(prop?.name || top.name || top.synonym),
    synonym: cleanText(top.synonym) || undefined,
    raw: { candidate: top, properties },
  }
}

async function getRxNormByRxcui(rxcui: string) {
  const properties = await fetchJson<unknown>(`${RXNORM_BASE_URL}/rxcui/${rxcui}/properties.json`)
  const prop =
    getNestedRecord(properties, 'properties') ??
    getNestedRecord(properties, 'propConceptGroup', 'propConcept') ??
    asRecord(properties)

  if (!prop?.rxcui) return null

  return {
    rxcui: String(prop.rxcui),
    name: cleanText(prop?.name),
    synonym: cleanText(prop?.synonym) || undefined,
    raw: { properties },
  }
}

async function searchOpenFda(ingredientName: string) {
  const candidates = uniqStrings([
    ingredientName,
    ingredientName.replace(/\b(\d+\s*mg|\d+\s*mcg|\d+\s*g)\b/gi, ''),
  ])

  for (const candidate of candidates) {
    const queries = [
      `openfda.generic_name:"${candidate}"`,
      `openfda.substance_name:"${candidate}"`,
      `openfda.brand_name:"${candidate}"`,
    ]

    for (const search of queries) {
      const url = new URL(`${OPENFDA_BASE_URL}/drug/label.json`)
      url.searchParams.set('search', search)
      url.searchParams.set('limit', '1')
      if (OPENFDA_API_KEY) {
        url.searchParams.set('api_key', OPENFDA_API_KEY)
      }

      try {
        const payload = await fetchJson<unknown>(url.toString())
        const results = asRecord(payload)?.results
        const first = Array.isArray(results) ? asRecord(results[0]) : null
        if (!first) continue
        const openfda = asRecord(first.openfda)

        return {
          genericName: collectTexts(openfda?.generic_name)[0] ?? null,
          brandName: collectTexts(openfda?.brand_name)[0] ?? null,
          substanceName: collectTexts(openfda?.substance_name)[0] ?? null,
          indications: uniqStrings(collectTexts(first.indications_and_usage)),
          warnings: uniqStrings([
            ...collectTexts(first.warnings),
            ...collectTexts(first.warnings_and_cautions),
          ]),
          adverseReactions: uniqStrings(collectTexts(first.adverse_reactions)),
          dosageAndAdministration: uniqStrings(collectTexts(first.dosage_and_administration)),
          purpose: uniqStrings(collectTexts(first.purpose)),
          raw: first,
        }
      } catch {
        // Try the next query candidate.
      }
    }
  }

  return null
}

export async function searchDrugCatalog(query: string): Promise<DrugSearchResult[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const medexResults = await searchMedex(trimmed).catch(() => [])
  const ingredientQuery = medexResults[0]?.genericName || trimmed
  const rxnormResult =
    (await searchRxNorm(ingredientQuery).catch(() => null)) ||
    (ingredientQuery !== trimmed ? await searchRxNorm(trimmed).catch(() => null) : null)

  return medexResults.map((result) => ({
    ...result,
    rxnorm: rxnormResult
      ? {
          rxcui: rxnormResult.rxcui,
          name: rxnormResult.name,
        }
      : undefined,
  }))
}

export async function getDrugDetailsFromSource(input: {
  query: string
  medexBrandId?: string | null
  medexSlug?: string | null
  medexUrl?: string | null
  medicineName?: string | null
  genericName?: string | null
  rxnormRxcui?: string | null
  rxnormName?: string | null
}): Promise<DrugDetails> {
  const query = cleanText(input.query || input.medicineName || input.genericName || '')
  const medexBrandId = cleanText(input.medexBrandId)
  const medexSlug = cleanText(input.medexSlug)
  const medexUrl = cleanText(input.medexUrl)

  let medexDetail: unknown = null
  if (medexBrandId && medexSlug) {
    medexDetail = await getMedexBrandDetail(medexBrandId, medexSlug).catch(() => null)
  } else if (query) {
    const searchResults = await searchMedex(query).catch(() => [])
    const first = searchResults[0]
    if (first?.brandId && first.slug) {
      medexDetail = await getMedexBrandDetail(first.brandId, first.slug).catch(() => null)
    }
  }

  const medexTop = asRecord(medexDetail)
  const medexData = getNestedRecord(medexDetail, 'data')
  const medexBrand = medexData ? getNestedRecord(medexData, 'brand') : null

  const medex = medexDetail
    ? {
        brandId: medexBrandId || cleanText(medexData?.id) || cleanText(medexTop?.id),
        slug: medexSlug || cleanText(medexData?.slug) || cleanText(medexTop?.slug),
        url:
          medexUrl ||
          cleanText(medexData?.url) ||
          cleanText(medexTop?.url) ||
          cleanText(medexBrand?.url),
        name:
          cleanText(medexData?.name) ||
          cleanText(medexData?.brand_name) ||
          cleanText(medexTop?.name) ||
          cleanText(medexBrand?.name) ||
          undefined,
        company:
          cleanText(medexData?.company) ||
          cleanText(medexTop?.company) ||
          cleanText(medexBrand?.company) ||
          undefined,
        genericName:
          cleanText(medexData?.generic) ||
          cleanText(medexTop?.generic) ||
          cleanText(medexBrand?.generic) ||
          undefined,
        unitPrice: (medexData?.unit_price ?? medexTop?.unit_price ?? null) as string | number | null,
        sections: (medexData?.sections ?? medexTop?.sections ?? undefined) as
          | Record<string, unknown>
          | undefined,
        raw: medexDetail,
      }
    : undefined

  const ingredientQuery = cleanText(
    medex?.genericName ||
      input.genericName ||
      input.rxnormName ||
      query
  ) || query

  const rxnorm = input.rxnormRxcui
    ? await getRxNormByRxcui(input.rxnormRxcui).catch(() => null)
    : ingredientQuery
      ? await searchRxNorm(ingredientQuery).catch(() => null)
      : null

  const effectiveGeneric = cleanText(medex?.genericName || input.genericName || rxnorm?.name || query) || query

  const openfda = effectiveGeneric ? await searchOpenFda(effectiveGeneric).catch(() => null) : null

  const highlights = uniqStrings([
    medex?.company ? `Brand by ${medex.company}` : null,
    medex?.genericName ? `Generic: ${medex.genericName}` : null,
    rxnorm?.name ? `RxNorm: ${rxnorm.name}` : null,
    openfda?.warnings[0] ?? null,
    openfda?.indications[0] ?? null,
  ])

  return {
    query,
    medex,
    rxnorm: rxnorm
      ? {
          rxcui: rxnorm.rxcui,
          name: rxnorm.name,
          synonym: rxnorm.synonym,
          raw: rxnorm.raw,
        }
      : undefined,
    openfda: openfda
      ? {
          genericName: openfda.genericName,
          brandName: openfda.brandName,
          substanceName: openfda.substanceName,
          indications: openfda.indications,
          warnings: openfda.warnings,
          adverseReactions: openfda.adverseReactions,
          dosageAndAdministration: openfda.dosageAndAdministration,
          purpose: openfda.purpose,
          raw: openfda.raw,
        }
      : undefined,
    highlights,
  }
}

export async function getDrugDetailsForPrescriptionMedicine(prescriptionMedicineId: string) {
  const med = await prisma.prescriptionMedicine.findUnique({
    where: { id: prescriptionMedicineId },
    include: {
      prescription: {
        include: {
          appointment: {
            select: {
              patientId: true,
              organizationId: true,
            },
          },
        },
      },
    },
  })

  if (!med) throw new Error('Prescription medicine not found')

  const meta = (med.drugMetadata as Record<string, unknown> | null) || {}
  const details = await getDrugDetailsFromSource({
    query: med.medicineName,
    medexBrandId: med.medexBrandId,
    medexSlug: med.medexSlug,
    medexUrl: med.medexUrl,
    medicineName: med.medicineName,
    genericName: med.genericName || (typeof meta.genericName === 'string' ? meta.genericName : undefined),
    rxnormRxcui: med.rxnormRxcui,
    rxnormName: med.rxnormName,
  })

  return {
    prescriptionMedicine: med,
    details,
  }
}
