import type { SavedItem, SavedVertical } from '~/types/save-compare/saved-item'
import { readSavedItems, writeSavedItems } from '~/lib/save-compare/storage'

export const isItemSaved = (items: SavedItem[], id: string) => {
  return items.some((item) => item.id === id)
}

export const toggleSavedItem = (items: SavedItem[], item: SavedItem) => {
  if (isItemSaved(items, item.id)) {
    return items.filter((entry) => entry.id !== item.id)
  }

  return [item, ...items.filter((entry) => entry.id !== item.id)]
}

export const removeSavedItem = (items: SavedItem[], id: string) => {
  return items.filter((item) => item.id !== id)
}

export const clearSavedCollection = () => {
  return [] as SavedItem[]
}

export const loadSavedItems = (vertical: SavedVertical) => {
  return readSavedItems(vertical)
}

export const persistSavedItems = (vertical: SavedVertical, items: SavedItem[]) => {
  writeSavedItems(vertical, items)
}
