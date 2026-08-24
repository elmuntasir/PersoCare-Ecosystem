'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

export type Role = 'patient' | 'doctor' | 'physiotherapist' | 'radiologist' | 'admin'
export type RoleSwitchPhase = 'idle' | 'out' | 'in'

interface RoleContextType {
  activeRole: Role
  setActiveRole: (role: Role) => void
  availableRoles: Role[]
  setAvailableRoles: (roles: Role[]) => void
  isPlatformOwner: boolean
  setIsPlatformOwner: (flag: boolean) => void
  isSwitching: boolean
  switchPhase: RoleSwitchPhase
  beginRoleSwitch: () => void
  completeRoleSwitch: () => void
  cancelRoleSwitch: () => void
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

const STORAGE_KEY = 'persocare_active_role'
const SWITCH_OUT_MS = 220
const SWITCH_IN_MS = 480

export function RoleProvider({ children }: { children: ReactNode }) {
  const [activeRole, setActiveRoleState] = useState<Role>('patient')
  const [availableRoles, setAvailableRoles] = useState<Role[]>(['patient'])
  const [isPlatformOwner, setIsPlatformOwner] = useState(false)
  const [switchPhase, setSwitchPhase] = useState<RoleSwitchPhase>('idle')

  const isSwitching = switchPhase !== 'idle'

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored && availableRoles.includes(stored as Role)) {
        setActiveRoleState(stored as Role)
      }
    } catch {
      // Ignore localStorage errors in SSR/restricted environments
    }
  }, [availableRoles])

  const beginRoleSwitch = useCallback(() => {
    setSwitchPhase('out')
  }, [])

  const completeRoleSwitch = useCallback(() => {
    setSwitchPhase('in')
    window.setTimeout(() => setSwitchPhase('idle'), SWITCH_IN_MS)
  }, [])

  const cancelRoleSwitch = useCallback(() => {
    setSwitchPhase('idle')
  }, [])

  const setActiveRole = (role: Role) => {
    beginRoleSwitch()
    setActiveRoleState(role)
    try {
      localStorage.setItem(STORAGE_KEY, role)
    } catch {}
    window.setTimeout(() => completeRoleSwitch(), SWITCH_OUT_MS)
  }

  return (
    <RoleContext.Provider
      value={{
        activeRole,
        setActiveRole,
        availableRoles,
        setAvailableRoles,
        isPlatformOwner,
        setIsPlatformOwner,
        isSwitching,
        switchPhase,
        beginRoleSwitch,
        completeRoleSwitch,
        cancelRoleSwitch,
      }}
    >
      {children}
    </RoleContext.Provider>
  )
}

export function useRole(): RoleContextType {
  const context = useContext(RoleContext)
  if (!context) throw new Error('useRole must be used within RoleProvider')
  return context
}

export const ROLE_SWITCH_OUT_MS = SWITCH_OUT_MS
