import { component$ } from "@builder.io/qwik";
import { AvailabilityConfidence } from "~/components/inventory/AvailabilityConfidence";
import { InventoryFreshness } from "~/components/inventory/InventoryFreshness";
import { InventoryRefreshControl } from "~/components/inventory/InventoryRefreshControl";
import type {
  FlightEntityStatusModel,
  FlightEntitySummaryModel,
} from "~/types/flight-entity-page";

export const FlightEntitySummary = component$(
  (props: FlightEntitySummaryProps) => {
    return (
      <section class="rounded-[28px] border border-[color:var(--color-border)] bg-white px-6 py-6 shadow-[var(--shadow-soft)]">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--color-action)]">
              Flight summary
            </p>
            <h2 class="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
              {props.summary.routeLabel}
            </h2>
            <p class="mt-2 text-sm leading-6 text-[color:var(--color-text-muted)]">
              {props.summary.airlineLabel}
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
                vertical: "flights",
                surface: "entity_page",
                refreshType: "inventory_revalidation",
                itemCount: 1,
              }}
            />
          ) : null}
        </div>

        <div class="mt-6 grid gap-4 md:grid-cols-2">
          <div class="rounded-[24px] bg-[color:var(--color-surface-muted)] px-5 py-5">
            <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Departure
            </p>
            <p class="mt-2 text-lg font-semibold text-[color:var(--color-text-strong)]">
              {props.summary.departureAirportLabel}
            </p>
            <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              {props.summary.departureTimeLabel}
            </p>
          </div>

          <div class="rounded-[24px] bg-[color:var(--color-surface-muted)] px-5 py-5">
            <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Arrival
            </p>
            <p class="mt-2 text-lg font-semibold text-[color:var(--color-text-strong)]">
              {props.summary.arrivalAirportLabel}
            </p>
            <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              {props.summary.arrivalTimeLabel}
            </p>
          </div>
        </div>

        <dl class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Airlines
            </dt>
            <dd class="mt-1 text-sm text-[color:var(--color-text)]">
              {props.summary.airlineLabel}
            </dd>
          </div>

          <div>
            <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Duration
            </dt>
            <dd class="mt-1 text-sm text-[color:var(--color-text)]">
              {props.summary.durationLabel}
            </dd>
          </div>

          <div>
            <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Stops
            </dt>
            <dd class="mt-1 text-sm text-[color:var(--color-text)]">
              {props.summary.stopSummary}
            </dd>
          </div>

          {props.summary.itineraryTypeLabel ? (
            <div>
              <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                Itinerary type
              </dt>
              <dd class="mt-1 text-sm text-[color:var(--color-text)]">
                {props.summary.itineraryTypeLabel}
              </dd>
            </div>
          ) : null}
        </dl>

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
  },
);

type FlightEntitySummaryProps = {
  summary: FlightEntitySummaryModel;
  status: FlightEntityStatusModel | null;
};
