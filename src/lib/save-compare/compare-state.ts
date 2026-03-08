import type { SavedVertical } from '~/types/save-compare/saved-item'

export const MIN_COMPARE_ITEMS = 2

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
