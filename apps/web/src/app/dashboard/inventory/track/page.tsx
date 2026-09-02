import { requireDashboardUser } from '@/lib/get-current-dashboard-user'
import { resolveInventoryOrganization } from '@/lib/resolve-inventory-org'
import { getInventoryDashboardData } from '@/lib/inventory'
import { TrackItemsClient } from './TrackItemsClient'
import { ShieldAlert } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Track Items - PersoCare Inventory',
  description: 'View stock movements and manage low-stock alerts across your organization.',
}

export default async function TrackPage() {
  await requireDashboardUser()

  const organization = await resolveInventoryOrganization()

  if (!organization) {
    return (
      <main className="min-h-full bg-[var(--paper)] px-4 py-10 md:px-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center rounded-[2rem] border border-[var(--sage-200)] bg-white p-8 text-center shadow-sm">
          <div className="rounded-2xl bg-[var(--teal-900)]/10 p-4">
            <ShieldAlert className="h-8 w-8 text-[var(--teal-900)]" />
          </div>
          <h1 className="mt-5 font-display text-3xl text-[var(--teal-900)]">Access denied</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
            You need an active organization role to view inventory movements.
          </p>
          <Link
            href="/dashboard/inventory"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--teal-900)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Back to Inventory
          </Link>
        </div>
      </main>
    )
  }

  const dashboardData = await getInventoryDashboardData(organization.id)

  return (
    <main className="min-h-full bg-[var(--paper)] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <TrackItemsClient
          organizationId={organization.id}
          organizationName={organization.name}
          organizationType={organization.organizationType.name}
          data={dashboardData}
        />
      </div>
    </main>
  )
}