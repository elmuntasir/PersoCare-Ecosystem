'use server'

import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const deptSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  name: z.string().min(1, 'Department name is required'),
  description: z.string().optional(),
  icon: z.string().optional().nullable(),
  headId: z.string().optional().nullable(),
  departmentId: z.string().optional(),
})

export async function createDepartment(formData: FormData) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  const data = deptSchema.parse({
    organizationId: formData.get('organizationId'),
    name: formData.get('name'),
    description: (formData.get('description') as string) || undefined,
    icon: (formData.get('icon') as string) || null,
    headId: (formData.get('headId') as string) || null,
  })

  // Verify user is admin of this organization
  const isAdmin = await prisma.organizationAdmin.findFirst({
    where: { organizationId: data.organizationId, userId: user.id, isActive: true },
  })
  if (!isAdmin) throw new Error('Unauthorized - Admin access required')

  await prisma.department.create({
    data: {
      organizationId: data.organizationId,
      name: data.name,
      description: data.description,
      icon: data.icon,
      headId: data.headId,
    },
  })

  revalidatePath(`/dashboard/organization/manage`)
  revalidatePath(`/dashboard/organization/admin`)
  revalidatePath(`/dashboard/organization`)
  return { success: true }
}

export async function updateDepartment(formData: FormData) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  const data = deptSchema.parse({
    organizationId: formData.get('organizationId'),
    name: formData.get('name'),
    description: (formData.get('description') as string) || undefined,
    icon: (formData.get('icon') as string) || null,
    headId: (formData.get('headId') as string) || null,
    departmentId: formData.get('departmentId'),
  })

  if (!data.departmentId) throw new Error('Department ID required')

  const isAdmin = await prisma.organizationAdmin.findFirst({
    where: { organizationId: data.organizationId, userId: user.id, isActive: true },
  })
  if (!isAdmin) throw new Error('Unauthorized - Admin access required')

  await prisma.department.update({
    where: { id: data.departmentId },
    data: {
      name: data.name,
      description: data.description,
      icon: data.icon,
      headId: data.headId,
    },
  })

  revalidatePath(`/dashboard/organization/manage`)
  revalidatePath(`/dashboard/organization/admin`)
  revalidatePath(`/dashboard/organization`)
  return { success: true }
}

export async function deleteDepartment(formData: FormData) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  const id = formData.get('departmentId') as string
  if (!id) throw new Error('Department ID required')

  const dept = await prisma.department.findUnique({
    where: { id },
  })
  if (!dept) throw new Error('Department not found')

  const isAdmin = await prisma.organizationAdmin.findFirst({
    where: { organizationId: dept.organizationId, userId: user.id, isActive: true },
  })
  if (!isAdmin) throw new Error('Unauthorized - Admin access required')

  await prisma.department.delete({ where: { id } })

  revalidatePath(`/dashboard/organization/manage`)
  revalidatePath(`/dashboard/organization/admin`)
  revalidatePath(`/dashboard/organization`)
  return { success: true }
}

export async function getDepartments(organizationId: string) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  return prisma.department.findMany({
    where: { organizationId },
    include: {
      head: { select: { id: true, name: true } },
      employees: { select: { id: true } },
    },
    orderBy: { name: 'asc' },
  })
}
