'use server'

const EXERCISEDB_API_KEY = process.env.EXERCISEDB_API_KEY
const BASE_URL = 'https://api.api-ninjas.com/v1/exercises'

const MET_BY_TYPE: Record<string, number> = {
  cardio: 7,
  strength: 5,
  yoga: 3,
  stretching: 2.5,
  sports: 8,
}

export async function searchExercisesExternal(query: string, limit: number = 20) {
  if (!EXERCISEDB_API_KEY) {
    return []
  }

  try {
    const response = await fetch(
      `${BASE_URL}?name=${encodeURIComponent(query)}&limit=${limit}`,
      {
        headers: { 'X-Api-Key': EXERCISEDB_API_KEY },
        next: { revalidate: 86400 },
      }
    )

    if (!response.ok) return []

    const data = await response.json()
    if (!Array.isArray(data)) return []

    return data.map((ex: any) => ({
      name: ex.name,
      type: ex.type || 'cardio',
      muscle: ex.muscle || null,
      equipment: ex.equipment || null,
      difficulty: ex.difficulty || null,
      instructions: ex.instructions || null,
      metBase: MET_BY_TYPE[ex.type] || 5,
    }))
  } catch (error) {
    console.error('ExerciseDB error:', error)
    return []
  }
}
