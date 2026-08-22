'use server'

import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createRequestSchema = z.object({
  bloodTypeNeeded: z.enum(['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG']),
  unitsNeeded: z.number().min(1).max(10),
  urgency: z.enum(['CRITICAL', 'URGENT', 'ROUTINE']),
  hospitalContext: z.string().optional(),
  notes: z.string().optional(),
  district: z.string().optional(),
  patientName: z.string().optional(),
  patientAge: z.number().optional(),
  patientGender: z.string().optional(),
  contactPhone: z.string().optional(),
  expiresAt: z.string().optional(),
})

export async function createBloodRequest(formData: FormData) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  const rawUnits = formData.get('unitsNeeded')
  const rawAge = formData.get('patientAge')

  const data = createRequestSchema.parse({
    bloodTypeNeeded: formData.get('bloodTypeNeeded'),
    unitsNeeded: rawUnits ? Number(rawUnits) : 1,
    urgency: formData.get('urgency') || 'ROUTINE',
    hospitalContext: formData.get('hospitalContext') || undefined,
    notes: formData.get('notes') || undefined,
    district: formData.get('district') || undefined,
    patientName: formData.get('patientName') || undefined,
    patientAge: rawAge ? Number(rawAge) : undefined,
    patientGender: formData.get('patientGender') || undefined,
    contactPhone: formData.get('contactPhone') || undefined,
    expiresAt: formData.get('expiresAt') || undefined,
  })

  const expiresAt = data.expiresAt
    ? new Date(data.expiresAt)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await prisma.bloodRequestPost.create({
    data: {
      requesterId: user.id,
      bloodTypeNeeded: data.bloodTypeNeeded,
      unitsNeeded: data.unitsNeeded,
      urgency: data.urgency,
      hospitalContext: data.hospitalContext,
      notes: data.notes,
      district: data.district,
      patientName: data.patientName,
      patientAge: data.patientAge,
      patientGender: data.patientGender,
      contactPhone: data.contactPhone,
      expiresAt,
      status: 'OPEN',
    },
  })

  revalidatePath('/dashboard/blood-donation')
  return { success: true }
}

export async function searchBloodRequests(formData: FormData) {
  const user = await getSessionUser()
  if (!user) return []

  const { bloodType, district, urgency } = z
    .object({
      bloodType: z.string().optional(),
      district: z.string().optional(),
      urgency: z.string().optional(),
    })
    .parse({
      bloodType: formData.get('bloodType') || undefined,
      district: formData.get('district') || undefined,
      urgency: formData.get('urgency') || undefined,
    })

  const where: any = { status: 'OPEN' }
  if (bloodType) where.bloodTypeNeeded = bloodType
  if (district) where.district = { contains: district, mode: 'insensitive' }
  if (urgency) where.urgency = urgency

  const requests = await prisma.bloodRequestPost.findMany({
    where,
    include: {
      requester: { select: { id: true, name: true } },
      applications: {
        include: {
          donor: { select: { id: true, name: true, phone: true, email: true } },
        },
      },
    },
    orderBy: [
      { urgency: 'asc' }, // CRITICAL first
      { createdAt: 'desc' },
    ],
  })

  return requests
}

export async function searchDonors(formData: FormData) {
  const user = await getSessionUser()
  if (!user) return []

  const { bloodType, district } = z
    .object({
      bloodType: z.string().optional(),
      district: z.string().optional(),
    })
    .parse({
      bloodType: formData.get('bloodType') || undefined,
      district: formData.get('district') || undefined,
    })

  const where: any = {
    isAvailable: true,
    isVerified: true,
    OR: [
      { eligibleFromDate: null },
      { eligibleFromDate: { lte: new Date() } },
    ],
  }
  if (bloodType) where.bloodType = bloodType
  if (district) where.district = { contains: district, mode: 'insensitive' }

  const donors = await prisma.bloodDonorProfile.findMany({
    where,
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: { lastDonationDate: 'asc' },
    take: 50,
  })

  return donors
}

export async function applyToDonate(formData: FormData) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  const requestId = formData.get('requestId') as string
  const message = (formData.get('message') as string) || ''

  // Check if already applied
  const existing = await prisma.donationApplication.findUnique({
    where: {
      bloodRequestPostId_donorUserId: {
        bloodRequestPostId: requestId,
        donorUserId: user.id,
      },
    },
  })

  if (existing) throw new Error('You have already applied to this request')

  await prisma.donationApplication.create({
    data: {
      bloodRequestPostId: requestId,
      donorUserId: user.id,
      message,
      status: 'PENDING',
    },
  })

  revalidatePath('/dashboard/blood-donation')
  return { success: true }
}

export async function respondToApplication(formData: FormData) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  const applicationId = formData.get('applicationId') as string
  const accept = formData.get('accept') === 'true'

  const application = await prisma.donationApplication.findUnique({
    where: { id: applicationId },
    include: { bloodRequestPost: true },
  })

  if (!application) throw new Error('Application not found')
  if (application.bloodRequestPost.requesterId !== user.id) {
    throw new Error('Unauthorized')
  }

  await prisma.donationApplication.update({
    where: { id: applicationId },
    data: {
      status: accept ? 'ACCEPTED_BY_REQUESTER' : 'DECLINED',
      respondedAt: new Date(),
    },
  })

  if (accept) {
    // Close the request (mark as fulfilled)
    await prisma.bloodRequestPost.update({
      where: { id: application.bloodRequestPostId },
      data: { status: 'FULFILLED' },
    })
    // Decline all other pending applications
    await prisma.donationApplication.updateMany({
      where: {
        bloodRequestPostId: application.bloodRequestPostId,
        id: { not: applicationId },
        status: 'PENDING',
      },
      data: { status: 'DECLINED' },
    })
  }

  revalidatePath('/dashboard/blood-donation')
  return { success: true }
}
