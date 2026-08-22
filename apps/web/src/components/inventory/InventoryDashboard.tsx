import {
  Activity,
  AlertTriangle,
  ArrowDownUp,
  Boxes,
  Clock3,
  ClipboardList,
  Droplets,
  Package,
  Pill,
} from 'lucide-react'
import type { ComponentType } from 'react'
import type { InventoryDashboardData } from '@/lib/inventory'

type Props = {
  organizationName: string
  organizationType: string
  data: InventoryDashboardData
}

function formatDate(value: string | null) {
  if (!value) return 'No expiry'
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function StatCard({
  label,
  value,
  note,
  icon: Icon,
  tone,
  bg,
}: {
  label: string
  value: number
  note: string
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
  tone: string
  bg: string
}) {
  return (
    <div className="rounded-3xl border border-[var(--sage-200)] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--ink-soft)]">{label}</p>
          <p className={`mt-2 text-3xl font-display font-semibold ${tone}`}>{value}</p>
          <p className="mt-1 text-xs text-[var(--ink-soft)]">{note}</p>
        </div>
        <div className={`rounded-2xl p-3 ${bg}`}>
          <Icon className={`h-5 w-5 ${tone}`} strokeWidth={1.8} />
        </div>
      </div>
    </div>
  )
}

export function InventoryDashboard({ organizationName, organizationType, data }: Props) {
  const bloodTypes = Object.entries(data.bloodSummary.byType)

  return (
    <div className="space-y-8 pb-10">
      <section className="rounded-[2rem] border border-[var(--sage-200)] bg-gradient-to-br from-white via-[var(--paper)] to-emerald-50/40 p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--sage-200)] bg-white px-3 py-1 text-xs font-semibold tracking-[0.14em] text-[var(--ink-soft)]">
              <Package className="h-3.5 w-3.5 text-[var(--teal-700)]" strokeWidth={2} />
              INVENTORY MANAGEMENT
            </div>
            <h1 className="mt-4 font-display text-3xl font-semibold tracking-[-0.02em] text-[var(--teal-900)] md:text-4xl">
              {organizationName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-soft)] md:text-base">
              A unified stock view for {organizationType.toLowerCase()} operations, blood bank inventory, and pharmacy dispensing.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--sage-200)] bg-white px-4 py-3 text-center shadow-sm">
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--ink-soft)]">Categories</p>
              <p className="mt-1 text-2xl font-display font-semibold text-[var(--teal-900)]">{data.summary.categories}</p>
            </div>
            <div className="rounded-2xl border border-[var(--sage-200)] bg-white px-4 py-3 text-center shadow-sm">
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--ink-soft)]">Active Batches</p>
              <p className="mt-1 text-2xl font-display font-semibold text-[var(--teal-900)]">{data.summary.activeBatches}</p>
            </div>
            <div className="rounded-2xl border border-[var(--sage-200)] bg-white px-4 py-3 text-center shadow-sm sm:col-span-1">
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--ink-soft)]">Units</p>
              <p className="mt-1 text-2xl font-display font-semibold text-[var(--teal-900)]">{data.summary.totalUnits}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tracked Items"
          value={data.summary.items}
          note="Active item definitions across all categories"
          icon={Boxes}
          tone="text-[var(--teal-900)]"
          bg="bg-[var(--teal-900)]/10"
        />
        <StatCard
          label="Low Stock"
          value={data.summary.lowStockItems}
          note="Items at or below reorder level"
          icon={AlertTriangle}
          tone="text-amber-700"
          bg="bg-amber-50"
        />
        <StatCard
          label="Expiring Soon"
          value={data.summary.expiringSoonBatches}
          note="Batches nearing expiry within 30 days"
          icon={Clock3}
          tone="text-rose-700"
          bg="bg-rose-50"
        />
        <StatCard
          label="Alerts"
          value={data.summary.activeAlerts}
          note="Open inventory alerts that need review"
          icon={Activity}
          tone="text-indigo-700"
          bg="bg-indigo-50"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="rounded-[2rem] border border-[var(--sage-200)] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl text-[var(--teal-900)]">Category Snapshots</h2>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">A quick look at what each inventory category is carrying right now.</p>
            </div>
          </div>

          {data.categories.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {data.categories.map((category) => (
                <div key={category.id} className="rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-lg text-[var(--teal-900)]">{category.name}</h3>
                      <p className="mt-1 text-xs text-[var(--ink-soft)]">{category.description || 'No description provided.'}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                      {category.itemCount} items
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-white p-3 text-center">
                      <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--ink-soft)]">Units</p>
                      <p className="mt-1 text-lg font-semibold text-[var(--teal-900)]">{category.totalUnits}</p>
                    </div>
                    <div className="rounded-xl bg-white p-3 text-center">
                      <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--ink-soft)]">Batches</p>
                      <p className="mt-1 text-lg font-semibold text-[var(--teal-900)]">{category.activeBatches}</p>
                    </div>
                    <div className="rounded-xl bg-white p-3 text-center">
                      <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--ink-soft)]">At Risk</p>
                      <p className="mt-1 text-lg font-semibold text-rose-700">{category.lowStockItems}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--sage-200)] bg-[var(--paper)] p-8 text-center">
              <Package className="mx-auto h-10 w-10 text-[var(--ink-soft)]" strokeWidth={1.5} />
              <p className="mt-3 font-medium text-[var(--teal-900)]">No inventory categories yet</p>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">Seed data will populate the default categories once the database is synced.</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-[var(--sage-200)] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl text-[var(--teal-900)]">Low Stock</h2>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">Items that need reorder attention.</p>
              </div>
              <Pill className="h-5 w-5 text-amber-600" />
            </div>

            {data.lowStockItems.length > 0 ? (
              <div className="space-y-3">
                {data.lowStockItems.slice(0, 6).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--teal-900)]">{item.name}</p>
                        <p className="text-xs text-[var(--ink-soft)]">
                          {item.category}
                          {item.unit ? ` · ${item.unit}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono uppercase tracking-[0.14em] text-[var(--ink-soft)]">Stock</p>
                        <p className="text-lg font-semibold text-amber-700">{item.totalUnits}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-[var(--ink-soft)]">
                      <span>Reorder level: {item.reorderLevel ?? 'Unset'}</span>
                      <span>{item.batches} batches</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-[var(--sage-200)] bg-[var(--paper)] p-6 text-sm text-[var(--ink-soft)]">
                No items are currently below their reorder level.
              </p>
            )}
          </div>

          <div className="rounded-[2rem] border border-[var(--sage-200)] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl text-[var(--teal-900)]">Expiring Batches</h2>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">Batches expiring in the next 30 days.</p>
              </div>
              <Clock3 className="h-5 w-5 text-rose-600" />
            </div>

            {data.expiringBatches.length > 0 ? (
              <div className="space-y-3">
                {data.expiringBatches.slice(0, 6).map((batch) => (
                  <div key={batch.id} className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--teal-900)]">{batch.itemName}</p>
                        <p className="text-xs text-[var(--ink-soft)]">
                          {batch.category} · {batch.batchNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono uppercase tracking-[0.14em] text-[var(--ink-soft)]">Expiry</p>
                        <p className="text-sm font-semibold text-rose-700">{formatDate(batch.expiryDate)}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-[var(--ink-soft)]">
                      <span>Qty: {batch.quantity}</span>
                      <span>{batch.departmentName || 'Main store'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-[var(--sage-200)] bg-[var(--paper)] p-6 text-sm text-[var(--ink-soft)]">
                No batches are nearing expiry right now.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-[var(--sage-200)] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-[var(--teal-900)]">Active Alerts</h2>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">Thresholds that need review or closure.</p>
            </div>
            <AlertTriangle className="h-5 w-5 text-indigo-600" />
          </div>

          {data.activeAlerts.length > 0 ? (
            <div className="space-y-3">
              {data.activeAlerts.map((alert) => (
                <div key={alert.id} className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--teal-900)]">{alert.itemName}</p>
                      <p className="text-xs text-[var(--ink-soft)]">
                        {alert.category}
                        {alert.departmentName ? ` · ${alert.departmentName}` : ''}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-mono uppercase tracking-[0.14em] text-indigo-700">
                      {alert.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-[var(--ink-soft)]">
                    <span>Current: {alert.currentQuantity}</span>
                    <span>Threshold: {alert.threshold}</span>
                  </div>
                  <p className="mt-2 text-xs text-[var(--ink-soft)]">Triggered {formatDateTime(alert.triggeredAt)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-[var(--sage-200)] bg-[var(--paper)] p-6 text-sm text-[var(--ink-soft)]">
              No active alerts. Stock levels are currently healthy.
            </p>
          )}
        </div>

        <div className="rounded-[2rem] border border-[var(--sage-200)] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-[var(--teal-900)]">Recent Movements</h2>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">Latest inbound, outbound, and adjustment events.</p>
            </div>
            <ArrowDownUp className="h-5 w-5 text-[var(--teal-700)]" />
          </div>

          {data.recentMovements.length > 0 ? (
            <div className="space-y-3">
              {data.recentMovements.map((movement) => (
                <div key={movement.id} className="rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--teal-900)]">{movement.itemName}</p>
                      <p className="text-xs text-[var(--ink-soft)]">
                        {movement.category} · {movement.batchNumber}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-mono uppercase tracking-[0.14em] ${
                        movement.quantity >= 0
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {movement.type}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-[var(--ink-soft)]">
                    <span>Quantity: {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}</span>
                    <span>{formatDateTime(movement.performedAt)}</span>
                  </div>
                  {movement.notes ? <p className="mt-2 text-xs text-[var(--ink-soft)]">{movement.notes}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-[var(--sage-200)] bg-[var(--paper)] p-6 text-sm text-[var(--ink-soft)]">
              No inventory movements have been recorded yet.
            </p>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-[var(--sage-200)] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-[var(--teal-900)]">Blood Bank Snapshot</h2>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">Blood units tracked through the inventory system.</p>
            </div>
            <Droplets className="h-5 w-5 text-rose-600" />
          </div>

          {bloodTypes.length > 0 ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {bloodTypes.map(([bloodType, stats]) => (
                  <div key={bloodType} className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
                    <p className="text-xs font-mono uppercase tracking-[0.16em] text-[var(--ink-soft)]">{bloodType}</p>
                    <p className="mt-1 text-2xl font-display font-semibold text-rose-700">{stats.total}</p>
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">
                      {stats.ready} ready · {stats.expiringSoon} expiring soon
                    </p>
                  </div>
                ))}
              </div>

              <div className="overflow-hidden rounded-2xl border border-[var(--sage-200)]">
                <div className="max-h-[22rem] overflow-y-auto">
                  <table className="min-w-full divide-y divide-[var(--sage-200)]">
                    <thead className="sticky top-0 bg-[var(--paper)]">
                      <tr className="text-left text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                        <th className="px-4 py-3">Blood Type</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Donor</th>
                        <th className="px-4 py-3">Expiry</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--sage-200)] bg-white">
                      {data.bloodSummary.units.map((unit) => (
                        <tr key={unit.id} className="text-sm">
                          <td className="px-4 py-3 font-semibold text-[var(--teal-900)]">{unit.bloodType}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-[var(--paper)] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                              {unit.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[var(--ink-soft)]">{unit.donorName || 'Unknown donor'}</td>
                          <td className="px-4 py-3 text-[var(--ink-soft)]">{formatDate(unit.expiryDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-[var(--sage-200)] bg-[var(--paper)] p-6 text-sm text-[var(--ink-soft)]">
              No blood donation units have been created yet.
            </p>
          )}
        </div>

        <div className="rounded-[2rem] border border-[var(--sage-200)] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-[var(--teal-900)]">Recent Dispenses</h2>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">Medication stock that has been issued against prescriptions.</p>
            </div>
            <ClipboardList className="h-5 w-5 text-[var(--teal-700)]" />
          </div>

          {data.recentDispenses.length > 0 ? (
            <div className="space-y-3">
              {data.recentDispenses.map((dispense) => (
                <div key={dispense.id} className="rounded-2xl border border-[var(--sage-200)] bg-[var(--paper)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--teal-900)]">{dispense.medicineName || dispense.itemName}</p>
                      <p className="text-xs text-[var(--ink-soft)]">
                        {dispense.category} · {dispense.batchNumber}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--teal-900)]">
                      {dispense.quantity}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-[var(--ink-soft)]">
                    <span>Prescription: {dispense.prescriptionId.slice(0, 8)}</span>
                    <span>{formatDateTime(dispense.dispensedAt)}</span>
                  </div>
                  {dispense.notes ? <p className="mt-2 text-xs text-[var(--ink-soft)]">{dispense.notes}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-[var(--sage-200)] bg-[var(--paper)] p-6 text-sm text-[var(--ink-soft)]">
              No prescription dispenses have been recorded yet.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
