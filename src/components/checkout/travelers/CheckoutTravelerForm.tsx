import { component$ } from "@builder.io/qwik";
import type { TravelerRole, TravelerType } from "~/types/travelers";

const TRAVELER_TYPE_OPTIONS: TravelerType[] = ["adult", "child", "infant"];
const TRAVELER_ROLE_OPTIONS: TravelerRole[] = [
  "passenger",
  "guest",
  "driver",
  "primary_contact",
];

export const CheckoutTravelerForm = component$(() => {
  return (
    <form
      method="post"
      class="rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-muted,#f8fafc)] p-4"
    >
      <input type="hidden" name="intent" value="save-traveler-profile" />
      <div class="grid gap-3 md:grid-cols-2">
        <label class="text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
          First name
          <input
            name="firstName"
            type="text"
            required
            class="mt-1 w-full rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm text-[color:var(--color-text-strong)]"
          />
        </label>
        <label class="text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
          Last name
          <input
            name="lastName"
            type="text"
            required
            class="mt-1 w-full rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm text-[color:var(--color-text-strong)]"
          />
        </label>
        <label class="text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
          Traveler type
          <select
            name="type"
            class="mt-1 w-full rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm text-[color:var(--color-text-strong)]"
          >
            {TRAVELER_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {type.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label class="text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
          Default role
          <select
            name="role"
            class="mt-1 w-full rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm text-[color:var(--color-text-strong)]"
          >
            {TRAVELER_ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label class="text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
          Date of birth
          <input
            name="dateOfBirth"
            type="date"
            class="mt-1 w-full rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm text-[color:var(--color-text-strong)]"
          />
        </label>
        <label class="text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
          Email
          <input
            name="email"
            type="email"
            class="mt-1 w-full rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm text-[color:var(--color-text-strong)]"
          />
        </label>
        <label class="text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
          Phone
          <input
            name="phone"
            type="tel"
            class="mt-1 w-full rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm text-[color:var(--color-text-strong)]"
          />
        </label>
        <label class="text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
          Nationality
          <input
            name="nationality"
            type="text"
            maxLength={2}
            placeholder="US"
            class="mt-1 w-full rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm uppercase text-[color:var(--color-text-strong)]"
          />
        </label>
        <label class="text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
          Document type
          <select
            name="documentType"
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
            class="mt-1 w-full rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm text-[color:var(--color-text-strong)]"
          />
        </label>
        <label class="text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
          Document expiry
          <input
            name="documentExpiryDate"
            type="date"
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
            class="mt-1 w-full rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm text-[color:var(--color-text-strong)]"
          />
        </label>
      </div>
      <div class="mt-4 flex justify-end">
        <button
          type="submit"
          class="rounded-lg bg-[color:var(--color-action)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Save traveler
        </button>
      </div>
    </form>
  );
});
