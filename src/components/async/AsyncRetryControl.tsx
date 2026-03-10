import { component$, type QRL } from "@builder.io/qwik";

export const AsyncRetryControl = component$((props: AsyncRetryControlProps) => {
  if (!props.onRetry$ && !props.href) {
    return props.message ? (
      <p class={["text-sm text-[color:var(--color-text-muted)]", props.class]}>
        {props.message}
      </p>
    ) : null;
  }

  return (
    <div
      class={[
        "flex flex-wrap items-center gap-3",
        props.compact ? "text-xs" : "text-sm",
        props.class,
      ]}
    >
      {props.message ? (
        <p class="text-[color:var(--color-text-muted)]">{props.message}</p>
      ) : null}

      {props.onRetry$ ? (
        <button
          type="button"
          class="rounded-lg border border-[color:var(--color-border)] px-3 py-1.5 font-medium text-[color:var(--color-action)] hover:border-[color:var(--color-action)]"
          onClick$={props.onRetry$}
        >
          {props.label || "Retry"}
        </button>
      ) : props.href ? (
        <a
          class="rounded-lg border border-[color:var(--color-border)] px-3 py-1.5 font-medium text-[color:var(--color-action)] hover:border-[color:var(--color-action)]"
          href={props.href}
        >
          {props.label || "Retry"}
        </a>
      ) : null}
    </div>
  );
});

type AsyncRetryControlProps = {
  message?: string | null;
  label?: string;
  href?: string;
  class?: string;
  compact?: boolean;
  onRetry$?: QRL<() => void>;
};
