import { component$, QRL, Slot, useSignal } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'
import type { DocumentHead } from '@builder.io/qwik-city'
import { getOgSecret, encodeOgPayload, signOgPayload } from '~/lib/seo/og-sign'
import { HOTELS } from '~/data/hotels'
import type { Hotel } from '~/data/hotels'
import { Page } from '~/components/site/Page'

export const useSearchHotelsPage = routeLoader$(async ({ params, url }) => {
  const query = normalizeQuery(params.query)
  const page = clampInt(params.pageNumber, 1, 9999)

  const inventory = mapHotelsToResults(HOTELS, query)

  const active = parseActiveFilters(url.searchParams)
  const sort = normalizeSort(url.searchParams.get('sort'))

  const filtered = inventory.filter((h) => {
    if (active.stars.length && !active.stars.includes(h.stars)) return false
    if (active.refundableOnly && !h.refundable) return false
    if (active.neighborhoods.length && !active.neighborhoods.includes(h.neighborhood)) return false
    if (active.amenities.length && !active.amenities.every((a) => h.amenities.includes(a))) return false
    if (active.ratingMin != null && h.rating < active.ratingMin) return false
    if (active.priceMin != null && h.priceFrom < active.priceMin) return false
    if (active.priceMax != null && h.priceFrom > active.priceMax) return false
    return true
  })

  const sorted = filtered.slice().sort((a, b) => {
    if (sort === 'price-asc') return a.priceFrom - b.priceFrom
    if (sort === 'price-desc') return b.priceFrom - a.priceFrom
    if (sort === 'rating-desc') return b.rating - a.rating
    if (sort === 'reviewcount-desc') return b.reviewCount - a.reviewCount
    return b.score - a.score
  })

  const pageSize = 20
  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = clampInt(String(page), 1, totalPages)

  const start = (safePage - 1) * pageSize
  const results = sorted.slice(start, start + pageSize)

  const facets = buildFacets(inventory)

  const price = {
    min: inventory.length ? Math.min(...inventory.map((x) => x.priceFrom)) : null,
    max: inventory.length ? Math.max(...inventory.map((x) => x.priceFrom)) : null,
    currency: 'USD',
  }

  // ✅ OG image computed after safePage exists
  let ogImage = new URL(`/og/search/hotels/${encodeURIComponent(query)}/${safePage}.png`, url.origin).href

  const secret = getOgSecret()
  if (secret) {
    const payload: OgSearchPayload = {
      v: 'hotels',
      q: query,
      page: safePage,
      title: 'Hotels search',
      subtitle: safeTitleQuery(query),
      stats: {
        priceMin: price.min ?? undefined,
        priceMax: price.max ?? undefined,
        currency: price.currency,
        note: 'Compare totals + policies',
      },
    }

    const p = encodeOgPayload(payload)
    const sig = await signOgPayload(p, secret)
    ogImage = `${ogImage}?p=${encodeURIComponent(p)}&sig=${encodeURIComponent(sig)}`
  }

  return {
    query,
    page: safePage,
    qHuman: safeTitleQuery(query),
    results,
    total,
    pageSize,
    totalPages,
    facets,
    active,
    sort,
    price,
    ogImage,
  }
})

