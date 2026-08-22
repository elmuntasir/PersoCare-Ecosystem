import { getSessionUser } from '@/lib/auth'
import { searchBloodRequests, searchDonors } from '@/actions/blood/request'
import { getDonorProfile } from '@/actions/blood/donor'
import { BloodDonationClient } from '@/components/blood/BloodDonationClient'
import { redirect } from 'next/navigation'

export default async function BloodDonationPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const fd = new FormData()
  const [requests, donors, donorProfile] = await Promise.all([
    searchBloodRequests(fd),
    searchDonors(fd),
    getDonorProfile(),
  ])

  return (
    <div className="py-8 px-4 md:px-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl md:text-4xl text-[var(--teal-900)] mb-1">
          Blood Donation Network
        </h1>
        <p className="font-body text-sm text-[var(--ink-soft)]">
          Find available donors, manage emergency blood requests, and support our community.
        </p>
      </div>

      <BloodDonationClient
        initialRequests={requests}
        initialDonors={donors}
        currentUserId={user.id}
        donorProfile={donorProfile}
      />
    </div>
  )
}
