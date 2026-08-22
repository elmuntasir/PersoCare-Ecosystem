import { prisma } from '@/lib/prisma'

type InventoryScope = {
  organizationId: string
  departmentId?: string
}

type InventoryCategoryRow = {
  id: string
  name: string
  description: string | null
  items: Array<{
    id: string
    name: string
    description: string | null
    unit: string | null
    reorderLevel: number | null
    batches: Array<{
      id: string
      quantity: number
      expiryDate: Date | null
      batchNumber: string
      receivedAt: Date
      notes: string | null
      department: { id: string; name: string } | null
    }>
  }>
}

type BloodUnitRow = {
  id: string
  bloodType: string
  volume: number
  status: string
  expiryDate: Date
  collectionDate: Date
  donorProfile: {
    user: { name: string | null } | null
  } | null
  batch: {
    batchNumber: string
    item: {
      name: string
    }
  } | null
}

type DispenseRow = {
  id: string
  prescriptionId: string
  prescriptionMedicine: { medicineName: string } | null
  batch: {
    batchNumber: string
    item: {
      name: string
      category: { name: string }
    }
  }
  quantity: number
  dispensedAt: Date
  dispensedBy: string
  notes: string | null
}

export type InventoryDashboardData = {
  summary: {
    categories: number
    items: number
    activeBatches: number
    totalUnits: number
    lowStockItems: number
    activeAlerts: number
    expiringSoonBatches: number
    bloodUnits: number
    recentMovements: number
    recentDispenses: number
  }
  categories: Array<{
    id: string
    name: string
    description: string | null
    itemCount: number
    totalUnits: number
    activeBatches: number
    lowStockItems: number
  }>
  lowStockItems: Array<{
    id: string
    name: string
    category: string
    unit: string | null
    reorderLevel: number | null
    totalUnits: number
    batches: number
  }>
  expiringBatches: Array<{
    id: string
    batchNumber: string
    itemName: string
    category: string
    quantity: number
    expiryDate: string | null
    receivedAt: string
    departmentName: string | null
  }>
  activeAlerts: Array<{
    id: string
    itemName: string
    category: string
    currentQuantity: number
    threshold: number
    triggeredAt: string
    departmentName: string | null
    status: string
  }>
  recentMovements: Array<{
    id: string
    type: string
    quantity: number
    performedAt: string
    notes: string | null
    batchNumber: string
    itemName: string
    category: string
  }>
  bloodSummary: {
    byType: Record<
      string,
      {
        total: number
        ready: number
        expiringSoon: number
        byStatus: Record<string, number>
      }
    >
    units: Array<{
      id: string
      bloodType: string
      status: string
      volume: number
      expiryDate: string
      donorName: string | null
      batchNumber: string | null
      itemName: string | null
    }>
  }
  recentDispenses: Array<{
    id: string
    prescriptionId: string
    medicineName: string | null
    batchNumber: string
    itemName: string
    category: string
    quantity: number
    dispensedAt: string
    dispensedBy: string
    notes: string | null
  }>
}

function toIso(date: Date | null | undefined) {
  return date ? date.toISOString() : null
}

