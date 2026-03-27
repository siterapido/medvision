'use client'

import { createContext, useContext } from 'react'

interface DashboardUser {
  id?: string
  name?: string | null
  email?: string | null
  avatar_url?: string | null
  plan_type?: string | null
  subscription_status?: string | null
  trial_ends_at?: string | null
}

interface DashboardUserContextValue {
  user: DashboardUser | null
  isTrialUser: boolean
}

const DashboardUserContext = createContext<DashboardUserContextValue>({
  user: null,
  isTrialUser: true,
})

export function DashboardUserProvider({
  user,
  children,
}: {
  user: DashboardUser
  children: React.ReactNode
}) {
  const isTrialUser = user.plan_type === 'free' || !user.plan_type

  return (
    <DashboardUserContext.Provider value={{ user, isTrialUser }}>
      {children}
    </DashboardUserContext.Provider>
  )
}

export function useDashboardUser() {
  return useContext(DashboardUserContext)
}
