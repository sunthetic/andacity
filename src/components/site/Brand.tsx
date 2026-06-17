/**
 * Andacity wordmark.
 *
 * CLAUDE-UI-004: promoted from the CLAUDE-UI-003 shell sample as the approved
 * brand treatment ("keep the text wordmark for now"). A redesigned logo
 * lockup is deferred to a later task; the existing SVG mark asset is
 * preserved on disk for that future work but is no longer referenced here.
 */
import { component$ } from "@builder.io/qwik";

type BrandProps = {
  size?: "sm" | "md";
  class?: string;
};

export const Brand = component$((props: BrandProps) => (
  <a
    href="/"
    class={[
      "inline-flex items-center font-extrabold tracking-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]",
      props.size === "sm" ? "text-base" : "text-lg",
      props.class,
    ]}
    style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
    aria-label="Andacity home"
  >
    Anda<span style="color:var(--ui-primary)">city</span>
  </a>
));
