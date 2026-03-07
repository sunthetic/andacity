import { component$ } from "@builder.io/qwik"
import type { CarRental } from "~/data/car-rentals"
import type { Hotel } from "~/data/hotels"
import { formatMoney } from "~/lib/formatMoney"

export const ListingCardGrid = component$((props: ListingCardGridProps) => {
  const { items, variant } = props
  const density = props.density || "default"

  return (
    <div class={density === "compact" ? "mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" : "mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"}>
      {variant === "hotels"
        ? (items as Hotel[]).map((h) =>
          density === "compact" ? (
            <HotelCardCompact key={h.slug} hotel={h} />
          ) : (
            <HotelCardDefault key={h.slug} hotel={h} />
          ),
        )
        : (items as CarRental[]).map((c) => <CarRentalCardDefault key={c.slug} rental={c} />)}
    </div>
  )
})

const HotelCardDefault = component$(({ hotel }: { hotel: Hotel }) => (
  <a class="t-card block overflow-hidden hover:bg-white" href={buildHotelDetailHref(hotel.slug)}>
    <div class="bg-[color:var(--color-neutral-50)]">
      <img
        class="h-40 w-full object-cover"
        src={hotel.images[0] || "/img/demo/hotel-1.jpg"}
        alt={hotel.name}
        loading="lazy"
        width={640}
        height={320}
      />
    </div>

    <div class="p-5">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">{hotel.name}</div>
          <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">
            {hotel.city} · {hotel.neighborhood} · {hotel.stars}★
          </div>
        </div>

        <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
          From {formatMoney(hotel.fromNightly, hotel.currency)}
          <span class="ml-1 text-[color:var(--color-text-muted)]">/night</span>
        </div>
      </div>

      <div class="mt-3 flex flex-wrap gap-2">
        <span class="t-badge">
          {hotel.rating.toFixed(1)} ★{" "}
          <span class="text-[color:var(--color-text-muted)]">({hotel.reviewCount.toLocaleString("en-US")})</span>
        </span>

        {hotel.policies.freeCancellation ? (
          <span class="t-badge t-badge--deal">Free cancellation</span>
        ) : (
          <span class="t-badge">Cancellation varies</span>
        )}

        {hotel.policies.payLater ? (
          <span class="t-badge t-badge--deal">Pay later</span>
        ) : (
          <span class="t-badge">Prepay</span>
        )}
      </div>

      <div class="mt-3 text-xs text-[color:var(--color-text-muted)]">
        Top amenities:{" "}
        <span class="text-[color:var(--color-text)]">{hotel.amenities.slice(0, 4).join(" · ")}</span>
      </div>

      <div class="mt-4 text-sm text-[color:var(--color-action)]">View hotel →</div>
    </div>
  </a>
))

const HotelCardCompact = component$(({ hotel }: { hotel: Hotel }) => (
  <a class="t-card block overflow-hidden hover:bg-white" href={buildHotelDetailHref(hotel.slug)}>
    <div class="bg-[color:var(--color-neutral-50)]">
      <img
        class="h-36 w-full object-cover"
        src={hotel.images[0] || "/img/demo/hotel-1.jpg"}
        alt={hotel.name}
        loading="lazy"
        width={640}
        height={288}
      />
    </div>

    <div class="p-4">
      <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">{hotel.name}</div>
      <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">
        {hotel.neighborhood} · {hotel.stars}★ · {hotel.rating.toFixed(1)} ★ ({hotel.reviewCount.toLocaleString("en-US")})
      </div>

      <div class="mt-3 flex flex-wrap gap-2">
        {hotel.policies.freeCancellation ? (
          <span class="t-badge t-badge--deal">Free cancellation</span>
        ) : (
          <span class="t-badge">Cancellation varies</span>
        )}
        {hotel.policies.payLater ? (
          <span class="t-badge t-badge--deal">Pay later</span>
        ) : (
          <span class="t-badge">Prepay</span>
        )}
      </div>

      <div class="mt-3 text-sm font-semibold text-[color:var(--color-text-strong)]">
        From {formatMoney(hotel.fromNightly, hotel.currency)}
        <span class="ml-1 text-xs font-normal text-[color:var(--color-text-muted)]">/night</span>
      </div>
    </div>
  </a>
))

const CarRentalCardDefault = component$(({ rental }: { rental: CarRental }) => {
  const headlineOffer = rental.offers[0] || null

  return (
    <a class="t-card block overflow-hidden hover:bg-white" href={buildCarRentalDetailHref(rental.slug)}>
      <div class="bg-[color:var(--color-neutral-50)]">
        <img
          class="h-40 w-full object-cover"
          src={rental.images[0] || "/img/demo/car-1.jpg"}
          alt={rental.name}
          loading="lazy"
          width={640}
          height={320}
        />
      </div>

      <div class="p-5">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">{rental.name}</div>
            <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">
              {rental.city} · {rental.pickupArea}
              {headlineOffer ? (
                <>
                  {" "}
                  · {headlineOffer.category} · {headlineOffer.transmission}
                </>
              ) : null}
            </div>
          </div>

          <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
            From {formatMoney(rental.fromDaily, rental.currency)}
            <span class="ml-1 text-[color:var(--color-text-muted)]">/day</span>
          </div>
        </div>

        <div class="mt-3 flex flex-wrap gap-2">
          <span class="t-badge">
            {rental.rating.toFixed(1)} ★{" "}
            <span class="text-[color:var(--color-text-muted)]">({rental.reviewCount.toLocaleString("en-US")})</span>
          </span>

          {rental.policies.freeCancellation ? (
            <span class="t-badge t-badge--deal">Free cancellation</span>
          ) : (
            <span class="t-badge">Cancellation varies</span>
          )}

          {rental.policies.payAtCounter ? (
            <span class="t-badge t-badge--deal">Pay at counter</span>
          ) : (
            <span class="t-badge">Prepay</span>
          )}
        </div>

        <div class="mt-3 text-xs text-[color:var(--color-text-muted)]">
          Includes:{" "}
          <span class="text-[color:var(--color-text)]">{rental.inclusions.slice(0, 4).join(" · ")}</span>
        </div>

        <div class="mt-4 text-sm text-[color:var(--color-action)]">View car rental →</div>
      </div>
    </a>
  )
})

const buildHotelDetailHref = (hotelSlug: string) => {
  return `/hotels/${encodeURIComponent(hotelSlug)}`
}

const buildCarRentalDetailHref = (rentalSlug: string) => {
  return `/car-rentals/${encodeURIComponent(rentalSlug)}`
}

/* -----------------------------
   Types
----------------------------- */

export type ListingCardGridDensity = "default" | "compact"

export type ListingCardGridVariant = "hotels" | "car-rentals"

export type ListingCardGridProps =
  | {
    variant: "hotels"
    items: Hotel[]
    density?: ListingCardGridDensity
  }
  | {
    variant: "car-rentals"
    items: CarRental[]
    density?: ListingCardGridDensity
  }
