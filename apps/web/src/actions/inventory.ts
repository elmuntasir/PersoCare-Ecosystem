'use server'

import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const categorySchema = z.object({
  categoryId: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
})

export async function upsertInventoryCategory(formData: FormData) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  const data = categorySchema.parse({
    categoryId: formData.get('categoryId') || undefined,
    name: formData.get('name'),
    description: formData.get('description') || undefined,
  })

  if (data.categoryId) {
    await prisma.inventoryCategory.update({
      where: { id: data.categoryId },
      data: {
        name: data.name,
        description: data.description,
      },
    })
  } else {
    await prisma.inventoryCategory.create({
      data: {
        name: data.name,
        description: data.description,
      },
    })
  }

  revalidatePath('/dashboard/inventory')
  return { success: true }
}

const itemSchema = z.object({
  itemId: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string().min(1),
  unit: z.string().optional(),
  reorderLevel: z.number().int().nonnegative().optional(),
})

export async function upsertInventoryItem(formData: FormData) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  const data = itemSchema.parse({
    itemId: formData.get('itemId') || undefined,
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    categoryId: formData.get('categoryId'),
    unit: formData.get('unit') || undefined,
    reorderLevel: formData.get('reorderLevel') ? Number(formData.get('reorderLevel')) : undefined,
  })

  if (data.itemId) {
    await prisma.inventoryItem.update({
      where: { id: data.itemId },
      data: {
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        unit: data.unit,
        reorderLevel: data.reorderLevel,
      },
    })
  } else {
    await prisma.inventoryItem.create({
      data: {
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        unit: data.unit,
        reorderLevel: data.reorderLevel,
      },
    })
  }

  revalidatePath('/dashboard/inventory')
  return { success: true }
}

const batchSchema = z.object({
  batchId: z.string().optional(),
  itemId: z.string().min(1),
  organizationId: z.string().min(1),
  departmentId: z.string().optional(),
  batchNumber: z.string().min(1),
  quantity: z.number().int(),
  expiryDate: z.string().optional(),
  notes: z.string().optional(),
})

export async function upsertInventoryBatch(formData: FormData) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  const data = batchSchema.parse({
    batchId: formData.get('batchId') || undefined,
    itemId: formData.get('itemId'),
    organizationId: formData.get('organizationId'),
    departmentId: formData.get('departmentId') || undefined,
    batchNumber: formData.get('batchNumber'),
    quantity: Number(formData.get('quantity')),
    expiryDate: formData.get('expiryDate') || undefined,
    notes: formData.get('notes') || undefined,
  })

  const expiryDate = data.expiryDate ? new Date(data.expiryDate) : undefined

  if (data.batchId) {
    await prisma.inventoryBatch.update({
      where: { id: data.batchId },
      data: {
        itemId: data.itemId,
        organizationId: data.organizationId,
        departmentId: data.departmentId,
        batchNumber: data.batchNumber,
        quantity: data.quantity,
        expiryDate,
        notes: data.notes,
      },
    })
  } else {
    await prisma.inventoryBatch.create({
      data: {
        itemId: data.itemId,
        organizationId: data.organizationId,
        departmentId: data.departmentId,
        batchNumber: data.batchNumber,
        quantity: data.quantity,
        expiryDate,
        notes: data.notes,
      },
    })
  }

  revalidatePath('/dashboard/inventory')
  return { success: true }
}

const movementSchema = z.object({
  batchId: z.string().min(1),
  quantity: z.number().int(),
  type: z.enum(['PURCHASE', 'DONATION', 'DISPENSE', 'WASTAGE', 'ADJUSTMENT']),
  notes: z.string().optional(),
})

export async function recordInventoryMovement(formData: FormData) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  const data = movementSchema.parse({
    batchId: formData.get('batchId'),
    quantity: Number(formData.get('quantity')),
    type: formData.get('type'),
    notes: formData.get('notes') || undefined,
  })

  const batch = await prisma.inventoryBatch.findUnique({
    where: { id: data.batchId },
  })
  if (!batch) throw new Error('Batch not found')

  const nextQuantity = batch.quantity + data.quantity
  if (nextQuantity < 0) {
    throw new Error('Movement would reduce batch quantity below zero')
  }

  await prisma.$transaction([
    prisma.inventoryBatch.update({
      where: { id: batch.id },
      data: { quantity: nextQuantity },
    }),
    prisma.inventoryMovement.create({
      data: {
        batchId: batch.id,
        quantity: data.quantity,
        type: data.type,
        performedBy: user.id,
        notes: data.notes,
      },
    }),
  ])

  revalidatePath('/dashboard/inventory')
  return { success: true }
}

const alertSchema = z.object({
  alertId: z.string().min(1),
  status: z.enum(['ACTIVE', 'RESOLVED', 'DISMISSED']),
  notes: z.string().optional(),
})

export async function updateInventoryAlert(formData: FormData) {
  const user = await getSessionUser()
  if (!user) throw new Error('Unauthorized')

  const data = alertSchema.parse({
    alertId: formData.get('alertId'),
    status: formData.get('status'),
    notes: formData.get('notes') || undefined,
  })

  await prisma.inventoryAlert.update({
    where: { id: data.alertId },
    data: {
      status: data.status,
      resolvedAt: data.status === 'RESOLVED' || data.status === 'DISMISSED' ? new Date() : null,
      resolvedBy: data.status === 'ACTIVE' ? null : user.id,
      // We keep notes in the movement trail rather than the alert row itself.
    },
  })

  revalidatePath('/dashboard/inventory')
  return { success: true }
}
