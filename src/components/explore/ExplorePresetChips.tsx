import { component$ } from '@builder.io/qwik'
import {
  serializeExploreIntentToCarHref,
  serializeExploreIntentToHotelHref,
} from '~/lib/explore/serialize-search'
import type { ExploreIntent, ExploreTravelStyle } from '~/types/explore/intent'

const withWeekendVariant = (intent: ExploreIntent): ExploreIntent => {
  return {
    ...intent,
    slug: `${intent.slug}-weekend`,
    label: `${intent.label} weekend`,
    dateHints: {
      ...intent.dateHints,
      weekendFriendly: true,
      tripLengthDays: intent.dateHints?.tripLengthDays ?? 3,
    },
  }
}

const addTravelStyle = (styles: ExploreTravelStyle[] | undefined, style: ExploreTravelStyle) => {
  if (!styles || !styles.length) return [style]
  return styles.includes(style) ? styles : [...styles, style]
}

const withLuxuryVariant = (intent: ExploreIntent): ExploreIntent => {
  const currentStars = intent.hotelPresets?.starRatingMin ?? 0

  return {
    ...intent,
    slug: `${intent.slug}-luxury`,
    label: `Luxury ${intent.label}`,
    travelStyle: addTravelStyle(intent.travelStyle, 'luxury'),
    hotelPresets: {
      ...intent.hotelPresets,
      starRatingMin: currentStars > 5 ? currentStars : 5,
      priceTier: 'luxury',
    },
  }
}

export const ExplorePresetChips = component$((props: ExplorePresetChipsProps) => {
  const weekendIntent = withWeekendVariant(props.intent)
  const luxuryIntent = withLuxuryVariant(props.intent)

  const chips: ExplorePresetChip[] = [
    { label: 'Find stays', href: serializeExploreIntentToHotelHref(props.intent), emphasis: 'primary' },
    { label: 'Explore cars', href: serializeExploreIntentToCarHref(props.intent), emphasis: 'secondary' },
    { label: 'Weekend version', href: serializeExploreIntentToHotelHref(weekendIntent), emphasis: 'secondary' },
    { label: 'Luxury version', href: serializeExploreIntentToHotelHref(luxuryIntent), emphasis: 'secondary' },
  ]

  return (
    <section class={props.class}>
      <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-on-hero-muted)]">
        Launch presets
      </p>

      <div class="mt-3 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <a
            key={chip.label}
            href={chip.href}
            class={[
              'inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition',
              chip.emphasis === 'primary'
                ? 'border-white/65 bg-white text-[color:var(--color-text-strong)] hover:bg-white/90'
                : 'border-white/40 bg-white/15 text-[color:var(--color-text-on-hero)] hover:bg-white/25',
            ]}
          >
            {chip.label}
          </a>
        ))}
      </div>
    </section>
  )
})

type ExplorePresetChipsProps = {
  intent: ExploreIntent
  class?: string
}

type ExplorePresetChip = {
  label: string
  href: string
  emphasis: 'primary' | 'secondary'
}
