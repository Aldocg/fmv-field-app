import { ArrowLeft, CalendarDays, MapPin, X } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { MonthlyServiceItem, PlanClient } from '../types/domain'
import { StatusBadge } from './StatusBadge'
import { normalizeStatus } from '../utils/status'

export function ClientDetail({
  client,
  items,
  onClose
}: {
  client: PlanClient
  items: MonthlyServiceItem[]
  onClose: () => void
}) {
  const clientItems = items
    .filter((item) => item.id_cliente === client.id_cliente)
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))

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
                Client
              </p>
              <h2 className="truncate font-bold text-slate-900">{client.name}</h2>
            </div>

            <button
              onClick={onClose}
              className="hidden min-h-11 min-w-11 place-items-center rounded-full md:grid"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </header>

          <div className="space-y-4 p-4 pb-24">
            <section className="rounded-3xl bg-white p-4 shadow-soft">
              <h3 className="text-xl font-black">{client.name}</h3>
              <p className="mt-2 flex gap-2 text-sm text-slate-500">
                <MapPin size={16} className="mt-0.5 shrink-0" />
                {[client.address, client.city].filter(Boolean).join(', ') || 'No address'}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {(client.scheduledDays || []).map((day) => (
                  <span
                    key={day}
                    className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800"
                  >
                    {day}
                  </span>
                ))}
              </div>
            </section>

            <section className="rounded-3xl bg-white p-4 shadow-soft">
              <h3 className="font-bold">Services</h3>

              <div className="mt-3 space-y-2">
                {clientItems.length === 0 && (
                  <p className="text-sm text-slate-500">No services in open plans.</p>
                )}

                {clientItems.map((item) => (
                  <div
                    key={item.id_item}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold">{item.service_name_snapshot}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <CalendarDays size={13} />
                          {format(parseISO(item.scheduled_date), 'MMM d, yyyy')}
                        </p>
                      </div>

                      <StatusBadge
                        status={normalizeStatus(item.operational_status)}
                        compact
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </div>
  )
}
