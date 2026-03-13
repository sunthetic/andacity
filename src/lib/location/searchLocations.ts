import { parseLocationSelection } from "~/lib/location/validateLocationSelection";
import type { CanonicalLocation } from "~/types/location";

type SearchLocationsOptions = {
  limit?: number;
  signal?: AbortSignal;
};

type DiscoverLocationsOptions = {
  limit?: number;
  signal?: AbortSignal;
  latitude?: number;
  longitude?: number;
};

const SEARCH_LOCATIONS_ENDPOINT = "/api/locations/search";

const parseLocationsPayload = async (response: Response) => {
  if (!response.ok) {
    throw new Error(`Location search failed with status ${response.status}.`);
  }

  const payload = (await response.json().catch(() => null)) as
    | {
        locations?: unknown[];
      }
    | null;

  return Array.isArray(payload?.locations)
    ? payload.locations
        .map((location) => parseLocationSelection(location))
        .filter((location): location is CanonicalLocation => Boolean(location))
    : [];
};

export async function searchLocations(
  query: string,
  options: SearchLocationsOptions = {},
): Promise<CanonicalLocation[]> {
  const normalizedQuery = String(query || "").trim();
  if (normalizedQuery.length < 2) return [];

  const params = new URLSearchParams({
    q: normalizedQuery,
  });

  if (options.limit != null) {
    params.set("limit", String(options.limit));
  }

  const response = await fetch(`${SEARCH_LOCATIONS_ENDPOINT}?${params.toString()}`, {
    headers: {
      accept: "application/json",
    },
    cache: "no-store",
    signal: options.signal,
  });

  return parseLocationsPayload(response);
}

export async function discoverLocations(
  options: DiscoverLocationsOptions = {},
): Promise<CanonicalLocation[]> {
  const params = new URLSearchParams({
    discover: "1",
  });

  if (options.limit != null) {
    params.set("limit", String(options.limit));
  }

  if (Number.isFinite(options.latitude) && Number.isFinite(options.longitude)) {
    params.set("latitude", String(options.latitude));
    params.set("longitude", String(options.longitude));
  }

  const response = await fetch(`${SEARCH_LOCATIONS_ENDPOINT}?${params.toString()}`, {
    headers: {
      accept: "application/json",
    },
    cache: "no-store",
    signal: options.signal,
  });

  return parseLocationsPayload(response);
}