export default component$(() => {
  const data = useSearchHotelsPage().value

  const pathBase = `/search/hotels/${encodeURIComponent(data.query)}`
  const page1Action = `${pathBase}/1`
  const pageHref = (p: number) => `${pathBase}/${p}${buildSearchParams(data.active, data.sort)}`

  const nights = computeNights(data.active.checkIn, data.active.checkOut)

  const mobileFiltersOpen = useSignal(false)
  const mobileSortOpen = useSignal(false)

  return (
    <Page>
      {/* Breadcrumbs (no Home yet) */}
      <div class="flex flex-wrap items-center gap-2 text-sm text-[color:var(--color-text-muted)]">
        <a class="hover:text-[color:var(--color-text)]" href="/">
          Andacity Travel
        </a>
        <span class="text-[color:var(--color-text-subtle)]">/</span>
        <a class="hover:text-[color:var(--color-text)]" href="/hotels">Hotels</a>
        <span class="text-[color:var(--color-text-subtle)]">/</span>
        <span class="text-[color:var(--color-text)]">Search</span>
        <span class="text-[color:var(--color-text-subtle)]">/</span>
        <span class="text-[color:var(--color-text)]">{data.qHuman}</span>
      </div>

      {/* Header + sort row */}
      <div class="mt-4 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <h1 class="text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)] lg:text-4xl">
            Hotels in {data.qHuman}
          </h1>

          <p class="mt-2 max-w-[80ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
            Transparent totals, clear policies, and fast filtering. Search result pages are noindex.
          </p>

          <div class="mt-3 flex flex-wrap gap-2">
            <span class="t-badge">{data.total.toLocaleString('en-US')} results</span>
            {data.price.min != null && data.price.max != null ? (
              <span class="t-badge">
                From {formatMoney(data.price.min, data.price.currency)}–{formatMoney(data.price.max, data.price.currency)}
              </span>
            ) : null}
            <span class="t-badge">Hotels search</span>
          </div>
        </div>

        {/* Sort */}
        <form method="get" action={page1Action} class="t-panel hidden items-center gap-2 p-3 lg:flex">
          <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">Sort</label>
          <select
            name="sort"
            class="rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
            value={data.sort}
          >
            <option value="relevance">Relevance</option>
            <option value="price-asc">Price: low → high</option>
            <option value="price-desc">Price: high → low</option>
            <option value="rating-desc">Rating</option>
            <option value="reviewcount-desc">Review count</option>
          </select>

          {serializeHiddenInputs(data.active).map((x) => (
            <input key={`${x.name}:${x.value}`} type="hidden" name={x.name} value={x.value} />
          ))}

          <button class="t-btn-primary" type="submit">Apply</button>
        </form>
      </div>

      {/* Active filter chips */}
      <div class="mt-4 flex flex-wrap gap-2">
        {renderActiveChips(data.active, pathBase, 1, data.sort)}
        {hasAnyFilters(data.active) ? (
          <a
            class="t-badge hover:bg-white"
            href={`${pathBase}/1${buildSearchParams({
              ...data.active,
              stars: [],
              neighborhoods: [],
              amenities: [],
              refundableOnly: false,
              ratingMin: null,
              priceMin: null,
              priceMax: null,
              checkIn: null,
              checkOut: null,
              adults: null,
              rooms: null,
            }, data.sort)}`}
          >
            Clear all
          </a>
        ) : (
          <span class="t-badge">Tip: filter by stars + refundable</span>
        )}
      </div>

      {/* Main grid */}
      <div class="mt-6 grid gap-6 lg:grid-cols-[300px_1fr] lg:items-start">
        {/* Filters sidebar */}
        <aside class="hidden lg:block lg:sticky lg:top-24 lg:self-start">
          <div class="t-card p-5">
            <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">Filters</div>
            <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">
              Filters apply via GET (fast SSR, shareable URLs).
            </div>

            <form method="get" action={page1Action} class="mt-4 grid gap-4">
              <input type="hidden" name="sort" value={data.sort} />

              <DatesPanel a={data.active} />
              <PricePanel a={data.active} />
              <StarsPanel a={data.active} facets={data.facets} />
              <RefundablePanel a={data.active} />
              <AreasPanel a={data.active} facets={data.facets} />
              <AmenitiesPanel a={data.active} facets={data.facets} />

              <button class="t-btn-primary" type="submit">Apply filters</button>

              <div class="text-xs text-[color:var(--color-text-muted)]">
                Search pages stay noindex. City + hotel pages are indexable.
              </div>
            </form>
          </div>
        </aside>

        {/* Results column */}
        <main>
          {/* Map preview */}
          <div class="t-card p-5">
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">Map</div>
                <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                  Map supports decision-making; keep it compact.
                </div>
              </div>
              <span class="t-badge">Preview</span>
            </div>
            <div class="mt-4 h-56 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-neutral-50)]" />
          </div>

          {/* Results list */}
          <section class="mt-6">
            <div class="flex items-center justify-between">
              <div class="text-sm text-[color:var(--color-text-muted)]">
                Showing <span class="font-medium text-[color:var(--color-text)]">{data.results.length}</span> of{' '}
                <span class="font-medium text-[color:var(--color-text)]">{data.total.toLocaleString('en-US')}</span>
              </div>

              <div class="text-sm text-[color:var(--color-text-muted)]">
                Page <span class="font-medium text-[color:var(--color-text)]">{data.page}</span> / {data.totalPages}
              </div>
            </div>

            <div class="mt-4 grid gap-3">
              {data.results.length ? (
                data.results.map((h: HotelResult) => <HotelResultCard key={h.id} h={h} nights={nights} />)
              ) : (
                <div class="t-card p-6">
                  <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">No results</div>
                  <div class="mt-2 text-sm text-[color:var(--color-text-muted)]">
                    Try removing filters or searching a broader area.
                  </div>
                </div>
              )}
            </div>

            {/* Pagination */}
            {data.totalPages > 1 ? (
              <nav class="mt-6 flex flex-wrap items-center gap-2">
                <a class="t-badge hover:bg-white" href={pageHref(Math.max(1, data.page - 1))} aria-disabled={data.page <= 1}>
                  ← Prev
                </a>

                {paginationWindow(data.page, data.totalPages).map((p) => (
                  <a
                    key={p}
                    class={p === data.page ? 't-badge t-badge--deal' : 't-badge hover:bg-white'}
                    href={pageHref(p)}
                  >
                    {p}
                  </a>
                ))}

                <a class="t-badge hover:bg-white" href={pageHref(Math.min(data.totalPages, data.page + 1))} aria-disabled={data.page >= data.totalPages}>
                  Next →
                </a>
              </nav>
            ) : null}
          </section>
        </main>
      </div>

      {/* Mobile sticky bar */}
      <div class="fixed inset-x-0 bottom-0 z-50 border-t border-[color:var(--color-divider)] bg-white/95 backdrop-blur lg:hidden">
        <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div class="min-w-0">
            <div class="truncate text-sm font-semibold text-[color:var(--color-text-strong)]">{data.qHuman}</div>
            <div class="text-xs text-[color:var(--color-text-muted)]">
              {data.total.toLocaleString('en-US')} results
              {nights ? <span> · {nights} nights</span> : null}
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="t-badge hover:bg-white"
              onClick$={() => {
                mobileSortOpen.value = true
                mobileFiltersOpen.value = false
              }}
            >
              Sort
            </button>

            <button
              type="button"
              class="t-btn-primary px-5"
              onClick$={() => {
                mobileFiltersOpen.value = true
                mobileSortOpen.value = false
              }}
            >
              Filters
              {hasAnyFilters(data.active) ? <span class="ml-2 t-badge">•</span> : null}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawers */}
      {mobileFiltersOpen.value ? (
        <MobileDrawer title="Filters" onClose$={() => { mobileFiltersOpen.value = false }}>
          <form method="get" action={page1Action} class="grid gap-4">
            <input type="hidden" name="sort" value={data.sort} />

            <DatesPanel a={data.active} />
            <PricePanel a={data.active} />
            <StarsPanel a={data.active} facets={data.facets} />
            <RefundablePanel a={data.active} />
            <AreasPanel a={data.active} facets={data.facets} />
            <AmenitiesPanel a={data.active} facets={data.facets} />

            <div class="grid grid-cols-2 gap-2">
              <a class="t-badge flex items-center justify-center hover:bg-white" href={`${pathBase}/1?sort=${encodeURIComponent(data.sort)}`}>
                Reset
              </a>
              <button class="t-btn-primary" type="submit">Apply</button>
            </div>

            <div class="text-xs text-[color:var(--color-text-muted)]">
              Applies to page 1 to avoid empty pages.
            </div>
          </form>
        </MobileDrawer>
      ) : null}

      {mobileSortOpen.value ? (
        <MobileDrawer title="Sort" onClose$={() => { mobileSortOpen.value = false }}>
          <form method="get" action={page1Action} class="grid gap-3">
            {serializeHiddenInputs(data.active).map((x) => (
              <input key={`${x.name}:${x.value}`} type="hidden" name={x.name} value={x.value} />
            ))}

            <div class="t-panel p-4">
              <div class="text-xs font-semibold text-[color:var(--color-text-strong)]">Sort by</div>

              <div class="mt-3 grid gap-2">
                {([
                  { v: 'relevance', label: 'Relevance' },
                  { v: 'price-asc', label: 'Price: low → high' },
                  { v: 'price-desc', label: 'Price: high → low' },
                  { v: 'rating-desc', label: 'Rating' },
                  { v: 'reviewcount-desc', label: 'Review count' },
                ] as const).map((o) => (
                  <label key={o.v} class="flex items-center justify-between gap-3 text-sm text-[color:var(--color-text)]">
                    <span class="flex items-center gap-2">
                      <input type="radio" name="sort" value={o.v} checked={data.sort === o.v} />
                      <span>{o.label}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button class="t-btn-primary" type="submit">Apply</button>
          </form>
        </MobileDrawer>
      ) : null}
    </Page>
  )
})

