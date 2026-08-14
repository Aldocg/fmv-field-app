import { ChevronRight, Wrench } from 'lucide-react'
import type { ExtraServiceRecord } from '../types/domain'

export function CompactExtraRow({
  extra,
  onOpen
}: {
  extra: ExtraServiceRecord
  onOpen: (extra: ExtraServiceRecord) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(extra)}
      className="flex min-h-[68px] w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition active:scale-[0.99]"
    >
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800">
        <Wrench size={17} />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-bold text-slate-900">
          {extra.client_name || 'Client'} · {extra.service_name}
        </h3>

        <p className="mt-1 truncate text-xs text-slate-500">
          {extra.performed_date}
          {extra.total !== null ? ` · $${extra.total.toFixed(2)}` : ''}
        </p>
      </div>

      <ChevronRight size={18} className="shrink-0 text-slate-300" />
    </button>
  )
}
