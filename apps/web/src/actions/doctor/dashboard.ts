'use server'

import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'

const getDashboardDataSchema = z.object({
  range: z.enum(['day', 'week', 'month', 'year']).default('week'),
  organizationId: z.string().optional(),
})

export type DoctorDashboardData = Awaited<ReturnType<typeof getDoctorDashboardData>>

export async function getDoctorDashboardData(formData: FormData) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  // Verify user is a doctor
  const doctorProf = await prisma.userProfession.findFirst({
    where: {
      userId: user.id,
      professionType: { code: 'DOCTOR' },
      status: 'VERIFIED',
    },
  })
  if (!doctorProf) throw new Error('You are not a verified doctor')

  const { range, organizationId } = getDashboardDataSchema.parse({
    range: formData.get('range') || 'week',
    organizationId: formData.get('organizationId') || undefined,
  })

  // ─── Date Range ──────────────────────────────────────────

  const now = new Date()
  const startDate = new Date(now)
  switch (range) {
    case 'day':
      startDate.setHours(0, 0, 0, 0)
      break
    case 'week': {
      const dayOfWeek = now.getDay()
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      startDate.setDate(now.getDate() - diff)
      startDate.setHours(0, 0, 0, 0)
      break
    }
    case 'month':
      startDate.setDate(1)
      startDate.setHours(0, 0, 0, 0)
      break
    case 'year':
      startDate.setMonth(0, 1)
      startDate.setHours(0, 0, 0, 0)
      break
  }

  // ─── Build where clause ─────────────────────────────────

  const where: Prisma.AppointmentWhereInput = {
    doctors: { some: { doctorUserId: user.id } },
    bookedSlotTime: { gte: startDate, lte: now },
  }
  if (organizationId) where.organizationId = organizationId

  // ─── Fetch all appointments in range for stats ──────────

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      patient: { select: { id: true, name: true } },
      organization: { select: { id: true, name: true } },
      doctors: { include: { doctor: { select: { id: true, name: true } } } },
      prescriptions: true,
    },
    orderBy: { bookedSlotTime: 'asc' },
  })

  const total = appointments.length
  const pending = appointments.filter(
    (a) => a.status === 'BOOKED' || a.status === 'PENDING'
  ).length
  const completed = appointments.filter((a) => a.status === 'PRESCRIBED').length
  const cancelled = appointments.filter((a) => a.status === 'CANCELLED').length
  const didNotVisit = appointments.filter((a) => a.status === 'DID_NOT_VISIT').length

  // ─── Chart data: group by date ──────────────────────────

  const dateMap = new Map<string, { booked: number; completed: number }>()
  for (const appt of appointments) {
    if (!appt.bookedSlotTime) continue
    const key = appt.bookedSlotTime.toISOString().split('T')[0]
    if (!dateMap.has(key)) {
      dateMap.set(key, { booked: 0, completed: 0 })
    }
    const entry = dateMap.get(key)!
    entry.booked++
    if (appt.status === 'PRESCRIBED') entry.completed++
  }

  const chartData = Array.from(dateMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, counts]) => ({ date, ...counts }))

  // ─── Recent appointments (last 10) ──────────────────────

  const recent = appointments
    .slice(-10)
    .reverse()
    .map((appt) => ({
      id: appt.id,
      status: appt.status,
      bookedSlotTime: appt.bookedSlotTime ? appt.bookedSlotTime.toISOString() : null,
      serialNumber: appt.serialNumber,
      patient: appt.patient,
      patientName: appt.patientName,
      patientPhone: appt.patientPhone,
      organization: appt.organization,
    }))

  // ─── Get list of organizations the doctor is in ─────────

  const schedules = await prisma.doctorSchedule.findMany({
    where: { doctorUserId: user.id },
    select: { organizationId: true },
  })
  const employees = await prisma.organizationEmployee.findMany({
    where: { userId: user.id, isActive: true },
    select: { organizationId: true },
  })

  const orgIds = Array.from(
    new Set([...schedules.map((s) => s.organizationId), ...employees.map((e) => e.organizationId)])
  )

  const orgs = await prisma.organization.findMany({
    where: { id: { in: orgIds } },
    select: { id: true, name: true },
  })

  return {
    stats: { total, pending, completed, cancelled, didNotVisit },
    chartData,
    recent,
    organizations: orgs,
  }
}
