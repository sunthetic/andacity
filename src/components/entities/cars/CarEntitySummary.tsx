import { component$ } from "@builder.io/qwik";
import { AvailabilityConfidence } from "~/components/inventory/AvailabilityConfidence";
import { InventoryFreshness } from "~/components/inventory/InventoryFreshness";
import { InventoryRefreshControl } from "~/components/inventory/InventoryRefreshControl";
import type {
  CarEntityStatusModel,
  CarEntitySummaryModel,
} from "~/types/car-entity-page";

export const CarEntitySummary = component$((props: CarEntitySummaryProps) => {
  const headingLabel =
    props.summary.rentalCompanyLabel || props.summary.vehicleName;
  const supportingVehicleLabel =
    props.summary.rentalCompanyLabel &&
    props.summary.rentalCompanyLabel !== props.summary.vehicleName
      ? props.summary.vehicleName
      : null;
  const pickupDropoffLabel =
    props.summary.pickupLocationLabel === props.summary.dropoffLocationLabel
      ? props.summary.pickupLocationLabel
      : `Pickup ${props.summary.pickupLocationLabel} · Drop-off ${props.summary.dropoffLocationLabel}`;

  return (
    <section class="rounded-[28px] border border-[color:var(--color-border)] bg-white px-6 py-6 shadow-[var(--shadow-soft)]">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--color-action)]">
            Rental overview
          </p>
          <h2 class="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
            {headingLabel}
          </h2>
          <p class="mt-2 text-sm leading-6 text-[color:var(--color-text-muted)]">
            {pickupDropoffLabel}
          </p>
          <p class="mt-2 text-sm leading-6 text-[color:var(--color-text-muted)]">
            {supportingVehicleLabel || props.summary.categoryLabel}
            {supportingVehicleLabel ? ` · ${props.summary.categoryLabel}` : ""}
            {props.summary.providerLabel
              ? ` · Provider ${props.summary.providerLabel}`
              : ""}
          </p>
        </div>

        {props.status ? (
          <InventoryRefreshControl
            id={props.status.requestedInventoryId}
            mode="reload"
            label="Revalidate inventory"
            successMessage="Inventory revalidated."
            failureMessage="Inventory revalidation failed."
            reloadHref={props.status.canonicalPath}
            telemetry={{
              vertical: "cars",
              surface: "entity_page",
              refreshType: "inventory_revalidation",
              itemCount: 1,
            }}
          />
        ) : null}
      </div>

      <div class="mt-6 grid gap-4 lg:grid-cols-[1.1fr,1fr]">
        {props.summary.imageUrl ? (
          <div class="overflow-hidden rounded-[24px] bg-[color:var(--color-surface-muted)]">
            <img
              class="h-64 w-full object-cover"
              src={props.summary.imageUrl}
              alt={props.summary.vehicleName}
              width={960}
              height={720}
            />
          </div>
        ) : (
          <div class="flex min-h-64 items-center justify-center rounded-[24px] bg-[linear-gradient(135deg,rgba(217,119,6,0.12),rgba(14,116,144,0.05))] px-6 text-center text-sm text-[color:var(--color-text-muted)]">
            Vehicle imagery is unavailable for this rental.
          </div>
        )}

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="rounded-[24px] bg-[color:var(--color-surface-muted)] px-5 py-5">
            <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Pickup
            </p>
            <p class="mt-2 text-lg font-semibold text-[color:var(--color-text-strong)]">
              {props.summary.pickupLocationLabel}
            </p>
            <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              {props.summary.pickupDateTimeLabel}
            </p>
          </div>

          <div class="rounded-[24px] bg-[color:var(--color-surface-muted)] px-5 py-5">
            <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Dropoff
            </p>
            <p class="mt-2 text-lg font-semibold text-[color:var(--color-text-strong)]">
              {props.summary.dropoffLocationLabel}
            </p>
            <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              {props.summary.dropoffDateTimeLabel}
            </p>
          </div>

          <div class="rounded-[24px] bg-[color:var(--color-surface-muted)] px-5 py-5">
            <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Vehicle
            </p>
            <p class="mt-2 text-lg font-semibold text-[color:var(--color-text-strong)]">
              {props.summary.vehicleName}
            </p>
            <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              {props.summary.categoryLabel}
            </p>
          </div>

          <div class="rounded-[24px] bg-[color:var(--color-surface-muted)] px-5 py-5">
            <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Rental details
            </p>
            <p class="mt-2 text-lg font-semibold text-[color:var(--color-text-strong)]">
              {props.summary.rentalLengthLabel || "Rental length unavailable"}
            </p>
            <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              {props.summary.ratePlanLabel || "Rate plan pending"}
            </p>
          </div>
        </div>
      </div>

      {props.summary.summaryText ? (
        <p class="mt-6 max-w-[78ch] text-sm leading-6 text-[color:var(--color-text-muted)]">
          {props.summary.summaryText}
        </p>
      ) : null}

      {props.status ? (
        <>
          <div class="mt-6 grid gap-4 md:grid-cols-2">
            <div class="rounded-[24px] border border-[color:var(--color-border)] px-4 py-4">
              <AvailabilityConfidence
                confidence={props.status.availability}
                compact={false}
              />
            </div>
            <div class="rounded-[24px] border border-[color:var(--color-border)] px-4 py-4">
              <InventoryFreshness
                freshness={props.status.freshness}
                compact={false}
              />
            </div>
          </div>

          <dl class="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                Requested inventory ID
              </dt>
              <dd class="mt-1 break-all text-sm text-[color:var(--color-text)]">
                {props.status.requestedInventoryId}
              </dd>
            </div>

            {props.status.resolvedInventoryId ? (
              <div>
                <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                  Resolved inventory ID
                </dt>
                <dd class="mt-1 break-all text-sm text-[color:var(--color-text)]">
                  {props.status.resolvedInventoryId}
                </dd>
              </div>
            ) : null}

            <div>
              <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                Provider
              </dt>
              <dd class="mt-1 text-sm text-[color:var(--color-text)]">
                {props.status.providerLabel}
              </dd>
            </div>

            <div>
              <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                Last checked
              </dt>
              <dd class="mt-1 text-sm text-[color:var(--color-text)]">
                {props.status.checkedAtLabel}
              </dd>
            </div>
          </dl>
        </>
      ) : null}
    </section>
  );
});

type CarEntitySummaryProps = {
  summary: CarEntitySummaryModel;
  status: CarEntityStatusModel | null;
};
