import { requireDashboardUser } from "@/lib/get-current-dashboard-user";
import { getProfileData } from "@/actions/profile";
import { ProfileClient } from "@/components/profile/ProfileClient";

export default async function ProfilePage() {
  await requireDashboardUser();
  const profileData = await getProfileData();

  return (
    <div className="min-h-screen bg-[var(--paper)] py-8 px-4 md:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-[var(--teal-900)] tracking-[-0.01em]">
            My Account &amp; Health Profile
          </h1>
          <p className="font-body text-sm text-[var(--ink-soft)] mt-1">
            Manage your personal credentials, medical details, emergency information, and professional eKYC status.
          </p>
        </div>

        <ProfileClient initialData={profileData} />
      </div>
    </div>
  );
}
