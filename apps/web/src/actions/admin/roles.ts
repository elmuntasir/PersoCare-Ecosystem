'use server'

import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const roleSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
  roleId: z.string().optional(),
})

export async function createOrganizationRole(formData: FormData) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  const data = roleSchema.parse({
    organizationId: formData.get('organizationId'),
    name: formData.get('name'),
    description: (formData.get('description') as string) || undefined,
  })

  const isAdmin = await prisma.organizationAdmin.findFirst({
    where: { organizationId: data.organizationId, userId: user.id, isActive: true },
  })
  if (!isAdmin) throw new Error('Unauthorized - Admin access required')

  await prisma.organizationRole.create({
    data: {
      organizationId: data.organizationId,
      name: data.name,
      description: data.description,
    },
  })

  revalidatePath(`/dashboard/organization/manage`)
  revalidatePath(`/dashboard/organization/admin`)
  return { success: true }
}

export async function deleteOrganizationRole(formData: FormData) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  const id = formData.get('roleId') as string
  if (!id) throw new Error('Role ID required')

  const role = await prisma.organizationRole.findUnique({
    where: { id },
  })
  if (!role) throw new Error('Role not found')

  const isAdmin = await prisma.organizationAdmin.findFirst({
    where: { organizationId: role.organizationId, userId: user.id, isActive: true },
  })
  if (!isAdmin) throw new Error('Unauthorized - Admin access required')

  await prisma.organizationRole.delete({ where: { id } })

  revalidatePath(`/dashboard/organization/manage`)
  revalidatePath(`/dashboard/organization/admin`)
  return { success: true }
}

export async function getOrganizationRoles(organizationId: string) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  return prisma.organizationRole.findMany({
    where: { organizationId },
    include: {
      employees: { select: { id: true } },
    },
    orderBy: { name: 'asc' },
  })
}
