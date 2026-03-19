import { component$ } from "@builder.io/qwik";

export const SaveTravelerProfileToggle = component$(
  (props: {
    travelerProfileId: string;
    disabled?: boolean;
    helperText?: string | null;
  }) => {
    return (
      <form
        method="post"
        class="mt-3 rounded-lg border border-[color:var(--color-border)] p-3"
      >
        <input
          type="hidden"
          name="intent"
          value="save-checkout-traveler-as-saved-profile"
        />
        <input
          type="hidden"
          name="travelerProfileId"
          value={props.travelerProfileId}
        />
        <div class="flex flex-wrap items-center justify-between gap-3">
          <label class="flex items-center gap-2 text-xs text-[color:var(--color-text-muted)]">
            <input type="hidden" name="isDefault" value="false" />
            <input
              type="checkbox"
              name="isDefault"
              value="true"
              disabled={props.disabled}
            />
            Make this the default saved traveler
          </label>
          <button
            type="submit"
            disabled={props.disabled}
            class="rounded-lg border border-[color:var(--color-border)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-muted)] hover:border-[color:var(--color-text-strong)] hover:text-[color:var(--color-text-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Save to account
          </button>
        </div>
        {props.helperText ? (
          <p class="mt-2 text-xs text-[color:var(--color-text-muted)]">
            {props.helperText}
          </p>
        ) : null}
      </form>
    );
  },
);
