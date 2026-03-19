import { component$ } from "@builder.io/qwik";
import { CheckoutActionBar } from "~/components/checkout/CheckoutActionBar";
import { CheckoutBookingSection } from "~/components/checkout/booking/CheckoutBookingSection";
import { CheckoutConfirmationSection } from "~/components/checkout/confirmation/CheckoutConfirmationSection";
import { CheckoutPaymentSection } from "~/components/checkout/payment/CheckoutPaymentSection";
import { CheckoutTravelerSection } from "~/components/checkout/travelers/CheckoutTravelerSection";
import { Page } from "~/components/site/Page";
import { CheckoutHeader } from "~/components/checkout/CheckoutHeader";
import { CheckoutItemList } from "~/components/checkout/CheckoutItemList";
import { CheckoutRevalidationNotice } from "~/components/checkout/CheckoutRevalidationNotice";
import { CheckoutRevalidationSummaryCard } from "~/components/checkout/CheckoutRevalidationSummaryCard";
import { CheckoutStatusNotice } from "~/components/checkout/CheckoutStatusNotice";
import { CheckoutTotalsCard } from "~/components/checkout/CheckoutTotalsCard";
import type { CheckoutBookingSummary } from "~/types/booking";
import type { BookingConfirmation } from "~/types/confirmation";
import type { CheckoutSession, CheckoutSessionSummary } from "~/types/checkout";
import type { CheckoutPaymentSummary } from "~/types/payment";
import type { CheckoutTravelerPageModel } from "~/types/travelers";

export const CheckoutShell = component$(
  (props: {
    session: CheckoutSession;
    summary: CheckoutSessionSummary;
    paymentSummary: CheckoutPaymentSummary;
    bookingSummary: CheckoutBookingSummary;
    paymentNotice?: {
      code: string;
      message: string;
      tone: "info" | "success" | "error";
    } | null;
    bookingNotice?: {
      code: string;
      message: string;
      tone: "info" | "success" | "error";
    } | null;
    confirmation: BookingConfirmation | null;
    confirmationNotice?: {
      code: string;
      message: string;
      tone: "info" | "success" | "error";
    } | null;
    travelerPageModel: CheckoutTravelerPageModel;
    travelerNotice?: {
      code: string;
      message: string;
      tone: "info" | "success" | "error";
    } | null;
  }) => {
    const {
      session,
      summary,
      paymentSummary,
      bookingSummary,
      paymentNotice,
      bookingNotice,
      confirmation,
      confirmationNotice,
      travelerPageModel,
      travelerNotice,
    } = props;

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
          <CheckoutRevalidationNotice
            summary={summary}
            revalidationSummary={session.revalidationSummary}
          />
          <CheckoutStatusNotice
            summary={summary}
            paymentSummary={paymentSummary}
            bookingSummary={bookingSummary}
          />

          <div class="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            <div class="space-y-6">
              <CheckoutItemList
                items={session.items}
                revalidationSummary={session.revalidationSummary}
                revalidationStatus={session.revalidationStatus}
              />

              <CheckoutTravelerSection
                pageModel={travelerPageModel}
                travelerNotice={travelerNotice}
              />

              <CheckoutPaymentSection
                paymentSummary={paymentSummary}
                bookingSummary={bookingSummary}
                paymentNotice={paymentNotice}
              />

              <CheckoutBookingSection
                bookingSummary={bookingSummary}
                bookingNotice={bookingNotice}
              />

              <CheckoutConfirmationSection
                confirmation={confirmation}
                bookingSummary={bookingSummary}
                confirmationNotice={confirmationNotice}
              />
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
              <CheckoutActionBar
                summary={summary}
                paymentSummary={paymentSummary}
                bookingSummary={bookingSummary}
                confirmation={confirmation}
                revalidationSummary={session.revalidationSummary}
              />
            </div>
          </div>
        </div>
      </Page>
    );
  },
);
