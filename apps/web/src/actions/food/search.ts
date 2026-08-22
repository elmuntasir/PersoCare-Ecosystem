'use server'

import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { searchFoodExternal, getFoodDetailsExternal } from './external'

// ─── Search (Cache‑First) ──────────────────────────────────

export async function searchFood(query: string) {
  if (!query || query.trim().length < 2) return []
  const cleanQuery = query.trim()

  const user = await getSessionUser()
  const userId = user?.id

  // 1. Try global cache (raw & common processed foods)
  const globalResults = await prisma.cachedFood.findMany({
    where: {
      name: { contains: cleanQuery, mode: 'insensitive' },
      isGlobal: true,
    },
    orderBy: { popularity: 'desc' },
    take: 10,
  })

  // If we have enough global results (>= 5), return them immediately
  if (globalResults.length >= 5) {
    await prisma.cachedFood.updateMany({
      where: { id: { in: globalResults.map((f) => f.id) } },
      data: { popularity: { increment: 1 } },
    })
    return globalResults
  }

  // 2. Check user‑specific cache (for branded/regional foods)
  let userResults: any[] = []
  if (userId) {
    userResults = await prisma.userCachedFood.findMany({
      where: {
        userId,
        name: { contains: cleanQuery, mode: 'insensitive' },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })
  }

  // 3. Call external APIs (FatSecret, etc.)
  const externalResults = await searchFoodExternal(cleanQuery)

  // 4. Store external results into appropriate cache
  for (const item of externalResults) {
    try {
      const isProcessed = Boolean(item.brand && item.brand.trim() !== '')
      if (!isProcessed) {
        // Raw/whole food → global cache
        await prisma.cachedFood.upsert({
          where: { source_sourceId: { source: item.source, sourceId: item.sourceId } },
          update: {
            name: item.name,
            nutrients: item.nutrients,
            lastUpdated: new Date(),
          },
          create: {
            source: item.source,
            sourceId: item.sourceId,
            name: item.name,
            brand: item.brand,
            category: item.category,
            nutrients: item.nutrients,
            servingSize: item.servingSize,
            unit: item.unit,
            isGlobal: true,
            isProcessed: false,
          },
        })
      } else if (userId) {
        // Processed/branded → user‑specific cache
        await prisma.userCachedFood.upsert({
          where: {
            userId_sourceId: {
              userId,
              sourceId: item.sourceId,
            },
          },
          update: {
            name: item.name,
            brand: item.brand,
            nutrients: item.nutrients,
            lastUpdated: new Date(),
          },
          create: {
            userId,
            sourceId: item.sourceId,
            name: item.name,
            brand: item.brand,
            nutrients: item.nutrients,
            servingSize: item.servingSize,
            unit: item.unit,
          },
        })
      }
    } catch (e) {
      console.error('Failed to cache food item:', e)
    }
  }

  // Combine all results (global + user + external) with dedup
  const all = [...globalResults, ...userResults, ...externalResults]
  const seen = new Set<string>()
  const unique = all.filter((item) => {
    const key = (item.name || '').toLowerCase()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })

  return unique.slice(0, 20)
}

// ─── Get Food Details ──────────────────────────────────────

export async function getFoodDetails(id: string, type: 'global' | 'user' | 'external') {
  if (type === 'global') {
    return await prisma.cachedFood.findUnique({ where: { id } })
  }
  if (type === 'user') {
    const user = await getSessionUser()
    if (!user) throw new Error('Unauthorized')
    return await prisma.userCachedFood.findFirst({
      where: { id, userId: user.id },
    })
  }
  return await getFoodDetailsExternal(id)
}
