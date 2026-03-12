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
import { Page } from "~/components/site/Page";
import {
  resolveAvailabilityAsyncState,
  summarizeAvailabilitySignals,
  type BookingAsyncState,
} from "~/lib/async/booking-async-state";
import { revalidateInventoryApi } from "~/lib/inventory/inventory-api";
import {
  buildAvailabilityConfidence,
  evaluateCarAvailabilityContext,
} from "~/lib/inventory/availability-confidence";
import {
  buildCarPriceDisplay,
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
import { buildCarDetailSavedItem } from "~/lib/save-compare/item-builders";
import { loadCarRentalBySlugFromDb } from "~/lib/queries/car-rentals-pages.server";
import { computeDays } from "~/lib/search/car-rentals/dates";
import {
  DecisionSummarySection,
  type DecisionSummaryBlock,
  type DecisionSummaryCaveat,
} from "~/components/decision/DecisionSummarySection";

export const useCarRental = routeLoader$(async ({ params, url, error }) => {
  const slug = String(params.slug || "")
    .trim()
    .toLowerCase();
  const active = parseRentalParams(url.searchParams);
  const rental = await loadCarRentalBySlugFromDb(slug).catch((cause) => {
    const message =
      cause instanceof Error
        ? cause.message
        : "Failed to load car rental details.";

    return {
      slug,
      active,
      loadError: message,
    };
  });

  if (rental && typeof rental === "object" && "loadError" in rental) {
    return rental;
  }

  if (!rental) throw error(404, "Not found");

  const availabilityAssessment = evaluateCarAvailabilityContext({
    availability: rental.availability || null,
    pickupDate: active.pickupDate,
    dropoffDate: active.dropoffDate,
  });

  return {
    ...rental,
    active,
    availabilityConfidence: buildAvailabilityConfidence({
      freshness: rental.freshness,
      ...availabilityAssessment,
    }),
    loadError: null as string | null,
  };
});

export default component$(() => {
  const decisioning = useDecisioning();
  const data = useCarRental().value;
  const location = useLocation();
  useBookingAbandonmentTelemetry({
    vertical: "cars",
    stage: "detail",
    enabled: !data.loadError,
    payload: {
      surface: "detail_page",
    },
    trackOnCleanup: false,
  });

  if (data.loadError) {
    return (
      <Page
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Car Rentals", href: "/car-rentals" },
          { label: "Car rental details" },
        ]}
      >
        <div class="mt-6 rounded-[var(--radius-xl)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
          <AsyncStateNotice
            state="failed"
            title="Car rental details could not be loaded"
            message={data.loadError}
          />
          <AsyncRetryControl
            class="mt-4"
            message="Retry this page or return to car rental search."
            label="Retry car rental details"
            href={location.url.pathname + location.url.search}
            telemetry={{
              vertical: "cars",
              surface: "detail",
              retryType: "detail_reload",
              context: "load_failure",
            }}
          />
        </div>
      </Page>
    );
  }

  const rental = data as Exclude<typeof data, { loadError: string }>;

  const heroImg = rental.images[0] || "/img/demo/car-1.jpg";
  const priceFrom = Math.min(...rental.offers.map((o) => o.priceFrom));
  const refreshHref = `${location.url.pathname}${location.url.search}`;
  const refreshSnapshotId = `car-detail:${refreshHref}`;
  const refreshPriceChange = useSignal<PriceChange | null>(null);
  const refreshPriceSummary = useSignal<string | null>(null);
  const availabilitySignals = summarizeAvailabilitySignals([
    { availabilityConfidence: rental.availabilityConfidence },
  ]);
  const asyncState = resolveAvailabilityAsyncState({
    itemCount: 1,
    isRefreshing: location.isNavigating,
    signals: availabilitySignals,
  });
  const statusNotice = buildCarDetailStatusNotice(asyncState, {
    partialCount: availabilitySignals.partialCount,
    staleCount: availabilitySignals.staleCount,
    failedCount: availabilitySignals.failedCount,
  });
  const rentalDays = computeDays(
    rental.active.pickupDate || null,
    rental.active.dropoffDate || null,
  );

  const onRevalidateRental$ = $(async () => {
    if (rental.inventoryId == null) {
      throw new Error("This car rental cannot be revalidated right now.");
    }

    storeRefreshPriceSnapshot(refreshSnapshotId, [
      {
        id: rental.slug,
        amount: priceFrom,
        currencyCode: rental.currency,
      },
    ]);

    await revalidateInventoryApi({
      itemType: "car",
      inventoryIds: [rental.inventoryId],
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
          id: rental.slug,
          amount: priceFrom,
          currencyCode: rental.currency,
        },
      ],
      "Daily rate",
    );

    refreshPriceChange.value = nextChanges[rental.slug] || null;
    refreshPriceSummary.value = describePriceChangeCollection(
      Object.values(nextChanges),
    );
  });

  const headlinePriceDisplay = {
    ...buildCarPriceDisplay({
      currencyCode: rental.currency,
      dailyRate: priceFrom,
      days: rentalDays,
    }),
    delta: refreshPriceChange.value,
  };
  const decisionItem = buildCarDetailSavedItem(
    rental,
    rental.active,
    headlinePriceDisplay,
    refreshHref,
  );
  const compared = isCompared(decisioning.state, "cars", decisionItem.id);
  const compareDisabled =
    !compared &&
    decisioning.state.compare.cars.length >= decisioning.state.compareLimit;

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    decisioning.recordRecentlyViewed$("cars", decisionItem);
  });

  const onToggleShortlist$ = $(() => {
    decisioning.toggleShortlist$("cars", decisionItem);
  });

  const onToggleCompare$ = $(() => {
    decisioning.toggleCompare$("cars", decisionItem);
  });

  const onOpenCompare$ = $(() => {
    if (decisioning.state.compare.cars.length < 2) return;
    trackBookingEvent("booking_compare_opened", {
      vertical: "cars",
      surface: "detail",
      compare_count: decisioning.state.compare.cars.length,
    });
    decisioning.openCompare$("cars");
  });

  const onClearCompare$ = $(() => {
    trackBookingEvent("booking_compare_cleared", {
      vertical: "cars",
      surface: "detail",
      compare_count: decisioning.state.compare.cars.length,
    });
    decisioning.clearComparedItems$("cars");
  });

  return (
    <Page
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Car Rentals", href: "/car-rentals" },
        {
          label: rental.city,
          href: `/car-rentals/in/${encodeURIComponent(rental.cityQuery)}`,
        },
        { label: rental.name },
      ]}
    >
      <div class="flex flex-col gap-6">
        {statusNotice ? (
          <AsyncStateNotice
            state={asyncState}
            title={statusNotice.title}
            message={statusNotice.message}
          />
        ) : null}

        {/* Header */}
        <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div class="min-w-0">
            <h1 class="text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
              {rental.name}
            </h1>

            <div class="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span class="t-badge">
                {rental.rating.toFixed(1)} ★{" "}
                <span class="text-[color:var(--color-text-muted)]">
                  ({rental.reviewCount.toLocaleString("en-US")})
                </span>
              </span>

              <span class="text-[color:var(--color-text-muted)]">•</span>

              <span class="text-[color:var(--color-text-muted)]">
                {rental.city}, {rental.region}
              </span>

              <span class="text-[color:var(--color-text-muted)]">•</span>

              <span class="text-[color:var(--color-text-muted)]">
                {rental.pickupArea}
              </span>
            </div>

            <p class="mt-4 max-w-[80ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
              {rental.summary}
            </p>

            <div class="mt-4 flex flex-wrap gap-2">
              <a
                class="t-btn-primary px-4 text-center"
                href={buildSearchHref(
                  rental.cityQuery,
                  1,
                  rental.active.pickupDate,
                  rental.active.dropoffDate,
                )}
              >
                Search in {rental.city}
              </a>
              <a
                class="t-btn-primary px-4 text-center"
                href={buildCityHref(
                  rental.cityQuery,
                  rental.active.pickupDate,
                  rental.active.dropoffDate,
                )}
              >
                Car rentals in {rental.city}
              </a>
            </div>
          </div>

          <div class="lg:sticky" style={{ top: "var(--sticky-top-offset)" }}>
            <div class="t-card p-5 bg-surface">
              <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
                <span class="t-badge">Cars</span>
                <div class="flex flex-wrap gap-2">
                  <SaveButton
                    saved={isShortlisted(
                      decisioning.state,
                      "cars",
                      decisionItem.id,
                    )}
                    idleLabel="Shortlist"
                    activeLabel="Shortlisted"
                    telemetry={{
                      vertical: "cars",
                      itemId: decisionItem.id,
                      surface: "detail",
                    }}
                    onToggle$={onToggleShortlist$}
                  />
                  <CompareButton
                    selected={compared}
                    disabled={compareDisabled}
                    telemetry={{
                      vertical: "cars",
                      itemId: decisionItem.id,
                      surface: "detail",
                    }}
                    onToggle$={onToggleCompare$}
                  />
                  <AddToTripButton
                    item={decisionItem}
                    telemetrySource="detail"
                  />
                </div>
              </div>

              <div class="mt-1 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-panel)] px-4 py-4">
                <div class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                  {headlinePriceDisplay.baseLabel}
                </div>
                <div class="mt-2 flex items-end gap-2">
                  <span class="text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
                    {formatMoney(
                      headlinePriceDisplay.baseAmount,
                      rental.currency,
                    )}
                  </span>
                  <span class="pb-1 text-sm text-[color:var(--color-text-muted)]">
                    {formatPriceQualifier(headlinePriceDisplay.baseQualifier)}
                  </span>
                </div>
                {headlinePriceDisplay.baseTotalAmount != null ? (
                  <div class="mt-2 text-xs text-[color:var(--color-text-muted)]">
                    {headlinePriceDisplay.baseTotalLabel}:{" "}
                    <span class="font-medium text-[color:var(--color-text)]">
                      {formatMoney(
                        headlinePriceDisplay.baseTotalAmount,
                        rental.currency,
                      )}
                    </span>
                    {headlinePriceDisplay.unitCountLabel ? (
                      <span class="ml-1">
                        ({headlinePriceDisplay.unitCountLabel})
                      </span>
                    ) : null}
                  </div>
                ) : null}
                {headlinePriceDisplay.supportText ? (
                  <div class="mt-2 text-xs text-[color:var(--color-text-muted)]">
                    {headlinePriceDisplay.supportText}
                  </div>
                ) : null}
              </div>

              <div class="mt-4 flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="text-xs font-semibold text-[color:var(--color-text-strong)]">
                    {rental.availabilityConfidence?.label ||
                      "Unknown availability"}
                    {rental.freshness
                      ? ` · ${rental.freshness.relativeLabel}`
                      : ""}
                  </div>
                  <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                    {buildCarSidebarStatusNote(rental)}
                  </div>
                </div>

                <InventoryRefreshControl
                  id={refreshSnapshotId}
                  mode={rental.inventoryId != null ? "action" : "unsupported"}
                  onRefresh$={
                    rental.inventoryId != null ? onRevalidateRental$ : undefined
                  }
                  reloadHref={refreshHref}
                  reloadOnSuccess={true}
                  label="Refresh"
                  refreshingLabel="Refreshing..."
                  refreshedLabel="Refreshed"
                  failedLabel="Retry"
                  unsupportedLabel="Unavailable"
                  unsupportedMessage="This car rental cannot refresh availability right now."
                  successMessage="Car rental availability was refreshed. Any daily-rate changes are highlighted below."
                  failureMessage="Failed to refresh this car rental's availability signals."
                  compact={true}
                  align="right"
                  disabled={location.isNavigating}
                  telemetry={{
                    vertical: "cars",
                    surface: "detail",
                    refreshType: "inventory_revalidation",
                    itemCount: 1,
                  }}
                />
              </div>

              {refreshPriceSummary.value ? (
                <div class="mt-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-primary-50)] px-4 py-3 text-sm text-[color:var(--color-text)]">
                  {refreshPriceSummary.value}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <DecisionSummarySection
          title="Should you shortlist this rental?"
          description="Quick fit and tradeoff scan from the current rental data."
          blocks={buildCarDecisionSummaryBlocks(rental, headlinePriceDisplay)}
          primaryBlockCount={3}
          detailTitle="Rental notes and constraints"
          detailCtaLabel="Notes"
          caveat={buildCarDecisionCaveat(rental)}
          note="Derived from current provider policies, listed offers, pickup fields, and availability signals."
        />

        {/* Hero image */}
        <div class="t-card overflow-hidden">
          <div class="bg-[color:var(--color-neutral-50)]">
            <img
              class="h-[260px] w-full object-cover sm:h-[320px] lg:h-[360px]"
              src={heroImg}
              alt={rental.name}
              loading="eager"
              width={1280}
              height={720}
            />
          </div>
        </div>

        {/* Inclusions + Pickup */}
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="t-card p-5">
            <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
              What’s included
            </div>

            <div class="mt-3 flex flex-wrap gap-2">
              {rental.inclusions.map((x) => (
                <span key={x} class="t-badge">
                  {x}
                </span>
              ))}
            </div>

            <div class="mt-5 grid gap-2 text-sm">
              <div class="text-[color:var(--color-text-muted)]">
                Pickup location
              </div>
              <div class="text-[color:var(--color-text-strong)]">
                {rental.pickupArea}{" "}
                <span class="text-[color:var(--color-text-muted)]">·</span>{" "}
                {rental.pickupAddressLine}
              </div>
            </div>
          </div>

          <div class="t-card p-5">
            <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
              Policy highlights
            </div>

            <div class="mt-3 grid gap-2 text-sm">
              <div>
                <div class="text-[color:var(--color-text-muted)]">
                  Cancellation
                </div>
                <div class="mt-1 text-[color:var(--color-text)]">
                  {rental.policies.cancellationBlurb}
                </div>
              </div>

              <div class="pt-2">
                <div class="text-[color:var(--color-text-muted)]">Payment</div>
                <div class="mt-1 text-[color:var(--color-text)]">
                  {rental.policies.paymentBlurb}
                </div>
              </div>

              <div class="pt-2">
                <div class="text-[color:var(--color-text-muted)]">Fees</div>
                <div class="mt-1 text-[color:var(--color-text)]">
                  {rental.policies.feesBlurb}
                </div>
              </div>

              <div class="pt-2">
                <div class="text-[color:var(--color-text-muted)]">Deposit</div>
                <div class="mt-1 text-[color:var(--color-text)]">
                  {rental.policies.depositBlurb}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Offers */}
        <div class="t-card p-5">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                Available cars
              </div>
              <div class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                Choose an offer. Policies may vary per offer.
              </div>
            </div>

            <a
              class="t-btn-primary px-4 text-center"
              href={buildSearchHref(rental.cityQuery, 1)}
            >
              See more results
            </a>
          </div>

          <div class="mt-5 grid gap-3 lg:grid-cols-2">
            {rental.offers.map((o) => {
              const offerPriceDisplay = buildCarPriceDisplay({
                currencyCode: rental.currency,
                dailyRate: o.priceFrom,
                days: rentalDays,
              });

              return (
                <div key={o.id} class="t-card p-5 hover:bg-white">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                        {o.name}
                      </div>
                      <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                        {o.transmission} · {o.doors} doors · {o.seats} seats ·{" "}
                        {o.bags}
                        {o.ac ? " · A/C" : ""}
                      </div>
                    </div>

                    <div class="shrink-0 text-right">
                      <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                        {offerPriceDisplay.baseLabel}{" "}
                        {formatMoney(
                          offerPriceDisplay.baseAmount,
                          rental.currency,
                        )}
                        <span class="ml-1 text-[color:var(--color-text-muted)]">
                          {formatPriceQualifier(
                            offerPriceDisplay.baseQualifier,
                          )}
                        </span>
                      </div>
                      {offerPriceDisplay.baseTotalAmount != null ? (
                        <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                          {offerPriceDisplay.baseTotalLabel}:{" "}
                          <span class="font-medium text-[color:var(--color-text)]">
                            {formatMoney(
                              offerPriceDisplay.baseTotalAmount,
                              rental.currency,
                            )}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div class="mt-3 flex flex-wrap gap-2">
                    {o.badges.map((b) => (
                      <span
                        key={b}
                        class={
                          b.toLowerCase() === "premium"
                            ? "t-badge t-badge--deal"
                            : "t-badge"
                        }
                      >
                        {b}
                      </span>
                    ))}

                    {o.freeCancellation ? (
                      <span class="t-badge t-badge--deal">
                        Free cancellation
                      </span>
                    ) : (
                      <span class="t-badge">Cancellation varies</span>
                    )}

                    {o.payAtCounter ? (
                      <span class="t-badge t-badge--deal">Pay at counter</span>
                    ) : (
                      <span class="t-badge">Prepay</span>
                    )}
                  </div>

                  <div class="mt-3 text-xs text-[color:var(--color-text-muted)]">
                    Key features:{" "}
                    <span class="text-[color:var(--color-text)]">
                      {o.features.slice(0, 4).join(" · ")}
                    </span>
                  </div>

                  <div class="mt-3 text-xs text-[color:var(--color-text-muted)]">
                    {offerPriceDisplay.supportText}
                  </div>

                  <div class="mt-4 flex flex-wrap gap-2">
                    <a
                      class="t-btn-primary px-4 text-center"
                      href={buildSearchHref(rental.cityQuery, 1)}
                    >
                      Check availability
                    </a>
                    <a
                      class="t-btn-primary px-4 text-center"
                      href={buildCarRentalsHref()}
                    >
                      Back to car rentals
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ */}
        <div class="t-card p-5">
          <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
            FAQ
          </div>

          <div class="mt-4 grid gap-3">
            {rental.faq.map((x) => (
              <div key={x.q} class="t-card p-5">
                <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                  {x.q}
                </div>
                <div class="mt-2 text-sm text-[color:var(--color-text-muted)]">
                  {x.a}
                </div>
              </div>
            ))}
          </div>
        </div>

        {decisioning.state.compare.cars.length ? (
          <CompareTray
            vertical="cars"
            compareCount={decisioning.state.compare.cars.length}
            onOpen$={onOpenCompare$}
            onClear$={onClearCompare$}
          />
        ) : null}

        <CompareSheet
          open={
            decisioning.state.compareOpen &&
            decisioning.state.compareVertical === "cars" &&
            decisioning.state.compare.cars.length >= 2
          }
          vertical="cars"
          items={decisioning.state.compare.cars}
        />
      </div>
    </Page>
  );
});

export const head: DocumentHead = ({ resolveValue, params, url }) => {
  const rental = resolveValue(useCarRental);
  if (rental.loadError) {
    return {
      title: "Car rental details | Andacity Travel",
      meta: [
        {
          name: "description",
          content: "Retry car rental details or return to search results.",
        },
      ],
      links: [
        { rel: "canonical", href: new URL(url.pathname, url.origin).href },
      ],
    };
  }

  const detail = rental as Exclude<typeof rental, { loadError: string }>;

  const title = `${detail.name} | Car Rentals | Andacity Travel`;
  const description = detail.summary;

  const canonicalHref = new URL(
    buildCarRentalDetailHref(params.slug),
    url.origin,
  ).href;

  const priceFrom = detail.offers.length
    ? Math.min(...detail.offers.map((o) => o.priceFrom))
    : detail.fromDaily;

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Car Rentals",
            item: new URL("/car-rentals", url.origin).href,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: detail.name,
            item: canonicalHref,
          },
        ],
      },
      {
        "@type": "Product",
        name: detail.name,
        description: detail.summary,
        image: detail.images.map((src) => new URL(src, url.origin).href),
        brand: { "@type": "Brand", name: "Andacity" },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: detail.rating,
          reviewCount: detail.reviewCount,
        },
        offers: {
          "@type": "Offer",
          priceCurrency: detail.currency,
          price: priceFrom,
          availability: "https://schema.org/InStock",
          url: canonicalHref,
        },
      },
    ],
  });

  return {
    title,
    meta: [
      { name: "description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: canonicalHref },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: canonicalHref }],
    scripts: [
      {
        key: "ld-car-rental-detail",
        props: { type: "application/ld+json" },
        script: jsonLd,
      },
    ],
  };
};

const buildCarDetailStatusNotice = (
  state: BookingAsyncState,
  input: {
    partialCount: number;
    staleCount: number;
    failedCount: number;
  },
) => {
  if (state === "refreshing") {
    return {
      title: "Refreshing car rental details",
      message:
        "Updated availability and pricing are loading. Current rental details stay visible until the refresh completes.",
    };
  }

  if (state === "partial") {
    return {
      title: "This rental only partially matches",
      message: `${input.partialCount.toLocaleString("en-US")} availability signal indicates the requested pickup or dropoff dates only partially match this rental. Refresh availability before relying on this price.`,
    };
  }

  if (state === "stale") {
    const affected = input.staleCount + input.failedCount;
    return {
      title: "Availability needs recheck",
      message: `${affected.toLocaleString("en-US")} availability signal${affected === 1 ? "" : "s"} for this rental are stale or failed. Refresh availability before treating this rental as current.`,
    };
  }

  return undefined;
};

type LoadedCarRental = Exclude<
  ReturnType<typeof useCarRental>["value"],
  { loadError: string }
>;

const buildCarDecisionFacts = (
  rental: LoadedCarRental,
  priceDisplay: ReturnType<typeof buildCarPriceDisplay>,
): Array<{
  label: string;
  value: string;
  detail?: string | null;
  tone?: "warning" | "default";
}> => {
  const offerCount = rental.offers.length;
  const freeCancellationCount = rental.offers.filter(
    (offer) => offer.freeCancellation,
  ).length;
  const payAtCounterCount = rental.offers.filter(
    (offer) => offer.payAtCounter,
  ).length;
  const priceDetail = [
    priceDisplay.baseTotalAmount != null
      ? `${priceDisplay.baseTotalLabel || "Base rental total"} ${formatMoney(
          priceDisplay.baseTotalAmount,
          rental.currency,
        )}${priceDisplay.unitCountLabel ? ` for ${priceDisplay.unitCountLabel}` : ""}`
      : "Add pickup and dropoff dates to estimate the trip total.",
    priceDisplay.supportText || null,
    priceDisplay.delta &&
    priceDisplay.delta.status !== "unchanged" &&
    priceDisplay.delta.status !== "unavailable"
      ? formatPriceChange(priceDisplay.delta, rental.currency)
      : null,
  ]
    .filter(Boolean)
    .join(". ");

  return [
    {
      label: "Price summary",
      value: `From ${formatMoney(rental.fromDaily, rental.currency)}${formatPriceQualifier(
        priceDisplay.baseQualifier,
      )}`,
      detail: priceDetail,
    },
    {
      label: "Offer terms",
      value: buildCarOfferTermsValue(
        offerCount,
        freeCancellationCount,
        payAtCounterCount,
      ),
      detail: buildCarOfferTermsDetail(
        offerCount,
        freeCancellationCount,
        payAtCounterCount,
      ),
    },
    {
      label: "Important constraints",
      value: buildCarConstraintSummary(rental),
      detail: buildCarConstraintDetail(rental),
      tone: rental.availabilityConfidence?.degraded ? "warning" : "default",
    },
  ];
};

const buildCarDecisionSummaryBlocks = (
  rental: LoadedCarRental,
  priceDisplay: ReturnType<typeof buildCarPriceDisplay>,
): DecisionSummaryBlock[] => {
  const trustFacts = buildCarDecisionFacts(rental, priceDisplay);
  const categoryPreview = Array.from(
    new Set(rental.offers.map((offer) => offer.category).filter(Boolean)),
  ).slice(0, 3);
  const keyNotes = [
    `${rental.rating.toFixed(1)} ★ from ${rental.reviewCount.toLocaleString("en-US")} renter reviews.`,
    rental.offers.length
      ? `${rental.offers.length.toLocaleString("en-US")} listed offer${rental.offers.length === 1 ? "" : "s"} right now.`
      : "Offer details are not listed yet.",
    rental.inclusions.length
      ? `Inclusions shown: ${joinShortList(rental.inclusions.slice(0, 3))}.`
      : null,
    categoryPreview.length
      ? `Vehicle mix includes ${joinShortList(categoryPreview)}.`
      : null,
    `Minimum driver age ${rental.policies.minDriverAge}+; fuel policy ${rental.policies.fuelPolicy}.`,
  ].filter(Boolean) as string[];
  const constraints = rental.availability
    ? [
        buildDayRangeLabel(
          rental.availability.minDays,
          rental.availability.maxDays,
        ),
        `Pickup window: ${formatCalendarDate(
          rental.availability.pickupStart,
        )} to ${formatCalendarDate(rental.availability.pickupEnd)}.`,
        rental.availability.blockedWeekdays.length
          ? `Blocked pickup days: ${formatWeekdayList(
              rental.availability.blockedWeekdays,
            )}.`
          : "No blocked pickup weekdays are posted.",
      ]
    : ["Live rental window is unavailable; refresh after adding dates."];
  const location = [
    [rental.pickupArea, rental.city, rental.region].filter(Boolean).join(", "),
    rental.pickupAddressLine,
    inferPickupContext(rental),
  ].filter(Boolean) as string[];

  return [
    ...trustFacts.map((row) => ({
      label: row.label,
      items: [row.value, row.detail].filter(Boolean) as string[],
      tone: row.tone,
    })),
    { label: "Rental notes", items: keyNotes },
    { label: "Location context", items: location },
    {
      label: "Rental rules",
      items: constraints,
      tone: rental.availabilityConfidence?.degraded ? "warning" : "default",
    },
  ];
};

const buildCarDecisionCaveat = (
  rental: LoadedCarRental,
): DecisionSummaryCaveat | null => {
  const confidence = rental.availabilityConfidence;
  if (!confidence?.degraded) return null;

  return {
    title:
      confidence.state === "unavailable"
        ? "Current dates do not cleanly fit this rental"
        : "Availability confidence is reduced",
    summary:
      confidence.state === "unavailable"
        ? "Review pickup rules before relying on this rental."
        : "Open the detail notes before treating this rental as current.",
    message: [
      confidence.supportText ||
        "Refresh availability before relying on this rental.",
      "Offer-level policies and pickup fees can still change by vehicle class.",
    ].join(" "),
    tone: confidence.state === "unavailable" ? "critical" : "warning",
  };
};

const buildCarConstraintSummary = (rental: LoadedCarRental) => {
  if (!rental.availability) {
    return `Driver age ${rental.policies.minDriverAge}+ · live rental window unavailable`;
  }

  const blockedLabel =
    rental.availability.blockedWeekdays.length > 0
      ? "some pickup days blocked"
      : "no blocked weekdays posted";

  return `${rental.availability.minDays}-${rental.availability.maxDays} day rentals · ${blockedLabel}`;
};

const buildCarConstraintDetail = (rental: LoadedCarRental) => {
  if (!rental.availability) {
    return "Refresh availability after adding dates to confirm pickup and dropoff rules.";
  }

  return `Pickup window ${formatCalendarDate(
    rental.availability.pickupStart,
  )} to ${formatCalendarDate(rental.availability.pickupEnd)}.`;
};

const buildCarSidebarStatusNote = (rental: LoadedCarRental) => {
  if (rental.availabilityConfidence?.supportText) {
    return rental.availabilityConfidence.supportText;
  }

  return "Refresh before booking to confirm the latest inventory.";
};

const buildCarOfferTermsValue = (
  offerCount: number,
  freeCancellationCount: number,
  payAtCounterCount: number,
) => {
  if (!offerCount) return "Offer terms load with current inventory";

  if (
    freeCancellationCount === offerCount &&
    payAtCounterCount === offerCount
  ) {
    return "All listed offers show flexible terms";
  }

  if (freeCancellationCount > 0 || payAtCounterCount > 0) {
    return "Flexibility depends on the offer you choose";
  }

  return "Listed offers skew toward firmer terms";
};

const buildCarOfferTermsDetail = (
  offerCount: number,
  freeCancellationCount: number,
  payAtCounterCount: number,
) => {
  if (!offerCount) {
    return "Refresh offer inventory to confirm cancellation and payment options.";
  }

  return `${freeCancellationCount} of ${offerCount} offer${offerCount === 1 ? "" : "s"} show free cancellation. ${payAtCounterCount} of ${offerCount} show pay-at-counter terms.`;
};

const buildDayRangeLabel = (minDays: number, maxDays: number) => {
  if (minDays === maxDays) {
    return `Rental length is fixed at ${minDays} day${minDays === 1 ? "" : "s"}.`;
  }

  return `Rental length must be ${minDays}-${maxDays} days.`;
};

const inferPickupContext = (rental: LoadedCarRental) => {
  const locationText =
    `${rental.pickupArea} ${rental.pickupAddressLine}`.toLowerCase();

  if (locationText.includes("airport") || locationText.includes("terminal")) {
    return "Airport-linked";
  }

  return "City-based";
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

const buildCarRentalsHref = () => {
  return "/car-rentals";
};

const buildCityHref = (
  citySlug: string,
  pickupDate?: string | null,
  dropoffDate?: string | null,
) => {
  const base = `/car-rentals/in/${encodeURIComponent(citySlug)}`;
  const sp = new URLSearchParams();

  if (pickupDate) sp.set("pickupDate", pickupDate);
  if (dropoffDate) sp.set("dropoffDate", dropoffDate);

  const query = sp.toString();
  return query ? `${base}?${query}` : base;
};

const buildSearchHref = (
  query: string,
  pageNumber: number,
  pickupDate?: string | null,
  dropoffDate?: string | null,
) => {
  const base = `/search/car-rentals/${encodeURIComponent(query)}/${encodeURIComponent(String(pageNumber))}`;
  const sp = new URLSearchParams();

  if (pickupDate) sp.set("pickupDate", pickupDate);
  if (dropoffDate) sp.set("dropoffDate", dropoffDate);

  const queryString = sp.toString();
  return queryString ? `${base}?${queryString}` : base;
};

const buildCarRentalDetailHref = (rentalSlug: string) => {
  return `/car-rentals/${encodeURIComponent(rentalSlug)}`;
};

const parseRentalParams = (sp: URLSearchParams) => {
  const pickupDate = normalizeIsoDate(sp.get("pickupDate"));
  const dropoffDate = normalizeIsoDate(sp.get("dropoffDate"));
  const drivers = clampMaybeInt(sp.get("drivers"), 1, 6);

  return {
    pickupDate,
    dropoffDate,
    drivers,
  };
};

const normalizeIsoDate = (raw: string | null) => {
  if (!raw) return null;
  const text = String(raw).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
};

const clampMaybeInt = (raw: string | null, min: number, max: number) => {
  if (!raw) return null;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value)) return null;
  if (value < min) return min;
  if (value > max) return max;
  return value;
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
