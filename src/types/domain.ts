export type OperationalStatus =
  | 'pending'
  | 'completed'
  | 'not_completed'
  | 'rescheduled'
  | 'canceled'

export type PlanStatus = 'draft' | 'open' | 'closed' | 'canceled'

export interface Profile {
  id: string
  full_name: string
  role: string
  active: boolean
  created_at?: string
  updated_at?: string
}

export interface MonthlyServicePlan {
  id_plan: number
  plan_year: number
  plan_month: number
  id_servicio: number
  service_name_snapshot: string
  plan_status: PlanStatus
  notes?: string | null
  created_by?: string | null
  created_at?: string
  published_at?: string | null
  closed_at?: string | null
  updated_at?: string
}

export interface MonthlyServiceItem {
  id_item: number
  id_plan: number
  id_cliente: number
  id_servicio: number
  list_order: number
  scheduled_day: 'Wednesday' | 'Thursday' | 'Friday'
  scheduled_date: string
  actual_service_date: string | null
  client_name_snapshot: string
  address_snapshot: string | null
  city_snapshot: string | null
  service_name_snapshot: string
  operational_status: OperationalStatus
  observations: string | null
  registered_by?: string | null
  registered_at?: string | null
  last_modified_by?: string | null
  last_modified_at?: string | null
  review_status?: string
  reviewed_by?: string | null
  reviewed_at?: string | null
  review_comment?: string | null
  billing_status?: string
  id_factura?: number | null
  id_detalle_factura?: number | null
  invoiced_at?: string | null
  exclusion_reason?: string | null
  created_at?: string
  updated_at?: string
}

export interface MonthlyServiceHistory {
  id_history: number
  id_item: number
  action: string
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  changed_by: string | null
  changed_at: string
  source: string
  comment: string | null
  user_name?: string | null
}

export interface PlanClient {
  id_cliente: number
  name: string
  address: string
  city: string
  scheduledDays: string[]
}

export interface ServiceCatalogOption {
  id_servicio: number
  servicio: string
}

export interface ExtraServiceRecord {
  id_extra: number
  id_item: number | null
  id_cliente: number
  id_servicio: number | null
  service_name: string
  service_source: 'catalog' | 'manual'
  description: string | null
  quantity: number
  unit_price: number | null
  total: number | null
  performed_date: string
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
  created_by_name?: string | null
  client_name?: string | null
}

export interface ExtraServiceDraft {
  id_item?: number | null
  id_cliente: number
  id_servicio?: number | null
  service_name: string
  service_source: 'catalog' | 'manual'
  description?: string | null
  quantity: number
  unit_price?: number | null
  total?: number | null
  performed_date: string
  notes?: string | null
}
