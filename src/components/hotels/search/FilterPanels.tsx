import { component$ } from '@builder.io/qwik'
import type { ActiveFilters, Facets } from '~/types/hotels/search'

export const DatesPanel = component$(({ a }: { a: ActiveFilters }) => (
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

export const PricePanel = component$(({ a }: { a: ActiveFilters }) => (
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

export const StarsPanel = component$(({ a, facets }: { a: ActiveFilters; facets: Facets }) => (
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

export const RefundablePanel = component$(({ a }: { a: ActiveFilters }) => (
  <div class="t-panel p-4">
    <label class="flex items-center gap-2 text-sm text-[color:var(--color-text)]">
      <input type="checkbox" name="refundable" value="1" checked={a.refundableOnly} />
      <span class="font-medium">Free cancellation</span>
    </label>
    <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">Show only refundable options.</div>
  </div>
))

export const AreasPanel = component$(({ a, facets }: { a: ActiveFilters; facets: Facets }) => (
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

export const AmenitiesPanel = component$(({ a, facets }: { a: ActiveFilters; facets: Facets }) => (
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
