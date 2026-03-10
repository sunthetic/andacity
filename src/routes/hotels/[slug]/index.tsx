import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { routeLoader$, useLocation } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { AsyncRetryControl } from "~/components/async/AsyncRetryControl";
import { AsyncStateNotice } from "~/components/async/AsyncStateNotice";
import { InventoryRefreshControl } from "~/components/inventory/InventoryRefreshControl";
import { CompareButton } from "~/components/save-compare/CompareButton";
import {
  isCompared,
  isShortlisted,
  useDecisioning,
} from "~/components/save-compare/DecisioningProvider";
import { CompareSheet } from "~/components/save-compare/CompareSheet";
import { CompareTray } from "~/components/save-compare/CompareTray";
import { SaveButton } from "~/components/save-compare/SaveButton";
import {
  resolveAvailabilityAsyncState,
  summarizeAvailabilitySignals,
  type BookingAsyncState,
} from "~/lib/async/booking-async-state";
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
import { buildHotelSavedItem } from "~/lib/save-compare/item-builders";
import { getOgSecret, encodeOgPayload, signOgPayload } from "~/lib/seo/og-sign";
import {
  DecisionSummarySection,
  type DecisionSummaryBlock,
  type DecisionSummaryCaveat,
} from "~/components/decision/DecisionSummarySection";
import type { Hotel } from "~/data/hotels";
import { loadHotelBySlugFromDb } from "~/lib/queries/hotels-pages.server";
import { Page } from "~/components/site/Page";

export const useHotelPage = routeLoader$(async ({ params, url, error }) => {
  const slug = String(params.slug || "")
    .toLowerCase()
    .trim();
  if (!slug) throw error(404, "Not found");

  const active = parseHotelStayParams(url.searchParams);
  const nights = computeNights(active.checkIn, active.checkOut);
  const partyLabel = buildPartyLabel(active.adults, active.rooms);
  let ogImage = new URL(`/og/hotel/${encodeURIComponent(slug)}.png`, url.origin)
    .href;
  const fallbackState = {
    slug,
    hotel: null as Hotel | null,
    active,
    nights,
    partyLabel,
    pricing: { subtotal: null, taxes: null, total: null },
    searchHref: "/hotels",
    ogImage,
    loadError: null as string | null,
  };

  const hotel = await loadHotelBySlugFromDb(slug).catch((cause) => {
    const message =
      cause instanceof Error ? cause.message : "Failed to load hotel details.";

    return {
      ...fallbackState,
      loadError: message,
    };
  });

  if (hotel && typeof hotel === "object" && "loadError" in hotel) {
    return hotel;
  }

  if (!hotel) throw error(404, "Not found");

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
    loadError: null as string | null,
  };
});

