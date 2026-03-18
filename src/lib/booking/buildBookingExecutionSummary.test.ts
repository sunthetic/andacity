import assert from "node:assert/strict";
import test from "node:test";

import type { BookingItemExecution } from "../../types/booking.ts";

const summaryModule: typeof import("./buildBookingExecutionSummary.ts") =
  await import(
    new URL("./buildBookingExecutionSummary.ts", import.meta.url).href
  );

const { buildBookingExecutionSummary } = summaryModule;

const buildItemExecution = (
  overrides: Partial<BookingItemExecution> = {},
): BookingItemExecution => ({
  id: "bix_1",
  bookingRunId: "brn_1",
  checkoutItemKey: "trip-item:1:hotel:test",
  tripItemId: 1,
  title: "Ace Palm Hotel",
  vertical: "hotel",
  provider: "hotel",
  status: "pending",
  providerBookingReference: null,
  providerConfirmationCode: null,
  requestSnapshotJson: null,
  responseSnapshotJson: null,
  errorCode: null,
  errorMessage: null,
  startedAt: null,
  completedAt: null,
  createdAt: "2026-03-18T12:00:00.000Z",
  updatedAt: "2026-03-18T12:00:00.000Z",
  ...overrides,
});

test("marks mixed item results as partial", () => {
  const summary = buildBookingExecutionSummary([
    buildItemExecution({
      id: "bix_success",
      status: "succeeded",
      providerBookingReference: "hotel-booking-1",
    }),
    buildItemExecution({
      id: "bix_failed",
      checkoutItemKey: "trip-item:2:flight:test",
      tripItemId: 2,
      title: "Outbound flight",
      vertical: "flight",
      provider: "flight",
      status: "failed",
      errorCode: "PROVIDER_UNAVAILABLE",
      errorMessage: "Provider timed out.",
    }),
  ]);

  assert.equal(summary.overallStatus, "partial");
  assert.equal(summary.runStatus, "partial");
  assert.equal(summary.succeededCount, 1);
  assert.equal(summary.failedCount, 1);
});

test("marks manual-review-only runs distinctly", () => {
  const summary = buildBookingExecutionSummary([
    buildItemExecution({
      status: "requires_manual_review",
      errorCode: "UNKNOWN_BOOKING_ERROR",
      errorMessage: "Provider response needs review.",
    }),
  ]);

  assert.equal(summary.overallStatus, "requires_manual_review");
  assert.equal(summary.runStatus, "failed");
  assert.match(summary.message, /manual review/i);
});
