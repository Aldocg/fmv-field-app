import type {OperationalStatus} from '../types/domain'
export const statusLabels:Record<OperationalStatus,string>={pending:'Pending',completed:'Completed',not_completed:'Not Completed',rescheduled:'Rescheduled',canceled:'Canceled'}
export function normalizeStatus(v?:string|null):OperationalStatus{const s=(v||'').toLowerCase();return ['completed','not_completed','rescheduled','canceled'].includes(s)?s as OperationalStatus:'pending'}