export const head: DocumentHead = ({ resolveValue, url }) => {
  const data = resolveValue(useSearchHotelsPage)

  const title = `Hotels in ${data.qHuman} – Page ${data.page} | Andacity Travel`
  const description = `Browse hotel results for ${data.qHuman}. Compare totals and policies with clarity.`
  const robots = 'noindex,follow,max-image-preview:large'

  const canonicalPath = `/search/hotels/${encodeURIComponent(data.query)}/${data.page}`
  const canonicalHref = new URL(canonicalPath, url.origin).href

  return {
    title,
    meta: [
      { name: 'description', content: description },
      { name: 'robots', content: robots },

      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonicalHref },
      { property: 'og:image', content: data.ogImage },

      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: data.ogImage },
    ],
    links: [{ rel: 'canonical', href: canonicalHref }],
  }
}

/* -----------------------------
   Result card
----------------------------- */

const HotelResultCard = component$(({ h, nights }: HotelResultCardProps) => {
  const total = nights ? h.priceFrom * nights : null

  return (
    <a class="t-card block overflow-hidden hover:bg-white" href={`/hotels/${encodeURIComponent(h.slug)}`}>
      <div class="grid gap-0 lg:grid-cols-[220px_1fr]">
        <div class="bg-[color:var(--color-neutral-50)]">
          <img class="h-44 w-full object-cover lg:h-full" src={h.image} alt={h.name} loading="lazy" />
        </div>

        <div class="p-5">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="text-base font-semibold text-[color:var(--color-text-strong)]">{h.name}</div>
              <div class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                {h.neighborhood} · {h.stars}★ · {h.rating.toFixed(1)} ★ ({h.reviewCount.toLocaleString('en-US')})
              </div>

              <div class="mt-3 flex flex-wrap gap-2">
                {h.refundable ? (
                  <span class="t-badge t-badge--deal">Free cancellation</span>
                ) : (
                  <span class="t-badge">Non-refundable</span>
                )}
                {h.badges.slice(0, 2).map((b) => (
                  <span key={b} class="t-badge">{b}</span>
                ))}
              </div>

              <div class="mt-4 text-sm text-[color:var(--color-text-muted)]">
                <span class="font-medium text-[color:var(--color-text)]">Top amenities:</span> {h.amenities.slice(0, 4).join(' · ')}
              </div>
            </div>

            <div class="text-right">
              <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                From {formatMoney(h.priceFrom, h.currency)}
                <span class="ml-1 text-xs font-normal text-[color:var(--color-text-muted)]">/night</span>
              </div>

              {total != null ? (
                <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                  Est. total:{' '}
                  <span class="font-medium text-[color:var(--color-text)]">{formatMoney(total, h.currency)}</span>
                  <span class="ml-1">({nights} nights)</span>
                </div>
              ) : (
                <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">Add dates to see totals</div>
              )}

              <div class="mt-4">
                <span class="t-btn-primary inline-block px-5 text-center">View →</span>
              </div>
            </div>
          </div>

          <div class="mt-4 border-t border-[color:var(--color-divider)] pt-4 text-xs text-[color:var(--color-text-muted)]">
            Score: {h.score.toFixed(2)} · Balanced for price, rating, location, cancellation
          </div>
        </div>
      </div>
    </a>
  )
})

