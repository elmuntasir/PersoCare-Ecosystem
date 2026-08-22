'use server'

import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const donorSchema = z.object({
  bloodType: z.enum(['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG']),
  district: z.string().optional(),
  lastDonationDate: z.string().optional(),
  medicalConditions: z.string().optional(),
})

export async function registerAsDonor(formData: FormData) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  // Check age (must be >= 18)
  if (user.dob) {
    const age = Math.floor((Date.now() - new Date(user.dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    if (age < 18) throw new Error('You must be at least 18 years old to register as a donor.')
  }

  const data = donorSchema.parse({
    bloodType: formData.get('bloodType'),
    district: formData.get('district') || undefined,
    lastDonationDate: formData.get('lastDonationDate') || undefined,
    medicalConditions: formData.get('medicalConditions') || undefined,
  })

  // Check if donor profile exists
  const existing = await prisma.bloodDonorProfile.findUnique({
    where: { userId: user.id },
  })

  if (existing) {
    throw new Error('You are already registered as a donor.')
  }

  const eligibleFromDate = data.lastDonationDate
    ? new Date(new Date(data.lastDonationDate).getTime() + 90 * 24 * 60 * 60 * 1000)
    : new Date()

  await prisma.bloodDonorProfile.create({
    data: {
      userId: user.id,
      bloodType: data.bloodType,
      district: data.district,
      lastDonationDate: data.lastDonationDate ? new Date(data.lastDonationDate) : null,
      eligibleFromDate,
      medicalConditions: data.medicalConditions,
      isAvailable: true,
      isVerified: false,
    },
  })

  revalidatePath('/dashboard/blood-donation')
  return { success: true }
}

export async function updateDonorAvailability(formData: FormData) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  const isAvailable = formData.get('isAvailable') === 'true'

  await prisma.bloodDonorProfile.update({
    where: { userId: user.id },
    data: { isAvailable },
  })

  revalidatePath('/dashboard/blood-donation')
  return { success: true }
}

export async function getDonorProfile() {
  const user = await getSessionUser()
  if (!user) return null

  const profile = await prisma.bloodDonorProfile.findUnique({
    where: { userId: user.id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  })

  return profile
}

export async function getVerificationRequests() {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  // Only organization admins can see verification requests
  const adminOrgs = await prisma.organizationAdmin.findMany({
    where: { userId: user.id, isActive: true },
    select: { organizationId: true },
  })

  if (adminOrgs.length === 0) throw new Error('Unauthorized')

  const requests = await prisma.organizationDonorVerification.findMany({
    where: {
      organizationId: { in: adminOrgs.map(a => a.organizationId) },
      status: 'PENDING',
    },
    include: {
      donor: { select: { id: true, name: true, email: true, phone: true } },
      organization: { select: { name: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return requests
}

export async function verifyDonor(formData: FormData) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  const verificationId = formData.get('verificationId') as string
  const approve = formData.get('approve') === 'true'
  const notes = (formData.get('notes') as string) || ''

  const verification = await prisma.organizationDonorVerification.findUnique({
    where: { id: verificationId },
  })

  if (!verification) throw new Error('Verification not found')

  // Update verification status
  await prisma.organizationDonorVerification.update({
    where: { id: verificationId },
    data: {
      status: approve ? 'APPROVED' : 'REJECTED',
      verifiedAt: new Date(),
      notes: notes || undefined,
    },
  })

  if (approve) {
    // Update donor profile
    await prisma.bloodDonorProfile.update({
      where: { userId: verification.donorUserId },
      data: {
        isVerified: true,
        verifiedBy: verification.organizationId,
        verifiedAt: new Date(),
      },
    })
  }

  revalidatePath('/dashboard/blood-donation/admin/verifications')
  revalidatePath('/dashboard/blood-donation')
  return { success: true }
}
