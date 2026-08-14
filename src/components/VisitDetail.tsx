import { useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, MapPin, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import type {
  MonthlyServiceHistory,
  MonthlyServiceItem,
  OperationalStatus
} from '../types/domain'
import { getVisitHistory, saveVisitResult } from '../services/planService'
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
    'Only the original user can correct a rejected service.'
  ]

  return knownMessages.find((known) => message.includes(known)) ||
    'Could not update the service visit.'
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

  useEffect(() => {
    getVisitHistory(item.id_item)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false))
  }, [item.id_item])

  function changeStatus(next: OperationalStatus) {
    setStatus(next)

    // Exact current RPC rule:
    // every saved service result requires Actual Service Date.
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

  const address = [item.address_snapshot, item.city_snapshot].filter(Boolean).join(', ')

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

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-slate-400">Service</dt>
                  <dd className="mt-1 font-semibold">{item.service_name_snapshot}</dd>
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
              <h3 className="font-bold">Extra Services</h3>
              <p className="mt-1 text-sm text-slate-500">
                The interface is prepared, but the database entity has not been created yet.
              </p>
              <button
                type="button"
                onClick={() =>
                  toast.info('Extra Services database is not connected yet.')
                }
                className="mt-3 min-h-11 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-800"
              >
                + Add Extra Service
              </button>
            </div>

            <div className="rounded-3xl bg-white p-4 shadow-soft">
              <h3 className="font-bold">History</h3>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                History visibility follows the current Supabase RLS policy.
              </p>

              <div className="mt-4">
                {historyLoading ? (
                  <p className="text-sm text-slate-500">Loading history...</p>
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
