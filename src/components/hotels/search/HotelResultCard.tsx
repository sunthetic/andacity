import { $, component$ } from "@builder.io/qwik";
import {
  ResultCardScaffold,
  ResultFactList,
  ResultPricePanel,
  ResultReasonCallout,
  ResultTrustBar,
} from "~/components/results/ResultCardScaffold";
import { ResultCardHeader } from "~/components/results/ResultCardHeader";
import {
  markBookingStageProgress,
  trackBookingEvent,
} from "~/lib/analytics/booking-telemetry";
import { buildHotelWhyThis } from "~/components/results/result-card-copy";
import { buildHotelPriceDisplay } from "~/lib/pricing/price-display";
import type { HotelResultCardProps } from "~/types/hotels/search";

export const HotelResultCard = component$(
  ({
    h,
    nights,
    detailHref,
    priceDisplay,
    activeSort,
    telemetry,
  }: HotelResultCardProps) => {
    const display =
      priceDisplay ||
      buildHotelPriceDisplay({
        currencyCode: h.currency,
        nightlyRate: h.priceFrom,
        nights,
      });
    const href =
      h.searchEntity?.href || detailHref || `/hotels/${encodeURIComponent(h.slug)}`;
    const onOpenDetail$ = $(() => {
      if (!telemetry) return;

      trackBookingEvent("booking_search_result_opened", {
        vertical: telemetry.vertical,
        surface: telemetry.surface,
        item_id: telemetry.itemId,
        item_position: telemetry.itemPosition ?? undefined,
        target: "detail",
      });
      markBookingStageProgress("search_results");
    });
    const whyThis = buildHotelWhyThis(
      {
        rating: h.rating,
        reviewCount: h.reviewCount,
        priceFrom: h.priceFrom,
        stars: h.stars,
        freeCancellation: h.refundable,
        payLater: h.badges.some((badge) => badge.toLowerCase() === "pay later"),
      },
      activeSort,
    );
    const amenityHighlights = h.amenities.slice(0, 3).join(" · ");

    return (
      <ResultCardScaffold
        hasMedia={true}
        hasFacts={true}
        hasDetails={Boolean(amenityHighlights)}
        hasWhyThis={Boolean(whyThis)}
        hasPrice={true}
        hasPrimaryAction={true}
        hasTrust={Boolean(h.availabilityConfidence || h.freshness)}
      >
        <a q:slot="media" class="block h-full" href={href} onClick$={onOpenDetail$}>
          <img
            class="h-48 w-full object-cover md:h-full"
            src={h.image}
            alt={h.name}
            loading="lazy"
            width={640}
            height={352}
          />
        </a>

        <div q:slot="identity">
          <ResultCardHeader
            title={h.searchEntity?.title || h.name}
            subtitle={h.searchEntity?.subtitle || h.neighborhood}
            price={h.priceFrom}
            currency={h.currency}
            href={href}
            onClick$={onOpenDetail$}
          />
        </div>

        <ResultFactList
          q:slot="facts"
          columnsFrom="xl"
          items={[
            {
              label: "Guest rating",
              value: `${h.rating.toFixed(1)}/10`,
              detail: `${h.reviewCount.toLocaleString("en-US")} reviews`,
            },
            {
              label: "Stay type",
              value: `${h.stars}-star stay`,
              detail: null,
            },
            {
              label: "Policies",
              value: h.refundable ? "Free cancellation" : "Non-refundable",
              detail: h.badges.some(
                (badge) => badge.toLowerCase() === "pay later",
              )
                ? "Pay later available"
                : null,
            },
          ]}
        />

        {amenityHighlights ? (
          <p
            q:slot="details"
            class="text-sm leading-5 text-[color:var(--color-text-muted)]"
          >
            <span class="font-medium text-[color:var(--color-text)]">
              Top amenities:
            </span>{" "}
            {amenityHighlights}
          </p>
        ) : null}

        {whyThis ? (
          <ResultReasonCallout q:slot="why-this" text={whyThis} />
        ) : null}

        <ResultPricePanel
          q:slot="price"
          display={display}
          currency={h.currency}
          align="right"
        />

        <a
          q:slot="primary-action"
          class="t-btn-primary block w-full px-4 py-2.5 text-center text-sm font-semibold"
          href={href}
          onClick$={onOpenDetail$}
        >
          View stay
        </a>

        <ResultTrustBar
          q:slot="trust"
          confidence={h.availabilityConfidence}
          freshness={h.freshness}
        />
      </ResultCardScaffold>
    );
  },
);