/* -----------------------------
   Mobile drawer + shared panels
----------------------------- */

export const MobileDrawer = component$(({ title, onClose$ }: MobileDrawerProps) => (
  <div class="fixed inset-0 z-[60] lg:hidden">
    <button type="button" aria-label="Close" class="absolute inset-0 bg-black/30" onClick$={onClose$} />

    <div class="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-hidden rounded-t-3xl border border-[color:var(--color-border)] bg-white shadow-[var(--shadow-e3)]">
      <div class="flex items-center justify-between gap-3 border-b border-[color:var(--color-divider)] px-4 py-4">
        <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">{title}</div>
        <button type="button" class="t-badge hover:bg-white" onClick$={onClose$}>
          Close
        </button>
      </div>

      <div class="max-h-[calc(85vh-64px)] overflow-auto px-4 py-4">
        <Slot />
      </div>
    </div>
  </div>
))

const DatesPanel = component$(({ a }: { a: ActiveFilters }) => (
  <div class="t-panel p-4">
    <div class="text-xs font-semibold text-[color:var(--color-text-strong)]">Dates</div>

    <div class="mt-3 grid grid-cols-2 gap-2">
      <div>
        <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">Check-in</label>
        <input
          name="checkIn"
          class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
          placeholder="YYYY-MM-DD"
          value={a.checkIn || ''}
        />
      </div>
      <div>
        <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">Check-out</label>
        <input
          name="checkOut"
          class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
          placeholder="YYYY-MM-DD"
          value={a.checkOut || ''}
        />
      </div>
    </div>

    <div class="mt-3 grid grid-cols-2 gap-2">
      <div>
        <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">Adults</label>
        <input
          name="adults"
          class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
          placeholder="2"
          value={a.adults != null ? String(a.adults) : ''}
        />
      </div>
      <div>
        <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">Rooms</label>
        <input
          name="rooms"
          class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
          placeholder="1"
          value={a.rooms != null ? String(a.rooms) : ''}
        />
      </div>
    </div>
  </div>
))

