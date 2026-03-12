import {
  $,
  Slot,
  component$,
  createContextId,
  useContext,
  useContextProvider,
  useStore,
  useVisibleTask$,
  type QRL,
} from '@builder.io/qwik'
import {
  isItemCompared,
  toggleComparedItem,
} from '~/lib/save-compare/compare-state'
import {
  clearSavedCollection,
  isItemSaved,
  toggleSavedItem,
} from '~/lib/save-compare/saved-state'
import {
  SAVE_COMPARE_STORAGE_KEY,
  createEmptySavedCollections,
  readRecentlyViewedCollections,
  readSavedCollections,
  readSessionCompareCollections,
  writeRecentlyViewedCollections,
  writeSavedCollections,
  writeSessionCompareCollections,
} from '~/lib/save-compare/storage'
import type { SavedCollections, SavedItem, SavedVertical } from '~/types/save-compare/saved-item'

const RECENTLY_VIEWED_LIMIT = 8

type UndoState =
  | {
      kind: 'restore-item'
      collection: 'shortlist' | 'compare'
      vertical: SavedVertical
      item: SavedItem
      reopenCompare?: boolean
      message: string
    }
  | {
      kind: 'restore-collection'
      collection: 'shortlist' | 'compare'
      vertical: SavedVertical
      items: SavedItem[]
      reopenCompare?: boolean
      message: string
    }

type DecisioningState = {
  ready: boolean
  shortlist: SavedCollections
  compare: SavedCollections
  recentlyViewed: SavedCollections
  compareOpen: boolean
  compareVertical: SavedVertical | null
  undo: UndoState | null
  compareLimit: number
}

export type DecisioningContextValue = {
  state: DecisioningState
  toggleShortlist$: QRL<(vertical: SavedVertical, item: SavedItem) => void>
  toggleCompare$: QRL<(vertical: SavedVertical, item: SavedItem) => void>
  clearShortlist$: QRL<(vertical: SavedVertical) => void>
  removeComparedItem$: QRL<(vertical: SavedVertical, id: string) => void>
  clearComparedItems$: QRL<(vertical: SavedVertical) => void>
  openCompare$: QRL<(vertical: SavedVertical) => void>
  closeCompare$: QRL<() => void>
  recordRecentlyViewed$: QRL<(vertical: SavedVertical, item: SavedItem) => void>
  undo$: QRL<() => void>
  dismissUndo$: QRL<() => void>
}

export const DecisioningContext = createContextId<DecisioningContextValue>(
  'andacity.decisioning-context',
)

const syncStateFromStorage = (state: DecisioningState) => {
  state.shortlist = readSavedCollections()
  state.compare = readSessionCompareCollections()
  state.recentlyViewed = readRecentlyViewedCollections()
  state.ready = true
}

const clearUndoState = (state: DecisioningState) => {
  state.undo = null
}

const persistShortlistState = (
  state: DecisioningState,
  vertical: SavedVertical,
  items: SavedItem[],
) => {
  const next = {
    ...state.shortlist,
    [vertical]: items,
  }
  state.shortlist = next
  writeSavedCollections(next)
}

const persistCompareState = (
  state: DecisioningState,
  vertical: SavedVertical,
  items: SavedItem[],
) => {
  const next = {
    ...state.compare,
    [vertical]: items,
  }
  state.compare = next
  writeSessionCompareCollections(next)
}

const persistRecentlyViewedState = (
  state: DecisioningState,
  vertical: SavedVertical,
  items: SavedItem[],
) => {
  const next = {
    ...state.recentlyViewed,
    [vertical]: items,
  }
  state.recentlyViewed = next
  writeRecentlyViewedCollections(next)
}

