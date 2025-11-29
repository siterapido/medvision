export interface DashboardProfile {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  role: string | null
  plan_type?: string | null
  trial_ends_at?: string | null
  trial_started_at?: string | null
  trial_used?: boolean | null
}