const PricePanel = component$(({ a }: { a: ActiveFilters }) => (
  <div class="t-panel p-4">
    <div class="text-xs font-semibold text-[color:var(--color-text-strong)]">Price (nightly)</div>
    <div class="mt-3 grid grid-cols-2 gap-2">
      <div>
        <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">Min</label>
        <input
          name="minPrice"
          class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
          placeholder="0"
          value={a.priceMin != null ? String(a.priceMin) : ''}
        />
      </div>
      <div>
        <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">Max</label>
        <input
          name="maxPrice"
          class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
          placeholder="999"
          value={a.priceMax != null ? String(a.priceMax) : ''}
        />
      </div>
    </div>
  </div>
))

const StarsPanel = component$(({ a, facets }: { a: ActiveFilters; facets: Facets }) => (
  <div class="t-panel p-4">
    <div class="text-xs font-semibold text-[color:var(--color-text-strong)]">Stars</div>
    <div class="mt-2 grid grid-cols-2 gap-2">
      {([5, 4, 3, 2] as const).map((s) => (
        <label key={s} class="flex items-center gap-2 text-sm text-[color:var(--color-text)]">
          <input type="checkbox" name="stars" value={String(s)} checked={a.stars.includes(s)} />
          <span>{s}★</span>
          <span class="text-xs text-[color:var(--color-text-muted)]">({facets.stars[String(s)] || 0})</span>
        </label>
      ))}
    </div>
  </div>
))

const RefundablePanel = component$(({ a }: { a: ActiveFilters }) => (
  <div class="t-panel p-4">
    <label class="flex items-center gap-2 text-sm text-[color:var(--color-text)]">
      <input type="checkbox" name="refundable" value="1" checked={a.refundableOnly} />
      <span class="font-medium">Free cancellation</span>
    </label>
    <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">Show only refundable options.</div>
  </div>
))

const AreasPanel = component$(({ a, facets }: { a: ActiveFilters; facets: Facets }) => (
  <div class="t-panel p-4">
    <div class="text-xs font-semibold text-[color:var(--color-text-strong)]">Areas</div>
    <div class="mt-2 grid gap-2">
      {facets.neighborhoods.map((n) => (
        <label key={n.name} class="flex items-center justify-between gap-3 text-sm text-[color:var(--color-text)]">
          <span class="flex items-center gap-2">
            <input type="checkbox" name="area" value={n.name} checked={a.neighborhoods.includes(n.name)} />
            <span>{n.name}</span>
          </span>
          <span class="text-xs text-[color:var(--color-text-muted)]">{n.count}</span>
        </label>
      ))}
    </div>
  </div>
))

