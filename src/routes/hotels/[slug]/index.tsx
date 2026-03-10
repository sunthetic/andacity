import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { routeLoader$, useLocation } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { AvailabilityConfidence } from "~/components/inventory/AvailabilityConfidence";
import { InventoryRefreshControl } from "~/components/inventory/InventoryRefreshControl";
import { revalidateInventoryApi } from "~/lib/inventory/inventory-api";
import {
  buildAvailabilityConfidence,
  evaluateHotelAvailabilityContext,
} from "~/lib/inventory/availability-confidence";
import {
  buildHotelPriceDisplay,
  describePriceChangeCollection,
  formatMoney,
  formatPriceChange,
  formatPriceQualifier,
  type PriceChange,
} from "~/lib/pricing/price-display";
import {
  buildRefreshPriceChangeMap,
  consumeRefreshPriceSnapshot,
  storeRefreshPriceSnapshot,
} from "~/lib/pricing/refresh-price-snapshot";
import { getOgSecret, encodeOgPayload, signOgPayload } from "~/lib/seo/og-sign";
import type { Hotel } from "~/data/hotels";
import { loadHotelBySlugFromDb } from "~/lib/queries/hotels-pages.server";
import { Page } from "~/components/site/Page";

export const useHotelPage = routeLoader$(async ({ params, url, error }) => {
  const slug = String(params.slug || "")
    .toLowerCase()
    .trim();
  if (!slug) throw error(404, "Not found");

  const hotel = await loadHotelBySlugFromDb(slug);
  if (!hotel) throw error(404, "Not found");

  const active = parseHotelStayParams(url.searchParams);
  const nights = computeNights(active.checkIn, active.checkOut);
  const partyLabel = buildPartyLabel(active.adults, active.rooms);
  const availabilityAssessment = evaluateHotelAvailabilityContext({
    availability: hotel.availability || null,
    checkIn: active.checkIn,
    checkOut: active.checkOut,
  });
  const hotelWithConfidence: Hotel = {
    ...hotel,
    availabilityConfidence: buildAvailabilityConfidence({
      freshness: hotel.freshness,
      ...availabilityAssessment,
    }),
  };

  const pricing = computePricing(hotelWithConfidence, nights, active.rooms);

  // Suggested backlinks (search is noindex, fine for conversion)
  const searchHref = buildSearchHotelsHref({
    query: hotel.cityQuery,
    page: 1,
    checkIn: active.checkIn,
    checkOut: active.checkOut,
    adults: active.adults,
    rooms: active.rooms,
  });

  let ogImage = new URL(`/og/hotel/${encodeURIComponent(slug)}.png`, url.origin)
    .href;

  const secret = getOgSecret();
  if (secret) {
    const p = encodeOgPayload({
      v: "hotel",
      slug,
      title: hotel.name,
      subtitle: `${hotel.city} · ${hotel.stars}★`,
    });

    const sig = await signOgPayload(p, secret);
    ogImage = `${ogImage}?p=${encodeURIComponent(p)}&sig=${encodeURIComponent(sig)}`;
  }

  return {
    slug,
    hotel: hotelWithConfidence,
    active,
    nights,
    partyLabel,
    pricing,
    searchHref,
    ogImage,
  };
});

