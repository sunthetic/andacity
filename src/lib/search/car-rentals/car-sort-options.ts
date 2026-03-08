export const CAR_RENTALS_SORT_OPTIONS = [
  { label: 'Recommended', value: 'recommended' },
  { label: 'Price: low to high', value: 'price-asc' },
  { label: 'Price: high to low', value: 'price-desc' },
  { label: 'Vehicle class', value: 'vehicle-class' },
  { label: 'Pickup convenience', value: 'pickup-convenience' },
] as const

export type CarRentalsSortKey = (typeof CAR_RENTALS_SORT_OPTIONS)[number]['value']

export const isCarRentalsSortKey = (value: string): value is CarRentalsSortKey => {
  return CAR_RENTALS_SORT_OPTIONS.some((option) => option.value === value)
}