export default component$(() => {
  const decisioning = useDecisioning();
  const data = useHotelPage().value;
  const h = data.hotel;
  const location = useLocation();
  const refreshHref = `${location.url.pathname}${location.url.search}`;
  const refreshSnapshotId = `hotel-detail:${refreshHref}`;
  const refreshPriceChange = useSignal<PriceChange | null>(null);
  const refreshPriceSummary = useSignal<string | null>(null);
  const availabilitySignals = summarizeAvailabilitySignals(
    h ? [{ availabilityConfidence: h.availabilityConfidence }] : [],
  );
  const asyncState = resolveAvailabilityAsyncState({
    itemCount: h ? 1 : 0,
    isRefreshing: location.isNavigating,
    isFailed: Boolean(data.loadError),
    signals: availabilitySignals,
  });
  const statusNotice = buildHotelDetailStatusNotice(asyncState, {
    partialCount: availabilitySignals.partialCount,
    staleCount: availabilitySignals.staleCount,
    failedCount: availabilitySignals.failedCount,
  });

  if (!h) {
    return (
      <Page
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Hotels", href: "/hotels" },
          { label: "Hotel details" },
        ]}
      >
        <div class="mt-6 rounded-[var(--radius-xl)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
          <AsyncStateNotice
            state="failed"
            title="Hotel details could not be loaded"
            message={data.loadError || "Failed to load hotel details."}
          />
          <AsyncRetryControl
            class="mt-4"
            message="Retry this page or return to hotel search."
            label="Retry hotel details"
            href={location.url.pathname + location.url.search}
          />
        </div>
      </Page>
    );
  }

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
  const decisionItem = buildHotelSavedItem(
    h,
    data.active,
    stayPriceDisplay,
    refreshHref,
  );
  const compared = isCompared(decisioning.state, "hotels", decisionItem.id);
  const compareDisabled =
    !compared &&
    decisioning.state.compare.hotels.length >= decisioning.state.compareLimit;

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    decisioning.recordRecentlyViewed$("hotels", decisionItem);
  });

  const onToggleShortlist$ = $(() => {
    decisioning.toggleShortlist$("hotels", decisionItem);
  });

  const onToggleCompare$ = $(() => {
    decisioning.toggleCompare$("hotels", decisionItem);
  });

  const onOpenCompare$ = $(() => {
    if (decisioning.state.compare.hotels.length < 2) return;
    decisioning.openCompare$("hotels");
  });

  const onClearCompare$ = $(() => {
    decisioning.clearComparedItems$("hotels");
  });

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
      {statusNotice ? (
        <AsyncStateNotice
          class="mb-5"
          state={asyncState}
          title={statusNotice.title}
          message={statusNotice.message}
        />
      ) : null}

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

          <section class="mt-8">
            <DecisionSummarySection
              title="Should you shortlist this stay?"
              description="Quick fit and tradeoff scan from the current stay data."
              blocks={buildHotelDecisionSummaryBlocks(h, stayPriceDisplay)}
              primaryBlockCount={3}
              detailTitle="Stay notes and constraints"
              detailCtaLabel="Notes"
              caveat={buildHotelDecisionCaveat(h)}
              note="Derived from property policies, listed rooms, location fields, and current availability signals."
            />
          </section>

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
              <div class="flex flex-wrap items-center justify-end gap-2">
                <span class="t-badge">Hotels</span>
                <SaveButton
                  saved={isShortlisted(
                    decisioning.state,
                    "hotels",
                    decisionItem.id,
                  )}
                  idleLabel="Shortlist"
                  activeLabel="Shortlisted"
                  onToggle$={onToggleShortlist$}
                />
                <CompareButton
                  selected={compared}
                  disabled={compareDisabled}
                  onToggle$={onToggleCompare$}
                />
              </div>
            </div>

            <div class="mt-4 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-panel)] px-4 py-4">
              <div class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                {stayPriceDisplay.baseLabel}
              </div>
              <div class="mt-2 flex items-end gap-2">
                <span class="text-4xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
                  {formatMoney(stayPriceDisplay.baseAmount, h.currency)}
                </span>
                <span class="pb-1 text-sm text-[color:var(--color-text-muted)]">
                  {formatPriceQualifier(stayPriceDisplay.baseQualifier)}
                </span>
              </div>
              {stayPriceDisplay.totalAmount != null ? (
                <div class="mt-2 text-xs text-[color:var(--color-text-muted)]">
                  {stayPriceDisplay.totalLabel}:{" "}
                  <span class="font-medium text-[color:var(--color-text)]">
                    {formatMoney(stayPriceDisplay.totalAmount, h.currency)}
                  </span>
                  {stayPriceDisplay.unitCountLabel ? (
                    <span class="ml-1">
                      ({stayPriceDisplay.unitCountLabel})
                    </span>
                  ) : null}
                </div>
              ) : null}
              {stayPriceDisplay.supportText ? (
                <div class="mt-2 text-xs text-[color:var(--color-text-muted)]">
                  {stayPriceDisplay.supportText}
                </div>
              ) : null}
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
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="text-xs font-semibold text-[color:var(--color-text-strong)]">
                    {h.availabilityConfidence?.label || "Unknown availability"}
                    {h.freshness ? ` · ${h.freshness.relativeLabel}` : ""}
                  </div>
                  <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                    {buildHotelSidebarStatusNote(h)}
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
                  label="Refresh"
                  refreshingLabel="Refreshing..."
                  refreshedLabel="Refreshed"
                  failedLabel="Retry"
                  unsupportedLabel="Unavailable"
                  unsupportedMessage="This hotel cannot refresh availability right now."
                  successMessage="Hotel availability was refreshed. Any nightly-rate changes are highlighted below."
                  failureMessage="Failed to refresh this hotel's availability signals."
                  compact={true}
                  align="right"
                  disabled={location.isNavigating}
                />
              </div>

              {refreshPriceSummary.value ? (
                <div class="mt-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-primary-50)] px-4 py-3 text-sm text-[color:var(--color-text)]">
                  {refreshPriceSummary.value}
                </div>
              ) : null}

              <div class="mt-4">
                <a class="t-btn-primary block text-center" href="#rooms">
                  Select a room
                </a>
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
        <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
          <div class="min-w-0">
            <div class="flex items-baseline gap-1.5">
              <span class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                {stayPriceDisplay.baseLabel}
              </span>
              <span class="truncate text-lg font-semibold text-[color:var(--color-text-strong)]">
                {formatMoney(stayPriceDisplay.baseAmount, h.currency)}
              </span>
              <span class="truncate text-xs font-medium text-[color:var(--color-text-muted)]">
                {formatPriceQualifier(stayPriceDisplay.baseQualifier)}
              </span>
            </div>
            <div class="truncate text-[11px] leading-4 text-[color:var(--color-text-muted)]">
              {stayPriceDisplay.unitCountLabel
                ? `${stayPriceDisplay.unitCountLabel} · `
                : ""}
              {data.partyLabel}
            </div>
          </div>

          <a class="t-btn-primary px-4 py-2.5 text-sm" href="#rooms">
            Select room
          </a>
        </div>
      </div>

      <div class="h-16 lg:hidden" />

      {decisioning.state.compare.hotels.length ? (
        <CompareTray
          vertical="hotels"
          compareCount={decisioning.state.compare.hotels.length}
          onOpen$={onOpenCompare$}
          onClear$={onClearCompare$}
          class="bottom-20 lg:bottom-3"
        />
      ) : null}

      <CompareSheet
        open={
          decisioning.state.compareOpen &&
          decisioning.state.compareVertical === "hotels" &&
          decisioning.state.compare.hotels.length >= 2
        }
        vertical="hotels"
        items={decisioning.state.compare.hotels}
      />
    </Page>
  );
});

