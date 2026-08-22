'use server'

import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const logSchema = z.object({
  foodId: z.string().optional(),
  userFoodId: z.string().optional(),
  amountGrams: z.number().positive(),
  notes: z.string().optional(),
})

export async function logFood(formData: FormData) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  const foodIdRaw = formData.get('foodId')
  const userFoodIdRaw = formData.get('userFoodId')
  const amountGramsRaw = formData.get('amountGrams')
  const notesRaw = formData.get('notes')

  const data = logSchema.parse({
    foodId: foodIdRaw ? String(foodIdRaw) : undefined,
    userFoodId: userFoodIdRaw ? String(userFoodIdRaw) : undefined,
    amountGrams: Number(amountGramsRaw),
    notes: notesRaw ? String(notesRaw) : undefined,
  })

  const log = await prisma.userFoodLog.create({
    data: {
      userId: user.id,
      foodId: data.foodId,
      userFoodId: data.userFoodId,
      amountGrams: data.amountGrams,
      notes: data.notes,
    },
  })

  revalidatePath('/dashboard/diet')
  return { success: true, logId: log.id }
}
