import assert from "node:assert/strict";
import test from "node:test";

import { getResumeRedirectUrl } from "./getResumeRedirectUrl.ts";
import { getResumeTarget } from "./getResumeTarget.ts";
import { resolveResumeFlow } from "./resolveResumeFlow.ts";
import type { TripByAnyRefResult } from "./types.ts";
import type { BookingConfirmation } from "../../types/confirmation.ts";
import type { OwnedItinerary } from "../../types/itinerary.ts";
import type { RecoveryState } from "../../types/recovery.ts";
import type { ItineraryAccessResult } from "../../types/ownership.ts";

const buildConfirmation = (
  overrides: Partial<BookingConfirmation> = {},
): BookingConfirmation => ({
  id: "cnf_test",
  publicRef: "CNF-ABCDE-12345",
  tripId: 42,
  checkoutSessionId: "cko_test",
  paymentSessionId: "pay_test",
  bookingRunId: "brn_test",
  status: "confirmed",
  currency: "USD",
  totalsJson: {
    totalAmountCents: 120000,
  },
  summaryJson: {
    confirmationId: "cnf_test",
    publicRef: "CNF-ABCDE-12345",
    status: "confirmed",
    statusLabel: "Confirmed",
    statusDescription: "Everything is confirmed.",
    totalItemCount: 1,
    confirmedItemCount: 1,
    pendingItemCount: 0,
    failedItemCount: 0,
    requiresManualReviewCount: 0,
    unresolvedItemCount: 0,
    confirmedItemTitles: ["Flight to Austin"],
    unresolvedItemTitles: [],
    currency: "USD",
    totalAmountCents: 120000,
    confirmedAt: "2026-03-18T10:00:00.000Z",
    hasItinerary: false,
    itineraryRef: null,
    itineraryStatus: null,
  },
  confirmedAt: "2026-03-18T10:00:00.000Z",
  createdAt: "2026-03-18T10:00:00.000Z",
  updatedAt: "2026-03-18T10:00:00.000Z",
  items: [
    {
      id: "item_1",
      confirmationId: "cnf_test",
      bookingItemExecutionId: "bix_1",
      checkoutItemKey: "flight:1",
      vertical: "flight",
      status: "confirmed",
      title: "Flight to Austin",
      subtitle: null,
      startAt: "2026-04-01T12:00:00.000Z",
      endAt: "2026-04-01T15:00:00.000Z",
      locationSummary: "DEN to AUS",
      provider: "duffel",
      providerBookingReference: "BOOK-123",
      providerConfirmationCode: "CONF-123",
      detailsJson: null,
      createdAt: "2026-03-18T10:00:00.000Z",
      updatedAt: "2026-03-18T10:00:00.000Z",
    },
  ],
  ...overrides,
});

const buildItinerary = (
  overrides: Partial<OwnedItinerary> = {},
): OwnedItinerary => ({
  id: "itn_test",
  publicRef: "ITN-ABCDE-23456",
  tripId: 42,
  checkoutSessionId: "cko_test",
  paymentSessionId: "pay_test",
  bookingRunId: "brn_test",
  confirmationId: "cnf_test",
  status: "active",
  currency: "USD",
  summaryJson: {
    itemCount: 1,
  },
  ownerUserId: "usr_123",
  ownerSessionId: "ios_123",
  createdAt: "2026-03-18T10:00:00.000Z",
  updatedAt: "2026-03-18T10:00:00.000Z",
  ownership: null,
  items: [],
  ...overrides,
});

const buildAccess = (
  overrides: Partial<ItineraryAccessResult> = {},
): ItineraryAccessResult => ({
  ok: true,
  reasonCode: "OWNER_MATCH",
  ownershipMode: "user",
  isOwner: true,
  isClaimable: false,
  itineraryRef: "ITN-ABCDE-23456",
  message: "You own this itinerary.",
  ...overrides,
});

const buildLookupResult = (
  overrides: Partial<TripByAnyRefResult> = {},
): TripByAnyRefResult => ({
  incomingRef: "CNF-ABCDE-12345",
  incomingRefType: "confirmation",
  matchedRefType: "confirmation",
  confirmation: buildConfirmation(),
  itinerary: null,
  ...overrides,
});

const ownerContext = {
  ownerUserId: "usr_123",
  ownerSessionId: "ios_123",
  claimTokensByItineraryRef: {},
};

test("confirmation-only references resume to confirmation", async () => {
  const result = await resolveResumeFlow(
    {
      incomingRef: "CNF-ABCDE-12345",
      ownershipContext: ownerContext,
    },
    {
      getTripByAnyRef: async () => buildLookupResult(),
      resolveItineraryAccess: async () => {
        throw new Error("should not resolve itinerary access");
      },
    },
  );

  assert.equal(result.target.type, "confirmation");
  assert.equal(result.target.ref, "CNF-ABCDE-12345");
  assert.equal(getResumeRedirectUrl(result.target), "/confirmation/CNF-ABCDE-12345?resume_reason=confirmation_entrypoint");
});