export default component$(() => {
  const data = useHotelPage().value;
  const h = data.hotel;
  const location = useLocation();
  const refreshHref = `${location.url.pathname}${location.url.search}`;
  const refreshSnapshotId = `hotel-detail:${refreshHref}`;
  const refreshPriceChange = useSignal<PriceChange | null>(null);
  const refreshPriceSummary = useSignal<string | null>(null);

  const onRevalidateHotel$ = $(async () => {
    if (h.inventoryId == null) {
      throw new Error("This hotel cannot be revalidated right now.");
    }

    storeRefreshPriceSnapshot(refreshSnapshotId, [
      {
        id: h.slug,
        amount: h.fromNightly,
        currencyCode: h.currency,
      },
    ]);

    await revalidateInventoryApi({
      itemType: "hotel",
      inventoryIds: [h.inventoryId],
    });
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    const previousEntries = consumeRefreshPriceSnapshot(refreshSnapshotId);
    if (!previousEntries.length) {
      refreshPriceChange.value = null;
      refreshPriceSummary.value = null;
      return;
    }

    const nextChanges = buildRefreshPriceChangeMap(
      previousEntries,
      [
        {
          id: h.slug,
          amount: h.fromNightly,
          currencyCode: h.currency,
        },
      ],
      "Nightly rate",
    );

    refreshPriceChange.value = nextChanges[h.slug] || null;
    refreshPriceSummary.value = describePriceChangeCollection(
      Object.values(nextChanges),
    );
  });

  const stayPriceDisplay = {
    ...buildHotelPriceDisplay({
      currencyCode: h.currency,
      nightlyRate: h.fromNightly,
      nights: data.nights,
      rooms: data.active.rooms,
    }),
    delta: refreshPriceChange.value,
  };

  return (
    <Page
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Hotels", href: "/hotels" },
        {
          label: h.city,
          href: `/hotels/in/${encodeURIComponent(h.cityQuery)}`,
        },
        { label: h.name },
      ]}
    >
      {/* Hero: hotel name + trust row */}
      <div class="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="t-badge">{h.stars}★</span>
            <span class="t-badge">{h.neighborhood}</span>
            <span class="t-badge">{h.city}</span>
          </div>

          <h1 class="mt-3 text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)] lg:text-4xl">
            {h.name}
          </h1>

          <div class="mt-2 flex flex-wrap items-center gap-2 text-sm text-[color:var(--color-text-muted)]">
            <span class="font-medium text-[color:var(--color-text)]">
              {h.rating.toFixed(1)} ★
            </span>
            <span>({h.reviewCount.toLocaleString("en-US")} reviews)</span>
            <span class="text-[color:var(--color-text-subtle)]">·</span>
            <span>{h.addressLine}</span>
          </div>

          {/* Heatmap-informed trust + clarity row */}
          <div class="mt-4 flex flex-wrap gap-2">
            {h.policies.freeCancellation ? (
              <span class="t-badge t-badge--deal">Free cancellation</span>
            ) : (
              <span class="t-badge">Cancellation varies</span>
            )}
            {h.policies.payLater ? (
              <span class="t-badge t-badge--deal">Pay later</span>
            ) : (
              <span class="t-badge">Prepay options</span>
            )}
            {h.policies.noResortFees ? (
              <span class="t-badge">No resort fees</span>
            ) : (
              <span class="t-badge">Fees may apply</span>
            )}
            <span class="t-badge">Transparent totals</span>
          </div>

          <div class="mt-5 rounded-xl border border-[color:var(--color-border)] px-4 py-4">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
                  Availability confidence
                </p>
                <div class="mt-2">
                  <AvailabilityConfidence
                    confidence={h.availabilityConfidence}
                    compact={false}
                    showSupport={Boolean(h.availabilityConfidence?.supportText)}
                  />
                </div>
              </div>

              <InventoryRefreshControl
                id={refreshSnapshotId}
                mode={h.inventoryId != null ? "action" : "unsupported"}
                onRefresh$={
                  h.inventoryId != null ? onRevalidateHotel$ : undefined
                }
                reloadHref={refreshHref}
                reloadOnSuccess={true}
                label="Refresh availability"
                refreshingLabel="Refreshing..."
                refreshedLabel="Availability refreshed"
                failedLabel="Retry refresh"
                unsupportedLabel="Refresh unavailable"
                unsupportedMessage="This hotel cannot refresh availability right now."
                successMessage="Hotel availability was refreshed. Any nightly-rate changes are highlighted below."
                failureMessage="Failed to refresh this hotel's availability signals."
                align="right"
              />
            </div>
          </div>

          {refreshPriceSummary.value ? (
            <div class="mt-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-primary-50)] px-4 py-3 text-sm text-[color:var(--color-text)]">
              {refreshPriceSummary.value}
            </div>
          ) : null}

          {/* Gallery */}
          <div class="mt-6 grid gap-3 lg:grid-cols-[2fr_1fr]">
            <div class="t-card overflow-hidden">
              <img
                class="h-64 w-full object-cover lg:h-96"
                src={h.images[0] || "/img/demo/hotel-1.jpg"}
                alt={h.name}
                loading="eager"
                width={1280}
                height={768}
              />
            </div>
            <div class="grid gap-3">
              {h.images.slice(1, 3).map((src) => (
                <div key={src} class="t-card overflow-hidden">
                  <img
                    class="h-32 w-full object-cover lg:h-[186px]"
                    src={src}
                    alt={h.name}
                    loading="lazy"
                    width={640}
                    height={372}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Summary + amenities (high scan zone) */}
          <section class="mt-8 t-card p-5">
            <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">
              Overview
            </h2>
            <p class="mt-2 max-w-[90ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
              {h.summary}
            </p>

            <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {h.amenities.slice(0, 9).map((a) => (
                <div
                  key={a}
                  class="t-panel flex items-center justify-between gap-3 px-4 py-3"
                >
                  <span class="text-sm text-[color:var(--color-text)]">
                    {a}
                  </span>
                  <span class="t-badge">Included</span>
                </div>
              ))}
            </div>

            <div class="mt-4">
              <a
                class="text-sm text-[color:var(--color-action)] hover:underline"
                href="#amenities"
              >
                See all amenities →
              </a>
            </div>
          </section>

          {/* Rooms (conversion core) */}
          <section class="mt-8" id="rooms">
            <div class="flex items-end justify-between gap-3">
              <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">
                Rooms
              </h2>
              <div class="text-sm text-[color:var(--color-text-muted)]">
                {data.nights ? (
                  <span>
                    {data.nights} nights · {data.partyLabel}
                  </span>
                ) : (
                  <a
                    class="text-[color:var(--color-action)] hover:underline"
                    href="#stay"
                  >
                    Add dates to see totals
                  </a>
                )}
              </div>
            </div>

            <div class="mt-4 grid gap-3">
              {h.rooms.map((r) => (
                <RoomCard
                  key={r.id}
                  room={r}
                  nights={data.nights}
                  currency={h.currency}
                  roomsCount={data.active.rooms}
                />
              ))}
            </div>
          </section>

          {/* Amenities full */}
          <section class="mt-8 t-card p-5" id="amenities">
            <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">
              Amenities
            </h2>
            <div class="mt-4 flex flex-wrap gap-2">
              {h.amenities.map((a) => (
                <span key={a} class="t-badge">
                  {a}
                </span>
              ))}
            </div>
          </section>

          {/* Policies (trust) */}
          <section class="mt-8 t-card p-5" id="policies">
            <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">
              Policies
            </h2>

            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <div class="t-panel p-4">
                <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                  Cancellation
                </div>
                <div class="mt-2 text-sm text-[color:var(--color-text-muted)]">
                  {h.policies.cancellationBlurb}
                </div>
              </div>

              <div class="t-panel p-4">
                <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                  Payment
                </div>
                <div class="mt-2 text-sm text-[color:var(--color-text-muted)]">
                  {h.policies.paymentBlurb}
                </div>
              </div>

              <div class="t-panel p-4">
                <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                  Fees
                </div>
                <div class="mt-2 text-sm text-[color:var(--color-text-muted)]">
                  {h.policies.feesBlurb}
                </div>
              </div>

              <div class="t-panel p-4">
                <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                  Check-in
                </div>
                <div class="mt-2 text-sm text-[color:var(--color-text-muted)]">
                  Check-in {h.policies.checkInTime} · Check-out{" "}
                  {h.policies.checkOutTime}
                </div>
              </div>
            </div>
          </section>

          {/* FAQ (indexable) */}
          <section class="mt-8 t-card p-5" id="faq">
            <h2 class="text-lg font-semibold text-[color:var(--color-text-strong)]">
              FAQ
            </h2>
            <div class="mt-4 space-y-3">
              {h.faq.map((qa) => (
                <div key={qa.q} class="t-panel p-4">
                  <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                    {qa.q}
                  </div>
                  <div class="mt-2 text-sm text-[color:var(--color-text-muted)]">
                    {qa.a}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sticky booking card (primary conversion zone) */}
        <aside class="lg:sticky lg:top-24 lg:self-start">
          <div class="t-card p-5 bg-surface" id="stay">
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                  Your stay
                </div>
                <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                  Set dates to reveal totals. GET URLs stay shareable.
                </div>
              </div>
              <span class="t-badge">Hotels</span>
            </div>

            <form method="get" class="mt-4 grid gap-3">
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">
                    Check-in
                  </label>
                  <input
                    name="checkIn"
                    class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
                    placeholder="YYYY-MM-DD"
                    value={data.active.checkIn || ""}
                  />
                </div>
                <div>
                  <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">
                    Check-out
                  </label>
                  <input
                    name="checkOut"
                    class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
                    placeholder="YYYY-MM-DD"
                    value={data.active.checkOut || ""}
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">
                    Adults
                  </label>
                  <input
                    name="adults"
                    class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
                    placeholder="2"
                    value={
                      data.active.adults != null
                        ? String(data.active.adults)
                        : ""
                    }
                  />
                </div>
                <div>
                  <label class="text-xs font-medium text-[color:var(--color-text-subtle)]">
                    Rooms
                  </label>
                  <input
                    name="rooms"
                    class="mt-1 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
                    placeholder="1"
                    value={
                      data.active.rooms != null ? String(data.active.rooms) : ""
                    }
                  />
                </div>
              </div>

              <button class="t-btn-primary" type="submit">
                Update
              </button>
            </form>

            <div class="mt-5 border-t border-[color:var(--color-divider)] pt-5">
              <div class="flex items-end justify-between gap-3">
                <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                  {stayPriceDisplay.baseLabel}{" "}
                  {formatMoney(stayPriceDisplay.baseAmount, h.currency)}
                  <span class="ml-1 text-xs font-normal text-[color:var(--color-text-muted)]">
                    {formatPriceQualifier(stayPriceDisplay.baseQualifier)}
                  </span>
                </div>
                {stayPriceDisplay.unitCountLabel ? (
                  <span class="t-badge">{stayPriceDisplay.unitCountLabel}</span>
                ) : (
                  <span class="t-badge">Set dates</span>
                )}
              </div>

              <div class="mt-3 grid gap-2 text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-[color:var(--color-text-muted)]">
                    {stayPriceDisplay.baseTotalLabel || "Base stay total"}
                  </span>
                  <span class="font-medium text-[color:var(--color-text)]">
                    {stayPriceDisplay.baseTotalAmount != null
                      ? formatMoney(
                          stayPriceDisplay.baseTotalAmount,
                          h.currency,
                        )
                      : "—"}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-[color:var(--color-text-muted)]">
                    {stayPriceDisplay.estimatedFeesLabel ||
                      "Estimated taxes & fees"}
                  </span>
                  <span class="font-medium text-[color:var(--color-text)]">
                    {stayPriceDisplay.estimatedFeesAmount != null
                      ? formatMoney(
                          stayPriceDisplay.estimatedFeesAmount,
                          h.currency,
                        )
                      : "—"}
                  </span>
                </div>

                <div class="flex items-center justify-between border-t border-[color:var(--color-divider)] pt-2">
                  <span class="text-[color:var(--color-text-muted)]">
                    {stayPriceDisplay.totalLabel || "Estimated total"}
                  </span>
                  <span class="text-base font-semibold text-[color:var(--color-text-strong)]">
                    {stayPriceDisplay.totalAmount != null
                      ? formatMoney(stayPriceDisplay.totalAmount, h.currency)
                      : "—"}
                  </span>
                </div>
              </div>

              {stayPriceDisplay.delta &&
              stayPriceDisplay.delta.status !== "unchanged" &&
              stayPriceDisplay.delta.status !== "unavailable" ? (
                <div
                  class={[
                    "mt-3 text-xs font-medium",
                    stayPriceDisplay.delta.status === "increased"
                      ? "text-[color:var(--color-error,#b91c1c)]"
                      : "text-[color:var(--color-success,#0f766e)]",
                  ]}
                >
                  {formatPriceChange(stayPriceDisplay.delta, h.currency)}
                </div>
              ) : null}

              <div class="mt-4">
                <a class="t-btn-primary block text-center" href="#rooms">
                  Select a room
                </a>
              </div>

              <div class="mt-3 text-xs text-[color:var(--color-text-muted)]">
                {stayPriceDisplay.supportText} Final total depends on room
                choice, cancellation terms, and payment schedule.
              </div>
            </div>
          </div>

          {/* Secondary trust card */}
          <div class="mt-4 t-card p-5">
            <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
              Why Andacity
            </div>
            <ul class="mt-3 space-y-2 text-sm text-[color:var(--color-text-muted)]">
              <li>Transparent totals and policy clarity</li>
              <li>Fast filtering and shareable URLs</li>
              <li>SEO: destinations + hotels earn rankings</li>
            </ul>

            <div class="mt-4">
              <a
                class="t-badge block text-center hover:bg-white"
                href={data.searchHref}
              >
                Compare more hotels →
              </a>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile sticky CTA */}
      <div class="fixed inset-x-0 bottom-0 z-50 border-t border-[color:var(--color-divider)] bg-white/95 backdrop-blur lg:hidden">
        <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div class="min-w-0">
            <div class="truncate text-sm font-semibold text-[color:var(--color-text-strong)]">
              {stayPriceDisplay.baseLabel}{" "}
              {formatMoney(stayPriceDisplay.baseAmount, h.currency)}{" "}
              <span class="text-xs font-normal text-[color:var(--color-text-muted)]">
                {formatPriceQualifier(stayPriceDisplay.baseQualifier)}
              </span>
            </div>
            <div class="text-xs text-[color:var(--color-text-muted)]">
              {stayPriceDisplay.unitCountLabel
                ? `${stayPriceDisplay.unitCountLabel} · `
                : ""}
              {data.partyLabel}
            </div>
          </div>

          <a class="t-btn-primary px-5" href="#rooms">
            Rooms
          </a>
        </div>
      </div>
    </Page>
  );
});

export const head: DocumentHead = ({ resolveValue, url }) => {
  const data = resolveValue(useHotelPage);

  const title = `${data.hotel.name} | Andacity Travel`;
  const description = `Browse ${data.hotel.name}. Compare totals and policies with clarity.`;

  // Canonical
  const canonicalHref = new URL(
    `/hotels/${encodeURIComponent(data.hotel.slug)}`,
    url.origin,
  ).href;

  // IMPORTANT: head must be sync -> no signing here
  // Use your path-based OG route (no query params)
  const ogImage = new URL(
    `/og/hotel/${encodeURIComponent(data.hotel.slug)}.png`,
    url.origin,
  ).href;

  return {
    title,
    meta: [
      { name: "description", content: description },

      { name: "robots", content: "index,follow,max-image-preview:large" },

      { property: "og:type", content: "website" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: canonicalHref },
      { property: "og:image", content: ogImage },

      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: ogImage },
    ],
    links: [{ rel: "canonical", href: canonicalHref }],
  };
};

