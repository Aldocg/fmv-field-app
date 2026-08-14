import { getOpenPlanItems } from './planService'
import type { PlanClient } from '../types/domain'
import { normalizeStatus } from '../utils/status'

export async function getPlanClients(): Promise<PlanClient[]> {
  const items = await getOpenPlanItems()
  const clients = new Map<number, PlanClient>()
  const today = new Date().toISOString().slice(0, 10)

  for (const item of items) {
    const existing = clients.get(item.id_cliente)

    if (!existing) {
      clients.set(item.id_cliente, {
        id_cliente: item.id_cliente,
        name: item.client_name_snapshot,
        address: item.address_snapshot || '',
        city: item.city_snapshot || '',
        scheduledDays: [item.scheduled_day],
        services: [item.service_name_snapshot],
        nextVisit: item.scheduled_date >= today ? item.scheduled_date : null,
        nextStatus: item.scheduled_date >= today ? normalizeStatus(item.operational_status) : null
      })
      continue
    }

    if (!existing.scheduledDays.includes(item.scheduled_day)) {
      existing.scheduledDays.push(item.scheduled_day)
    }

    if (!existing.services.includes(item.service_name_snapshot)) {
      existing.services.push(item.service_name_snapshot)
    }

    if (item.scheduled_date >= today && (!existing.nextVisit || item.scheduled_date < existing.nextVisit)) {
      existing.nextVisit = item.scheduled_date
      existing.nextStatus = normalizeStatus(item.operational_status)
    }
  }

  return [...clients.values()].sort((a, b) => a.name.localeCompare(b.name))
}
