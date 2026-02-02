/**
 * Funnel System Types
 * Multi-funnel configuration and tracking for sales/conversion pipelines
 */

// Funnel types enum
export type FunnelType = 'cold_prospecting' | 'paid_traffic' | 'event' | 'trial'

// Available view types for funnels
export type FunnelView = 'kanban' | 'timeline' | 'list'

// Source table for funnel data
export type FunnelSource = 'leads' | 'profiles'

// Stage configuration within a funnel
export interface FunnelStage {
  id: string
  title: string
  emoji: string
  color: string
  description: string
  order: number
}

// Full funnel configuration
export interface FunnelConfiguration {
  id: string
  name: string
  slug: string
  description: string | null
  funnel_type: FunnelType
  trial_duration_days: number | null
  stages: FunnelStage[]
  available_views: FunnelView[]
  source_table: FunnelSource
  is_active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

// Funnel metrics for dashboard display
export interface FunnelMetrics {
  funnel_id: string
  funnel_name: string
  funnel_slug: string
  funnel_type: FunnelType
  total_leads: number
  converted_leads: number
  conversion_rate: number
  stage_counts: Record<string, number>
  last_7_days_new: number
  last_7_days_converted: number
}

// Funnel card display data (for dashboard)
export interface FunnelCardData {
  id: string
  name: string
  slug: string
  description: string | null
  funnel_type: FunnelType
  trial_duration_days: number | null
  available_views: FunnelView[]
  source_table: FunnelSource
  is_active: boolean
  is_default: boolean
  // Metrics
  total_leads: number
  converted_leads: number
  conversion_rate: number
  urgent_count: number // For trial funnels: leads in risk stages
}

// Create/Update funnel input
export interface FunnelInput {
  name: string
  slug?: string
  description?: string | null
  funnel_type: FunnelType
  trial_duration_days?: number | null
  stages: FunnelStage[]
  available_views: FunnelView[]
  source_table: FunnelSource
  is_active?: boolean
  is_default?: boolean
}

// Funnel type display configuration
export const FUNNEL_TYPE_CONFIG: Record<FunnelType, { label: string; icon: string; color: string }> = {
  cold_prospecting: {
    label: 'Prospecção Fria',
    icon: '❄️',
    color: 'bg-blue-500'
  },
  paid_traffic: {
    label: 'Tráfego Pago',
    icon: '🎯',
    color: 'bg-amber-500'
  },
  event: {
    label: 'Eventos',
    icon: '🎥',
    color: 'bg-violet-500'
  },
  trial: {
    label: 'Trial',
    icon: '⏱️',
    color: 'bg-cyan-500'
  }
}

// View type display configuration
export const VIEW_TYPE_CONFIG: Record<FunnelView, { label: string; icon: string }> = {
  kanban: { label: 'Kanban', icon: '📋' },
  timeline: { label: 'Timeline', icon: '📅' },
  list: { label: 'Lista', icon: '📝' }
}
