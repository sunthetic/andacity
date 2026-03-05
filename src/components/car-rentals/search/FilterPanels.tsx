import { component$ } from '@builder.io/qwik'
import type { ActiveFilters, Facets } from '~/types/car-rentals/search'

export const DatesPanel = component$(({ a }: { a: ActiveFilters }) => (
  <div class="t-panel p-4">
    <div class="text-xs font-semibold text-[color:var(--color-text-strong)]">Dates</div>

    <div class="mt-3 grid grid-cols-2 gap-2">
      <div>
        <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">Pickup</label>
        <input
          name="pickupDate"
          class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
          placeholder="YYYY-MM-DD"
          value={a.pickupDate || ''}
        />
      </div>
      <div>
        <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">Dropoff</label>
        <input
          name="dropoffDate"
          class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
          placeholder="YYYY-MM-DD"
          value={a.dropoffDate || ''}
        />
      </div>
    </div>

    <div class="mt-3">
      <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">Drivers</label>
      <input
        name="drivers"
        class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
        placeholder="1"
        value={a.drivers != null ? String(a.drivers) : ''}
      />
    </div>
  </div>
))

export const PricePanel = component$(({ a }: { a: ActiveFilters }) => (
  <div class="t-panel p-4">
    <div class="text-xs font-semibold text-[color:var(--color-text-strong)]">Price (daily)</div>
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

export const CategoryPanel = component$(({ a, facets }: { a: ActiveFilters; facets: Facets }) => (
  <div class="t-panel p-4">
    <div class="text-xs font-semibold text-[color:var(--color-text-strong)]">Category</div>
    <div class="mt-2 grid gap-2">
      {facets.categories.map((x) => (
        <label key={x.name} class="flex items-center justify-between gap-3 text-sm text-[color:var(--color-text)]">
          <span class="flex items-center gap-2">
            <input type="checkbox" name="category" value={x.name} checked={a.categories.includes(x.name)} />
            <span>{x.name}</span>
          </span>
          <span class="text-xs text-[color:var(--color-text-muted)]">{x.count}</span>
        </label>
      ))}
    </div>
  </div>
))

export const TransmissionPanel = component$(({ a, facets }: { a: ActiveFilters; facets: Facets }) => (
  <div class="t-panel p-4">
    <div class="text-xs font-semibold text-[color:var(--color-text-strong)]">Transmission</div>
    <div class="mt-2 grid gap-2">
      {facets.transmissions.map((x) => (
        <label key={x.name} class="flex items-center justify-between gap-3 text-sm text-[color:var(--color-text)]">
          <span class="flex items-center gap-2">
            <input type="checkbox" name="transmission" value={x.name} checked={a.transmissions.includes(x.name)} />
            <span>{x.name}</span>
          </span>
          <span class="text-xs text-[color:var(--color-text-muted)]">{x.count}</span>
        </label>
      ))}
    </div>
  </div>
))

export const SeatsPanel = component$(({ a, facets }: { a: ActiveFilters; facets: Facets }) => (
  <div class="t-panel p-4">
    <div class="text-xs font-semibold text-[color:var(--color-text-strong)]">Seats</div>
    <div class="mt-2 grid gap-2">
      {facets.seats.map((x) => (
        <label key={x.name} class="flex items-center justify-between gap-3 text-sm text-[color:var(--color-text)]">
          <span class="flex items-center gap-2">
            <input type="checkbox" name="seats" value={x.name} checked={a.seats.includes(Number.parseInt(x.name, 10))} />
            <span>{x.name}</span>
          </span>
          <span class="text-xs text-[color:var(--color-text-muted)]">{x.count}</span>
        </label>
      ))}
    </div>
  </div>
))

export const PolicyPanel = component$(({ a }: { a: ActiveFilters }) => (
  <div class="t-panel p-4">
    <div class="text-xs font-semibold text-[color:var(--color-text-strong)]">Policies</div>

    <label class="mt-3 flex items-center gap-2 text-sm text-[color:var(--color-text)]">
      <input type="checkbox" name="freeCancel" value="1" checked={a.freeCancellationOnly} />
      <span class="font-medium">Free cancellation</span>
    </label>

    <label class="mt-3 flex items-center gap-2 text-sm text-[color:var(--color-text)]">
      <input type="checkbox" name="payAtCounter" value="1" checked={a.payAtCounterOnly} />
      <span class="font-medium">Pay at counter</span>
    </label>

    <div class="mt-2 text-xs text-[color:var(--color-text-muted)]">Keep it simple: the big 2 decisions.</div>
  </div>
))

export const InclusionsPanel = component$(({ a, facets }: { a: ActiveFilters; facets: Facets }) => (
  <div class="t-panel p-4">
    <div class="text-xs font-semibold text-[color:var(--color-text-strong)]">Inclusions</div>
    <div class="mt-2 grid gap-2">
      {facets.inclusions.map((x) => (
        <label key={x.name} class="flex items-center justify-between gap-3 text-sm text-[color:var(--color-text)]">
          <span class="flex items-center gap-2">
            <input type="checkbox" name="include" value={x.name} checked={a.inclusions.includes(x.name)} />
            <span>{x.name}</span>
          </span>
          <span class="text-xs text-[color:var(--color-text-muted)]">{x.count}</span>
        </label>
      ))}
    </div>
  </div>
))
