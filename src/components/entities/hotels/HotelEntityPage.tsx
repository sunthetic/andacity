import { component$ } from "@builder.io/qwik";
import { EntitySearchFlowLinks } from "~/components/entities/EntitySearchFlowLinks";
import { HotelAmenitiesList } from "~/components/entities/hotels/HotelAmenitiesList";
import { HotelEntityErrorState } from "~/components/entities/hotels/HotelEntityErrorState";
import { HotelEntitySummary } from "~/components/entities/hotels/HotelEntitySummary";
import { HotelEntityUnavailableState } from "~/components/entities/hotels/HotelEntityUnavailableState";
import { HotelOfferSummary } from "~/components/entities/hotels/HotelOfferSummary";
import { HotelPoliciesSummary } from "~/components/entities/hotels/HotelPoliciesSummary";
import { HotelPriceSummary } from "~/components/entities/hotels/HotelPriceSummary";
import { Page } from "~/components/site/Page";
import { getBookableEntitySearchHref } from "~/lib/entities/routing";
import { mapHotelEntityPageForUi } from "~/lib/entities/hotels/page-model";
import type { BookableEntityPageLoadResult } from "~/types/bookable-entity-route";

const headerToneClass = (tone: "neutral" | "warning" | "critical") => {
  if (tone === "critical") {
    return "border-[color:rgba(185,28,28,0.14)] bg-[linear-gradient(135deg,rgba(185,28,28,0.06),rgba(255,255,255,0.96))]";
  }

  if (tone === "warning") {
    return "border-[color:rgba(180,83,9,0.16)] bg-[linear-gradient(135deg,rgba(245,158,11,0.08),rgba(255,255,255,0.96))]";
  }

  return "border-[color:var(--color-border)] bg-[linear-gradient(135deg,rgba(8,145,178,0.08),rgba(255,255,255,0.96))]";
};

export const HotelEntityPage = component$((props: HotelEntityPageProps) => {
  const model = mapHotelEntityPageForUi(props.page);
  const entity =
    props.page.kind === "resolved" ||
    props.page.kind === "unavailable" ||
    props.page.kind === "revalidation_required"
      ? props.page.entity
      : null;

  return (
    <Page breadcrumbs={model.breadcrumbs}>
      <div class="mx-auto max-w-5xl">
        <section
          class={[
            "mt-4 rounded-[32px] border px-6 py-7 shadow-[var(--shadow-soft)]",
            headerToneClass(model.header.tone),
          ]}
        >
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-action)]">
            {model.header.badge}
          </p>
          <h1 class="mt-3 max-w-[24ch] text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)] lg:text-4xl">
            {model.header.title}
          </h1>
          <p class="mt-3 max-w-[78ch] text-sm leading-6 text-[color:var(--color-text-muted)] lg:text-base">
            {model.header.description}
          </p>
          <EntitySearchFlowLinks
            searchHref={getBookableEntitySearchHref("hotel")}
          />
        </section>

        {model.errorState ? (
          <section class="mt-6">
            <HotelEntityErrorState state={model.errorState} />
          </section>
        ) : null}

        {!model.errorState && model.unavailableState ? (
          <section class="mt-6">
            <HotelEntityUnavailableState state={model.unavailableState} />
          </section>
        ) : null}

        {!model.errorState &&
        model.summary &&
        model.priceSummary &&
        model.cta &&
        entity ? (
          <section class="mt-6 grid gap-4 lg:grid-cols-[1.45fr,0.95fr]">
            <HotelEntitySummary summary={model.summary} status={model.status} />
            <HotelPriceSummary
              price={model.priceSummary}
              cta={model.cta}
              entity={entity}
            />
          </section>
        ) : null}

        {!model.errorState &&
        model.offerSummary &&
        model.amenities &&
        model.policies ? (
          <section class="mt-6 grid gap-4 lg:grid-cols-[1.1fr,0.95fr,0.95fr]">
            <HotelOfferSummary offer={model.offerSummary} />
            <HotelAmenitiesList amenities={model.amenities} />
            <HotelPoliciesSummary policies={model.policies} />
          </section>
        ) : null}
      </div>
    </Page>
  );
});

type HotelEntityPageProps = {
  page: BookableEntityPageLoadResult;
};
