import { CalendarRange, CircleUserRound, House, PlusCircle, UsersRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const items = [
  ['/', 'Today', House],
  ['/schedule', 'Schedule', CalendarRange],
  ['/clients', 'Clients', UsersRound],
  ['/extras', 'Extra Services', PlusCircle],
  ['/account', 'Account', CircleUserRound]
] as const

export function BottomNavigation() {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-1.5 pt-2 backdrop-blur">
      <div className="mx-auto grid max-w-xl grid-cols-5">
        {items.map(([to, label, Icon]) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-0.5 text-center text-[10px] font-semibold leading-tight ${
                isActive ? 'text-emerald-800' : 'text-slate-400'
              }`
            }
          >
            <Icon size={21} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
