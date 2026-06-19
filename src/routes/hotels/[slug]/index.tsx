import { $, component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { routeLoader$, useLocation } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import { useBookingAbandonmentTelemetry } from "~/lib/analytics/booking-abandonment";
import { trackBookingEvent } from "~/lib/analytics/booking-telemetry";
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
import { AddToTripButton } from "~/components/trips/AddToTripButton";
import { DateField } from "~/components/ui/DateField";
import { getTodayIsoDate, normalizeIsoDate } from "~/lib/date/validateDate";
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
import { addDays } from "~/lib/trips/date-utils";
import type { Hotel } from "~/data/hotels";
import { loadHotelBySlugFromDb } from "~/lib/queries/hotels-pages.server";
import { Page } from "~/components/site/Page";
import { HotelGallery } from "~/components/hotels/HotelGallery";

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
  const stayCheckIn = useSignal(data.active.checkIn || "");
  const stayCheckOut = useSignal(data.active.checkOut || "");
  const todayIsoDate = getTodayIsoDate();
  const tomorrowIsoDate = addDays(todayIsoDate, 1) || todayIsoDate;
  const minimumCheckoutDate =
    addDays(
      stayCheckIn.value >= todayIsoDate ? stayCheckIn.value : todayIsoDate,
      1,
    ) || tomorrowIsoDate;
  useBookingAbandonmentTelemetry({
    vertical: "hotels",
    stage: "detail",
    enabled: Boolean(h),
    payload: {
      surface: "detail_page",
    },
    trackOnCleanup: false,
  });
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
        <div
          class="mt-6 p-6"
          style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius-lg);box-shadow:var(--ui-shadow-card)"
        >
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
            telemetry={{
              vertical: "hotels",
              surface: "detail",
              retryType: "detail_reload",
              context: "load_failure",
            }}
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
    trackBookingEvent("booking_compare_opened", {
      vertical: "hotels",
      surface: "detail",
      compare_count: decisioning.state.compare.hotels.length,
    });
    decisioning.openCompare$("hotels");
  });

  const onClearCompare$ = $(() => {
    trackBookingEvent("booking_compare_cleared", {
      vertical: "hotels",
      surface: "detail",
      compare_count: decisioning.state.compare.hotels.length,
    });
    decisioning.clearComparedItems$("hotels");
  });

  const policyHighlights = buildPolicyHighlights(h);

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

      {/* ── Title header ── */}
      <header>
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="text-[13px]"
                style="color:var(--ui-accent)"
                aria-label={`${h.stars} star`}
              >
                {"★".repeat(h.stars)}
              </span>
              <span
                class="rounded-full px-2.5 py-0.5 text-[12px] font-medium"
                style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);color:var(--ui-text-muted)"
              >
                {h.neighborhood}, {h.city}
              </span>
            </div>

            <h1
              class="mt-2 text-balance text-3xl font-bold tracking-tight md:text-4xl"
              style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
            >
              {h.name}
            </h1>

            <div
              class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"
              style="color:var(--ui-text-muted)"
            >
              <span class="inline-flex items-center gap-1.5">
                <span
                  class="grid place-items-center rounded-lg px-2 py-0.5 text-[12px] font-extrabold"
                  style="background:var(--ui-primary);color:var(--ui-on-primary)"
                >
                  {h.rating.toFixed(1)}
                </span>
                <span class="font-semibold" style="color:var(--ui-text)">
                  {resolveReviewLabel(h.rating)}
                </span>
              </span>
              <span>· {h.reviewCount.toLocaleString("en-US")} reviews</span>
              <span aria-hidden="true">·</span>
              <span>{h.addressLine}</span>
            </div>
          </div>

          <div class="flex shrink-0 gap-2">
            <SaveButton
              saved={isShortlisted(
                decisioning.state,
                "hotels",
                decisionItem.id,
              )}
              idleLabel="Save"
              activeLabel="Saved"
              telemetry={{
                vertical: "hotels",
                itemId: decisionItem.id,
                surface: "detail",
              }}
              onToggle$={onToggleShortlist$}
            />
            <CompareButton
              selected={compared}
              disabled={compareDisabled}
              telemetry={{
                vertical: "hotels",
                itemId: decisionItem.id,
                surface: "detail",
              }}
              onToggle$={onToggleCompare$}
            />
          </div>
        </div>

        {/* Policy highlight row — distributed trust, no heavy block */}
        <ul class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {policyHighlights.map((hl) => (
            <li
              key={hl}
              class="flex items-center gap-1.5 text-[12px]"
              style="color:var(--ui-text-secondary)"
            >
              <span aria-hidden="true" style="color:var(--ui-success)">
                ✓
              </span>
              {hl}
            </li>
          ))}
        </ul>
      </header>

      {/* ── Gallery ── */}
      <div class="mt-5">
        <HotelGallery images={h.images} hotelName={h.name} />
      </div>

      {/* ── Two-column layout: content | booking rail ── */}
      <div class="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        {/* Content column */}
        <div class="flex min-w-0 flex-col gap-10">
          {/* Overview */}
          <section>
            <h2
              class="text-xl font-bold"
              style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
            >
              Overview
            </h2>
            <p
              class="mt-2 max-w-[68ch] text-sm md:text-base"
              style="color:var(--ui-text-muted)"
            >
              {h.summary}
            </p>
          </section>

          {/* Rooms */}
          <section id="rooms">
            <div class="flex flex-wrap items-end justify-between gap-2">
              <h2
                class="text-xl font-bold"
                style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
              >
                Choose your room
              </h2>
              <span class="text-[12px]" style="color:var(--ui-text-muted)">
                {data.nights ? (
                  <span>
                    {data.nights} night{data.nights === 1 ? "" : "s"} ·{" "}
                    {data.partyLabel}
                  </span>
                ) : (
                  <a
                    href="#booking"
                    style="color:var(--ui-primary)"
                    class="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
                  >
                    Add dates to see totals
                  </a>
                )}
              </span>
            </div>

            {h.rooms.length ? (
              <div class="mt-4 flex flex-col gap-3">
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
            ) : (
              <div
                class="mt-4 p-5"
                style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);border-radius:var(--ui-radius)"
              >
                <p class="text-sm" style="color:var(--ui-text-muted)">
                  Room options are not currently listed. Set your dates and
                  search again to see available rooms.
                </p>
                <a
                  href="#booking"
                  class="mt-3 inline-flex items-center gap-1 text-sm font-semibold hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
                  style="color:var(--ui-primary)"
                >
                  Set dates to check availability →
                </a>
              </div>
            )}
          </section>

          {/* Amenities */}
          <section id="amenities">
            <h2
              class="text-xl font-bold"
              style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
            >
              Amenities
            </h2>
            <div class="mt-4 grid gap-2 sm:grid-cols-2">
              {h.amenities.map((a) => (
                <div
                  key={a}
                  class="flex items-center gap-2 px-3 py-2.5"
                  style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius)"
                >
                  <span
                    aria-hidden="true"
                    class="shrink-0 text-[12px]"
                    style="color:var(--ui-success)"
                  >
                    ✓
                  </span>
                  <span class="text-[13px]" style="color:var(--ui-text-secondary)">
                    {a}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Location */}
          <section id="location">
            <h2
              class="text-xl font-bold"
              style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
            >
              Where you'll be
            </h2>
            <p class="mt-1 text-sm" style="color:var(--ui-text-muted)">
              {h.addressLine}
            </p>

            <div class="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              {/* CSS-only map concept */}
              <div
                class="relative overflow-hidden"
                style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);border-radius:var(--ui-radius);min-height:14rem"
                role="img"
                aria-label={`Map area for ${h.name} in ${h.neighborhood}, ${h.city} — layout concept, not a geocoded map`}
              >
                <div
                  class="absolute inset-0 opacity-50"
                  aria-hidden="true"
                  style="background-image:repeating-linear-gradient(0deg,transparent 0 30px,var(--ui-border) 30px 31px),repeating-linear-gradient(90deg,transparent 0 34px,var(--ui-border) 34px 35px)"
                />
                <span
                  class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full px-3 py-1.5 text-[12px] font-bold"
                  style="background:var(--ui-primary);color:var(--ui-on-primary);box-shadow:var(--ui-shadow-card)"
                  aria-hidden="true"
                >
                  {h.name}
                </span>
                <span
                  class="absolute right-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
                  style="background:var(--ui-surface);color:var(--ui-text-muted);border:1px solid var(--ui-border)"
                >
                  Map layout · concept
                </span>
              </div>

              {/* Location context */}
              <div
                class="p-4"
                style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
              >
                <h3 class="text-[14px] font-bold" style="color:var(--ui-text)">
                  Location
                </h3>
                <dl class="mt-3 flex flex-col gap-2">
                  {[
                    { label: "Neighborhood", value: h.neighborhood },
                    { label: "City", value: h.city },
                    { label: "Region", value: h.region },
                    { label: "Country", value: h.country },
                  ]
                    .filter((row) => Boolean(row.value))
                    .map((row) => (
                      <div
                        key={row.label}
                        class="flex items-center justify-between gap-3 text-[13px]"
                      >
                        <dt style="color:var(--ui-text-muted)">{row.label}</dt>
                        <dd
                          class="font-medium"
                          style="color:var(--ui-text-secondary)"
                        >
                          {row.value}
                        </dd>
                      </div>
                    ))}
                </dl>
                <div class="mt-3 border-t pt-3" style="border-color:var(--ui-divider)">
                  <a
                    href={`/hotels/in/${encodeURIComponent(h.cityQuery)}`}
                    class="text-[12px] font-semibold hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
                    style="color:var(--ui-primary)"
                  >
                    Browse all hotels in {h.city} →
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Policies */}
          <section id="policies">
            <h2
              class="text-xl font-bold"
              style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
            >
              Policies &amp; what to know
            </h2>
            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                {
                  title: "Cancellation",
                  body: h.policies.cancellationBlurb,
                },
                { title: "Payment", body: h.policies.paymentBlurb },
                { title: "Taxes & fees", body: h.policies.feesBlurb },
                {
                  title: "Check-in / out",
                  body: `Check-in from ${h.policies.checkInTime} · Check-out by ${h.policies.checkOutTime}`,
                },
              ].map((p) => (
                <div
                  key={p.title}
                  class="p-4"
                  style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
                >
                  <div class="text-sm font-bold" style="color:var(--ui-text)">
                    {p.title}
                  </div>
                  <p
                    class="mt-1.5 text-[13px]"
                    style="color:var(--ui-text-muted)"
                  >
                    {p.body}
                  </p>
                </div>
              ))}
            </div>

            {/* Trust badges — distributed model */}
            <div class="mt-4 flex flex-wrap gap-2">
              <span
                class="rounded-full px-3 py-1 text-[12px] font-semibold"
                style="background:var(--ui-success-soft, color-mix(in srgb, var(--ui-success) 12%, transparent));color:var(--ui-success);border:1px solid color-mix(in srgb, var(--ui-success) 20%, transparent)"
              >
                Total price shown up front
              </span>
              <span
                class="rounded-full px-3 py-1 text-[12px] font-semibold"
                style="background:var(--ui-surface-muted);color:var(--ui-text-muted);border:1px solid var(--ui-border)"
              >
                No countdown timers
              </span>
              <span
                class="rounded-full px-3 py-1 text-[12px] font-semibold"
                style="background:var(--ui-surface-muted);color:var(--ui-text-muted);border:1px solid var(--ui-border)"
              >
                No "1 room left!" pressure
              </span>
            </div>
          </section>

          {/* FAQ */}
          {h.faq && h.faq.length > 0 ? (
            <section id="faq">
              <h2
                class="text-xl font-bold"
                style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
              >
                Common questions
              </h2>
              <div class="mt-4 flex flex-col gap-3">
                {h.faq.map((qa) => (
                  <div
                    key={qa.q}
                    class="p-4"
                    style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius)"
                  >
                    <div
                      class="text-sm font-bold"
                      style="color:var(--ui-text)"
                    >
                      {qa.q}
                    </div>
                    <p
                      class="mt-1.5 text-[13px]"
                      style="color:var(--ui-text-muted)"
                    >
                      {qa.a}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        {/* ── Booking rail (desktop sticky) ── */}
        <aside
          class="min-w-0 lg:sticky lg:self-start"
          style={{ top: "var(--sticky-top-offset, 1.25rem)" }}
          id="booking"
          aria-label="Booking"
        >
          <div
            class="p-5"
            style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius-lg);box-shadow:var(--ui-shadow-panel)"
          >
            {/* Price module */}
            <div class="flex items-end justify-between gap-2">
              <div>
                <div
                  class="text-[11px] font-semibold uppercase tracking-[0.08em]"
                  style="color:var(--ui-text-muted)"
                >
                  {stayPriceDisplay.baseLabel}
                </div>
                <div class="mt-0.5 flex items-end gap-1.5">
                  <span
                    class="text-3xl font-extrabold leading-none"
                    style="color:var(--ui-text)"
                  >
                    {formatMoney(stayPriceDisplay.baseAmount, h.currency)}
                  </span>
                  <span
                    class="pb-0.5 text-sm"
                    style="color:var(--ui-text-muted)"
                  >
                    {formatPriceQualifier(stayPriceDisplay.baseQualifier)}
                  </span>
                </div>
              </div>
            </div>

            {stayPriceDisplay.totalAmount != null ? (
              <p class="mt-1 text-[12px]" style="color:var(--ui-text-muted)">
                {stayPriceDisplay.totalLabel}:{" "}
                <span class="font-semibold" style="color:var(--ui-text)">
                  {formatMoney(stayPriceDisplay.totalAmount, h.currency)}
                </span>
                {stayPriceDisplay.unitCountLabel ? (
                  <span> ({stayPriceDisplay.unitCountLabel})</span>
                ) : null}
              </p>
            ) : (
              <p class="mt-1 text-[12px]" style="color:var(--ui-text-muted)">
                Set dates to see your full stay total.
              </p>
            )}

            {stayPriceDisplay.supportText ? (
              <p class="mt-1 text-[12px]" style="color:var(--ui-text-muted)">
                {stayPriceDisplay.supportText}
              </p>
            ) : null}

            {/* Date / guests form */}
            <form method="get" class="mt-4 grid gap-2">
              <div class="grid grid-cols-2 gap-2">
                <div class="min-w-0">
                  <label
                    for="hotel-detail-check-in"
                    class="text-[10px] font-bold uppercase tracking-[0.1em]"
                    style="color:var(--ui-text-muted)"
                  >
                    Check-in
                  </label>
                  <DateField
                    id="hotel-detail-check-in"
                    name="checkIn"
                    value={stayCheckIn}
                    minValue={todayIsoDate}
                    class="w-full min-w-0"
                    inputClass="mt-1 w-full rounded-xl border border-[color:var(--ui-border)] bg-[color:var(--ui-surface-muted)] px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
                    iconLabel="Open check-in date picker"
                    overlayLabel="Check-in date picker"
                  />
                </div>
                <div class="min-w-0">
                  <label
                    for="hotel-detail-check-out"
                    class="text-[10px] font-bold uppercase tracking-[0.1em]"
                    style="color:var(--ui-text-muted)"
                  >
                    Check-out
                  </label>
                  <DateField
                    id="hotel-detail-check-out"
                    name="checkOut"
                    value={stayCheckOut}
                    minValue={minimumCheckoutDate}
                    class="w-full min-w-0"
                    inputClass="mt-1 w-full rounded-xl border border-[color:var(--ui-border)] bg-[color:var(--ui-surface-muted)] px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
                    iconLabel="Open check-out date picker"
                    overlayLabel="Check-out date picker"
                    overlayPosition="right"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label
                    for="hotel-detail-adults"
                    class="text-[10px] font-bold uppercase tracking-[0.1em]"
                    style="color:var(--ui-text-muted)"
                  >
                    Adults
                  </label>
                  <input
                    id="hotel-detail-adults"
                    name="adults"
                    class="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
                    style="border-color:var(--ui-border);background:var(--ui-surface-muted);color:var(--ui-text)"
                    placeholder="2"
                    value={
                      data.active.adults != null
                        ? String(data.active.adults)
                        : ""
                    }
                  />
                </div>
                <div>
                  <label
                    for="hotel-detail-rooms"
                    class="text-[10px] font-bold uppercase tracking-[0.1em]"
                    style="color:var(--ui-text-muted)"
                  >
                    Rooms
                  </label>
                  <input
                    id="hotel-detail-rooms"
                    name="rooms"
                    class="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
                    style="border-color:var(--ui-border);background:var(--ui-surface-muted);color:var(--ui-text)"
                    placeholder="1"
                    value={
                      data.active.rooms != null ? String(data.active.rooms) : ""
                    }
                  />
                </div>
              </div>

              <button
                class="mt-1 w-full rounded-xl py-2.5 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
                style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);color:var(--ui-text)"
                type="submit"
              >
                Update dates
              </button>
            </form>

            {/* Primary CTA */}
            <div class="mt-3">
              <a
                href="#rooms"
                class="block w-full rounded-xl py-3 text-center text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)] focus-visible:ring-offset-1"
                style="background:var(--ui-primary);color:var(--ui-on-primary)"
              >
                Select a room
              </a>
            </div>

            {/* Decisioning actions */}
            <div class="mt-3 flex flex-wrap gap-2">
              <SaveButton
                saved={isShortlisted(
                  decisioning.state,
                  "hotels",
                  decisionItem.id,
                )}
                idleLabel="♡ Save"
                activeLabel="♥ Saved"
                telemetry={{
                  vertical: "hotels",
                  itemId: decisionItem.id,
                  surface: "detail",
                }}
                onToggle$={onToggleShortlist$}
              />
              <CompareButton
                selected={compared}
                disabled={compareDisabled}
                telemetry={{
                  vertical: "hotels",
                  itemId: decisionItem.id,
                  surface: "detail",
                }}
                onToggle$={onToggleCompare$}
              />
              <AddToTripButton item={decisionItem} telemetrySource="detail" />
            </div>

            {/* Availability + refresh */}
            <div
              class="mt-4 border-t pt-4"
              style="border-color:var(--ui-divider)"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div
                    class="text-[12px] font-semibold"
                    style="color:var(--ui-text)"
                  >
                    {h.availabilityConfidence?.label || "Availability unknown"}
                    {h.freshness ? ` · ${h.freshness.relativeLabel}` : ""}
                  </div>
                  <div
                    class="mt-0.5 text-[12px]"
                    style="color:var(--ui-text-muted)"
                  >
                    {h.availabilityConfidence?.supportText ||
                      "Refresh before booking to confirm current inventory."}
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
                  telemetry={{
                    vertical: "hotels",
                    surface: "detail",
                    refreshType: "inventory_revalidation",
                    itemCount: 1,
                  }}
                />
              </div>

              {refreshPriceSummary.value ? (
                <div
                  class="mt-3 rounded-xl px-4 py-3 text-sm"
                  style="background:var(--ui-accent-soft);border:1px solid var(--ui-border);color:var(--ui-text)"
                >
                  {refreshPriceSummary.value}
                </div>
              ) : null}
            </div>

            {/* Confidence note */}
            <p
              class="mt-3 text-[12px]"
              style="color:var(--ui-text-muted)"
            >
              Prices and availability update when you set dates. Shareable link
              — no account needed to compare.
            </p>
          </div>

          {/* Trust mini-card */}
          <div
            class="mt-4 p-5"
            style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
          >
            <div class="text-sm font-bold" style="color:var(--ui-text)">
              Why Andacity
            </div>
            <ul class="mt-3 flex flex-col gap-2">
              {[
                "Transparent total pricing",
                "Policies shown before you book",
                "Compare stays without pressure",
              ].map((t) => (
                <li
                  key={t}
                  class="flex items-center gap-2 text-[13px]"
                  style="color:var(--ui-text-secondary)"
                >
                  <span aria-hidden="true" style="color:var(--ui-success)">
                    ✓
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <div class="mt-4">
              <a
                href={data.searchHref}
                class="block w-full rounded-xl py-2 text-center text-[13px] font-semibold transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
                style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);color:var(--ui-text)"
              >
                Compare more hotels in {h.city} →
              </a>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile spacer so sticky CTA doesn't cover content */}
      <div class="h-20 lg:hidden" />

      {/* ── Mobile sticky CTA ── */}
      <div
        class="fixed inset-x-0 bottom-0 z-40 lg:hidden"
        style="background:var(--ui-surface);border-top:1px solid var(--ui-border);box-shadow:0 -8px 24px rgba(8,12,22,0.12)"
      >
        <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
          <div class="min-w-0">
            <div class="flex items-baseline gap-1.5">
              <span
                class="text-[11px] font-semibold uppercase tracking-[0.08em]"
                style="color:var(--ui-text-muted)"
              >
                {stayPriceDisplay.baseLabel}
              </span>
              <span
                class="truncate text-lg font-extrabold"
                style="color:var(--ui-text)"
              >
                {formatMoney(stayPriceDisplay.baseAmount, h.currency)}
              </span>
              <span
                class="truncate text-[12px]"
                style="color:var(--ui-text-muted)"
              >
                {formatPriceQualifier(stayPriceDisplay.baseQualifier)}
              </span>
            </div>
            <div class="truncate text-[11px]" style="color:var(--ui-text-muted)">
              {data.partyLabel}
            </div>
          </div>

          <a
            href="#rooms"
            class="inline-flex shrink-0 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--ui-ring)]"
            style="background:var(--ui-primary);color:var(--ui-on-primary);min-height:44px"
          >
            Select a room
          </a>
        </div>
      </div>

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

  const canonicalHref = new URL(
    `/hotels/${encodeURIComponent(data.hotel.slug)}`,
    url.origin,
  ).href;

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

/* ------------------------------------------------------------------ */
/* Room card — premium visual using --ui-* tokens                     */
/* ------------------------------------------------------------------ */

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
      <article
        class="overflow-hidden"
        style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
      >
        <div class="grid gap-0 sm:grid-cols-[180px_minmax(0,1fr)]">
          {/* Room media — gradient placeholder; room-level images are deferred */}
          <div
            class="min-h-[8rem]"
            style="background-image:var(--ui-hero)"
            role="img"
            aria-label={`${room.name} room photo`}
          />

          <div class="p-4">
            <h3
              class="text-base font-bold"
              style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
            >
              {room.name}
            </h3>
            <p class="mt-0.5 text-[12px]" style="color:var(--ui-text-muted)">
              Sleeps {room.sleeps} · {room.beds} · {room.sizeSqft} sq ft
            </p>

            {room.features.length ? (
              <div class="mt-2 flex flex-wrap gap-1.5">
                {room.features.map((f) => (
                  <span
                    key={f}
                    class="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                    style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);color:var(--ui-text-muted)"
                  >
                    {f}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Rate row */}
        <div
          class="border-t"
          style="border-color:var(--ui-divider)"
        >
          <div class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                {room.refundable ? (
                  <p
                    class="inline-flex items-center gap-1 text-[12px] font-medium"
                    style="color:var(--ui-success)"
                  >
                    <span aria-hidden="true">✓</span>
                    Free cancellation
                  </p>
                ) : (
                  <p class="text-[12px] font-medium" style="color:var(--ui-text-muted)">
                    Cancellation terms vary
                  </p>
                )}
                {room.payLater ? (
                  <span
                    class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    style="background:var(--ui-accent-soft);color:var(--ui-accent);border:1px solid color-mix(in srgb, var(--ui-accent) 20%, transparent)"
                  >
                    Pay later
                  </span>
                ) : (
                  <span
                    class="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                    style="background:var(--ui-surface-muted);color:var(--ui-text-muted);border:1px solid var(--ui-border)"
                  >
                    Prepay
                  </span>
                )}
              </div>

              {room.badges.length ? (
                <div class="mt-2 flex flex-wrap gap-1.5">
                  {room.badges.map((b) => (
                    <span
                      key={b}
                      class="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                      style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);color:var(--ui-text-muted)"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div class="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center sm:text-right">
              <div>
                <div
                  class="text-lg font-extrabold leading-none"
                  style="color:var(--ui-price)"
                >
                  {formatMoney(priceDisplay.baseAmount, currency)}
                </div>
                <div class="text-[11px]" style="color:var(--ui-text-muted)">
                  {formatPriceQualifier(priceDisplay.baseQualifier)}
                </div>
                {priceDisplay.totalAmount != null ? (
                  <div class="mt-1 text-[11px]" style="color:var(--ui-text-muted)">
                    Total: {formatMoney(priceDisplay.totalAmount, currency)}
                  </div>
                ) : (
                  <div class="mt-1 text-[11px]" style="color:var(--ui-text-muted)">
                    Add dates for total
                  </div>
                )}
              </div>
              <a
                href="#booking"
                class="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)] focus-visible:ring-offset-1"
                style="background:var(--ui-primary);color:var(--ui-on-primary);min-height:36px"
                aria-label={`Select ${room.name}`}
              >
                Select
              </a>
            </div>
          </div>
        </div>
      </article>
    );
  },
);

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const resolveReviewLabel = (rating: number) => {
  if (rating >= 9.5) return "Exceptional";
  if (rating >= 9.0) return "Superb";
  if (rating >= 8.5) return "Excellent";
  if (rating >= 8.0) return "Very good";
  if (rating >= 7.0) return "Good";
  return "Reviewed";
};

const buildPolicyHighlights = (h: Hotel): string[] => {
  const out: string[] = [];
  if (h.policies.freeCancellation) out.push("Free cancellation available");
  if (h.policies.payLater) out.push("Pay later options");
  if (h.policies.noResortFees) out.push("No resort fees");
  out.push("Transparent totals");
  return out;
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

/* ------------------------------------------------------------------ */
/* Stay params + pricing                                              */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

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
