import assert from "node:assert/strict";
import test from "node:test";

import type { NotificationRecord } from "../../types/notifications.ts";

const dedupeModule: typeof import("./getNotificationDedupeKey.ts") = await import(
  new URL("./getNotificationDedupeKey.ts", import.meta.url).href
);
const summaryModule: typeof import("./buildNotificationSummary.ts") = await import(
  new URL("./buildNotificationSummary.ts", import.meta.url).href
);
const statusModule: typeof import("./mapProviderNotificationStatus.ts") =
  await import(new URL("./mapProviderNotificationStatus.ts", import.meta.url).href);
const linksModule: typeof import("./getNotificationLinks.ts") = await import(
  new URL("./getNotificationLinks.ts", import.meta.url).href
);

const { getNotificationDedupeKey } = dedupeModule;
const { buildNotificationSummary } = summaryModule;
const { mapProviderNotificationStatus } = statusModule;
const { getNotificationLinks } = linksModule;

const buildNotificationRecord = (
  overrides: Partial<NotificationRecord> = {},
): NotificationRecord => {
  return {
    id: "ntf_test",
    eventType: "booking_confirmation",
    channel: "email",
    provider: "resend",
    status: "sent",
    recipientJson: {
      email: "traveler@example.com",
      name: "Alex Traveler",
      ownerUserId: null,
      ownerSessionId: null,
    },
    subject: "Your booking is confirmed",
    payloadJson: {
      version: "v1",
      renderModel: {
        eventType: "booking_confirmation",
        subject: "Your booking is confirmed",
        recipient: {
          email: "traveler@example.com",
          name: "Alex Traveler",
          ownerUserId: null,
          ownerSessionId: null,
        },
        greetingName: "Alex",
        headline: "Confirmed",
        intro: "Everything is set.",
        referenceLabel: "Confirmation reference",
        referenceValue: "CNF-ABCDE-12345",
        itemSummaries: [],
        primaryCtaLabel: "Open confirmation",
        primaryCtaHref: "/confirmation/CNF-ABCDE-12345",
        secondaryCtaLabel: null,
        secondaryCtaHref: null,
        ownershipMode: null,
        links: {
          confirmationUrl: "/confirmation/CNF-ABCDE-12345",
          itineraryUrl: null,
          resumeUrl: "/resume/CNF-ABCDE-12345",
          claimUrl: null,
        },
      },
    },
    providerMessageId: "msg_123",
    providerMetadata: null,
    dedupeKey: "notification:booking_confirmation:cnf_test:traveler@example.com",
    relatedConfirmationId: "cnf_test",
    relatedItineraryId: null,
    relatedCheckoutSessionId: "cko_test",
    sentAt: "2026-03-19T10:00:00.000Z",
    deliveredAt: null,
    failedAt: null,
    failureMessage: null,
    skipReason: null,
    createdAt: "2026-03-19T10:00:00.000Z",
    updatedAt: "2026-03-19T10:00:00.000Z",
    ...overrides,
  };
};

test("builds stable dedupe keys for lifecycle notifications", () => {
  const keyA = getNotificationDedupeKey({
    eventType: "booking_confirmation",
    confirmationId: "cnf_1",
    recipientEmail: "Traveler@Example.com",
    ownershipMode: "user",
  });
  const keyB = getNotificationDedupeKey({
    eventType: "booking_confirmation",
    confirmationId: "cnf_1",
    recipientEmail: " traveler@example.com ",
    ownershipMode: "user",
  });

  assert.equal(keyA, keyB);
  assert.match(keyA, /^notification:booking_confirmation:/);
});

test("maps provider statuses into normalized notification statuses", () => {
  assert.equal(
    mapProviderNotificationStatus({
      provider: "resend",
      providerStatus: "delivered",
    }),
    "delivered",
  );
  assert.equal(
    mapProviderNotificationStatus({
      provider: "resend",
      providerStatus: "queued",
    }),
    "queued",
  );
  assert.equal(
    mapProviderNotificationStatus({
      provider: "resend",
      providerStatus: "error",
    }),
    "failed",
  );
});

test("builds a resend-capable summary for failed notifications", () => {
  const summary = buildNotificationSummary({
    records: [
      buildNotificationRecord({
        status: "failed",
        failureMessage: "Provider timeout.",
        failedAt: "2026-03-19T10:02:00.000Z",
      }),
    ],
    preferredEventTypes: ["booking_confirmation"],
  });

  assert.equal(summary.status, "failed");
  assert.equal(summary.tone, "error");
  assert.equal(summary.canResend, true);
  assert.match(summary.message, /timeout/i);
});

test("builds ownership-aware canonical notification links", () => {
  const links = getNotificationLinks({
    confirmationRef: "CNF-ABCDE-12345",
    itineraryRef: "ITN-ABCDE-12345",
    ownershipMode: "anonymous",
    includeClaimFlow: true,
  });

  assert.ok(links.confirmationUrl);
  assert.ok(links.itineraryUrl);
  assert.ok(links.resumeUrl);
  assert.ok(links.claimUrl);
  assert.match(String(links.claimUrl), /resume=claim/);
});
