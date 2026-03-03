import { component$ } from '@builder.io/qwik'

export const BookingCta = component$(() => (
  <div class="t-card p-4">
    <div class="flex items-baseline justify-between">
      <div class="text-[color:var(--color-text-strong)] text-lg font-semibold">
        $219 <span class="text-[color:var(--color-text-muted)] text-sm">/night</span>
      </div>
      <span class="t-badge t-badge--deal">Free cancellation</span>
    </div>

    <button class="t-btn-primary mt-4 w-full">
      Reserve
    </button>

    <p class="mt-2 text-sm text-[color:var(--color-text-muted)]">
      Total shown includes estimated taxes and fees.
    </p>
  </div>
))
