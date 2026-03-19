import { component$ } from "@builder.io/qwik";
import { getConfirmationDisplayStatus } from "~/lib/confirmation/getConfirmationDisplayStatus";
import type { BookingConfirmation } from "~/types/confirmation";

export const CheckoutConfirmationStatusNotice = component$(
  (props: {
    confirmation: BookingConfirmation | null;
    confirmationNotice?: {
      code: string;
      message: string;
      tone: "info" | "success" | "error";
    } | null;
  }) => {
    const display = props.confirmation
      ? getConfirmationDisplayStatus(props.confirmation.status)
      : null;
    const tone = props.confirmationNotice?.tone
      ? props.confirmationNotice.tone
      : display?.tone === "success"
        ? "success"
        : display?.tone === "error"
          ? "error"
          : "info";

    return (
      <section
        class={[
          "rounded-[var(--radius-xl)] border px-4 py-4 shadow-[var(--shadow-sm)]",
          tone === "success"
            ? "border-[color:rgba(22,163,74,0.2)] bg-[color:rgba(240,253,244,0.96)]"
            : tone === "error"
              ? "border-[color:rgba(220,38,38,0.18)] bg-[color:rgba(254,242,242,0.96)]"
              : "border-[color:rgba(37,99,235,0.18)] bg-[color:rgba(239,246,255,0.9)]",
        ]}
      >
        <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
          {props.confirmationNotice?.message || display?.label || "Confirmation"}
        </p>
        <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
          {display?.description ||
            "Create a durable confirmation record after booking reaches a confirmation-ready state."}
        </p>
      </section>
    );
  },
);
