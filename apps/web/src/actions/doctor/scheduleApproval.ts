'use server'

import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const scheduleSchema = z.object({
  organizationId: z.string().min(1, 'Organization is required'),
  assumedVisitDurationMinutes: z.number().min(5).max(120),
  approvalMode: z.enum(['AUTO', 'MANUAL']),
  workingDays: z.array(z.string()),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  lunchBreakStart: z.string().optional().nullable(),
  lunchBreakEnd: z.string().optional().nullable(),
})

export async function requestScheduleApproval(formData: FormData) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  const data = scheduleSchema.parse({
    organizationId: formData.get('organizationId'),
    assumedVisitDurationMinutes: Number(formData.get('assumedVisitDurationMinutes')),
    approvalMode: formData.get('approvalMode'),
    workingDays: JSON.parse(formData.get('workingDays') as string),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
    lunchBreakStart: (formData.get('lunchBreakStart') as string) || null,
    lunchBreakEnd: (formData.get('lunchBreakEnd') as string) || null,
  })

  // Check if user is a verified doctor
  const doctorProf = await prisma.userProfession.findFirst({
    where: { userId: user.id, professionType: { code: 'DOCTOR' }, status: 'VERIFIED' },
  })
  if (!doctorProf) throw new Error('Only verified doctors can request schedule changes')

  // Check if there is already a PENDING schedule request
  const existingPending = await prisma.doctorSchedule.findFirst({
    where: {
      doctorUserId: user.id,
      organizationId: data.organizationId,
      status: 'PENDING',
    },
  })
  if (existingPending) {
    throw new Error('You already have a pending schedule request for this organization.')
  }

  // Create a pending schedule record
  await prisma.doctorSchedule.create({
    data: {
      doctorUserId: user.id,
      organizationId: data.organizationId,
      assumedVisitDurationMinutes: data.assumedVisitDurationMinutes,
      approvalMode: data.approvalMode,
      workingDays: data.workingDays,
      startTime: data.startTime,
      endTime: data.endTime,
      lunchBreakStart: data.lunchBreakStart,
      lunchBreakEnd: data.lunchBreakEnd,
      isActive: false,
      status: 'PENDING',
      requestedChanges: data,
      requestedAt: new Date(),
    },
  })

  revalidatePath('/dashboard/doctor/my-organization')
  revalidatePath('/dashboard/doctor/schedule')
  return { success: true }
}

// ─── Admin: fetch pending schedules ────────────────────────

export async function getPendingScheduleRequests() {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  // Verify user is admin of at least one organization
  const adminOrgs = await prisma.organizationAdmin.findMany({
    where: { userId: user.id, isActive: true },
    select: { organizationId: true },
  })
  if (adminOrgs.length === 0) throw new Error('Unauthorized – Admin only')

  const orgIds = adminOrgs.map((a) => a.organizationId)

  const pending = await prisma.doctorSchedule.findMany({
    where: {
      organizationId: { in: orgIds },
      status: 'PENDING',
    },
    include: {
      doctor: { select: { id: true, name: true, email: true } },
      organization: { select: { id: true, name: true } },
    },
    orderBy: { requestedAt: 'asc' },
  })

  return pending.map((s) => ({
    ...s,
    requestedAt: s.requestedAt ? s.requestedAt.toISOString() : new Date().toISOString(),
  }))
}

// ─── Admin: approve/reject ──────────────────────────────────

export async function approveScheduleRequest(formData: FormData) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')
  const scheduleId = formData.get('scheduleId') as string
  if (!scheduleId) throw new Error('Schedule ID required')

  const schedule = await prisma.doctorSchedule.findUnique({
    where: { id: scheduleId },
  })
  if (!schedule) throw new Error('Schedule not found')
  if (schedule.status !== 'PENDING') throw new Error('Schedule request is not pending')

  // Verify admin permissions on this organization
  const isAdmin = await prisma.organizationAdmin.findFirst({
    where: { organizationId: schedule.organizationId, userId: user.id, isActive: true },
  })
  if (!isAdmin) throw new Error('Unauthorized - Admin access required')

  // Deactivate any existing active schedule for this doctor+org
  await prisma.doctorSchedule.updateMany({
    where: {
      doctorUserId: schedule.doctorUserId,
      organizationId: schedule.organizationId,
      isActive: true,
    },
    data: { isActive: false },
  })

  // Activate the new schedule
  await prisma.doctorSchedule.update({
    where: { id: scheduleId },
    data: {
      status: 'APPROVED',
      isActive: true,
      reviewedAt: new Date(),
      reviewedBy: user.id,
    },
  })

  revalidatePath('/dashboard/organization/admin/approvals')
  revalidatePath('/dashboard/doctor/my-organization')
  revalidatePath('/dashboard/doctor/schedule')
  return { success: true }
}

export async function rejectScheduleRequest(formData: FormData) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')
  const scheduleId = formData.get('scheduleId') as string
  if (!scheduleId) throw new Error('Schedule ID required')

  const schedule = await prisma.doctorSchedule.findUnique({
    where: { id: scheduleId },
  })
  if (!schedule) throw new Error('Schedule not found')

  const isAdmin = await prisma.organizationAdmin.findFirst({
    where: { organizationId: schedule.organizationId, userId: user.id, isActive: true },
  })
  if (!isAdmin) throw new Error('Unauthorized - Admin access required')

  await prisma.doctorSchedule.update({
    where: { id: scheduleId },
    data: {
      status: 'REJECTED',
      reviewedAt: new Date(),
      reviewedBy: user.id,
    },
  })

  revalidatePath('/dashboard/organization/admin/approvals')
  revalidatePath('/dashboard/doctor/my-organization')
  revalidatePath('/dashboard/doctor/schedule')
  return { success: true }
}
