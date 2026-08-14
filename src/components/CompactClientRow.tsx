import { ChevronRight, MapPin } from 'lucide-react'
import type { PlanClient } from '../types/domain'

export function CompactClientRow({
  client,
  onOpen
}: {
  client: PlanClient
  onOpen: (client: PlanClient) => void
}) {
  const dayLabel = client.scheduledDays?.length
    ? client.scheduledDays.join(', ')
    : 'No day'

  return (
    <button
      type="button"
      onClick={() => onOpen(client)}
      className="flex min-h-[68px] w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition active:scale-[0.99]"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-sm font-bold text-slate-900">
            {client.name}
          </h3>

          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
            {dayLabel}
          </span>
        </div>

        <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
          <MapPin size={13} className="shrink-0" />
          <span className="truncate">
            {[client.address, client.city].filter(Boolean).join(', ') || 'No address'}
          </span>
        </p>
      </div>

      <ChevronRight size={18} className="shrink-0 text-slate-300" />
    </button>
  )
}
