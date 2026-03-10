import { component$ } from "@builder.io/qwik";
import type { TripBundlingExplanation } from "~/types/trips/trip";

export const TripBundleExplanation = component$(
  (props: {
    explanation: TripBundlingExplanation;
    dense?: boolean;
  }) => {
    const dense = props.dense !== false;
    const toneClass =
      props.explanation.strength.level === "strong"
        ? "border-[color:rgba(15,118,110,0.22)] bg-[color:rgba(15,118,110,0.06)]"
        : props.explanation.strength.level === "moderate"
          ? "border-[color:rgba(180,83,9,0.22)] bg-[color:rgba(180,83,9,0.06)]"
          : "border-[color:rgba(100,116,139,0.22)] bg-[color:rgba(100,116,139,0.08)]";

    return (
      <section
        class={[
          "rounded-xl border px-3 py-3",
          toneClass,
          dense ? "mt-3" : "mt-0",
        ]}
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p class="text-[11px] uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
              Bundle rationale
            </p>
            <p class="mt-1 text-sm text-[color:var(--color-text-strong)]">
              {props.explanation.summary}
            </p>
          </div>
          <span class={strengthBadgeClass(props.explanation.strength.level)}>
            {props.explanation.strength.label}
          </span>
        </div>

        <div class={["grid gap-2", dense ? "mt-3" : "mt-4"]}>
          <ExplanationRow
            label="Why"
            text={props.explanation.why.join(" · ")}
            dense={dense}
          />
          <ExplanationRow
            label="Price"
            text={props.explanation.savings.summary}
            dense={dense}
          />
          <ExplanationRow
            label="Fit"
            text={props.explanation.constraints.join(" · ")}
            dense={dense}
          />
          <ExplanationRow
            label="Tradeoffs"
            text={
              props.explanation.tradeoffs.join(" · ") ||
              props.explanation.strength.reason
            }
            dense={dense}
          />
        </div>
      </section>
    );
  },
);

const ExplanationRow = component$(
  (props: { label: string; text: string; dense: boolean }) => {
    return (
      <div class="grid gap-1 sm:grid-cols-[56px_1fr] sm:gap-3">
        <p class="text-[11px] uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
          {props.label}
        </p>
        <p
          class={[
            props.dense ? "text-xs" : "text-sm",
            "text-[color:var(--color-text)]",
          ]}
        >
          {props.text}
        </p>
      </div>
    );
  },
);

const strengthBadgeClass = (
  level: TripBundlingExplanation["strength"]["level"],
) => {
  if (level === "strong") {
    return "rounded-full border border-[color:var(--color-success,#0f766e)] bg-[color:rgba(15,118,110,0.08)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-[color:var(--color-success,#0f766e)]";
  }

  if (level === "moderate") {
    return "rounded-full border border-[color:var(--color-warning,#b45309)] bg-[color:rgba(180,83,9,0.08)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-[color:var(--color-warning,#92400e)]";
  }

  return "rounded-full border border-[color:var(--color-text-muted)] bg-[color:rgba(100,116,139,0.12)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-[color:var(--color-text-muted)]";
};
