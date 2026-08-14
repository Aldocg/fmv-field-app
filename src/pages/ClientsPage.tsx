import { useEffect, useMemo, useState } from 'react'
import { SearchBar } from '../components/SearchBar'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { CompactClientRow } from '../components/CompactClientRow'
import { ClientDetail } from '../components/ClientDetail'
import { LocationAccordion } from '../components/LocationAccordion'
import { getPlanClients } from '../services/clientService'
import { useOpenPlanItems } from '../hooks/useOpenPlanItems'
import type { PlanClient } from '../types/domain'
import { groupByCityAndStreet } from '../utils/locationGrouping'

type ClientDayFilter = 'All' | 'Wednesday' | 'Thursday' | 'Friday'

export function ClientsPage() {
  const [clients, setClients] = useState<PlanClient[]>([])
  const [query, setQuery] = useState('')
  const [dayFilter, setDayFilter] = useState<ClientDayFilter>('All')
  const [selected, setSelected] = useState<PlanClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { items } = useOpenPlanItems()

  async function load() {
    try {
      setLoading(true)
      setError(null)
      setClients(await getPlanClients())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load clients.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    return clients.filter((client) => {
      if (
        dayFilter !== 'All' &&
        !client.scheduledDays.includes(dayFilter)
      ) {
        return false
      }

      if (!q) return true

      return [client.name, client.address, client.city]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [clients, query, dayFilter])

  const groups = useMemo(
    () =>
      groupByCityAndStreet(filtered, (client) => ({
        city: client.city,
        address: client.address
      })),
    [filtered]
  )

  return (
    <div className="space-y-4">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Open Plans
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight">Clients</h1>
      </header>

      <div className="grid grid-cols-4 gap-1.5">
        {(['All', 'Wednesday', 'Thursday', 'Friday'] as ClientDayFilter[]).map(
          (value) => (
            <button
              key={value}
              type="button"
              onClick={() => setDayFilter(value)}
              className={`min-h-10 rounded-xl px-2 text-[11px] font-bold ${
                dayFilter === value
                  ? 'bg-emerald-800 text-white'
                  : 'border border-slate-200 bg-white text-slate-600'
              }`}
            >
              {value === 'All' ? 'All' : value.slice(0, 3)}
            </button>
          )
        )}
      </div>

      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search by name or address..."
      />

      {!loading && !error && groups.length > 0 && (
        <p className="text-xs text-slate-400">
          Browse clients by city, then street.
        </p>
      )}

      {loading && <LoadingSkeleton count={4} />}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState title="No clients found" description="Try a different search." />
      )}

      {!loading && !error && groups.length > 0 && (
        <LocationAccordion
          groups={groups}
          searchActive={query.trim().length > 0}
          itemKey={(client) => client.id_cliente}
          renderItem={(client) => (
            <CompactClientRow client={client} onOpen={setSelected} />
          )}
        />
      )}

      {selected && (
        <ClientDetail
          client={selected}
          items={items}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
