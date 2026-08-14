import { useMemo, useState } from 'react'
import { format } from 'date-fns'
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

type TodayFilter = 'all' | 'pending' | 'completed' | 'issues'

export function TodayPage() {
  const { items, setItems, loading, error, refresh } = useOpenPlanItems()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<TodayFilter>('all')
  const [selected, setSelected] = useState<MonthlyServiceItem | null>(null)

  const today = format(new Date(), 'yyyy-MM-dd')

  const dayItems = useMemo(
    () => items.filter((item) => item.scheduled_date === today),
    [items, today]
  )

  const todaysItems = useMemo(() => {
    const q = query.trim().toLowerCase()

    return dayItems.filter((item) => {
      const status = normalizeStatus(item.operational_status)

      if (filter === 'pending' && status !== 'pending') return false
      if (filter === 'completed' && status !== 'completed') return false
      if (
        filter === 'issues' &&
        !['not_completed', 'rescheduled', 'canceled'].includes(status)
      ) {
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
  }, [dayItems, query, filter])

  const groups = useMemo(
    () =>
      groupByCityAndStreet(todaysItems, (item) => ({
        city: item.city_snapshot,
        address: item.address_snapshot
      })),
    [todaysItems]
  )

  const completed = dayItems.filter(
    (item) => normalizeStatus(item.operational_status) === 'completed'
  ).length

  const pending = dayItems.filter(
    (item) => normalizeStatus(item.operational_status) === 'pending'
  ).length

  const issues = dayItems.filter((item) =>
    ['not_completed', 'rescheduled', 'canceled'].includes(
      normalizeStatus(item.operational_status)
    )
  ).length

  function handleSaved(next: MonthlyServiceItem) {
    setItems((current) =>
      current.map((item) => (item.id_item === next.id_item ? next : item))
    )
  }

  return (
    <div className="space-y-4">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          {format(new Date(), 'EEEE, MMM d')}
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
          Today's Services
        </h1>
      </header>

      <div className="grid grid-cols-4 gap-1.5">
        {[
          ['all', 'All', dayItems.length],
          ['pending', 'Pending', pending],
          ['completed', 'Done', completed],
          ['issues', 'Issues', issues]
        ].map(([value, label, count]) => (
          <button
            key={String(value)}
            type="button"
            onClick={() => setFilter(value as TodayFilter)}
            className={`min-h-12 rounded-xl px-2 text-center ${
              filter === value
                ? 'bg-emerald-800 text-white'
                : 'border border-slate-200 bg-white text-slate-700'
            }`}
          >
            <div className="text-sm font-black">{count}</div>
            <div className="text-[10px] font-semibold">{label}</div>
          </button>
        ))}
      </div>

      <SearchBar value={query} onChange={setQuery} />

      {!loading && !error && groups.length > 0 && (
        <p className="text-xs text-slate-400">
          Tap a city, then a street, to view services.
        </p>
      )}

      {loading && <LoadingSkeleton count={4} />}
      {error && <ErrorState message={error} onRetry={refresh} />}

      {!loading && !error && todaysItems.length === 0 && (
        <EmptyState
          title="No services"
          description="No services match the current filter."
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
