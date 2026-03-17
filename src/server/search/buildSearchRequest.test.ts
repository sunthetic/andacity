import assert from "node:assert/strict";
import test from "node:test";

const buildSearchRequestModule: typeof import("./buildSearchRequest.ts") = await import(
  new URL("./buildSearchRequest.ts", import.meta.url).href
);

const { buildSearchRequest } = buildSearchRequestModule;

test("builds a normalized flight request from route-like input", () => {
  assert.deepEqual(
    buildSearchRequest({
      type: "flight",
      origin: " orl ",
      destination: "lax",
      departDate: "2026-05-10",
    }),
    {
      ok: true,
      data: {
        type: "flight",
        origin: "ORL",
        destination: "LAX",
        departDate: "2026-05-10",
      },
    },
  );
});

test("builds a normalized hotel request from form-like input", () => {
  assert.deepEqual(
    buildSearchRequest({
      vertical: "hotels",
      citySlug: "Las-Vegas-NV-US",
      checkIn: "2026-05-10",
      checkOut: "2026-05-15",
    }),
    {
      ok: true,
      data: {
        type: "hotel",
        city: "las-vegas-nv-us",
        checkIn: "2026-05-10",
        checkOut: "2026-05-15",
      },
    },
  );
});

test("builds a normalized car request from API-like input", () => {
  assert.deepEqual(
    buildSearchRequest(
      new URLSearchParams({
        type: "car",
        airport: "lax",
        pickupDate: "2026-05-10",
        dropoffDate: "2026-05-15",
      }),
    ),
    {
      ok: true,
      data: {
        type: "car",
        airport: "LAX",
        pickupDate: "2026-05-10",
        dropoffDate: "2026-05-15",
      },
    },
  );
});

test("returns a missing required field error for empty required values", () => {
  assert.deepEqual(
    buildSearchRequest({
      type: "flight",
      origin: "orl",
      destination: " ",
      departDate: "2026-05-10",
    }),
    {
      ok: false,
      error: {
        code: "MISSING_REQUIRED_FIELD",
        field: "destination",
        message: "destination is required.",
        value: null,
      },
    },
  );
});

test("returns invalid date errors for malformed ISO dates", () => {
  assert.deepEqual(
    buildSearchRequest({
      type: "hotel",
      city: "las-vegas-nv-us",
      checkIn: "2026-02-30",
      checkOut: "2026-03-02",
    }),
    {
      ok: false,
      error: {
        code: "INVALID_DATE",
        field: "checkIn",
        message: "checkIn must be a valid ISO date in YYYY-MM-DD format.",
        value: "2026-02-30",
      },
    },
  );
});

test("returns invalid date range errors for inverted ranges", () => {
  assert.deepEqual(
    buildSearchRequest({
      type: "car",
      airport: "lax",
      pickupDate: "2026-05-10",
      dropoffDate: "2026-05-09",
    }),
    {
      ok: false,
      error: {
        code: "INVALID_DATE_RANGE",
        field: "dropoffDate",
        message: "dropoffDate must be on or after pickupDate.",
        value: "2026-05-09",
      },
    },
  );
});

test("returns invalid search type errors for unsupported search types", () => {
  assert.deepEqual(
    buildSearchRequest({
      type: "cruise",
      airport: "lax",
    }),
    {
      ok: false,
      error: {
        code: "INVALID_SEARCH_TYPE",
        field: "type",
        message: "type must be one of flight, hotel, or car.",
        value: "cruise",
      },
    },
  );
});
