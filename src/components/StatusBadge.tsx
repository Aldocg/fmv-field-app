import {Ban,CheckCircle2,Clock3,RotateCcw,XCircle} from 'lucide-react'
import type {OperationalStatus} from '../types/domain'
import {statusLabels} from '../utils/status'
const st:Record<OperationalStatus,string>={pending:'bg-slate-100 text-slate-700',completed:'bg-emerald-50 text-emerald-800',not_completed:'bg-rose-50 text-rose-800',rescheduled:'bg-amber-50 text-amber-800',canceled:'bg-slate-200 text-slate-700'};const I={pending:Clock3,completed:CheckCircle2,not_completed:XCircle,rescheduled:RotateCcw,canceled:Ban};export function StatusBadge({status}:{status:OperationalStatus}){const Icon=I[status];return <span className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${st[status]}`}><Icon size={14}/>{statusLabels[status]}</span>}
