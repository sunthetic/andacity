import type { SavedItem, SavedVertical } from '~/types/save-compare/saved-item'

export const MIN_COMPARE_ITEMS = 2
export const MAX_COMPARE_ITEMS = 4
export const COMPARE_MISMATCH_LOG_PREFIX = '[decision-compare-mismatch]'

export const canOpenCompare = (savedCount: number) => savedCount >= MIN_COMPARE_ITEMS

export const verticalCompareLabel = (vertical: SavedVertical, count: number) => {
  if (vertical === 'hotels') return `${count} ${count === 1 ? 'hotel' : 'hotels'} saved`
  if (vertical === 'cars') return `${count} ${count === 1 ? 'car' : 'cars'} saved`
  return `${count} ${count === 1 ? 'flight' : 'flights'} saved`
}

export const verticalCompareTitle = (vertical: SavedVertical) => {
  if (vertical === 'hotels') return 'Compare hotels'
  if (vertical === 'cars') return 'Compare cars'
  return 'Compare flights'
}

export const toggleComparedItem = (items: SavedItem[], item: SavedItem) => {
  const exists = items.some((entry) => entry.id === item.id)
  if (exists) {
    return {
      items: items.filter((entry) => entry.id !== item.id),
      changed: true,
      removed: true,
      maxed: false,
    }
  }

  if (items.length >= MAX_COMPARE_ITEMS) {
    return {
      items,
      changed: false,
      removed: false,
      maxed: true,
    }
  }

  return {
    items: [item, ...items.filter((entry) => entry.id !== item.id)],
    changed: true,
    removed: false,
    maxed: false,
  }
}

export const isItemCompared = (items: SavedItem[], id: string) => {
  return items.some((item) => item.id === id)
}

export const compareCountLabel = (vertical: SavedVertical, count: number) => {
  if (vertical === 'hotels') return `${count} ${count === 1 ? 'hotel' : 'hotels'} selected`
  if (vertical === 'cars') return `${count} ${count === 1 ? 'car' : 'cars'} selected`
  return `${count} ${count === 1 ? 'flight' : 'flights'} selected`
}

export const compareFieldDefinitions: Record<
  SavedVertical,
  Array<{ key: string; label: string }>
> = {
  hotels: [
    { key: 'price', label: 'Price' },
    { key: 'location', label: 'Location' },
    { key: 'stayType', label: 'Stay type' },
    { key: 'rating', label: 'Guest rating' },
    { key: 'cancellation', label: 'Cancellation' },
    { key: 'payment', label: 'Payment' },
    { key: 'amenities', label: 'Top amenities' },
    { key: 'availability', label: 'Availability' },
  ],
  cars: [
    { key: 'price', label: 'Price' },
    { key: 'vehicleClass', label: 'Vehicle class' },
    { key: 'capacity', label: 'Capacity' },
    { key: 'transmission', label: 'Transmission' },
    { key: 'pickup', label: 'Pickup' },
    { key: 'cancellation', label: 'Cancellation' },
    { key: 'payment', label: 'Payment' },
    { key: 'inclusions', label: 'Inclusions' },
    { key: 'rating', label: 'Rating' },
    { key: 'availability', label: 'Availability' },
  ],
  flights: [
    { key: 'price', label: 'Price' },
    { key: 'airline', label: 'Airline' },
    { key: 'route', label: 'Route' },
    { key: 'schedule', label: 'Schedule' },
    { key: 'duration', label: 'Trip time' },
    { key: 'stops', label: 'Stops' },
    { key: 'cabin', label: 'Cabin' },
    { key: 'availability', label: 'Availability' },
  ],
}
