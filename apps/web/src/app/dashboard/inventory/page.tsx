import { requireDashboardUser } from '@/lib/get-current-dashboard-user'
import { resolveInventoryOrganization } from '@/lib/resolve-inventory-org'
import { getInventoryDashboardData } from '@/lib/inventory'
import { InventoryDashboard } from '@/components/inventory/InventoryDashboard'
import { Building2, ShieldAlert } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Inventory Dashboard - PersoCare',
  description: 'Track inventory stock, blood units, and pharmacy dispenses from one place.',
}

export default async function InventoryPage() {
  await requireDashboardUser()

  const organization = await resolveInventoryOrganization()

  if (!organization) {
    return (
      <main className="min-h-full bg-[var(--paper)] px-4 py-10 md:px-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center rounded-[2rem] border border-[var(--sage-200)] bg-white p-8 text-center shadow-sm">
          <div className="rounded-2xl bg-[var(--teal-900)]/10 p-4">
            <ShieldAlert className="h-8 w-8 text-[var(--teal-900)]" />
          </div>
          <h1 className="mt-5 font-display text-3xl text-[var(--teal-900)]">Inventory access is organization-based</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
            We could not find an active organization membership or admin assignment for your account yet. Once you join or
            administer an organization, its inventory will appear here.
          </p>
          <Link
            href="/dashboard/organization"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--teal-900)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Building2 className="h-4 w-4" />
            Go to Organization Center
          </Link>
        </div>
      </main>
    )
  }

  const data = await getInventoryDashboardData(organization.id)

  return (
    <main className="min-h-full bg-[var(--paper)] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <InventoryDashboard
          organizationName={organization.name}
          organizationType={organization.organizationType.name}
          data={data}
        />
      </div>
    </main>
  )
}