import { Slot, component$, type QRL } from "@builder.io/qwik";
import { AsyncInlineSpinner } from "~/components/async/AsyncInlineSpinner";

export const AsyncPendingButton = component$(
  (props: AsyncPendingButtonProps) => {
    return (
      <button
        type={props.type || "button"}
        class={[
          "inline-grid items-center justify-center",
          props.pending ? "opacity-90" : null,
          props.class,
        ]}
        disabled={props.disabled || props.pending}
        aria-busy={props.pending}
        onClick$={props.onClick$}
      >
        <span
          class={[
            "col-start-1 row-start-1 inline-flex items-center justify-center gap-2",
            props.pending ? "invisible" : null,
          ]}
        >
          <Slot />
        </span>
        <span
          class={[
            "col-start-1 row-start-1 inline-flex items-center justify-center gap-2",
            props.pending ? null : "sr-only",
          ]}
        >
          <AsyncInlineSpinner compact={true} />
          <span>{props.pendingLabel || "Working..."}</span>
        </span>
      </button>
    );
  },
);

type AsyncPendingButtonProps = {
  pending: boolean;
  pendingLabel?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  class?: string | string[];
  onClick$?: QRL<() => void>;
};
