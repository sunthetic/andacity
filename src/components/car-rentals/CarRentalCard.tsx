import { component$, type QRL } from "@builder.io/qwik";
import {
  ResultCardScaffold,
  ResultFactList,
  ResultPricePanel,
  ResultReasonCallout,
  ResultTrustBar,
} from "~/components/results/ResultCardScaffold";
import { buildCarWhyThis } from "~/components/results/result-card-copy";
import { CompareButton } from "~/components/save-compare/CompareButton";
import { SaveButton } from "~/components/save-compare/SaveButton";
import { AddToTripButton } from "~/components/trips/AddToTripButton";
import {
  markBookingStageProgress,
  trackBookingEvent,
  type BookingVertical,
} from "~/lib/analytics/booking-telemetry";
import { type PriceDisplayContract } from "~/lib/pricing/price-display";
import type { CarRentalsSortKey } from "~/lib/search/car-rentals/car-sort-options";
import type { CarRentalResult } from "~/types/car-rentals/search";
import type { SavedItem } from "~/types/save-compare/saved-item";

export const CarRentalCard = component$((props: CarRentalCardProps) => {
  const r = props.result;
  const pickupType =
    r.pickupType ||
    (r.pickupArea.toLowerCase().includes("airport") ? "airport" : "city");
  const detailHref = props.detailHref || buildCarRentalDetailHref(r.slug);
  const onOpenDetail$ = () => {
    if (!props.telemetry) return;

    trackBookingEvent("booking_search_result_opened", {
      vertical: props.telemetry.vertical,
      surface: props.telemetry.surface,
      item_id: props.telemetry.itemId,
      item_position: props.telemetry.itemPosition ?? undefined,
      target: "detail",
    });
    markBookingStageProgress("search_results");
  };
  const vehicleTitle = r.vehicleName || r.category || r.name;
  const reviewSummary =
    r.rating > 0
      ? `${r.rating.toFixed(1)} rating${
          r.reviewCount
            ? ` · ${r.reviewCount.toLocaleString("en-US")} reviews`
            : ""
        }`
      : "";
  const whyThis = buildCarWhyThis(
    {
      rating: r.rating,
      reviewCount: r.reviewCount,
      priceFrom: r.priceFrom,
      freeCancellation: r.freeCancellation,
      payAtCounter: r.payAtCounter,
      pickupType,
    },
    props.activeSort,
  );
  const inclusionHighlights = r.inclusions.slice(0, 3).join(" · ");

  return (
    <ResultCardScaffold
      hasMedia={true}
      hasFacts={true}
      hasDetails={Boolean(inclusionHighlights)}
      hasWhyThis={Boolean(whyThis)}
      hasSecondaryActions={Boolean(props.savedItem)}
      hasPrice={true}
      hasPrimaryAction={true}
      hasTrust={Boolean(r.availabilityConfidence || r.freshness)}
    >
      <a q:slot="media" class="block h-full" href={detailHref} onClick$={onOpenDetail$}>
        <img
          class="h-48 w-full object-cover md:h-full"
          src={r.image}
          alt={r.name}
          loading="lazy"
          width={640}
          height={352}
        />
      </a>

      <div q:slot="identity">
        <a
          href={detailHref}
          class="text-lg font-semibold leading-6 text-[color:var(--color-text-strong)] hover:text-[color:var(--color-action)]"
          onClick$={onOpenDetail$}
        >
          {r.name}
        </a>
        <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
          {[vehicleTitle, reviewSummary].filter(Boolean).join(" · ")}
        </p>
        <div class="mt-3 flex flex-wrap gap-2">
          {r.category ? <span class="t-badge">{r.category}</span> : null}
          {r.transmission ? (
            <span class="t-badge">{r.transmission}</span>
          ) : null}
          {r.seats != null ? (
            <span class="t-badge">{r.seats} seats</span>
          ) : null}
          {r.bags ? <span class="t-badge">{r.bags}</span> : null}
          <span class="t-badge">
            {pickupType === "airport" ? "Airport pickup" : "City pickup"}
          </span>
        </div>
        <p class="mt-3 text-xs text-[color:var(--color-text-muted)]">
          {r.pickupArea}
        </p>
      </div>

      <ResultFactList
        q:slot="facts"
        columnsFrom="xl"
        items={[
          {
            label: "Vehicle class",
            value: r.category || "Standard rental",
            detail:
              vehicleTitle !== r.category && vehicleTitle !== r.name
                ? vehicleTitle
                : null,
          },
          {
            label: "Capacity",
            value:
              [r.seats != null ? `${r.seats} seats` : "", r.bags || ""]
                .filter(Boolean)
                .join(" · ") || "Capacity varies",
            detail: r.transmission || null,
          },
          {
            label: "Pickup",
            value: r.pickupArea,
            detail: pickupType === "airport" ? "Airport pickup" : "City pickup",
          },
          {
            label: "Policies",
            value: r.freeCancellation
              ? "Free cancellation"
              : "Cancellation varies",
            detail: r.payAtCounter ? "Pay at counter" : "Prepay",
          },
        ]}
      />

      {inclusionHighlights ? (
        <p
          q:slot="details"
          class="text-sm leading-5 text-[color:var(--color-text-muted)]"
        >
          <span class="font-medium text-[color:var(--color-text)]">
            Includes:
          </span>{" "}
          {inclusionHighlights}
        </p>
      ) : null}

      {whyThis ? (
        <ResultReasonCallout q:slot="why-this" text={whyThis} />
      ) : null}

      {props.savedItem ? (
        <div
          q:slot="secondary-actions"
          class="flex flex-wrap gap-2 md:justify-end"
        >
          {props.onToggleSave$ ? (
            <SaveButton
              class="min-h-9 px-3 py-2"
              saved={Boolean(props.isSaved)}
              idleLabel="Shortlist"
              activeLabel="Shortlisted"
              telemetry={{
                vertical: "cars",
                itemId: props.savedItem.id,
                surface: "search_results",
                itemPosition: props.telemetry?.itemPosition,
              }}
              onToggle$={() => {
                if (!props.savedItem || !props.onToggleSave$) return;
                props.onToggleSave$(props.savedItem);
              }}
            />
          ) : null}

          {props.onToggleCompare$ ? (
            <CompareButton
              class="min-h-9 px-3 py-2"
              selected={Boolean(props.isCompared)}
              disabled={Boolean(props.compareDisabled)}
              telemetry={{
                vertical: "cars",
                itemId: props.savedItem.id,
                surface: "search_results",
                itemPosition: props.telemetry?.itemPosition,
              }}
              onToggle$={() => {
                if (!props.savedItem || !props.onToggleCompare$) return;
                props.onToggleCompare$(props.savedItem);
              }}
            />
          ) : null}

          <AddToTripButton
            class="min-h-9 rounded-full border border-[color:var(--color-border)] px-3 py-2 text-xs font-semibold text-[color:var(--color-action)] hover:border-[color:var(--color-action)]"
            item={props.savedItem}
            telemetrySource="search_results"
            telemetryItemPosition={props.telemetry?.itemPosition}
          />
        </div>
      ) : null}

      <ResultPricePanel
        q:slot="price"
        display={props.priceDisplay}
        currency={r.currency}
        align="right"
        missingTotalText="Add dates to see rental totals."
      />

      <a
        q:slot="primary-action"
        class="t-btn-primary block w-full px-4 py-2.5 text-center text-sm font-semibold"
        href={detailHref}
        onClick$={onOpenDetail$}
      >
        View rental
      </a>

      <ResultTrustBar
        q:slot="trust"
        confidence={r.availabilityConfidence}
        freshness={r.freshness}
      />
    </ResultCardScaffold>
  );
});

type CarRentalCardProps = {
  result: CarRentalResult;
  priceDisplay: PriceDisplayContract;
  activeSort?: CarRentalsSortKey;
  savedItem?: SavedItem;
  isSaved?: boolean;
  onToggleSave$?: QRL<(item: SavedItem) => void>;
  isCompared?: boolean;
  compareDisabled?: boolean;
  onToggleCompare$?: QRL<(item: SavedItem) => void>;
  detailHref?: string;
  telemetry?: {
    vertical: BookingVertical;
    surface: string;
    itemId: string;
    itemPosition?: number | null;
  };
};

const buildCarRentalDetailHref = (rentalSlug: string) =>
  `/car-rentals/${encodeURIComponent(rentalSlug)}`;
