import { useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  PlusCircle,
  Save,
  Wrench,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import type {
  ExtraServiceDraft,
  ExtraServiceRecord,
  MonthlyServiceHistory,
  MonthlyServiceItem,
  OperationalStatus,
  ServiceCatalogOption
} from '../types/domain'
import { getVisitHistory, saveVisitResult } from '../services/planService'
import {
  createExtraService,
  getServiceCatalog,
  listExtrasForVisit
} from '../features/extras/extrasService'
import { normalizeStatus } from '../utils/status'
import { StatusSelector } from './StatusSelector'
import { HistoryTimeline } from './HistoryTimeline'

function todayIso() {
  return format(new Date(), 'yyyy-MM-dd')
}

function friendlyDatabaseError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '')

  const knownMessages = [
    'Authentication is required.',
    'The user is inactive.',
    'Invalid operational status.',
    'Actual service date is required.',
    'Actual service date cannot be in the future.',
    'Observations are required for this result.',
    'The scheduled service was not found.',
    'The monthly plan was not found.',
    'The monthly plan is not open.',
    'The service is approved and cannot be edited.',
    'The service is already in the billing process.',
    'This service was registered by another user.',
    'Only the original user can correct a rejected service.',
    'Client is required.',
    'The client was not found.',
    'The selected visit does not belong to the selected client.',
    'Invalid service source.',
    'Service is required.',
    'The selected service was not found.',
    'Service name is required.',
    'Quantity must be greater than zero.',
    'Unit Price cannot be negative.',
    'Total cannot be negative.',
    'Performed Date is required.',
    'Performed Date cannot be in the future.'
  ]

  return knownMessages.find((known) => message.includes(known)) ||
    'Could not complete the operation.'
}

