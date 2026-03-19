import assert from "node:assert/strict";
import test from "node:test";

import type { ItinerarySummary } from "../../types/itinerary.ts";
import type { CurrentOwnershipContext } from "../../types/ownership.ts";

const groupingModule: typeof import("../itinerary/groupOwnedItineraries.ts") =
  await import(
    new URL("../itinerary/groupOwnedItineraries.ts", import.meta.url).href
  );
const filteringModule: typeof import("./filterMyTrips.ts") = await import(
  new URL("./filterMyTrips.ts", import.meta.url).href
);
const sortingModule: typeof import("./sortMyTrips.ts") = await import(
  new URL("./sortMyTrips.ts", import.meta.url).href
);
const pageModelModule: typeof import("./getMyTripsPageModel.ts") = await import(
  new URL("./getMyTripsPageModel.ts", import.meta.url).href
);

const { groupOwnedItineraries } = groupingModule;
const { filterMyTrips } = filteringModule;
const { sortMyTrips } = sortingModule;
const { getMyTripsPageModel } = pageModelModule;

const baseContext = (
  overrides: Partial<CurrentOwnershipContext> = {},
): CurrentOwnershipContext => ({
  ownerUserId: null,
  ownerSessionId: "ios_test",
  claimTokensByItineraryRef: {},
  ...overrides,
});

const baseSummary = (
  overrides: Partial<ItinerarySummary> = {},
): ItinerarySummary => ({
  itineraryId: "itn_1",
  publicRef: "ITN-ABCDE-12345",
  tripId: 42,
  confirmationId: "cnf_1",
  status: "upcoming",
  statusLabel: "Upcoming",
  statusDescription: "Booked and scheduled for future travel.",
  currency: "USD",
  ownershipMode: "anonymous",
  isOwnedByCurrentContext: true,
  isClaimable: false,
  canAttachToUser: false,
  itemCount: 2,
  totalAmountCents: 42000,
  confirmedItemCount: 2,
  pendingItemCount: 0,
  failedItemCount: 0,
  manualReviewItemCount: 0,
  unresolvedItemCount: 0,
  title: "Austin getaway",
  tripDescription: "Austin, TX",
  locationSummary: "Austin, TX",
  startAt: "2026-05-10T00:00:00.000Z",
  endAt: "2026-05-14T00:00:00.000Z",
  ownerUserId: null,
  ownerSessionId: "ios_test",
  createdAt: "2026-03-18T10:00:00.000Z",
  updatedAt: "2026-03-18T12:00:00.000Z",
  notificationSummary: null,
  hasNotificationIssue: false,
  hasRecoveryIssue: false,
  ...overrides,
});

test("groups itineraries into in-progress, upcoming, issues, and past buckets", () => {
  const grouped = groupOwnedItineraries(
    [
      baseSummary({
        itineraryId: "itn_now",
        publicRef: "ITN-NOWWW-12345",
        status: "in_progress",
      }),
      baseSummary({
        itineraryId: "itn_upcoming",
        publicRef: "ITN-UPCOM-12345",
        startAt: "2026-06-01T00:00:00.000Z",
        endAt: "2026-06-04T00:00:00.000Z",
      }),
      baseSummary({
        itineraryId: "itn_issue",
        publicRef: "ITN-ISSUE-12345",
        status: "partial",
        unresolvedItemCount: 1,
        hasRecoveryIssue: true,
      }),
      baseSummary({
        itineraryId: "itn_past",
        publicRef: "ITN-PASTT-12345",
        status: "completed",
        startAt: "2026-01-10T00:00:00.000Z",
        endAt: "2026-01-14T00:00:00.000Z",
      }),
    ],
    {
      now: "2026-03-19T12:00:00.000Z",
    },
  );

  assert.equal(grouped.in_progress.length, 1);
  assert.equal(grouped.upcoming.length, 1);
  assert.equal(grouped.issues.length, 1);
  assert.equal(grouped.past.length, 1);
});

