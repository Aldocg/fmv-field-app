import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { SearchBar } from '../components/SearchBar'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { CompactExtraRow } from '../components/CompactExtraRow'
import { LocationAccordion } from '../components/LocationAccordion'
import { ExtraDetail } from '../components/ExtraDetail'
import { useOpenPlanItems } from '../hooks/useOpenPlanItems'
import {
  createExtraService,
  getServiceCatalog,
  listExtras
} from '../features/extras/extrasService'
import type {
  ExtraServiceDraft,
  ExtraServiceRecord,
  ServiceCatalogOption
} from '../types/domain'
import { groupByCityAndStreet } from '../utils/locationGrouping'

export function ExtrasPage() {
  const { items } = useOpenPlanItems()

  const [extras, setExtras] = useState<ExtraServiceRecord[]>([])
  const [catalog, setCatalog] = useState<ServiceCatalogOption[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<ExtraServiceRecord | null>(null)
  const [saving, setSaving] = useState(false)

  const [idCliente, setIdCliente] = useState<number | ''>('')
  const [idItem, setIdItem] = useState<number | ''>('')
  const [serviceMode, setServiceMode] = useState<'catalog' | 'manual'>('catalog')
  const [idServicio, setIdServicio] = useState<number | ''>('')
  const [manualServiceName, setManualServiceName] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unitPrice, setUnitPrice] = useState('')
  const [performedDate, setPerformedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes] = useState('')

  async function load() {
    try {
      setLoading(true)
      setError(null)

      const [extraRows, serviceRows] = await Promise.all([
        listExtras(),
        getServiceCatalog()
      ])

      setExtras(extraRows)
      setCatalog(serviceRows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load Extra Services.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const clientOptions = useMemo(() => {
    const map = new Map<number, { id: number; name: string }>()
    for (const item of items) {
      if (!map.has(item.id_cliente)) {
        map.set(item.id_cliente, {
          id: item.id_cliente,
          name: item.client_name_snapshot
        })
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [items])

  const visitOptions = useMemo(() => {
    if (idCliente === '') return []

    return items
      .filter((item) => item.id_cliente === idCliente)
      .map((item) => ({
        id: item.id_item,
        label: `${item.scheduled_day} · ${item.scheduled_date} · ${item.service_name_snapshot}`
      }))
  }, [items, idCliente])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return extras

    return extras.filter((extra) =>
      [
        extra.client_name,
        extra.service_name,
        extra.description,
        extra.notes,
        extra.created_by_name
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    )
  }, [extras, query])

  const groups = useMemo(
    () =>
      groupByCityAndStreet(filtered, (extra) => ({
        city: extra.client_city,
        address: extra.client_address
      })),
    [filtered]
  )

  function resetForm() {
    setIdCliente('')
    setIdItem('')
    setServiceMode('catalog')
    setIdServicio('')
    setManualServiceName('')
    setDescription('')
    setQuantity('1')
    setUnitPrice('')
    setPerformedDate(format(new Date(), 'yyyy-MM-dd'))
    setNotes('')
  }

  async function save() {
    if (idCliente === '') {
      toast.error('Client is required.')
      return
    }

    const qty = Number(quantity || '0')
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error('Quantity must be greater than zero.')
      return
    }

    let serviceName = ''
    let selectedServiceId: number | null = null

    if (serviceMode === 'catalog') {
      if (idServicio === '') {
        toast.error('Select a service.')
        return
      }

      selectedServiceId = idServicio
      serviceName =
        catalog.find((x) => x.id_servicio === idServicio)?.servicio || ''

      if (!serviceName) {
        toast.error('Selected service could not be found.')
        return
      }
    } else {
      serviceName = manualServiceName.trim()
      if (!serviceName) {
        toast.error('Service name is required.')
        return
      }
    }

    const price = unitPrice.trim() === '' ? null : Number(unitPrice)
    if (price !== null && (!Number.isFinite(price) || price < 0)) {
      toast.error('Unit Price is invalid.')
      return
    }

    const total = price === null ? null : Number((qty * price).toFixed(2))

    const draft: ExtraServiceDraft = {
      id_item: idItem === '' ? null : idItem,
      id_cliente: idCliente,
      id_servicio: selectedServiceId,
      service_name: serviceName,
      service_source: serviceMode,
      description: description.trim() || null,
      quantity: qty,
      unit_price: price,
      total,
      performed_date: performedDate,
      notes: notes.trim() || null
    }

    setSaving(true)

    try {
      await createExtraService(draft)
      toast.success('Extra Service saved successfully.')
      resetForm()
      setShowForm(false)
      await load()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not save Extra Service.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Informational Module
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight">Extra Services</h1>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-800 px-3 text-sm font-bold text-white shadow-sm"
        >
          <PlusCircle size={18} />
          Add
        </button>
      </header>

      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search extra service..."
      />

      {loading && <LoadingSkeleton count={4} />}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          title="No Extra Services"
          description="No additional services have been recorded yet."
        />
      )}

      {!loading && !error && groups.length > 0 && (
        <>
          <p className="text-xs text-slate-400">
            Browse extra services by client city and street.
          </p>

          <LocationAccordion
            groups={groups}
            searchActive={query.trim().length > 0}
            itemKey={(extra) => extra.id_extra}
            renderItem={(extra) => (
              <CompactExtraRow extra={extra} onOpen={setSelected} />
            )}
          />
        </>
      )}

      {selected && (
        <ExtraDetail extra={selected} onClose={() => setSelected(null)} />
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-sm">
          <div className="min-h-full md:grid md:place-items-center md:p-6">
            <section className="min-h-screen bg-slate-50 md:min-h-0 md:w-full md:max-w-xl md:rounded-3xl md:shadow-2xl">
              <header className="safe-top sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 pb-3 backdrop-blur md:rounded-t-3xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      New Entry
                    </p>
                    <h2 className="text-xl font-black">Extra Service</h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      resetForm()
                      setShowForm(false)
                    }}
                    className="min-h-11 rounded-xl px-3 text-sm font-bold text-slate-600"
                  >
                    Close
                  </button>
                </div>
              </header>

              <div className="space-y-5 p-4 pb-10">
                <label className="block">
                  <span className="text-sm font-semibold">Client *</span>
                  <select
                    value={idCliente}
                    onChange={(e) => {
                      const value = e.target.value
                      setIdCliente(value ? Number(value) : '')
                      setIdItem('')
                    }}
                    className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-3"
                  >
                    <option value="">Select client...</option>
                    {clientOptions.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-semibold">
                    Related Visit (optional)
                  </span>
                  <select
                    value={idItem}
                    onChange={(e) =>
                      setIdItem(e.target.value ? Number(e.target.value) : '')
                    }
                    className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-3"
                  >
                    <option value="">No related visit</option>
                    {visitOptions.map((visit) => (
                      <option key={visit.id} value={visit.id}>
                        {visit.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div>
                  <span className="text-sm font-semibold">Service Source *</span>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setServiceMode('catalog')}
                      className={`min-h-12 rounded-2xl border px-3 text-sm font-bold ${
                        serviceMode === 'catalog'
                          ? 'border-emerald-700 bg-emerald-700 text-white'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      Catalog
                    </button>

                    <button
                      type="button"
                      onClick={() => setServiceMode('manual')}
                      className={`min-h-12 rounded-2xl border px-3 text-sm font-bold ${
                        serviceMode === 'manual'
                          ? 'border-emerald-700 bg-emerald-700 text-white'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      Manual
                    </button>
                  </div>
                </div>

                {serviceMode === 'catalog' ? (
                  <label className="block">
                    <span className="text-sm font-semibold">Service *</span>
                    <select
                      value={idServicio}
                      onChange={(e) =>
                        setIdServicio(e.target.value ? Number(e.target.value) : '')
                      }
                      className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-3"
                    >
                      <option value="">Select service...</option>
                      {catalog.map((service) => (
                        <option
                          key={service.id_servicio}
                          value={service.id_servicio}
                        >
                          {service.servicio}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <label className="block">
                    <span className="text-sm font-semibold">Service Name *</span>
                    <input
                      value={manualServiceName}
                      onChange={(e) => setManualServiceName(e.target.value)}
                      placeholder="Type the extra service..."
                      className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-3"
                    />
                  </label>
                )}

                <label className="block">
                  <span className="text-sm font-semibold">Description</span>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-sm font-semibold">Quantity *</span>
                    <input
                      inputMode="decimal"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-3"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold">Unit Price</span>
                    <input
                      inputMode="decimal"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-3"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-semibold">Performed Date *</span>
                  <input
                    type="date"
                    value={performedDate}
                    max={format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => setPerformedDate(e.target.value)}
                    className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-3"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold">Notes</span>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3"
                  />
                </label>

                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="min-h-12 w-full rounded-2xl bg-emerald-800 px-4 font-bold text-white disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Extra Service'}
                </button>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}