export function VisitDetail({
  item,
  onClose,
  onSaved
}: {
  item: MonthlyServiceItem
  onClose: () => void
  onSaved: (item: MonthlyServiceItem) => void
}) {
  const [status, setStatus] = useState<OperationalStatus>(
    normalizeStatus(item.operational_status)
  )
  const [actualDate, setActualDate] = useState(item.actual_service_date || '')
  const [observations, setObservations] = useState(item.observations || '')
  const [history, setHistory] = useState<MonthlyServiceHistory[]>([])
  const [saving, setSaving] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)

  const [extras, setExtras] = useState<ExtraServiceRecord[]>([])
  const [extrasLoading, setExtrasLoading] = useState(true)
  const [catalog, setCatalog] = useState<ServiceCatalogOption[]>([])
  const [showExtraForm, setShowExtraForm] = useState(false)
  const [savingExtra, setSavingExtra] = useState(false)
  const [extraMode, setExtraMode] = useState<'catalog' | 'manual'>('catalog')
  const [extraServiceId, setExtraServiceId] = useState<number | ''>('')
  const [extraManualName, setExtraManualName] = useState('')
  const [extraDescription, setExtraDescription] = useState('')
  const [extraQuantity, setExtraQuantity] = useState('1')
  const [extraUnitPrice, setExtraUnitPrice] = useState('')
  const [extraPerformedDate, setExtraPerformedDate] = useState(todayIso())
  const [extraNotes, setExtraNotes] = useState('')

  useEffect(() => {
    getVisitHistory(item.id_item)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false))
  }, [item.id_item])

  useEffect(() => {
    Promise.all([
      listExtrasForVisit(item.id_item),
      getServiceCatalog()
    ])
      .then(([extraRows, serviceRows]) => {
        setExtras(extraRows)
        setCatalog(serviceRows)
      })
      .catch((error) => {
        console.warn('Could not load Extra Services:', error)
      })
      .finally(() => setExtrasLoading(false))
  }, [item.id_item])

  function changeStatus(next: OperationalStatus) {
    setStatus(next)
    if (!actualDate) setActualDate(todayIso())
  }

  const validationError = useMemo(() => {
    if (status === 'pending') {
      return 'Choose the service result before saving.'
    }

    if (!actualDate) {
      return 'Actual Service Date is required.'
    }

    if (actualDate > todayIso()) {
      return 'Actual Service Date cannot be in the future.'
    }

    if (
      (status === 'not_completed' ||
        status === 'rescheduled' ||
        status === 'canceled') &&
      !observations.trim()
    ) {
      return 'Observations are required for this result.'
    }

    return null
  }, [status, actualDate, observations])

  async function save() {
    if (validationError) {
      toast.error(validationError)
      return
    }

    setSaving(true)

    try {
      const saved = await saveVisitResult({
        idItem: item.id_item,
        status,
        actualServiceDate: actualDate,
        observations: observations.trim() || null
      })

      onSaved({
        ...item,
        ...saved,
        operational_status: status,
        actual_service_date: actualDate,
        observations: observations.trim() || null
      })

      toast.success('Service updated successfully.')
      onClose()
    } catch (error) {
      toast.error(friendlyDatabaseError(error))
    } finally {
      setSaving(false)
    }
  }

  function resetExtraForm() {
    setExtraMode('catalog')
    setExtraServiceId('')
    setExtraManualName('')
    setExtraDescription('')
    setExtraQuantity('1')
    setExtraUnitPrice('')
    setExtraPerformedDate(todayIso())
    setExtraNotes('')
  }

  async function saveExtra() {
    const quantity = Number(extraQuantity)

    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error('Quantity must be greater than zero.')
      return
    }

    let serviceName = ''
    let idServicio: number | null = null

    if (extraMode === 'catalog') {
      if (extraServiceId === '') {
        toast.error('Select a service.')
        return
      }

      const service = catalog.find(
        (row) => row.id_servicio === extraServiceId
      )

      if (!service) {
        toast.error('The selected service was not found.')
        return
      }

      idServicio = service.id_servicio
      serviceName = service.servicio
    } else {
      serviceName = extraManualName.trim()

      if (!serviceName) {
        toast.error('Service name is required.')
        return
      }
    }

    const unitPrice =
      extraUnitPrice.trim() === '' ? null : Number(extraUnitPrice)

    if (
      unitPrice !== null &&
      (!Number.isFinite(unitPrice) || unitPrice < 0)
    ) {
      toast.error('Unit Price is invalid.')
      return
    }

    if (!extraPerformedDate) {
      toast.error('Performed Date is required.')
      return
    }

    if (extraPerformedDate > todayIso()) {
      toast.error('Performed Date cannot be in the future.')
      return
    }

    const draft: ExtraServiceDraft = {
      id_item: item.id_item,
      id_cliente: item.id_cliente,
      id_servicio: idServicio,
      service_name: serviceName,
      service_source: extraMode,
      description: extraDescription.trim() || null,
      quantity,
      unit_price: unitPrice,
      total:
        unitPrice === null
          ? null
          : Number((quantity * unitPrice).toFixed(2)),
      performed_date: extraPerformedDate,
      notes: extraNotes.trim() || null
    }

    setSavingExtra(true)

    try {
      const saved = await createExtraService(draft)

      setExtras((current) => [
        {
          ...saved,
          client_name: item.client_name_snapshot,
          client_address: item.address_snapshot,
          client_city: item.city_snapshot
        },
        ...current
      ])

      toast.success('Extra Service saved successfully.')
      resetExtraForm()
      setShowExtraForm(false)
    } catch (error) {
      toast.error(friendlyDatabaseError(error))
    } finally {
      setSavingExtra(false)
    }
  }

  const address = [item.address_snapshot, item.city_snapshot]
    .filter(Boolean)
    .join(', ')

  const mapsUrl = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/35 backdrop-blur-sm">
      <div className="min-h-full md:grid md:place-items-center md:p-6">
        <section className="min-h-screen bg-slate-50 md:min-h-0 md:w-full md:max-w-2xl md:rounded-3xl md:shadow-2xl">
          <header className="safe-top sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 pb-3 backdrop-blur md:rounded-t-3xl">
            <button
              onClick={onClose}
              className="grid min-h-11 min-w-11 place-items-center rounded-full text-slate-600 hover:bg-slate-100"
              aria-label="Close"
            >
              <ArrowLeft size={22} />
            </button>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Service Visit
              </p>
              <h2 className="truncate font-bold text-slate-900">
                {item.client_name_snapshot}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="hidden min-h-11 min-w-11 place-items-center rounded-full md:grid"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </header>

          <div className="space-y-5 p-4 pb-28">
            <div className="rounded-3xl bg-white p-4 shadow-soft">
              <h3 className="text-xl font-bold">{item.client_name_snapshot}</h3>

              <p className="mt-2 flex gap-2 text-sm text-slate-500">
                <MapPin size={16} className="mt-0.5 shrink-0" />
                {address || 'No address'}
              </p>

              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-800"
                >
                  <MapPin size={17} />
                  Open in Google Maps
                  <ExternalLink size={15} />
                </a>
              )}

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-slate-400">Service</dt>
                  <dd className="mt-1 font-semibold">
                    {item.service_name_snapshot}
                  </dd>
                </div>

                <div>
                  <dt className="text-slate-400">Scheduled Date</dt>
                  <dd className="mt-1 font-semibold">
                    {format(parseISO(item.scheduled_date), 'MMM d, yyyy')}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-3xl bg-white p-4 shadow-soft">
              <h3 className="font-bold">Service Result</h3>

              <div className="mt-3">
                <StatusSelector value={status} onChange={changeStatus} />
              </div>

              <label className="mt-5 block text-sm font-semibold text-slate-700">
                Actual Service Date *
              </label>
              <input
                type="date"
                max={todayIso()}
                value={actualDate}
                onChange={(e) => setActualDate(e.target.value)}
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />

              <label className="mt-5 block text-sm font-semibold text-slate-700">
                Observations
                {(status === 'not_completed' ||
                  status === 'rescheduled' ||
                  status === 'canceled') && ' *'}
              </label>

              <textarea
                rows={5}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Add service notes..."
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white p-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />

              {item.review_status === 'rejected' && item.review_comment && (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                  <p className="font-bold">Rejected review</p>
                  <p className="mt-1">{item.review_comment}</p>
                </div>
              )}

              {validationError && (
                <p className="mt-3 text-sm font-medium text-rose-700">
                  {validationError}
                </p>
              )}

              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-4 font-bold text-white shadow-sm disabled:opacity-60"
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            <div className="rounded-3xl bg-white p-4 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold">Extra Services</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Additional work for this visit.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowExtraForm((value) => !value)}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-emerald-800 px-3 text-xs font-bold text-white"
                >
                  <PlusCircle size={16} />
                  Add Extra
                </button>
              </div>

              {showExtraForm && (
                <div className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setExtraMode('catalog')}
                      className={`min-h-11 rounded-xl border px-3 text-sm font-bold ${
                        extraMode === 'catalog'
                          ? 'border-emerald-700 bg-emerald-700 text-white'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      Catalog
                    </button>

                    <button
                      type="button"
                      onClick={() => setExtraMode('manual')}
                      className={`min-h-11 rounded-xl border px-3 text-sm font-bold ${
                        extraMode === 'manual'
                          ? 'border-emerald-700 bg-emerald-700 text-white'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      Manual
                    </button>
                  </div>

                  {extraMode === 'catalog' ? (
                    <label className="block">
                      <span className="text-xs font-semibold text-slate-600">
                        Service *
                      </span>
                      <select
                        value={extraServiceId}
                        onChange={(event) =>
                          setExtraServiceId(
                            event.target.value
                              ? Number(event.target.value)
                              : ''
                          )
                        }
                        className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
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
                      <span className="text-xs font-semibold text-slate-600">
                        Service Name *
                      </span>
                      <input
                        value={extraManualName}
                        onChange={(event) =>
                          setExtraManualName(event.target.value)
                        }
                        placeholder="Type the service..."
                        className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                      />
                    </label>
                  )}

                  <label className="block">
                    <span className="text-xs font-semibold text-slate-600">
                      Description
                    </span>
                    <textarea
                      rows={2}
                      value={extraDescription}
                      onChange={(event) =>
                        setExtraDescription(event.target.value)
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <label>
                      <span className="text-xs font-semibold text-slate-600">
                        Quantity *
                      </span>
                      <input
                        inputMode="decimal"
                        value={extraQuantity}
                        onChange={(event) =>
                          setExtraQuantity(event.target.value)
                        }
                        className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                      />
                    </label>

                    <label>
                      <span className="text-xs font-semibold text-slate-600">
                        Unit Price
                      </span>
                      <input
                        inputMode="decimal"
                        value={extraUnitPrice}
                        onChange={(event) =>
                          setExtraUnitPrice(event.target.value)
                        }
                        className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-xs font-semibold text-slate-600">
                      Performed Date *
                    </span>
                    <input
                      type="date"
                      max={todayIso()}
                      value={extraPerformedDate}
                      onChange={(event) =>
                        setExtraPerformedDate(event.target.value)
                      }
                      className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold text-slate-600">
                      Notes
                    </span>
                    <textarea
                      rows={3}
                      value={extraNotes}
                      onChange={(event) => setExtraNotes(event.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        resetExtraForm()
                        setShowExtraForm(false)
                      }}
                      className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={saveExtra}
                      disabled={savingExtra}
                      className="min-h-11 rounded-xl bg-emerald-800 px-3 text-sm font-bold text-white disabled:opacity-60"
                    >
                      {savingExtra ? 'Saving...' : 'Save Extra'}
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 space-y-2">
                {extrasLoading && (
                  <p className="text-sm text-slate-500">
                    Loading Extra Services...
                  </p>
                )}

                {!extrasLoading && extras.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No Extra Services for this visit.
                  </p>
                )}

                {extras.map((extra) => (
                  <div
                    key={extra.id_extra}
                    className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3"
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800">
                      <Wrench size={17} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {extra.service_name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Qty {extra.quantity} · {extra.performed_date}
                        {extra.total !== null
                          ? ` · $${extra.total.toFixed(2)}`
                          : ''}
                      </p>
                      {extra.notes && (
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {extra.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-4 shadow-soft">
              <h3 className="font-bold">History</h3>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                History visibility follows the current Supabase RLS policy.
              </p>

              <div className="mt-4">
                {historyLoading ? (
                  <p className="text-sm text-slate-500">
                    Loading history...
                  </p>
                ) : (
                  <HistoryTimeline rows={history} />
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
