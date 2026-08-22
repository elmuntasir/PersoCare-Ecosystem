'use server'

import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ─── Create Entry ──────────────────────────────────────────

const createSchema = z.object({
  note: z.string().min(1, 'Note is required'),
  mood: z.string().optional().nullable(),
  symptoms: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
})

export async function createHealthDiaryEntry(formData: FormData) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  const rawSymptoms = formData.get('symptoms')
  const rawTags = formData.get('tags')

  const data = createSchema.parse({
    note: formData.get('note'),
    mood: formData.get('mood') || null,
    symptoms: rawSymptoms ? JSON.parse(rawSymptoms as string) : undefined,
    tags: rawTags ? JSON.parse(rawTags as string) : undefined,
  })

  const entry = await prisma.healthDiaryEntry.create({
    data: {
      userId: user.id,
      note: data.note,
      mood: data.mood,
      symptoms: data.symptoms || [],
      tags: data.tags || [],
    },
  })

  revalidatePath('/dashboard/health-diary')
  revalidatePath('/health-diary')
  return { success: true, entryId: entry.id }
}

// ─── Get Entries ────────────────────────────────────────────

export async function getHealthDiaryEntries(limit?: number, offset?: number) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  const entries = await prisma.healthDiaryEntry.findMany({
    where: { userId: user.id },
    orderBy: { recordedAt: 'desc' },
    take: limit || 50,
    skip: offset || 0,
  })

  return entries
}

// ─── Get Single Entry ──────────────────────────────────────

export async function getHealthDiaryEntry(id: string) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  const entry = await prisma.healthDiaryEntry.findUnique({
    where: { id },
  })

  if (!entry || entry.userId !== user.id) {
    throw new Error('Entry not found')
  }

  return entry
}

// ─── Update Entry ──────────────────────────────────────────

const updateSchema = z.object({
  id: z.string(),
  note: z.string().optional(),
  mood: z.string().optional().nullable(),
  symptoms: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
})

export async function updateHealthDiaryEntry(formData: FormData) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  const rawSymptoms = formData.get('symptoms')
  const rawTags = formData.get('tags')

  const data = updateSchema.parse({
    id: formData.get('id'),
    note: formData.get('note') || undefined,
    mood: formData.get('mood') || null,
    symptoms: rawSymptoms ? JSON.parse(rawSymptoms as string) : undefined,
    tags: rawTags ? JSON.parse(rawTags as string) : undefined,
  })

  const existing = await prisma.healthDiaryEntry.findUnique({
    where: { id: data.id },
  })

  if (!existing || existing.userId !== user.id) {
    throw new Error('Unauthorized')
  }

  await prisma.healthDiaryEntry.update({
    where: { id: data.id },
    data: {
      note: data.note,
      mood: data.mood,
      symptoms: data.symptoms,
      tags: data.tags,
    },
  })

  revalidatePath('/dashboard/health-diary')
  revalidatePath('/health-diary')
  return { success: true }
}

// ─── Delete Entry ──────────────────────────────────────────

export async function deleteHealthDiaryEntry(formData: FormData) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  const id = formData.get('id') as string
  if (!id) throw new Error('Entry ID required')

  const existing = await prisma.healthDiaryEntry.findUnique({
    where: { id },
  })

  if (!existing || existing.userId !== user.id) {
    throw new Error('Unauthorized')
  }

  await prisma.healthDiaryEntry.delete({ where: { id } })
  revalidatePath('/dashboard/health-diary')
  revalidatePath('/health-diary')
  return { success: true }
}