export async function getInventoryDashboardData(
  organizationId: string,
  departmentId?: string
): Promise<InventoryDashboardData> {
  const scopeWhere = {
    organizationId,
    ...(departmentId ? { departmentId } : {}),
  }

  const [categoriesRaw, activeAlertsRaw, recentMovementsRaw, expiringBatchesRaw, bloodUnitsRaw, dispensesRaw] =
    await Promise.all([
      prisma.inventoryCategory.findMany({
        orderBy: { name: 'asc' },
        include: {
          items: {
            where: { isActive: true },
            orderBy: { name: 'asc' },
            include: {
              batches: {
                where: {
                  ...scopeWhere,
                  isActive: true,
                },
                orderBy: [{ expiryDate: 'asc' }, { receivedAt: 'desc' }],
                select: {
                  id: true,
                  quantity: true,
                  expiryDate: true,
                  batchNumber: true,
                  receivedAt: true,
                  notes: true,
                  department: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.inventoryAlert.findMany({
        where: {
          ...scopeWhere,
          status: 'ACTIVE',
        },
        orderBy: { triggeredAt: 'desc' },
        take: 12,
        include: {
          item: {
            include: {
              category: true,
            },
          },
          department: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.inventoryMovement.findMany({
        where: {
          batch: {
            is: scopeWhere,
          },
        },
        orderBy: { performedAt: 'desc' },
        take: 12,
        include: {
          batch: {
            include: {
              item: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      }),
      prisma.inventoryBatch.findMany({
        where: {
          ...scopeWhere,
          isActive: true,
          quantity: { gt: 0 },
          expiryDate: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: [{ expiryDate: 'asc' }, { receivedAt: 'desc' }],
        take: 12,
        include: {
          item: {
            include: {
              category: true,
            },
          },
          department: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.bloodDonationUnit.findMany({
        where: {
          organizationId,
        },
        orderBy: { expiryDate: 'asc' },
        take: 24,
        include: {
          donorProfile: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
          batch: {
            select: {
              batchNumber: true,
              item: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.prescriptionDispense.findMany({
        where: {
          batch: {
            is: scopeWhere,
          },
        },
        orderBy: { dispensedAt: 'desc' },
        take: 12,
        include: {
          prescriptionMedicine: {
            select: {
              medicineName: true,
            },
          },
          batch: {
            include: {
              item: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      }),
    ])

  const categories = categoriesRaw.map((category: InventoryCategoryRow) => {
    const itemStats = category.items.map((item) => {
      const totalUnits = item.batches.reduce((sum, batch) => sum + batch.quantity, 0)
      return {
        id: item.id,
        name: item.name,
        description: item.description,
        unit: item.unit,
        reorderLevel: item.reorderLevel,
        totalUnits,
        batches: item.batches.length,
      }
    })

    const totalUnits = itemStats.reduce((sum, item) => sum + item.totalUnits, 0)
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      itemCount: category.items.length,
      totalUnits,
      activeBatches: category.items.reduce((sum, item) => sum + item.batches.length, 0),
      lowStockItems: itemStats.filter((item) => item.reorderLevel != null && item.totalUnits <= item.reorderLevel).length,
    }
  })

  const lowStockItems = categoriesRaw.flatMap((category: InventoryCategoryRow) =>
    category.items
      .map((item) => {
        const totalUnits = item.batches.reduce((sum, batch) => sum + batch.quantity, 0)
        return {
          id: item.id,
          name: item.name,
          category: category.name,
          unit: item.unit,
          reorderLevel: item.reorderLevel,
          totalUnits,
          batches: item.batches.length,
        }
      })
      .filter((item) => item.reorderLevel != null && item.totalUnits <= item.reorderLevel)
  )

  const totalItems = categoriesRaw.reduce((sum, category) => sum + category.items.length, 0)
  const activeBatches = categoriesRaw.reduce(
    (sum, category) => sum + category.items.reduce((itemSum, item) => itemSum + item.batches.length, 0),
    0
  )
  const totalUnits = categoriesRaw.reduce(
    (sum, category) =>
      sum +
      category.items.reduce(
        (itemSum, item) => itemSum + item.batches.reduce((batchSum, batch) => batchSum + batch.quantity, 0),
        0
      ),
    0
  )

  const bloodSummary = bloodUnitsRaw.reduce<InventoryDashboardData['bloodSummary']>(
    (acc, unit: BloodUnitRow) => {
      const bloodType = unit.bloodType
      if (!acc.byType[bloodType]) {
        acc.byType[bloodType] = {
          total: 0,
          ready: 0,
          expiringSoon: 0,
          byStatus: {},
        }
      }

      const bucket = acc.byType[bloodType]
      bucket.total += 1
      bucket.byStatus[unit.status] = (bucket.byStatus[unit.status] ?? 0) + 1
      if (unit.status === 'READY') bucket.ready += 1
      if (unit.expiryDate.getTime() <= Date.now() + 7 * 24 * 60 * 60 * 1000) bucket.expiringSoon += 1

      acc.units.push({
        id: unit.id,
        bloodType: unit.bloodType,
        status: unit.status,
        volume: unit.volume,
        expiryDate: unit.expiryDate.toISOString(),
        donorName: unit.donorProfile?.user?.name ?? null,
        batchNumber: unit.batch?.batchNumber ?? null,
        itemName: unit.batch?.item?.name ?? null,
      })

      return acc
    },
    { byType: {}, units: [] }
  )

  const recentDispenses = dispensesRaw.map((dispense: DispenseRow) => ({
    id: dispense.id,
    prescriptionId: dispense.prescriptionId,
    medicineName: dispense.prescriptionMedicine?.medicineName ?? null,
    batchNumber: dispense.batch.batchNumber,
    itemName: dispense.batch.item.name,
    category: dispense.batch.item.category.name,
    quantity: dispense.quantity,
    dispensedAt: dispense.dispensedAt.toISOString(),
    dispensedBy: dispense.dispensedBy,
    notes: dispense.notes,
  }))

  return {
    summary: {
      categories: categoriesRaw.length,
      items: totalItems,
      activeBatches,
      totalUnits,
      lowStockItems: lowStockItems.length,
      activeAlerts: activeAlertsRaw.length,
      expiringSoonBatches: expiringBatchesRaw.length,
      bloodUnits: bloodUnitsRaw.length,
      recentMovements: recentMovementsRaw.length,
      recentDispenses: recentDispenses.length,
    },
    categories,
    lowStockItems,
    expiringBatches: expiringBatchesRaw.map((batch) => ({
      id: batch.id,
      batchNumber: batch.batchNumber,
      itemName: batch.item.name,
      category: batch.item.category.name,
      quantity: batch.quantity,
      expiryDate: toIso(batch.expiryDate),
      receivedAt: batch.receivedAt.toISOString(),
      departmentName: batch.department?.name ?? null,
    })),
    activeAlerts: activeAlertsRaw.map((alert) => ({
      id: alert.id,
      itemName: alert.item.name,
      category: alert.item.category.name,
      currentQuantity: alert.currentQuantity,
      threshold: alert.threshold,
      triggeredAt: alert.triggeredAt.toISOString(),
      departmentName: alert.department?.name ?? null,
      status: alert.status,
    })),
    recentMovements: recentMovementsRaw.map((movement) => ({
      id: movement.id,
      type: movement.type,
      quantity: movement.quantity,
      performedAt: movement.performedAt.toISOString(),
      notes: movement.notes,
      batchNumber: movement.batch.batchNumber,
      itemName: movement.batch.item.name,
      category: movement.batch.item.category.name,
    })),
    bloodSummary,
    recentDispenses,
  }
}