const AmenitiesPanel = component$(({ a, facets }: { a: ActiveFilters; facets: Facets }) => (
  <div class="t-panel p-4">
    <div class="text-xs font-semibold text-[color:var(--color-text-strong)]">Amenities</div>
    <div class="mt-2 grid gap-2">
      {facets.amenities.map((x) => (
        <label key={x.name} class="flex items-center justify-between gap-3 text-sm text-[color:var(--color-text)]">
          <span class="flex items-center gap-2">
            <input type="checkbox" name="amenity" value={x.name} checked={a.amenities.includes(x.name)} />
            <span>{x.name}</span>
          </span>
          <span class="text-xs text-[color:var(--color-text-muted)]">{x.count}</span>
        </label>
      ))}
    </div>
  </div>
))

/* -----------------------------
   Filter + URL helpers
----------------------------- */

const parseActiveFilters = (sp: URLSearchParams): ActiveFilters => {
  const stars = sp
    .getAll('stars')
    .map((x) => Number.parseInt(x, 10))
    .filter((n) => [2, 3, 4, 5].includes(n))

  const neighborhoods = sp.getAll('area').map((x) => x.trim()).filter(Boolean)
  const amenities = sp.getAll('amenity').map((x) => x.trim()).filter(Boolean)

  const refundableOnly = sp.get('refundable') === '1'

  const ratingMin = toFloatOrNull(sp.get('ratingMin'))
  const priceMin = toIntOrNull(sp.get('minPrice'))
  const priceMax = toIntOrNull(sp.get('maxPrice'))

  // Date + party
  const checkIn = normalizeIsoDate(sp.get('checkIn'))
  const checkOut = normalizeIsoDate(sp.get('checkOut'))
  const adults = clampMaybeInt(sp.get('adults'), 1, 10)
  const rooms = clampMaybeInt(sp.get('rooms'), 1, 6)

  return {
    stars,
    neighborhoods,
    amenities,
    refundableOnly,
    ratingMin,
    priceMin,
    priceMax,
    checkIn,
    checkOut,
    adults,
    rooms,
  }
}

const hasAnyFilters = (a: ActiveFilters) =>
  Boolean(
    a.stars.length ||
    a.neighborhoods.length ||
    a.amenities.length ||
    a.refundableOnly ||
    a.ratingMin != null ||
    a.priceMin != null ||
    a.priceMax != null ||
    a.checkIn ||
    a.checkOut ||
    a.adults != null ||
    a.rooms != null
  )

const buildSearchParams = (a: ActiveFilters, sort: SortKey) => {
  const sp = new URLSearchParams()
  if (sort && sort !== 'relevance') sp.set('sort', sort)

  for (const s of a.stars) sp.append('stars', String(s))
  for (const n of a.neighborhoods) sp.append('area', n)
  for (const x of a.amenities) sp.append('amenity', x)

  if (a.refundableOnly) sp.set('refundable', '1')
  if (a.ratingMin != null) sp.set('ratingMin', String(a.ratingMin))
  if (a.priceMin != null) sp.set('minPrice', String(a.priceMin))
  if (a.priceMax != null) sp.set('maxPrice', String(a.priceMax))

  if (a.checkIn) sp.set('checkIn', a.checkIn)
  if (a.checkOut) sp.set('checkOut', a.checkOut)
  if (a.adults != null) sp.set('adults', String(a.adults))
  if (a.rooms != null) sp.set('rooms', String(a.rooms))

  const qs = sp.toString()
  return qs ? `?${qs}` : ''
}

