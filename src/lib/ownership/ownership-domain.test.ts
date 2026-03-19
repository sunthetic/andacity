import assert from "node:assert/strict";
import test from "node:test";

import { attachAnonymousOwnershipsToUser } from "./attachAnonymousOwnershipsToUser.ts";
import { claimAnonymousItineraryOwnership } from "./claimAnonymousItineraryOwnership.ts";
import { createOrResumeItineraryOwnership } from "./createOrResumeItineraryOwnership.ts";
import { createOwnershipClaimToken } from "./createOwnershipClaimToken.ts";
import { hashOwnershipClaimToken } from "./hashOwnershipClaimToken.ts";
import { resolveItineraryAccess } from "./resolveItineraryAccess.ts";
import { verifyOwnershipClaimToken } from "./verifyOwnershipClaimToken.ts";
import type { OwnedItinerary } from "../../types/itinerary.ts";
import type { ItineraryOwnership } from "../../types/ownership.ts";

const buildOwnership = (
  overrides: Partial<ItineraryOwnership> = {},
): ItineraryOwnership => ({
  id: "ito_test",
  itineraryId: "itn_test",
  ownershipMode: "anonymous",
  ownerUserId: null,
  ownerSessionId: "ios_test",
  ownerClaimTokenHash: null,
  source: "confirmation_flow",
  claimedAt: null,
  createdAt: "2026-03-18T16:00:00.000Z",
  updatedAt: "2026-03-18T16:00:00.000Z",
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
  status: "partial",
  currency: "USD",
  summaryJson: { itemCount: 1 },
  ownerUserId: null,
  ownerSessionId: "ios_test",
  createdAt: "2026-03-18T16:00:00.000Z",
  updatedAt: "2026-03-18T16:00:00.000Z",
  ownership: buildOwnership(),
  items: [],
  ...overrides,
});

test("claim tokens are opaque, hashed at rest, and verify safely", () => {
  const claimToken = createOwnershipClaimToken();
  const claimTokenHash = hashOwnershipClaimToken(claimToken);

  assert.ok(claimToken.length >= 32);
  assert.match(claimTokenHash, /^[a-f0-9]{64}$/);
  assert.equal(verifyOwnershipClaimToken(claimToken, claimTokenHash), true);
  assert.equal(verifyOwnershipClaimToken("wrong-token", claimTokenHash), false);
});

test("ownership creation resumes an existing bridge instead of duplicating it", async () => {
  const ownership = buildOwnership();

  const result = await createOrResumeItineraryOwnership(
    {
      itineraryId: "itn_test",
      ownerSessionId: "ios_test",
    },
    {
      getItineraryOwnershipByItineraryId: async () => ownership,
      createAnonymousItineraryOwnership: async () => {
        throw new Error("should not create");
      },
      createUserItineraryOwnership: async () => {
        throw new Error("should not create");
      },
    },
  );

  assert.equal(result.created, false);
  assert.equal(result.claimToken, null);
  assert.equal(result.ownership.id, ownership.id);
});

test("ownership creation branches into anonymous ownership when no user is present", async () => {
  const ownership = buildOwnership();

  const result = await createOrResumeItineraryOwnership(
    {
      itineraryId: "itn_test",
      ownerSessionId: "ios_test",
    },
    {
      getItineraryOwnershipByItineraryId: async () => null,
      createAnonymousItineraryOwnership: async () => ({
        ownership,
        claimToken: "claim_token_test",
      }),
      createUserItineraryOwnership: async () => {
        throw new Error("should not create user ownership");
      },
    },
  );

  assert.equal(result.created, true);
  assert.equal(result.claimToken, "claim_token_test");
  assert.equal(result.ownership.ownershipMode, "anonymous");
});

test("ownership creation branches into user ownership when auth is present", async () => {
  const ownership = buildOwnership({
    ownershipMode: "user",
    ownerUserId: "usr_123",
    ownerSessionId: "ios_test",
  });

  const result = await createOrResumeItineraryOwnership(
    {
      itineraryId: "itn_test",
      ownerUserId: "usr_123",
      ownerSessionId: "ios_test",
    },
    {
      getItineraryOwnershipByItineraryId: async () => null,
      createAnonymousItineraryOwnership: async () => {
        throw new Error("should not create anonymous ownership");
      },
      createUserItineraryOwnership: async () => ownership,
    },
  );

  assert.equal(result.created, true);
  assert.equal(result.claimToken, null);
  assert.equal(result.ownership.ownershipMode, "user");
});

