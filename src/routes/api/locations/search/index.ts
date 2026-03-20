import type { RequestHandler } from "@builder.io/qwik-city";
import { sendApiServerError, sendJson } from "~/lib/server/api-response";
import {
  discoverLocationsInDb,
  searchLocationsInDb,
} from "~/lib/location/location-repo.server";

export const onGet: RequestHandler = async ({ headers, send, url }) => {
  try {
    const query = String(url.searchParams.get("q") || "").trim();
    const discover =
      String(url.searchParams.get("discover") || "").trim() === "1";
    const rawLimit = Number.parseInt(
      String(url.searchParams.get("limit") || ""),
      10,
    );
    const limit =
      Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 12) : 8;
    const rawLatitude = Number.parseFloat(
      String(url.searchParams.get("latitude") || ""),
    );
    const rawLongitude = Number.parseFloat(
      String(url.searchParams.get("longitude") || ""),
    );
    const latitude = Number.isFinite(rawLatitude) ? rawLatitude : null;
    const longitude = Number.isFinite(rawLongitude) ? rawLongitude : null;

    if (discover) {
      const locations = await discoverLocationsInDb({
        limit,
        latitude,
        longitude,
      });
      sendJson(headers, send, 200, { locations }, { cacheControl: "no-store" });
      return;
    }

    if (query.length < 2) {
      sendJson(headers, send, 200, { locations: [] }, { cacheControl: "no-store" });
      return;
    }

    const locations = await searchLocationsInDb(query, { limit });
    sendJson(headers, send, 200, { locations }, { cacheControl: "no-store" });
  } catch (error) {
    sendApiServerError(
      headers,
      send,
      error,
      "Failed to search locations.",
      {
        label: "locations-search",
        body: { locations: [] },
        cacheControl: "no-store",
      },
    );
  }
};
