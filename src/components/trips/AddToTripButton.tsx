import { $, component$, useSignal, type QRL } from '@builder.io/qwik'
import {
  addItemToTripApi,
  createTripApi,
  listTripsApi,
  TripApiError,
} from '~/lib/trips/trips-api'
import type { SavedItem } from '~/types/save-compare/saved-item'
import type { TripListItem } from '~/types/trips/trip'

export const AddToTripButton = component$((props: AddToTripButtonProps) => {
  const open = useSignal(false)
  const loading = useSignal(false)
  const saving = useSignal(false)
  const error = useSignal<string | null>(null)
  const success = useSignal<string | null>(null)
  const trips = useSignal<TripListItem[]>([])
  const selectedTripId = useSignal<number | null>(null)
  const newTripName = useSignal('')

  const canAdd = Boolean(props.item.tripCandidate)

  const refreshTrips$ = $(async () => {
    loading.value = true
    error.value = null

    try {
      const nextTrips = await listTripsApi()
      trips.value = nextTrips

      if (
        selectedTripId.value == null ||
        !nextTrips.some((trip) => trip.id === selectedTripId.value)
      ) {
        selectedTripId.value = nextTrips[0]?.id || null
      }
    } catch (cause) {
      const message =
        cause instanceof TripApiError
          ? cause.message
          : 'Failed to load trips.'
      error.value = message
    } finally {
      loading.value = false
    }
  })

  const onOpen$ = $(async () => {
    if (!canAdd) return
    open.value = true
    await refreshTrips$()
  })

  const onClose$ = $(() => {
    open.value = false
  })

  const onAddToSelected$ = $(async () => {
    if (!canAdd || !selectedTripId.value || !props.item.tripCandidate) return
    saving.value = true
    error.value = null
    success.value = null

    try {
      const trip = await addItemToTripApi(selectedTripId.value, props.item.tripCandidate)
      success.value = `Added to ${trip.name}.`
      open.value = false
      await refreshTrips$()
      if (props.onAdded$) {
        await props.onAdded$(trip.id)
      }
    } catch (cause) {
      const message =
        cause instanceof TripApiError
          ? cause.message
          : 'Failed to add item to trip.'
      error.value = message
    } finally {
      saving.value = false
    }
  })

  const onCreateAndAdd$ = $(async () => {
    if (!canAdd || !props.item.tripCandidate) return
    saving.value = true
    error.value = null
    success.value = null

    try {
      const created = await createTripApi({
        name: String(newTripName.value || '').trim() || `Trip for ${props.item.title}`,
      })

      const updated = await addItemToTripApi(created.id, props.item.tripCandidate)
      selectedTripId.value = updated.id
      success.value = `Created and added to ${updated.name}.`
      newTripName.value = ''
      open.value = false
      await refreshTrips$()
      if (props.onAdded$) {
        await props.onAdded$(updated.id)
      }
    } catch (cause) {
      const message =
        cause instanceof TripApiError
          ? cause.message
          : 'Failed to create trip.'
      error.value = message
    } finally {
      saving.value = false
    }
  })

  return (
    <>
      <button
        type="button"
        onClick$={onOpen$}
        disabled={!canAdd}
        class={[
          props.class ||
            'rounded-lg border border-[color:var(--color-border)] px-3 py-1.5 text-xs font-medium text-[color:var(--color-action)] hover:border-[color:var(--color-action)] disabled:cursor-not-allowed disabled:opacity-50',
        ]}
      >
        {props.label || 'Add to trip'}
      </button>

      {success.value ? (
        <p class="mt-1 text-xs text-[color:var(--color-success,#0f766e)]">{success.value}</p>
      ) : null}

      {open.value ? (
        <div class="fixed inset-0 z-[95]">
          <button
            type="button"
            class="absolute inset-0 bg-black/35"
            aria-label="Close add-to-trip dialog"
            onClick$={onClose$}
          />

          <section class="absolute inset-x-3 top-1/2 max-h-[90vh] -translate-y-1/2 overflow-y-auto rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-[var(--shadow-e3)] sm:inset-x-auto sm:left-1/2 sm:w-[560px] sm:-translate-x-1/2">
            <header class="flex items-start justify-between gap-3">
              <div>
                <h3 class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                  Add to trip
                </h3>
                <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                  {props.item.title}
                </p>
              </div>
              <button
                type="button"
                class="rounded-lg border border-[color:var(--color-border)] px-2 py-1 text-xs text-[color:var(--color-text-muted)]"
                onClick$={onClose$}
              >
                Close
              </button>
            </header>

            {loading.value ? (
              <p class="mt-4 text-sm text-[color:var(--color-text-muted)]">Loading trips...</p>
            ) : (
              <>
                <div class="mt-4">
                  <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
                    Existing trips
                  </p>
                  {trips.value.length ? (
                    <div class="mt-2 grid gap-2">
                      {trips.value.map((trip) => (
                        <label
                          key={trip.id}
                          class="flex items-center justify-between rounded-xl border border-[color:var(--color-border)] px-3 py-2"
                        >
                          <span class="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`trip-choice-${props.item.id}`}
                              checked={selectedTripId.value === trip.id}
                              onChange$={() => {
                                selectedTripId.value = trip.id
                              }}
                            />
                            <span class="text-sm text-[color:var(--color-text-strong)]">
                              {trip.name}
                            </span>
                          </span>
                          <span class="text-xs text-[color:var(--color-text-muted)]">
                            {trip.itemCount} items
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p class="mt-2 text-sm text-[color:var(--color-text-muted)]">
                      No trips yet.
                    </p>
                  )}

                  <div class="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      class="t-btn-primary px-3 py-1.5 text-xs"
                      disabled={saving.value || !selectedTripId.value}
                      onClick$={onAddToSelected$}
                    >
                      {saving.value ? 'Adding...' : 'Add to selected trip'}
                    </button>
                  </div>
                </div>

                <div class="mt-5 border-t border-[color:var(--color-divider)] pt-4">
                  <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
                    Create new trip
                  </p>
                  <div class="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                    <input
                      type="text"
                      value={newTripName.value}
                      onInput$={(event, target) => {
                        void event
                        newTripName.value = target.value
                      }}
                      placeholder="Summer planning"
                      class="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      class="t-btn-ghost px-3 py-2 text-sm"
                      disabled={saving.value}
                      onClick$={onCreateAndAdd$}
                    >
                      {saving.value ? 'Saving...' : 'Create + add'}
                    </button>
                  </div>
                </div>

                {error.value ? (
                  <p class="mt-3 text-sm text-[color:var(--color-error,#b91c1c)]">{error.value}</p>
                ) : null}
              </>
            )}
          </section>
        </div>
      ) : null}
    </>
  )
})

type AddToTripButtonProps = {
  item: SavedItem
  label?: string
  class?: string
  onAdded$?: QRL<(tripId: number) => void>
}
