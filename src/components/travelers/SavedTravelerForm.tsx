import { component$ } from "@builder.io/qwik";
import type { SavedTravelerProfile } from "~/types/saved-travelers";

export const SavedTravelerForm = component$(
  (props: {
    intent: "create-saved-traveler" | "update-saved-traveler";
    traveler?: SavedTravelerProfile | null;
    submitLabel: string;
  }) => {
    const traveler = props.traveler || null;

    return (
      <form
        method="post"
        class="rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-muted,#f8fafc)] p-4"
      >
        <input type="hidden" name="intent" value={props.intent} />
        {traveler ? (
          <input type="hidden" name="savedTravelerId" value={traveler.id} />
        ) : null}

        <div class="grid gap-3 md:grid-cols-2">
          <label class="text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
            Label
            <input
              name="label"
              type="text"
              value={traveler?.label || ""}
              placeholder="Work traveler"
              class="mt-1 w-full rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm text-[color:var(--color-text-strong)]"
            />
          </label>
          <label class="text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
            Traveler type
            <select
              name="type"
              value={traveler?.type || "adult"}
              class="mt-1 w-full rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm text-[color:var(--color-text-strong)]"
            >
              <option value="adult">Adult</option>
              <option value="child">Child</option>
              <option value="infant">Infant</option>
            </select>
          </label>
          <label class="text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
            First name
            <input
              name="firstName"
              type="text"
              required
              value={traveler?.firstName || ""}
              class="mt-1 w-full rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm text-[color:var(--color-text-strong)]"
            />
          </label>
          <label class="text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
            Middle name
            <input
              name="middleName"
              type="text"
              value={traveler?.middleName || ""}
              class="mt-1 w-full rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm text-[color:var(--color-text-strong)]"
            />
          </label>
          <label class="text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
            Last name
            <input
              name="lastName"
              type="text"
              required
              value={traveler?.lastName || ""}
              class="mt-1 w-full rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm text-[color:var(--color-text-strong)]"
            />
          </label>
          <label class="text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
            Date of birth
            <input
              name="dateOfBirth"
              type="date"
              value={traveler?.dateOfBirth || ""}
              class="mt-1 w-full rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm text-[color:var(--color-text-strong)]"
            />
          </label>
          <label class="text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
            Email
            <input
              name="email"
              type="email"
              value={traveler?.email || ""}
              class="mt-1 w-full rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm text-[color:var(--color-text-strong)]"
            />
          </label>
          <label class="text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
            Phone
            <input
              name="phone"
              type="tel"
              value={traveler?.phone || ""}
              class="mt-1 w-full rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm text-[color:var(--color-text-strong)]"
            />
          </label>
          <label class="text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
            Nationality
            <input
              name="nationality"
              type="text"
              maxLength={2}
              value={traveler?.nationality || ""}
              placeholder="US"
              class="mt-1 w-full rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm uppercase text-[color:var(--color-text-strong)]"
            />
          </label>
          <label class="text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
            Issuing country
            <input
              name="issuingCountry"
              type="text"
              maxLength={2}
              value={traveler?.issuingCountry || ""}
              placeholder="US"
              class="mt-1 w-full rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm uppercase text-[color:var(--color-text-strong)]"
            />
          </label>
          <label class="text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
            Document type
            <select
              name="documentType"
              value={traveler?.documentType || ""}
              class="mt-1 w-full rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm text-[color:var(--color-text-strong)]"
            >
              <option value="">Not set</option>
              <option value="passport">Passport</option>
              <option value="drivers_license">Driver's license</option>
              <option value="national_id">National ID</option>
            </select>
          </label>
          <label class="text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
            Document number
            <input
              name="documentNumber"
              type="text"
              value={traveler?.documentNumber || ""}
              class="mt-1 w-full rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm text-[color:var(--color-text-strong)]"
            />
          </label>
          <label class="text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
            Document expiry
            <input
              name="documentExpiryDate"
              type="date"
              value={traveler?.documentExpiryDate || ""}
              class="mt-1 w-full rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm text-[color:var(--color-text-strong)]"
            />
          </label>
          <label class="text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
            Known traveler number
            <input
              name="knownTravelerNumber"
              type="text"
              value={traveler?.knownTravelerNumber || ""}
              class="mt-1 w-full rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm text-[color:var(--color-text-strong)]"
            />
          </label>
          <label class="text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
            Redress number
            <input
              name="redressNumber"
              type="text"
              value={traveler?.redressNumber || ""}
              class="mt-1 w-full rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm text-[color:var(--color-text-strong)]"
            />
          </label>
          <label class="text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
            Driver age
            <input
              name="driverAge"
              type="number"
              min={16}
              max={100}
              value={traveler?.driverAge ?? ""}
              class="mt-1 w-full rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm text-[color:var(--color-text-strong)]"
            />
          </label>
        </div>

        <label class="mt-4 flex items-center gap-2 text-sm text-[color:var(--color-text-muted)]">
          <input type="hidden" name="isDefault" value="false" />
          <input
            type="checkbox"
            name="isDefault"
            value="true"
            checked={traveler?.isDefault || false}
          />
          Set as default saved traveler
        </label>

        <div class="mt-4 flex justify-end">
          <button
            type="submit"
            class="rounded-lg bg-[color:var(--color-action)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            {props.submitLabel}
          </button>
        </div>
      </form>
    );
  },
);
