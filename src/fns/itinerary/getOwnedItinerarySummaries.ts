import { and, desc, eq, inArray } from "drizzle-orm";
import { buildNotificationSummary } from "~/fns/notifications/buildNotificationSummary";
import { mapNotificationRow } from "~/fns/notifications/getNotification";
import { getDb } from "~/lib/db/client.server";
import { notifications } from "~/lib/db/schema";
import {
  hasItineraryNotificationIssue,
  hasItineraryRecoveryIssue,
} from "~/lib/itinerary/buildItinerarySummary";
import { withCheckoutSchemaGuard } from "~/lib/checkout/getCheckoutSession";
import { getOwnedItineraryList } from "~/lib/itinerary/getOwnedItineraryList";
import type { ItineraryStatus, ItinerarySummary } from "~/types/itinerary";
import type { CurrentOwnershipContext } from "~/types/ownership";

const ITINERARY_NOTIFICATION_EVENTS = [
  "itinerary_claim_available",
  "itinerary_ready",
] as const;

const getContextualSummary = (
  summary: ItinerarySummary,
  input: {
    source: "user" | "session";
    ownerUserId: string | null;
  },
) => {
  const isSessionSummary = input.source === "session";
  const isOwnedByCurrentContext = isSessionSummary ? !input.ownerUserId : true;
  const isClaimable = Boolean(isSessionSummary && input.ownerUserId);

  return {
    ...summary,
    isOwnedByCurrentContext,
    isClaimable,
    canAttachToUser: isClaimable,
  } satisfies ItinerarySummary;
};

const getNotificationSummariesByItineraryId = async (
  itineraryIds: string[],
) => {
  if (!itineraryIds.length) {
    return new Map<
      string,
      NonNullable<ItinerarySummary["notificationSummary"]>
    >();
  }

  return withCheckoutSchemaGuard(async () => {
    const db = getDb();
    const rows = await db
      .select()
      .from(notifications)
      .where(
        and(
          inArray(notifications.relatedItineraryId, itineraryIds),
          inArray(notifications.eventType, [...ITINERARY_NOTIFICATION_EVENTS]),
        ),
      )
      .orderBy(desc(notifications.createdAt));

    const recordsByItineraryId = new Map<
      string,
      ReturnType<typeof mapNotificationRow>[]
    >();

    for (const row of rows) {
      const relatedItineraryId = String(row.relatedItineraryId || "").trim();
      if (!relatedItineraryId) continue;

      const records = recordsByItineraryId.get(relatedItineraryId) || [];
      records.push(mapNotificationRow(row));
      recordsByItineraryId.set(relatedItineraryId, records);
    }

    return Array.from(recordsByItineraryId.entries()).reduce(
      (acc, [itineraryId, records]) => {
        acc.set(
          itineraryId,
          buildNotificationSummary({
            records,
            preferredEventTypes: [...ITINERARY_NOTIFICATION_EVENTS],
          }),
        );
        return acc;
      },
      new Map<string, NonNullable<ItinerarySummary["notificationSummary"]>>(),
    );
  });
};

export const getOwnedItinerarySummaries = async (input: {
  ownershipContext: CurrentOwnershipContext;
  statuses?: ItineraryStatus[];
}) => {
  const ownerUserId =
    String(input.ownershipContext.ownerUserId || "").trim() || null;
  const ownerSessionId =
    String(input.ownershipContext.ownerSessionId || "").trim() || null;

  const [userSummaries, sessionSummaries] = await Promise.all([
    ownerUserId
      ? getOwnedItineraryList({
          ownerUserId,
          statuses: input.statuses,
        })
      : Promise.resolve([]),
    ownerSessionId
      ? getOwnedItineraryList({
          ownerSessionId,
          statuses: input.statuses,
        })
      : Promise.resolve([]),
  ]);

  const summariesById = new Map<string, ItinerarySummary>();

  for (const summary of userSummaries) {
    summariesById.set(
      summary.itineraryId,
      getContextualSummary(summary, {
        source: "user",
        ownerUserId,
      }),
    );
  }

  for (const summary of sessionSummaries) {
    if (summariesById.has(summary.itineraryId)) continue;

    summariesById.set(
      summary.itineraryId,
      getContextualSummary(summary, {
        source: "session",
        ownerUserId,
      }),
    );
  }

  const notificationSummaries = await getNotificationSummariesByItineraryId(
    Array.from(summariesById.keys()),
  );

  return Array.from(summariesById.values()).map((summary) => {
    const notificationSummary =
      notificationSummaries.get(summary.itineraryId) ||
      summary.notificationSummary ||
      null;

    return {
      ...summary,
      notificationSummary,
      hasNotificationIssue: hasItineraryNotificationIssue({
        notificationSummary,
      }),
      hasRecoveryIssue:
        summary.hasRecoveryIssue ?? hasItineraryRecoveryIssue(summary),
    } satisfies ItinerarySummary;
  });
};
