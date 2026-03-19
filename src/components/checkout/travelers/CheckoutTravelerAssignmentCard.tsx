import { component$ } from "@builder.io/qwik";
import { formatTravelerDisplayName } from "~/fns/travelers/formatTravelerDisplayName";
import type {
  CheckoutTravelerProfile,
  CheckoutTravelerRequirementState,
} from "~/types/travelers";

const normalizeRoleLabel = (value: string) => value.replace(/_/g, " ");

export const CheckoutTravelerAssignmentCard = component$(
  (props: {
    requirementState: CheckoutTravelerRequirementState;
    travelers: CheckoutTravelerProfile[];
  }) => {
    const { requirementState, travelers } = props;
    const requirement = requirementState.requirement;
    const availableTravelers = travelers.filter((traveler) => {
      if (requirement.role === "primary_contact") {
        return (
          traveler.role === "primary_contact" ||
          traveler.email != null ||
          traveler.phone != null
        );
      }
      return traveler.role === requirement.role || traveler.role === "passenger";
    });

    return (
      <article class="rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
              {requirement.title}
            </p>
            <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              {requirement.description ||
                `Assign ${requirement.requiredCount} ${normalizeRoleLabel(requirement.role)} traveler(s).`}
            </p>
            <p class="mt-2 text-xs uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
              Assigned {requirementState.assignedCount} / {requirement.requiredCount}
            </p>
          </div>
          {requirement.checkoutItemKey ? (
            <span class="rounded-full border border-[color:var(--color-border)] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
              Item scoped
            </span>
          ) : (
            <span class="rounded-full border border-[color:var(--color-border)] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
              Checkout scoped
            </span>
          )}
        </div>

        <form method="post" class="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <input type="hidden" name="intent" value="assign-traveler" />
          <input
            type="hidden"
            name="checkoutItemKey"
            value={requirement.checkoutItemKey || ""}
          />
          <input type="hidden" name="role" value={requirement.role} />
          <label class="text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
            Traveler profile
            <select
              name="travelerProfileId"
              required
              class="mt-1 w-full rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm text-[color:var(--color-text-strong)]"
            >
              <option value="">Select traveler</option>
              {availableTravelers.map((traveler) => (
                <option key={traveler.id} value={traveler.id}>
                  {formatTravelerDisplayName(traveler)}
                </option>
              ))}
            </select>
          </label>
          <label class="flex items-end gap-2 text-sm text-[color:var(--color-text-muted)]">
            <input type="hidden" name="isPrimary" value="false" />
            <input type="checkbox" name="isPrimary" value="true" />
            Mark primary
          </label>
          <div class="md:col-span-2 flex justify-end">
            <button
              type="submit"
              class="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm font-medium text-[color:var(--color-text-strong)] hover:border-[color:var(--color-text-strong)]"
            >
              Save assignment
            </button>
          </div>
        </form>

        {requirementState.assignedProfiles.length ? (
          <ul class="mt-3 space-y-1 text-sm text-[color:var(--color-text-muted)]">
            {requirementState.assignedProfiles.map((profile) => (
              <li key={`${requirement.id}-${profile.id}`}>
                {formatTravelerDisplayName(profile)}
              </li>
            ))}
          </ul>
        ) : null}
      </article>
    );
  },
);
