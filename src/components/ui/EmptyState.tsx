/** CLAUDE-UI-002 — EmptyState primitive. */
import { component$ } from "@builder.io/qwik";
import { Button } from "~/components/ui/Button";

type Action = { label: string; href: string };

type EmptyStateProps = {
  title: string;
  description?: string;
  primary?: Action;
  secondary?: Action;
  icon?: string;
  class?: string;
};

export const EmptyState = component$((props: EmptyStateProps) => (
  <div
    class={["flex flex-col items-center px-6 py-12 text-center", props.class]}
    style="background:var(--ui-surface);border:1px dashed var(--ui-border);border-radius:var(--ui-radius)"
  >
    <div
      class="grid size-12 place-items-center rounded-full text-xl"
      style="background:var(--ui-surface-muted);color:var(--ui-text-muted)"
      aria-hidden="true"
    >
      {props.icon ?? "◎"}
    </div>
    <h3 class="mt-4 text-lg font-bold" style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)">
      {props.title}
    </h3>
    {props.description ? (
      <p class="mt-1.5 max-w-[44ch] text-sm" style="color:var(--ui-text-muted)">
        {props.description}
      </p>
    ) : null}
    {props.primary || props.secondary ? (
      <div class="mt-5 flex flex-wrap items-center justify-center gap-2">
        {props.primary ? <Button variant="primary" size="sm" href={props.primary.href} label={props.primary.label} /> : null}
        {props.secondary ? <Button variant="ghost" size="sm" href={props.secondary.href} label={props.secondary.label} /> : null}
      </div>
    ) : null}
  </div>
));