const serializeHiddenInputs = (a: ActiveFilters) => {
  const inputs: { name: string; value: string }[] = []

  for (const s of a.stars) inputs.push({ name: 'stars', value: String(s) })
  for (const n of a.neighborhoods) inputs.push({ name: 'area', value: n })
  for (const x of a.amenities) inputs.push({ name: 'amenity', value: x })

  if (a.refundableOnly) inputs.push({ name: 'refundable', value: '1' })
  if (a.ratingMin != null) inputs.push({ name: 'ratingMin', value: String(a.ratingMin) })
  if (a.priceMin != null) inputs.push({ name: 'minPrice', value: String(a.priceMin) })
  if (a.priceMax != null) inputs.push({ name: 'maxPrice', value: String(a.priceMax) })

  if (a.checkIn) inputs.push({ name: 'checkIn', value: a.checkIn })
  if (a.checkOut) inputs.push({ name: 'checkOut', value: a.checkOut })
  if (a.adults != null) inputs.push({ name: 'adults', value: String(a.adults) })
  if (a.rooms != null) inputs.push({ name: 'rooms', value: String(a.rooms) })

  return inputs
}

const renderActiveChips = (a: ActiveFilters, pathBase: string, _page: number, sort: SortKey) => {
  const chips: { label: string; href: string }[] = []
  const base = `${pathBase}/1`
  const makeHref = (next: ActiveFilters) => `${base}${buildSearchParams(next, sort)}`

  for (const s of a.stars) {
    const next = { ...a, stars: a.stars.filter((x) => x !== s) }
    chips.push({ label: `${s}★`, href: makeHref(next) })
  }

  for (const n of a.neighborhoods) {
    const next = { ...a, neighborhoods: a.neighborhoods.filter((x) => x !== n) }
    chips.push({ label: n, href: makeHref(next) })
  }

  for (const x of a.amenities) {
    const next = { ...a, amenities: a.amenities.filter((y) => y !== x) }
    chips.push({ label: x, href: makeHref(next) })
  }

  if (a.refundableOnly) {
    const next = { ...a, refundableOnly: false }
    chips.push({ label: 'Free cancellation', href: makeHref(next) })
  }

  if (a.priceMin != null) {
    const next = { ...a, priceMin: null }
    chips.push({ label: `Min $${a.priceMin}`, href: makeHref(next) })
  }

  if (a.priceMax != null) {
    const next = { ...a, priceMax: null }
    chips.push({ label: `Max $${a.priceMax}`, href: makeHref(next) })
  }

  if (a.checkIn) {
    const next = { ...a, checkIn: null }
    chips.push({ label: `Check-in ${a.checkIn}`, href: makeHref(next) })
  }

  if (a.checkOut) {
    const next = { ...a, checkOut: null }
    chips.push({ label: `Check-out ${a.checkOut}`, href: makeHref(next) })
  }

  if (a.adults != null) {
    const next = { ...a, adults: null }
    chips.push({ label: `${a.adults} adults`, href: makeHref(next) })
  }

  if (a.rooms != null) {
    const next = { ...a, rooms: null }
    chips.push({ label: `${a.rooms} rooms`, href: makeHref(next) })
  }

  return chips.map((c) => (
    <a key={c.label} class="t-badge hover:bg-white" href={c.href}>
      {c.label} <span class="ml-1 text-[color:var(--color-text-muted)]">×</span>
    </a>
  ))
}

/* -----------------------------
   Facets etc.
----------------------------- */

const buildFacets = (items: HotelResult[]) => {
  const stars: Record<string, number> = {}
  const neighborhoods: Record<string, number> = {}
  const amenities: Record<string, number> = {}

  for (const h of items) {
    stars[String(h.stars)] = (stars[String(h.stars)] || 0) + 1
    neighborhoods[h.neighborhood] = (neighborhoods[h.neighborhood] || 0) + 1
    for (const a of h.amenities) {
      amenities[a] = (amenities[a] || 0) + 1
    }
  }

  return {
    stars,
    neighborhoods: Object.entries(neighborhoods)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    amenities: Object.entries(amenities)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
  }
}

