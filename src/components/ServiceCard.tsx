import { AlertTriangle, ChevronRight, MapPin, MessageSquareText } from 'lucide-react'
import { differenceInCalendarDays, format, parseISO, startOfDay } from 'date-fns'
import type { MonthlyServiceItem } from '../types/domain'
import { normalizeStatus } from '../utils/status'
import { StatusBadge } from './StatusBadge'

interface ServiceCardProps {
  item: MonthlyServiceItem
  onOpen: (item: MonthlyServiceItem) => void
  compact?: boolean
  showDate?: boolean
  emphasizeOverdue?: boolean
}

export function ServiceCard({
  item,
  onOpen,
  compact = false,
  showDate = true,
  emphasizeOverdue = true
}: ServiceCardProps) {
  const address = [item.address_snapshot, item.city_snapshot].filter(Boolean).join(', ')
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  const status = normalizeStatus(item.operational_status)
  const scheduled = parseISO(item.scheduled_date)
  const overdueDays = differenceInCalendarDays(startOfDay(new Date()), startOfDay(scheduled))
  const isOverdue = emphasizeOverdue && status === 'pending' && overdueDays > 0

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white shadow-soft transition ${
        isOverdue ? 'border-rose-200 ring-1 ring-rose-100' : 'border-slate-100'
      }`}
    >
      <button
        type="button"
        onClick={() => onOpen(item)}
        className={`w-full text-left ${compact ? 'p-3.5' : 'p-4'}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={`${compact ? 'text-base' : 'text-lg'} font-bold text-slate-900`}>
                {item.client_name_snapshot}
              </h3>
              {isOverdue && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700">
                  <AlertTriangle size={12} />
                  {overdueDays} {overdueDays === 1 ? 'day' : 'days'} overdue
                </span>
              )}
            </div>

            <p className="mt-1 flex items-start gap-1.5 text-sm leading-5 text-slate-500">
              <MapPin size={15} className="mt-0.5 shrink-0" />
              <span className="line-clamp-1">{address || 'No address'}</span>
            </p>
          </div>
          <ChevronRight className="mt-1 shrink-0 text-slate-300" size={19} />
        </div>

        <div className={`${compact ? 'mt-2.5' : 'mt-3'} flex flex-wrap items-center gap-2 text-sm`}>
          <span className="font-semibold text-slate-700">{item.service_name_snapshot}</span>
          {showDate && (
            <>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">
                {item.scheduled_day.slice(0, 3)} · {format(scheduled, 'MMM d')}
              </span>
            </>
          )}
          {item.observations && (
            <MessageSquareText size={15} className="text-emerald-700" aria-label="Has observations" />
          )}
        </div>

        <div className={`${compact ? 'mt-2.5' : 'mt-3'}`}>
          <StatusBadge status={status} />
        </div>
      </button>

      <div className="flex items-center justify-between border-t border-slate-100 px-3 py-1.5">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
          onClick={(event) => event.stopPropagation()}
        >
          <MapPin size={15} />
          Maps
        </a>
        <span className="text-xs font-semibold text-slate-400">View service</span>
      </div>
    </article>
  )
}
