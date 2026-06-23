import { component$, useSignal, useTask$ } from '@builder.io/qwik'
import { compareFieldDefinitions, COMPARE_MISMATCH_LOG_PREFIX, verticalCompareTitle } from '~/lib/save-compare/compare-state'
import { useDecisioning } from '~/components/save-compare/DecisioningProvider'
import { SaveButton } from '~/components/save-compare/SaveButton'
import { AddToTripButton } from '~/components/trips/AddToTripButton'
import { trackBookingEvent } from '~/lib/analytics/booking-telemetry'
import { useOverlayBehavior } from '~/lib/ui/overlay'
import type { SavedItem, SavedVertical } from '~/types/save-compare/saved-item'

const loggedMismatchKeys = new Set<string>()

export const CompareSheet = component$((props: CompareSheetProps) => {
  const decisioning = useDecisioning()
  const openSignal = useSignal(props.open)
  useTask$(({ track }) => {
    openSignal.value = track(() => props.open)
  })
  const { overlayRef, initialFocusRef } = useOverlayBehavior({
    open: openSignal,
    onClose$: decisioning.closeCompare$,
  })
  if (!props.open) return null

  const fields = compareFieldDefinitions[props.vertical]
  const gridTemplateColumns = `minmax(160px, 200px) repeat(${props.items.length}, minmax(220px, 1fr))`

  logCompareMismatches(props.vertical, props.items, fields.map((field) => field.key))

  return (
    <div class="fixed inset-0 z-[90]">
      <button
        type="button"
        aria-label="Close compare sheet"
        class="absolute inset-0 bg-black/45"
        onClick$={() => {
          trackBookingEvent('booking_compare_closed', {
            vertical: props.vertical,
            surface: 'compare_sheet',
            compare_count: props.items.length,
          })
          return decisioning.closeCompare$()
        }}
      />

      <section
        ref={overlayRef}
        role="dialog"
        aria-modal="true"
        aria-label={verticalCompareTitle(props.vertical)}
        tabIndex={-1}
        class="absolute inset-0 outline-none"
        style="background:var(--ui-bg)"
      >
        <header
          class="sticky top-0 z-20 backdrop-blur"
          style="border-bottom:1px solid var(--ui-divider);background:var(--ui-surface)"
        >
          <div class="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-4 lg:px-6">
            <div>
              <h2 class="text-lg font-semibold" style="color:var(--ui-text)">
                {verticalCompareTitle(props.vertical)}
              </h2>
              <p class="mt-1 text-sm" style="color:var(--ui-text-muted)">
                Side-by-side comparison of the most practical decision fields.
              </p>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                onClick$={() => {
                  trackBookingEvent('booking_compare_cleared', {
                    vertical: props.vertical,
                    surface: 'compare_sheet',
                    compare_count: props.items.length,
                  })
                  return decisioning.clearComparedItems$(props.vertical)
                }}
                class="rounded-full px-3 py-2 text-xs font-semibold"
                style="border:1px solid var(--ui-border);color:var(--ui-text-muted)"
              >
                Clear all
              </button>
              <button
                ref={initialFocusRef}
                type="button"
                onClick$={() => {
                  trackBookingEvent('booking_compare_closed', {
                    vertical: props.vertical,
                    surface: 'compare_sheet',
                    compare_count: props.items.length,
                  })
                  return decisioning.closeCompare$()
                }}
                class="t-btn-primary px-4 py-2 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </header>

        <div class="mx-auto h-[calc(100vh-81px)] max-w-[1400px] overflow-auto px-4 py-4 lg:px-6">
          <div
            class="grid min-w-max gap-px rounded-3xl"
            style={{ gridTemplateColumns, border: '1px solid var(--ui-border)', background: 'var(--ui-divider)' }}
          >
            <div
              class="sticky left-0 z-10 flex items-end border-r px-4 py-4"
              style="border-color:var(--ui-divider);background:var(--ui-surface-muted)"
            >
              <p class="text-xs font-semibold uppercase tracking-[0.08em]" style="color:var(--ui-text-muted)">
                Criteria
              </p>
            </div>

            {props.items.map((item) => {
              const shortlisted = decisioning.state.shortlist[props.vertical].some(
                (entry) => entry.id === item.id,
              )

              return (
                <article
                  key={item.id}
                  class="flex h-full flex-col gap-3 px-4 py-4"
                  style="background:var(--ui-surface)"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      width={480}
                      height={240}
                      class="h-28 w-full rounded-2xl object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      class="flex h-28 items-center justify-center rounded-2xl text-xs font-semibold uppercase tracking-[0.08em]"
                      style="background:var(--ui-surface-muted);color:var(--ui-text-muted)"
                    >
                      {props.vertical}
                    </div>
                  )}

                  <div>
                    <h3 class="text-base font-semibold" style="color:var(--ui-text)">
                      {item.title}
                    </h3>
                    {item.subtitle ? (
                      <p class="mt-1 text-sm" style="color:var(--ui-text-muted)">
                        {item.subtitle}
                      </p>
                    ) : null}
                    {item.price ? (
                      <p class="mt-2 text-sm font-semibold" style="color:var(--ui-text)">
                        {item.price}
                      </p>
                    ) : null}
                  </div>

                  <div class="flex flex-wrap gap-2">
                    <SaveButton
                      saved={shortlisted}
                      idleLabel="Shortlist"
                      activeLabel="Shortlisted"
                      telemetry={{
                        vertical: props.vertical,
                        itemId: item.id,
                        surface: 'compare_sheet',
                      }}
                      onToggle$={() => decisioning.toggleShortlist$(props.vertical, item)}
                    />
                    <button
                      type="button"
                      onClick$={() => {
                        trackBookingEvent('booking_compare_removed', {
                          vertical: props.vertical,
                          surface: 'compare_sheet',
                          item_id: item.id,
                        })
                        return decisioning.removeComparedItem$(props.vertical, item.id)
                      }}
                      class="rounded-full px-3 py-1 text-xs font-semibold"
                      style="border:1px solid var(--ui-border);color:var(--ui-text-muted)"
                    >
                      Remove
                    </button>
                  </div>

                  <div class="mt-auto flex flex-wrap gap-2">
                    <a
                      href={item.href}
                      class="rounded-full px-3 py-2 text-xs font-semibold"
                      style="border:1px solid var(--ui-border);color:var(--ui-text)"
                    >
                      View
                    </a>
                    <AddToTripButton
                      item={item}
                      telemetrySource="compare_sheet"
                    />
                  </div>
                </article>
              )
            })}

            {fields.map((field) => (
              <>
                <div
                  key={`label:${field.key}`}
                  class="sticky left-0 z-10 border-r border-t px-4 py-4"
                  style="border-color:var(--ui-divider);background:var(--ui-surface-muted)"
                >
                  <div class="text-xs font-semibold uppercase tracking-[0.08em]" style="color:var(--ui-text-muted)">
                    {field.label}
                  </div>
                </div>

                {props.items.map((item) => (
                  <div
                    key={`${field.key}:${item.id}`}
                    class="border-t px-4 py-4 text-sm"
                    style="border-color:var(--ui-divider);background:var(--ui-surface);color:var(--ui-text)"
                  >
                    {item.compareData?.[field.key] || <span style="color:var(--ui-text-muted)">—</span>}
                  </div>
                ))}
              </>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
})

type CompareSheetProps = {
  open: boolean
  vertical: SavedVertical
  items: SavedItem[]
}

const logCompareMismatches = (
  vertical: SavedVertical,
  items: SavedItem[],
  requiredKeys: string[],
) => {
  if (typeof window === 'undefined') return

  for (const item of items) {
    if (item.vertical !== vertical) {
      const key = `${vertical}:vertical:${item.id}:${item.vertical}`
      if (loggedMismatchKeys.has(key)) continue
      loggedMismatchKeys.add(key)
      console.warn(COMPARE_MISMATCH_LOG_PREFIX, {
        reason: 'vertical-mismatch',
        expectedVertical: vertical,
        itemId: item.id,
        actualVertical: item.vertical,
      })
    }

    const compareData = item.compareData || {}
    const missingKeys = requiredKeys.filter((key) => !compareData[key])
    if (!missingKeys.length) continue

    const mismatchKey = `${vertical}:fields:${item.id}:${missingKeys.join(',')}`
    if (loggedMismatchKeys.has(mismatchKey)) continue
    loggedMismatchKeys.add(mismatchKey)
    console.warn(COMPARE_MISMATCH_LOG_PREFIX, {
      reason: 'missing-fields',
      vertical,
      itemId: item.id,
      missingKeys,
    })
  }
}
