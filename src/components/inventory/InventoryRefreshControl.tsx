import {
  $,
  component$,
  useSignal,
  useVisibleTask$,
  type QRL,
} from "@builder.io/qwik";
import { AsyncPendingButton } from "~/components/async/AsyncPendingButton";
import {
  trackBookingEvent,
  type BookingVertical,
} from "~/lib/analytics/booking-telemetry";
import type { InventoryRefreshState } from "~/lib/inventory/freshness";

const reloadDocument = (href: string) => {
  const nextUrl = new URL(href, window.location.href);
  const currentUrl = new URL(window.location.href);
  const sameDocument =
    nextUrl.pathname === currentUrl.pathname &&
    nextUrl.search === currentUrl.search &&
    nextUrl.hash === currentUrl.hash;

  if (sameDocument) {
    window.location.reload();
    return;
  }

  window.location.assign(nextUrl.href);
};

export const InventoryRefreshControl = component$(
  (props: InventoryRefreshControlProps) => {
    const state = useSignal<InventoryRefreshState>("idle");
    const message = useSignal<string | null>(
      props.mode === "unsupported" ? props.unsupportedMessage || null : null,
    );

    const storageKey = `inventory-refresh:${props.id}`;

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ cleanup }) => {
      if (props.mode === "unsupported") return;

      const stored = window.sessionStorage.getItem(storageKey);
      if (!stored) return;

      window.sessionStorage.removeItem(storageKey);
      state.value = "refreshed";
      message.value = props.successMessage || "Refreshed just now.";

      const timeoutId = window.setTimeout(() => {
        state.value = "idle";
        message.value = null;
      }, 4000);

      cleanup(() => window.clearTimeout(timeoutId));
    });

    const onRefresh$ = $(async () => {
      if (
        props.disabled ||
        props.mode === "unsupported" ||
        state.value === "refreshing"
      ) {
        return;
      }

      state.value = "refreshing";
      message.value = null;

      if (props.telemetry) {
        trackBookingEvent("booking_refresh_requested", {
          vertical: props.telemetry.vertical,
          surface: props.telemetry.surface,
          refresh_type: props.telemetry.refreshType,
          item_count: props.telemetry.itemCount ?? undefined,
        });
      }

      try {
        if (props.mode === "reload") {
          const href = props.reloadHref || window.location.href;
          const response = await fetch(href, {
            cache: "no-store",
            headers: {
              "x-andacity-refresh": "1",
            },
          });

          if (!response.ok) {
            throw new Error(`Refresh failed with status ${response.status}.`);
          }

          if (props.telemetry) {
            trackBookingEvent("booking_refresh_completed", {
              vertical: props.telemetry.vertical,
              surface: props.telemetry.surface,
              refresh_type: props.telemetry.refreshType,
              item_count: props.telemetry.itemCount ?? undefined,
              outcome: "success",
            });
          }

          window.sessionStorage.setItem(storageKey, new Date().toISOString());
          reloadDocument(href);
          return;
        }

        if (!props.onRefresh$) {
          throw new Error(
            props.failureMessage || "Refresh is not available here.",
          );
        }

        await props.onRefresh$();

        if (props.reloadOnSuccess) {
          const href = props.reloadHref || window.location.href;
          window.sessionStorage.setItem(storageKey, new Date().toISOString());
          reloadDocument(href);
          return;
        }

        state.value = "refreshed";
        message.value = props.successMessage || "Refreshed just now.";

        if (props.telemetry) {
          trackBookingEvent("booking_refresh_completed", {
            vertical: props.telemetry.vertical,
            surface: props.telemetry.surface,
            refresh_type: props.telemetry.refreshType,
            item_count: props.telemetry.itemCount ?? undefined,
            outcome: "success",
          });
        }
      } catch (error) {
        state.value = "failed";
        message.value =
          error instanceof Error && error.message
            ? error.message
            : props.failureMessage || "Refresh failed.";

        if (props.telemetry) {
          const errorMessage =
            error instanceof Error && error.message
              ? error.message
              : props.failureMessage || "Refresh failed.";

          trackBookingEvent("booking_refresh_completed", {
            vertical: props.telemetry.vertical,
            surface: props.telemetry.surface,
            refresh_type: props.telemetry.refreshType,
            item_count: props.telemetry.itemCount ?? undefined,
            outcome: "failure",
            error_message: errorMessage,
          });

          trackBookingEvent("booking_error", {
            vertical: props.telemetry.vertical,
            surface: props.telemetry.surface,
            action: "refresh",
            error_message: errorMessage,
          });
        }
      }
    });

    const buttonLabel =
      state.value === "refreshed"
        ? props.refreshedLabel || "Refreshed"
        : state.value === "failed"
          ? props.failedLabel || props.label || "Try again"
          : props.mode === "unsupported"
            ? props.unsupportedLabel || "Refresh unavailable"
            : props.label || "Refresh";

    return (
      <div
        class={[
          "flex flex-col gap-1",
          props.align === "right"
            ? "items-end text-right"
            : "items-start text-left",
        ]}
      >
        <AsyncPendingButton
          type="button"
          class={[
            props.compact
              ? "rounded-lg border border-[color:var(--color-border)] px-3 py-1.5 text-xs"
              : "rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm",
            props.mode === "unsupported" || props.disabled
              ? "cursor-not-allowed opacity-60"
              : "hover:border-[color:var(--color-action)]",
          ]}
          pending={state.value === "refreshing"}
          pendingLabel={props.refreshingLabel || "Refreshing..."}
          disabled={props.disabled || props.mode === "unsupported"}
          onClick$={onRefresh$}
        >
          {buttonLabel}
        </AsyncPendingButton>

        {message.value ? (
          <p
            class={[
              props.compact ? "text-[11px]" : "text-xs",
              state.value === "failed"
                ? "text-[color:var(--color-error,#b91c1c)]"
                : "text-[color:var(--color-text-muted)]",
            ]}
          >
            {message.value}
          </p>
        ) : null}
      </div>
    );
  },
);

export type InventoryRefreshControlProps = {
  id: string;
  mode: "reload" | "action" | "unsupported";
  label?: string;
  refreshingLabel?: string;
  refreshedLabel?: string;
  failedLabel?: string;
  unsupportedLabel?: string;
  successMessage?: string;
  failureMessage?: string;
  unsupportedMessage?: string;
  reloadHref?: string;
  reloadOnSuccess?: boolean;
  onRefresh$?: QRL<() => Promise<void>>;
  compact?: boolean;
  align?: "left" | "right";
  disabled?: boolean;
  telemetry?: {
    vertical: BookingVertical;
    surface: string;
    refreshType?: string;
    itemCount?: number | null;
  };
};
