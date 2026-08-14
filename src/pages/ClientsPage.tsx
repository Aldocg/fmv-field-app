import { useEffect, useMemo, useState } from 'react'
import { MapPin } from 'lucide-react'
import { SearchBar } from '../components/SearchBar'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { getPlanClients } from '../services/clientService'
import type { PlanClient } from '../types/domain'

export function ClientsPage() {
  const [clients, setClients] = useState<PlanClient[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    if (!q) return clients

    return clients.filter((client) =>
      [client.name, client.address, client.city]
        .join(' ')
        .toLowerCase()
        .includes(q)
    )
  }, [clients, query])

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Open Plans
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Clients</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Clients included in currently open monthly plans.
        </p>
      </header>

      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search by name or address..."
      />

      {loading && <LoadingSkeleton />}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState title="No clients found" description="Try a different search." />
      )}

      <div className="space-y-3">
        {filtered.map((client) => (
          <article
            key={client.id_cliente}
            className="rounded-3xl border border-slate-100 bg-white p-4 shadow-soft"
          >
            <h2 className="text-lg font-bold">{client.name}</h2>
            <p className="mt-2 flex gap-2 text-sm leading-5 text-slate-500">
              <MapPin size={16} className="mt-0.5 shrink-0" />
              {[client.address, client.city].filter(Boolean).join(', ') || 'No address'}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {client.scheduledDays.map((day) => (
                <span
                  key={day}
                  className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800"
                >
                  {day}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
