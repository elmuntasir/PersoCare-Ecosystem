import { requireDashboardUser } from '@/lib/get-current-dashboard-user'
import { resolveInventoryOrganization } from '@/lib/resolve-inventory-org'
import { getInventoryManagementData } from '@/actions/inventory/manage'
import { AddItemClient } from './AddItemClient'
import { ShieldAlert } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Add Items - PersoCare Inventory',
  description: 'Create new inventory items and register stock batches.',
}

export default async function AddItemPage() {
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
            You need an active organization role to add inventory items.
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

  const manageData = await getInventoryManagementData(organization.id)

  return (
    <main className="min-h-full bg-[var(--paper)] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-4xl">
        <AddItemClient
          organizationId={organization.id}
          organizationName={organization.name}
          organizationType={organization.organizationType.name}
          manageData={manageData}
        />
      </div>
    </main>
  )
}