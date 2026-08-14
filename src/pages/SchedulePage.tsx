import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { DayTabs, type ServiceDay } from '../components/DayTabs'
import { SearchBar } from '../components/SearchBar'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { VisitDetail } from '../components/VisitDetail'
import { CompactServiceRow } from '../components/CompactServiceRow'
import { LocationAccordion } from '../components/LocationAccordion'
import { useOpenPlanItems } from '../hooks/useOpenPlanItems'
import type { MonthlyServiceItem } from '../types/domain'
import { normalizeStatus } from '../utils/status'
import { groupByCityAndStreet } from '../utils/locationGrouping'

type ScheduleFilter = 'all' | 'overdue' | 'upcoming' | 'completed'

export function SchedulePage() {
  const { items, setItems, loading, error, refresh } = useOpenPlanItems()
  const [day, setDay] = useState<ServiceDay>('Wednesday')
  const [date, setDate] = useState<string>('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<ScheduleFilter>('all')
  const [selected, setSelected] = useState<MonthlyServiceItem | null>(null)

  const today = format(new Date(), 'yyyy-MM-dd')

  const dayItems = useMemo(
    () => items.filter((item) => item.scheduled_day === day),
    [items, day]
  )

  const dates = useMemo(
    () => [...new Set(dayItems.map((item) => item.scheduled_date))].sort(),
    [dayItems]
  )

  const activeDate = date && dates.includes(date) ? date : dates[0] || ''

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    return dayItems.filter((item) => {
      const status = normalizeStatus(item.operational_status)
      const isOverdue = item.scheduled_date < today && status === 'pending'
      const isUpcoming = item.scheduled_date >= today && status === 'pending'

      if (filter === 'overdue' && !isOverdue) return false
      if (filter === 'upcoming' && !isUpcoming) return false
      if (filter === 'completed' && status !== 'completed') return false

      if (filter === 'all' && activeDate && item.scheduled_date !== activeDate) {
        return false
      }

      if (!q) return true

      return [
        item.client_name_snapshot,
        item.address_snapshot,
        item.city_snapshot
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [dayItems, activeDate, query, filter, today])

  const groups = useMemo(
    () =>
      groupByCityAndStreet(filtered, (item) => ({
        city: item.city_snapshot,
        address: item.address_snapshot
      })),
    [filtered]
  )

  function handleDay(next: ServiceDay) {
    setDay(next)
    setDate('')
  }

  function handleSaved(next: MonthlyServiceItem) {
    setItems((current) =>
      current.map((item) => (item.id_item === next.id_item ? next : item))
    )
  }

  return (
    <div className="space-y-4">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Monthly Plan
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight">Schedule</h1>
      </header>

      <div className="grid grid-cols-4 gap-1.5">
        {[
          ['all', 'All'],
          ['overdue', 'Overdue'],
          ['upcoming', 'Upcoming'],
          ['completed', 'Done']
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value as ScheduleFilter)}
            className={`min-h-10 rounded-xl px-2 text-[11px] font-bold ${
              filter === value
                ? 'bg-emerald-800 text-white'
                : 'border border-slate-200 bg-white text-slate-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <DayTabs value={day} onChange={handleDay} />

      {filter === 'all' && (
        <div className="mobile-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {dates.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setDate(value)}
              className={`min-h-9 shrink-0 rounded-xl px-3 text-xs font-bold ${
                activeDate === value
                  ? 'bg-emerald-800 text-white'
                  : 'border border-slate-200 bg-white text-slate-600'
              }`}
            >
              {format(parseISO(value), 'MMM d')}
            </button>
          ))}
        </div>
      )}

      <SearchBar value={query} onChange={setQuery} />

      {!loading && !error && groups.length > 0 && (
        <p className="text-xs text-slate-400">
          Locations are grouped by city and normalized street name.
        </p>
      )}

      {loading && <LoadingSkeleton count={4} />}
      {error && <ErrorState message={error} onRetry={refresh} />}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          title="No service visits"
          description="No visits match the current filters."
        />
      )}

      {!loading && !error && groups.length > 0 && (
        <LocationAccordion
          groups={groups}
          searchActive={query.trim().length > 0}
          itemKey={(item) => item.id_item}
          renderItem={(item) => (
            <CompactServiceRow item={item} onOpen={setSelected} />
          )}
        />
      )}

      {selected && (
        <VisitDetail
          item={selected}
          onClose={() => setSelected(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