test("owned itinerary references resume to itinerary", async () => {
  const itinerary = buildItinerary();
  const confirmation = buildConfirmation({
    summaryJson: {
      ...buildConfirmation().summaryJson!,
      hasItinerary: true,
      itineraryRef: itinerary.publicRef,
      itineraryStatus: "active",
    },
  });

  const result = await resolveResumeFlow(
    {
      incomingRef: itinerary.publicRef,
      ownershipContext: ownerContext,
    },
    {
      getTripByAnyRef: async () =>
        buildLookupResult({
          incomingRef: itinerary.publicRef,
          incomingRefType: "itinerary",
          matchedRefType: "itinerary",
          confirmation,
          itinerary,
        }),
      resolveItineraryAccess: async () => buildAccess({ itineraryRef: itinerary.publicRef }),
    },
  );

  assert.equal(result.target.type, "itinerary");
  assert.equal(result.target.ref, itinerary.publicRef);
  assert.match(
    getResumeRedirectUrl(result.target) || "",
    new RegExp(`^/itinerary/${itinerary.publicRef}`),
  );
});

test("confirmation entrypoints stay on confirmation even when itinerary exists", () => {
  const itinerary = buildItinerary();
  const target = getResumeTarget({
    incomingRefType: "confirmation",
    confirmation: buildConfirmation({
      summaryJson: {
        ...buildConfirmation().summaryJson!,
        hasItinerary: true,
        itineraryRef: itinerary.publicRef,
        itineraryStatus: "active",
      },
    }),
    itinerary,
    access: buildAccess({ itineraryRef: itinerary.publicRef }),
  });

  assert.equal(target.type, "confirmation");
  assert.equal(target.ref, "CNF-ABCDE-12345");
});

test("claimable itinerary references route to claim-aware itinerary", async () => {
  const itinerary = buildItinerary();
  const target = getResumeTarget({
    itinerary,
    access: buildAccess({
      ok: true,
      reasonCode: "CLAIMABLE_ANONYMOUS_ITINERARY",
      ownershipMode: "anonymous",
      isOwner: false,
      isClaimable: true,
      itineraryRef: itinerary.publicRef,
      message: "claimable",
    }),
  });

  assert.equal(target.type, "claim");
  assert.equal(target.requiresClaim, true);

  const redirect = getResumeRedirectUrl(target);
  assert.equal(
    redirect,
    `/itinerary/${itinerary.publicRef}?resume=claim&resume_claim=1&resume_reason=itinerary_claimable`,
  );
});

test("invalid references resolve to not_found", async () => {
  const result = await resolveResumeFlow(
    {
      incomingRef: "NOT-A-REF",
      ownershipContext: ownerContext,
    },
    {
      getTripByAnyRef: async () =>
        buildLookupResult({
          incomingRef: "NOT-A-REF",
          incomingRefType: "unknown",
          matchedRefType: null,
          confirmation: null,
          itinerary: null,
        }),
      resolveItineraryAccess: async () => {
        throw new Error("should not resolve itinerary access");
      },
    },
  );

  assert.equal(result.target.type, "not_found");
  assert.equal(getResumeRedirectUrl(result.target), null);
});

test("failed confirmation states route through recovery target", async () => {
  const confirmation = buildConfirmation({
    status: "failed",
    summaryJson: {
      ...buildConfirmation().summaryJson!,
      status: "failed",
      statusLabel: "Failed",
      statusDescription: "Booking failed.",
      failedItemCount: 1,
      unresolvedItemCount: 1,
      confirmedItemCount: 0,
      confirmedItemTitles: [],
      unresolvedItemTitles: ["Flight to Austin"],
    },
  });

  const result = await resolveResumeFlow(
    {
      incomingRef: confirmation.publicRef,
      ownershipContext: ownerContext,
    },
    {
      getTripByAnyRef: async () =>
        buildLookupResult({
          incomingRef: confirmation.publicRef,
          incomingRefType: "confirmation",
          matchedRefType: "confirmation",
          confirmation,
          itinerary: null,
        }),
      resolveItineraryAccess: async () => {
        throw new Error("should not resolve itinerary access");
      },
    },
  );

  assert.equal(result.target.type, "recovery");
  assert.equal(result.target.requiresRecovery, true);
  assert.equal(result.target.surface, "confirmation");
  assert.equal(
    getResumeRedirectUrl(result.target),
    `/confirmation/${confirmation.publicRef}?resume=recovery&resume_recovery=1&resume_reason=confirmation_recovery_required`,
  );
});

test("claim remains primary when both claim and recovery signals are present", () => {
  const itinerary = buildItinerary({
    ownerUserId: null,
    ownerSessionId: "ios_other",
  });

  const recoveryState: RecoveryState = {
    stage: "itinerary",
    severity: "warning",
    reasonCode: "ITINERARY_CREATE_FAILED",
    title: "Recovery",
    message: "Needs follow-up",
    actions: [],
    isRetryable: true,
    isTerminal: false,
    metadata: {
      itineraryRef: itinerary.publicRef,
    },
  };

  const target = getResumeTarget({
    itinerary,
    access: buildAccess({
      ok: true,
      reasonCode: "CLAIMABLE_ANONYMOUS_ITINERARY",
      ownershipMode: "anonymous",
      isOwner: false,
      isClaimable: true,
      itineraryRef: itinerary.publicRef,
      message: "claimable",
    }),
    recoveryState,
  });

  assert.equal(target.type, "claim");
  assert.equal(target.requiresClaim, true);
  assert.equal(target.requiresRecovery, true);
});
