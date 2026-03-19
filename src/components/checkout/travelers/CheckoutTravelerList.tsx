import { component$ } from "@builder.io/qwik";
import { SaveTravelerProfileToggle } from "~/components/checkout/travelers/SaveTravelerProfileToggle";
import { canSaveTravelerFromCheckout } from "~/fns/saved-travelers/canSaveTravelerFromCheckout";
import { formatTravelerDisplayName } from "~/fns/travelers/formatTravelerDisplayName";
import type { CheckoutTravelerProfile } from "~/types/travelers";

export const CheckoutTravelerList = component$(
  (props: {
    travelers: CheckoutTravelerProfile[];
    canManageSavedTravelers?: boolean;
  }) => {
    if (!props.travelers.length) {
      return (
        <p class="text-sm text-[color:var(--color-text-muted)]">
          No checkout traveler profiles added yet.
        </p>
      );
    }

    return (
      <div class="space-y-3">
        {props.travelers.map((traveler) => {
          const saveability = props.canManageSavedTravelers
            ? canSaveTravelerFromCheckout({
                traveler,
                ownerUserId: "account",
              })
            : null;

          return (
            <article
              key={traveler.id}
              class="rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-4"
            >
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                    {formatTravelerDisplayName(traveler)}
                  </p>
                  <p class="mt-1 text-xs uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
                    {traveler.role.replace("_", " ")} · {traveler.type}
                  </p>
                  <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                    {[traveler.email, traveler.phone]
                      .filter(Boolean)
                      .join(" · ") || "No contact details saved yet"}
                  </p>
                </div>
                <form method="post">
                  <input
                    type="hidden"
                    name="intent"
                    value="remove-traveler-profile"
                  />
                  <input
                    type="hidden"
                    name="travelerProfileId"
                    value={traveler.id}
                  />
                  <button
                    type="submit"
                    class="rounded-lg border border-[color:var(--color-border)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-muted)] hover:border-[color:#b91c1c] hover:text-[color:#b91c1c]"
                  >
                    Remove
                  </button>
                </form>
              </div>

              {props.canManageSavedTravelers ? (
                <SaveTravelerProfileToggle
                  travelerProfileId={traveler.id}
                  disabled={!saveability?.ok}
                  helperText={saveability?.issues[0]?.message || null}
                />
              ) : null}
            </article>
          );
        })}
      </div>
    );
  },
);
