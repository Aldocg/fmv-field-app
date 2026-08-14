import { ChevronDown, ChevronRight, MapPinned } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { CityGroup } from '../utils/locationGrouping'

export function LocationAccordion<T>({
  groups,
  renderItem,
  searchActive = false,
  itemKey
}: {
  groups: CityGroup<T>[]
  renderItem: (item: T) => ReactNode
  searchActive?: boolean
  itemKey: (item: T) => string | number
}) {
  const [openCities, setOpenCities] = useState<Set<string>>(new Set())
  const [openStreets, setOpenStreets] = useState<Set<string>>(new Set())

  const allCityKeys = useMemo(() => groups.map((group) => group.key), [groups])
  const allStreetKeys = useMemo(
    () => groups.flatMap((group) => group.streets.map((street) => street.key)),
    [groups]
  )

  // Default state is fully collapsed.
  // During search, matching groups open automatically so results are immediately visible.
  useEffect(() => {
    if (searchActive) {
      setOpenCities(new Set(allCityKeys))
      setOpenStreets(new Set(allStreetKeys))
    } else {
      setOpenCities(new Set())
      setOpenStreets(new Set())
    }
  }, [searchActive, allCityKeys.join('|'), allStreetKeys.join('|')])

  function toggleCity(key: string) {
    setOpenCities((current) => {
      const next = new Set(current)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function toggleStreet(key: string) {
    setOpenStreets((current) => {
      const next = new Set(current)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  return (
    <div className="space-y-2">
      {groups.map((city) => {
        const cityOpen = openCities.has(city.key)

        return (
          <section
            key={city.key}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <button
              type="button"
              onClick={() => toggleCity(city.key)}
              className="flex min-h-12 w-full items-center gap-2 px-3 text-left"
            >
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800">
                <MapPinned size={16} />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-black text-slate-900">
                  {city.label}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {city.streets.length} {city.streets.length === 1 ? 'street' : 'streets'}
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-600">
                {city.count}
              </span>

              {cityOpen ? (
                <ChevronDown size={18} className="text-slate-400" />
              ) : (
                <ChevronRight size={18} className="text-slate-400" />
              )}
            </button>

            {cityOpen && (
              <div className="border-t border-slate-100 bg-slate-50/70 p-2">
                <div className="space-y-2">
                  {city.streets.map((street) => {
                    const streetOpen = openStreets.has(street.key)

                    return (
                      <div
                        key={street.key}
                        className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                      >
                        <button
                          type="button"
                          onClick={() => toggleStreet(street.key)}
                          className="flex min-h-10 w-full items-center gap-2 px-3 text-left"
                        >
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-xs font-bold text-slate-700">
                              {street.label}
                            </h3>
                          </div>

                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                            {street.items.length}
                          </span>

                          {streetOpen ? (
                            <ChevronDown size={16} className="text-slate-400" />
                          ) : (
                            <ChevronRight size={16} className="text-slate-400" />
                          )}
                        </button>

                        {streetOpen && (
                          <div className="space-y-1.5 border-t border-slate-100 bg-slate-50 p-1.5">
                            {street.items.map((item) => (
                              <div key={itemKey(item)}>{renderItem(item)}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
