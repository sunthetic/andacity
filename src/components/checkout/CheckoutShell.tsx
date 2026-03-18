import { component$ } from "@builder.io/qwik";
import { CheckoutActionBar } from "~/components/checkout/CheckoutActionBar";
import { Page } from "~/components/site/Page";
import { CheckoutHeader } from "~/components/checkout/CheckoutHeader";
import { CheckoutItemList } from "~/components/checkout/CheckoutItemList";
import { CheckoutRevalidationNotice } from "~/components/checkout/CheckoutRevalidationNotice";
import { CheckoutRevalidationSummaryCard } from "~/components/checkout/CheckoutRevalidationSummaryCard";
import { CheckoutSectionPlaceholder } from "~/components/checkout/CheckoutSectionPlaceholder";
import { CheckoutStatusNotice } from "~/components/checkout/CheckoutStatusNotice";
import { CheckoutTotalsCard } from "~/components/checkout/CheckoutTotalsCard";
import type { CheckoutSession, CheckoutSessionSummary } from "~/types/checkout";

export const CheckoutShell = component$(
  (props: { session: CheckoutSession; summary: CheckoutSessionSummary }) => {
    const { session, summary } = props;

    return (
      <Page
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Trips", href: "/trips" },
          { label: summary.tripReference, href: summary.tripHref },
          { label: "Checkout" },
        ]}
      >
        <div class="space-y-6">
          <CheckoutHeader summary={summary} />
          <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-muted,#f8fafc)] p-4 shadow-[var(--shadow-sm)]">
            <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
              Checkout is a saved trip snapshot
            </p>
            <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              We’ll confirm the latest pricing and availability before payment.
              If you need to change flights, stays, or cars, return to the trip
              page first.
            </p>
          </section>
          <CheckoutRevalidationNotice summary={summary} />
          <CheckoutStatusNotice summary={summary} />

          <div class="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            <div class="space-y-6">
              <CheckoutItemList
                items={session.items}
                revalidationSummary={session.revalidationSummary}
                revalidationStatus={session.revalidationStatus}
              />

              <div class="grid gap-4 md:grid-cols-3">
                <CheckoutSectionPlaceholder
                  title="Traveler details"
                  description="Traveler collection starts in a later task once session handoff and validation rules are settled."
                  statusLabel="Coming later"
                >
                  Placeholder only in v0.7.0 framework.
                </CheckoutSectionPlaceholder>
                <CheckoutSectionPlaceholder
                  title="Payment"
                  description="Payment intent creation and capture are intentionally out of scope for this framework task."
                  statusLabel="Not started"
                >
                  No provider SDK or payment form is attached yet.
                </CheckoutSectionPlaceholder>
                <CheckoutSectionPlaceholder
                  title="Review & confirm"
                  description="Booking execution and confirmation persistence will extend this session once traveler and payment steps exist."
                  statusLabel="Reserved"
                >
                  This shell keeps the route and data seams ready for TASK-037
                  and later booking work.
                </CheckoutSectionPlaceholder>
              </div>
            </div>

            <div class="space-y-4">
              <CheckoutTotalsCard
                totals={session.totals}
                itemCount={session.items.length}
                revalidationSummary={session.revalidationSummary}
                revalidationStatus={session.revalidationStatus}
              />
              <CheckoutRevalidationSummaryCard
                revalidationSummary={session.revalidationSummary}
              />
              <CheckoutActionBar summary={summary} />
            </div>
          </div>
        </div>
      </Page>
    );
  },
);
