'use server'

import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const scheduleSchema = z.object({
  doctorUserId: z.string(),
  organizationId: z.string(),
  assumedVisitDurationMinutes: z.number().min(5).max(120),
  approvalMode: z.enum(['AUTO', 'MANUAL']),
  workingDays: z.array(z.string()),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  lunchBreakStart: z.string().optional().nullable(),
  lunchBreakEnd: z.string().optional().nullable(),
  isActive: z.boolean(),
  scheduleId: z.string().optional(),
})

export async function createDoctorSchedule(formData: FormData) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  const doctorUserId = (formData.get('doctorUserId') as string) || user.id

  const data = scheduleSchema.parse({
    doctorUserId,
    organizationId: formData.get('organizationId'),
    assumedVisitDurationMinutes: Number(formData.get('assumedVisitDurationMinutes')),
    approvalMode: formData.get('approvalMode'),
    workingDays: JSON.parse(formData.get('workingDays') as string),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
    lunchBreakStart: (formData.get('lunchBreakStart') as string) || null,
    lunchBreakEnd: (formData.get('lunchBreakEnd') as string) || null,
    isActive: formData.get('isActive') === 'true',
  })

  const existing = await prisma.doctorSchedule.findFirst({
    where: {
      doctorUserId: data.doctorUserId,
      organizationId: data.organizationId,
    },
  })

  if (existing) throw new Error('Schedule already exists for this doctor and organization.')

  await prisma.doctorSchedule.create({
    data: {
      doctorUserId: data.doctorUserId,
      organizationId: data.organizationId,
      assumedVisitDurationMinutes: data.assumedVisitDurationMinutes,
      approvalMode: data.approvalMode,
      workingDays: data.workingDays,
      startTime: data.startTime,
      endTime: data.endTime,
      lunchBreakStart: data.lunchBreakStart || null,
      lunchBreakEnd: data.lunchBreakEnd || null,
      isActive: data.isActive,
    },
  })
  revalidatePath('/dashboard/doctor/schedule')
  return { success: true }
}

export async function updateDoctorSchedule(formData: FormData) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  const doctorUserId = (formData.get('doctorUserId') as string) || user.id

  const data = scheduleSchema.parse({
    doctorUserId,
    organizationId: formData.get('organizationId'),
    assumedVisitDurationMinutes: Number(formData.get('assumedVisitDurationMinutes')),
    approvalMode: formData.get('approvalMode'),
    workingDays: JSON.parse(formData.get('workingDays') as string),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
    lunchBreakStart: (formData.get('lunchBreakStart') as string) || null,
    lunchBreakEnd: (formData.get('lunchBreakEnd') as string) || null,
    isActive: formData.get('isActive') === 'true',
    scheduleId: formData.get('scheduleId') as string,
  })

  if (!data.scheduleId) throw new Error('Schedule ID required')

  await prisma.doctorSchedule.update({
    where: { id: data.scheduleId },
    data: {
      assumedVisitDurationMinutes: data.assumedVisitDurationMinutes,
      approvalMode: data.approvalMode,
      workingDays: data.workingDays,
      startTime: data.startTime,
      endTime: data.endTime,
      lunchBreakStart: data.lunchBreakStart || null,
      lunchBreakEnd: data.lunchBreakEnd || null,
      isActive: data.isActive,
    },
  })

  revalidatePath('/dashboard/doctor/schedule')
  return { success: true }
}

export async function deleteDoctorSchedule(formData: FormData) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  const scheduleId = formData.get('scheduleId') as string
  if (!scheduleId) throw new Error('Schedule ID required')

  await prisma.doctorSchedule.delete({ where: { id: scheduleId } })
  revalidatePath('/dashboard/doctor/schedule')
  return { success: true }
}

export async function getDoctorSchedules() {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  const schedules = await prisma.doctorSchedule.findMany({
    where: { doctorUserId: user.id },
  })

  const orgIds = schedules.map((s) => s.organizationId)
  const orgs = await prisma.organization.findMany({
    where: { id: { in: orgIds } },
    select: { id: true, name: true, slug: true },
  })

  const orgMap = new Map(orgs.map((o) => [o.id, o]))

  return schedules.map((s) => ({
    ...s,
    organization: orgMap.get(s.organizationId) || null,
  }))
}
