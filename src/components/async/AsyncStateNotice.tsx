import { component$, type QRL } from "@builder.io/qwik";
import { AsyncInlineSpinner } from "~/components/async/AsyncInlineSpinner";
import { AsyncRetryControl } from "~/components/async/AsyncRetryControl";
import type { BookingAsyncState } from "~/lib/async/booking-async-state";

export const AsyncStateNotice = component$((props: AsyncStateNoticeProps) => {
  if (
    props.state === "loaded" ||
    props.state === "empty" ||
    props.state === "initial_loading"
  ) {
    return null;
  }

  const palette = paletteForState(props.state);

  return (
    <div
      class={[
        "rounded-[var(--radius-xl)] border px-4 py-3 shadow-[var(--shadow-sm)]",
        palette.wrapper,
        props.class,
      ]}
      role={props.state === "failed" ? "alert" : "status"}
      aria-live="polite"
    >
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            {props.state === "refreshing" ? (
              <AsyncInlineSpinner
                compact={true}
                class={palette.text}
                label={undefined}
              />
            ) : (
              <span
                aria-hidden="true"
                class={["mt-0.5 h-2.5 w-2.5 rounded-full", palette.dot]}
              />
            )}
            <p class={["text-sm font-semibold", palette.text]}>
              {props.title || defaultTitle(props.state)}
            </p>
          </div>

          {props.message ? (
            <p class="mt-2 text-sm text-[color:var(--color-text-muted)]">
              {props.message}
            </p>
          ) : null}
        </div>

        {props.retryLabel || props.retryHref || props.onRetry$ ? (
          <AsyncRetryControl
            compact={true}
            label={props.retryLabel}
            href={props.retryHref}
            onRetry$={props.onRetry$}
          />
        ) : null}
      </div>
    </div>
  );
});

const defaultTitle = (state: BookingAsyncState) => {
  if (state === "refreshing") return "Refreshing";
  if (state === "partial") return "Partial availability";
  if (state === "stale") return "Availability needs recheck";
  if (state === "failed") return "Request failed";
  return "Loaded";
};

const paletteForState = (state: BookingAsyncState) => {
  if (state === "refreshing") {
    return {
      wrapper:
        "border-[color:var(--color-primary-150)] bg-[color:var(--color-primary-25)]",
      dot: "bg-[color:var(--color-action)]",
      text: "text-[color:var(--color-action)]",
    };
  }

  if (state === "failed") {
    return {
      wrapper:
        "border-[color:var(--color-danger,#dc2626)] bg-[color:var(--color-danger-soft,#fef2f2)]",
      dot: "bg-[color:var(--color-danger,#dc2626)]",
      text: "text-[color:var(--color-danger,#b91c1c)]",
    };
  }

  return {
    wrapper:
      "border-[color:var(--color-warning,#b45309)] bg-[color:var(--color-warning-soft)]",
    dot: "bg-[color:var(--color-warning,#b45309)]",
    text: "text-[color:var(--color-warning,#92400e)]",
  };
};

type AsyncStateNoticeProps = {
  state: BookingAsyncState;
  title?: string;
  message?: string;
  retryLabel?: string;
  retryHref?: string;
  class?: string;
  onRetry$?: QRL<() => void>;
};
