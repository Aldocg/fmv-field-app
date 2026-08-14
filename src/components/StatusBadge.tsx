import { Ban, CheckCircle2, Clock3, RotateCcw, XCircle } from 'lucide-react'
import type { OperationalStatus } from '../types/domain'
import { statusLabels } from '../utils/status'

const styles: Record<OperationalStatus, string> = {
  pending: 'bg-slate-100 text-slate-700',
  completed: 'bg-emerald-50 text-emerald-800',
  not_completed: 'bg-rose-50 text-rose-800',
  rescheduled: 'bg-amber-50 text-amber-800',
  canceled: 'bg-slate-200 text-slate-700'
}

const icons = {
  pending: Clock3,
  completed: CheckCircle2,
  not_completed: XCircle,
  rescheduled: RotateCcw,
  canceled: Ban
}

export function StatusBadge({
  status,
  compact = false
}: {
  status: OperationalStatus
  compact?: boolean
}) {
  const Icon = icons[status]

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${styles[status]} ${
        compact
          ? 'min-h-6 px-2 py-0.5 text-[10px]'
          : 'min-h-8 px-3 py-1 text-xs'
      }`}
    >
      <Icon size={compact ? 11 : 14} aria-hidden="true" />
      {statusLabels[status]}
    </span>
  )
}
