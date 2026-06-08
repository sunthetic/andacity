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
    return "border-[color:var(--color-danger)] border-opacity-20 bg-[color:var(--color-danger-soft)]";
  }

  if (tone === "warning") {
    return "border-[color:var(--color-warning)] border-opacity-20 bg-[color:var(--color-warning-soft)]";
  }

  return "border-[color:var(--color-border)] bg-[color:var(--color-primary-surface)]";
};

export const CarEntityPage = component$((props: CarEntityPageProps) => {
  const model = mapCarEntityPageForUi(props.page, {
    searchContextCityName: props.searchContextCityName,
  });
  const entity =
    props.page.kind === "resolved" ||
    props.page.kind === "unavailable" ||
    props.page.kind === "revalidation_required"
      ? props.page.entity
      : null;

  return (
    <Page breadcrumbs={model.breadcrumbs}>
      <div class="t-detail-theme t-detail-theme-cars mx-auto max-w-5xl">
        <section
          class={[
            "mt-4 overflow-hidden rounded-[32px] border px-6 py-7 shadow-[var(--shadow-soft)]",
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
          {model.summary ? (
            <div class="mt-6 grid gap-3 rounded-[28px] border border-[color:var(--color-border-default)] bg-[image:var(--detail-route-bg)] p-4 shadow-[var(--shadow-e2)] md:grid-cols-3">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                  Vehicle
                </p>
                <p class="mt-1 text-xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
                  {model.summary.vehicleName}
                </p>
                <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                  {model.summary.categoryLabel}
                </p>
              </div>
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                  Pickup
                </p>
                <p class="mt-1 text-xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
                  {model.summary.pickupLocationLabel}
                </p>
                <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                  {model.summary.pickupDateTimeLabel}
                </p>
              </div>
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                  Rental window
                </p>
                <p class="mt-1 text-xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
                  {model.summary.rentalLengthLabel || "Length pending"}
                </p>
                <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                  {model.summary.ratePlanLabel || model.summary.dropoffDateTimeLabel}
                </p>
              </div>
            </div>
          ) : null}
          <EntitySearchFlowLinks
            searchHref={getBookableEntitySearchHref("car")}
          />
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

        {!model.errorState &&
        model.summary &&
        model.priceSummary &&
        model.cta &&
        entity ? (
          <section class="mt-6 grid gap-4 lg:grid-cols-[1.45fr,0.95fr]">
            <CarEntitySummary summary={model.summary} status={model.status} />
            <CarPriceSummary
              price={model.priceSummary}
              cta={model.cta}
              entity={entity}
            />
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
