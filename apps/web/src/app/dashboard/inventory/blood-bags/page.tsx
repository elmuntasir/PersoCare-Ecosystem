import { requireDashboardUser } from '@/lib/get-current-dashboard-user'
import { resolveInventoryOrganization } from '@/lib/resolve-inventory-org'
import { getOrganizationBloodUnits } from '@/actions/inventory/blood-bags'
import { getOrganizationBloodBagRequests } from '@/actions/blood/bag-requests'
import { InventoryBloodBagsClient } from '@/components/inventory/InventoryBloodBagsClient'
import { Droplet, ShieldAlert } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Blood Bags - PersoCare',
  description: 'Track blood bag units, donor allocations, and availability by blood type.',
}

export default async function BloodBagsPage() {
  await requireDashboardUser()

  const organization = await resolveInventoryOrganization()

  if (!organization) {
    return (
      <main className="min-h-full bg-[var(--paper)] px-4 py-10 md:px-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center rounded-[2rem] border border-[var(--sage-200)] bg-white p-8 text-center shadow-sm">
          <div className="rounded-2xl bg-[var(--coral)]/10 p-4">
            <ShieldAlert className="h-8 w-8 text-[var(--coral)]" />
          </div>
          <h1 className="mt-5 font-display text-3xl text-[var(--teal-900)]">
            Blood bag tracking is organization-based
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">
            Assign yourself as an inventory manager, or join an organization with an active inventory, to manage its blood
            bags here.
          </p>
          <Link
            href="/dashboard/inventory"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--teal-900)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Droplet className="h-4 w-4" />
            Go to Inventory
          </Link>
        </div>
      </main>
    )
  }

  const data = await getOrganizationBloodUnits(organization.id)
  const requests = await getOrganizationBloodBagRequests(organization.id)

  return (
    <main className="min-h-full bg-[var(--paper)] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <InventoryBloodBagsClient
          organizationId={organization.id}
          organizationName={organization.name}
          organizationType={organization.organizationType.name}
          data={data}
          requests={requests}
        />
      </div>
    </main>
  )
}