const RoomCard = component$(
  ({ room, nights, currency, roomsCount }: RoomCardProps) => {
    const count = roomsCount ?? 1;
    const priceDisplay = buildHotelPriceDisplay({
      currencyCode: currency,
      nightlyRate: room.priceFrom,
      nights,
      rooms: count,
    });

    return (
      <div class="t-card p-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div class="text-base font-semibold text-[color:var(--color-text-strong)]">
              {room.name}
            </div>
            <div class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              Sleeps {room.sleeps} · {room.beds} · {room.sizeSqft} sq ft
            </div>

            <div class="mt-3 flex flex-wrap gap-2">
              {room.refundable ? (
                <span class="t-badge t-badge--deal">Free cancellation</span>
              ) : (
                <span class="t-badge">Cancellation varies</span>
              )}
              {room.payLater ? (
                <span class="t-badge t-badge--deal">Pay later</span>
              ) : (
                <span class="t-badge">Prepay</span>
              )}
              {room.badges.map((b) => (
                <span key={b} class="t-badge">
                  {b}
                </span>
              ))}
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              {room.features.map((f) => (
                <span key={f} class="t-badge">
                  {f}
                </span>
              ))}
            </div>
          </div>

          <div class="min-w-[220px] text-right">
            <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
              {priceDisplay.baseLabel}{" "}
              {formatMoney(priceDisplay.baseAmount, currency)}
              <span class="ml-1 text-xs font-normal text-[color:var(--color-text-muted)]">
                {formatPriceQualifier(priceDisplay.baseQualifier)}
              </span>
            </div>

            {priceDisplay.baseTotalAmount != null ? (
              <div class="mt-2 text-xs text-[color:var(--color-text-muted)]">
                {priceDisplay.baseTotalLabel}:{" "}
                <span class="font-medium text-[color:var(--color-text)]">
                  {formatMoney(priceDisplay.baseTotalAmount, currency)}
                </span>
                {priceDisplay.unitCountLabel ? (
                  <span class="ml-1">({priceDisplay.unitCountLabel})</span>
                ) : null}
              </div>
            ) : null}

            {priceDisplay.totalAmount != null &&
            priceDisplay.estimatedFeesAmount != null ? (
              <div class="mt-2 text-xs text-[color:var(--color-text-muted)]">
                {priceDisplay.totalLabel}:{" "}
                <span class="font-medium text-[color:var(--color-text)]">
                  {formatMoney(priceDisplay.totalAmount, currency)}
                </span>
                <span class="ml-1">
                  incl.{" "}
                  {formatMoney(priceDisplay.estimatedFeesAmount, currency)} est.
                </span>
              </div>
            ) : (
              <div class="mt-2 text-xs text-[color:var(--color-text-muted)]">
                Add dates to see totals
              </div>
            )}

            {priceDisplay.supportText ? (
              <div class="mt-2 max-w-[220px] text-xs text-[color:var(--color-text-muted)]">
                {priceDisplay.supportText}
              </div>
            ) : null}

            <div class="mt-4 flex flex-col gap-2">
              <a class="t-btn-primary block text-center" href="#">
                Choose
              </a>
              <a
                class="t-badge block text-center hover:bg-white"
                href="#policies"
              >
                View policies
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

/* -----------------------------
   Stay params + pricing
----------------------------- */

const parseHotelStayParams = (sp: URLSearchParams): StayParams => {
  const checkIn = normalizeIsoDate(sp.get("checkIn"));
  const checkOut = normalizeIsoDate(sp.get("checkOut"));
  const adults = clampMaybeInt(sp.get("adults"), 1, 10);
  const rooms = clampMaybeInt(sp.get("rooms"), 1, 6);

  return { checkIn, checkOut, adults, rooms };
};

const buildPartyLabel = (adults: number | null, rooms: number | null) => {
  const a = adults ?? 2;
  const r = rooms ?? 1;
  return `${a} adult${a === 1 ? "" : "s"} · ${r} room${r === 1 ? "" : "s"}`;
};

const computePricing = (
  hotel: Hotel,
  nights: number | null,
  rooms: number | null,
): Pricing => {
  if (!nights) return { subtotal: null, taxes: null, total: null };

  const r = rooms ?? 1;
  const subtotal = hotel.fromNightly * nights * r;
  const taxes = Math.round(subtotal * 0.14);
  const total = subtotal + taxes;

  return { subtotal, taxes, total };
};

const buildSearchHotelsHref = (d: {
  query: string;
  page: number;
  checkIn: string | null;
  checkOut: string | null;
  adults: number | null;
  rooms: number | null;
}) => {
  const base = `/search/hotels/${encodeURIComponent(d.query)}/${d.page}`;
  const sp = new URLSearchParams();

  if (d.checkIn) sp.set("checkIn", d.checkIn);
  if (d.checkOut) sp.set("checkOut", d.checkOut);
  if (d.adults != null) sp.set("adults", String(d.adults));
  if (d.rooms != null) sp.set("rooms", String(d.rooms));

  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
};

/* -----------------------------
   Helpers
----------------------------- */

const normalizeIsoDate = (raw: string | null) => {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s;
};

const computeNights = (checkIn: string | null, checkOut: string | null) => {
  if (!checkIn || !checkOut) return null;
  const a = Date.parse(checkIn);
  const b = Date.parse(checkOut);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  const diff = Math.round((b - a) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return null;
  return Math.min(diff, 30);
};

const clampMaybeInt = (raw: string | null, min: number, max: number) => {
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return null;
  if (n < min) return min;
  if (n > max) return max;
  return n;
};

/* -----------------------------
   Types
----------------------------- */

type StayParams = {
  checkIn: string | null;
  checkOut: string | null;
  adults: number | null;
  rooms: number | null;
};

type Pricing = {
  subtotal: number | null;
  taxes: number | null;
  total: number | null;
};

type RoomCardProps = {
  room: Hotel["rooms"][number];
  nights: number | null;
  currency: string;
  roomsCount: number | null;
};
