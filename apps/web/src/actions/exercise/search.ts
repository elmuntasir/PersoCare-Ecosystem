'use server'

import { prisma } from '@/lib/prisma'
import { searchExercisesExternal } from './external'

export async function searchExercises(query: string) {
  if (!query || query.trim().length < 1) return []
  const cleanQuery = query.trim()

  // 1. Check global cache
  const cached = await prisma.cachedExercise.findMany({
    where: {
      name: { contains: cleanQuery, mode: 'insensitive' },
    },
    orderBy: { popularity: 'desc' },
    take: 20,
  })

  if (cached.length >= 5) {
    await prisma.cachedExercise.updateMany({
      where: { id: { in: cached.map((e) => e.id) } },
      data: { popularity: { increment: 1 } },
    })
    return cached
  }

  // 2. Call external API
  const external = await searchExercisesExternal(cleanQuery)

  // 3. Store in global cache
  for (const ex of external) {
    try {
      await prisma.cachedExercise.upsert({
        where: { name: ex.name },
        update: {
          type: ex.type,
          muscle: ex.muscle,
          equipment: ex.equipment,
          difficulty: ex.difficulty,
          instructions: ex.instructions,
          metBase: ex.metBase,
          lastUpdated: new Date(),
        },
        create: {
          name: ex.name,
          type: ex.type,
          muscle: ex.muscle,
          equipment: ex.equipment,
          difficulty: ex.difficulty,
          instructions: ex.instructions,
          metBase: ex.metBase,
        },
      })
    } catch (e) {
      console.error('Failed to cache exercise:', e)
    }
  }

  // Combine cached + external and deduplicate
  const all = [...cached, ...external]
  const seen = new Set<string>()
  return all.filter((item) => {
    const key = (item.name || '').toLowerCase()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}