test("filters upcoming view to in-progress and future trips and matches search text", () => {
  const summaries = [
    baseSummary({
      itineraryId: "itn_now",
      publicRef: "ITN-NOWWW-12345",
      status: "in_progress",
      title: "Now in Denver",
      tripDescription: "Denver, CO",
      locationSummary: "Denver, CO",
    }),
    baseSummary({
      itineraryId: "itn_future",
      publicRef: "ITN-FUTUR-12345",
      title: "Future Austin",
    }),
    baseSummary({
      itineraryId: "itn_past",
      publicRef: "ITN-PASTT-12345",
      status: "completed",
      title: "Old Seattle",
      startAt: "2026-01-10T00:00:00.000Z",
      endAt: "2026-01-14T00:00:00.000Z",
    }),
  ];

  const filtered = filterMyTrips(summaries, {
    filter: "upcoming",
    search: "austin",
    now: "2026-03-19T12:00:00.000Z",
  });

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.publicRef, "ITN-FUTUR-12345");
});

test("sorts past trips by latest end date first", () => {
  const sorted = sortMyTrips(
    [
      baseSummary({
        itineraryId: "itn_older",
        publicRef: "ITN-OLDER-12345",
        status: "completed",
        startAt: "2026-01-10T00:00:00.000Z",
        endAt: "2026-01-14T00:00:00.000Z",
      }),
      baseSummary({
        itineraryId: "itn_recent",
        publicRef: "ITN-RECNT-12345",
        status: "completed",
        startAt: "2026-02-10T00:00:00.000Z",
        endAt: "2026-02-14T00:00:00.000Z",
      }),
    ],
    {
      groupKey: "past",
      now: "2026-03-19T12:00:00.000Z",
    },
  );

  assert.equal(sorted[0]?.publicRef, "ITN-RECNT-12345");
});

test("builds an account-aware page model with grouped trips and issue summary", () => {
  const model = getMyTripsPageModel({
    ownershipContext: baseContext({
      ownerUserId: "usr_123",
    }),
    summaries: [
      baseSummary({
        itineraryId: "itn_account",
        publicRef: "ITN-ACCTT-12345",
        ownershipMode: "user",
        ownerUserId: "usr_123",
        ownerSessionId: null,
        isOwnedByCurrentContext: true,
        title: "Austin work trip",
      }),
      baseSummary({
        itineraryId: "itn_issue",
        publicRef: "ITN-ISSUE-12345",
        ownershipMode: "user",
        ownerUserId: "usr_123",
        ownerSessionId: null,
        status: "partial",
        unresolvedItemCount: 1,
        hasRecoveryIssue: true,
        notificationSummary: {
          eventType: "itinerary_ready",
          status: "failed",
          title: "Notification failed",
          message: "Delivery failed.",
          tone: "error",
          notificationId: "ntf_1",
          sentAt: null,
          failedAt: "2026-03-18T12:00:00.000Z",
          canResend: true,
        },
        hasNotificationIssue: true,
      }),
    ],
    url: new URL("https://andacity.test/my-trips"),
    now: "2026-03-19T12:00:00.000Z",
  });

  assert.equal(model.header.modeLabel, "Account access");
  assert.equal(model.groups.length, 2);
  assert.equal(model.groups[0]?.key, "upcoming");
  assert.equal(model.groups[1]?.key, "issues");
  assert.ok(model.statusSummary);
  assert.equal(
    model.statusSummary?.items.some((item: { label: string }) =>
      item.label.includes("need attention"),
    ),
    true,
  );
  assert.ok(model.resumeBanner);
});

test("returns a filtered empty state when search and filters hide all trips", () => {
  const model = getMyTripsPageModel({
    ownershipContext: baseContext(),
    summaries: [baseSummary()],
    url: new URL("https://andacity.test/my-trips?filter=issues&q=tokyo"),
    now: "2026-03-19T12:00:00.000Z",
  });

  assert.equal(model.isEmpty, true);
  assert.equal(model.emptyState?.title, "No trips match this view");
  assert.equal(model.emptyState?.primaryAction.label, "Clear filters");
});
