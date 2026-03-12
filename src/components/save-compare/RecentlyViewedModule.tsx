import { component$ } from '@builder.io/qwik'
import { CompareButton } from '~/components/save-compare/CompareButton'
import {
  isCompared,
  isShortlisted,
  useDecisioning,
} from '~/components/save-compare/DecisioningProvider'
import { SaveButton } from '~/components/save-compare/SaveButton'
import type { SavedVertical } from '~/types/save-compare/saved-item'

export const RecentlyViewedModule = component$((props: RecentlyViewedModuleProps) => {
  const decisioning = useDecisioning()
  if (!decisioning.state.ready) return null

  const excludeIds = new Set(props.excludeIds || [])
  const items = decisioning.state.recentlyViewed[props.vertical]
    .filter((item) => !excludeIds.has(item.id))
    .slice(0, props.limit || 3)

  if (!items.length) return null

  return (
    <section class={['t-card p-5', props.class]}>
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 class="text-base font-semibold text-[color:var(--color-text-strong)]">
            {props.title || 'Recently viewed'}
          </h2>
          <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
            Jump back to options you already inspected.
          </p>
        </div>
      </div>

      <div class="mt-4 grid gap-3 lg:grid-cols-3">
        {items.map((item) => {
          const shortlisted = isShortlisted(decisioning.state, props.vertical, item.id)
          const compared = isCompared(decisioning.state, props.vertical, item.id)
          const compareDisabled =
            !compared &&
            decisioning.state.compare[props.vertical].length >= decisioning.state.compareLimit

          return (
            <article
              key={item.id}
              class="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-panel)] p-4"
            >
              <div class="flex items-start gap-3">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    width={144}
                    height={112}
                    class="h-24 w-24 rounded-2xl object-cover"
                    loading="lazy"
                  />
                ) : null}

                <div class="min-w-0 flex-1">
                  <a
                    href={item.href}
                    class="text-sm font-semibold text-[color:var(--color-text-strong)] hover:text-[color:var(--color-action)]"
                  >
                    {item.title}
                  </a>
                  {item.subtitle ? (
                    <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                      {item.subtitle}
                    </p>
                  ) : null}
                  {item.price ? (
                    <p class="mt-2 text-sm font-semibold text-[color:var(--color-text-strong)]">
                      {item.price}
                    </p>
                  ) : null}
                  {item.meta?.length ? (
                    <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                      {item.meta.slice(0, 2).join(' · ')}
                    </p>
                  ) : null}
                </div>
              </div>

              <div class="mt-4 flex flex-wrap gap-2">
                <SaveButton
                  saved={shortlisted}
                  idleLabel="Shortlist"
                  activeLabel="Shortlisted"
                  telemetry={{
                    vertical: props.vertical,
                    itemId: item.id,
                    surface: 'recently_viewed',
                  }}
                  onToggle$={() => decisioning.toggleShortlist$(props.vertical, item)}
                />
                <CompareButton
                  selected={compared}
                  disabled={compareDisabled}
                  telemetry={{
                    vertical: props.vertical,
                    itemId: item.id,
                    surface: 'recently_viewed',
                  }}
                  onToggle$={() => decisioning.toggleCompare$(props.vertical, item)}
                />
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
})

type RecentlyViewedModuleProps = {
  vertical: SavedVertical
  excludeIds?: string[]
  title?: string
  class?: string
  limit?: number
}
