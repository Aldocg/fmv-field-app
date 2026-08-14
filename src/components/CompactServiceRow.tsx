import { ChevronRight, MapPin } from 'lucide-react'
import type { MonthlyServiceItem } from '../types/domain'
import { normalizeStatus } from '../utils/status'
import { StatusBadge } from './StatusBadge'

export function CompactServiceRow({
  item,
  onOpen
}: {
  item: MonthlyServiceItem
  onOpen: (item: MonthlyServiceItem) => void
}) {
  const address = [item.address_snapshot, item.city_snapshot]
    .filter(Boolean)
    .join(', ')

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="flex min-h-[68px] w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition active:scale-[0.99]"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-bold text-slate-900">
            {item.client_name_snapshot}
          </h3>
          <StatusBadge status={normalizeStatus(item.operational_status)} compact />
        </div>

        <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
          <MapPin size={13} className="shrink-0" />
          <span className="truncate">{address || 'No address'}</span>
        </p>
      </div>

      <ChevronRight size={18} className="shrink-0 text-slate-300" />
    </button>
  )
}
