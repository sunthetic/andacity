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
              Flight timing
            </p>
            <p class="mt-2 max-w-[70ch] text-sm leading-6 text-[color:var(--color-text-muted)]">
              Departure and arrival details are shown in local airport time when
              the route metadata includes a timezone.
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
            <p class="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
              {props.summary.departureTimeLabel}
            </p>
            <p class="mt-2 text-sm leading-6 text-[color:var(--color-text-muted)]">
              {props.summary.departureAirportLabel}
            </p>
          </div>

          <div class="rounded-[24px] bg-[color:var(--color-surface-muted)] px-5 py-5">
            <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Arrival
            </p>
            <p class="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
              {props.summary.arrivalTimeLabel}
            </p>
            <p class="mt-2 text-sm leading-6 text-[color:var(--color-text-muted)]">
              {props.summary.arrivalAirportLabel}
            </p>
          </div>
        </div>

        <dl class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Carrier
            </dt>
            <dd class="mt-1 text-sm text-[color:var(--color-text)]">
              {props.summary.airlineLabel}
            </dd>
          </div>

          {props.summary.flightNumberLabel ? (
            <div>
              <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                Flight number
              </dt>
              <dd class="mt-1 text-sm text-[color:var(--color-text)]">
                {props.summary.flightNumberLabel}
              </dd>
            </div>
          ) : null}

          <div>
            <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Route
            </dt>
            <dd class="mt-1 text-sm text-[color:var(--color-text)]">
              {props.summary.routeLabel}
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
            <div class="mt-6 rounded-[24px] border border-[color:var(--color-border)] px-4 py-4">
              <div class="flex flex-wrap items-start justify-between gap-4">
                <AvailabilityConfidence
                  confidence={props.status.availability}
                  compact={true}
                  showDetail={false}
                />
                <InventoryFreshness
                  freshness={props.status.freshness}
                  compact={true}
                  showDetail={false}
                />
              </div>
              <p class="mt-3 text-xs text-[color:var(--color-text-muted)]">
                {props.status.checkedAtLabel}
              </p>
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