const mapHotelsToResults = (hotels: Hotel[], query: string): HotelResult[] => {
  const q = String(query || '').toLowerCase()

  return hotels.map((h, i) => {
    const score =
      (h.rating * 0.55) +
      (h.stars * 0.18) +
      (h.policies.freeCancellation ? 0.25 : 0) +
      (Math.max(0, 240 - h.fromNightly) / 240) * 0.4

    return {
      id: `hotel-${h.slug}-${i}`,
      slug: h.slug,
      name: h.name,
      neighborhood: h.neighborhood,
      stars: h.stars,
      rating: h.rating,
      reviewCount: h.reviewCount,
      priceFrom: h.fromNightly,
      currency: h.currency,
      refundable: h.policies.freeCancellation,
      amenities: h.amenities.slice(0, 6),
      image: h.images[0] || '/img/demo/hotel-1.jpg',
      badges: [
        h.stars >= 4 ? 'Top rated' : 'Best value',
        h.policies.payLater ? 'Pay later' : 'Deal',
        q && h.cityQuery.includes(q) ? 'Great match' : 'Popular',
      ].slice(0, 3),
      score,
    }
  })
}

/* -----------------------------
   General helpers
----------------------------- */

const normalizeQuery = (raw: string | undefined) => {
  const q = String(raw || '').trim()
  return q.length ? q : 'anywhere'
}

const clampInt = (raw: string | undefined, min: number, max: number) => {
  const n = Number.parseInt(String(raw || ''), 10)
  if (!Number.isFinite(n)) return min
  if (n < min) return min
  if (n > max) return max
  return n
}

const safeTitleQuery = (q: string) => {
  try {
    const decoded = decodeURIComponent(q)
    return decoded.replaceAll(/\s+/g, ' ').trim()
  } catch {
    return q
  }
}

const normalizeSort = (raw: string | null): SortKey => {
  const s = String(raw || '').toLowerCase()
  if (s === 'price-asc' || s === 'price-desc' || s === 'rating-desc' || s === 'reviewcount-desc') return s
  return 'relevance'
}

const paginationWindow = (page: number, total: number) => {
  const out: number[] = []
  const start = Math.max(1, page - 2)
  const end = Math.min(total, page + 2)
  for (let i = start; i <= end; i++) out.push(i)
  return out
}

const formatMoney = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `${Math.round(amount)} ${currency}`
  }
}

const normalizeIsoDate = (raw: string | null) => {
  if (!raw) return null
  const s = String(raw).trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  return s
}

const computeNights = (checkIn: string | null, checkOut: string | null) => {
  if (!checkIn || !checkOut) return null
  const a = Date.parse(checkIn)
  const b = Date.parse(checkOut)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null
  const diff = Math.round((b - a) / (1000 * 60 * 60 * 24))
  if (diff <= 0) return null
  return Math.min(diff, 30)
}

const toFloatOrNull = (raw: string | null) => {
  if (!raw) return null
  const n = Number.parseFloat(raw)
  if (!Number.isFinite(n)) return null
  return n
}

const clampMaybeInt = (raw: string | null, min: number, max: number) => {
  if (!raw) return null
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n)) return null
  if (n < min) return min
  if (n > max) return max
  return n
}

const toIntOrNull = (raw: string | null) => {
  if (raw == null) return null
  const n = Number.parseInt(String(raw), 10)
  if (!Number.isFinite(n)) return null
  return n
}

/* -----------------------------
   Types
----------------------------- */

type SortKey = 'relevance' | 'price-asc' | 'price-desc' | 'rating-desc' | 'reviewcount-desc'

type ActiveFilters = {
  stars: number[]
  neighborhoods: string[]
  amenities: string[]
  refundableOnly: boolean
  ratingMin: number | null
  priceMin: number | null
  priceMax: number | null

  checkIn: string | null
  checkOut: string | null
  adults: number | null
  rooms: number | null
}

type HotelResult = {
  id: string
  slug: string
  name: string
  neighborhood: string
  stars: 2 | 3 | 4 | 5
  rating: number
  reviewCount: number
  priceFrom: number
  currency: string
  refundable: boolean
  amenities: string[]
  image: string
  badges: string[]
  score: number
}

type HotelResultCardProps = {
  h: HotelResult
  nights: number | null
}

type MobileDrawerProps = {
  title: string
  onClose$: QRL<() => void>
}

type Facets = {
  stars: Record<string, number>
  neighborhoods: { name: string; count: number }[]
  amenities: { name: string; count: number }[]
}

type OgSearchPayload = {
  v: 'hotels'
  q: string
  page: number
  title?: string
  subtitle?: string
  stats?: {
    priceMin?: number
    priceMax?: number
    currency?: string
    topArea?: string
    note?: string
  }
}
