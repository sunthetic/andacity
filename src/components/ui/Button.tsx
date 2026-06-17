/** CLAUDE-UI-002 — Button primitive (consumes `--ui-*`). */
import { Slot, component$ } from "@builder.io/qwik";

type Variant = "primary" | "secondary" | "ghost";

type ButtonProps = {
  variant?: Variant;
  href?: string;
  type?: "button" | "submit";
  full?: boolean;
  size?: "sm" | "md";
  class?: string;
  label?: string;
  ariaLabel?: string;
};

const variantStyle = (variant: Variant): string => {
  if (variant === "primary") {
    return "background:var(--ui-primary);color:var(--ui-on-primary);border:1px solid transparent;border-radius:var(--ui-radius)";
  }
  if (variant === "secondary") {
    return "background:var(--ui-surface);color:var(--ui-primary);border:1px solid var(--ui-primary);border-radius:var(--ui-radius)";
  }
  return "background:transparent;color:var(--ui-text-secondary);border:1px solid var(--ui-border);border-radius:var(--ui-radius)";
};

export const Button = component$((props: ButtonProps) => {
  const variant = props.variant ?? "primary";
  const sizeClass = props.size === "sm" ? "px-3.5 py-1.5 text-[13px]" : "px-5 py-2.5 text-sm";
  const cls = [
    "inline-flex items-center justify-center gap-2 font-semibold transition",
    "hover:-translate-y-px hover:brightness-[1.05] active:translate-y-0",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--ui-ring)]",
    props.full ? "w-full" : "",
    sizeClass,
    props.class,
  ];

  if (props.href) {
    return (
      <a href={props.href} class={cls} style={variantStyle(variant)} aria-label={props.ariaLabel}>
        {props.label ? props.label : <Slot />}
      </a>
    );
  }

  return (
    <button type={props.type ?? "button"} class={cls} style={variantStyle(variant)} aria-label={props.ariaLabel}>
      {props.label ? props.label : <Slot />}
    </button>
  );
});