export const DecisioningProvider = component$(() => {
  const state = useStore<DecisioningState>({
    ready: false,
    shortlist: createEmptySavedCollections(),
    compare: createEmptySavedCollections(),
    recentlyViewed: createEmptySavedCollections(),
    compareOpen: false,
    compareVertical: null,
    undo: null,
    compareLimit: 4,
  })

  const toggleShortlist$ = $((vertical: SavedVertical, item: SavedItem) => {
    const current = state.shortlist[vertical]
    const next = toggleSavedItem(current, item)
    const removing = isItemSaved(current, item.id)
    clearUndoState(state)

    if (removing) {
      state.undo = {
        kind: 'restore-item',
        collection: 'shortlist',
        vertical,
        item,
        message: `${item.title} removed from shortlist.`,
      }
    }

    persistShortlistState(state, vertical, next)
  })

  const toggleCompare$ = $((vertical: SavedVertical, item: SavedItem) => {
    const current = state.compare[vertical]
    const outcome = toggleComparedItem(current, item)
    clearUndoState(state)

    if (!outcome.changed) return

    if (outcome.removed) {
      state.undo = {
        kind: 'restore-item',
        collection: 'compare',
        vertical,
        item,
        reopenCompare: state.compareOpen && state.compareVertical === vertical,
        message: `${item.title} removed from compare.`,
      }
    }

    persistCompareState(state, vertical, outcome.items)

    if (!outcome.items.length && state.compareVertical === vertical) {
      state.compareOpen = false
    }
  })

  const clearShortlist$ = $((vertical: SavedVertical) => {
    const current = state.shortlist[vertical]
    if (!current.length) return
    clearUndoState(state)
    state.undo = {
      kind: 'restore-collection',
      collection: 'shortlist',
      vertical,
      items: current,
      message: 'Shortlist cleared.',
    }
    persistShortlistState(state, vertical, clearSavedCollection())
  })

  const removeComparedItem$ = $((vertical: SavedVertical, id: string) => {
    const current = state.compare[vertical]
    const item = current.find((entry) => entry.id === id)
    if (!item) return

    clearUndoState(state)
    state.undo = {
      kind: 'restore-item',
      collection: 'compare',
      vertical,
      item,
      reopenCompare: state.compareOpen && state.compareVertical === vertical,
      message: `${item.title} removed from compare.`,
    }

    const next = current.filter((entry) => entry.id !== id)
    persistCompareState(state, vertical, next)

    if (!next.length && state.compareVertical === vertical) {
      state.compareOpen = false
    }
  })

  const clearComparedItems$ = $((vertical: SavedVertical) => {
    const current = state.compare[vertical]
    if (!current.length) return

    clearUndoState(state)
    state.undo = {
      kind: 'restore-collection',
      collection: 'compare',
      vertical,
      items: current,
      reopenCompare: state.compareOpen && state.compareVertical === vertical,
      message: 'Compare selection cleared.',
    }

    persistCompareState(state, vertical, clearSavedCollection())
    if (state.compareVertical === vertical) {
      state.compareOpen = false
    }
  })

  const openCompare$ = $((vertical: SavedVertical) => {
    state.compareVertical = vertical
    state.compareOpen = true
  })

  const closeCompare$ = $(() => {
    state.compareOpen = false
  })

  const recordRecentlyViewed$ = $((vertical: SavedVertical, item: SavedItem) => {
    const current = state.recentlyViewed[vertical]
    const next = [item, ...current.filter((entry) => entry.id !== item.id)].slice(
      0,
      RECENTLY_VIEWED_LIMIT,
    )
    persistRecentlyViewedState(state, vertical, next)
  })

  const undo$ = $(() => {
    const currentUndo = state.undo
    if (!currentUndo) return

    if (currentUndo.collection === 'shortlist') {
      const current = state.shortlist[currentUndo.vertical]
      const next =
        currentUndo.kind === 'restore-item'
          ? [currentUndo.item, ...current.filter((entry) => entry.id !== currentUndo.item.id)]
          : currentUndo.items
      persistShortlistState(state, currentUndo.vertical, next)
    } else {
      const current = state.compare[currentUndo.vertical]
      const next =
        currentUndo.kind === 'restore-item'
          ? [currentUndo.item, ...current.filter((entry) => entry.id !== currentUndo.item.id)].slice(
              0,
              state.compareLimit,
            )
          : currentUndo.items.slice(0, state.compareLimit)
      persistCompareState(state, currentUndo.vertical, next)

      if (currentUndo.reopenCompare) {
        state.compareVertical = currentUndo.vertical
        state.compareOpen = true
      }
    }

    state.undo = null
  })

  const dismissUndo$ = $(() => {
    state.undo = null
  })

  useContextProvider(DecisioningContext, {
    state,
    toggleShortlist$,
    toggleCompare$,
    clearShortlist$,
    removeComparedItem$,
    clearComparedItems$,
    openCompare$,
    closeCompare$,
    recordRecentlyViewed$,
    undo$,
    dismissUndo$,
  })

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    syncStateFromStorage(state)

    const onStorage = (event: StorageEvent) => {
      if (event.key && event.key !== SAVE_COMPARE_STORAGE_KEY) return
      state.shortlist = readSavedCollections()
    }

    window.addEventListener('storage', onStorage)
    cleanup(() => window.removeEventListener('storage', onStorage))
  })

  return <Slot />
})

export const useDecisioning = () => useContext(DecisioningContext)

export const isShortlisted = (
  state: DecisioningState,
  vertical: SavedVertical,
  id: string,
) => isItemSaved(state.shortlist[vertical], id)

export const isCompared = (
  state: DecisioningState,
  vertical: SavedVertical,
  id: string,
) => isItemCompared(state.compare[vertical], id)
