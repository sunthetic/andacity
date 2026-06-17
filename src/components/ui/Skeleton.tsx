/**
 * CLAUDE-UI-002 — Loading / skeleton primitives.
 *
 * Respects `prefers-reduced-motion` (the shimmer is gated in global CSS via the
 * `.ui-skeleton` animation rule below; here we keep a static fallback tint).
 */
import { component$ } from "@builder.io/qwik";

const base = "ui-skeleton rounded-md";
const skelStyle = "background:var(--ui-surface-muted)";

export const SkeletonLine = component$((props: { w?: string; h?: string; class?: string }) => (
  <div
    class={[base, props.class]}
    style={`${skelStyle};width:${props.w ?? "100%"};height:${props.h ?? "0.75rem"}`}
    aria-hidden="true"
  />
));

export const SkeletonCard = component$(() => (
  <div
    class="overflow-hidden p-4"
    style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius)"
    aria-hidden="true"
  >
    <div class={base} style={`${skelStyle};height:7rem`} />
    <div class="mt-3 flex flex-col gap-2">
      <SkeletonLine w="70%" />
      <SkeletonLine w="45%" />
      <div class="mt-2 flex items-center justify-between">
        <SkeletonLine w="30%" h="1.25rem" />
        <SkeletonLine w="20%" h="1.75rem" />
      </div>
    </div>
  </div>
));

export const SkeletonResults = component$((props: { count?: number }) => (
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-label="Loading results">
    {Array.from({ length: props.count ?? 4 }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
));
