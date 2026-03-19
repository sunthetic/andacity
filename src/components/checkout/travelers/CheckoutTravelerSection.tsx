import { component$ } from "@builder.io/qwik";
import { CheckoutTravelerAssignmentCard } from "~/components/checkout/travelers/CheckoutTravelerAssignmentCard";
import { CheckoutTravelerForm } from "~/components/checkout/travelers/CheckoutTravelerForm";
import { CheckoutTravelerList } from "~/components/checkout/travelers/CheckoutTravelerList";
import { SavedTravelerPicker } from "~/components/checkout/travelers/SavedTravelerPicker";
import { CheckoutTravelerValidationNotice } from "~/components/checkout/travelers/CheckoutTravelerValidationNotice";
import type { CheckoutTravelerPageModel } from "~/types/travelers";

export const CheckoutTravelerSection = component$(
  (props: {
    pageModel: CheckoutTravelerPageModel;
    travelerNotice?: {
      code: string;
      message: string;
      tone: "info" | "success" | "error";
    } | null;
  }) => {
    return (
      <section
        id="checkout-travelers"
        class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-sm)]"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
              Traveler details
            </p>
            <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              Save traveler profiles, assign them to checkout items, and resolve
              validation issues before payment starts.
            </p>
          </div>
          <span class="rounded-full border border-[color:var(--color-border)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
            {props.pageModel.validationSummary.status}
          </span>
        </div>

        <div class="mt-5 space-y-4">
          <CheckoutTravelerValidationNotice
            validationSummary={props.pageModel.validationSummary}
            travelerNotice={props.travelerNotice}
          />

          {props.pageModel.canManageSavedTravelers ? (
            <div class="space-y-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                    Reuse saved travelers
                  </p>
                  <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
                    Import an account-owned profile as a checkout copy. Changes
                    in checkout will not modify the saved profile.
                  </p>
                </div>
                {props.pageModel.savedTravelerManageHref ? (
                  <a
                    href={props.pageModel.savedTravelerManageHref}
                    class="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-muted)] hover:border-[color:var(--color-text-strong)] hover:text-[color:var(--color-text-strong)]"
                  >
                    Manage saved travelers
                  </a>
                ) : null}
              </div>

              <SavedTravelerPicker
                suggestions={props.pageModel.savedTravelerSuggestions}
                manageHref={props.pageModel.savedTravelerManageHref}
              />
            </div>
          ) : null}

          <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div class="space-y-3">
              <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                Checkout traveler profiles
              </p>
              <CheckoutTravelerList
                travelers={props.pageModel.profiles}
                canManageSavedTravelers={
                  props.pageModel.canManageSavedTravelers
                }
              />
            </div>
            <div class="space-y-3">
              <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                Add traveler profile
              </p>
              <CheckoutTravelerForm />
            </div>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between gap-2">
              <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                Assignment requirements
              </p>
              <form method="post">
                <input type="hidden" name="intent" value="validate-travelers" />
                <button
                  type="submit"
                  class="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-muted)] hover:border-[color:var(--color-text-strong)] hover:text-[color:var(--color-text-strong)]"
                >
                  Revalidate travelers
                </button>
              </form>
            </div>
            <div class="space-y-3">
              {props.pageModel.requirementStates.map((state) => (
                <CheckoutTravelerAssignmentCard
                  key={state.requirement.id}
                  requirementState={state}
                  travelers={props.pageModel.profiles}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  },
);
