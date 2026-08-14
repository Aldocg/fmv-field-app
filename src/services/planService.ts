import { supabase } from '../lib/supabase'
import type {
  MonthlyServiceHistory,
  MonthlyServiceItem,
  MonthlyServicePlan,
  OperationalStatus
} from '../types/domain'

export async function getOpenPlans(): Promise<MonthlyServicePlan[]> {
  const { data, error } = await supabase
    .from('monthly_service_plans')
    .select('id_plan, plan_year, plan_month, id_servicio, service_name_snapshot, plan_status, notes')
    .eq('plan_status', 'open')
    .order('plan_year', { ascending: false })
    .order('plan_month', { ascending: false })

  if (error) throw error
  return (data || []) as MonthlyServicePlan[]
}

export async function getOpenPlanItems(): Promise<MonthlyServiceItem[]> {
  const plans = await getOpenPlans()
  if (!plans.length) return []

  const planIds = plans.map((p) => p.id_plan)

  const { data, error } = await supabase
    .from('monthly_service_items')
    .select(`
      id_item,
      id_plan,
      id_cliente,
      id_servicio,
      list_order,
      scheduled_day,
      scheduled_date,
      actual_service_date,
      client_name_snapshot,
      address_snapshot,
      city_snapshot,
      service_name_snapshot,
      operational_status,
      observations,
      registered_by,
      registered_at,
      last_modified_by,
      last_modified_at,
      review_status,
      review_comment,
      billing_status
    `)
    .in('id_plan', planIds)
    .order('scheduled_date')
    .order('list_order')

  if (error) throw error
  return (data || []) as MonthlyServiceItem[]
}

export interface SaveVisitInput {
  idItem: number
  status: OperationalStatus
  actualServiceDate: string
  observations: string | null
}

export async function saveVisitResult(input: SaveVisitInput): Promise<MonthlyServiceItem> {
  if (input.status === 'pending') {
    throw new Error(
      'Pending cannot be saved with the current Supabase RPC. Choose a completed, not completed, rescheduled, or canceled result.'
    )
  }

  const { data, error } = await supabase.rpc('save_monthly_service_result', {
    p_id_item: input.idItem,
    p_operational_status: input.status,
    p_actual_service_date: input.actualServiceDate,
    p_observations: input.observations
  })

  if (error) throw error
  return data as MonthlyServiceItem
}

export async function getVisitHistory(
  idItem: number
): Promise<MonthlyServiceHistory[]> {
  const { data: history, error } = await supabase
    .from('monthly_service_item_history')
    .select(`
      id_history,
      id_item,
      action,
      old_data,
      new_data,
      changed_by,
      changed_at,
      source,
      comment
    `)
    .eq('id_item', idItem)
    .order('changed_at', { ascending: false })
    .order('id_history', { ascending: false })

  // Current RLS lets admins read all history and workers read history
  // for items registered by themselves. Treat a denied/empty history
  // as non-fatal because it must not block visit editing.
  if (error) {
    console.warn('History is not available for this visit:', error.message)
    return []
  }

  const rows = (history || []) as MonthlyServiceHistory[]
  const userIds = [...new Set(rows.map((r) => r.changed_by).filter(Boolean))] as string[]

  if (!userIds.length) return rows

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds)

  const names = new Map<string, string>()
  ;(profiles || []).forEach((p) => names.set(p.id, p.full_name || 'Unknown'))

  return rows.map((r) => ({
    ...r,
    user_name: r.changed_by ? names.get(r.changed_by) || 'Unknown' : 'Unknown'
  }))
}
