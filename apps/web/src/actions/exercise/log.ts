'use server'

import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const MET_BY_TYPE: Record<string, number> = {
  cardio: 7,
  strength: 5,
  yoga: 3,
  stretching: 2.5,
  sports: 8,
}

const INTENSITY_FACTOR: Record<string, number> = {
  low: 0.8,
  medium: 1.0,
  high: 1.2,
}

async function getUserWeight(userId: string): Promise<number> {
  try {
    const profile = await prisma.patientProfile.findUnique({
      where: { userId },
      select: { weightKg: true },
    })
    return profile?.weightKg || 70
  } catch {
    return 70
  }
}

export async function calculateCalories(
  metBase: number,
  weightKg: number,
  durationMinutes: number,
  intensity: 'low' | 'medium' | 'high'
): Promise<number> {
  const factor = INTENSITY_FACTOR[intensity] ?? 1.0
  const met = metBase * factor
  const perMinute = (met * 3.5 * weightKg) / 200
  return Math.round(perMinute * durationMinutes * 100) / 100
}

const logSchema = z.object({
  exerciseId: z.string().optional(),
  exerciseName: z.string().min(1),
  duration: z.number().int().positive(),
  intensity: z.enum(['low', 'medium', 'high']),
  notes: z.string().optional(),
})

export async function logExercise(formData: FormData) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  const exerciseIdRaw = formData.get('exerciseId')
  const exerciseNameRaw = formData.get('exerciseName')
  const durationRaw = formData.get('duration')
  const intensityRaw = formData.get('intensity')
  const notesRaw = formData.get('notes')

  const data = logSchema.parse({
    exerciseId: exerciseIdRaw ? String(exerciseIdRaw) : undefined,
    exerciseName: String(exerciseNameRaw || ''),
    duration: Number(durationRaw),
    intensity: intensityRaw as 'low' | 'medium' | 'high',
    notes: notesRaw ? String(notesRaw) : undefined,
  })

  const weightKg = await getUserWeight(user.id)

  let metBase = 5
  if (data.exerciseId) {
    const cached = await prisma.cachedExercise.findUnique({
      where: { id: data.exerciseId },
      select: { metBase: true, type: true },
    })
    if (cached) {
      metBase = cached.metBase || (cached.type ? MET_BY_TYPE[cached.type.toLowerCase()] : 5) || 5
    }
  } else {
    const lower = data.exerciseName.toLowerCase()
    if (lower.includes('run') || lower.includes('jog') || lower.includes('cycle') || lower.includes('swim')) {
      metBase = 8
    } else if (lower.includes('yoga') || lower.includes('stretch')) {
      metBase = 3
    } else if (lower.includes('strength') || lower.includes('lift') || lower.includes('press') || lower.includes('squat')) {
      metBase = 5
    }
  }

  const factor = INTENSITY_FACTOR[data.intensity] ?? 1.0
  const met = metBase * factor
  const perMinute = (met * 3.5 * weightKg) / 200
  const caloriesBurned = Math.round(perMinute * data.duration * 100) / 100

  const log = await prisma.userExerciseLog.create({
    data: {
      userId: user.id,
      exerciseId: data.exerciseId,
      exerciseName: data.exerciseName,
      duration: data.duration,
      intensity: data.intensity,
      caloriesBurned,
      notes: data.notes,
    },
  })

  revalidatePath('/dashboard/exercise')
  return { success: true, logId: log.id, caloriesBurned }
}
