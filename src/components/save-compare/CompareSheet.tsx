import { component$, useSignal } from '@builder.io/qwik'
import { compareFieldDefinitions, COMPARE_MISMATCH_LOG_PREFIX, verticalCompareTitle } from '~/lib/save-compare/compare-state'
import { useDecisioning } from '~/components/save-compare/DecisioningProvider'
import { SaveButton } from '~/components/save-compare/SaveButton'
import { AddToTripButton } from '~/components/trips/AddToTripButton'
import { useOverlayBehavior } from '~/lib/ui/overlay'
import type { SavedItem, SavedVertical } from '~/types/save-compare/saved-item'

const loggedMismatchKeys = new Set<string>()

export const CompareSheet = component$((props: CompareSheetProps) => {
  const decisioning = useDecisioning()
  const openSignal = useSignal(props.open)
  openSignal.value = props.open
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
        onClick$={decisioning.closeCompare$}
      />

      <section
        ref={overlayRef}
        role="dialog"
        aria-modal="true"
        aria-label={verticalCompareTitle(props.vertical)}
        tabIndex={-1}
        class="absolute inset-0 bg-[color:var(--color-surface)] outline-none"
      >
        <header class="sticky top-0 z-20 border-b border-[color:var(--color-divider)] bg-[color:rgba(255,255,255,0.95)] backdrop-blur">
          <div class="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-4 lg:px-6">
            <div>
              <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">
                {verticalCompareTitle(props.vertical)}
              </h2>
              <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                Side-by-side comparison of the most practical decision fields.
              </p>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                onClick$={() => decisioning.clearComparedItems$(props.vertical)}
                class="rounded-full border border-[color:var(--color-border)] px-3 py-2 text-xs font-semibold text-[color:var(--color-text-muted)]"
              >
                Clear all
              </button>
              <button
                ref={initialFocusRef}
                type="button"
                onClick$={decisioning.closeCompare$}
                class="t-btn-primary px-4 py-2 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </header>

        <div class="mx-auto h-[calc(100vh-81px)] max-w-[1400px] overflow-auto px-4 py-4 lg:px-6">
          <div
            class="grid min-w-max gap-px rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-divider)]"
            style={{ gridTemplateColumns }}
          >
            <div class="sticky left-0 z-10 flex items-end border-r border-[color:var(--color-divider)] bg-[color:var(--color-panel)] px-4 py-4">
              <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
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
                  class="flex h-full flex-col gap-3 bg-[color:var(--color-surface)] px-4 py-4"
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
                    <div class="flex h-28 items-center justify-center rounded-2xl bg-[color:var(--color-neutral-50)] text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                      {props.vertical}
                    </div>
                  )}

                  <div>
                    <h3 class="text-base font-semibold text-[color:var(--color-text-strong)]">
                      {item.title}
                    </h3>
                    {item.subtitle ? (
                      <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                        {item.subtitle}
                      </p>
                    ) : null}
                    {item.price ? (
                      <p class="mt-2 text-sm font-semibold text-[color:var(--color-text-strong)]">
                        {item.price}
                      </p>
                    ) : null}
                  </div>

                  <div class="flex flex-wrap gap-2">
                    <SaveButton
                      saved={shortlisted}
                      idleLabel="Shortlist"
                      activeLabel="Shortlisted"
                      onToggle$={() => decisioning.toggleShortlist$(props.vertical, item)}
                    />
                    <button
                      type="button"
                      onClick$={() => decisioning.removeComparedItem$(props.vertical, item.id)}
                      class="rounded-full border border-[color:var(--color-border)] px-3 py-1 text-xs font-semibold text-[color:var(--color-text-muted)]"
                    >
                      Remove
                    </button>
                  </div>

                  <div class="mt-auto flex flex-wrap gap-2">
                    <a
                      href={item.href}
                      class="rounded-full border border-[color:var(--color-border)] px-3 py-2 text-xs font-semibold text-[color:var(--color-text-strong)]"
                    >
                      View
                    </a>
                    <AddToTripButton item={item} />
                  </div>
                </article>
              )
            })}

            {fields.map((field) => (
              <>
                <div
                  key={`label:${field.key}`}
                  class="sticky left-0 z-10 border-r border-t border-[color:var(--color-divider)] bg-[color:var(--color-panel)] px-4 py-4"
                >
                  <div class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
                    {field.label}
                  </div>
                </div>

                {props.items.map((item) => (
                  <div
                    key={`${field.key}:${item.id}`}
                    class="border-t border-[color:var(--color-divider)] bg-[color:var(--color-surface)] px-4 py-4 text-sm text-[color:var(--color-text)]"
                  >
                    {item.compareData?.[field.key] || <span class="text-[color:var(--color-text-subtle)]">—</span>}
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
