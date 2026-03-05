import { component$, useSignal } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'
import type { DocumentHead } from '@builder.io/qwik-city'
import { getOgSecret, encodeOgPayload, signOgPayload } from '~/lib/seo/og-sign'
import { HOTELS } from '~/data/hotels'
import type { Hotel } from '~/data/hotels'
import { Page } from '~/components/site/Page'
import { HotelResultCard } from '~/components/hotels/search/HotelResultCard'
import { MobileDrawer } from '~/components/hotels/search/MobileDrawer'
import {
  DatesPanel,
  PricePanel,
  StarsPanel,
  RefundablePanel,
  AreasPanel,
  AmenitiesPanel,
} from '~/components/hotels/search/FilterPanels'
import type { HotelResult, OgSearchPayload } from '~/types/hotels/search'
import { Breadcrumbs } from '~/components/site/Breadcrumbs'
import { buildFacets } from '~/lib/search/hotels/facets'
import {
  buildSearchParams,
  hasAnyFilters,
  parseActiveFilters,
  renderActiveChips,
  serializeHiddenInputs,
} from '~/lib/search/hotels/filters'
import { computeNights } from '~/lib/search/hotels/dates'
import { mapHotelsToResults } from '~/lib/search/hotels/mapHotelsToResults'
import { clampInt, normalizeQuery, normalizeSort, safeTitleQuery } from '~/lib/search/hotels/normalize'
import { paginationWindow } from '~/lib/search/hotels/pagination'
import { formatMoney } from '~/lib/formatMoney'
import { SearchMapCard } from '~/components/search/SearchMapCard'
import { SearchPagination } from '~/components/search/SearchPagination'
import { SearchResultsSummary } from '~/components/search/SearchResultsSummary'
import { SearchMobileActionBar } from '~/components/search/SearchMobileActionBar'
import { SearchHeaderBar } from '~/components/search/SearchHeaderBar'
import { SearchFiltersCard } from '~/components/search/SearchFiltersCard'
import { SearchMobileDrawerActions } from '~/components/search/SearchMobileDrawerActions'

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
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Andacity Travel', href: '/' },
          { label: 'Hotels', href: '/hotels' },
          { label: 'Search', href: '/search/hotels' },
          { label: data.qHuman, href: pageHref(data.page) },
        ]}
      />

      {/* Header + sort row */}
      <SearchHeaderBar
        title={`Hotels in ${data.qHuman}`}
        description="Transparent totals, clear policies, and fast filtering. Search result pages are noindex."
      >
        <span q:slot="badges" class="t-badge">
          {data.total.toLocaleString('en-US')} results
        </span>

        {data.price.min != null && data.price.max != null ? (
          <span q:slot="badges" class="t-badge">
            From {formatMoney(data.price.min, data.price.currency)}–{formatMoney(data.price.max, data.price.currency)}
          </span>
        ) : null}

        <span q:slot="badges" class="t-badge">
          Hotels search
        </span>

        <form method="get" action={page1Action} class="t-panel flex items-center gap-2 p-3" q:slot="sort">
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

          <button class="t-btn-primary" type="submit">
            Apply
          </button>
        </form>
      </SearchHeaderBar>

      {/* Active filter chips */}
      <div class="mt-4 flex flex-wrap gap-2">
        {renderActiveChips(data.active, pathBase, data.sort)}
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
        <SearchFiltersCard
          title="Filters"
          description="Filters apply via GET (fast SSR, shareable URLs)."
          action={page1Action}
          sortValue={data.sort}
          footerNote="Search pages stay noindex. City + hotel pages are indexable."
        >
          <DatesPanel a={data.active} />
          <PricePanel a={data.active} />
          <StarsPanel a={data.active} facets={data.facets} />
          <RefundablePanel a={data.active} />
          <AreasPanel a={data.active} facets={data.facets} />
          <AmenitiesPanel a={data.active} facets={data.facets} />

          <button class="t-btn-primary" type="submit">
            Apply filters
          </button>
        </SearchFiltersCard>

        {/* Results column */}
        <main>
          {/* Map preview */}
          <SearchMapCard />

          {/* Results list */}
          <section class="mt-6">
            <SearchResultsSummary
              shown={data.results.length}
              total={data.total}
              page={data.page}
              totalPages={data.totalPages}
            />

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
              <SearchPagination
                page={data.page}
                totalPages={data.totalPages}
                pages={paginationWindow(data.page, data.totalPages)}
                pageHref={pageHref}
              />
            ) : null}
          </section>
        </main>
      </div>

      {/* Mobile sticky bar */}
      <SearchMobileActionBar
        title={data.qHuman}
        total={data.total}
        meta={nights ? `${nights} nights` : null}
        hasActiveFilters={hasAnyFilters(data.active)}
        onSortOpen$={() => {
          mobileSortOpen.value = true
          mobileFiltersOpen.value = false
        }}
        onFiltersOpen$={() => {
          mobileFiltersOpen.value = true
          mobileSortOpen.value = false
        }}
      />

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

            <SearchMobileDrawerActions resetHref={`${pathBase}/1?sort=${encodeURIComponent(data.sort)}`} />
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
