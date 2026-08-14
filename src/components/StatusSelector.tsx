import type { OperationalStatus } from '../types/domain'
import { statusLabels } from '../utils/status'

const resultStatuses: OperationalStatus[] = [
  'completed',
  'not_completed',
  'rescheduled',
  'canceled'
]

export function StatusSelector({
  value,
  onChange
}: {
  value: OperationalStatus
  onChange: (value: OperationalStatus) => void
}) {
  return (
    <div>
      {value === 'pending' && (
        <div className="mb-3 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600">
          Current status: Pending
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {resultStatuses.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => onChange(status)}
            className={`min-h-12 rounded-2xl border px-3 text-sm font-semibold transition ${
              value === status
                ? 'border-emerald-700 bg-emerald-700 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            {statusLabels[status]}
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-400">
        The current Supabase save function accepts Completed, Not Completed,
        Rescheduled, or Canceled as service results.
      </p>
    </div>
  )
}
