import { component$ } from "@builder.io/qwik";
import { AvailabilityConfidence } from "~/components/inventory/AvailabilityConfidence";
import { InventoryFreshness } from "~/components/inventory/InventoryFreshness";
import { InventoryRefreshControl } from "~/components/inventory/InventoryRefreshControl";
import type {
  HotelEntityStatusModel,
  HotelEntitySummaryModel,
} from "~/types/hotel-entity-page";

export const HotelEntitySummary = component$(
  (props: HotelEntitySummaryProps) => {
    return (
      <section class="rounded-[28px] border border-[color:var(--color-border)] bg-white px-6 py-6 shadow-[var(--shadow-soft)]">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--color-action)]">
              Stay overview
            </p>
            <h2 class="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--color-text-strong)]">
              {props.summary.hotelName}
            </h2>
            <p class="mt-2 text-sm leading-6 text-[color:var(--color-text-muted)]">
              {props.summary.locationLabel}
            </p>
            <p class="mt-2 text-sm leading-6 text-[color:var(--color-text-muted)]">
              {props.summary.brandLabel ? `${props.summary.brandLabel}` : "Independent stay"}
              {props.summary.providerLabel
                ? ` · Provider ${props.summary.providerLabel}`
                : ""}
              {props.summary.addressLabel ? ` · ${props.summary.addressLabel}` : ""}
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
                vertical: "hotels",
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
                alt={props.summary.hotelName}
                width={960}
                height={720}
              />
            </div>
          ) : (
            <div class="flex min-h-64 items-center justify-center rounded-[24px] bg-[linear-gradient(135deg,rgba(8,145,178,0.12),rgba(8,145,178,0.03))] px-6 text-center text-sm text-[color:var(--color-text-muted)]">
              Hotel imagery is unavailable for this entity.
            </div>
          )}

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="rounded-[24px] bg-[color:var(--color-surface-muted)] px-5 py-5">
              <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                Stay dates
              </p>
              <p class="mt-2 text-lg font-semibold text-[color:var(--color-text-strong)]">
                {props.summary.stayDateRangeLabel}
              </p>
              {props.summary.stayLengthLabel ? (
                <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                  {props.summary.stayLengthLabel}
                </p>
              ) : null}
            </div>

            <div class="rounded-[24px] bg-[color:var(--color-surface-muted)] px-5 py-5">
              <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                Room
              </p>
              <p class="mt-2 text-lg font-semibold text-[color:var(--color-text-strong)]">
                {props.summary.roomLabel}
              </p>
              {props.summary.occupancyLabel ? (
                <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                  {props.summary.occupancyLabel}
                </p>
              ) : null}
            </div>

            <div class="rounded-[24px] bg-[color:var(--color-surface-muted)] px-5 py-5">
              <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                Property details
              </p>
              <p class="mt-2 text-lg font-semibold text-[color:var(--color-text-strong)]">
                {props.summary.propertyTypeLabel || "Property details pending"}
              </p>
              <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                {[props.summary.starRatingLabel, props.summary.guestScoreLabel]
                  .filter((value): value is string => Boolean(value))
                  .join(" · ") || "Rating unavailable"}
              </p>
            </div>

            <div class="rounded-[24px] bg-[color:var(--color-surface-muted)] px-5 py-5">
              <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                Location
              </p>
              <p class="mt-2 text-lg font-semibold text-[color:var(--color-text-strong)]">
                {props.summary.locationLabel}
              </p>
              <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                {props.summary.addressLabel ||
                  props.summary.reviewCountLabel ||
                  "Address unavailable"}
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
  },
);

type HotelEntitySummaryProps = {
  summary: HotelEntitySummaryModel;
  status: HotelEntityStatusModel | null;
};
