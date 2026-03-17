import { component$ } from "@builder.io/qwik";
import { EntitySearchFlowLinks } from "~/components/entities/EntitySearchFlowLinks";
import { CarEntityErrorState } from "~/components/entities/cars/CarEntityErrorState";
import { CarEntitySummary } from "~/components/entities/cars/CarEntitySummary";
import { CarEntityUnavailableState } from "~/components/entities/cars/CarEntityUnavailableState";
import { CarPickupDropoffSummary } from "~/components/entities/cars/CarPickupDropoffSummary";
import { CarPriceSummary } from "~/components/entities/cars/CarPriceSummary";
import { CarRentalPolicies } from "~/components/entities/cars/CarRentalPolicies";
import { CarVehicleSpecs } from "~/components/entities/cars/CarVehicleSpecs";
import { Page } from "~/components/site/Page";
import { getBookableEntitySearchHref } from "~/lib/entities/routing";
import { mapCarEntityPageForUi } from "~/lib/entities/cars/page-model";
import type { BookableEntityPageLoadResult } from "~/types/bookable-entity-route";

const headerToneClass = (tone: "neutral" | "warning" | "critical") => {
  if (tone === "critical") {
    return "border-[color:rgba(185,28,28,0.14)] bg-[linear-gradient(135deg,rgba(185,28,28,0.06),rgba(255,255,255,0.96))]";
  }

  if (tone === "warning") {
    return "border-[color:rgba(180,83,9,0.16)] bg-[linear-gradient(135deg,rgba(245,158,11,0.08),rgba(255,255,255,0.96))]";
  }

  return "border-[color:var(--color-border)] bg-[linear-gradient(135deg,rgba(217,119,6,0.09),rgba(14,116,144,0.05),rgba(255,255,255,0.96))]";
};

export const CarEntityPage = component$((props: CarEntityPageProps) => {
  const model = mapCarEntityPageForUi(props.page, {
    searchContextCityName: props.searchContextCityName,
  });

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
          <EntitySearchFlowLinks searchHref={getBookableEntitySearchHref("car")} />
        </section>

        {model.errorState ? (
          <section class="mt-6">
            <CarEntityErrorState state={model.errorState} />
          </section>
        ) : null}

        {!model.errorState && model.unavailableState ? (
          <section class="mt-6">
            <CarEntityUnavailableState state={model.unavailableState} />
          </section>
        ) : null}

        {!model.errorState && model.summary && model.priceSummary && model.cta ? (
          <section class="mt-6 grid gap-4 lg:grid-cols-[1.45fr,0.95fr]">
            <CarEntitySummary summary={model.summary} status={model.status} />
            <CarPriceSummary price={model.priceSummary} cta={model.cta} />
          </section>
        ) : null}

        {!model.errorState &&
        model.vehicleSpecs &&
        model.pickupDropoff &&
        model.policies ? (
          <section class="mt-6 grid gap-4 lg:grid-cols-[1.05fr,1fr,1fr]">
            <CarVehicleSpecs specs={model.vehicleSpecs} />
            <CarPickupDropoffSummary summary={model.pickupDropoff} />
            <CarRentalPolicies policies={model.policies} />
          </section>
        ) : null}
      </div>
    </Page>
  );
});

type CarEntityPageProps = {
  page: BookableEntityPageLoadResult;
  searchContextCityName?: string | null;
};
