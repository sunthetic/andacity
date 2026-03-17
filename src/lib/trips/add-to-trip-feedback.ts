export const ADD_TO_TRIP_CONTEXT_QUERY_PARAM = "trip";
export const ADD_TO_TRIP_ERROR_QUERY_PARAM = "addToTripError";
export const ADD_TO_TRIP_SUCCESS_QUERY_PARAM = "addedToTrip";

export const ADD_TO_TRIP_DUPLICATE_POLICY = "ignore_existing" as const;
export type AddToTripDuplicatePolicy = typeof ADD_TO_TRIP_DUPLICATE_POLICY;

export const ADD_TO_TRIP_ERROR_CODES = [
  "invalid_entity_reference",
  "entity_unavailable",
  "revalidation_required",
  "entity_resolution_failed",
  "trip_not_found",
  "trip_creation_failed",
  "trip_persistence_unavailable",
  "persistence_failed",
] as const;

export type AddToTripErrorCode = (typeof ADD_TO_TRIP_ERROR_CODES)[number];

export type AddToTripErrorNotice = {
  code: AddToTripErrorCode;
  title: string;
  message: string;
};

export type AddToTripSuccessNotice = {
  title: string;
  message: string;
};

const isAddToTripErrorCode = (value: string): value is AddToTripErrorCode =>
  ADD_TO_TRIP_ERROR_CODES.includes(value as AddToTripErrorCode);

const toUrl = (value: string | URL) => {
  if (value instanceof URL) {
    return new URL(value.toString());
  }

  return new URL(
    value.startsWith("http://") || value.startsWith("https://")
      ? value
      : `https://andacity.test${value.startsWith("/") ? value : `/${value}`}`,
  );
};

const buildAddToTripErrorNotice = (
  code: AddToTripErrorCode,
): AddToTripErrorNotice => {
  if (code === "invalid_entity_reference") {
    return {
      code,
      title: "This entity link is no longer valid",
      message:
        "The canonical entity reference could not be reused for Add to Trip. Return to search for a fresh entity page and try again.",
    };
  }

  if (code === "entity_unavailable") {
    return {
      code,
      title: "This option is no longer available",
      message:
        "The latest inventory check marked this entity unavailable before it could be added to your trip.",
    };
  }

  if (code === "revalidation_required") {
    return {
      code,
      title: "This entity needs a fresh live match",
      message:
        "The URL no longer resolves to the exact same canonical entity. Return to search, open the latest match, and add that instead.",
    };
  }

  if (code === "entity_resolution_failed") {
    return {
      code,
      title: "Live inventory could not be checked",
      message:
        "Inventory Resolver could not complete the add-time recheck for this entity. Try again in a moment.",
    };
  }

  if (code === "trip_not_found") {
    return {
      code,
      title: "The selected trip could not be found",
      message:
        "The trip context attached to this page is no longer available. Retry Add to Trip to create a new persisted trip from this entity.",
    };
  }

  if (code === "trip_creation_failed") {
    return {
      code,
      title: "A persisted trip could not be created",
      message:
        "Andacity could not create the trip resource needed for this add flow. Try again once trip persistence is available.",
    };
  }

  if (code === "trip_persistence_unavailable") {
    return {
      code,
      title: "Trip persistence is not ready",
      message:
        "Trip storage is temporarily unavailable, so this item could not be persisted. Retry once the trip system recovers.",
    };
  }

  return {
    code,
    title: "This trip update could not be saved",
    message:
      "The canonical entity was resolved, but the trip mutation failed before the item could be persisted. Try again.",
  };
};

export const parseAddToTripContextTripId = (
  value: string | null | undefined,
) => {
  const parsed = Number.parseInt(String(value || "").trim(), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return null;
  return parsed;
};

export const buildAddToTripErrorHref = (input: {
  url: string | URL;
  code: AddToTripErrorCode;
  tripId?: number | null;
  preserveTripContext?: boolean;
}) => {
  const url = toUrl(input.url);
  url.searchParams.delete(ADD_TO_TRIP_ERROR_QUERY_PARAM);
  url.searchParams.set(ADD_TO_TRIP_ERROR_QUERY_PARAM, input.code);

  if (input.preserveTripContext !== false && input.tripId) {
    url.searchParams.set(ADD_TO_TRIP_CONTEXT_QUERY_PARAM, String(input.tripId));
  } else {
    url.searchParams.delete(ADD_TO_TRIP_CONTEXT_QUERY_PARAM);
  }

  return `${url.pathname}${url.search}`;
};

export const readAddToTripErrorNotice = (
  input: string | URL | URLSearchParams,
): AddToTripErrorNotice | null => {
  const searchParams =
    input instanceof URLSearchParams
      ? input
      : input instanceof URL
        ? input.searchParams
        : toUrl(input).searchParams;

  const rawCode = String(
    searchParams.get(ADD_TO_TRIP_ERROR_QUERY_PARAM) || "",
  ).trim();
  if (!rawCode || !isAddToTripErrorCode(rawCode)) return null;

  return buildAddToTripErrorNotice(rawCode);
};

export const buildAddToTripSuccessHref = (input: {
  tripId: number;
}) => {
  const url = new URL(`/trips/${input.tripId}`, "https://andacity.test");
  url.searchParams.set(ADD_TO_TRIP_SUCCESS_QUERY_PARAM, "1");
  return `${url.pathname}${url.search}`;
};

export const readAddToTripSuccessNotice = (
  input: string | URL | URLSearchParams,
): AddToTripSuccessNotice | null => {
  const searchParams =
    input instanceof URLSearchParams
      ? input
      : input instanceof URL
        ? input.searchParams
        : toUrl(input).searchParams;

  if (String(searchParams.get(ADD_TO_TRIP_SUCCESS_QUERY_PARAM) || "").trim() !== "1") {
    return null;
  }

  return {
    title: "Added to trip",
    message: "This item was added successfully. You can keep building the itinerary from here.",
  };
};
