import { component$ } from "@builder.io/qwik";
import type { CheckoutBookingSummary } from "~/types/booking";

export const CheckoutBookingStatusNotice = component$(
  (props: {
    bookingSummary: CheckoutBookingSummary;
    bookingNotice?: {
      code: string;
      message: string;
      tone: "info" | "success" | "error";
    } | null;
  }) => {
    const { bookingSummary, bookingNotice } = props;
    const tone = bookingNotice?.tone
      ? bookingNotice.tone
      : bookingSummary.status === "succeeded"
        ? "success"
        : bookingSummary.status === "failed" ||
            bookingSummary.status === "requires_manual_review"
          ? "error"
          : "info";

    return (
      <section
        class={[
          "rounded-[var(--radius-xl)] border px-4 py-4 shadow-[var(--shadow-sm)]",
          tone === "success"
            ? "border-[color:rgba(22,163,74,0.2)] bg-[color:rgba(240,253,244,0.96)]"
            : tone === "error"
              ? "border-[color:rgba(217,119,6,0.25)] bg-[color:rgba(255,251,235,0.96)]"
              : "border-[color:rgba(37,99,235,0.18)] bg-[color:rgba(239,246,255,0.9)]",
        ]}
      >
        <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
          {bookingNotice?.message || bookingSummary.statusLabel}
        </p>
        <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
          {bookingSummary.statusDescription}
        </p>
      </section>
    );
  },
);