export const head: DocumentHead = ({ resolveValue, url }) => {
  const data = resolveValue(useHotelPage);
  if (!data.hotel) {
    return {
      title: "Hotel details | Andacity Travel",
      meta: [
        {
          name: "description",
          content: "Retry hotel details or return to hotel search.",
        },
      ],
      links: [
        { rel: "canonical", href: new URL(url.pathname, url.origin).href },
      ],
    };
  }

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

const buildHotelDetailStatusNotice = (
  state: BookingAsyncState,
  input: {
    partialCount: number;
    staleCount: number;
    failedCount: number;
  },
) => {
  if (state === "refreshing") {
    return {
      title: "Refreshing hotel details",
      message:
        "Updated availability and pricing are loading. Current hotel details stay visible until the refresh completes.",
    };
  }

  if (state === "partial") {
    return {
      title: "This stay only partially matches",
      message: `${input.partialCount.toLocaleString("en-US")} availability signal indicates the selected stay only partially matches the current request. Refresh availability before relying on this price.`,
    };
  }

  if (state === "stale") {
    const affected = input.staleCount + input.failedCount;
    return {
      title: "Availability needs recheck",
      message: `${affected.toLocaleString("en-US")} availability signal${affected === 1 ? "" : "s"} for this property are stale or failed. Refresh availability before treating this stay as current.`,
    };
  }

  return undefined;
};

const buildHotelDecisionFacts = (
  hotel: Hotel,
  priceDisplay: ReturnType<typeof buildHotelPriceDisplay>,
): Array<{
  label: string;
  value: string;
  detail?: string | null;
  tone?: "warning" | "default";
}> => {
  const roomCount = hotel.rooms.length;
  const refundableCount = hotel.rooms.filter((room) => room.refundable).length;
  const payLaterCount = hotel.rooms.filter((room) => room.payLater).length;
  const priceDetail = [
    priceDisplay.totalAmount != null
      ? `${priceDisplay.totalLabel || "Estimated total"} ${formatMoney(
          priceDisplay.totalAmount,
          hotel.currency,
        )}${priceDisplay.unitCountLabel ? ` for ${priceDisplay.unitCountLabel}` : ""}`
      : "Add dates to estimate the full stay total.",
    priceDisplay.supportText || null,
    priceDisplay.delta &&
    priceDisplay.delta.status !== "unchanged" &&
    priceDisplay.delta.status !== "unavailable"
      ? formatPriceChange(priceDisplay.delta, hotel.currency)
      : null,
  ]
    .filter(Boolean)
    .join(". ");

  return [
    {
      label: "Price summary",
      value: `From ${formatMoney(hotel.fromNightly, hotel.currency)}${formatPriceQualifier(
        priceDisplay.baseQualifier,
      )}`,
      detail: priceDetail,
    },
    {
      label: "Room terms",
      value: buildHotelRoomTermsValue(
        roomCount,
        refundableCount,
        payLaterCount,
      ),
      detail: buildHotelRoomTermsDetail(
        roomCount,
        refundableCount,
        payLaterCount,
      ),
    },
    {
      label: "Important constraints",
      value: buildHotelConstraintSummary(hotel),
      detail: buildHotelConstraintDetail(hotel),
      tone: hotel.availabilityConfidence?.degraded ? "warning" : "default",
    },
  ];
};

const buildHotelDecisionSummaryBlocks = (
  hotel: Hotel,
  priceDisplay: ReturnType<typeof buildHotelPriceDisplay>,
): DecisionSummaryBlock[] => {
  const trustFacts = buildHotelDecisionFacts(hotel, priceDisplay);
  const amenityPreview = hotel.amenities.slice(0, 3);
  const keyNotes = [
    `${hotel.rating.toFixed(1)} ★ from ${hotel.reviewCount.toLocaleString("en-US")} guest reviews.`,
    hotel.rooms.length
      ? `${hotel.rooms.length.toLocaleString("en-US")} listed room option${hotel.rooms.length === 1 ? "" : "s"} right now.`
      : "Room options are not listed yet.",
    amenityPreview.length
      ? `Top amenity signals: ${joinShortList(amenityPreview)}.`
      : null,
    `Check-in ${hotel.policies.checkInTime}; check-out ${hotel.policies.checkOutTime}.`,
  ].filter(Boolean) as string[];
  const constraints = hotel.availability
    ? [
        buildNightRangeLabel(
          hotel.availability.minNights,
          hotel.availability.maxNights,
        ),
        `Check-in window: ${formatCalendarDate(
          hotel.availability.checkInStart,
        )} to ${formatCalendarDate(hotel.availability.checkInEnd)}.`,
        hotel.availability.blockedWeekdays.length
          ? `Blocked check-in days: ${formatWeekdayList(
              hotel.availability.blockedWeekdays,
            )}.`
          : "No blocked check-in weekdays are posted.",
      ]
    : ["Live stay window is unavailable; refresh after adding dates."];
  const location = [
    [hotel.neighborhood, hotel.city, hotel.region].filter(Boolean).join(", "),
    hotel.addressLine,
    hotel.propertyType
      ? `${hotel.propertyType} inventory in ${hotel.city}.`
      : null,
  ].filter(Boolean) as string[];

  return [
    ...trustFacts.map((row) => ({
      label: row.label,
      items: [row.value, row.detail].filter(Boolean) as string[],
      tone: row.tone,
    })),
    { label: "Stay notes", items: keyNotes },
    { label: "Location context", items: location },
    {
      label: "Stay rules",
      items: constraints,
      tone: hotel.availabilityConfidence?.degraded ? "warning" : "default",
    },
  ];
};

const buildHotelDecisionCaveat = (
  hotel: Hotel,
): DecisionSummaryCaveat | null => {
  const confidence = hotel.availabilityConfidence;
  if (!confidence?.degraded) return null;

  return {
    title:
      confidence.state === "unavailable"
        ? "Current dates do not cleanly fit this stay"
        : "Availability confidence is reduced",
    summary:
      confidence.state === "unavailable"
        ? "Review the current rules before relying on this stay."
        : "Open the detail notes before treating this stay as current.",
    message: [
      confidence.supportText ||
        "Refresh availability before relying on this stay.",
      "Room policies and final totals can still vary by selected rate.",
    ].join(" "),
    tone: confidence.state === "unavailable" ? "critical" : "warning",
  };
};

const buildHotelConstraintSummary = (hotel: Hotel) => {
  if (!hotel.availability) {
    return "Live stay window unavailable";
  }

  const weekdayCount = hotel.availability.blockedWeekdays.length;
  const blockedLabel =
    weekdayCount > 0
      ? `some check-in days blocked`
      : "no blocked weekdays posted";

  return `${hotel.availability.minNights}-${hotel.availability.maxNights} night stays · ${blockedLabel}`;
};

const buildHotelConstraintDetail = (hotel: Hotel) => {
  if (!hotel.availability) {
    return "Refresh availability after adding dates to confirm current stay rules.";
  }

  return `Check-in window ${formatCalendarDate(
    hotel.availability.checkInStart,
  )} to ${formatCalendarDate(hotel.availability.checkInEnd)}.`;
};

const buildHotelSidebarStatusNote = (hotel: Hotel) => {
  if (hotel.availabilityConfidence?.supportText) {
    return hotel.availabilityConfidence.supportText;
  }

  return "Refresh before booking to confirm the latest inventory.";
};

const buildHotelRoomTermsValue = (
  roomCount: number,
  refundableCount: number,
  payLaterCount: number,
) => {
  if (!roomCount) return "Room terms load with current inventory";

  if (refundableCount === roomCount && payLaterCount === roomCount) {
    return "All listed rooms show flexible terms";
  }

  if (refundableCount > 0 || payLaterCount > 0) {
    return "Flexibility depends on the room you choose";
  }

  return "Listed rooms skew toward firmer terms";
};

const buildHotelRoomTermsDetail = (
  roomCount: number,
  refundableCount: number,
  payLaterCount: number,
) => {
  if (!roomCount) {
    return "Refresh room inventory to confirm cancellation and payment options.";
  }

  return `${refundableCount} of ${roomCount} room${roomCount === 1 ? "" : "s"} show refundable terms. ${payLaterCount} of ${roomCount} show pay-later terms.`;
};

const buildNightRangeLabel = (minNights: number, maxNights: number) => {
  if (minNights === maxNights) {
    return `Stay length is fixed at ${minNights} night${minNights === 1 ? "" : "s"}.`;
  }

  return `Stay length must be ${minNights}-${maxNights} nights.`;
};

const joinShortList = (items: string[]) => {
  if (items.length <= 1) return items[0] || "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
};

const formatWeekdayList = (days: number[]) => {
  const labels = Array.from(
    new Set(days.filter((day) => day >= 0 && day <= 6)),
  ).map(
    (day) =>
      ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day] || "Unknown",
  );

  return joinShortList(labels);
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

const formatCalendarDate = (value: string | null | undefined) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return value || "date unavailable";
  const [year, month, day] = value
    .split("-")
    .map((part) => Number.parseInt(part, 10));
  const date = new Date(Date.UTC(year, month - 1, day));

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
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
