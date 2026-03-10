import { component$, type QRL } from "@builder.io/qwik";
import {
  ResultCardScaffold,
  ResultFactList,
  ResultPricePanel,
  ResultReasonCallout,
  ResultTrustBar,
} from "~/components/results/ResultCardScaffold";
import { buildHotelWhyThis } from "~/components/results/result-card-copy";
import { CompareButton } from "~/components/save-compare/CompareButton";
import { SaveButton } from "~/components/save-compare/SaveButton";
import { AddToTripButton } from "~/components/trips/AddToTripButton";
import type { Hotel } from "~/data/hotels";
import type { PriceDisplayContract } from "~/lib/pricing/price-display";
import type { HotelSortKey } from "~/lib/search/hotels/hotel-sort-options";
import type { SavedItem } from "~/types/save-compare/saved-item";

export const HotelCard = component$((props: HotelCardProps) => {
  const h = props.hotel;
  const detailHref = props.detailHref || buildHotelDetailHref(h.slug);
  const whyThis = buildHotelWhyThis(
    {
      rating: h.rating,
      reviewCount: h.reviewCount,
      priceFrom: h.fromNightly,
      stars: h.stars,
      freeCancellation: h.policies.freeCancellation,
      payLater: h.policies.payLater,
    },
    props.activeSort,
  );
  const amenityHighlights = h.amenities.slice(0, 3).join(" · ");
  const stayType = `${h.stars}-star ${
    String(h.propertyType || "stay").trim() || "stay"
  }`;

  return (
    <ResultCardScaffold
      hasMedia={true}
      hasFacts={true}
      hasDetails={Boolean(amenityHighlights || h.summary)}
      hasWhyThis={Boolean(whyThis)}
      hasSecondaryActions={Boolean(props.savedItem)}
      hasPrice={true}
      hasPrimaryAction={true}
      hasTrust={Boolean(h.availabilityConfidence || h.freshness)}
    >
      <a q:slot="media" class="block h-full" href={detailHref}>
        <img
          class="h-48 w-full object-cover md:h-full"
          src={h.images[0] || "/img/demo/hotel-1.jpg"}
          alt={h.name}
          loading="lazy"
          width={640}
          height={320}
        />
      </a>

      <div q:slot="identity">
        <a
          class="text-lg font-semibold leading-6 text-[color:var(--color-text-strong)] hover:text-[color:var(--color-action)]"
          href={detailHref}
        >
          {h.name}
        </a>
        <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
          {[h.neighborhood, h.city].filter(Boolean).join(" · ")}
        </p>
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
            value: stayType,
            detail: null,
          },
          {
            label: "Policies",
            value: h.policies.freeCancellation
              ? "Free cancellation"
              : "Cancellation varies",
            detail: h.policies.payLater ? "Pay later available" : "Prepay",
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
      ) : h.summary ? (
        <p
          q:slot="details"
          class="text-sm leading-5 text-[color:var(--color-text-muted)]"
        >
          {h.summary}
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
              onToggle$={() => {
                if (!props.savedItem || !props.onToggleCompare$) return;
                props.onToggleCompare$(props.savedItem);
              }}
            />
          ) : null}

          <AddToTripButton
            class="min-h-9 rounded-full border border-[color:var(--color-border)] px-3 py-2 text-xs font-semibold text-[color:var(--color-action)] hover:border-[color:var(--color-action)]"
            item={props.savedItem}
          />
        </div>
      ) : null}

      <ResultPricePanel
        q:slot="price"
        display={props.priceDisplay}
        currency={h.currency}
        align="right"
      />

      <a
        q:slot="primary-action"
        class="t-btn-primary block w-full px-4 py-2.5 text-center text-sm font-semibold"
        href={detailHref}
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
});

type HotelCardProps = {
  hotel: Hotel;
  priceDisplay: PriceDisplayContract;
  activeSort?: HotelSortKey;
  savedItem?: SavedItem;
  isSaved?: boolean;
  onToggleSave$?: QRL<(item: SavedItem) => void>;
  isCompared?: boolean;
  compareDisabled?: boolean;
  onToggleCompare$?: QRL<(item: SavedItem) => void>;
  detailHref?: string;
};

const buildHotelDetailHref = (hotelSlug: string) =>
  `/hotels/${encodeURIComponent(hotelSlug)}`;
