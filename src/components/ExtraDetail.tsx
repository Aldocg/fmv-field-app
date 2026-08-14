import { ArrowLeft, CalendarDays, CircleDollarSign, FileText, X } from 'lucide-react'
import type { ExtraServiceRecord } from '../types/domain'

export function ExtraDetail({
  extra,
  onClose
}: {
  extra: ExtraServiceRecord
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/35 backdrop-blur-sm">
      <div className="min-h-full md:grid md:place-items-center md:p-6">
        <section className="min-h-screen bg-slate-50 md:min-h-0 md:w-full md:max-w-xl md:rounded-3xl md:shadow-2xl">
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
                Extra Service
              </p>
              <h2 className="truncate font-bold text-slate-900">
                {extra.service_name}
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

          <div className="space-y-4 p-4 pb-24">
            <section className="rounded-3xl bg-white p-4 shadow-soft">
              <h3 className="text-xl font-black">{extra.service_name}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {extra.service_source === 'catalog' ? 'Service Catalog' : 'Manual Service'}
              </p>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <dt className="text-xs text-slate-400">Quantity</dt>
                  <dd className="mt-1 font-bold">{extra.quantity}</dd>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3">
                  <dt className="text-xs text-slate-400">Performed Date</dt>
                  <dd className="mt-1 font-bold">{extra.performed_date}</dd>
                </div>
              </dl>

              {extra.total !== null && (
                <p className="mt-4 flex items-center gap-2 text-sm font-bold text-emerald-800">
                  <CircleDollarSign size={17} />
                  ${extra.total.toFixed(2)}
                </p>
              )}
            </section>

            {(extra.description || extra.notes) && (
              <section className="rounded-3xl bg-white p-4 shadow-soft">
                <h3 className="flex items-center gap-2 font-bold">
                  <FileText size={17} />
                  Details
                </h3>

                {extra.description && (
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {extra.description}
                  </p>
                )}

                {extra.notes && (
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    <span className="font-semibold">Notes:</span> {extra.notes}
                  </p>
                )}
              </section>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
