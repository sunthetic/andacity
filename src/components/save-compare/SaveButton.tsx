import { component$, type QRL } from "@builder.io/qwik";

export const SaveButton = component$((props: SaveButtonProps) => {
  const base =
    "inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold transition";
  const stateClass = props.saved
    ? "border-[color:var(--color-action)] bg-[color:var(--color-action-soft)] text-[color:var(--color-action)]"
    : "border-[color:var(--color-border)] text-[color:var(--color-text-muted)] hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-text-strong)]";

  return (
    <button
      type="button"
      aria-pressed={props.saved}
      onClick$={props.onToggle$}
      class={[base, stateClass, props.class]}
    >
      {props.saved ? "Saved" : "Save"}
    </button>
  );
});

type SaveButtonProps = {
  saved: boolean;
  onToggle$: QRL<() => void>;
  class?: string;
};
