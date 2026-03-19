import { and, eq } from "drizzle-orm";
import { getDb } from "~/lib/db/client.server";
import { itineraries, itineraryOwnerships } from "~/lib/db/schema";
import { withCheckoutSchemaGuard } from "~/lib/checkout/getCheckoutSession";
import { claimAnonymousItineraryOwnership } from "~/lib/ownership/claimAnonymousItineraryOwnership";
import { toNullableText } from "~/lib/ownership/shared";

export const attachAnonymousOwnershipsToUser = async (
  input: {
    ownerUserId: string | null;
    ownerSessionId?: string | null;
    claimTokensByItineraryRef?: Record<string, string>;
  },
  deps: {
    claimAnonymousItineraryOwnership?: typeof claimAnonymousItineraryOwnership;
  } = {},
) => {
  const ownerUserId = toNullableText(input.ownerUserId);
  if (!ownerUserId) {
    return {
      ok: false,
      attachedItineraryRefs: [] as string[],
      message: "No authenticated user is available for ownership attachment.",
    };
  }

  const claimOwnership =
    deps.claimAnonymousItineraryOwnership || claimAnonymousItineraryOwnership;
  const candidateRefs = new Map<string, string | null>();
  const ownerSessionId = toNullableText(input.ownerSessionId);

  if (ownerSessionId) {
    const sessionRefs = await withCheckoutSchemaGuard(async () => {
      const db = getDb();
      return db
        .select({
          publicRef: itineraries.publicRef,
        })
        .from(itineraryOwnerships)
        .innerJoin(itineraries, eq(itineraryOwnerships.itineraryId, itineraries.id))
        .where(
          and(
            eq(itineraryOwnerships.ownershipMode, "anonymous"),
            eq(itineraryOwnerships.ownerSessionId, ownerSessionId),
          ),
        );
    });

    for (const row of sessionRefs) {
      candidateRefs.set(row.publicRef, null);
    }
  }

  for (const [itineraryRef, claimToken] of Object.entries(
    input.claimTokensByItineraryRef || {},
  )) {
    if (itineraryRef && claimToken) {
      candidateRefs.set(itineraryRef, claimToken);
    }
  }

  const attachedItineraryRefs: string[] = [];

  for (const [itineraryRef, claimToken] of candidateRefs.entries()) {
    const result = await claimOwnership({
      itineraryRef,
      claimToken,
      ownerUserId,
      ownerSessionId: ownerSessionId || null,
      source: "auto_attach_on_signin",
    });

    if (result.ok) {
      attachedItineraryRefs.push(itineraryRef);
    }
  }

  return {
    ok: true,
    attachedItineraryRefs,
    message: attachedItineraryRefs.length
      ? "Anonymous itineraries were attached to the current user."
      : "No anonymous itineraries were eligible for attachment.",
  };
};
