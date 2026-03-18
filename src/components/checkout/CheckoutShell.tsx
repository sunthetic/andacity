import { component$ } from "@builder.io/qwik";
import { Page } from "~/components/site/Page";
import { CheckoutHeader } from "~/components/checkout/CheckoutHeader";
import { CheckoutItemList } from "~/components/checkout/CheckoutItemList";
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
          <CheckoutStatusNotice summary={summary} />

          <div class="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            <div class="space-y-6">
              <CheckoutItemList items={session.items} />

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
              />
            </div>
          </div>
        </div>
      </Page>
    );
  },
);
