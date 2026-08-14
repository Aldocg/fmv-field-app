export interface LocationLike {
  city: string | null | undefined
  address: string | null | undefined
}

const suffixMap: Array<[RegExp, string]> = [
  [/\bavenue\b/gi, 'Ave'],
  [/\bave\.?\b/gi, 'Ave'],
  [/\bstreet\b/gi, 'St'],
  [/\bst\.?\b/gi, 'St'],
  [/\broad\b/gi, 'Rd'],
  [/\brd\.?\b/gi, 'Rd'],
  [/\bdrive\b/gi, 'Dr'],
  [/\bdr\.?\b/gi, 'Dr'],
  [/\blane\b/gi, 'Ln'],
  [/\bln\.?\b/gi, 'Ln'],
  [/\bcourt\b/gi, 'Ct'],
  [/\bct\.?\b/gi, 'Ct'],
  [/\bboulevard\b/gi, 'Blvd'],
  [/\bblvd\.?\b/gi, 'Blvd'],
  [/\bplace\b/gi, 'Pl'],
  [/\bpl\.?\b/gi, 'Pl'],
  [/\bparkway\b/gi, 'Pkwy'],
  [/\bpkwy\.?\b/gi, 'Pkwy'],
  [/\bhighway\b/gi, 'Hwy'],
  [/\bhwy\.?\b/gi, 'Hwy'],
  [/\bterrace\b/gi, 'Ter'],
  [/\bter\.?\b/gi, 'Ter'],
  [/\bcircle\b/gi, 'Cir'],
  [/\bcir\.?\b/gi, 'Cir']
]

function cleanSpaces(value: string) {
  return value
    .replace(/[.,#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeCity(value?: string | null) {
  const cleaned = cleanSpaces(value || '')
  return cleaned || 'Other'
}

export function getStreetFromAddress(address?: string | null) {
  let value = cleanSpaces(address || '')

  // Remove leading house number: "47 Jernee Dr" -> "Jernee Dr"
  value = value.replace(/^\d+[A-Za-z-]*\s+/, '')

  // Remove common unit/apartment tail when present.
  value = value.replace(/\s+(apt|unit|suite|ste)\s+\w.*$/i, '')

  for (const [pattern, replacement] of suffixMap) {
    value = value.replace(pattern, replacement)
  }

  return cleanSpaces(value) || 'Other Street'
}

export function locationGroupKey(city?: string | null, address?: string | null) {
  return `${normalizeCity(city).toUpperCase()}|${getStreetFromAddress(address).toUpperCase()}`
}

export interface StreetGroup<T> {
  key: string
  label: string
  items: T[]
}

export interface CityGroup<T> {
  key: string
  label: string
  count: number
  streets: StreetGroup<T>[]
}

export function groupByCityAndStreet<T>(
  items: T[],
  getLocation: (item: T) => LocationLike
): CityGroup<T>[] {
  const cityMap = new Map<
    string,
    {
      label: string
      streets: Map<string, { label: string; items: T[] }>
    }
  >()

  for (const item of items) {
    const location = getLocation(item)
    const cityLabel = normalizeCity(location.city)
    const streetLabel = getStreetFromAddress(location.address)

    const cityKey = cityLabel.toUpperCase()
    const streetKey = streetLabel.toUpperCase()

    if (!cityMap.has(cityKey)) {
      cityMap.set(cityKey, {
        label: cityLabel,
        streets: new Map()
      })
    }

    const city = cityMap.get(cityKey)!

    if (!city.streets.has(streetKey)) {
      city.streets.set(streetKey, {
        label: streetLabel,
        items: []
      })
    }

    city.streets.get(streetKey)!.items.push(item)
  }

  return [...cityMap.entries()]
    .map(([cityKey, city]) => {
      const streets = [...city.streets.entries()]
        .map(([streetKey, street]) => ({
          key: `${cityKey}|${streetKey}`,
          label: street.label,
          items: street.items
        }))
        .sort((a, b) => a.label.localeCompare(b.label))

      return {
        key: cityKey,
        label: city.label,
        count: streets.reduce((total, street) => total + street.items.length, 0),
        streets
      }
    })
    .sort((a, b) => a.label.localeCompare(b.label))
}
