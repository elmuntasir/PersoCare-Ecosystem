'use server'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const getSlotsSchema = z.object({
  doctorId: z.string().min(1, 'Doctor is required'),
  organizationId: z.string().min(1, 'Organization is required'),
  date: z.string().min(1, 'Date is required'),
})

export type AvailableSlot = {
  startTime: string // "09:00"
  endTime: string // "09:15"
  isAvailable: boolean
  isLunch: boolean
  serialNumber?: number // if already booked, show the serial
}

export async function getAvailableSlots(formData: FormData) {
  const { doctorId, organizationId, date } = getSlotsSchema.parse({
    doctorId: formData.get('doctorId'),
    organizationId: formData.get('organizationId'),
    date: formData.get('date'),
  })

  // 1. Get doctor's schedule for this organization
  const schedule = await prisma.doctorSchedule.findFirst({
    where: {
      doctorUserId: doctorId,
      organizationId,
      isActive: true,
    },
  })

  if (!schedule) {
    throw new Error('Doctor not available at this organization.')
  }

  // 2. Check if the date is a working day
  const appointmentDate = new Date(`${date}T00:00:00`)
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayOfWeek = dayNames[appointmentDate.getDay()]
  if (!schedule.workingDays.includes(dayOfWeek)) {
    throw new Error(`Doctor does not work on ${dayOfWeek}. Available days: ${schedule.workingDays.join(', ')}`)
  }

  // 3. Get existing appointments for this doctor on this date
  const startOfDay = new Date(`${date}T00:00:00`)
  const endOfDay = new Date(`${date}T23:59:59.999`)

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      organizationId,
      doctors: { some: { doctorUserId: doctorId } },
      status: { in: ['BOOKED', 'PENDING'] },
      bookedSlotTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    orderBy: { bookedSlotTime: 'asc' },
  })

  // 4. Generate all possible time slots
  const durationMinutes = schedule.assumedVisitDurationMinutes || 15
  const startTime = schedule.startTime
  const endTime = schedule.endTime
  const lunchStart = schedule.lunchBreakStart
  const lunchEnd = schedule.lunchBreakEnd

  const slots: AvailableSlot[] = []

  const startHour = parseInt(startTime.split(':')[0])
  const startMinute = parseInt(startTime.split(':')[1])
  const endHour = parseInt(endTime.split(':')[0])
  const endMinute = parseInt(endTime.split(':')[1])

  let currentHour = startHour
  let currentMinute = startMinute

  // Parse lunch break
  let lunchStartHour = 0,
    lunchStartMinute = 0,
    lunchEndHour = 0,
    lunchEndMinute = 0
  let hasLunch = false
  if (lunchStart && lunchEnd) {
    hasLunch = true
    lunchStartHour = parseInt(lunchStart.split(':')[0])
    lunchStartMinute = parseInt(lunchStart.split(':')[1])
    lunchEndHour = parseInt(lunchEnd.split(':')[0])
    lunchEndMinute = parseInt(lunchEnd.split(':')[1])
  }

  // Helper: check if time is within lunch break
  function isLunchBreak(hour: number, minute: number): boolean {
    if (!hasLunch) return false
    const current = hour * 60 + minute
    const lunchStartTotal = lunchStartHour * 60 + lunchStartMinute
    const lunchEndTotal = lunchEndHour * 60 + lunchEndMinute
    return current >= lunchStartTotal && current < lunchEndTotal
  }

  // Helper: check if a slot overlaps with any existing appointment
  function isSlotBooked(slotStart: Date, slotEnd: Date): boolean {
    for (const appt of existingAppointments) {
      if (!appt.bookedSlotTime) continue
      const apptStart = appt.bookedSlotTime
      const apptEnd = new Date(apptStart.getTime() + durationMinutes * 60000)
      // Check if slots overlap
      if (slotStart < apptEnd && slotEnd > apptStart) {
        return true
      }
    }
    return false
  }

  // Generate slots
  while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
    // Check if we're at the lunch break boundary
    if (hasLunch) {
      const currentTotal = currentHour * 60 + currentMinute
      const lunchStartTotal = lunchStartHour * 60 + lunchStartMinute
      const lunchEndTotal = lunchEndHour * 60 + lunchEndMinute

      // If we're entering lunch, skip to after lunch
      if (currentTotal >= lunchStartTotal && currentTotal < lunchEndTotal) {
        currentHour = lunchEndHour
        currentMinute = lunchEndMinute
        continue
      }

      // If we're before lunch but the slot would end after lunch starts, skip to lunch end
      const slotEndHour = currentHour
      const slotEndMinute = currentMinute + durationMinutes
      const slotEndTotal = slotEndHour * 60 + slotEndMinute

      if (slotEndTotal > lunchStartTotal && currentTotal < lunchStartTotal) {
        currentHour = lunchEndHour
        currentMinute = lunchEndMinute
        continue
      }
    }

    // Create the slot
    const slotStart = new Date(`${date}T00:00:00`)
    slotStart.setHours(currentHour, currentMinute, 0, 0)

    const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000)

    // Check if this slot is within working hours
    const slotEndTotal = slotEnd.getHours() * 60 + slotEnd.getMinutes()
    const endTotal = endHour * 60 + endMinute
    if (slotEndTotal > endTotal) break

    // Check if slot is in lunch break
    const isLunch = isLunchBreak(currentHour, currentMinute)

    // Check if slot is already booked
    const isBooked = isSlotBooked(slotStart, slotEnd)

    // Find the serial number if booked
    let serialNumber: number | undefined = undefined
    if (isBooked) {
      const bookedAppt = existingAppointments.find((a) => {
        if (!a.bookedSlotTime) return false
        const apptStart = a.bookedSlotTime
        const apptEnd = new Date(apptStart.getTime() + durationMinutes * 60000)
        return slotStart < apptEnd && slotEnd > apptStart
      })
      serialNumber = bookedAppt?.serialNumber || undefined
    }

    const pad = (n: number) => n.toString().padStart(2, '0')
    const formatTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

    slots.push({
      startTime: formatTime(slotStart),
      endTime: formatTime(slotEnd),
      isAvailable: !isBooked && !isLunch,
      isLunch,
      serialNumber,
    })

    // Move to next slot
    currentMinute += durationMinutes
    while (currentMinute >= 60) {
      currentHour += 1
      currentMinute -= 60
    }
  }

  return {
    slots,
    durationMinutes,
    workingDay: dayOfWeek,
    lunchBreak: hasLunch ? { start: lunchStart!, end: lunchEnd! } : null,
  }
}
