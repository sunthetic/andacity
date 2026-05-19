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
      <section class="rounded-[28px] border border-[color:var(--color-border-default)] bg-[image:var(--detail-card-bg)] px-6 py-6 shadow-[var(--shadow-soft)]">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--color-action)]">
              Flight summary
            </p>
            <p class="mt-2 max-w-[70ch] text-sm leading-6 text-[color:var(--color-text-muted)]">
              Carrier, itinerary, and inventory signals for this fare.
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

        <dl class="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div class="rounded-2xl border border-[color:var(--color-border-subtle)] bg-white/70 px-4 py-3 shadow-[var(--shadow-sm)]">
            <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Carrier
            </dt>
            <dd class="mt-1 text-sm text-[color:var(--color-text)]">
              {props.summary.airlineLabel}
            </dd>
          </div>

          {props.summary.flightNumberLabel ? (
            <div class="rounded-2xl border border-[color:var(--color-border-subtle)] bg-white/70 px-4 py-3 shadow-[var(--shadow-sm)]">
              <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                Flight number
              </dt>
              <dd class="mt-1 text-sm text-[color:var(--color-text)]">
                {props.summary.flightNumberLabel}
              </dd>
            </div>
          ) : null}

          <div class="rounded-2xl border border-[color:var(--color-border-subtle)] bg-white/70 px-4 py-3 shadow-[var(--shadow-sm)]">
            <dt class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
              Stops
            </dt>
            <dd class="mt-1 text-sm text-[color:var(--color-text)]">
              {props.summary.stopSummary}
            </dd>
          </div>

          {props.summary.itineraryTypeLabel ? (
            <div class="rounded-2xl border border-[color:var(--color-border-subtle)] bg-white/70 px-4 py-3 shadow-[var(--shadow-sm)]">
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
