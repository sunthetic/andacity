import { $, component$, useSignal } from "@builder.io/qwik";
import { AsyncPendingButton } from "~/components/async/AsyncPendingButton";

export const BeginCheckoutButton = component$(
  (props: { tripId: number; disabled?: boolean; helperText?: string }) => {
    const pending = useSignal(false);
    const onSubmit$ = $(() => {
      if (props.disabled || pending.value) return;
      pending.value = true;
    });

    return (
      <div class="space-y-2">
        <form method="post" action="/checkout" onSubmit$={onSubmit$}>
          <input type="hidden" name="tripId" value={String(props.tripId)} />
          <AsyncPendingButton
            type="submit"
            pending={pending.value}
            pendingLabel="Starting checkout"
            disabled={props.disabled}
            class="w-full rounded-lg bg-[color:var(--color-action)] px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Continue to checkout
          </AsyncPendingButton>
        </form>

        {props.helperText ? (
          <p class="text-xs text-[color:var(--color-text-muted)]">
            {props.helperText}
          </p>
        ) : null}
      </div>
    );
  },
);
