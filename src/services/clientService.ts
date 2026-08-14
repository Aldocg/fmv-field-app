import { getOpenPlanItems } from './planService'
import type { PlanClient } from '../types/domain'

/**
 * Current Supabase RLS has no SELECT policy on public.clientes.
 * To keep the mobile app functional without weakening RLS, the client
 * directory is built from snapshot data in OPEN monthly plan items.
 *
 * If later you add an authenticated SELECT policy to public.clientes,
 * this service can be changed to read the complete active-client directory.
 */
export async function getPlanClients(): Promise<PlanClient[]> {
  const items = await getOpenPlanItems()
  const clients = new Map<number, PlanClient>()

  for (const item of items) {
    const existing = clients.get(item.id_cliente)

    if (!existing) {
      clients.set(item.id_cliente, {
        id_cliente: item.id_cliente,
        name: item.client_name_snapshot,
        address: item.address_snapshot || '',
        city: item.city_snapshot || '',
        scheduledDays: [item.scheduled_day]
      })
      continue
    }

    if (!existing.scheduledDays.includes(item.scheduled_day)) {
      existing.scheduledDays.push(item.scheduled_day)
    }
  }

  return [...clients.values()].sort((a, b) => a.name.localeCompare(b.name))
}
