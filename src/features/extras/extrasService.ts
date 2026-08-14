import { supabase } from '../../lib/supabase'
import type {
  ExtraServiceDraft,
  ExtraServiceRecord,
  ServiceCatalogOption
} from '../../types/domain'

export async function getServiceCatalog(): Promise<ServiceCatalogOption[]> {
  const { data, error } = await supabase
    .from('servicios')
    .select('id_servicio, servicio')
    .order('servicio')

  if (error) throw error
  return (data || []) as ServiceCatalogOption[]
}

export async function listExtras(): Promise<ExtraServiceRecord[]> {
  const { data, error } = await supabase
    .from('monthly_service_item_extras')
    .select(`
      id_extra,
      id_item,
      id_cliente,
      id_servicio,
      service_name,
      service_source,
      description,
      quantity,
      unit_price,
      total,
      performed_date,
      notes,
      created_by,
      created_at,
      updated_at
    `)
    .order('performed_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error

  const extras = (data || []) as ExtraServiceRecord[]
  const userIds = [...new Set(extras.map((x) => x.created_by).filter(Boolean))]

  const names = new Map<string, string>()
  const clientNames = new Map<number, string>()
  const clientAddresses = new Map<number, string>()
  const clientCities = new Map<number, string>()

  if (userIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds)

    ;(profiles || []).forEach((p) => {
      names.set(p.id, p.full_name || 'Unknown')
    })
  }

  const clientIds = [...new Set(extras.map((x) => x.id_cliente).filter(Boolean))]

  if (clientIds.length) {
    const { data: clients, error: clientsError } = await supabase
      .from('clientes')
      .select('id_cliente, nombre, calle, ciudad')
      .in('id_cliente', clientIds)

    if (!clientsError) {
      ;(clients || []).forEach((client) => {
        clientNames.set(client.id_cliente, client.nombre || `Client #${client.id_cliente}`)
        clientAddresses.set(client.id_cliente, client.calle || '')
        clientCities.set(client.id_cliente, client.ciudad || '')
      })
    }
  }

  return extras.map((x) => ({
    ...x,
    created_by_name: names.get(x.created_by) || 'Unknown',
    client_name: clientNames.get(x.id_cliente) || `Client #${x.id_cliente}`,
    client_address: clientAddresses.get(x.id_cliente) || null,
    client_city: clientCities.get(x.id_cliente) || null
  }))
}

export async function createExtraService(
  extra: ExtraServiceDraft
): Promise<ExtraServiceRecord> {
  const { data, error } = await supabase.rpc('save_extra_service', {
    p_id_item: extra.id_item ?? null,
    p_id_cliente: extra.id_cliente,
    p_id_servicio: extra.id_servicio ?? null,
    p_service_name: extra.service_name,
    p_service_source: extra.service_source,
    p_description: extra.description ?? null,
    p_quantity: extra.quantity,
    p_unit_price: extra.unit_price ?? null,
    p_total: extra.total ?? null,
    p_performed_date: extra.performed_date,
    p_notes: extra.notes ?? null
  })

  if (error) throw error
  return data as ExtraServiceRecord
}


export async function listExtrasForVisit(
  idItem: number
): Promise<ExtraServiceRecord[]> {
  const all = await listExtras()
  return all.filter((extra) => extra.id_item === idItem)
}
