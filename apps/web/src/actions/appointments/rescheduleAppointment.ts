'use server'

import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createNotification } from '@/lib/notifications'

const rescheduleSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  newDate: z.string().min(1, 'New date is required'),
  reason: z.string().optional(),
})

function isTimeWithinRange(timeStr: string, startStr: string, endStr: string): boolean {
  const time = new Date(`1970-01-01T${timeStr}:00`)
  const start = new Date(`1970-01-01T${startStr}:00`)
  const end = new Date(`1970-01-01T${endStr}:00`)
  return time >= start && time <= end
}

export async function rescheduleAppointment(formData: FormData) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  const { appointmentId, newDate, reason } = rescheduleSchema.parse({
    appointmentId: formData.get('appointmentId'),
    newDate: formData.get('newDate'),
    reason: formData.get('reason') || '',
  })

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: { select: { id: true, name: true } },
      doctors: { include: { doctor: { select: { id: true, name: true } } } },
      queue: true,
    },
  })
  if (!appointment) throw new Error('Appointment not found')

  const isPatient = appointment.patientId === user.id
  const isDoctor = appointment.doctors.some((d) => d.doctorUserId === user.id)
  if (!isPatient && !isDoctor) throw new Error('Unauthorized')

  if (appointment.status === 'PRESCRIBED' || appointment.status === 'CANCELLED') {
    throw new Error(`Cannot reschedule an appointment with status ${appointment.status}`)
  }

  const doctorId = appointment.doctors[0]?.doctorUserId
  if (!doctorId) throw new Error('No doctor assigned')

  const schedule = await prisma.doctorSchedule.findFirst({
    where: { doctorUserId: doctorId, organizationId: appointment.organizationId, isActive: true },
  })
  if (!schedule) throw new Error('Doctor not available at this organization.')

  const newAppointmentDate = new Date(newDate)
  if (isNaN(newAppointmentDate.getTime())) {
    throw new Error('Invalid date/time provided')
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayOfWeek = dayNames[newAppointmentDate.getDay()]
  if (!schedule.workingDays.includes(dayOfWeek)) {
    throw new Error(
      `Doctor does not work on ${dayOfWeek}. Available days: ${schedule.workingDays.join(', ')}`
    )
  }

  const timeStr = newAppointmentDate.toTimeString().slice(0, 5)
  if (!isTimeWithinRange(timeStr, schedule.startTime, schedule.endTime)) {
    throw new Error(`Doctor's working hours are ${schedule.startTime} – ${schedule.endTime}.`)
  }

  const duration = schedule.assumedVisitDurationMinutes || 15
  const startTime = newAppointmentDate
  const endTime = new Date(startTime.getTime() + duration * 60000)

  const overlapping = await prisma.appointment.findFirst({
    where: {
      organizationId: appointment.organizationId,
      doctors: { some: { doctorUserId: doctorId } },
      status: { in: ['BOOKED', 'PENDING'] },
      bookedSlotTime: { gte: startTime, lt: endTime },
      NOT: { id: appointmentId },
    },
  })
  if (overlapping) throw new Error('This time slot is already booked. Please choose another.')

  // Get or create queue for that target date
  const queueDate = new Date(newAppointmentDate)
  queueDate.setHours(0, 0, 0, 0)

  let queue = await prisma.appointmentQueue.findUnique({
    where: {
      doctorUserId_organizationId_queueDate: {
        doctorUserId: doctorId,
        organizationId: appointment.organizationId,
        queueDate,
      },
    },
  })

  if (!queue) {
    queue = await prisma.appointmentQueue.create({
      data: {
        doctorUserId: doctorId,
        organizationId: appointment.organizationId,
        queueDate,
        nextSerialNumber: 1,
        currentQueuePosition: 0,
      },
    })
  }

  let serialNumber = appointment.serialNumber
  // If moving across different queue dates, obtain new serial
  if (appointment.queueId !== queue.id) {
    serialNumber = queue.nextSerialNumber
    await prisma.appointmentQueue.update({
      where: { id: queue.id },
      data: { nextSerialNumber: { increment: 1 } },
    })
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      bookedSlotTime: startTime,
      estimatedSlotTime: startTime,
      queueId: queue.id,
      serialNumber,
      status: 'BOOKED',
      ...(reason ? { cancelledReason: `Rescheduled: ${reason}` } : {}),
    },
  })

  const doctorName = appointment.doctors[0]?.doctor.name ?? 'your doctor'
  const when = startTime.toLocaleString()
  await Promise.allSettled([
    createNotification({
      userId: appointment.patientId,
      title: 'Appointment rescheduled',
      message: `Your appointment with ${doctorName} is now set for ${when}.`,
      type: 'INFO',
      link: '/dashboard/appointments/my',
    }),
    createNotification({
      userId: doctorId,
      title: 'Appointment rescheduled',
      message: `${appointment.patientName || appointment.patient?.name || 'A patient'} moved the appointment to ${when}.`,
      type: 'WARNING',
      link: '/dashboard/doctor/appointments',
    }),
  ])

  revalidatePath('/dashboard/appointments')
  revalidatePath('/dashboard/appointments/my')
  revalidatePath('/dashboard/doctor/appointments')
  return { success: true }
}
