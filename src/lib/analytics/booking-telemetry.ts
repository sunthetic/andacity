const BOOKING_TELEMETRY_ENDPOINT = "/api/analytics/events";
const BOOKING_TELEMETRY_DOM_EVENT = "andacity:booking-telemetry";
const BOOKING_TELEMETRY_QUEUE_KEY = "__andacityTelemetryQueue";
const BOOKING_STAGE_PREFIX = "andacity:booking-stage";

export const BOOKING_VERTICALS = [
  "hotels",
  "cars",
  "flights",
  "trips",
  "bundles",
] as const;

export type BookingVertical = (typeof BOOKING_VERTICALS)[number];

export const BOOKING_TELEMETRY_EVENTS = [
  "booking_search_result_opened",
  "booking_add_to_trip_started",
  "booking_add_to_trip_completed",
  "booking_bundle_decision",
  "booking_filter_toggled",
  "booking_filters_cleared",
  "booking_filter_panel_toggled",
  "booking_refresh_requested",
  "booking_refresh_completed",
  "booking_compare_toggled",
  "booking_compare_opened",
  "booking_compare_cleared",
  "booking_compare_removed",
  "booking_compare_closed",
  "booking_shortlist_toggled",
  "booking_retry_requested",
  "booking_abandonment",
  "booking_error",
  "booking_trip_action",
] as const;

export type BookingTelemetryEventName =
  (typeof BOOKING_TELEMETRY_EVENTS)[number];

type BookingTelemetryPrimitive = string | number | boolean | null;

export type BookingTelemetryPayload = Record<
  string,
  | BookingTelemetryPrimitive
  | BookingTelemetryPrimitive[]
  | undefined
>;

export type BookingTelemetryEvent = {
  name: BookingTelemetryEventName;
  occurredAt: string;
  path: string;
  payload: BookingTelemetryPayload;
};

const isTelemetryPrimitive = (
  value: unknown,
): value is BookingTelemetryPrimitive => {
  return (
    value == null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
};

const sanitizePayload = (
  payload: BookingTelemetryPayload | undefined,
): BookingTelemetryPayload => {
  const sanitized: BookingTelemetryPayload = {};

  for (const [key, rawValue] of Object.entries(payload || {})) {
    if (rawValue === undefined) continue;

    if (Array.isArray(rawValue)) {
      const nextValues = rawValue.filter(isTelemetryPrimitive);
      if (!nextValues.length) continue;
      sanitized[key] = nextValues;
      continue;
    }

    if (isTelemetryPrimitive(rawValue)) {
      sanitized[key] = rawValue;
    }
  }

  return sanitized;
};

const buildEvent = (
  name: BookingTelemetryEventName,
  payload?: BookingTelemetryPayload,
): BookingTelemetryEvent | null => {
  if (typeof window === "undefined") return null;

  return {
    name,
    occurredAt: new Date().toISOString(),
    path: `${window.location.pathname}${window.location.search}`,
    payload: sanitizePayload(payload),
  };
};

const enqueueDebugEvent = (event: BookingTelemetryEvent) => {
  const target = window as Window & {
    [BOOKING_TELEMETRY_QUEUE_KEY]?: BookingTelemetryEvent[];
    dataLayer?: unknown[];
  };

  if (!Array.isArray(target[BOOKING_TELEMETRY_QUEUE_KEY])) {
    target[BOOKING_TELEMETRY_QUEUE_KEY] = [];
  }

  target[BOOKING_TELEMETRY_QUEUE_KEY]?.push(event);
  if (Array.isArray(target.dataLayer)) {
    target.dataLayer.push({
      event: event.name,
      andacityTelemetry: event,
    });
  }
};

const postEvent = (event: BookingTelemetryEvent) => {
  const body = JSON.stringify(event);

  try {
    const beaconSent = navigator.sendBeacon?.(BOOKING_TELEMETRY_ENDPOINT, body);
    if (beaconSent) return;
  } catch {
    // Ignore beacon transport failures and fall back to fetch.
  }

  void fetch(BOOKING_TELEMETRY_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body,
    keepalive: true,
  }).catch(() => {
    // Ignore transport failures. The DOM event and debug queue still fire.
  });
};

export const trackBookingEvent = (
  name: BookingTelemetryEventName,
  payload?: BookingTelemetryPayload,
): BookingTelemetryEvent | null => {
  if (typeof window === "undefined") return null;

  const event = buildEvent(name, payload);
  if (!event) return null;

  enqueueDebugEvent(event);

  try {
    window.dispatchEvent(
      new CustomEvent(BOOKING_TELEMETRY_DOM_EVENT, {
        detail: event,
      }),
    );
  } catch {
    // Ignore DOM dispatch failures.
  }

  postEvent(event);
  return event;
};

const buildStageStorageKey = (stage: string) => {
  if (typeof window === "undefined") return "";
  return `${BOOKING_STAGE_PREFIX}:${stage}:${window.location.pathname}${window.location.search}`;
};

export const resetBookingStageProgress = (stage: string) => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(buildStageStorageKey(stage), "pending");
};

export const markBookingStageProgress = (stage: string) => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(buildStageStorageKey(stage), "completed");
};

export const clearBookingStageProgress = (stage: string) => {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(buildStageStorageKey(stage));
};

export const shouldTrackBookingStageAbandonment = (stage: string) => {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(buildStageStorageKey(stage)) === "pending";
};

