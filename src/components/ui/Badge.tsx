/** CLAUDE-UI-002 — Badge / chip primitive (consumes `--ui-*`). */
import { Slot, component$ } from "@builder.io/qwik";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

const toneStyle = (tone: Tone): string => {
  switch (tone) {
    case "accent":
      return "background:var(--ui-accent-soft);color:var(--ui-accent);border:1px solid transparent";
    case "success":
      return "background:var(--ui-success-soft);color:var(--ui-success);border:1px solid transparent";
    case "warning":
      return "background:var(--ui-warning-soft);color:var(--ui-warning);border:1px solid transparent";
    case "danger":
      return "background:var(--ui-danger-soft);color:var(--ui-danger);border:1px solid transparent";
    default:
      return "background:var(--ui-surface-muted);color:var(--ui-text-secondary);border:1px solid var(--ui-border)";
  }
};

export const Badge = component$((props: { tone?: Tone; label?: string; class?: string }) => (
  <span
    class={[
      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none",
      props.class,
    ]}
    style={toneStyle(props.tone ?? "neutral")}
  >
    {props.label ? props.label : <Slot />}
  </span>
));