test("access resolution recognizes the current anonymous owner", async () => {
  const itinerary = buildItinerary();

  const result = await resolveItineraryAccess(
    itinerary.publicRef,
    {
      ownerUserId: null,
      ownerSessionId: "ios_test",
      claimTokensByItineraryRef: {},
    },
    {
      getItineraryByPublicRef: async () => itinerary,
      getItineraryOwnershipByItineraryId: async () => itinerary.ownership,
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.isOwner, true);
  assert.equal(result.reasonCode, "OWNER_MATCH");
});

test("access resolution recognizes claimable anonymous ownership via claim token", async () => {
  const claimToken = createOwnershipClaimToken();
  const itinerary = buildItinerary({
    ownership: buildOwnership({
      ownerSessionId: "ios_other",
      ownerClaimTokenHash: hashOwnershipClaimToken(claimToken),
    }),
    ownerSessionId: "ios_other",
  });

  const result = await resolveItineraryAccess(
    itinerary.publicRef,
    {
      ownerUserId: "usr_123",
      ownerSessionId: "ios_test",
      claimTokensByItineraryRef: {
        [itinerary.publicRef]: claimToken,
      },
    },
    {
      getItineraryByPublicRef: async () => itinerary,
      getItineraryOwnershipByItineraryId: async () => itinerary.ownership,
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.isClaimable, true);
  assert.equal(result.reasonCode, "CLAIMABLE_ANONYMOUS_ITINERARY");
});

test("claim flow attaches a claimable anonymous itinerary to the current user", async () => {
  const persisted: Array<Record<string, string>> = [];
  const itinerary = buildItinerary();

  const result = await claimAnonymousItineraryOwnership(
    {
      itineraryRef: itinerary.publicRef,
      ownerUserId: "usr_123",
      ownerSessionId: "ios_test",
      source: "manual_claim",
    },
    {
      getItineraryByPublicRef: async () => itinerary,
      getItineraryOwnershipByItineraryId: async () => itinerary.ownership,
      resolveItineraryAccess: async () => ({
        ok: true,
        reasonCode: "CLAIMABLE_ANONYMOUS_ITINERARY",
        ownershipMode: "anonymous",
        isOwner: false,
        isClaimable: true,
        itineraryRef: itinerary.publicRef,
        message: "claimable",
      }),
      persistClaimToUser: async (input) => {
        persisted.push(input);
      },
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.reasonCode, "CLAIM_SUCCEEDED");
  assert.equal(persisted.length, 1);
  assert.equal(persisted[0]?.ownerUserId, "usr_123");
});

test("claim flow rejects invalid explicit tokens", async () => {
  const validToken = createOwnershipClaimToken();
  const itinerary = buildItinerary({
    ownership: buildOwnership({
      ownerSessionId: "ios_other",
      ownerClaimTokenHash: hashOwnershipClaimToken(validToken),
    }),
  });

  const result = await claimAnonymousItineraryOwnership(
    {
      itineraryRef: itinerary.publicRef,
      claimToken: "invalid-token",
      ownerUserId: "usr_123",
      ownerSessionId: "ios_test",
    },
    {
      getItineraryByPublicRef: async () => itinerary,
      getItineraryOwnershipByItineraryId: async () => itinerary.ownership,
      resolveItineraryAccess: async () => ({
        ok: false,
        reasonCode: "SESSION_MISMATCH",
        ownershipMode: "anonymous",
        isOwner: false,
        isClaimable: false,
        itineraryRef: itinerary.publicRef,
        message: "not claimable",
      }),
      persistClaimToUser: async () => {
        throw new Error("should not persist");
      },
    },
  );

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, "CLAIM_INVALID_TOKEN");
});

test("auto-attach helper claims anonymous itineraries from session and token contexts", async () => {
  const attachedRefs: string[] = [];

  const result = await attachAnonymousOwnershipsToUser(
    {
      ownerUserId: "usr_123",
      ownerSessionId: null,
      claimTokensByItineraryRef: {
        "ITN-ABCDE-23456": "claim-a",
        "ITN-ZYXWV-98765": "claim-b",
      },
    },
    {
      claimAnonymousItineraryOwnership: async (input) => {
        attachedRefs.push(input.itineraryRef);
        return {
          ok: true,
          reasonCode: "CLAIM_SUCCEEDED",
          ownershipMode: "user",
          itineraryRef: input.itineraryRef,
          message: "attached",
        };
      },
    },
  );

  assert.equal(result.ok, true);
  assert.deepEqual(attachedRefs.sort(), [
    "ITN-ABCDE-23456",
    "ITN-ZYXWV-98765",
  ]);
  assert.equal(result.attachedItineraryRefs.length, 2);
});
