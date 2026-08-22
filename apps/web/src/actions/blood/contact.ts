'use server'

import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export async function requestContactShare(formData: FormData) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  const { donorProfileId, fieldsRequested } = z
    .object({
      donorProfileId: z.string(),
      fieldsRequested: z.array(z.string()),
    })
    .parse({
      donorProfileId: formData.get('donorProfileId'),
      fieldsRequested: JSON.parse(formData.get('fieldsRequested') as string),
    })

  // Check if contact share already exists
  const existing = await prisma.contactShareRequest.findFirst({
    where: {
      requesterId: user.id,
      donorProfileId,
      status: 'PENDING',
    },
  })

  if (existing) throw new Error('Contact share already requested')

  await prisma.contactShareRequest.create({
    data: {
      requesterId: user.id,
      donorProfileId,
      fieldsRequested,
      status: 'PENDING',
    },
  })

  revalidatePath('/dashboard/blood-donation')
  return { success: true }
}

export async function respondToContactShare(formData: FormData) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  const contactRequestId = formData.get('contactRequestId') as string
  const accept = formData.get('accept') === 'true'

  const contactRequest = await prisma.contactShareRequest.findUnique({
    where: { id: contactRequestId },
    include: { donorProfile: true },
  })

  if (!contactRequest) throw new Error('Request not found')
  if (contactRequest.donorProfile.userId !== user.id) {
    throw new Error('Unauthorized')
  }

  if (accept) {
    // Determine what fields to share (we'll share all requested)
    const donor = await prisma.user.findUnique({
      where: { id: user.id },
      select: { phone: true, email: true },
    })

    const donorProfile = await prisma.bloodDonorProfile.findUnique({
      where: { userId: user.id },
      select: { district: true },
    })

    const fieldsShared = contactRequest.fieldsRequested.filter((f) => {
      if (f === 'phone' && donor?.phone) return true
      if (f === 'email' && donor?.email) return true
      if (f === 'district' && donorProfile?.district) return true
      return false
    })

    await prisma.contactShareRequest.update({
      where: { id: contactRequestId },
      data: {
        status: 'APPROVED',
        fieldsShared,
        respondedAt: new Date(),
      },
    })
  } else {
    await prisma.contactShareRequest.update({
      where: { id: contactRequestId },
      data: { status: 'DECLINED', respondedAt: new Date() },
    })
  }

  revalidatePath('/dashboard/blood-donation')
  return { success: true }
}
