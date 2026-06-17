/**
 * CLAUDE-UI-002 — PageShell foundation primitive.
 *
 * Applies the `--ui-*` background + text color for a themed surface. Can
 * optionally scope a specific palette/mode to its subtree (used by the
 * preview to render all 12 states at once); when omitted it inherits the
 * live theme from <html>.
 */
import { Slot, component$ } from "@builder.io/qwik";
import type { PaletteId, ThemeMode } from "~/lib/ui-theme/theme";

type PageShellProps = {
  /** Scope a palette to this subtree instead of inheriting from <html>. */
  palette?: PaletteId;
  /** Scope a render mode to this subtree. */
  mode?: ThemeMode;
  class?: string;
};

export const PageShell = component$((props: PageShellProps) => (
  <div
    data-palette={props.palette}
    data-mode={props.mode}
    class={["min-h-full", props.class]}
    style="background:var(--ui-bg);color:var(--ui-text);font-family:'Poppins',var(--system-font-family)"
  >
    <Slot />
  </div>
));
