import { component$ } from "@builder.io/qwik";
import type { TravelerValidationSummary } from "~/types/travelers";

export const CheckoutTravelerValidationNotice = component$(
  (props: {
    validationSummary: TravelerValidationSummary;
    travelerNotice?: {
      code: string;
      message: string;
      tone: "info" | "success" | "error";
    } | null;
  }) => {
    const summary = props.validationSummary;
    const issuePreview = summary.issues.slice(0, 4);
    const isSuccess = summary.status === "complete";
    const tone = props.travelerNotice?.tone
      ? props.travelerNotice.tone
      : isSuccess
        ? "success"
        : "error";

    return (
      <section
        class={[
          "rounded-[var(--radius-xl)] border px-4 py-4 shadow-[var(--shadow-sm)]",
          tone === "success"
            ? "border-[color:rgba(22,163,74,0.2)] bg-[color:rgba(240,253,244,0.96)]"
            : tone === "error"
              ? "border-[color:rgba(217,119,6,0.24)] bg-[color:rgba(255,251,235,0.96)]"
              : "border-[color:rgba(37,99,235,0.18)] bg-[color:rgba(239,246,255,0.9)]",
        ]}
      >
        <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
          {props.travelerNotice?.message ||
            (isSuccess
              ? "Traveler details are complete."
              : "Traveler details still need attention.")}
        </p>
        <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
          {isSuccess
            ? "Traveler requirements are satisfied for this checkout."
            : `${summary.issueCount} traveler issue${summary.issueCount === 1 ? "" : "s"} remain before payment can continue.`}
        </p>
        {!isSuccess && issuePreview.length ? (
          <ul class="mt-3 space-y-1 text-sm text-[color:var(--color-text-muted)]">
            {issuePreview.map((issue) => (
              <li key={issue.id}>{issue.message}</li>
            ))}
          </ul>
        ) : null}
      </section>
    );
  },
);
