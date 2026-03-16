import { component$ } from "@builder.io/qwik";
import { ResultCardHeader } from "~/components/results/ResultCardHeader";
import {
  ResultCardScaffold,
  ResultFactList,
} from "~/components/results/ResultCardScaffold";
import type { HotelResultCardModel } from "~/types/search-ui";

export const HotelResultCard = component$((props: HotelResultCardProps) => {
  const card = props.card;
  const subtitle = card.areaLabel ? `${card.areaLabel} · ${card.cityLabel}` : card.cityLabel;

  return (
    <ResultCardScaffold
      hasMedia={Boolean(card.imageUrl)}
      hasFacts={true}
      hasDetails={card.amenitiesSummary.length > 0}
      hasPrice={true}
      hasPrimaryAction={true}
    >
      {card.imageUrl ? (
        card.detailHref ? (
          <a q:slot="media" class="block h-full" href={card.detailHref}>
            <img
              class="h-48 w-full object-cover md:h-full"
              src={card.imageUrl}
              alt={card.hotelName}
              loading="lazy"
              width={640}
              height={352}
            />
          </a>
        ) : (
          <div q:slot="media" class="block h-full">
            <img
              class="h-48 w-full object-cover md:h-full"
              src={card.imageUrl}
              alt={card.hotelName}
              loading="lazy"
              width={640}
              height={352}
            />
          </div>
        )
      ) : null}

      <div q:slot="identity">
        <div class="mb-3 flex flex-wrap gap-2">
          {card.starRating ? <span class="t-badge">{card.starRating}-star stay</span> : null}
          {card.guestScore != null ? (
            <span class="t-badge">
              {card.guestScore.toFixed(1)}/10
              {card.reviewCount ? ` · ${card.reviewCount.toLocaleString("en-US")} reviews` : ""}
            </span>
          ) : null}
        </div>

        <ResultCardHeader title={card.hotelName} subtitle={subtitle} />
      </div>

      <ResultFactList
        q:slot="facts"
        items={[
          {
            label: "Location",
            value: card.areaLabel || "Area unavailable",
            detail: card.cityLabel,
          },
          {
            label: "Guest score",
            value: card.guestScore != null ? `${card.guestScore.toFixed(1)}/10` : "Score unavailable",
            detail: card.reviewCount ? `${card.reviewCount.toLocaleString("en-US")} reviews` : null,
          },
          {
            label: "Stay class",
            value: card.starRating ? `${card.starRating}-star stay` : "Class unavailable",
            detail: null,
          },
          {
            label: "Offer",
            value: card.offerSummary || "Offer details unavailable",
            detail: null,
          },
          {
            label: "Policies",
            value: card.cancellationSummary || card.policySummary || "Policy details unavailable",
            detail:
              card.cancellationSummary && card.policySummary && card.policySummary !== card.cancellationSummary
                ? card.policySummary
                : null,
          },
        ]}
        columns={2}
        columnsFrom="xl"
      />

      {card.amenitiesSummary.length ? (
        <div q:slot="details" class="rounded-xl bg-[color:var(--color-neutral-50)] px-4 py-3">
          <p class="text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
            Top inclusions
          </p>
          <p class="mt-2 text-sm leading-5 text-[color:var(--color-text-muted)]">
            {card.amenitiesSummary.join(" · ")}
          </p>
        </div>
      ) : null}

      <div q:slot="price" class="text-left md:text-right">
        <p class="text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
          Total stay
        </p>
        <p class="mt-1 text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
          {card.price.totalDisplay}
        </p>
        <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
          {card.price.nightlyDisplay || (card.price.currency ? `${card.price.currency} pricing` : "Pricing updates at selection")}
        </p>
      </div>

      {card.ctaHref && !card.ctaDisabled ? (
        <a
          q:slot="primary-action"
          class="t-btn-primary block w-full px-4 py-2.5 text-center text-sm font-semibold"
          href={card.ctaHref}
        >
          {card.ctaLabel}
        </a>
      ) : (
        <button
          q:slot="primary-action"
          type="button"
          class="t-btn-primary block w-full cursor-not-allowed px-4 py-2.5 text-center text-sm font-semibold opacity-60"
          disabled={true}
        >
          {card.ctaLabel}
        </button>
      )}
    </ResultCardScaffold>
  );
});

type HotelResultCardProps = {
  card: HotelResultCardModel;
};
