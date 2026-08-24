'use client'

import { usePathname } from 'next/navigation'
import { useRole, Role } from '@/contexts/RoleContext'
import { useAvatar } from '@/contexts/AvatarContext'
import Link from 'next/link'
import {
  LayoutDashboard,
  Utensils,
  Dumbbell,
  Pill,
  Calendar,
  FileText,
  BarChart,
  Building,
  User,
  Settings,
  LogOut,
  Users,
  Clock,
  FileCheck,
  Package,
  Droplet,
  Heart,
  Feather,
  Megaphone,
  Clipboard,
  Activity,
} from 'lucide-react'
import { FunAvatar } from '@/components/avatar/FunAvatar'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

const roleNavItems: Record<Role, { href: string; label: string; icon: any }[]> = {
  patient: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/diet', label: 'Diet Plan', icon: Utensils },
    { href: '/dashboard/exercise', label: 'Exercise Log', icon: Dumbbell },
    { href: '/dashboard/medicine', label: 'Medicine Log', icon: Pill },
    { href: '/dashboard/metabolic-risk', label: 'Metabolic Risk Calculator', icon: Activity },
    { href: '/dashboard/log-history', label: 'Log History', icon: BarChart },
    { href: '/dashboard/appointments', label: 'Appointments', icon: Calendar },
    { href: '/dashboard/records', label: 'Medical Records', icon: Clipboard },
    { href: '/dashboard/blood-donation', label: 'Blood Donation', icon: Heart },
    { href: '/dashboard/ai', label: 'AI Assistant', icon: Feather },
    { href: '/dashboard/profile', label: 'Profile', icon: User },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ],
  doctor: [
    { href: '/dashboard/doctor', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/doctor/appointments', label: 'Appointments', icon: Calendar },
    { href: '/dashboard/doctor/schedule', label: 'My Schedule', icon: Clock },
    { href: '/dashboard/doctor/my-organization', label: 'My Organization', icon: Building },
    { href: '/dashboard/records', label: 'Medical Records', icon: FileText },
    { href: '/dashboard/profile', label: 'Profile', icon: User },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ],
  physiotherapist: [
    { href: '/dashboard/physio', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/physio/appointments', label: 'Appointments', icon: Calendar },
    { href: '/dashboard/physio/schedule', label: 'My Schedule', icon: Clock },
    { href: '/dashboard/physio/my-organization', label: 'My Organization', icon: Building },
    { href: '/dashboard/profile', label: 'Profile', icon: User },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ],
  radiologist: [
    { href: '/dashboard/radio', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/radio/appointments', label: 'Appointments', icon: Calendar },
    { href: '/dashboard/radio/schedule', label: 'My Schedule', icon: Clock },
    { href: '/dashboard/radio/my-organization', label: 'My Organization', icon: Building },
    { href: '/dashboard/profile', label: 'Profile', icon: User },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ],
  admin: [
    { href: '/dashboard/organization/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/organization', label: 'Manage Organization', icon: Building },
    { href: '/dashboard/organization/employees', label: 'Manage Employees', icon: Users },
    { href: '/dashboard/organization/admin/approvals', label: 'Pending Approvals', icon: Clock },
    { href: '/dashboard/organization/admin/approval-history', label: 'Approval History', icon: FileCheck },
    { href: '/dashboard/inventory', label: 'Inventory', icon: Package },
    { href: '/dashboard/blood-donation/admin/verifications', label: 'Donor Verifications', icon: Heart },
    { href: '/dashboard/profile', label: 'Profile', icon: User },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ],
}

// Platform Owner extra items (added to admin sidebar when isPlatformOwner is true)
const platformOwnerItems = [
  { href: '/platform-admin/dashboard', label: 'Platform Dashboard', icon: LayoutDashboard },
  { href: '/platform-admin/users', label: 'Manage Users', icon: Users },
  { href: '/platform-admin/organizations', label: 'Organizations', icon: Building },
  { href: '/platform-admin/applications', label: 'Applications', icon: Clock },
  { href: '/platform-admin/audit', label: 'Audit Log', icon: FileText },
  { href: '/platform-admin/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/platform-admin/settings', label: 'Platform Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { activeRole, availableRoles, setActiveRole, isPlatformOwner, isSwitching } = useRole()
  const { mode } = useAvatar()

  // Build nav items
  let navItems = [...(roleNavItems[activeRole] || roleNavItems.patient)]

  // Add platform owner items if isPlatformOwner and role is admin
  if (isPlatformOwner && activeRole === 'admin') {
    navItems = [...navItems, ...platformOwnerItems]
  }

  // Show all available roles for switching
  const roleLabels: Record<Role, string> = {
    patient: 'User',
    doctor: 'Doctor',
    physiotherapist: 'Physiotherapist',
    radiologist: 'Radiologist',
    admin: 'Admin / Org Lead',
  }

  const renderAvatar = () => {
    if (mode === 'fun') {
      return (
        <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--teal-900)] flex items-center justify-center">
          <FunAvatar className="w-8 h-8" overrideAnimation="idle" showLabel={false} />
        </div>
      )
    }
    return (
      <div className="w-8 h-8 rounded-full bg-[var(--sage-200)] flex items-center justify-center text-xs font-semibold text-[var(--teal-900)]">
        {activeRole.charAt(0).toUpperCase()}
      </div>
    )
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 bg-white border-r border-[var(--sage-200)] min-h-screen p-4 flex flex-col shrink-0 overflow-y-auto custom-scrollbar select-none">
      {/* Logo */}
      <div className="mb-5">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl text-[var(--teal-900)]">PersoCare</h1>
        </div>
        <div className="flex items-center gap-2 mt-2">
          {renderAvatar()}
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <span className="text-[11px] font-mono text-[var(--ink-soft)] bg-[var(--paper)] border border-[var(--sage-200)] px-2 py-0.5 rounded-full font-medium">
              {roleLabels[activeRole] || activeRole}
            </span>
            {isPlatformOwner && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--teal-900)] text-white font-semibold shadow-2xs">
                Platform Owner
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Role Switcher with Animation */}
      {availableRoles.length > 1 && (
        <div className="mb-4 pt-1">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-soft)] mb-2">Switch Profile</p>
          <div className="flex flex-wrap gap-1.5">
            {availableRoles.map((role) => {
              const isActive = role === activeRole
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setActiveRole(role)}
                  className={`px-3 py-1.5 rounded-full text-xs font-body transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'bg-[var(--teal-900)] text-white shadow-xs font-semibold scale-105'
                      : 'bg-[var(--paper)] border border-[var(--sage-200)] text-[var(--ink-soft)] hover:bg-[var(--sage-200)] hover:text-[var(--ink)]'
                  } ${isSwitching ? 'opacity-50 scale-95' : ''}`}
                >
                  {roleLabels[role] || role}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={`flex-1 space-y-1 transition-all duration-300 ${isSwitching ? 'role-switch-out' : 'role-switch-in'}`}>
        <SidebarItems items={navItems} pathname={pathname} />
      </nav>

      {/* Bottom */}
      <div className="mt-6 pt-4 border-t border-[var(--sage-200)]">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[var(--ink-soft)] hover:bg-rose-50 hover:text-rose-700 transition-colors w-full font-body text-xs font-medium cursor-pointer"
        >
          <LogOut className="w-4 h-4" strokeWidth={1.8} />
          Logout
        </button>
      </div>
    </aside>
  )
}

function SidebarItems({ items, pathname }: { items: any[]; pathname: string }) {
  return (
    <>
      {items.map((item) => {
        const isActive = pathname === item.href || (pathname?.startsWith(item.href + '/') && item.href !== '/dashboard')
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-item flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-body text-xs transition-all duration-200 ${
              isActive
                ? 'active bg-[var(--teal-900)] text-white shadow-xs font-semibold'
                : 'text-[var(--ink-soft)] hover:bg-[var(--paper)] hover:text-[var(--teal-900)]'
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[var(--coral)]' : 'text-[var(--ink-soft)]'}`} strokeWidth={1.8} />
            <span className="truncate">{item.label}</span>
          </Link>
        )
      })}
    </>
  )
}
