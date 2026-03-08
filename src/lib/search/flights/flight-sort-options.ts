export const FLIGHT_SORT_OPTIONS = [
  { label: 'Recommended', value: 'recommended' },
  { label: 'Price: low to high', value: 'price-asc' },
  { label: 'Price: high to low', value: 'price-desc' },
  { label: 'Duration', value: 'duration' },
  { label: 'Earliest departure', value: 'departure-asc' },
] as const

export type FlightSortKey = (typeof FLIGHT_SORT_OPTIONS)[number]['value']

export const isFlightSortKey = (value: string): value is FlightSortKey => {
  return FLIGHT_SORT_OPTIONS.some((option) => option.value === value)
}
